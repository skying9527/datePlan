<template>
  <transition name="fade">
    <div v-if="ui.taskModal.open" class="modal-backdrop" @click.self="cancel">
      <div class="modal" role="dialog" aria-modal="true" aria-label="任务表单">
        <h2>{{ isEdit ? '编辑任务' : '新增任务' }}</h2>
        <p class="hint">{{ hintText }}</p>

        <div class="type-tabs" role="tablist" aria-label="任务类型">
          <button
            v-for="t in typeTabs"
            :key="t.key"
            class="type-tab"
            :class="{ on: form.type === t.key }"
            type="button"
            :aria-pressed="form.type === t.key"
            @click="form.type = t.key"
          >{{ t.label }}</button>
        </div>

        <div class="field">
          <label for="fTitle">任务名称</label>
          <input id="fTitle" ref="titleInput" v-model="form.title" type="text" placeholder="如：写周报" autocomplete="off">
        </div>

        <div class="prio-row" role="group" aria-label="优先级">
          <button
            v-for="p in prioTabs"
            :key="p.key"
            class="prio-btn"
            :class="[p.key, { on: form.priority === p.key }]"
            type="button"
            :aria-pressed="form.priority === p.key"
            @click="form.priority = p.key"
          >{{ p.label }}</button>
        </div>

        <!-- 一次性 -->
        <template v-if="form.type === 'once'">
          <div class="field">
            <label for="fOnceDate">日期</label>
            <input id="fOnceDate" v-model="form.onceDate" type="date">
          </div>
          <div class="row2">
            <div class="field">
              <label for="fOnceStart">开始时间（可选，不填则显示在"全天"）</label>
              <input id="fOnceStart" v-model="form.onceStart" type="time">
            </div>
            <div class="field">
              <label for="fOnceEnd">结束时间（可选）</label>
              <input id="fOnceEnd" v-model="form.onceEnd" type="time">
            </div>
          </div>
        </template>

        <!-- 固定时长 -->
        <template v-if="form.type === 'fixed'">
          <div class="field">
            <label for="fFixedDuration">每次时长（分钟）</label>
            <input id="fFixedDuration" v-model="form.fixedDuration" type="number" min="1" step="5" placeholder="如：30">
          </div>
          <div class="mode-row">
            <label><input type="radio" name="fixedMode" value="once" v-model="form.fixedMode"> 单次（某天某时段）</label>
            <label><input type="radio" name="fixedMode" value="repeat" v-model="form.fixedMode"> 重复（按频率）</label>
          </div>
          <template v-if="form.fixedMode === 'once'">
            <div class="field">
              <label for="fFixedDate">日期</label>
              <input id="fFixedDate" v-model="form.fixedDate" type="date">
            </div>
            <div class="field">
              <label for="fFixedStart">开始时间（可选）</label>
              <input id="fFixedStart" v-model="form.fixedStart" type="time">
            </div>
          </template>
          <template v-else>
            <div class="field">
              <label for="fFixedRepeatStart">开始时间（可选）</label>
              <input id="fFixedRepeatStart" v-model="form.repeatStart" type="time">
            </div>
          </template>
        </template>

        <!-- 长期 -->
        <template v-if="form.type === 'long'">
          <div class="field">
            <label for="fLongStart">开始时间（可选）</label>
            <input id="fLongStart" v-model="form.longStart" type="time">
          </div>
        </template>

        <!-- 重复频率（fixed-重复 / long） -->
        <div v-if="showFreq" class="field">
          <label>重复频率</label>
          <label class="freq-all"><input type="checkbox" v-model="form.freqAll"> 每天</label>
          <div class="freq-days" role="group" aria-label="选择每周星期几">
            <button
              v-for="d in DAY_ORDER"
              :key="d"
              class="freq-day"
              :class="{ on: form.weekDays[d] }"
              type="button"
              :disabled="form.freqAll"
              :aria-pressed="form.weekDays[d]"
              @click="toggleDay(d)"
            >{{ WEEKDAYS[d] }}</button>
          </div>
        </div>

        <div class="field">
          <label for="fNote">备注（可选，也可记录完成心得）</label>
          <textarea id="fNote" v-model="form.note" placeholder="如：需要先和评审会确认"></textarea>
        </div>

        <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>

        <div class="modal-actions">
          <button class="btn" type="button" @click="cancel">取消</button>
          <button class="btn primary" type="button" @click="save">保存任务</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useTasksStore } from '../../stores/tasks'
import { useTaskForm } from '../../composables/useTaskForm'
import { fmtCN } from '../../utils/date'

const ui = useUIStore()
const tasks = useTasksStore()
const { form, error, DAY_ORDER, WEEKDAYS, resetForAdd, prefill, validate, buildPayload } = useTaskForm()
const titleInput = ref(null)

const typeTabs = [
  { key: 'once', label: '一次性' },
  { key: 'fixed', label: '固定时长' },
  { key: 'long', label: '长期' }
]
const prioTabs = [
  { key: 'urgent', label: '紧急' },
  { key: 'important', label: '重要' },
  { key: 'normal', label: '普通' }
]

const isEdit = computed(() => !!ui.taskModal.editId)
const editTitle = computed(() => {
  const t = ui.taskModal.editId ? tasks.byId(ui.taskModal.editId) : null
  return t ? t.title : ''
})
const hintText = computed(() =>
  isEdit.value
    ? '编辑「' + editTitle.value + '」，已完成记录将保留'
    : '将添加到：' + fmtCN(ui.taskModal.defaultDate || '')
)
const showFreq = computed(() =>
  (form.type === 'fixed' && form.fixedMode === 'repeat') || form.type === 'long'
)
const formError = computed(() => error.message)

watch(
  () => ui.taskModal.open,
  async (open) => {
    if (!open) return
    const editId = ui.taskModal.editId
    const t = editId ? tasks.byId(editId) : null
    if (t) prefill(t, ui.taskModal.defaultDate || '')
    else resetForAdd(ui.taskModal.defaultDate || '')
    await nextTick()
    titleInput.value?.focus()
  }
)

function toggleDay(d) {
  if (form.freqAll) return
  form.weekDays[d] = !form.weekDays[d]
}

function cancel() {
  ui.closeTaskModal()
}

async function save() {
  const err = validate()
  if (err) {
    error.message = err
    return
  }
  const payload = buildPayload()
  if (isEdit.value && ui.taskModal.editId) {
    await tasks.updateTask(ui.taskModal.editId, payload)
  } else {
    await tasks.addTask(payload)
  }
  ui.closeTaskModal()
}
</script>
