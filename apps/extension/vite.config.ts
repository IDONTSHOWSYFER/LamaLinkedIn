import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        // Keep everything the content script needs inside a single bundle so it
        // never loads a *separate* shared web-accessible chunk. Such a chunk is
        // fetched through chrome.runtime.getURL(), which resolves to
        // `chrome-extension://invalid/` (net::ERR_FAILED) the moment Chrome
        // invalidates the extension context — e.g. a silent auto-update of the
        // published extension while a LinkedIn tab stays open.
        manualChunks(id: string) {
          if (
            id.includes('/src/content/') ||
            id.includes('/src/lib/') ||
            id.includes('/src/types')
          ) {
            return 'content';
          }
          return undefined;
        },
      },
    },
  },
});
