<template>
  <div class="day-head-card">
    <div>
      <h2>{{ fmtCN(iso) }}</h2>
      <div class="day-lunar">{{ dayLunar }}</div>
      <div class="day-progress">{{ progressText }}</div>
    </div>
    <button class="btn primary" type="button" @click="$emit('add')">
      <Icon name="plus" :size="15" /> 添加当天任务
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '../common/Icon.vue'
import { useTasksStore } from '../../stores/tasks'
import { fmtCN, todayIso } from '../../utils/date'
import { lunarTextOf, ganzhiYearOf, ganzhiDayText, yiJiOf } from '../../utils/lunar'

const props = defineProps({
  iso: { type: String, required: true }
})
defineEmits(['add'])

const tasks = useTasksStore()

const dayLunar = computed(() => {
  const yj = yiJiOf(props.iso)
  return (
    '农历' + lunarTextOf(props.iso) + ' · ' + ganzhiYearOf(props.iso) + '年 · ' +
    ganzhiDayText(props.iso) + '日 · 宜' + yj.yi + ' 忌' + yj.ji
  )
})

const progressText = computed(() => {
  const iso = props.iso
  const list = tasks.tasksForDate(iso)
  if (!list.length) return '这一天暂无任务'
  const done = list.filter((t) => t.completed && t.completed[iso]).length
  return '已完成 ' + done + ' / ' + list.length
})
</script>
