<template>
  <transition name="fade">
    <div v-if="ui.sideOpen" class="side-mask" @click="ui.closeSide()"></div>
  </transition>
  <transition name="side">
    <aside v-if="ui.sideOpen" class="side-panel" aria-label="当天任务预览">
      <div class="side-head">
        <div>
          <h3>{{ fmtCN(iso) }}</h3>
          <div class="side-lunar">{{ sideLunar }}</div>
        </div>
        <button class="icon-btn" type="button" aria-label="关闭侧边栏" @click="ui.closeSide()">
          <Icon name="close" :size="15" />
        </button>
      </div>

      <div class="side-body">
        <ul class="side-list">
          <li v-if="!list.length" class="side-item">
            <div class="s-main">这一天还没有任务</div>
          </li>
          <li
            v-for="t in list"
            :key="t.id"
            class="side-item"
            :class="{ done: !!(t.completed && t.completed[iso]) }"
          >
            <button
              class="mini chk"
              :class="{ on: !!(t.completed && t.completed[iso]) }"
              type="button"
              :aria-label="t.completed && t.completed[iso] ? '取消完成' : '完成任务'"
              @click="tasks.toggleDone(t.id, iso)"
            >
              <Icon name="check" :size="13" :stroke-width="3" />
            </button>
            <div class="s-main">
              <div class="s-title">{{ t.title }}</div>
              <div class="s-meta">[{{ PRIO_LABEL[t.priority] }}] {{ taskMeta(t) }}</div>
            </div>
            <button class="mini" type="button" aria-label="编辑任务" @click="ui.openTaskModal(iso, t.id)">
              <Icon name="edit" :size="13" />
            </button>
            <button class="mini del" type="button" aria-label="删除任务" @click="askDelete(t)">
              <Icon name="trash" :size="13" />
            </button>
          </li>
        </ul>
      </div>

      <div class="side-foot">
        <button class="btn primary" type="button" @click="goDetail">查看当天详情 →</button>
      </div>
    </aside>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../common/Icon.vue'
import { useUIStore } from '../../stores/ui'
import { useTasksStore } from '../../stores/tasks'
import { fmtCN } from '../../utils/date'
import { lunarTextOf, ganzhiYearOf, yiJiOf } from '../../utils/lunar'
import { PRIO_LABEL, taskMeta } from '../../utils/priority'

const ui = useUIStore()
const tasks = useTasksStore()
const router = useRouter()

const iso = computed(() => ui.sideIso || '')
const list = computed(() => (ui.sideOpen && iso.value ? tasks.tasksForDate(iso.value) : []))

const sideLunar = computed(() => {
  if (!iso.value) return ''
  const yj = yiJiOf(iso.value)
  return '农历' + lunarTextOf(iso.value) + ' · ' + ganzhiYearOf(iso.value) + '年 · 宜' + yj.yi + ' 忌' + yj.ji
})

function askDelete(t) {
  ui.openConfirm(
    '删除任务',
    '确定要删除「' + t.title + '」吗？删除后不可恢复，并会从所有日期中移除。',
    () => tasks.removeTask(t.id)
  )
}

function goDetail() {
  ui.closeSide()
  router.push({ name: 'day', params: { date: iso.value } })
}
</script>
