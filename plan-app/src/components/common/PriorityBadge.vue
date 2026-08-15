<template>
  <span class="badge bp" :class="priority">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { PRIO_LABEL } from '../../utils/priority'

const props = defineProps({
  priority: { type: String, default: 'normal' }
})

const label = computed(() => PRIO_LABEL[props.priority] || '普通')
</script>
