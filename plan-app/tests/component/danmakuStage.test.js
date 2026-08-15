import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DanmakuStage from '../../src/components/layout/DanmakuStage.vue'
import { pushDanmaku } from '../../src/composables/useDanmaku'

describe('DanmakuStage 弹幕舞台', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('订阅后收到弹幕并渲染', async () => {
    const wrapper = mount(DanmakuStage)
    pushDanmaku('太棒了！你又完成了一项！', '#2E7D5B')
    await Promise.resolve()
    const items = wrapper.findAll('.danmaku')
    expect(items.length).toBe(1)
    expect(items[0].text()).toBe('太棒了！你又完成了一项！')
    // jsdom 将 #2E7D5B 规范化为 rgb 形式
    expect(items[0].element.style.color).toBe('rgb(46, 125, 91)')
    wrapper.unmount()
  })

  it('3.2s 后自动移除弹幕', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(DanmakuStage)
      pushDanmaku('测试', '#A03028')
      await Promise.resolve()
      expect(wrapper.findAll('.danmaku')).toHaveLength(1)
      vi.advanceTimersByTime(3400)
      expect(wrapper.findAll('.danmaku')).toHaveLength(0)
      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('卸载后不再渲染（监听器清理）', async () => {
    const wrapper = mount(DanmakuStage)
    wrapper.unmount()
    pushDanmaku('不应出现', '#A03028')
    await Promise.resolve()
    expect(document.querySelectorAll('.danmaku')).toHaveLength(0)
  })
})
