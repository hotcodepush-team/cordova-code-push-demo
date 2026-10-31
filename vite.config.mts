import { defineConfig } from 'vite';

// Cordova copies `www/` into each platform and serves it from there, so the build needs relative URLs.
export default defineConfig({
  base: './',
  build: { emptyOutDir: true, outDir: 'www' },
});
