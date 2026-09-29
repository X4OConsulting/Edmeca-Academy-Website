/**
 * Financial Analysis on Netlify: input limits, the checks on Claude's replies,
 * and the job flow between analyze-financials and its background function.
 * Claude, Supabase auth and Netlify Blobs are replaced with in-memory fakes.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { HandlerEvent } from '@netlify/functions';

const blobs = new Map<string, unknown>();
vi.mock('@netlify/blobs', () => ({
  connectLambda: vi.fn(),
  getStore: () => ({
    get: async (key: string) => blobs.get(key) ?? null,
    setJSON: async (key: string, value: unknown) => { blobs.set(key, structuredClone(value)); },
    delete: async (key: string) => { blobs.delete(key); },
  }),
}));

const users: Record<string, string> = { 'token-a': 'user-a', 'token-b': 'user-b' };
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) => (users[token]
        ? { data: { user: { id: users[token] } }, error: null }
        : { data: { user: null }, error: { message: 'invalid' } }),
    },
  }),
}));

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create }; } }));

import { AnalysisError, MAX_INPUT_CHARS, parseInput, parseStructured, runAnalysis } from '../../netlify/functions/lib/financialAnalysis';
import { handler as start } from '../../netlify/functions/analyze-financials';
import { handler as background } from '../../netlify/functions/analyze-financials-background';

const reply = (text: string, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text }] });
const STRUCTURED = {
  businessName: 'Acme', period: 'FY 2026', healthScore: 72, healthGrade: 'Good', healthSummary: 'Healthy.',
  kpis: { revenue: 'R 2.4M', revenueChange: '↑ 18%', revenueChangePositive: true, grossMargin: '34%', grossMarginVsSector: '≈', grossMarginPositive: true, netMargin: '7%', netMarginVsSector: '≈', netMarginPositive: true, currentRatio: '1.3×', currentRatioNote: 'ok', currentRatioPositive: true, cashRunway: '3 mo', cashRunwayNote: 'tight', cashRunwayPositive: false, debtToEquity: '0.8×', debtToEquityNote: 'ok', debtToEquityPositive: true },
  monthlyData: [{ month: 'Jan', revenue: 100, expenses: 80 }],
  recommendations: [{ priority: 'urgent', title: 'Collect debtors', description: 'Chase invoices.' }],
  supportAreas: [], executiveSummary: 'Trading well.', keyStrengths: ['Margins'], keyRisks: ['Runway'],
};
const input = (extra: Record<string, unknown> = {}) => parseInput({ statements: 'Revenue 1000', companyName: 'Acme', analysisMode: 'deep', ...extra });

const event = (init: Partial<HandlerEvent> & { token?: string }): HandlerEvent => ({
  httpMethod: 'POST', body: null, queryStringParameters: null, path: '/', rawUrl: '', rawQuery: '',
  isBase64Encoded: false, multiValueHeaders: {}, multiValueQueryStringParameters: null,
  ...init,
  headers: { host: 'staging--edmecaacademy.netlify.app', ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...init.headers },
});
const call = async (h: typeof start, e: HandlerEvent) => (await h(e, {} as never)) as { statusCode: number; body: string };

beforeEach(() => {
  blobs.clear();
  create.mockReset();
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

describe('parseInput', () => {
  it('refuses more than the limit with a message that says so, instead of cutting the data', () => {
    expect(() => parseInput({ statements: 'x'.repeat(MAX_INPUT_CHARS + 1) })).toThrow(/the limit is 50/);
  });

  it('refuses empty data', () => {
    expect(() => parseInput({ statements: '   ' })).toThrow(/no financial data/i);
  });
});

describe('the checks on what Claude returns', () => {
  it('sends the full input, not the first 8 000 or 12 000 characters', async () => {
    create.mockResolvedValue(reply('## Executive Summary\nFine.'));
    const statements = 'row\n'.repeat(10_000);
    await runAnalysis(input({ analysisMode: 'quick', statements }), { messages: { create } } as never);
    expect(create.mock.calls[0][0].messages[0].content).toContain(statements.trim());
  });

  it('treats a reply cut off at max_tokens as a failure, not a report', async () => {
    create.mockResolvedValue(reply('## Executive Sum', 'max_tokens'));
    await expect(runAnalysis(input({ analysisMode: 'quick' }), { messages: { create } } as never)).rejects.toThrow(/cut off/);
  });

  it('builds the dashboard from a complete deep analysis', async () => {
    create.mockResolvedValueOnce(reply('{"income": {}}')).mockResolvedValueOnce(reply('```json\n' + JSON.stringify(STRUCTURED) + '\n```'));
    const result = await runAnalysis(input(), { messages: { create } } as never);
    expect(result.structured?.healthScore).toBe(72);
    expect(result.structured?.recommendations[0].priority).toBe('medium');
    expect(result.report).toContain('72/100');
  });

  it('fails a deep analysis missing its score instead of inventing 50/100', () => {
    const { healthScore: _drop, ...partial } = STRUCTURED;
    expect(() => parseStructured(JSON.stringify(partial))).toThrow(AnalysisError);
    expect(() => parseStructured('not json at all')).toThrow(/could not be structured/);
  });
});

describe('the job flow', () => {
  it('requires a signed-in user', async () => {
    const res = await call(start, event({ body: JSON.stringify({ statements: 'x' }) }));
    expect(res.statusCode).toBe(401);
  });

  it('starts a job on the same deploy and answers 202 with its id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal('fetch', fetchMock);
    const res = await call(start, event({ token: 'token-a', body: JSON.stringify({ statements: 'Revenue 1000', analysisMode: 'quick' }) }));
    expect(res.statusCode).toBe(202);
    const { jobId } = JSON.parse(res.body);
    expect(blobs.get(jobId)).toMatchObject({ userId: 'user-a', status: 'queued' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://staging--edmecaacademy.netlify.app/.netlify/functions/analyze-financials-background');
    vi.unstubAllGlobals();
  });

  it('says the service is unavailable, and forgets the job, when the background call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const res = await call(start, event({ token: 'token-a', body: JSON.stringify({ statements: 'Revenue 1000' }) }));
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body).error).toMatch(/unavailable/);
    expect(blobs.size).toBe(0);
    vi.unstubAllGlobals();
  });

  it('runs the job in the background and hands the result to its owner once', async () => {
    const jobId = '11111111-2222-4333-8444-555555555555';
    blobs.set(jobId, { userId: 'user-a', status: 'queued', createdAt: 'now' });
    create.mockResolvedValue(reply('## Executive Summary\nFine.'));
    await call(background, event({ token: 'token-a', body: JSON.stringify({ jobId, input: { statements: 'Revenue 1000', analysisMode: 'quick' } }) }));

    const other = await call(start, event({ token: 'token-b', httpMethod: 'GET', queryStringParameters: { job: jobId } }));
    expect(other.statusCode).toBe(404);

    const mine = await call(start, event({ token: 'token-a', httpMethod: 'GET', queryStringParameters: { job: jobId } }));
    expect(JSON.parse(mine.body)).toMatchObject({ status: 'done', result: { report: '## Executive Summary\nFine.' } });
    expect(blobs.has(jobId)).toBe(false);
  });

  it('records a failed analysis with its reason', async () => {
    const jobId = '11111111-2222-4333-8444-666666666666';
    blobs.set(jobId, { userId: 'user-a', status: 'queued', createdAt: 'now' });
    create.mockResolvedValue(reply('partial', 'max_tokens'));
    await call(background, event({ token: 'token-a', body: JSON.stringify({ jobId, input: { statements: 'Revenue 1000', analysisMode: 'quick' } }) }));
    expect(blobs.get(jobId)).toMatchObject({ status: 'error', error: expect.stringMatching(/cut off/) });
  });

  it('will not run another user\'s job', async () => {
    const jobId = '11111111-2222-4333-8444-777777777777';
    blobs.set(jobId, { userId: 'user-a', status: 'queued', createdAt: 'now' });
    const res = await call(background, event({ token: 'token-b', body: JSON.stringify({ jobId, input: { statements: 'x' } }) }));
    expect(res.statusCode).toBe(404);
    expect(create).not.toHaveBeenCalled();
  });
});
