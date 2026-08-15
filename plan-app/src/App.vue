<template>
  <AppHeader />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="view" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <DanmakuStage />
  <TaskFormModal />
  <ConfirmDialog />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import DanmakuStage from './components/layout/DanmakuStage.vue'
import TaskFormModal from './components/common/TaskFormModal.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import { useUIStore } from './stores/ui'

const router = useRouter()
const ui = useUIStore()

// Esc 层级关闭（《设计方案》§9）：任务弹窗 → 删除确认 → 侧边栏 → 当天页返回日历
function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (ui.taskModal.open) {
    ui.closeTaskModal()
  } else if (ui.confirm.open) {
    ui.closeConfirm()
  } else if (ui.sideOpen) {
    ui.closeSide()
  } else if (router.currentRoute.value.name === 'day') {
    router.push({ name: 'calendar' })
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
