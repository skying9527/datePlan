<template>
  <div class="tl-task" :class="['p-' + task.priority, { done }]" :data-id="task.id" :style="{ left: x + 'px', top: y + 'px', width: width + 'px', height: height + 'px' }">
    <div class="t-top">
      <span class="t-time">{{ timeText }}</span>
      <span class="t-ops">
        <button
          class="mini chk"
          :class="{ on: done }"
          type="button"
          :aria-label="done ? '取消完成' : '完成任务'"
          @click.stop="$emit('toggle', task.id)"
        >
          <Icon name="check" :size="10" :stroke-width="3" />
        </button>
        <button class="mini del" type="button" aria-label="删除任务" @click.stop="$emit('remove', task.id)">
          <Icon name="trash" :size="10" />
        </button>
      </span>
    </div>
    <div class="t-name">{{ task.title }}</div>
    <span class="tl-resize" title="拖动调整时长"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '../common/Icon.vue'

const props = defineProps({
  task: { type: Object, required: true },
  iso: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true }
})
defineEmits(['toggle', 'remove'])

const done = computed(() => !!(props.task.completed && props.task.completed[props.iso]))
const timeText = computed(() =>
  props.task.startTime + (props.task.endTime ? '–' + props.task.endTime : '')
)
</script>
