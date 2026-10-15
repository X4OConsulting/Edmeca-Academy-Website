/**
 * /api/avatar – the signed-in user's profile photo.
 *
 *   POST   body = the image bytes (image/webp, image/jpeg or image/png, max 2 MB)
 *          -> { image } the new public URL, saved as the user's image
 *   DELETE -> removes the photo (initials are shown instead)
 *
 * The browser crops and shrinks the photo to 400x400 before uploading
 * (Profile page), so uploads are small. Files live in Vercel Blob (public
 * store "edmeca-avatars"); only the URL is stored on the user.
 */
import { del, put } from "@vercel/blob";
import { query } from "../server/db.js";
import { HttpError, json, requireUser, route } from "../server/http.js";
import { overLimit } from "../server/rateLimit.js";

const MAX_BYTES = 2 * 1024 * 1024;

/** The real image type from the file's first bytes; the declared type is not trusted. */
function sniff(bytes: Uint8Array): { type: string; ext: string } | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { type: "image/webp", ext: "webp" };
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (bytes.length > 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { type: "image/png", ext: "png" };
  return null;
}

/** Only photos we uploaded are ours to delete (a Google profile picture is not). */
const isOurBlob = (url: string | null): url is string =>
  !!url && /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/avatars\//i.test(url);

async function currentImage(userId: string): Promise<string | null> {
  const [row] = await query<{ image: string | null }>('select image from "user" where id = $1', [userId]);
  return row?.image ?? null;
}

async function removeOld(url: string | null): Promise<void> {
  if (!isOurBlob(url)) return;
  // A leftover file is harmless; never fail the user's change over it.
  await del(url).catch((error) => console.error("Old avatar not deleted:", error instanceof Error ? error.message : error));
}

const handler = route({
  async POST(request) {
    const user = await requireUser(request);
    const limited = await overLimit("avatar", user.id);
    if (limited) throw new HttpError(429, limited);

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new HttpError(413, "That photo is too large. Use one under 2 MB.");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length === 0) throw new HttpError(400, "No photo was received. Please try again.");
    if (bytes.length > MAX_BYTES) throw new HttpError(413, "That photo is too large. Use one under 2 MB.");
    const kind = sniff(bytes);
    if (!kind) throw new HttpError(415, "Use a JPG, PNG or WebP photo.");

    const previous = await currentImage(user.id);
    const blob = await put(`avatars/${user.id}/photo.${kind.ext}`, Buffer.from(bytes), {
      access: "public",
      contentType: kind.type,
      addRandomSuffix: true, // a new URL per upload, so browsers never show a cached old photo
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    await query('update "user" set image = $1, "updatedAt" = now() where id = $2', [blob.url, user.id]);
    await removeOld(previous);
    return json({ image: blob.url });
  },

  async DELETE(request) {
    const user = await requireUser(request);
    const previous = await currentImage(user.id);
    await query('update "user" set image = null, "updatedAt" = now() where id = $1', [user.id]);
    await removeOld(previous);
    return new Response(null, { status: 204 });
  },
});

export { handler as POST, handler as DELETE };
