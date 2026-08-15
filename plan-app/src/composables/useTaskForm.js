// 任务表单状态与校验（《设计方案》§7.2 useTaskForm）
// 三类任务字段联动：once / fixed(单次|重复) / long；重复频率：每天 或 每周若干天
import { reactive } from 'vue'
import { WEEKDAYS } from '../utils/date'

// 频率按钮展示顺序：一 二 三 四 五 六 日（0=周日…6=周六）
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function useTaskForm() {
  const form = reactive({
    title: '',
    type: 'once',          // once | fixed | long
    fixedMode: 'once',     // fixed 的执行方式：once | repeat
    priority: 'normal',
    note: '',
    // once
    onceDate: '', onceStart: '', onceEnd: '',
    // fixed
    fixedDuration: '', fixedDate: '', fixedStart: '', repeatStart: '',
    // long
    longStart: '',
    // repeat
    freqAll: false,
    weekDays: [false, false, false, false, false, false, false] // 0=周日…6=周六
  })
  const error = reactive({ message: '' })

  function resetForAdd(defaultDate) {
    form.title = ''
    form.type = 'once'
    form.fixedMode = 'once'
    form.priority = 'normal'
    form.note = ''
    form.onceDate = defaultDate || ''
    form.onceStart = ''
    form.onceEnd = ''
    form.fixedDuration = ''
    form.fixedDate = defaultDate || ''
    form.fixedStart = ''
    form.repeatStart = ''
    form.longStart = ''
    form.freqAll = false
    form.weekDays.fill(false)
    error.message = ''
  }

  // 编辑预填：全字段（含重复频率）
  function prefill(task, defaultDate) {
    resetForAdd(defaultDate)
    form.title = task.title || ''
    form.note = task.note || ''
    form.type = task.type || 'once'
    form.priority = task.priority || 'normal'
    form.fixedMode = task.type === 'fixed' && task.mode ? task.mode : 'once'
    if (task.type === 'once') {
      form.onceDate = task.date || defaultDate
      form.onceStart = task.startTime || ''
      form.onceEnd = task.endTime || ''
    } else if (task.type === 'fixed') {
      form.fixedDuration = task.durationMin ? String(task.durationMin) : ''
      form.fixedDate = task.date || defaultDate
      if (task.mode === 'once') form.fixedStart = task.startTime || ''
      else form.repeatStart = task.startTime || ''
    } else {
      form.longStart = task.startTime || ''
    }
    if (task.repeat) {
      if (task.repeat.kind === 'daily') form.freqAll = true
      else task.repeat.days.forEach((d) => { if (d >= 0 && d <= 6) form.weekDays[d] = true })
    }
  }

  function readFreq() {
    if (form.freqAll) return { kind: 'daily' }
    const days = DAY_ORDER.filter((d) => form.weekDays[d])
    if (!days.length) return null
    return { kind: 'weekly', days }
  }

  function validate() {
    if (!form.title.trim()) return '请填写任务名称'
    if (form.type === 'once') {
      if (!form.onceDate) return '请选择日期'
      if (form.onceEnd && form.onceStart && form.onceEnd <= form.onceStart) return '结束时间必须晚于开始时间'
    } else if (form.type === 'fixed') {
      const dur = parseInt(form.fixedDuration, 10)
      if (!dur || dur <= 0) return '请填写每次时长（分钟）'
      if (form.fixedMode === 'once') {
        if (!form.fixedDate) return '请选择日期'
      } else {
        if (!readFreq()) return '请选择重复频率'
      }
    } else {
      if (!readFreq()) return '请选择重复频率'
    }
    return ''
  }

  // 由表单构建任务载荷（不含 id/completed/createdAt 等，由 store 补充）
  function buildPayload() {
    const p = { title: form.title.trim(), type: form.type, priority: form.priority }
    const note = form.note.trim()
    if (note) p.note = note
    if (form.type === 'once') {
      p.date = form.onceDate
      if (form.onceStart) p.startTime = form.onceStart
      if (form.onceEnd) p.endTime = form.onceEnd
    } else if (form.type === 'fixed') {
      p.durationMin = parseInt(form.fixedDuration, 10)
      p.mode = form.fixedMode
      if (form.fixedMode === 'once') {
        p.date = form.fixedDate
        if (form.fixedStart) p.startTime = form.fixedStart
      } else {
        p.repeat = readFreq()
        if (form.repeatStart) p.startTime = form.repeatStart
      }
    } else {
      p.repeat = readFreq()
      if (form.longStart) p.startTime = form.longStart
    }
    return p
  }

  return {
    form,
    error,
    DAY_ORDER,
    WEEKDAYS,
    resetForAdd,
    prefill,
    validate,
    buildPayload
  }
}
