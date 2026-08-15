<template>
  <section>
    <div class="tasks-toolbar">
      <div class="filter-group">
        <span class="f-label">状态</span>
        <button
          v-for="f in statusFilters"
          :key="f.key"
          class="f-chip"
          :class="{ on: ui.filterStatus === f.key }"
          type="button"
          @click="ui.filterStatus = f.key"
        >{{ f.label }}</button>
      </div>
      <div class="filter-group">
        <span class="f-label">类型</span>
        <button
          v-for="t in typeFilters"
          :key="t.key"
          class="f-chip"
          :class="{ on: ui.filterType === t.key }"
          type="button"
          @click="ui.filterType = t.key"
        >{{ t.label }}</button>
      </div>
      <button class="btn primary" type="button" @click="ui.openTaskModal(todayIso())">新建任务</button>
    </div>

    <ul class="task-list">
      <EmptyTip v-if="!items.length">没有符合条件的任务</EmptyTip>
      <TaskRow v-for="t in items" :key="t.id" :task="t" />
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import TaskRow from './TaskRow.vue'
import EmptyTip from '../common/EmptyTip.vue'
import { useTasksStore } from '../../stores/tasks'
import { useUIStore } from '../../stores/ui'
import { cmpTasks, anyCompleted } from '../../utils/priority'
import { todayIso } from '../../utils/date'

const tasks = useTasksStore()
const ui = useUIStore()

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '未完成' },
  { key: 'done', label: '已完成' }
]
const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'once', label: '一次性' },
  { key: 'fixed', label: '固定时长' },
  { key: 'long', label: '长期' }
]

const items = computed(() =>
  tasks.tasks
    .filter((t) => {
      if (ui.filterType !== 'all' && t.type !== ui.filterType) return false
      if (ui.filterStatus === 'todo') return !anyCompleted(t)
      if (ui.filterStatus === 'done') return anyCompleted(t)
      return true
    })
    .sort(cmpTasks)
)
</script>
