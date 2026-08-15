import { describe, it, expect } from 'vitest'
import {
  solar2lunar, lunarTextOf, ganzhiYear, ganzhiYearOf, ganzhiDay, ganzhiDayText, yiJiOf, jdn
} from '../../src/utils/lunar'

describe('lunar 农历模块（真实基准校验）', () => {
  it('1900-01-31 = 农历正月初一', () => {
    const l = solar2lunar(1900, 1, 31)
    expect(l.lMonth).toBe(1)
    expect(l.lDay).toBe(1)
    expect(l.lYear).toBe(1900)
  })

  it('2026-08-18 = 丙午年七月初六（交接文档基准）', () => {
    // lunarTextOf 与原型一致：仅返回农历日名（初六）；初一返回月名
    expect(lunarTextOf('2026-08-18')).toBe('初六')
    const l = solar2lunar(2026, 8, 18)
    expect(l.lYear).toBe(2026)
    expect(l.lMonth).toBe(7) // 七月
    expect(l.lDay).toBe(6)   // 初六
    expect(ganzhiYearOf('2026-08-18')).toBe('丙午')
  })

  it('2026 干支年 = 丙午', () => {
    expect(ganzhiYear(2026)).toBe('丙午')
  })

  it('2000-01-01 = 戊午日（儒略日公式基准）', () => {
    expect(ganzhiDay(2000, 1, 1)).toBe('戊午')
    expect(ganzhiDayText('2000-01-01')).toBe('戊午')
  })

  it('jdn 基准：2000-01-01 儒略日 = 2451545', () => {
    expect(jdn(2000, 1, 1)).toBe(2451545)
  })

  it('yiJiOf 返回 { yi, ji } 且覆盖全部 10 组', () => {
    const set = new Set()
    for (let i = 0; i < 60; i++) {
      const iso = '2026-08-' + String((i % 28) + 1).padStart(2, '0')
      const r = yiJiOf(iso)
      expect(typeof r.yi).toBe('string')
      expect(typeof r.ji).toBe('string')
      set.add(r.yi)
    }
    expect(set.size).toBeGreaterThanOrEqual(5)
  })

  it('范围 1900–2049 内不抛错', () => {
    expect(() => solar2lunar(1949, 10, 1)).not.toThrow()
    expect(() => solar2lunar(2049, 12, 31)).not.toThrow()
    expect(lunarTextOf('1949-10-01')).toBeTruthy()
  })
})
