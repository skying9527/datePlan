import { describe, it, expect } from 'vitest'
import {
  assignLanes, xOf, widthOf, yOf, barHeight, timelineHeight, snap, clampMin,
  clampDragMin, clampDragLane, clampResizeDur, HOUR_W, LANE_H, TOP, TIMELINE_W, MIN_W, MIN_DUR
} from '../../src/utils/timeline'

const T = (overrides) => ({
  id: 't1',
  title: '任务',
  type: 'once',
  date: '2026-08-15',
  startTime: '09:00',
  priority: 'normal',
  completed: {},
  ...overrides
})

describe('timeline 泳道分配算法', () => {
  it('重叠任务自动分到不同泳道', () => {
    const placed = assignLanes([
      T({ id: 'a', startTime: '09:00', endTime: '10:00' }),
      T({ id: 'b', startTime: '09:30', endTime: '10:30' })
    ])
    expect(placed[0].lane).toBe(0)
    expect(placed[1].lane).toBe(1)
    expect(placed[0].st).toBe(540)
    expect(placed[0].en).toBe(600)
  })

  it('不重叠任务共享同一泳道', () => {
    const placed = assignLanes([
      T({ id: 'a', startTime: '09:00', endTime: '10:00' }),
      T({ id: 'b', startTime: '10:30', endTime: '11:00' })
    ])
    expect(placed[0].lane).toBe(0)
    expect(placed[1].lane).toBe(0)
  })

  it('偏好 laneIdx 生效，冲突自动顺延', () => {
    const placed = assignLanes([
      T({ id: 'a', startTime: '09:00', endTime: '10:00', laneIdx: 1 }),
      T({ id: 'b', startTime: '09:30', endTime: '10:30', laneIdx: 1 })
    ])
    expect(placed[0].lane).toBe(1)
    expect(placed[1].lane).toBe(2)
  })

  it('端点相接不视为重叠（[st,en)）', () => {
    const placed = assignLanes([
      T({ id: 'a', startTime: '09:00', endTime: '10:00' }),
      T({ id: 'b', startTime: '10:00', endTime: '11:00' })
    ])
    expect(placed[0].lane).toBe(0)
    expect(placed[1].lane).toBe(0)
  })

  it('无 durationMin 时按 endTime-startTime 计算', () => {
    const placed = assignLanes([T({ startTime: '09:00', endTime: '11:30' })])
    expect(placed[0].en - placed[0].st).toBe(150)
  })
})

describe('timeline 像素映射与常量', () => {
  it('布局常量与整体放大后的设计一致（×1.25）', () => {
    expect(HOUR_W).toBe(112.5)
    expect(LANE_H).toBe(80)
    expect(TOP).toBe(45)
    expect(MIN_W).toBe(80)
    expect(MIN_DUR).toBe(15)
    expect(TIMELINE_W).toBe(2700)
  })

  it('xOf / widthOf / yOf / barHeight / timelineHeight', () => {
    expect(xOf(0)).toBe(0)
    expect(xOf(1440)).toBe(TIMELINE_W)
    expect(xOf(60)).toBe(112.5)
    expect(widthOf(60)).toBe(112.5)
    expect(widthOf(10)).toBe(MIN_W) // 最小宽度兜底
    expect(yOf(0)).toBe(48.75)
    expect(yOf(1)).toBe(128.75)
    expect(barHeight()).toBe(72.5)
    expect(timelineHeight(3)).toBe(302.5)
  })

  it('snap / clampMin 吸附 15 分钟并钳制', () => {
    expect(snap(10)).toBe(15)
    expect(snap(7)).toBe(0)
    expect(clampMin(1438)).toBe(1439)
    expect(clampMin(-10)).toBe(0)
  })
})

describe('timeline 拖拽/调整时长换算', () => {
  it('clampDragMin：dx 像素 → 吸附后的分钟', () => {
    // 90px = 60 分钟 → 15px = 10 分钟；540 + 10 = 550 → 吸附 555（09:15）
    expect(clampDragMin(540, 15)).toBe(555)
    // 540 - 66.67 = 473.33 → 吸附 round(473.33/15)*15 = 480
    expect(clampDragMin(540, -100)).toBe(480)
  })

  it('clampDragLane：dy 像素 → 泳道（钳制 0..9）', () => {
    expect(clampDragLane(0, 0)).toBe(0)
    expect(clampDragLane(0, 70)).toBe(1)
    expect(clampDragLane(9, 100)).toBe(9)
    expect(clampDragLane(1, -200)).toBe(0)
  })

  it('clampResizeDur：吸附 15 分钟、最小 15、不超 24:00', () => {
    expect(clampResizeDur(540, 60, 15)).toBe(75) // +10 → 70 → 吸附 75
    expect(clampResizeDur(540, 60, -100)).toBe(MIN_DUR)
    expect(clampResizeDur(1410, 60, 200)).toBe(30) // 23:30 起最多到 24:00 → 30 分钟
  })
})
