import 'server-only';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

// Product photos live in a MinIO bucket on Coolify. MinIO speaks the S3 API,
// so the AWS SDK works against it with path-style URLs.

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

let client: S3Client | null = null;

function config() {
  const endpoint = env('S3_ENDPOINT');
  const accessKeyId = env('S3_ACCESS_KEY');
  const secretAccessKey = env('S3_SECRET_KEY');
  const bucket = env('S3_BUCKET');
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Photo storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY and S3_BUCKET.');
  }
  // Public base for image URLs. Defaults to the endpoint itself (path style).
  const publicUrl = (env('S3_PUBLIC_URL') ?? `${endpoint.replace(/\/$/, '')}/${bucket}`).replace(/\/$/, '');
  return { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function s3() {
  const c = config();
  client ??= new S3Client({
    endpoint: c.endpoint,
    region: env('S3_REGION') ?? 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return { client, ...c };
}

export async function uploadProductImage(productId: string, file: File) {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error('Upload a JPEG, PNG, WebP or AVIF image.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 8 MB or smaller.');

  const { client, bucket, publicUrl } = s3();
  const key = `products/${productId}/${randomUUID()}.${ext}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return { key, url: `${publicUrl}/${key}` };
}

export async function deleteStoredObject(key: string) {
  const { client, bucket } = s3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** True when S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY and S3_BUCKET are all set. */
export const storageConfigured = () => ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET'].every((n) => env(n));

/**
 * Saves a site-content photo (Contents page). Uses the S3 bucket when it is
 * configured; otherwise the file goes to backend/uploads/ and is served by the
 * /uploads route, which is enough for local use. (On a server, mount that
 * folder as a persistent volume, or set up S3.) `origin` is this backend's
 * public origin, used to build an absolute URL the storefront can load.
 */
export async function uploadContentImage(file: File, origin: string) {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error('Upload a JPEG, PNG, WebP or AVIF image.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 8 MB or smaller.');
  const name = `${randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  if (storageConfigured()) {
    const { client, bucket, publicUrl } = s3();
    const key = `content/${name}`;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: file.type, CacheControl: 'public, max-age=31536000, immutable' }));
    return `${publicUrl}/${key}`;
  }

  const { mkdir, writeFile } = await import('node:fs/promises');
  const dir = path.join(UPLOAD_DIR, 'content');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), body);
  return `${origin.replace(/\/$/, '')}/uploads/content/${name}`;
}

/** Local folder for uploads when S3 is not configured. */
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
