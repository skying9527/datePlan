// 弹幕发布/订阅（《设计方案》§7.2：DanmakuStage 监听 danmaku 事件）
// 轻量事件总线：store action / 组件触发 pushDanmaku，DanmakuStage 订阅渲染
const listeners = new Set()

export function onDanmaku(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function pushDanmaku(text, color) {
  if (!text) return
  listeners.forEach((fn) => {
    try { fn(text, color) } catch (e) { /* 单条渲染失败不影响其他 */ }
  })
}
