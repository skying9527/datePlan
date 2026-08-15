<template>
  <header class="app-header">
    <div class="brand">
      <span class="logo" aria-hidden="true"><Icon name="calendar" :size="20" /></span>
      <div>
        <h1>拾光任务</h1>
        <p>任务规划与记录 · 老黄历</p>
      </div>
    </div>

    <nav class="header-mid" aria-label="主导航">
      <RouterLink
        v-for="t in tabs"
        :key="t.key"
        :to="t.to"
        class="nav-tab"
        :class="{ active: isActive(t.key) }"
      >{{ t.label }}</RouterLink>
    </nav>

    <div class="header-right">
      <span class="progress-chip" aria-live="polite">{{ progressText }}</span>
      <div class="header-tools">
        <button class="tool-btn" type="button" aria-label="导出数据（JSON 备份）" title="导出数据" @click="exportData">
          <Icon name="download" :size="13" /> 导出
        </button>
        <button class="tool-btn" type="button" aria-label="导入数据（JSON 恢复）" title="导入数据" @click="fileInput?.click()">
          <Icon name="upload" :size="13" /> 导入
        </button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFile">
        <button class="btn" type="button" @click="preview">
          <Icon name="star" :size="14" /> 预览激励
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../common/Icon.vue'
import { useTasksStore } from '../../stores/tasks'
import { useNotesStore } from '../../stores/notes'
import { useUIStore } from '../../stores/ui'
import { pushDanmaku } from '../../composables/useDanmaku'
import { randomQuote, DANMAKU_COLORS } from '../../utils/quotes'
import { todayIso } from '../../utils/date'

const route = useRoute()
const tasks = useTasksStore()
const notes = useNotesStore()
const ui = useUIStore()
const fileInput = ref(null)

const tabs = computed(() => [
  { key: 'calendar', label: '日历', to: '/calendar' },
  { key: 'tasks', label: '任务清单', to: '/tasks' },
  { key: 'notes', label: '每日总结', to: '/notes' },
  { key: 'day', label: '今日详情', to: '/day/' + todayIso() }
])

function isActive(key) {
  if (key === 'day') return route.name === 'day'
  return route.name === key
}

// 今日进度（完成 / 总数）
const progressText = computed(() => {
  const iso = todayIso()
  const list = tasks.tasksForDate(iso)
  if (!list.length) return '今日暂无任务'
  const done = list.filter((t) => t.completed && t.completed[iso]).length
  return '今日已完成 ' + done + ' / ' + list.length
})

// 预览激励：连续三条弹幕（查看 → 夸赞 → 鼓励）
function preview() {
  pushDanmaku(randomQuote('view'), DANMAKU_COLORS.view)
  setTimeout(() => pushDanmaku(randomQuote('praise'), DANMAKU_COLORS.praise), 900)
  setTimeout(() => pushDanmaku(randomQuote('add'), DANMAKU_COLORS.add), 1800)
}

// ---- M5：导出 / 导入 JSON ----
function exportData() {
  const data = {
    app: 'planApp',
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    tasks: tasks.tasks,
    notes: notes.notes
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'planApp-backup-' + todayIso() + '.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function onFile(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result))
      if (!Array.isArray(data.tasks) || !data.notes || typeof data.notes !== 'object') {
        throw new Error('文件格式不正确')
      }
      const count = data.tasks.length
      const sample = data.tasks[0] ? data.tasks[0].title : ''
      ui.openConfirm(
        '导入数据',
        '将导入 ' + count + ' 条任务与 ' + Object.keys(data.notes).length +
          ' 天总结' + (sample ? '（含「' + sample + '」等）' : '') + '。\n导入将覆盖当前全部数据，且不可恢复，确定继续吗？',
        async () => {
          await tasks.replaceAll(data.tasks)
          await notes.replaceAll(data.notes)
          pushDanmaku('导入成功，数据已恢复', DANMAKU_COLORS.add)
        }
      )
    } catch (err) {
      pushDanmaku('导入失败：文件格式不正确', DANMAKU_COLORS.view)
    }
  }
  reader.readAsText(file)
}
</script>
