/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Scoped to the order-tracking feature. The rest of src/ predates this
      // test setup and is not yet covered.
      include: [
        'src/lib/orderStatus.ts',
        'src/lib/orderLabels.ts',
        'src/lib/chime.ts',
        'src/hooks/useReadyAlert.ts',
        'src/components/OrderTracking.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
