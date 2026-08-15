<template>
  <div class="day-summary">
    <h3>每日总结</h3>
    <textarea
      v-model="text"
      :placeholder="'今天过得怎么样？写点什么吧～（保存后可在「每日总结」页按周查看）'"
    ></textarea>
    <div class="summary-foot">
      <span>{{ savedHint }}</span>
      <button class="btn primary" type="button" @click="save">保存总结</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNotesStore } from '../../stores/notes'
import { pad } from '../../utils/date'

const props = defineProps({
  iso: { type: String, required: true }
})

const notes = useNotesStore()
const text = ref('')
const savedHint = ref('')

watch(
  () => props.iso,
  (iso) => {
    text.value = notes.notes[iso] || ''
    savedHint.value = ''
  },
  { immediate: true }
)

async function save() {
  await notes.save(props.iso, text.value)
  const n = new Date()
  savedHint.value = text.value.trim()
    ? '已保存 ' + pad(n.getHours()) + ':' + pad(n.getMinutes())
    : '已保存（内容为空）'
}
</script>
