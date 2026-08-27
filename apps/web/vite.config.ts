import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build:{manifest:true},
  server: { port: 15173, strictPort: true },
  preview: { port: 15173, strictPort: true },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' },
});
