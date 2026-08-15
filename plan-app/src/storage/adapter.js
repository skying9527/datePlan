// 存储适配层（《设计方案》§4.3）
// - 统一 Promise（异步）契约：业务层一律 await，未来切 RemoteAdapter 零改动
// - LocalAdapter 现在同步实现、直接 resolve；localStorage 不可用时降级为内存存储（页面内可用，刷新丢失）
// 注意：本模块不 import migrations（避免循环依赖），迁移链由入口（main.js）编排调用
import { KEYS } from './keys'

let mem = {}
let available = true

export function isAvailable() {
  try {
    const k = '__planApp_probe__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch (e) {
    return false
  }
}

export async function read(key) {
  if (available) {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? null : JSON.parse(raw)
    } catch (e) {
      /* 解析失败按缺失处理 */
    }
  }
  return key in mem ? mem[key] : null
}

export async function write(key, value) {
  if (available) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return
    } catch (e) {
      // 写入失败（如配额/隐私模式）→ 降级内存并提示一次
      available = false
      console.warn('[拾光任务] localStorage 写入失败，已降级为内存存储（刷新后数据将丢失）。')
    }
  }
  mem[key] = value
}

export async function remove(key) {
  if (available) {
    try {
      localStorage.removeItem(key)
      return
    } catch (e) { /* 忽略 */ }
  }
  delete mem[key]
}

// ---- 任务仓库（taskRepo）----
export const taskRepo = {
  async loadAll() {
    const data = await read(KEYS.tasks)
    return Array.isArray(data) ? data : []
  },
  async saveAll(tasks) {
    await write(KEYS.tasks, tasks)
  },
  async add(task) {
    const tasks = await this.loadAll()
    tasks.push(task)
    await this.saveAll(tasks)
  },
  async update(task) {
    const tasks = await this.loadAll()
    const i = tasks.findIndex((t) => t.id === task.id)
    if (i >= 0) {
      tasks[i] = task
      await this.saveAll(tasks)
    }
  },
  async remove(id) {
    const tasks = (await this.loadAll()).filter((t) => t.id !== id)
    await this.saveAll(tasks)
  },
  // 完成/取消完成：写入/删除 completed[iso]，立即持久化；返回是否"本次标记完成"
  async toggleDone(id, iso) {
    const tasks = await this.loadAll()
    const t = tasks.find((x) => x.id === id)
    if (!t) return false
    let justCompleted = false
    if (t.completed && t.completed[iso]) {
      delete t.completed[iso]
    } else {
      t.completed = t.completed || {}
      t.completed[iso] = { at: new Date().toISOString(), note: '' }
      justCompleted = true
    }
    await this.saveAll(tasks)
    return justCompleted
  }
}

// ---- 总结仓库（noteRepo）----
export const noteRepo = {
  async loadAll() {
    const data = await read(KEYS.notes)
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  },
  async saveAll(notes) {
    await write(KEYS.notes, notes)
  },
  async get(iso) {
    const notes = await this.loadAll()
    return notes[iso] || ''
  },
  async set(iso, text) {
    const notes = await this.loadAll()
    if (text) notes[iso] = text
    else delete notes[iso]
    await this.saveAll(notes)
  },
  async remove(iso) {
    const notes = await this.loadAll()
    delete notes[iso]
    await this.saveAll(notes)
  }
}

// 初始化：探测可用性（迁移链由 main.js 调用 runMigrations 执行）
export async function initStorage() {
  available = isAvailable()
  if (!available) {
    console.warn('[拾光任务] localStorage 不可用，已降级为内存存储（页面内可用，刷新后数据将丢失）。')
  }
  return { available }
}
