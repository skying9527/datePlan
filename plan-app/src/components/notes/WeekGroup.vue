<template>
  <section class="week-group">
    <h3 class="week-title">{{ fmtShort(group.monday) }} – {{ fmtShort(isoAdd(group.monday, 6)) }}</h3>
    <div
      v-for="iso in group.days"
      :key="iso"
      class="note-day"
      :class="{ empty: !notes[iso] }"
      @click="go(iso)"
    >
      <span class="nd-date">{{ dateLabel(iso) }}</span>
      <span class="nd-txt">{{ notes[iso] || '（未写，点击补写）' }}</span>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { fmtShort, isoAdd, parseIso, WEEKDAYS } from '../../utils/date'

const props = defineProps({
  group: { type: Object, required: true }, // { monday, days: [iso...] }
  notes: { type: Object, required: true }
})

const router = useRouter()

function dateLabel(iso) {
  const d = parseIso(iso)
  return d.getMonth() + 1 + '月' + d.getDate() + '日 周' + WEEKDAYS[d.getDay()]
}

function go(iso) {
  router.push({ name: 'day', params: { date: iso } })
}
</script>
