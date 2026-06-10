// 주간 학습 계획표 — 데이터 구조, localStorage 헬퍼, 날짜 유틸

export const SCHEDULE_SUBJECTS = ['국어', '수학', '영어', '사회', '과학', '독서', '기타']
export const SCHEDULE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#6b7280']
export const TIME_SLOTS = [
  { label: '아침', icon: '🌅', hours: '06:00–08:00' },
  { label: '오전', icon: '☀️', hours: '09:00–12:00' },
  { label: '오후', icon: '🌤️', hours: '13:00–17:00' },
  { label: '저녁', icon: '🌙', hours: '18:00–22:00' },
]
export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export interface ScheduleBlock {
  id: string
  day: number       // 0=월, 6=일
  slot: number      // 0=아침, 1=오전, 2=오후, 3=저녁
  subject: string
  title: string
  durationMin: number  // 30 | 60 | 90 | 120 | 150 | 180
  done: boolean
  color: string
}

export interface WeekSchedule {
  weekKey: string       // "2026-W24" 형식
  weekLabel: string     // "2026년 24주차" 형식
  blocks: ScheduleBlock[]
  weeklyGoal: string
  updatedAt: string
}

// ── localStorage 키 ─────────────────────────────────────
export const SCHEDULE_KEY = (weekKey: string) => `fivecore-schedule-v1:${weekKey}`
export const SCHEDULE_LATEST_KEY = 'fivecore-schedule-latest-v1'

// ── 주차 계산 ────────────────────────────────────────────
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function getWeekLabel(weekKey: string): string {
  const [year, w] = weekKey.split('-W')
  return `${year}년 ${parseInt(w, 10)}주차`
}

export function getWeekStartDate(weekKey: string): Date {
  const [year, w] = weekKey.split('-W')
  const simple = new Date(parseInt(year, 10), 0, 1 + (parseInt(w, 10) - 1) * 7)
  const dow = simple.getDay()
  const ISOweekStart = new Date(simple)
  ISOweekStart.setDate(simple.getDate() - (dow <= 4 ? dow - 1 : dow - 8))
  return ISOweekStart
}

export function getDayDates(weekKey: string): Date[] {
  const start = getWeekStartDate(weekKey)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function offsetWeek(weekKey: string, delta: number): string {
  const start = getWeekStartDate(weekKey)
  start.setDate(start.getDate() + delta * 7)
  return getWeekKey(start)
}

// ── 계획표 로드/저장 ─────────────────────────────────────
export function loadWeekSchedule(weekKey: string): WeekSchedule {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY(weekKey))
    if (raw) return JSON.parse(raw) as WeekSchedule
  } catch (_) {}
  return makeEmptyWeek(weekKey)
}

export function saveWeekSchedule(schedule: WeekSchedule): void {
  try {
    localStorage.setItem(SCHEDULE_KEY(schedule.weekKey), JSON.stringify(schedule))
    localStorage.setItem(SCHEDULE_LATEST_KEY, schedule.weekKey)
  } catch (_) {}
}

export function makeEmptyWeek(weekKey: string): WeekSchedule {
  return {
    weekKey,
    weekLabel: getWeekLabel(weekKey),
    blocks: [],
    weeklyGoal: '',
    updatedAt: new Date().toISOString(),
  }
}

export function makeBlock(day: number, slot: number): ScheduleBlock {
  const colors: Record<string, string> = {
    '국어': '#3b82f6', '수학': '#ef4444', '영어': '#10b981',
    '사회': '#f59e0b', '과학': '#8b5cf6', '독서': '#06b6d4', '기타': '#6b7280',
  }
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    day,
    slot,
    subject: '국어',
    title: '',
    durationMin: 60,
    done: false,
    color: colors['국어'],
  }
}

export function calcScheduleStats(schedule: WeekSchedule) {
  const total = schedule.blocks.length
  const done = schedule.blocks.filter((b) => b.done).length
  const totalMin = schedule.blocks.reduce((s, b) => s + b.durationMin, 0)
  const doneMin = schedule.blocks.filter((b) => b.done).reduce((s, b) => s + b.durationMin, 0)
  return { total, done, totalMin, doneMin, rate: total > 0 ? Math.round((done / total) * 100) : 0 }
}
