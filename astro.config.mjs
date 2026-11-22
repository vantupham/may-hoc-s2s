// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Trang chạy tại https://vantupham.github.io/may-hoc-s2s/
export default defineConfig({
  site: 'https://vantupham.github.io',
  base: '/may-hoc-s2s',
  // URL luôn có / ở cuối: GitHub Pages phục vụ thư mục như vậy, tránh chuyển hướng 301 và URL trùng
  trailingSlash: 'always',
  integrations: [svelte()],
});
