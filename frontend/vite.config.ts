import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/index.html',
          dest: '.', // copia para raiz do outDir
        },
      ],
    }),
  ],
  define: {
    'process.env': {},
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/widget.tsx'),
      name: 'ChatWidget',
      fileName: () => 'chat-widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
    },
  },
});
