// 一键启动本地静态服务：npm run start → http://localhost:5173（自动打开浏览器）
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

const configFile = fileURLToPath(new URL('../vite.config.js', import.meta.url))

try {
  const server = await createServer({
    configFile,
    server: { port: 5173, open: true }
  })
  await server.listen()
  server.printUrls()
} catch (err) {
  console.error('[拾光任务] 启动失败：', err)
  process.exit(1)
}
