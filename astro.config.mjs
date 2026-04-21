// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://juliankarge.github.io',
  base: '/Schreinerei-Repo',
  vite: {
    plugins: [tailwindcss()]
  }
});