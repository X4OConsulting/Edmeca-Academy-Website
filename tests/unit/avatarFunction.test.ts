/** /api/avatar: only real images, a size cap, and old photos cleaned up (never someone else's). */
import { describe, expect, it, beforeEach, vi } from 'vitest';

const OLD = 'https://abc123.public.blob.vercel-storage.com/avatars/u1/photo-old.webp';
const NEW = 'https://abc123.public.blob.vercel-storage.com/avatars/u1/photo-new.webp';

const state = vi.hoisted(() => ({ signedIn: true, image: null as string | null, limited: null as string | null }));
const queries = vi.hoisted(() => [] as { sql: string; params: unknown[] }[]);
const put = vi.hoisted(() => vi.fn());
const del = vi.hoisted(() => vi.fn());

vi.mock('../../server/auth', () => ({
  auth: { api: { getSession: async () => (state.signedIn ? { user: { id: 'u1', email: 'a@b.co', name: 'A' } } : null) } },
}));
vi.mock('../../server/rateLimit', () => ({ overLimit: async () => state.limited }));
vi.mock('../../server/db', () => ({
  query: async (sql: string, params: unknown[]) => {
    queries.push({ sql, params });
    return sql.startsWith('select image') ? [{ image: state.image }] : [];
  },
}));
vi.mock('@vercel/blob', () => ({ put, del }));

import { POST, DELETE } from '../../api/avatar';

const WEBP = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBPVP8 '].map((c) => c.charCodeAt(0))));
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

const upload = (bytes: Uint8Array, type = 'image/webp') =>
  POST(new Request('http://localhost/api/avatar', { method: 'POST', headers: { cookie: 's=1', 'content-type': type }, body: bytes }));

beforeEach(() => {
  state.signedIn = true;
  state.image = null;
  state.limited = null;
  queries.length = 0;
  put.mockReset().mockResolvedValue({ url: NEW });
  del.mockReset().mockResolvedValue(undefined);
});

describe('POST /api/avatar', () => {
  it('stores a WebP photo under the user and saves its URL', async () => {
    const res = await upload(WEBP);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ image: NEW });
    const [path, , options] = put.mock.calls[0];
    expect(path).toBe('avatars/u1/photo.webp');
    expect(options).toMatchObject({ access: 'public', contentType: 'image/webp', addRandomSuffix: true });
    expect(queries.at(-1)).toMatchObject({ params: [NEW, 'u1'] });
    expect(del).not.toHaveBeenCalled();
  });

  it('detects JPEG and PNG from their bytes', async () => {
    await upload(JPEG, 'image/jpeg');
    await upload(PNG, 'image/png');
    expect(put.mock.calls.map((c) => c[2].contentType)).toEqual(['image/jpeg', 'image/png']);
  });

  it('rejects a file that only claims to be an image', async () => {
    const res = await upload(new TextEncoder().encode('<svg onload="alert(1)"/>'), 'image/png');
    expect(res.status).toBe(415);
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects photos over 2 MB and empty bodies', async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    big.set(JPEG);
    expect((await upload(big, 'image/jpeg')).status).toBe(413);
    expect((await upload(new Uint8Array(0))).status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it('deletes the previous photo from our store', async () => {
    state.image = OLD;
    await upload(WEBP);
    expect(del).toHaveBeenCalledWith(OLD);
  });

  it('never deletes a photo that is not ours (e.g. Google)', async () => {
    state.image = 'https://lh3.googleusercontent.com/a/photo';
    await upload(WEBP);
    expect(del).not.toHaveBeenCalled();
  });

  it('still succeeds when the old photo cannot be deleted', async () => {
    state.image = OLD;
    del.mockRejectedValue(new Error('blob down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await upload(WEBP)).status).toBe(200);
  });

  it('needs a signed-in user and respects the rate limit', async () => {
    state.signedIn = false;
    expect((await upload(WEBP)).status).toBe(401);
    state.signedIn = true;
    state.limited = 'Too many photo changes.';
    expect((await upload(WEBP)).status).toBe(429);
    expect(put).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/avatar', () => {
  it('clears the photo and deletes our file', async () => {
    state.image = OLD;
    const res = await DELETE(new Request('http://localhost/api/avatar', { method: 'DELETE', headers: { cookie: 's=1' } }));
    expect(res.status).toBe(204);
    expect(queries.some((q) => q.sql.includes('image = null'))).toBe(true);
    expect(del).toHaveBeenCalledWith(OLD);
  });
});
