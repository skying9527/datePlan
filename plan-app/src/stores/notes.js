// 每日总结 store（《设计方案》§5.2）
import { defineStore } from 'pinia'
import { noteRepo } from '../storage/adapter'
import { isoOf, parseIso, isoAdd } from '../utils/date'

export const useNotesStore = defineStore('notes', {
  state: () => ({
    notes: {} // { "2026-08-15": "总结文本" }
  }),
  getters: {
    notesOfMonth: (state) => (year, month) => {
      const prefix = year + '-' + String(month).padStart(2, '0')
      const out = {}
      for (const k in state.notes) {
        if (k.startsWith(prefix)) out[k] = state.notes[k]
      }
      return out
    },
    // 按周分组（周一起始），返回 [{ monday, days: [iso...] }]
    weekGroups: (state) => (year, month) => {
      const dim = new Date(year, month, 0).getDate()
      const groups = []
      let cur = null
      let curKey = ''
      for (let d = 1; d <= dim; d++) {
        const iso = isoOf(year, month, d)
        const wd = parseIso(iso).getDay()
        const monday = isoAdd(iso, -(wd + 6) % 7)
        if (curKey !== monday) {
          curKey = monday
          cur = { monday, days: [] }
          groups.push(cur)
        }
        cur.days.push(iso)
      }
      return groups
    }
  },
  actions: {
    async init() {
      this.notes = await noteRepo.loadAll()
    },
    async save(iso, text) {
      const v = (text || '').trim()
      if (v) this.notes[iso] = v
      else delete this.notes[iso]
      await noteRepo.saveAll(this.notes)
    },
    async remove(iso) {
      delete this.notes[iso]
      await noteRepo.saveAll(this.notes)
    },
    // 导入覆盖
    async replaceAll(notes) {
      this.notes = notes && typeof notes === 'object' && !Array.isArray(notes) ? notes : {}
      await noteRepo.saveAll(this.notes)
    }
  }
})
