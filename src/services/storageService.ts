import { insforge } from '../lib/insforge';

const INSFORGE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_INSFORGE_URL) ||
  'https://gci83gu5.us-east.insforge.app'
).replace(/\/+$/, '');
const BUCKET_NAME = 'images';

export interface StorageUploadResult {
  url: string;
  key: string;
  bucket: string;
}

/**
 * Uploads an image file to InsForge storage.
 * Prioritizes server proxy route to bypass browser RLS/credential constraints,
 * with graceful direct SDK fallback.
 */
export async function uploadImage(file: File): Promise<StorageUploadResult> {
  // Convert File to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // 1. Try server-side proxy upload (has service role admin key)
  try {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
        base64: base64Data
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return {
          url: data.url,
          key: data.key || file.name,
          bucket: data.bucket || BUCKET_NAME
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server storage upload failed, falling back to direct SDK:', serverErr);
  }

  // 2. Direct SDK upload fallback
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const uploadRes = await insforge.storage.from(BUCKET_NAME).upload(safeName, file);

  if (uploadRes.error) {
    throw new Error(uploadRes.error.message || 'Failed to upload image to InsForge storage');
  }

  const key = uploadRes.data?.key || safeName;
  const pubUrlRes = insforge.storage.from(BUCKET_NAME).getPublicUrl(key);
  const publicUrl = pubUrlRes.data?.publicUrl || uploadRes.data?.url || `${INSFORGE_URL}/api/storage/buckets/${BUCKET_NAME}/objects/${encodeURIComponent(key)}`;

  return {
    url: publicUrl,
    key,
    bucket: BUCKET_NAME
  };
}

/**
 * Resolves a storage key, relative path, or existing URL into a fully-qualified,
 * permanent InsForge storage URL with fallback support.
 */
export function getImageUrl(pathOrUrl?: string | null, fallbackUrl?: string): string {
  const defaultFallback = fallbackUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
  if (!pathOrUrl) return defaultFallback;

  const trimmed = pathOrUrl.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return defaultFallback;

  // Already a complete URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative key in bucket
  const cleanKey = trimmed.replace(/^\/+/, '');
  return `${INSFORGE_URL}/api/storage/buckets/${BUCKET_NAME}/objects/${encodeURIComponent(cleanKey)}`;
}

/**
 * Remove an image from storage
 */
export async function deleteImage(keyOrUrl: string): Promise<void> {
  try {
    let key = keyOrUrl;
    if (keyOrUrl.includes(`/api/storage/buckets/${BUCKET_NAME}/objects/`)) {
      const parts = keyOrUrl.split(`/api/storage/buckets/${BUCKET_NAME}/objects/`);
      key = decodeURIComponent(parts[1].split('?')[0]);
    }
    await insforge.storage.from(BUCKET_NAME).remove([key]);
  } catch (e) {
    console.warn('Error deleting image from storage:', e);
  }
}
