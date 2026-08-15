import { describe, it, expect } from 'vitest'
import { cmpTasks, tasksForDate, matchesRepeat, repeatLabel, taskMeta, anyCompleted, completedCount } from '../../src/utils/priority'

const T = (overrides) => ({
  id: 't',
  title: '任务',
  type: 'once',
  date: '2026-08-15',
  priority: 'normal',
  note: '',
  completed: {},
  ...overrides
})

describe('priority 排序', () => {
  it('紧急 > 重要 > 普通', () => {
    expect(cmpTasks(T({ priority: 'urgent' }), T({ priority: 'important' }))).toBeLessThan(0)
    expect(cmpTasks(T({ priority: 'important' }), T({ priority: 'normal' }))).toBeLessThan(0)
    expect(cmpTasks(T({ priority: 'normal' }), T({ priority: 'urgent' }))).toBeGreaterThan(0)
  })

  it('同优先级按开始时间，无时间最后', () => {
    const a = T({ startTime: '10:00' })
    const b = T({ startTime: '09:00' })
    const c = T({})
    expect(cmpTasks(a, b)).toBeGreaterThan(0)
    expect(cmpTasks(a, c)).toBeLessThan(0)
  })
})

describe('tasksForDate 派生查询', () => {
  const base = [
    T({ id: 'once1', type: 'once', date: '2026-08-15', startTime: '10:00', priority: 'normal' }),
    T({ id: 'once2', type: 'once', date: '2026-08-16', priority: 'urgent' }),
    T({ id: 'fixedOnce', type: 'fixed', mode: 'once', date: '2026-08-15', startTime: '09:00', durationMin: 60, priority: 'urgent' }),
    T({ id: 'fixedDaily', type: 'fixed', mode: 'repeat', repeat: { kind: 'daily' }, startTime: '07:30', durationMin: 30 }),
    T({ id: 'longW', type: 'long', repeat: { kind: 'weekly', days: [1, 3, 5] } }),
    T({ id: 'longDaily', type: 'long', repeat: { kind: 'daily' } })
  ]
  // 2026-08-15 是星期六（wd=6）；2026-08-17 是星期一（wd=1）

  it('once/fixed单次按 date；repeat/长期按星期', () => {
    const r15 = tasksForDate(base, '2026-08-15')
    expect(r15.map((t) => t.id).sort()).toEqual(['fixedDaily', 'fixedOnce', 'longDaily', 'once1'].sort())
    const r17 = tasksForDate(base, '2026-08-17')
    expect(r17.map((t) => t.id).sort()).toEqual(['fixedDaily', 'longDaily', 'longW'].sort())
  })

  it('结果按优先级+时间排序', () => {
    const r15 = tasksForDate(base, '2026-08-15')
    expect(r15[0].id).toBe('fixedOnce') // urgent 09:00 最前
    expect(r15[1].id).toBe('fixedDaily') // normal 07:30
    expect(r15[2].id).toBe('once1')     // normal 10:00
    expect(r15[3].id).toBe('longDaily') // normal 无时间最后
  })
})

describe('repeatLabel / taskMeta', () => {
  it('repeatLabel', () => {
    expect(repeatLabel({ kind: 'daily' })).toBe('每天')
    expect(repeatLabel({ kind: 'weekly', days: [1, 3, 5] })).toBe('每周一、三、五')
    expect(repeatLabel(null)).toBe('')
  })

  it('taskMeta 三类任务', () => {
    expect(taskMeta(T({ startTime: '09:00', endTime: '10:00' }))).toBe('09:00–10:00')
    expect(taskMeta(T({}))).toBe('全天')
    expect(taskMeta(T({ type: 'fixed', mode: 'once', date: '2026-08-15', startTime: '09:00', durationMin: 30 }))).toBe('时长 30 分钟 · 8月15日 · 09:00')
    expect(taskMeta(T({ type: 'fixed', mode: 'repeat', repeat: { kind: 'daily' }, durationMin: 30 }))).toBe('时长 30 分钟 · 每天')
    expect(taskMeta(T({ type: 'long', repeat: { kind: 'daily' } }))).toBe('每天 · 全天')
  })
})

describe('完成状态', () => {
  it('anyCompleted / completedCount', () => {
    expect(anyCompleted(T({}))).toBe(false)
    expect(anyCompleted(T({ completed: { '2026-08-15': { at: '', note: '' } } }))).toBe(true)
    expect(completedCount(T({ completed: { a: {}, b: {} } }))).toBe(2)
  })
})

describe('matchesRepeat', () => {
  it('daily / weekly', () => {
    expect(matchesRepeat({ kind: 'daily' }, 3)).toBe(true)
    expect(matchesRepeat({ kind: 'weekly', days: [1, 3] }, 1)).toBe(true)
    expect(matchesRepeat({ kind: 'weekly', days: [1, 3] }, 2)).toBe(false)
    expect(matchesRepeat(null, 1)).toBe(false)
  })
})
