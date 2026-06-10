// 5차원 성장 대시보드 — 데이터 집계 함수 및 자기평가 저장
import { calcOverallRate, calcCycleRate } from './planner'
import type { PlannerData } from './planner'

// ── 자기평가 점수 저장 ─────────────────────────────────
/** key: YYYY-MM, value: { [dimId: number]: 1~5 } */
export const ASSESSMENT_KEY = 'fivecore_assessment_v1'

export type DimScores = Record<number, number>  // { 1: 3, 2: 4, ... }

export function defaultScores(): DimScores {
  return { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 }
}

export function loadAssessmentMonth(ym: string): DimScores {
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY)
    if (!raw) return defaultScores()
    const store: Record<string, DimScores> = JSON.parse(raw)
    return store[ym] ?? defaultScores()
  } catch { return defaultScores() }
}

export function saveAssessmentMonth(ym: string, scores: DimScores): void {
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY)
    const store: Record<string, DimScores> = raw ? JSON.parse(raw) : {}
    store[ym] = scores
    localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(store))
  } catch { /* 무시 */ }
}

// ── 날짜 유틸 ──────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function ymStr(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 7)  // YYYY-MM
}

function dateStr(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return d.toISOString().slice(0, 10)
}

// ── 플래너 데이터 읽기 ─────────────────────────────────
function readPlanner(date: string): PlannerData | null {
  try {
    const raw = localStorage.getItem(`planner_v1_${date}`)
    return raw ? (JSON.parse(raw) as PlannerData) : null
  } catch { return null }
}

// ── 오늘 데이터 ───────────────────────────────────────
export interface TodayData {
  cycleRate: number      // 0~100
  achieveRate: number    // 0~100
  cycleChecked: Record<string, boolean>
  hasPlannerData: boolean
}

export function getTodayData(): TodayData {
  const data = readPlanner(todayStr())
  if (!data) return {
    cycleRate: 0, achieveRate: 0,
    cycleChecked: { planner: false, meditation: false, reading: false, analysis: false, mindmap: false },
    hasPlannerData: false,
  }
  return {
    cycleRate: calcCycleRate(data),
    achieveRate: calcOverallRate(data),
    cycleChecked: data.cycleChecked as unknown as Record<string, boolean>,
    hasPlannerData: true,
  }
}

// ── 이번 주 달성률 (7일) ───────────────────────────────
export interface DayRate {
  date: string
  dayLabel: string
  rate: number
  isToday: boolean
}

export function getWeeklyRates(): DayRate[] {
  const today = todayStr()
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().slice(0, 10)
    const dayLabel = dayLabels[d.getDay()]
    const plannerData = readPlanner(date)
    const rate = plannerData ? calcOverallRate(plannerData) : 0
    return { date, dayLabel, rate, isToday: date === today }
  })
}

// ── 연속 학습 스트릭 ───────────────────────────────────
export function calcStreak(): number {
  let streak = 0
  // 오늘부터 거슬러 올라가되, 오늘이 0%면 어제부터 시작
  for (let i = 0; i < 365; i++) {
    const date = dateStr(i)
    const data = readPlanner(date)
    if (!data) {
      // 오늘 데이터가 아직 없으면 건너뜀
      if (i === 0) continue
      break
    }
    if (calcOverallRate(data) === 0) {
      if (i === 0) continue
      break
    }
    streak++
  }
  return streak
}

// ── 주간 신체 기록 평균 ───────────────────────────────
export interface WeeklyBody {
  avgSleep: number
  totalExerciseMin: number
  avgWater: number
  breakfastDays: number
  recordedDays: number
}

export function getWeeklyBody(): WeeklyBody {
  let totalSleep = 0, totalExercise = 0, totalWater = 0
  let breakfastDays = 0, days = 0
  for (let i = 0; i < 7; i++) {
    const data = readPlanner(dateStr(i))
    if (!data?.body) continue
    totalSleep    += data.body.sleep    ?? 0
    totalExercise += data.body.exercise ?? 0
    totalWater    += data.body.water    ?? 0
    if (data.body.breakfast) breakfastDays++
    days++
  }
  if (days === 0) return { avgSleep: 0, totalExerciseMin: 0, avgWater: 0, breakfastDays: 0, recordedDays: 0 }
  return {
    avgSleep: Math.round((totalSleep / days) * 10) / 10,
    totalExerciseMin: totalExercise,
    avgWater: Math.round((totalWater / days) * 10) / 10,
    breakfastDays,
    recordedDays: days,
  }
}

// ── 이달/지난달 YM ─────────────────────────────────────
export const thisMonthYm = () => ymStr(0)
export const prevMonthYm = () => ymStr(-1)
