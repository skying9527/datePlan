// 存储 key 常量（《设计方案》§4.3）
export const KEYS = {
  tasks: 'planApp.tasks.v3',
  notes: 'planApp.notes.v3',
  meta: 'planApp.meta.v3',
  // 旧版（原型）key，迁移只读不改写
  legacyTasks: 'planApp.tasks.v2',
  legacyNotes: 'planApp.notes.v2',
  // 迁移前备份
  backupTasks: 'planApp.tasks.v2.bak',
  backupNotes: 'planApp.notes.v2.bak'
}
