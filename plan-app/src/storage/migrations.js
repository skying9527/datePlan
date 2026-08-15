// 数据迁移链（《设计方案》§4.4）
// - 启动时读取 planApp.meta.v3.schemaVersion，旧版本走迁移链 v2→v3
// - 迁移前备份旧 key（planApp.tasks.v2.bak 等）；迁移只读不改写旧 key、不覆盖用户已有 v3 数据
// - 任务 ID 统一为 UUID（演进接缝：多用户合并不冲突）；模型补充 version / updatedAt
import { KEYS } from './keys'
import { read, write } from './adapter'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// UUID v4：优先 crypto.randomUUID()，不可用时手写回退
export function uuid() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch (e) { /* 继续回退 */ }
  let d = Date.now()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// 规范化单条任务：补齐默认字段（导入/迁移共用）
// 注意：非 UUID 的 id 会重新生成 UUID（v2 原型 id 为时间戳+随机串，不合 UUID 规范）
export function normalizeTask(t) {
  const now = new Date().toISOString()
  const createdAt = t.createdAt || now
  return {
    ...t,
    id: t.id && UUID_RE.test(t.id) ? t.id : uuid(),
    priority: t.priority || 'normal',
    completed: t.completed && typeof t.completed === 'object' && !Array.isArray(t.completed) ? t.completed : {},
    version: t.version ?? 1,
    createdAt,
    updatedAt: t.updatedAt || createdAt
  }
}

// 迁移 v2 → v3：改名搬移 + 补充默认字段 + ID 转 UUID（缺失时生成）
function migrateV2toV3() {
  return async () => {
    const legacyTasks = await read(KEYS.legacyTasks)
    const legacyNotes = await read(KEYS.legacyNotes)
    const hasLegacy = legacyTasks !== null || legacyNotes !== null
    if (!hasLegacy) return { migrated: false }

    // 1) 备份旧 key（迁移只读不改写旧 key，另存 .bak 快照）
    if (legacyTasks !== null) await write(KEYS.backupTasks, legacyTasks)
    if (legacyNotes !== null) await write(KEYS.backupNotes, legacyNotes)

    // 2) 迁移任务：v3 已有数据时不覆盖
    const currentTasks = await read(KEYS.tasks)
    if (Array.isArray(legacyTasks) && !Array.isArray(currentTasks)) {
      await write(KEYS.tasks, legacyTasks.map((t) => normalizeTask(t)))
    }

    // 3) 迁移每日总结
    const currentNotes = await read(KEYS.notes)
    if (legacyNotes !== null && !(currentNotes && typeof currentNotes === 'object')) {
      await write(KEYS.notes, legacyNotes)
    }
    return { migrated: true }
  }
}

// 迁移链定义：[ {from, to, fn} ]，顺序执行
const CHAIN = [
  { from: 2, to: 3, fn: migrateV2toV3() }
]

// 执行迁移：返回 { from, to, migrated }
export async function runMigrations() {
  let meta = null
  try {
    meta = await read(KEYS.meta)
  } catch (e) { /* 无 meta 视为全新安装 */ }
  const schemaVersion = meta && typeof meta.schemaVersion === 'number' ? meta.schemaVersion : 0
  if (schemaVersion >= 3) return { from: schemaVersion, to: schemaVersion, migrated: false }

  let migrated = false
  for (const step of CHAIN) {
    if (schemaVersion < step.to) {
      const r = await step.fn()
      migrated = migrated || !!r.migrated
    }
  }
  await write(KEYS.meta, { schemaVersion: 3, migratedAt: new Date().toISOString() })
  return { from: schemaVersion, to: 3, migrated }
}
