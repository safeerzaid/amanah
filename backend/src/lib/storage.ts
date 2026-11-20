import 'server-only';
import { randomUUID } from 'node:crypto';
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
