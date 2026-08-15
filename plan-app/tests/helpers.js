// 组件测试公共工具
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

export function makePinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/calendar' },
      { path: '/calendar', name: 'calendar', component: { template: '<div/>' } },
      { path: '/day/:date', name: 'day', component: { template: '<div/>' } },
      { path: '/tasks', name: 'tasks', component: { template: '<div/>' } },
      { path: '/notes', name: 'notes', component: { template: '<div/>' } }
    ]
  })
  return router
}

// 便捷构建任务对象
export function task(overrides = {}) {
  return {
    id: 'task-' + Math.random().toString(36).slice(2, 8),
    title: '测试任务',
    type: 'once',
    date: '2026-08-15',
    priority: 'normal',
    note: '',
    completed: {},
    version: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides
  }
}
