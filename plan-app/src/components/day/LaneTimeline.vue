<template>
  <div>
    <div class="tl-title">时间线 · 拖动调整时间（左右改时间 / 上下换行）</div>

    <template v-if="all.length">
      <AllDaySection v-if="allDay.length" :iso="iso" :tasks="allDay" />

      <div v-if="timed.length" ref="scrollEl" class="tl-scroll">
        <div class="tl-canvas" :style="{ width: W + 'px', height: canvasH + 'px' }">
          <div v-for="h in 25" :key="'line' + h" class="tl-hour-line" :style="{ left: (h - 1) * HOUR_W + 'px' }"></div>
          <div
            v-for="h in hourLabels"
            :key="'lab' + h"
            class="tl-hour-lab"
            :style="{ left: h * HOUR_W + 'px' }"
          >{{ pad(h) }}:00</div>
          <div
            v-for="li in laneCount"
            :key="'lane' + li"
            class="tl-lane-row"
            :style="{ top: TOP + (li - 1) * LANE_H + 'px' }"
          ></div>
          <TimelineBar
            v-for="p in placed"
            :key="p.task.id"
            :task="p.task"
            :iso="iso"
            :x="xOf(p.st)"
            :y="yOf(p.lane)"
            :width="widthOf(p.en - p.st)"
            :height="barHeight()"
            @toggle="tasks.toggleDone($event, iso)"
            @remove="askDelete"
          />
          <div ref="nowLineEl" class="tl-now-line">
            <span>现在 --:--</span>
          </div>
        </div>
      </div>
      <EmptyTip v-else>今天没有定时任务，可在上方任务列表添加（无时间任务显示在"全天"区）</EmptyTip>
    </template>
    <EmptyTip v-else>今天还没有任务，点击右上角「添加当天任务」</EmptyTip>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import AllDaySection from './AllDaySection.vue'
import TimelineBar from './TimelineBar.vue'
import EmptyTip from '../common/EmptyTip.vue'
import { useTasksStore } from '../../stores/tasks'
import { useUIStore } from '../../stores/ui'
import { useTimelineDrag } from '../../composables/useTimelineDrag'
import {
  HOUR_W, LANE_H, TOP, TIMELINE_W, assignLanes, xOf, widthOf, yOf, barHeight, timelineHeight
} from '../../utils/timeline'
import { byStartTime, pad } from '../../utils/date'

const props = defineProps({
  iso: { type: String, required: true }
})

const tasks = useTasksStore()
const ui = useUIStore()
const scrollEl = ref(null)
const nowLineEl = ref(null)
const nowRef = ref(new Date())

const all = computed(() => tasks.tasksForDate(props.iso))
const timed = computed(() => all.value.filter((t) => t.startTime).sort(byStartTime))
const allDay = computed(() => all.value.filter((t) => !t.startTime))
const placed = computed(() => assignLanes(timed.value))
const laneCount = computed(() => (placed.value.length ? Math.max(...placed.value.map((p) => p.lane)) + 1 : 0))
const canvasH = computed(() => timelineHeight(laneCount.value))

const W = TIMELINE_W
const hourLabels = computed(() => {
  const out = []
  for (let h = 0; h < 24; h += 2) out.push(h)
  return out
})

// 当前时间红线：仅命令式更新 DOM，不触发整条时间线重渲染（§8.6）
function updateNowLine() {
  const el = nowLineEl.value
  if (!el) return
  const n = nowRef.value
  const min = n.getHours() * 60 + n.getMinutes()
  el.style.left = xOf(min) + 'px'
  const span = el.querySelector('span')
  if (span) span.textContent = '现在 ' + pad(n.getHours()) + ':' + pad(n.getMinutes())
}

// 打开时自动滚动到当前时刻（§8.6）
function scrollToNow() {
  const sc = scrollEl.value
  if (!sc) return
  const n = nowRef.value
  const min = n.getHours() * 60 + n.getMinutes()
  sc.scrollLeft = Math.max(0, xOf(min) - sc.clientWidth / 2)
}

let timer = null
onMounted(() => {
  // 每秒：更新红色"现在"竖线（仅当天页激活时运行，离开时清理）
  timer = setInterval(() => {
    nowRef.value = new Date()
    updateNowLine()
  }, 1000)
  nextTick(() => {
    updateNowLine()
    scrollToNow()
  })
})
onUnmounted(() => clearInterval(timer))

watch(() => props.iso, () => nextTick(scrollToNow))

// 拖拽状态机（moving / resizing）
useTimelineDrag(scrollEl, {
  tasks: all,
  onMove: (id, startMin, laneIdx) => tasks.moveTaskTime(id, startMin, laneIdx),
  onResize: (id, newDur) => tasks.resizeTask(id, newDur)
})

function askDelete(id) {
  const t = tasks.byId(id)
  if (!t) return
  ui.openConfirm(
    '删除任务',
    '确定要删除「' + t.title + '」吗？删除后不可恢复，并会从所有日期中移除。',
    () => tasks.removeTask(id)
  )
}
</script>
