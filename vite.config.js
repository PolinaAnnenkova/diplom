import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
   test: {
    globals: true,
    environment: 'jsdom',
    alias: {
      '@': '/src',
    },
    },
    coverage: {
      provider: 'c8', // или 'istanbul'
      reporter: ['text', 'json', 'html'], // форматы отчетов
      all: true, // проверять весь проект, включая неиспользуемые файлы
      include: ['src/**/*.{js,ts,vue}'], // какие файлы включать
      exclude: [ // какие файлы исключать
        'src/main.ts',
        'src/**/*.d.ts',
        'src/**/*.spec.{js,ts}',
        'src/**/__tests__/*'
      ],},
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@api': path.resolve(__dirname, './api')
    },
  },
})
