// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Trang chạy tại https://vantupham.github.io/may-hoc-s2s/
export default defineConfig({
  site: 'https://vantupham.github.io',
  base: '/may-hoc-s2s',
  trailingSlash: 'ignore',
  integrations: [svelte()],
});
