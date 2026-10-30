import { supabase } from './supabase'

/** Storage buckets for post images. Both are public-read; writes are limited
 *  by RLS to the uploader's own `<uid>/` folder (see the image_uploads migration). */
export type ImageBucket = 'covers' | 'post-images'

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')
/** Largest original we will try to process in the browser. */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024
/** Server-side bucket limit; the compressed result must fit under it. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
export const GUEST_IMAGE_CAP = 5
const MAX_EDGE: Record<ImageBucket, number> = { covers: 1600, 'post-images': 1400 }

const STORAGE_PUBLIC_PREFIX = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`

/** True for images served from this project's public Storage buckets. */
export const isOwnStorageUrl = (src: string) =>
  src.startsWith(STORAGE_PUBLIC_PREFIX + 'covers/') || src.startsWith(STORAGE_PUBLIC_PREFIX + 'post-images/')

export class ImageError extends Error {}

export const validateImage = (file: File) => {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageError('Only JPG, PNG, WebP or GIF images are supported.')
  }
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('Images must be under 10 MB.')
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))

/**
 * Downscale to `maxEdge` on the longest side and re-encode as WebP (JPEG where
 * the browser cannot encode WebP), lowering quality until it fits the bucket
 * limit. Animated GIFs are flattened to their first frame.
 */
export async function compressImage(file: File, maxEdge = 1600): Promise<Blob> {
  validateImage(file)
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImageError('That file could not be read as an image.')
  })
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('Image processing is not available in this browser.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let blob = await toBlob(canvas, 'image/webp', quality)
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob
  }
  throw new ImageError('That image is too large even after compression.')
}

const friendlyError = (message: string, isDemo: boolean) => {
  if (/row-level security|policy/i.test(message)) {
    return isDemo
      ? `Demo limit: guests can upload up to ${GUEST_IMAGE_CAP} images.`
      : 'You are not allowed to upload here.'
  }
  if (/exceeded|too large|payload/i.test(message)) return 'Image is larger than 2 MB.'
  if (/mime|type/i.test(message)) return 'That image type is not allowed.'
  return 'Upload failed. Please try again.'
}

/** Compress and upload an image into `<bucket>/<uid>/<uuid>.<ext>`; returns its public URL. */
export async function uploadImage(file: File, bucket: ImageBucket, userId: string, isDemo = false) {
  const blob = await compressImage(file, MAX_EDGE[bucket])
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
  if (error) throw new ImageError(friendlyError(error.message, isDemo))
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl, bytes: blob.size }
}

export const formatBytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
