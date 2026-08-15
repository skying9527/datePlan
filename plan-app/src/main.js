// 入口：本地单机模式（《设计方案》§2/§17 阶段1）
// 流程：创建应用 → 初始化存储（探测可用性 + 迁移链 v2→v3）→ 载入数据 → 挂载 → 欢迎弹幕
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initStorage } from './storage/adapter'
import { runMigrations } from './storage/migrations'
import { useTasksStore } from './stores/tasks'
import { useNotesStore } from './stores/notes'
import { useUIStore } from './stores/ui'
import { pushDanmaku } from './composables/useDanmaku'
import { randomQuote, DANMAKU_COLORS } from './utils/quotes'
import './styles/tokens.css'
import './styles/base.css'

function showFatalError(err) {
  const dbg = document.createElement('div')
  dbg.setAttribute('role', 'alert')
  dbg.style.cssText =
    'position:fixed;left:0;right:0;top:0;z-index:9999;background:#A03028;color:#FFF8EC;padding:10px 16px;font-size:13px;line-height:1.6;font-family:serif;'
  dbg.textContent = '页面初始化出错：' + (err && err.message ? err.message : String(err))
  document.body.appendChild(dbg)
  if (window.console && console.error) console.error(err)
}

async function bootstrap() {
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia)
  app.use(router)

  await initStorage()
  await runMigrations() // 迁移链 v2→v3（备份旧 key、不覆盖 v3 数据）
  const tasks = useTasksStore(pinia)
  const notes = useNotesStore(pinia)
  const ui = useUIStore(pinia)
  await Promise.all([tasks.init(), notes.init()])
  ui.initDates()

  app.mount('#app')
  setTimeout(() => pushDanmaku(randomQuote('welcome'), DANMAKU_COLORS.welcome), 600)
}

try {
  bootstrap()
} catch (err) {
  showFatalError(err)
}
