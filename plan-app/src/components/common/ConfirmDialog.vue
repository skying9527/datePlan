<template>
  <transition name="fade">
    <div v-if="ui.confirm.open" class="modal-backdrop" @click.self="cancel">
      <div class="modal" role="alertdialog" aria-modal="true" aria-label="删除确认">
        <h2>{{ ui.confirm.title }}</h2>
        <p class="confirm-msg">{{ ui.confirm.message }}</p>
        <div class="modal-actions">
          <button class="btn" type="button" @click="cancel">取消</button>
          <button class="btn danger" type="button" @click="ok">确认删除</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useUIStore } from '../../stores/ui'

const ui = useUIStore()

function cancel() {
  ui.closeConfirm()
}

function ok() {
  const cb = ui.confirm.cb
  ui.closeConfirm()
  if (typeof cb === 'function') cb()
}
</script>
