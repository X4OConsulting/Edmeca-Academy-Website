/**
 * Prepares a chosen photo for upload: centre-crops it to a square and shrinks
 * it to 400x400, as WebP (JPEG where the browser cannot encode WebP). A phone
 * photo of several MB becomes ~30 KB before it leaves the device.
 */
export const AVATAR_SIZE = 400;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

export class AvatarImageError extends Error {}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new AvatarImageError("Choose an image file (JPG, PNG or WebP).");
  if (file.size > MAX_INPUT_BYTES) throw new AvatarImageError("That photo is over 15 MB. Choose a smaller one.");

  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await decode(file);
  } catch {
    // HEIC (iPhone) photos and damaged files end up here in most browsers.
    throw new AvatarImageError("This photo format can't be read here. Use a JPG or PNG (on iPhone, a screenshot of the photo works).");
  }

  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (!width || !height) throw new AvatarImageError("That image looks empty. Choose another photo.");
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new AvatarImageError("Your browser could not process the photo. Please try another browser.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  if ("close" in image) image.close();

  const webp = await toBlob(canvas, "image/webp", 0.85);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", 0.88);
  if (!jpeg) throw new AvatarImageError("Your browser could not process the photo. Please try another browser.");
  return jpeg;
}
