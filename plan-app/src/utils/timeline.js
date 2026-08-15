// 泳道式时间线（《设计方案》§8 / 交接文档 §6.1-6.2）
// 纯函数，可单测；布局常量集中管理
import { toMin, taskDur } from './date'

// ---- 布局常量（§8.1，随整体设计等比放大 ×1.25）----
export const HOUR_W = 112.5       // 1 小时横向宽度（24h = 2700px，横向滚动）
export const LANE_H = 80          // 泳道行高（矩形框高 = 72.5px）
export const TOP = 45             // 时间轴顶部刻度区高度
export const SNAP_MIN = 15        // 拖拽/调整时长吸附步长（分钟，不缩放）
export const MIN_DUR = 15         // 矩形框最小时长（分钟，不缩放）
export const MIN_W = 80           // 矩形框最小宽度（px）

export const TIMELINE_W = 24 * HOUR_W

// 时间/像素映射（§8.2）
export const xOf = (min) => (min / 1440) * TIMELINE_W
export const widthOf = (dur) => Math.max((dur / 60) * HOUR_W, MIN_W)
export const yOf = (lane) => TOP + lane * LANE_H + 3.75
export const barHeight = () => LANE_H - 7.5
export const timelineHeight = (laneCount) => TOP + laneCount * LANE_H + 17.5

export const snap = (v, step = SNAP_MIN) => Math.round(v / step) * step
export const clampMin = (v) => {
  let m = snap(v)
  if (m < 0) m = 0
  if (m >= 1440) m = 1439
  return m
}

// 泳道分配算法（§8.3）：贪心——任务按开始时间排序，依次放入
// "与已有任务时间段不重叠"的最小可用行（偏好 laneIdx，冲突自动顺延）→ 保证最少行数
// 输入：当天定时任务数组（有 startTime）；输出：[{ task, lane, st, en }]
export function assignLanes(timedTasks) {
  const lanes = []
  const placed = []
  timedTasks.forEach((task) => {
    const st = toMin(task.startTime)
    const en = st + taskDur(task)
    let pref = typeof task.laneIdx === 'number' ? task.laneIdx : 0
    if (pref < 0) pref = 0
    let lane = pref
    while (lanes[lane] && lanes[lane].some((p) => !(en <= p.st || st >= p.en))) lane++
    if (!lanes[lane]) lanes[lane] = []
    lanes[lane].push({ st, en })
    placed.push({ task, lane, st, en })
  })
  return placed
}

// 拖拽提交换算（§8.5）：吸附 15 分钟并钳制 0..1439；换行钳制 0..9
export const clampDragMin = (origStart, dxPx) => clampMin(origStart + (dxPx / HOUR_W) * 60)
export const clampDragLane = (origLane, dyPx) => {
  let lane = Math.round((origLane * LANE_H + dyPx) / LANE_H)
  if (lane < 0) lane = 0
  if (lane > 9) lane = 9
  return lane
}
export const clampResizeDur = (origStart, origDur, dxPx) => {
  let newDur = snap(origDur + (dxPx / HOUR_W) * 60)
  if (newDur < MIN_DUR) newDur = MIN_DUR
  if (origStart + newDur > 1440) newDur = 1440 - origStart
  return newDur
}
