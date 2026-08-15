// 优先级与任务查询（《设计方案》§4.5 / §2.2 关键结论）
import { WEEKDAYS, parseIso, fmtShort } from './date'

export const PRIO_LABEL = { urgent: '紧急', important: '重要', normal: '普通' }
export const TYPE_LABEL = { once: '一次性', fixed: '固定时长', long: '长期' }
export const PRIO_RANK = { urgent: 0, important: 1, normal: 2 }

// 排序：优先级（紧急>重要>普通）→ 开始时间 → 无时间最后
export const cmpTasks = (a, b) => {
  const p = PRIO_RANK[a.priority] - PRIO_RANK[b.priority]
  if (p) return p
  const ta = a.startTime || '99:99'
  const tb = b.startTime || '99:99'
  return ta < tb ? -1 : ta > tb ? 1 : 0
}

// 重复频率匹配（wd: 0=周日…6=周六）
export const matchesRepeat = (r, wd) => {
  if (!r) return false
  if (r.kind === 'daily') return true
  if (r.kind === 'weekly') return r.days.indexOf(wd) !== -1
  return false
}

// "每天" / "每周一、三、五"（与原型 repeatLabel 一致）
export const repeatLabel = (r) => {
  if (!r) return ''
  if (r.kind === 'daily') return '每天'
  const ns = r.days.slice().sort((a, b) => a - b).map((d) => WEEKDAYS[d])
  return '每周' + ns.join('、')
}

// 任务元信息描述（与原型 taskMeta 1:1）
export const taskMeta = (t) => {
  const parts = []
  if (t.type === 'once') {
    if (t.startTime) parts.push(t.endTime ? t.startTime + '–' + t.endTime : t.startTime)
    else parts.push('全天')
  } else if (t.type === 'fixed') {
    parts.push('时长 ' + t.durationMin + ' 分钟')
    if (t.mode === 'once') {
      if (t.date) parts.push(fmtShort(t.date))
      if (t.startTime) parts.push(t.startTime)
    } else {
      parts.push(repeatLabel(t.repeat))
      if (t.startTime) parts.push(t.startTime)
    }
  } else {
    parts.push(repeatLabel(t.repeat))
    if (t.startTime) parts.push(t.startTime)
    else parts.push('全天')
  }
  return parts.join(' · ')
}

export const anyCompleted = (t) => {
  for (const k in t.completed) return true
  return false
}

export const completedCount = (t) => Object.keys(t.completed).length

// 派生查询：某天的任务（一次按 date；固定单次按 date，固定重复/长期按星期），结果按优先级+时间排序
export const tasksForDate = (tasks, iso) => {
  const wd = parseIso(iso).getDay()
  return tasks
    .filter((t) => {
      if (t.type === 'once') return t.date === iso
      if (t.type === 'fixed') {
        if (t.mode === 'once') return t.date === iso
        return matchesRepeat(t.repeat, wd)
      }
      if (t.type === 'long') return matchesRepeat(t.repeat, wd)
      return false
    })
    .sort(cmpTasks)
}
