/**
 * Financial Analysis on Vercel: input limits, the checks on Claude's replies,
 * and the job flow (POST starts a job that runs via waitUntil, GET collects it).
 * Claude, the session, the Neon tables and waitUntil are in-memory fakes.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';

// ── Fake Neon: just the statements the route and the rate limiter run ────────
type Job = { id: string; user_id: string; status: string; step: string | null; result: unknown; error: string | null; updated_at: string };
const jobs = new Map<string, Job>();
const usage: { name: string; user_id: string; at: number }[] = [];
vi.mock('../../server/db', () => ({
  query: async (text: string, params: unknown[] = []) => {
    const sql = text.replace(/\s+/g, ' ').trim();
    const now = new Date().toISOString();
    if (sql.startsWith('insert into public.analysis_jobs')) {
      jobs.set(params[0] as string, { id: params[0] as string, user_id: params[1] as string, status: 'queued', step: null, result: null, error: null, updated_at: now });
      return [];
    }
    if (sql.startsWith('update public.analysis_jobs')) {
      const job = jobs.get(params[0] as string);
      if (job) Object.assign(job, { status: params[1], step: (params[2] as string | null) ?? job.step, result: params[3] ? JSON.parse(params[3] as string) : null, error: params[4] ?? null, updated_at: now });
      return [];
    }
    if (sql.startsWith('select status, step, result, error, updated_at from public.analysis_jobs')) {
      const job = jobs.get(params[0] as string);
      return job && job.user_id === params[1] ? [{ ...job }] : [];
    }
    if (sql.startsWith('delete from public.analysis_jobs where id')) { jobs.delete(params[0] as string); return []; }
    if (sql.startsWith('delete from public.analysis_jobs where user_id')) return [];
    const hourAgo = Date.now() - 3600_000;
    const mine = () => usage.filter((u) => u.name === params[0] && u.user_id === params[1] && u.at > hourAgo);
    if (sql.startsWith('select count(*)::int as used')) {
      const rows = mine();
      return [{ used: rows.length, oldest: rows.length ? new Date(Math.min(...rows.map((r) => r.at))).toISOString() : null }];
    }
    if (sql.startsWith('insert into public.ai_usage')) { usage.push({ name: params[0] as string, user_id: params[1] as string, at: Date.now() }); return []; }
    if (sql.startsWith('delete from public.ai_usage')) return [];
    throw new Error(`Unexpected SQL in test: ${sql}`);
  },
}));

// The session cookie "session=token-a" is user-a, "session=token-b" user-b.
const users: Record<string, string> = { 'token-a': 'user-a', 'token-b': 'user-b' };
vi.mock('../../server/auth', () => ({
  auth: { api: { getSession: async ({ headers }: { headers: Headers }) => {
    const id = users[(headers.get('cookie') ?? '').replace('session=', '')];
    return id ? { user: { id, email: `${id}@example.com`, name: id } } : null;
  } } },
}));

// waitUntil: keep the background work so tests can wait for it.
const pending: Promise<unknown>[] = [];
vi.mock('@vercel/functions', () => ({ waitUntil: (promise: Promise<unknown>) => { pending.push(promise); } }));
const settle = async () => { await Promise.all(pending.splice(0)); };

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create }; } }));

import { AnalysisError, MAX_INPUT_CHARS, parseInput, parseStructured, runAnalysis } from '../../server/lib/financialAnalysis';
import { GET, POST } from '../../api/analyze-financials';

const reply = (text: string, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text }] });
const STRUCTURED = {
  businessName: 'Acme', period: 'FY 2026', healthScore: 72, healthGrade: 'Good', healthSummary: 'Healthy.',
  kpis: { revenue: 'R 2.4M', revenueChange: '↑ 18%', revenueChangePositive: true, grossMargin: '34%', grossMarginVsSector: '≈', grossMarginPositive: true, netMargin: '7%', netMarginVsSector: '≈', netMarginPositive: true, currentRatio: '1.3×', currentRatioNote: 'ok', currentRatioPositive: true, cashRunway: '3 mo', cashRunwayNote: 'tight', cashRunwayPositive: false, debtToEquity: '0.8×', debtToEquityNote: 'ok', debtToEquityPositive: true },
  monthlyData: [{ month: 'Jan', revenue: 100, expenses: 80 }],
  recommendations: [{ priority: 'urgent', title: 'Collect debtors', description: 'Chase invoices.' }],
  supportAreas: [], executiveSummary: 'Trading well.', keyStrengths: ['Margins'], keyRisks: ['Runway'],
};
const input = (extra: Record<string, unknown> = {}) => parseInput({ statements: 'Revenue 1000', companyName: 'Acme', analysisMode: 'deep', ...extra });

const asUser = (token?: string): Record<string, string> => (token ? { cookie: `session=${token}` } : {});
const start = async (body: unknown, token?: string) => {
  const res = await POST(new Request('http://localhost/api/analyze-financials', { method: 'POST', headers: asUser(token), body: JSON.stringify(body) }));
  return { statusCode: res.status, body: await res.text() };
};
const collect = async (jobId: string, token?: string) => {
  const res = await GET(new Request(`http://localhost/api/analyze-financials?job=${jobId}`, { headers: asUser(token) }));
  return { statusCode: res.status, body: await res.text() };
};
const quick = { statements: 'Revenue 1000', analysisMode: 'quick' };

beforeEach(() => {
  jobs.clear();
  usage.length = 0;
  pending.length = 0;
  create.mockReset();
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
    expect((await start({ statements: 'x' })).statusCode).toBe(401);
    expect((await collect('11111111-2222-4333-8444-555555555555')).statusCode).toBe(401);
  });

  it('answers 202 with a job id at once and runs the analysis after the response', async () => {
    create.mockResolvedValue(reply('## Executive Summary\nFine.'));
    const res = await start(quick, 'token-a');
    expect(res.statusCode).toBe(202);
    const { jobId } = JSON.parse(res.body);
    expect(jobs.get(jobId)).toMatchObject({ user_id: 'user-a' });
    expect(pending).toHaveLength(1);
    await settle();
    expect(jobs.get(jobId)).toMatchObject({ status: 'done' });
  });

  it('hands the result to its owner once, and to nobody else', async () => {
    create.mockResolvedValue(reply('## Executive Summary\nFine.'));
    const { jobId } = JSON.parse((await start(quick, 'token-a')).body);
    await settle();
    expect((await collect(jobId, 'token-b')).statusCode).toBe(404);
    const mine = await collect(jobId, 'token-a');
    expect(JSON.parse(mine.body)).toMatchObject({ status: 'done', result: { report: '## Executive Summary\nFine.' } });
    expect(jobs.has(jobId)).toBe(false);
    expect((await collect(jobId, 'token-a')).statusCode).toBe(404);
  });

  it('records a failed analysis with its reason', async () => {
    create.mockResolvedValue(reply('partial', 'max_tokens'));
    const { jobId } = JSON.parse((await start(quick, 'token-a')).body);
    await settle();
    expect(JSON.parse((await collect(jobId, 'token-a')).body)).toMatchObject({ status: 'error', error: expect.stringMatching(/cut off/) });
  });

  it('reports a job whose instance died, instead of polling forever', async () => {
    const jobId = '11111111-2222-4333-8444-777777777777';
    jobs.set(jobId, { id: jobId, user_id: 'user-a', status: 'running', step: 'analysing', result: null, error: null, updated_at: new Date(Date.now() - 11 * 60_000).toISOString() });
    expect(JSON.parse((await collect(jobId, 'token-a')).body)).toMatchObject({ status: 'error', error: expect.stringMatching(/stopped unexpectedly/) });
  });

  it('refuses bad input before starting a job', async () => {
    expect((await start({ statements: '   ' }, 'token-a')).statusCode).toBe(400);
    expect(jobs.size).toBe(0);
  });
});

describe('hourly limits', () => {
  it('stops a user after 10 financial analyses in an hour, with a message saying when to retry', async () => {
    create.mockResolvedValue(reply('## Executive Summary\nFine.'));
    for (let i = 0; i < 10; i++) expect((await start(quick, 'token-a')).statusCode).toBe(202);
    const blocked = await start(quick, 'token-a');
    expect(blocked.statusCode).toBe(429);
    expect(JSON.parse(blocked.body).error).toMatch(/limit of 10 financial analyses an hour.*try again in \d+ minute/);
    // Another user is unaffected.
    expect((await start(quick, 'token-b')).statusCode).toBe(202);
    await settle();
  });
});
