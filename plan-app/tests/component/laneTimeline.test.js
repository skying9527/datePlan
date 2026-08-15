import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LaneTimeline from '../../src/components/day/LaneTimeline.vue'
import { useTasksStore } from '../../src/stores/tasks'
import { makePinia, makeRouter } from '../helpers'

let pinia
let router
let tasks

beforeEach(() => {
  pinia = makePinia()
  router = makeRouter()
  tasks = useTasksStore()
})

function mountTimeline(iso = '2026-08-15') {
  return mount(LaneTimeline, {
    props: { iso },
    global: { plugins: [pinia, router] }
  })
}

const ISO = '2026-08-15'

describe('LaneTimeline 泳道时间线', () => {
  it('定时任务渲染为矩形框，无时间任务进入全天区', () => {
    tasks.tasks = [
      { id: 'a', title: '写周报', type: 'once', date: ISO, startTime: '09:00', endTime: '10:00', priority: 'urgent', completed: {}, version: 1 },
      { id: 'b', title: '多喝水', type: 'long', repeat: { kind: 'daily' }, priority: 'normal', completed: {}, version: 1 }
    ]
    const wrapper = mountTimeline()
    expect(wrapper.findAll('.tl-task')).toHaveLength(1)
    expect(wrapper.find('.tl-allday-item .name').text()).toBe('多喝水')
    expect(wrapper.find('.tl-now-line').exists()).toBe(true)
    // 矩形框位置/尺寸为数值（回归：宽度高度不渲染为 undefined）
    const style = wrapper.find('.tl-task').attributes('style')
    expect(style).toMatch(/width:\s*\d+(\.\d+)?px/)
    expect(style).toMatch(/height:\s*\d+(\.\d+)?px/)
    expect(style).toMatch(/left:\s*\d+(\.\d+)?px/)
    wrapper.unmount()
  })

  it('重叠任务上下分层不遮挡，完成后置灰', () => {
    tasks.tasks = [
      { id: 'a', title: '甲', type: 'once', date: ISO, startTime: '09:00', endTime: '10:00', priority: 'urgent', completed: {}, version: 1 },
      { id: 'b', title: '乙', type: 'once', date: ISO, startTime: '09:30', endTime: '10:30', priority: 'important', completed: { [ISO]: { at: '', note: '' } }, version: 1 }
    ]
    const wrapper = mountTimeline()
    const bars = wrapper.findAll('.tl-task')
    expect(bars).toHaveLength(2)
    const topOf = (w) => parseFloat(w.attributes('style').match(/top:\s*([\d.]+)px/)[1])
    const topA = topOf(bars[0])
    const topB = topOf(bars[1])
    expect(topA).not.toBe(topB) // 不同泳道
    expect(wrapper.find('.tl-task.done').exists()).toBe(true)
    wrapper.unmount()
  })

  it('无任务时显示空状态', () => {
    const wrapper = mountTimeline()
    expect(wrapper.find('.empty-tip').text()).toContain('今天还没有任务')
    wrapper.unmount()
  })

  it('主体拖拽：左右改开始时间（吸附15分钟）、endTime 平移保持时长', async () => {
    tasks.tasks = [
      { id: 'a', title: '写周报', type: 'once', date: ISO, startTime: '09:00', endTime: '10:00', priority: 'urgent', completed: {}, version: 1 }
    ]
    const wrapper = mountTimeline()
    const barEl = wrapper.find('.tl-task').element
    // 拖右 15px → +10 分钟 → 吸附 09:15
    barEl.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 115, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 115, clientY: 100 }))
    await nextTick()
    expect(tasks.tasks[0].startTime).toBe('09:15')
    expect(tasks.tasks[0].endTime).toBe('10:15')
    wrapper.unmount()
  })

  it('主体拖拽：上下换泳道（laneIdx 落库）', async () => {
    tasks.tasks = [
      { id: 'a', title: '甲', type: 'once', date: ISO, startTime: '09:00', endTime: '10:00', priority: 'urgent', completed: {}, version: 1 },
      { id: 'b', title: '乙', type: 'once', date: ISO, startTime: '09:30', endTime: '10:30', priority: 'important', completed: {}, version: 1 }
    ]
    const wrapper = mountTimeline()
    const barA = wrapper.findAll('.tl-task').find((w) => w.attributes('data-id') === 'a').element
    // 从泳道 0 往下拖 70px → 泳道 1
    barA.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 170 }))
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 100, clientY: 170 }))
    await nextTick()
    expect(tasks.tasks[0].laneIdx).toBe(1)
    wrapper.unmount()
  })

  it('右边缘把手调整时长（吸附15分钟、最小15）', async () => {
    tasks.tasks = [
      { id: 'a', title: '晨练', type: 'fixed', mode: 'once', date: ISO, startTime: '07:30', durationMin: 30, priority: 'normal', completed: {}, version: 1 }
    ]
    const wrapper = mountTimeline()
    const handle = wrapper.find('.tl-resize').element
    handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 222.5, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 222.5, clientY: 100 }))
    await nextTick()
    // +22.5px = +15 分钟 → 30+15=45
    expect(tasks.tasks[0].durationMin).toBe(45)
    expect(tasks.tasks[0].endTime).toBe('08:15')
    wrapper.unmount()
  })
})
