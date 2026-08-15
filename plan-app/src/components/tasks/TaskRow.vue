<template>
  <li class="t-item" :class="{ open: expanded }">
    <div class="t-row" @click="expanded = !expanded">
      <span class="p-bar" :class="task.priority"></span>
      <button
        class="mini chk"
        :class="{ on: anyCompleted(task) }"
        type="button"
        aria-label="完成任务"
        @click.stop="chkToday"
      >
        <Icon name="check" :size="13" :stroke-width="3" />
      </button>
      <div class="t-body">
        <div class="t-title" :class="{ done: anyCompleted(task) }">{{ task.title }}</div>
        <div class="t-meta">
          <span class="badge" :class="'b-' + task.type">{{ TYPE_LABEL[task.type] }}</span>
          <PriorityBadge :priority="task.priority" />
          <span>{{ taskMeta(task) }}</span>
          <span v-if="completedCount(task)" class="done-n">已完成 {{ completedCount(task) }} 天</span>
        </div>
      </div>
      <button class="mini exp" type="button" :aria-label="expanded ? '收起详情' : '展开详情'" @click.stop="expanded = !expanded">
        <Icon name="chevD" :size="13" />
      </button>
      <button class="mini" type="button" aria-label="编辑任务" @click.stop="edit">
        <Icon name="edit" :size="13" />
      </button>
      <button class="mini del" type="button" aria-label="删除任务" @click.stop="askDelete">
        <Icon name="trash" :size="13" />
      </button>
    </div>

    <div class="t-detail">
      <div class="det-note">
        <b>备注：</b>
        <template v-if="task.note">{{ task.note }}</template>
        <span v-else class="faint">无</span>
      </div>
      <div class="det-rec">
        <b>完成记录：</b>
        <span v-if="!recKeys.length" class="faint">暂无</span>
        <div v-for="k in recKeys" :key="k" class="rec">{{ recText(k) }}</div>
      </div>
    </div>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from '../common/Icon.vue'
import PriorityBadge from '../common/PriorityBadge.vue'
import { useTasksStore } from '../../stores/tasks'
import { useUIStore } from '../../stores/ui'
import { TYPE_LABEL, taskMeta, anyCompleted, completedCount } from '../../utils/priority'
import { todayIso, fmtShort, pad } from '../../utils/date'

const props = defineProps({
  task: { type: Object, required: true }
})

const tasks = useTasksStore()
const ui = useUIStore()
const expanded = ref(false)

const recKeys = computed(() => Object.keys(props.task.completed).sort())

function recText(iso) {
  const c = props.task.completed[iso]
  const at = c && c.at ? new Date(c.at) : null
  const ts = at ? pad(at.getHours()) + ':' + pad(at.getMinutes()) : ''
  return fmtShort(iso) + ' ' + ts + ' 完成' + (c && c.note ? ' · ' + c.note : '')
}

function chkToday() {
  tasks.toggleDone(props.task.id, todayIso())
}
function edit() {
  ui.openTaskModal(todayIso(), props.task.id)
}
function askDelete() {
  ui.openConfirm(
    '删除任务',
    '确定要删除「' + props.task.title + '」吗？删除后不可恢复，并会从所有日期中移除。',
    () => tasks.removeTask(props.task.id)
  )
}
</script>
