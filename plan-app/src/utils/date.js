// 日期工具（《设计方案》§4.5 / 原型 1:1）
export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export const pad = (n) => (n < 10 ? '0' : '') + n

export const isoOf = (y, m, d) => y + '-' + pad(m) + '-' + pad(d)

export const todayIso = () => {
  const t = new Date()
  return isoOf(t.getFullYear(), t.getMonth() + 1, t.getDate())
}

// 解析为本地时区 Date
export const parseIso = (iso) => {
  const p = iso.split('-').map(Number)
  return new Date(p[0], p[1] - 1, p[2])
}

export const isoAdd = (iso, n) => {
  const d = parseIso(iso)
  d.setDate(d.getDate() + n)
  return isoOf(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

// "09:30" → 分钟数；空串/无效 → null
export const toMin = (hhmm) => {
  if (!hhmm) return null
  const p = hhmm.split(':').map(Number)
  if (Number.isNaN(p[0]) || Number.isNaN(p[1])) return null
  return p[0] * 60 + p[1]
}

// 分钟数 → "HH:MM"（钳制 0..1439）
export const minToHM = (min) => {
  min = Math.round(min)
  if (min < 0) min = 0
  if (min >= 1440) min = 1439
  return pad(Math.floor(min / 60)) + ':' + pad(min % 60)
}

// 任务时长（分钟）：endTime-startTime 优先，其次 durationMin，兜底 60
export const taskDur = (t) => {
  if (t.startTime && t.endTime) {
    const d = toMin(t.endTime) - toMin(t.startTime)
    if (d > 0) return d
  }
  if (t.durationMin) return t.durationMin
  return 60
}

export const byStartTime = (a, b) => {
  const ta = a.startTime || '99:99'
  const tb = b.startTime || '99:99'
  return ta < tb ? -1 : ta > tb ? 1 : 0
}

// "2026年8月15日 · 星期六"
export const fmtCN = (iso) => {
  const p = iso.split('-').map(Number)
  return p[0] + '年' + p[1] + '月' + p[2] + '日 · 星期' + WEEKDAYS[parseIso(iso).getDay()]
}

// "8月15日"
export const fmtShort = (iso) => {
  const p = iso.split('-').map(Number)
  return p[1] + '月' + p[2] + '日'
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
