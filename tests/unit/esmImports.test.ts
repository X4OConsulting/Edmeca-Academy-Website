/**
 * Vercel runs each api/*.ts with Node's ES-module loader, which needs explicit
 * file extensions and knows nothing of the "@/" alias. Vite, Vitest and
 * `vercel dev` resolve both, so a missing ".js" passes every other test and
 * then fails every function in production (ERR_MODULE_NOT_FOUND). This guards
 * the server-side code and the client modules it imports.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : path.endsWith('.ts') ? [path] : [];
});

const serverFiles = [...walk('api'), ...walk('server')];
// Client modules the server imports (AI Map scoring and report copy).
const sharedClientFiles = ['client/src/lib/aiMap.ts', 'client/src/lib/aiMapCopy.ts', 'client/src/data/aiMap.ts', 'client/src/data/executionGap.ts'];

function badImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((spec) => spec.startsWith('@/') || (spec.startsWith('.') && !/\.(js|mjs|json)$/.test(spec)));
}

describe('server code is valid Node ESM', () => {
  it.each([...serverFiles, ...sharedClientFiles])('%s uses only explicit .js relative imports', (file) => {
    expect(badImports(file)).toEqual([]);
  });
});
