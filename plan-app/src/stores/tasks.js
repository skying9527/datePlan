// 任务 store（《设计方案》§5.1）
// 每次修改后同步写回存储层；弹幕等副作用由 action 触发
import { defineStore } from 'pinia'
import { taskRepo } from '../storage/adapter'
import { uuid, normalizeTask } from '../storage/migrations'
import { tasksForDate, cmpTasks } from '../utils/priority'
import { taskDur, toMin, minToHM } from '../utils/date'
import { pushDanmaku } from '../composables/useDanmaku'
import { randomQuote, DANMAKU_COLORS } from '../utils/quotes'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: []
  }),
  getters: {
    byId: (state) => (id) => state.tasks.find((t) => t.id === id),
    tasksForDate: (state) => (iso) => tasksForDate(state.tasks, iso),
    allSorted: (state) => [...state.tasks].sort(cmpTasks)
  },
  actions: {
    async init() {
      this.tasks = await taskRepo.loadAll()
    },
    async addTask(payload) {
      const now = new Date().toISOString()
      const task = { ...payload, id: uuid(), version: 1, completed: {}, createdAt: now, updatedAt: now }
      this.tasks.push(task)
      await taskRepo.saveAll(this.tasks)
      pushDanmaku(randomQuote('add'), DANMAKU_COLORS.add)
    },
    // 编辑：保留 id / 已完成记录 / createdAt（与原型一致）
    async updateTask(id, payload) {
      const i = this.tasks.findIndex((t) => t.id === id)
      if (i < 0) return
      const old = this.tasks[i]
      this.tasks[i] = {
        ...old,
        ...payload,
        id: old.id,
        completed: old.completed || {},
        createdAt: old.createdAt,
        version: old.version ?? 1,
        updatedAt: new Date().toISOString()
      }
      await taskRepo.saveAll(this.tasks)
    },
    async removeTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
      await taskRepo.saveAll(this.tasks)
    },
    // 勾选 = 立即完成/取消完成（马上变灰），完成时触发夸赞弹幕
    async toggleDone(id, iso) {
      const t = this.tasks.find((x) => x.id === id)
      if (!t) return
      let justCompleted = false
      if (t.completed && t.completed[iso]) {
        delete t.completed[iso]
      } else {
        t.completed = t.completed || {}
        t.completed[iso] = { at: new Date().toISOString(), note: '' }
        justCompleted = true
      }
      await taskRepo.saveAll(this.tasks)
      if (justCompleted) pushDanmaku(randomQuote('praise'), DANMAKU_COLORS.praise)
    },
    // 拖拽移动：改开始时间（endTime 平移保持时长）+ 换泳道
    async moveTaskTime(id, startMin, laneIdx) {
      const t = this.tasks.find((x) => x.id === id)
      if (!t) return
      const dur = taskDur(t)
      t.startTime = minToHM(startMin)
      if (t.endTime) t.endTime = minToHM(startMin + dur)
      t.laneIdx = laneIdx
      t.updatedAt = new Date().toISOString()
      await taskRepo.saveAll(this.tasks)
    },
    // 调整时长（右边缘把手）：同步 durationMin（fixed）与 endTime
    async resizeTask(id, newDur) {
      const t = this.tasks.find((x) => x.id === id)
      if (!t) return
      const origStart = toMin(t.startTime) || 0
      if (t.durationMin) t.durationMin = newDur
      t.endTime = minToHM(origStart + newDur)
      t.updatedAt = new Date().toISOString()
      await taskRepo.saveAll(this.tasks)
    },
    // 导入覆盖
    async replaceAll(tasks) {
      this.tasks = Array.isArray(tasks) ? tasks.map((t) => normalizeTask(t)) : []
      await taskRepo.saveAll(this.tasks)
    }
  }
})
