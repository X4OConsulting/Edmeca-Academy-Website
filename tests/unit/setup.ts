import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
  writable: true,
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
});

// jsdom has no ResizeObserver; the input-otp code field uses it.
if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom has no elementFromPoint either; input-otp calls it from a timer.
if (typeof document !== "undefined" && !document.elementFromPoint) {
  document.elementFromPoint = () => null;
}

// Suppress noisy React act() warnings in output
vi.spyOn(console, 'error').mockImplementation(() => {});
