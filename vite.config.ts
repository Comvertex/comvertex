import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    target: 'es2019',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        notFound: fileURLToPath(new URL('./404.html', import.meta.url)),
      },
    },
  },
});
