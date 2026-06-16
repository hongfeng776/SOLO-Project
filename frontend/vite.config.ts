import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [
      vue(),
      vueJsx(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
          filepath: '.eslintrc-auto-import.json'
        }
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/types/components.d.ts',
        dirs: ['src/components']
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@stores': path.resolve(__dirname, 'src/stores'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@router': path.resolve(__dirname, 'src/router'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@enums': path.resolve(__dirname, 'src/enums'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@layouts': path.resolve(__dirname, 'src/layouts')
      }
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '')
        },
        '/uploads': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@styles/variables.scss" as *;`
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
      minify: isProd ? 'esbuild' : false,
      target: 'es2018',
      cssTarget: 'chrome80',
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus') || id.includes('@element-plus')) return 'element-plus'
              if (id.includes('echarts') || id.includes('vue-echarts') || id.includes('zrender')) return 'echarts'
              if (id.includes('vue') && (id.includes('vue-router') || id.includes('pinia'))) return 'vue-vendor'
              if (id.includes('vue') && id.includes('node_modules/vue/')) return 'vue-vendor'
              if (id.includes('axios')) return 'utils'
              if (id.includes('dayjs')) return 'utils'
              if (id.includes('nprogress')) return 'utils'
              if (id.includes('pinia-plugin-persistedstate')) return 'utils'
              return 'vendor'
            }
          }
        }
      }
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      pure: isProd ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : []
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'element-plus',
        '@element-plus/icons-vue',
        'axios',
        'dayjs',
        'echarts/core',
        'echarts/renderers',
        'echarts/charts',
        'echarts/components',
        'vue-echarts',
        'nprogress',
        'pinia-plugin-persistedstate'
      ],
      exclude: []
    }
  }
})
