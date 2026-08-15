// 泳道时间线拖拽状态机（《设计方案》§8.5 / 交接文档 §6.3）
// 状态：idle → moving | resizing → idle
// - 命中优先级：.mini 按钮（点击）→ .tl-resize 把手（调整时长）→ .tl-task 主体（移动/换泳道）
// - 监听器挂 document，pointerup 后移除；组件卸载时清理
import { onMounted, onUnmounted } from 'vue'
import { HOUR_W, LANE_H, TOP, MIN_W, clampDragMin, clampDragLane, clampResizeDur } from '../utils/timeline'
import { taskDur, toMin } from '../utils/date'

export function useTimelineDrag(containerRef, { iso, tasks, onMove, onResize }) {
  let moveHandler = null
  let upHandler = null
  let rzMove = null
  let rzUp = null

  const endMoving = (ev) => {
    document.removeEventListener('pointermove', moveHandler)
    document.removeEventListener('pointerup', upHandler)
    const bar = moveHandler.__bar
    if (bar) bar.classList.remove('dragging')
    const task = tasks.value.find((t) => t.id === moveHandler.__id)
    if (!task) return
    const dx = (ev.clientX || 0) - moveHandler.__startX
    const dy = (ev.clientY || 0) - moveHandler.__startY
    onMove(task.id, clampDragMin(moveHandler.__origStart, dx), clampDragLane(moveHandler.__origLane, dy))
    moveHandler = null
    upHandler = null
  }

  const startMoving = (ev, bar, task) => {
    if (ev.cancelable) ev.preventDefault()
    const drag = {
      bar,
      id: task.id,
      origStart: toMin(task.startTime) || 0,
      origLane: typeof task.laneIdx === 'number' ? task.laneIdx : 0,
      startX: ev.clientX,
      startY: ev.clientY
    }
    bar.classList.add('dragging')
    moveHandler = (e) => {
      const dx = (e.clientX || 0) - drag.startX
      const dy = (e.clientY || 0) - drag.startY
      drag.bar.style.left = (drag.origStart / 1440 * 24 * HOUR_W + dx) + 'px'
      drag.bar.style.top = (TOP + drag.origLane * LANE_H + 3.75 + dy) + 'px'
    }
    moveHandler.__bar = drag.bar
    moveHandler.__id = drag.id
    moveHandler.__startX = drag.startX
    moveHandler.__startY = drag.startY
    moveHandler.__origStart = drag.origStart
    moveHandler.__origLane = drag.origLane
    upHandler = (e) => endMoving(e)
    document.addEventListener('pointermove', moveHandler)
    document.addEventListener('pointerup', upHandler)
  }

  const endResizing = (ev) => {
    document.removeEventListener('pointermove', rzMove)
    document.removeEventListener('pointerup', rzUp)
    const bar = rzMove.__bar
    if (bar) bar.classList.remove('resizing')
    const task = tasks.value.find((t) => t.id === rzMove.__id)
    if (!task) return
    const dx = (ev.clientX || 0) - rzMove.__startX
    const newDur = clampResizeDur(rzMove.__origStart, rzMove.__origDur, dx)
    onResize(task.id, newDur)
    rzMove = null
    rzUp = null
  }

  const startResizing = (ev, bar, task) => {
    if (ev.cancelable) ev.preventDefault()
    bar.classList.add('resizing')
    const rz = {
      bar,
      id: task.id,
      origStart: toMin(task.startTime) || 0,
      origDur: taskDur(task),
      startX: ev.clientX
    }
    rzMove = (e) => {
      const dx = (e.clientX || 0) - rz.startX
      const newDur = clampResizeDur(rz.origStart, rz.origDur, dx)
      rz.bar.style.width = Math.max((newDur / 60) * HOUR_W, MIN_W) + 'px'
    }
    rzMove.__bar = rz.bar
    rzMove.__id = rz.id
    rzMove.__startX = rz.startX
    rzMove.__origStart = rz.origStart
    rzMove.__origDur = rz.origDur
    rzUp = (e) => endResizing(e)
    document.addEventListener('pointermove', rzMove)
    document.addEventListener('pointerup', rzUp)
  }

  const onPointerDown = (ev) => {
    if (!containerRef.value) return
    const bar = ev.target.closest('.tl-task')
    if (!bar) return
    if (ev.target.closest('.mini')) return
    if (ev.target.closest('.tl-resize')) {
      const task = tasks.value.find((t) => t.id === bar.dataset.id)
      if (task) startResizing(ev, bar, task)
      return
    }
    const task = tasks.value.find((t) => t.id === bar.dataset.id)
    if (task) startMoving(ev, bar, task)
  }

  onMounted(() => {
    containerRef.value?.addEventListener('pointerdown', onPointerDown)
  })
  onUnmounted(() => {
    containerRef.value?.removeEventListener('pointerdown', onPointerDown)
    if (moveHandler) document.removeEventListener('pointermove', moveHandler)
    if (upHandler) document.removeEventListener('pointerup', upHandler)
    if (rzMove) document.removeEventListener('pointermove', rzMove)
    if (rzUp) document.removeEventListener('pointerup', rzUp)
  })

  return { onPointerDown }
}
