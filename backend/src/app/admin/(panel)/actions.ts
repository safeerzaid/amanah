'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { toCents } from '@/lib/money';
import { categorySlug, UNCATEGORISED } from '@/lib/categories';
import { normaliseCode } from '@/lib/coupons';
import { INDIAN_STATES, parsePinPrefixes } from '@/lib/shipping';
import { specsSchema, TONES, variantsSchema } from '@/lib/products';
import { deleteStoredObject, uploadContentImage, uploadProductImage } from '@/lib/storage';
import { CONTENT } from '@/lib/content';

export type FormState = { error?: string; ok?: string } | null;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Splits "Label: value" at the first colon. */
const splitLine = (line: string): [string, string] => {
  const i = line.indexOf(':');
  return i === -1 ? [line, ''] : [line.slice(0, i), line.slice(i + 1)];
};

/** "Ring size: 5, 6, 7" per line → [{ name, options }] */
const parseVariantLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, rest] = splitLine(line);
      return { name: name.trim(), options: rest.split(',').map((o) => o.trim()).filter(Boolean) };
    });

/** "Material: 18k gold" per line → [{ label, value }] */
const parseSpecLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, rest] = splitLine(line);
      return { label: label.trim(), value: rest.trim() };
    });

const money = z.coerce.number().min(0).max(1_000_000);

const productSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name.').max(120),
    slug: z.string().trim().max(120),
    category: z.string().trim(), // '' = no category
    short: z.string().trim().min(1, 'Enter a short description.').max(300),
    description: z.string().trim().max(5000),
    price: money.positive('Enter a price above zero.'),
    salePrice: z.union([z.literal('').transform(() => null), money]).nullable(),
    tone: z.enum(TONES),
    sortOrder: z.coerce.number().int().min(-100000).max(100000),
    inStock: z.boolean(),
    featured: z.boolean(),
    isNew: z.boolean(),
    variants: variantsSchema,
    specs: specsSchema,
  })
  .refine((p) => p.salePrice == null || p.salePrice < p.price, { message: 'The sale price must be lower than the price.', path: ['salePrice'] });

export async function saveProduct(productId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? '');
  const parsed = productSchema.safeParse({
    name: get('name'),
    slug: get('slug'),
    category: get('category'),
    short: get('short'),
    description: get('description'),
    price: get('price'),
    salePrice: get('salePrice'),
    tone: get('tone'),
    sortOrder: get('sortOrder') || '0',
    inStock: formData.has('inStock'),
    featured: formData.has('featured'),
    isNew: formData.has('isNew'),
    variants: parseVariantLines(get('variants')),
    specs: parseSpecLines(get('specs')),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path[0] ? `${String(issue.path[0])}: ` : '';
    return { error: `${field}${issue.message}` };
  }

  const p = parsed.data;
  if (p.category !== UNCATEGORISED && !(await db.category.findUnique({ where: { id: p.category }, select: { id: true } }))) {
    return { error: 'category: Choose one of the categories in the list.' };
  }
  const data = {
    name: p.name,
    slug: slugify(p.slug || p.name),
    category: p.category,
    short: p.short,
    description: p.description,
    price: toCents(p.price),
    salePrice: p.salePrice == null ? null : toCents(p.salePrice),
    tone: p.tone,
    sortOrder: p.sortOrder,
    inStock: p.inStock,
    featured: p.featured,
    isNew: p.isNew,
    variants: p.variants,
    specs: p.specs,
  };
  if (!data.slug) return { error: 'slug: Use letters or numbers in the name or slug.' };

  let id = productId;
  try {
    if (id) await db.product.update({ where: { id }, data });
    else id = (await db.product.create({ data })).id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'slug: Another product already uses this slug.' };
    }
    throw err;
  }

  revalidatePath('/admin/products');
  if (!productId) redirect(`/admin/products/${id}`);
  return { ok: 'Saved.' };
}

/** Deletes a product and its uploaded photos. */
async function removeProductAndPhotos(productId: string) {
  const images = await db.productImage.findMany({ where: { productId } });
  await db.product.delete({ where: { id: productId } });
  await Promise.allSettled(images.filter((i) => i.storageKey).map((i) => deleteStoredObject(i.storageKey!)));
  for (const p of ['/admin', '/admin/products', '/admin/categories', '/admin/inventory']) revalidatePath(p);
}

/** Product page: deletes the product, then returns to the list. */
export async function deleteProduct(productId: string) {
  await requireAdmin();
  await removeProductAndPhotos(productId);
  redirect('/admin/products');
}

/** Products list: deletes a product and stays on the list (keeping its filter). */
export async function deleteProductFromList(productId: string) {
  await requireAdmin();
  await removeProductAndPhotos(productId);
}

export async function uploadImages(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: 'Choose at least one photo.' };
  const view = String(formData.get('view') ?? '').trim().slice(0, 60);

  const last = await db.productImage.findFirst({ where: { productId }, orderBy: { position: 'desc' } });
  let position = (last?.position ?? -1) + 1;
  try {
    for (const file of files) {
      const { key, url } = await uploadProductImage(productId, file);
      await db.productImage.create({ data: { productId, url, storageKey: key, view, alt: '', position: position++ } });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed.' };
  }
  revalidatePath(`/admin/products/${productId}`);
  return { ok: `${files.length} photo${files.length > 1 ? 's' : ''} uploaded.` };
}

export async function deleteImage(imageId: string) {
  await requireAdmin();
  const image = await db.productImage.delete({ where: { id: imageId } });
  if (image.storageKey) await deleteStoredObject(image.storageKey).catch((err) => console.error('[storage] Delete failed:', err));
  revalidatePath(`/admin/products/${image.productId}`);
}

/** Moves a photo to the front, making it the main image on the storefront. */
export async function makePrimaryImage(imageId: string) {
  await requireAdmin();
  const image = await db.productImage.findUniqueOrThrow({ where: { id: imageId } });
  const all = await db.productImage.findMany({ where: { productId: image.productId }, orderBy: { position: 'asc' } });
  const ordered = [image, ...all.filter((i) => i.id !== imageId)];
  await db.$transaction(ordered.map((img, position) => db.productImage.update({ where: { id: img.id }, data: { position } })));
  revalidatePath(`/admin/products/${image.productId}`);
}

export async function updateImageDetails(imageId: string, formData: FormData) {
  await requireAdmin();
  const image = await db.productImage.update({
    where: { id: imageId },
    data: { view: String(formData.get('view') ?? '').trim().slice(0, 60), alt: String(formData.get('alt') ?? '').trim().slice(0, 200) },
  });
  revalidatePath(`/admin/products/${image.productId}`);
}

const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED', 'REFUNDED'] as const;

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = z.enum(ORDER_STATUSES).parse(formData.get('status'));
  await db.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath(`/admin/orders/${orderId}`);
  for (const p of ['/admin', '/admin/orders', '/admin/shipping', '/admin/payments', '/admin/returns']) revalidatePath(p);
}

/** Inventory: flips a product between in stock and sold out. */
export async function setInStock(productId: string, inStock: boolean) {
  await requireAdmin();
  await db.product.update({ where: { id: productId }, data: { inStock } });
  for (const p of ['/admin', '/admin/inventory', '/admin/products']) revalidatePath(p);
}

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(60, 'Keep the name under 60 characters.'),
  tagline: z.string().trim().max(120),
  description: z.string().trim().max(500),
});

const contactSchema = z.object({
  contactEmail: z.union([z.literal(''), z.email('Enter a valid email address.')]),
  contactPhone: z.union([z.literal(''), z.string().regex(/^[+\d][\d\s-]{6,}$/, 'Enter a valid phone number.')]),
});

/** Settings page: saves the shop's contact email and phone. Empty clears a value. */
export async function saveContact(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = contactSchema.safeParse({
    contactEmail: String(formData.get('contactEmail') ?? '').trim().slice(0, 200),
    contactPhone: String(formData.get('contactPhone') ?? '').trim().slice(0, 30),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.$transaction(
    Object.entries(parsed.data).map(([key, value]) => db.setting.upsert({ where: { key }, create: { key, value }, update: { value } })),
  );
  revalidatePath('/admin/settings');
  return { ok: 'Saved.' };
}

/** Categories page: adds a category. Its id (used in shop URLs) is built from the name. */
export async function addCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: String(formData.get('name') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
    description: String(formData.get('description') ?? ''),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const id = categorySlug(parsed.data.name);
  if (!id) return { error: 'Use letters or numbers in the name.' };
  if (await db.category.findUnique({ where: { id }, select: { id: true } })) return { error: 'There is already a category with this name.' };

  const last = await db.category.aggregate({ _max: { sortOrder: true } });
  await db.category.create({ data: { id, ...parsed.data, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  for (const p of ['/admin/categories', '/admin/products']) revalidatePath(p);
  return { ok: `Added ${parsed.data.name}.` };
}

/** Categories page: renames a category or changes its tagline. Its id (the shop address) stays the same. */
export async function updateCategory(categoryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = categorySchema.pick({ name: true, tagline: true }).safeParse({
    name: String(formData.get('name') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const clash = await db.category.findFirst({
    where: { id: { not: categoryId }, name: { equals: parsed.data.name, mode: 'insensitive' } },
    select: { id: true },
  });
  if (clash) return { error: 'There is already a category with this name.' };

  await db.category.update({ where: { id: categoryId }, data: parsed.data });
  for (const p of ['/admin/categories', '/admin/products']) revalidatePath(p);
  return { ok: 'Saved.' };
}

/**
 * Categories page: deletes a category. If it still has products they are first moved to
 * the category chosen in "moveTo", so no product is left without a category.
 */
export async function deleteCategory(categoryId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const inUse = await db.product.count({ where: { category: categoryId } });
  if (inUse > 0) {
    const moveTo = String(formData.get('moveTo') ?? '');
    if (!moveTo || moveTo === categoryId || !(await db.category.findUnique({ where: { id: moveTo }, select: { id: true } }))) {
      return { error: 'Choose a category to move its products to.' };
    }
    await db.$transaction([
      db.product.updateMany({ where: { category: categoryId }, data: { category: moveTo } }),
      db.category.delete({ where: { id: categoryId } }),
    ]);
  } else {
    await db.category.delete({ where: { id: categoryId } }).catch(() => {});
  }
  for (const p of ['/admin/categories', '/admin/products', '/admin/inventory']) revalidatePath(p);
  return null;
}

/** Categories page (Edit): takes a product out of its category. It stays in the shop, uncategorised. */
export async function removeProductFromCategory(productId: string) {
  await requireAdmin();
  await db.product.update({ where: { id: productId }, data: { category: UNCATEGORISED } });
  for (const p of ['/admin/categories', '/admin/products', `/admin/products/${productId}`]) revalidatePath(p);
}

const optionalNumber = z.union([z.literal('').transform(() => null), z.coerce.number()]);
const couponSchema = z
  .object({
    code: z.string().regex(/^[A-Z0-9_-]{3,20}$/, 'Use 3–20 letters or numbers for the code, e.g. WELCOME10.'),
    type: z.enum(['percent', 'amount']),
    value: z.coerce.number().positive('Enter the discount.'),
    minSubtotal: optionalNumber.pipe(z.number().min(0).max(1_000_000).nullable()),
    maxUses: optionalNumber.pipe(z.number().int('Use a whole number of uses.').min(1).max(1_000_000).nullable()),
    expiresOn: z.union([z.literal('').transform(() => null), z.iso.date('Choose a valid date.')]),
  })
  .refine((c) => c.type !== 'percent' || (Number.isInteger(c.value) && c.value <= 90), {
    message: 'A percentage discount must be a whole number from 1 to 90.',
  });

/** Coupons page: creates a discount code. */
export async function addCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const parsed = couponSchema.safeParse({
    code: normaliseCode(get('code')),
    type: get('type'),
    value: get('value'),
    minSubtotal: get('minSubtotal'),
    maxUses: get('maxUses'),
    expiresOn: get('expiresOn'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const c = parsed.data;
  if (await db.coupon.findUnique({ where: { code: c.code }, select: { code: true } })) return { error: `${c.code} already exists.` };

  await db.coupon.create({
    data: {
      code: c.code,
      type: c.type,
      value: c.type === 'percent' ? c.value : toCents(c.value),
      minSubtotal: c.minSubtotal ? toCents(c.minSubtotal) : 0,
      maxUses: c.maxUses,
      // The code works until the end of the chosen day.
      expiresAt: c.expiresOn ? new Date(`${c.expiresOn}T23:59:59`) : null,
    },
  });
  revalidatePath('/admin/coupons');
  return { ok: `Added ${c.code}.` };
}

/** Coupons page: pauses or resumes a code. */
export async function setCouponActive(code: string, active: boolean) {
  await requireAdmin();
  await db.coupon.update({ where: { code }, data: { active } });
  revalidatePath('/admin/coupons');
}

/** Coupons page: deletes a code. Orders that used it keep their record of the discount. */
export async function deleteCoupon(code: string) {
  await requireAdmin();
  await db.coupon.delete({ where: { code } }).catch(() => {});
  revalidatePath('/admin/coupons');
}

const zoneSchema = z
  .object({
    name: z.string().min(1, 'Give the zone a name.').max(60),
    rate: z.coerce.number().min(0, 'The rate can’t be negative.').max(100000),
    freeAbove: z.union([z.literal(''), z.coerce.number().min(0).max(10000000)]),
    minDays: z.coerce.number().int().min(0).max(60),
    maxDays: z.coerce.number().int().min(0).max(60),
    priority: z.coerce.number().int().min(-100).max(100),
  })
  .refine((z) => z.maxDays >= z.minDays, { message: 'Max delivery days must be at least the min.' });

/** Shipping page: adds a delivery zone. */
export async function addShippingZone(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const parsed = zoneSchema.safeParse({
    name: get('name'),
    rate: get('rate') || '0',
    freeAbove: get('freeAbove'),
    minDays: get('minDays') || '0',
    maxDays: get('maxDays') || '0',
    priority: get('priority') || '0',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const z = parsed.data;
  const pinPrefixes = parsePinPrefixes(get('pinPrefixes'));
  if (pinPrefixes.some((p) => p.length > 6)) return { error: 'A PIN prefix has at most 6 digits.' };
  const states = formData.getAll('states').map(String).filter((s) => INDIAN_STATES.includes(s));

  await db.shippingZone.create({
    data: {
      name: z.name,
      rate: toCents(z.rate),
      freeAbove: z.freeAbove === '' ? null : toCents(z.freeAbove),
      pinPrefixes,
      states,
      minDays: z.minDays,
      maxDays: z.maxDays,
      priority: z.priority,
      active: formData.get('active') === 'on',
    },
  });
  revalidatePath('/admin/shipping');
  return { ok: `Added ${z.name}.` };
}

/** Shipping page: pauses or resumes a zone. */
export async function setShippingZoneActive(id: string, active: boolean) {
  await requireAdmin();
  await db.shippingZone.update({ where: { id }, data: { active } });
  revalidatePath('/admin/shipping');
}

/** Shipping page: deletes a zone. Orders keep the charge they were given. */
export async function deleteShippingZone(id: string) {
  await requireAdmin();
  await db.shippingZone.delete({ where: { id } }).catch(() => {});
  revalidatePath('/admin/shipping');
}

/** Contents page: saves one section's text and photos. Values equal to the default aren't stored. */
export async function saveContent(sectionId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const section = CONTENT.find((s) => s.id === sectionId);
  if (!section) return { error: 'Unknown section.' };

  const toSave: { key: string; value: string }[] = [];
  const toReset: string[] = [];
  for (const field of section.groups.flatMap((g) => g.fields)) {
    const raw = formData.get(field.key);
    if (raw === null) continue;
    const value = String(raw).replace(/\r\n/g, '\n').trim().slice(0, field.type === 'textarea' ? 4000 : 500);
    // A required text left blank goes back to the original wording.
    if (value === field.default || (!value && field.type !== 'image' && !field.optional)) {
      toReset.push(field.key);
      continue;
    }
    if (value && field.type === 'email' && !z.email().safeParse(value).success) return { error: `${field.label}: enter a valid email address.` };
    if (value && field.type === 'url' && !/^https?:\/\/\S+$/i.test(value)) return { error: `${field.label}: enter a full link starting with https://` };
    if (value && field.type === 'tel' && !/^[+\d][\d\s-]{6,}$/.test(value)) return { error: `${field.label}: enter a valid phone number.` };
    if (value && field.type === 'image' && !/^(https?:\/\/|\/)\S+$/i.test(value)) return { error: `${field.label}: that photo link is not valid.` };
    toSave.push({ key: field.key, value });
  }

  await db.$transaction([
    db.setting.deleteMany({ where: { key: { in: toReset } } }),
    ...toSave.map(({ key, value }) => db.setting.upsert({ where: { key }, create: { key, value }, update: { value } })),
  ]);
  for (const p of ['/admin/contents', '/admin/settings']) revalidatePath(p);
  return { ok: `${section.title} saved. Reload the shop to see the changes.` };
}

/** Contents page: uploads a photo and returns its URL; the field saves with the section. */
export async function uploadContentPhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo to upload.' };
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  try {
    return { url: await uploadContentImage(file, origin) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'The photo could not be uploaded.' };
  }
}
