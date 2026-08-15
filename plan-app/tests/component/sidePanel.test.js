import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SidePanel from '../../src/components/calendar/SidePanel.vue'
import { useTasksStore } from '../../src/stores/tasks'
import { useUIStore } from '../../src/stores/ui'
import { makePinia, makeRouter, task } from '../helpers'

let pinia
let router
let tasks
let ui

beforeEach(() => {
  pinia = makePinia()
  router = makeRouter()
  tasks = useTasksStore()
  ui = useUIStore()
})

describe('SidePanel 侧边栏', () => {
  it('渲染当天任务（勾选/编辑/删除按钮齐全）', async () => {
    tasks.tasks = [
      task({ id: 'a', title: '写周报', startTime: '09:00', endTime: '10:00', priority: 'urgent' })
    ]
    ui.sideIso = '2026-08-15'
    ui.sideOpen = true
    const wrapper = mount(SidePanel, { global: { plugins: [pinia, router] } })
    await nextTick()
    expect(wrapper.find('.side-item').exists()).toBe(true)
    expect(wrapper.find('.s-title').text()).toBe('写周报')
    expect(wrapper.find('.side-foot .btn').text()).toContain('查看当天详情')
  })

  it('空状态提示', async () => {
    ui.sideIso = '2026-08-15'
    ui.sideOpen = true
    const wrapper = mount(SidePanel, { global: { plugins: [pinia, router] } })
    await nextTick()
    expect(wrapper.find('.side-item .s-main').text()).toBe('这一天还没有任务')
  })

  it('勾选 = 立即完成变灰（无弹窗）', async () => {
    tasks.tasks = [
      task({ id: 'a', title: '写周报', startTime: '09:00' })
    ]
    ui.sideIso = '2026-08-15'
    ui.sideOpen = true
    const wrapper = mount(SidePanel, { global: { plugins: [pinia, router] } })
    await nextTick()

    const chk = wrapper.find('.side-item .mini.chk')
    await chk.trigger('click')
    await nextTick()

    // store 立即写入完成记录
    expect(tasks.tasks[0].completed['2026-08-15']).toBeTruthy()
    // 界面立即变灰
    expect(wrapper.find('.side-item').classes()).toContain('done')
    expect(wrapper.find('.side-item .mini.chk').classes()).toContain('on')

    // 再点取消完成 → 恢复
    await wrapper.find('.side-item .mini.chk').trigger('click')
    await nextTick()
    expect(tasks.tasks[0].completed['2026-08-15']).toBeUndefined()
    expect(wrapper.find('.side-item').classes()).not.toContain('done')
  })

  it('删除走确认弹窗', async () => {
    tasks.tasks = [task({ id: 'a', title: '要删的任务' })]
    ui.sideIso = '2026-08-15'
    ui.sideOpen = true
    const wrapper = mount(SidePanel, { global: { plugins: [pinia, router] } })
    await nextTick()
    await wrapper.find('.side-item .mini.del').trigger('click')
    expect(ui.confirm.open).toBe(true)
    expect(ui.confirm.message).toContain('要删的任务')
    // 确认删除
    ui.confirm.cb()
    await nextTick()
    expect(tasks.tasks).toHaveLength(0)
  })
})
