'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { toCents } from '@/lib/money';
import { CATEGORIES, specsSchema, TONES, variantsSchema } from '@/lib/products';
import { deleteStoredObject, uploadProductImage } from '@/lib/storage';

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
    category: z.enum(CATEGORIES),
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

export async function deleteProduct(productId: string) {
  await requireAdmin();
  const images = await db.productImage.findMany({ where: { productId } });
  await db.product.delete({ where: { id: productId } });
  await Promise.allSettled(images.filter((i) => i.storageKey).map((i) => deleteStoredObject(i.storageKey!)));
  revalidatePath('/admin/products');
  redirect('/admin/products');
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
  revalidatePath('/admin/orders');
}
