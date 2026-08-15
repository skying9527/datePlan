// 农历 / 干支 / 宜忌模块（《设计方案》§11）
// - 经典 lunarInfo 表（1900–2049，150 项）+ solar2lunar（基准已验证）
// - 干支：年 = 农历年 (y-4)%10 / (y-4)%12；日 = 儒略日公式 (JDN+49)%60
// - 宜忌：原型沿用 10 组循环示例表（按干支日取模），接口 yiJiOf(iso)，未来可换真实黄历数据源
export const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0
]

function leapMonth(y) { return lunarInfo[y - 1900] & 0xf }
function leapDays(y) { return leapMonth(y) ? ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29) : 0 }
function monthDays(y, m) { return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29 }
function lYearDays(y) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0
  return sum + leapDays(y)
}

// 公历 → 农历 { lYear, lMonth, lDay, isLeap }（1900–2049）
export function solar2lunar(y, m, d) {
  const base = new Date(1900, 0, 31)
  const obj = new Date(y, m - 1, d)
  let offset = Math.floor((obj - base) / 86400000)
  let i, temp
  for (i = 1900; i < 2101 && offset > 0; i++) { temp = lYearDays(i); offset -= temp }
  if (offset < 0) { offset += temp; i-- }
  const lunarYear = i
  const leap = leapMonth(i)
  let isLeap = false
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) { --i; isLeap = true; temp = leapDays(lunarYear) }
    else { temp = monthDays(lunarYear, i) }
    if (isLeap && i === (leap + 1)) isLeap = false
    offset -= temp
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) { isLeap = false } else { isLeap = true; --i }
  }
  if (offset < 0) { offset += temp; --i }
  return { lYear: lunarYear, lMonth: i, lDay: offset + 1, isLeap }
}

// 儒略日
export function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 干支年（公历年）→ "丙午"
export const ganzhiYear = (y) => GAN[(y - 4) % 10] + ZHI[(y - 4) % 12]

// 干支日（公历）→ "戊午"
export const ganzhiDay = (y, m, d) => {
  const n = (jdn(y, m, d) + 49) % 60
  return GAN[n % 10] + ZHI[n % 12]
}

const LMONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
const LDAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

// "七月初六" / "正月"（初一返回月名）
export function lunarTextOf(iso) {
  const p = iso.split('-').map(Number)
  const l = solar2lunar(p[0], p[1], p[2])
  const m = (l.isLeap ? '闰' : '') + LMONTHS[l.lMonth - 1]
  return l.lDay === 1 ? m : LDAYS[l.lDay - 1]
}

// 农历年干支（按农历年）→ "丙午"
export function ganzhiYearOf(iso) {
  const p = iso.split('-').map(Number)
  const l = solar2lunar(p[0], p[1], p[2])
  return ganzhiYear(l.lYear)
}

export function ganzhiDayText(iso) {
  const p = iso.split('-').map(Number)
  return ganzhiDay(p[0], p[1], p[2])
}

// 宜忌：10 组循环示例表（按干支日取模）——示例数据，正式数据源可替换
const YIJI = [
  { yi: '出行', ji: '动土' }, { yi: '会友', ji: '开仓' }, { yi: '祭祀', ji: '破土' }, { yi: '纳财', ji: '远行' },
  { yi: '入宅', ji: '嫁娶' }, { yi: '求医', ji: '开业' }, { yi: '修造', ji: '出火' }, { yi: '签约', ji: '栽种' },
  { yi: '读书', ji: '理发' }, { yi: '清扫', ji: '安床' }
]

export function yiJiOf(iso) {
  const p = iso.split('-').map(Number)
  return YIJI[(jdn(p[0], p[1], p[2]) + 49) % 60 % 10]
}
