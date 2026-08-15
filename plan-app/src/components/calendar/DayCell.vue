<template>
  <div
    class="cell"
    :class="{ other: !inMonth, today: iso === today }"
    role="gridcell"
    :aria-label="ariaLabel"
    :aria-current="iso === today ? 'date' : undefined"
    @click="$emit('select', iso)"
  >
    <div class="cell-top">
      <span class="dnum">{{ dayNum }}</span>
      <span class="lunar">{{ lunarText }}</span>
    </div>
    <div class="yj">
      <span class="yi">宜{{ yj.yi }}</span>
      <span class="ji">忌{{ yj.ji }}</span>
    </div>
    <div class="cell-tasks">
      <span
        v-for="t in shownTasks"
        :key="t.id"
        class="chip"
        :class="['p-' + t.priority, { done: !!(t.completed && t.completed[iso]) }]"
        :title="t.title"
      >{{ t.title }}</span>
      <span v-if="moreCount > 0" class="chip more">+{{ moreCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTasksStore } from '../../stores/tasks'
import { parseIso, isoOf, fmtCN } from '../../utils/date'
import { lunarTextOf, yiJiOf } from '../../utils/lunar'

const props = defineProps({
  iso: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  today: { type: String, required: true }
})
defineEmits(['select'])

const tasks = useTasksStore()

const dayNum = computed(() => parseIso(props.iso).getDate())
const inMonth = computed(() => parseIso(props.iso).getMonth() === props.month - 1)
const lunarText = computed(() => lunarTextOf(props.iso))
const yj = computed(() => yiJiOf(props.iso))
const ariaLabel = computed(() => fmtCN(props.iso))

const dayTasks = computed(() => tasks.tasksForDate(props.iso))
const shownTasks = computed(() => dayTasks.value.slice(0, 3))
const moreCount = computed(() => Math.max(0, dayTasks.value.length - 3))
</script>
