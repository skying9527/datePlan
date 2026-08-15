<template>
  <div>
    <div class="day-list-title">今天任务</div>
    <ul class="day-list">
      <li v-if="!list.length" class="day-item">
        <div class="d-main">今天还没有任务，点击右上角「添加当天任务」</div>
      </li>
      <li
        v-for="t in list"
        :key="t.id"
        class="day-item"
        :class="{ done: doneOf(t) }"
      >
        <span class="p-bar" :class="t.priority"></span>
        <button
          class="mini chk"
          :class="{ on: doneOf(t) }"
          type="button"
          :aria-label="doneOf(t) ? '取消完成' : '完成任务'"
          @click="tasks.toggleDone(t.id, iso)"
        >
          <Icon name="check" :size="13" :stroke-width="3" />
        </button>
        <div class="d-main">
          <div class="d-title">{{ t.title }}</div>
          <div class="d-meta">
            <PriorityBadge :priority="t.priority" />
            <span class="badge" :class="'b-' + t.type">{{ TYPE_LABEL[t.type] }}</span>
            <span>{{ taskMeta(t) }}</span>
            <span v-if="t.note" class="faint">（{{ t.note }}）</span>
          </div>
        </div>
        <button class="mini" type="button" aria-label="编辑任务" @click="ui.openTaskModal(iso, t.id)">
          <Icon name="edit" :size="13" />
        </button>
        <button class="mini del" type="button" aria-label="删除任务" @click="askDelete(t)">
          <Icon name="trash" :size="13" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '../common/Icon.vue'
import PriorityBadge from '../common/PriorityBadge.vue'
import { useTasksStore } from '../../stores/tasks'
import { useUIStore } from '../../stores/ui'
import { TYPE_LABEL, taskMeta } from '../../utils/priority'

const props = defineProps({
  iso: { type: String, required: true }
})

const tasks = useTasksStore()
const ui = useUIStore()

const list = computed(() => tasks.tasksForDate(props.iso))

function doneOf(t) {
  return !!(t.completed && t.completed[props.iso])
}

function askDelete(t) {
  ui.openConfirm(
    '删除任务',
    '确定要删除「' + t.title + '」吗？删除后不可恢复，并会从所有日期中移除。',
    () => tasks.removeTask(t.id)
  )
}
</script>
