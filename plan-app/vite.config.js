import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 正式版配置：
// - hash 路由（file:// 与 http:// 均可）
// - base './' 相对路径，配合 vite-plugin-singlefile 产出可双击打开的单一 dist/index.html（M5）
export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2022'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js']
  }
})
