import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/game/**/*.ts'],
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
    },
  },
});
