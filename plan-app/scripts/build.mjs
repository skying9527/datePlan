// 构建产物：npm run build → dist/index.html（单文件，可双击打开，也可由静态服务托管）
import { build } from 'vite'
import { fileURLToPath } from 'node:url'

const configFile = fileURLToPath(new URL('../vite.config.js', import.meta.url))

try {
  await build({ configFile })
  console.log('[拾光任务] 构建完成：dist/index.html（可双击打开，也可用静态服务托管）')
} catch (err) {
  console.error('[拾光任务] 构建失败：', err)
  process.exit(1)
}
