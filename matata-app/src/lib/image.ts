const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

/**
 * Downscale + re-encode a photo client-side before it's held in state or
 * uploaded. Phone cameras produce 12MP+ originals (tens of MB decoded), and
 * holding one raw in memory alongside an already-memory-heavy PWA session
 * makes it more likely Android/Chrome reclaims the page (losing all form
 * state). Shrinking it here also cuts upload size for spotty connections.
 */
export async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
