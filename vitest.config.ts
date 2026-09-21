import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { exclude: ['**/node_modules/**', '**/.next/**', '**/.vercel/**'] },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
