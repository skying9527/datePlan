import { describe, it, expect, beforeEach } from 'vitest'
import { KEYS } from '../../src/storage/keys'
import { runMigrations, uuid, normalizeTask } from '../../src/storage/migrations'
import { read } from '../../src/storage/adapter'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

beforeEach(() => {
  localStorage.clear()
})

describe('uuid', () => {
  it('生成 UUID v4 格式', () => {
    const a = uuid()
    const b = uuid()
    expect(a).toMatch(UUID_RE)
    expect(a).not.toBe(b)
  })
})

describe('normalizeTask', () => {
  it('补充 version / updatedAt / completed / priority 默认值', () => {
    const t = normalizeTask({ id: 'legacy-1', title: '写周报' })
    expect(t.version).toBe(1)
    expect(t.updatedAt).toBeTruthy()
    expect(t.createdAt).toBeTruthy()
    expect(t.completed).toEqual({})
    expect(t.priority).toBe('normal')
    // 非 UUID id 重生成 UUID
    expect(t.id).toMatch(UUID_RE)
  })

  it('保留合法 UUID id 与既有字段', () => {
    const t = normalizeTask({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'x', note: 'y', version: 1 })
    expect(t.id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(t.note).toBe('y')
  })
})

describe('runMigrations v2→v3', () => {
  it('全新安装（无任何 key）：写入 meta schemaVersion=3，不产生任务数据', async () => {
    const r = await runMigrations()
    expect(r.migrated).toBe(false)
    const meta = await read(KEYS.meta)
    expect(meta.schemaVersion).toBe(3)
    expect(await read(KEYS.tasks)).toBeNull()
    expect(await read(KEYS.notes)).toBeNull()
  })

  it('v2 数据迁移：改名搬移 + UUID + version/updatedAt + 备份旧 key', async () => {
    localStorage.setItem(KEYS.legacyTasks, JSON.stringify([
      { id: 'abc123', title: '写周报', type: 'once', date: '2026-08-15', startTime: '09:00', endTime: '10:00', priority: 'urgent', completed: {}, createdAt: '2026-08-01T00:00:00.000Z' },
      { id: 'xyz789', title: '多喝水', type: 'long', repeat: { kind: 'daily' }, priority: 'normal', completed: { '2026-08-15': { at: '2026-08-15T01:00:00.000Z', note: '' } }, createdAt: '2026-08-01T00:00:00.000Z' }
    ]))
    localStorage.setItem(KEYS.legacyNotes, JSON.stringify({ '2026-08-15': '今天完成了……' }))

    const r = await runMigrations()
    expect(r.migrated).toBe(true)

    // v3 任务：结构迁移 + 默认字段
    const tasks = await read(KEYS.tasks)
    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toMatch(UUID_RE)
    expect(tasks[0].version).toBe(1)
    expect(tasks[0].updatedAt).toBeTruthy()
    expect(tasks[0].title).toBe('写周报')
    expect(tasks[0].completed).toEqual({})
    expect(tasks[1].completed['2026-08-15'].note).toBe('')

    // 总结迁移
    const notes = await read(KEYS.notes)
    expect(notes['2026-08-15']).toBe('今天完成了……')

    // 备份 key 写入，旧 key 保留
    expect(JSON.parse(localStorage.getItem(KEYS.backupTasks))).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem(KEYS.backupNotes))['2026-08-15']).toBe('今天完成了……')
    expect(localStorage.getItem(KEYS.legacyTasks)).toBeTruthy()

    // meta
    expect((await read(KEYS.meta)).schemaVersion).toBe(3)
  })

  it('已有 v3 数据时不覆盖（迁移不覆盖用户数据）', async () => {
    localStorage.setItem(KEYS.tasks, JSON.stringify([{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: '新任务', version: 1 }]))
    localStorage.setItem(KEYS.legacyTasks, JSON.stringify([{ id: 'old1', title: '旧任务' }]))

    await runMigrations()
    const tasks = await read(KEYS.tasks)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('新任务')
    expect(tasks[0].id).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
  })

  it('幂等：再次执行不重复迁移、不覆盖', async () => {
    localStorage.setItem(KEYS.legacyTasks, JSON.stringify([{ id: 'old1', title: '旧任务' }]))
    await runMigrations()
    const first = await read(KEYS.tasks)
    const r2 = await runMigrations()
    expect(r2.migrated).toBe(false)
    expect(await read(KEYS.tasks)).toEqual(first)
  })
})
