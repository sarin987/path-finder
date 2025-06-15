// @ts-nocheck
// This file is intentionally not type-checked to avoid issues with Vite types

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import svgr from 'vite-plugin-svgr';

// Helper to get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define environment variable types
type Env = {
  VITE_API_BASE_URL: string;
  VITE_APP_NAME: string;
  VITE_NODE_ENV: 'development' | 'production' | 'test';
  [key: string]: string; // Allow any other string keys
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory and cast to our defined type
  const env = loadEnv(mode, process.cwd(), '');

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@services': resolve(__dirname, './src/services'),
        '@utils': resolve(__dirname, './src/utils'),
        '@assets': resolve(__dirname, './src/assets'),
        '@types': resolve(__dirname, './src/types'),
      },
    },
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
        '/socket.io': {
          target: env.VITE_API_URL || 'ws://localhost:5000',
          ws: true,
        },
      },
    },
    define: {
      'process.env': {},
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            utils: ['date-fns', 'formik', 'yup', 'jwt-decode'],
          },
        },
      },
    },
  };
});
