import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'client/src/pages/portal/BMCTool.tsx',
        'client/src/pages/portal/SWOTPestleTool.tsx',
        'client/src/pages/portal/ValuePropTool.tsx',
        'client/src/pages/portal/PitchBuilderTool.tsx',
        'client/src/pages/portal/ProgressTrackerTool.tsx',
        'client/src/pages/portal/FinancialAnalysisTool.tsx',
      ],
      exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
      thresholds: {
        lines: 62,
        branches: 50,
      },
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
