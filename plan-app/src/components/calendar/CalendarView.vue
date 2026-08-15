<template>
  <section>
    <div class="cal-toolbar">
      <div class="month-nav">
        <button class="icon-btn" type="button" aria-label="上个月" @click="ui.changeMonth(-1)">
          <Icon name="chevL" :size="16" />
        </button>
        <div>
          <div class="month-title">{{ monthTitle }}</div>
          <div class="month-sub">{{ monthSub }}</div>
        </div>
        <button class="icon-btn" type="button" aria-label="下个月" @click="ui.changeMonth(1)">
          <Icon name="chevR" :size="16" />
        </button>
      </div>
      <button class="btn" type="button" @click="ui.goTodayMonth()">回到今天</button>
    </div>

    <div class="cal-grid" role="grid" aria-label="月历">
      <div v-for="w in weekHeads" :key="w" class="week-head">{{ w }}</div>
      <DayCell
        v-for="cell in cells"
        :key="cell.iso"
        :iso="cell.iso"
        :year="ui.year"
        :month="ui.month"
        :today="todayIsoStr"
        @select="onSelect"
      />
    </div>

    <SidePanel />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import DayCell from './DayCell.vue'
import SidePanel from './SidePanel.vue'
import Icon from '../common/Icon.vue'
import { useUIStore } from '../../stores/ui'
import { isoOf } from '../../utils/date'
import { lunarTextOf, ganzhiYearOf } from '../../utils/lunar'

const ui = useUIStore()
const weekHeads = ['一', '二', '三', '四', '五', '六', '日']

const today = new Date()
const todayIsoStr = isoOf(today.getFullYear(), today.getMonth() + 1, today.getDate())

// 月网格（周一起始，6 行封顶）
const cells = computed(() => {
  const y = ui.year
  const m = ui.month
  const first = new Date(y, m - 1, 1)
  const start = (first.getDay() + 6) % 7
  const dim = new Date(y, m, 0).getDate()
  const total = Math.ceil((start + dim) / 7) * 7
  const out = []
  for (let i = 0; i < total; i++) {
    const dt = new Date(y, m - 1, 1 - start + i)
    out.push({ iso: isoOf(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()) })
  }
  return out
})

const monthTitle = computed(() => ui.year + '年' + ui.month + '月')
const monthSub = computed(() => {
  const first = isoOf(ui.year, ui.month, 1)
  return '农历' + lunarTextOf(first) + ' · ' + ganzhiYearOf(first) + '年'
})

function onSelect(iso) {
  const p = iso.split('-').map(Number)
  // 点击非当月日期：先切换月份视图，再打开侧边栏（与原型一致）
  if (p[1] !== ui.month) {
    ui.year = p[0]
    ui.month = p[1]
  }
  ui.openSide(iso)
}
</script>
