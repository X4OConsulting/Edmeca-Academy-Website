/** The chat assistant's Groq call: a model Groq still serves, and no blank answers. */
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../server/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1', email: 'a@b.co', name: 'A' } }) } } }));
vi.mock('../../server/rateLimit', () => ({ overLimit: async () => null }));

import { POST } from '../../api/chat';

const ask = async () => {
  const res = await POST(new Request('http://localhost/api/chat', {
    method: 'POST', headers: { cookie: 'session=good' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'What should I validate first?' }] }),
  }));
  return { statusCode: res.status, body: await res.text() };
};

const groq = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body, text: async () => JSON.stringify(body) });

beforeEach(() => {
  process.env.GROQ_API_KEY = 'k';
  vi.unstubAllGlobals();
});

describe('chat', () => {
  it('asks gpt-oss-20b with low reasoning effort, not the retired llama model', async () => {
    const fetchMock = groq({ choices: [{ finish_reason: 'stop', message: { content: 'Validate demand first.' } }] });
    vi.stubGlobal('fetch', fetchMock);
    const res = await ask();
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).reply).toBe('Validate demand first.');
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.model).toBe('openai/gpt-oss-20b');
    expect(sent.reasoning_effort).toBe('low');
  });

  it('reports an empty answer instead of showing a blank reply', async () => {
    vi.stubGlobal('fetch', groq({ choices: [{ finish_reason: 'length', message: { content: '' } }] }));
    const res = await ask();
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body).error).toMatch(/could not answer/);
  });
});
