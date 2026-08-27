import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({ plugins: [react()], build: { manifest: true }, server: { port: 15174, strictPort: true }, preview: { port: 15174, strictPort: true } });
