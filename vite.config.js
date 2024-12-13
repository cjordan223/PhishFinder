import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import renamePlugin from './renamePlugin';

export default defineConfig({
  plugins: [vue(), renamePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: 'index.html',
        background: 'src/background.js',
        metrics: 'metrics.html',
        'detailed-metrics': 'detailed-metrics.html'
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      }
    },
    commonjsOptions: {
      include: [
        /node_modules/,
        /@mongodb-js\/charts-embed-dom/
      ],
    }
  },
  optimizeDeps: {
    include: ['@mongodb-js/charts-embed-dom'],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      },
    }
  },
  define: {
    'process.env': process.env
  }
});