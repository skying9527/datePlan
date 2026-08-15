<template>
  <section>
    <div class="day-topbar">
      <button class="btn" type="button" @click="router.push({ name: 'calendar' })">
        <Icon name="chevL" :size="15" /> 日历
      </button>
      <div class="day-nav">
        <button class="btn" type="button" @click="shift(-1)">前一天</button>
        <button class="btn" type="button" @click="goToday">今天</button>
        <button class="btn" type="button" @click="shift(1)">后一天</button>
      </div>
      <div class="day-clock" aria-label="当前时间">{{ clock }}</div>
    </div>

    <DayHeader :iso="iso" @add="ui.openTaskModal(iso)" />
    <DayTaskList :iso="iso" />
    <LaneTimeline :iso="iso" />
    <DailyNote :iso="iso" />
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../common/Icon.vue'
import DayHeader from './DayHeader.vue'
import DayTaskList from './DayTaskList.vue'
import LaneTimeline from './LaneTimeline.vue'
import DailyNote from './DailyNote.vue'
import { useUIStore } from '../../stores/ui'
import { pushDanmaku } from '../../composables/useDanmaku'
import { randomQuote, DANMAKU_COLORS } from '../../utils/quotes'
import { todayIso, isoAdd, pad } from '../../utils/date'

const route = useRoute()
const router = useRouter()
const ui = useUIStore()

const iso = computed(() => String(route.params.date))
const now = ref(new Date())
const clock = computed(() => pad(now.value.getHours()) + ':' + pad(now.value.getMinutes()) + ':' + pad(now.value.getSeconds()))

let timer = null
onMounted(() => {
  // 实时时钟：仅在当天页激活时运行（§8.6 / §6.7）
  timer = setInterval(() => { now.value = new Date() }, 1000)
  // 进入当天页 → 查看激励弹幕
  pushDanmaku(randomQuote('view'), DANMAKU_COLORS.view)
})
onUnmounted(() => clearInterval(timer))

// 切换日期（同组件内路由参数变化）也触发查看激励
watch(iso, () => pushDanmaku(randomQuote('view'), DANMAKU_COLORS.view))

function shift(delta) {
  router.push({ name: 'day', params: { date: isoAdd(iso.value, delta) } })
}
function goToday() {
  router.push({ name: 'day', params: { date: todayIso() } })
}
</script>
