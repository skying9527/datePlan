// 路由（《设计方案》§6）：hash 模式，file:// 与 http:// 均可
import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarView from '../components/calendar/CalendarView.vue'
import DayView from '../components/day/DayView.vue'
import TasksView from '../components/tasks/TasksView.vue'
import NotesView from '../components/notes/NotesView.vue'

const routes = [
  { path: '/', redirect: '/calendar' },
  { path: '/calendar', name: 'calendar', component: CalendarView },
  { path: '/day/:date', name: 'day', component: DayView },
  { path: '/tasks', name: 'tasks', component: TasksView },
  { path: '/notes', name: 'notes', component: NotesView },
  { path: '/:pathMatch(.*)*', redirect: '/calendar' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 非法日期归一化：/day/<非法> → 回到日历
router.beforeEach((to) => {
  if (to.name === 'day') {
    const d = to.params.date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return { name: 'calendar' }
  }
  return true
})

export default router
