<template>
  <section>
    <div class="notes-toolbar">
      <div class="month-nav">
        <button class="icon-btn" type="button" aria-label="上个月" @click="ui.notesMonth(-1)">
          <Icon name="chevL" :size="16" />
        </button>
        <div class="month-title">{{ ui.notesYear }}年{{ ui.notesMonth }}月</div>
        <button class="icon-btn" type="button" aria-label="下个月" @click="ui.notesMonth(1)">
          <Icon name="chevR" :size="16" />
        </button>
      </div>
      <span class="notes-stats">{{ statsText }}</span>
    </div>

    <WeekGroup
      v-for="g in groups"
      :key="g.monday"
      :group="g"
      :notes="notes.notes"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import WeekGroup from './WeekGroup.vue'
import Icon from '../common/Icon.vue'
import { useUIStore } from '../../stores/ui'
import { useNotesStore } from '../../stores/notes'

const ui = useUIStore()
const notes = useNotesStore()

const groups = computed(() => notes.weekGroups(ui.notesYear, ui.notesMonth))

const statsText = computed(() => {
  const dim = new Date(ui.notesYear, ui.notesMonth, 0).getDate()
  const written = groups.value.reduce(
    (acc, g) => acc + g.days.filter((iso) => notes.notes[iso]).length,
    0
  )
  return '本月已写 ' + written + ' / ' + dim + ' 天'
})
</script>
