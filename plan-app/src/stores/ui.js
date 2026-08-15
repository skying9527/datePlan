// UI store（《设计方案》§5.3）：路由态之外的界面状态 / 弹窗 / 侧边栏 / 筛选
import { defineStore } from 'pinia'
import { pushDanmaku } from '../composables/useDanmaku'
import { randomQuote, DANMAKU_COLORS } from '../utils/quotes'

export const useUIStore = defineStore('ui', {
  state: () => ({
    year: 0,
    month: 0,
    sideIso: null,
    sideOpen: false,
    filterStatus: 'all', // all | todo | done
    filterType: 'all',   // all | once | fixed | long
    notesYear: 0,
    notesMonth: 0,
    taskModal: { open: false, editId: null, defaultDate: null },
    confirm: { open: false, title: '', message: '', cb: null },
    user: null // 登录态占位【演进预留】：null=本地单机模式；未来为 { id, name, … }
  }),
  actions: {
    initDates() {
      const now = new Date()
      this.year = now.getFullYear()
      this.month = now.getMonth() + 1
      this.notesYear = now.getFullYear()
      this.notesMonth = now.getMonth() + 1
    },
    changeMonth(delta) {
      let m = this.month + delta
      let y = this.year
      if (m < 1) { m = 12; y-- }
      if (m > 12) { m = 1; y++ }
      this.year = y
      this.month = m
    },
    goTodayMonth() {
      const now = new Date()
      this.year = now.getFullYear()
      this.month = now.getMonth() + 1
    },
    notesMonth(delta) {
      let m = this.notesMonth + delta
      let y = this.notesYear
      if (m < 1) { m = 12; y-- }
      if (m > 12) { m = 1; y++ }
      this.notesYear = y
      this.notesMonth = m
    },
    // 打开侧边栏（查看激励弹幕由 store action 触发）
    openSide(iso) {
      this.sideIso = iso
      this.sideOpen = true
      pushDanmaku(randomQuote('view'), DANMAKU_COLORS.view)
    },
    closeSide() {
      this.sideOpen = false
    },
    openTaskModal(defaultDate, editId = null) {
      this.taskModal = { open: true, editId, defaultDate }
    },
    closeTaskModal() {
      this.taskModal.open = false
      this.taskModal.editId = null
    },
    openConfirm(title, message, cb) {
      this.confirm = { open: true, title, message, cb }
    },
    closeConfirm() {
      this.confirm.open = false
      this.confirm.cb = null
    }
  }
})
