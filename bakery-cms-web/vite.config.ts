import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env['VITE_API_BASE_URL'] || 'http://localhost:3000/api/v1';

  let apiProxyTarget = 'http://localhost:3000';
  try {
    apiProxyTarget = new URL(apiBaseUrl).origin;
  } catch {
    apiProxyTarget = 'http://localhost:3000';
  }

  return {
    plugins: react() as unknown as any[],
    define: {
      // Fix "process is not defined" error in production builds
      'process.env': {},
      'process.platform': JSON.stringify(''),
      'process.version': JSON.stringify(''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@bakery-cms/common': path.resolve(__dirname, '../bakery-cms-api/packages/common/src/index.ts'),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            // Ant Design theme variables can be customized here
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        '/upload': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-antd': ['antd', '@ant-design/icons'],
            'vendor-utils': ['axios', 'zustand', 'zod', 'dayjs'],
          },
        },
      },
    },
  };
});
