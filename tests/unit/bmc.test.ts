/** The saved Business Model Canvas shape, shared by BMCTool and the tools that pre-fill from it. */
import { describe, expect, it } from 'vitest';
import { answeredOnly, readBmc, sanitizeCanvas } from '@/lib/bmc';

describe('sanitizeCanvas', () => {
  it('keeps answers under their prompts, turning bad items into blanks', () => {
    const canvas = sanitizeCanvas({ customerSegments: ['first', 7, null, 'fourth'], channels: 'not a list' });
    expect(canvas.customerSegments).toEqual(['first', '', '', 'fourth']);
    expect(canvas.channels).toEqual([]);
    expect(Object.keys(canvas)).toHaveLength(9);
  });

  it('accepts anything without throwing', () => {
    for (const raw of [null, undefined, 42, 'x', [], { customerSegments: [{}] }]) {
      expect(() => sanitizeCanvas(raw)).not.toThrow();
    }
  });

  it('caps very long answers and very long lists', () => {
    const canvas = sanitizeCanvas({ costStructure: Array(50).fill('y'.repeat(5000)) });
    expect(canvas.costStructure).toHaveLength(20);
    expect(canvas.costStructure[0]).toHaveLength(2000);
  });
});

describe('readBmc', () => {
  it('reads the saved shape: sections under content.canvas', () => {
    const bmc = readBmc({ companyName: 'Acme', canvas: { valuePropositions: ['', 'Fast quotes'] } });
    expect(bmc.companyName).toBe('Acme');
    expect(bmc.canvas.valuePropositions).toEqual(['Fast quotes']);
  });

  it('also reads sections at the top level', () => {
    expect(readBmc({ revenueStreams: ['Subscriptions'] }).canvas.revenueStreams).toEqual(['Subscriptions']);
  });

  it('returns an empty canvas for missing content', () => {
    expect(readBmc(null)).toEqual({ companyName: '', canvas: answeredOnly(sanitizeCanvas({})) });
  });
});
