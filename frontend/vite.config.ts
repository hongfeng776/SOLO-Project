import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteCompression from 'vite-plugin-compression';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: env.VITE_BASE || '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/api': path.resolve(__dirname, 'src/api'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/layouts': path.resolve(__dirname, 'src/layouts'),
        '@/router': path.resolve(__dirname, 'src/router'),
        '@/store': path.resolve(__dirname, 'src/store'),
        '@/styles': path.resolve(__dirname, 'src/styles'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/views': path.resolve(__dirname, 'src/views'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
      },
    },
    plugins: [
      vue(),
      viteCompression({
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false,
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;`,
          api: 'modern-compiler',
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      hmr: { overlay: true },
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (p) => p,
        },
      },
    },
    build: {
      target: 'es2015',
      sourcemap: mode !== 'production',
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            utils: ['axios', 'echarts', 'nprogress'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'element-plus', 'axios'],
    },
  };
});
