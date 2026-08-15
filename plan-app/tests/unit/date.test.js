import { describe, it, expect } from 'vitest'
import {
  pad, isoOf, todayIso, parseIso, isoAdd, toMin, minToHM, taskDur, byStartTime, fmtCN, fmtShort
} from '../../src/utils/date'

describe('date 工具', () => {
  it('pad / isoOf', () => {
    expect(pad(5)).toBe('05')
    expect(pad(12)).toBe('12')
    expect(isoOf(2026, 8, 15)).toBe('2026-08-15')
    expect(isoOf(2026, 12, 1)).toBe('2026-12-01')
  })

  it('todayIso 格式正确', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('parseIso 解析为本地日期', () => {
    const d = parseIso('2026-08-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(7)
    expect(d.getDate()).toBe(15)
  })

  it('isoAdd 跨月/跨年', () => {
    expect(isoAdd('2026-08-15', 1)).toBe('2026-08-16')
    expect(isoAdd('2026-08-31', 1)).toBe('2026-09-01')
    expect(isoAdd('2025-12-31', 1)).toBe('2026-01-01')
    expect(isoAdd('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('toMin / minToHM 互转与钳制', () => {
    expect(toMin('09:30')).toBe(570)
    expect(toMin(null)).toBeNull()
    expect(toMin('')).toBeNull()
    expect(minToHM(570)).toBe('09:30')
    expect(minToHM(1440)).toBe('23:59')
    expect(minToHM(-5)).toBe('00:00')
    expect(minToHM(0)).toBe('00:00')
  })

  it('taskDur：endTime-startTime 优先，其次 durationMin，兜底 60', () => {
    expect(taskDur({ startTime: '09:00', endTime: '10:00' })).toBe(60)
    expect(taskDur({ startTime: '09:00', endTime: '08:00' })).toBe(60) // 非法区间回退
    expect(taskDur({ durationMin: 30 })).toBe(30)
    expect(taskDur({})).toBe(60)
  })

  it('byStartTime：无时间排最后', () => {
    const a = { startTime: '10:00' }
    const b = { startTime: '09:00' }
    const c = {}
    expect(byStartTime(a, b)).toBeGreaterThan(0)
    expect(byStartTime(b, a)).toBeLessThan(0)
    expect(byStartTime(a, c)).toBeLessThan(0)
  })

  it('fmtCN / fmtShort', () => {
    expect(fmtCN('2026-08-15')).toBe('2026年8月15日 · 星期六')
    expect(fmtShort('2026-08-15')).toBe('8月15日')
  })
})
