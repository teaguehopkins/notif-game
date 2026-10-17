import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: './',
  plugins: [preact()],
  // Playtesting over the homelab LAN.
  server: { allowedHosts: ['dev.lan'] },
  preview: { allowedHosts: ['dev.lan'] },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
