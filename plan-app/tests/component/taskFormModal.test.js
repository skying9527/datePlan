import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import TaskFormModal from '../../src/components/common/TaskFormModal.vue'
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
  document.body.innerHTML = ''
})

function mountModal() {
  return mount(TaskFormModal, {
    attachTo: document.body,
    global: { plugins: [pinia, router] }
  })
}

// 触发保存并等待异步 store 完成
async function clickSave(wrapper) {
  await wrapper.find('.btn.primary').trigger('click')
  await flushPromises()
  await nextTick()
}

describe('TaskFormModal 新增/编辑/校验', () => {
  it('打开时预填默认日期并聚焦标题', async () => {
    const wrapper = mountModal()
    ui.openTaskModal('2026-08-15')
    await flushPromises()
    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('新增任务')
    expect(wrapper.find('.hint').text()).toContain('将添加到')
    const titleEl = wrapper.find('#fTitle').element
    expect(document.activeElement).toBe(titleEl)
    wrapper.unmount()
  })

  it('标题为空时校验报错', async () => {
    const wrapper = mountModal()
    ui.openTaskModal('2026-08-15')
    await nextTick()
    await wrapper.find('.btn.primary').trigger('click')
    expect(wrapper.find('.form-error').text()).toBe('请填写任务名称')
    expect(tasks.tasks).toHaveLength(0)
    wrapper.unmount()
  })

  it('新增一次性任务：优先级可选且保存正确（v1.3 验收点）', async () => {
    const wrapper = mountModal()
    ui.openTaskModal('2026-08-15')
    await nextTick()
    // 选择优先级：紧急
    await wrapper.findAll('.prio-btn')[0].trigger('click')
    expect(wrapper.findAll('.prio-btn')[0].classes()).toContain('on')
    await wrapper.find('#fTitle').setValue('写周报')
    await clickSave(wrapper)
    expect(tasks.tasks).toHaveLength(1)
    expect(tasks.tasks[0].title).toBe('写周报')
    expect(tasks.tasks[0].priority).toBe('urgent')
    expect(tasks.tasks[0].type).toBe('once')
    expect(tasks.tasks[0].date).toBe('2026-08-15')
    expect(ui.taskModal.open).toBe(false) // 已关闭
    wrapper.unmount()
  })

  it('一次性：结束时间不晚于开始时报错', async () => {
    const wrapper = mountModal()
    ui.openTaskModal('2026-08-15')
    await nextTick()
    await wrapper.find('#fTitle').setValue('测试')
    await wrapper.find('#fOnceStart').setValue('10:00')
    await wrapper.find('#fOnceEnd').setValue('09:00')
    await wrapper.find('.btn.primary').trigger('click')
    expect(wrapper.find('.form-error').text()).toBe('结束时间必须晚于开始时间')
    expect(tasks.tasks).toHaveLength(0)
    wrapper.unmount()
  })

  it('固定时长-重复：必须选择重复频率', async () => {
    const wrapper = mountModal()
    ui.openTaskModal('2026-08-15')
    await nextTick()
    await wrapper.findAll('.type-tab')[1].trigger('click') // 固定时长
    await wrapper.find('#fTitle').setValue('晨间锻炼')
    await wrapper.find('#fFixedDuration').setValue('30')
    // 默认 mode=once 需要日期，切到 repeat
    const radios = wrapper.findAll('input[name="fixedMode"]')
    await radios[1].setValue('repeat')
    await wrapper.find('.btn.primary').trigger('click')
    await flushPromises()
    expect(wrapper.find('.form-error').text()).toBe('请选择重复频率')
    // 选择"每天"后保存成功
    await wrapper.find('.freq-all input').setValue(true)
    await clickSave(wrapper)
    expect(tasks.tasks).toHaveLength(1)
    expect(tasks.tasks[0].type).toBe('fixed')
    expect(tasks.tasks[0].mode).toBe('repeat')
    expect(tasks.tasks[0].repeat).toEqual({ kind: 'daily' })
    expect(tasks.tasks[0].durationMin).toBe(30)
    wrapper.unmount()
  })

  it('编辑预填全字段并保留 id 与完成记录', async () => {
    tasks.tasks.push(task({
      id: 'edit-id-1',
      title: '方案讨论',
      type: 'once',
      date: '2026-08-15',
      startTime: '09:30',
      endTime: '10:30',
      priority: 'important',
      note: '备注内容',
      completed: { '2026-08-15': { at: '2026-08-15T01:00:00.000Z', note: '' } }
    }))
    const wrapper = mountModal()
    ui.openTaskModal('2026-08-15', 'edit-id-1')
    await nextTick()
    expect(wrapper.find('h2').text()).toBe('编辑任务')
    expect(wrapper.find('.hint').text()).toContain('已完成记录将保留')
    expect(wrapper.find('#fTitle').element.value).toBe('方案讨论')
    expect(wrapper.find('#fOnceDate').element.value).toBe('2026-08-15')
    expect(wrapper.find('#fOnceStart').element.value).toBe('09:30')
    expect(wrapper.find('#fOnceEnd').element.value).toBe('10:30')
    expect(wrapper.find('#fNote').element.value).toBe('备注内容')

    // 修改标题保存：id 与 completed 保留
    await wrapper.find('#fTitle').setValue('方案讨论（改）')
    await clickSave(wrapper)
    expect(tasks.tasks).toHaveLength(1)
    expect(tasks.tasks[0].id).toBe('edit-id-1')
    expect(tasks.tasks[0].title).toBe('方案讨论（改）')
    expect(tasks.tasks[0].completed['2026-08-15']).toBeTruthy()
    wrapper.unmount()
  })
})
