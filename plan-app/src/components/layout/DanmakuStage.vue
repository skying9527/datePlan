<template>
  <div class="danmaku-stage" aria-hidden="true">
    <div ref="inner" class="stage-inner"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onDanmaku } from '../../composables/useDanmaku'

const inner = ref(null)
let off = null
const timers = []

function spawn(text, color) {
  if (!inner.value || !text) return
  const el = document.createElement('div')
  el.className = 'danmaku'
  el.style.color = color || '#A03028'
  el.style.left = (6 + Math.random() * 72) + '%'
  el.textContent = text
  inner.value.appendChild(el)
  const timer = setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el)
  }, 3300)
  timers.push(timer)
}

onMounted(() => {
  off = onDanmaku((text, color) => spawn(text, color))
})

onUnmounted(() => {
  if (off) off()
  timers.forEach(clearTimeout)
})
</script>
