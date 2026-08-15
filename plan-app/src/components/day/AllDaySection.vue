<template>
  <div class="tl-allday-box">
    <div class="tl-allday-title">全天 · 无固定时间</div>
    <div class="tl-allday-items">
      <div
        v-for="t in tasks"
        :key="t.id"
        class="tl-allday-item"
        :class="['p-' + t.priority, { done: doneOf(t) }]"
        :data-id="t.id"
      >
        <span class="tag">全天</span>
        <span class="name">{{ t.title }}</span>
        <button
          class="mini chk"
          :class="{ on: doneOf(t) }"
          type="button"
          :aria-label="doneOf(t) ? '取消完成' : '完成任务'"
          @click="tasksStore.toggleDone(t.id, iso)"
        >
          <Icon name="check" :size="13" :stroke-width="3" />
        </button>
        <button class="mini del" type="button" aria-label="删除任务" @click="askDelete(t)">
          <Icon name="trash" :size="13" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Icon from '../common/Icon.vue'
import { useTasksStore } from '../../stores/tasks'
import { useUIStore } from '../../stores/ui'

const props = defineProps({
  iso: { type: String, required: true },
  tasks: { type: Array, required: true }
})

const tasksStore = useTasksStore()
const ui = useUIStore()

function doneOf(t) {
  return !!(t.completed && t.completed[props.iso])
}

function askDelete(t) {
  ui.openConfirm(
    '删除任务',
    '确定要删除「' + t.title + '」吗？删除后不可恢复，并会从所有日期中移除。',
    () => tasksStore.removeTask(t.id)
  )
}
</script>
