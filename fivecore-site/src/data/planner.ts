// 학습 플래너 타입 정의 및 유틸 함수 — 커리큘럼 문서 2.2장 기반
import type { CycleStep } from '../types'

// ── 6/7세 활동 카드 ───────────────────────────────────
export const KINDIE_ACTIVITIES = [
  { id: 'picture_book', icon: '📖', label: '그림책 읽기' },
  { id: 'math_play', icon: '🔢', label: '수 놀이' },
  { id: 'english', icon: '🔤', label: '영어 단어' },
  { id: 'writing', icon: '✏️', label: '글씨 연습' },
  { id: 'mindmap_draw', icon: '🗺️', label: '마인드맵 그리기' },
  { id: 'exercise', icon: '🏃', label: '신체 활동' },
  { id: 'drawing', icon: '🎨', label: '그림 그리기' },
  { id: 'song', icon: '🎵', label: '노래·율동' },
] as const

// ── 과목 목록 ─────────────────────────────────────────
export const SUBJECTS = ['국어', '수학', '영어', '사회', '과학', '기타'] as const

// ── 우선순위 ──────────────────────────────────────────
export const PRIORITY_OPTIONS = [
  { value: 'high' as const, label: '상', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  { value: 'mid' as const, label: '중', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  { value: 'low' as const, label: '하', bgColor: 'bg-gray-100', textColor: 'text-gray-400' },
]

export type Priority = 'high' | 'mid' | 'low'

// ── 목표 (Goal) ───────────────────────────────────────
export interface Goal {
  id: string
  subject: string
  text: string
  estimatedMin: number
  priority: Priority
  /** null=미체크, true=달성, false=미달성 */
  done: boolean | null
  // SMART 추가 필드 (초등 고학년 이상)
  unit?: string
  measurable?: string
}

// ── 플래너 하루 데이터 ────────────────────────────────
export interface PlannerData {
  date: string  // YYYY-MM-DD
  grade: string
  goals: Goal[]
  /** 6/7세: 선택한 활동 id 목록 */
  kindieSelected: string[]
  /** 6/7세: 완료한 활동 id 목록 */
  kindieCompleted: string[]
  cycleChecked: Record<CycleStep, boolean>
  body: {
    sleep: number     // 시간
    exercise: number  // 분
    water: number     // 잔
    breakfast: boolean
  }
  /** 에너지 레벨 1~5 (중/고등용) */
  energyLevel: number
  reflection: {
    good: string
    bad: string
    improve: string
  }
}

// ── 초기 데이터 생성 ──────────────────────────────────
export function makePlannerData(date: string, grade: string): PlannerData {
  return {
    date,
    grade,
    goals: [],
    kindieSelected: [],
    kindieCompleted: [],
    cycleChecked: {
      planner: false,
      meditation: false,
      reading: false,
      analysis: false,
      mindmap: false,
    },
    body: { sleep: 0, exercise: 0, water: 0, breakfast: false },
    energyLevel: 3,
    reflection: { good: '', bad: '', improve: '' },
  }
}

// ── localStorage 키 ───────────────────────────────────
export const PLANNER_KEY = (date: string) => `planner_v1_${date}`
export const GRADE_PREF_KEY = 'planner_grade_pref'

// ── 달성률 계산 ───────────────────────────────────────
export function calcAchievementRate(data: PlannerData): number {
  const isKindie = data.grade === 'age6' || data.grade === 'age7'
  if (isKindie) {
    if (data.kindieSelected.length === 0) return 0
    return Math.round((data.kindieCompleted.length / data.kindieSelected.length) * 100)
  }
  if (data.goals.length === 0) return 0
  const doneCount = data.goals.filter((g) => g.done === true).length
  return Math.round((doneCount / data.goals.length) * 100)
}

export function calcCycleRate(data: PlannerData): number {
  return Math.round((Object.values(data.cycleChecked).filter(Boolean).length / 5) * 100)
}

/** 달성률 + 사이클률 평균 = 종합 달성률 */
export function calcOverallRate(data: PlannerData): number {
  const a = calcAchievementRate(data)
  const c = calcCycleRate(data)
  if (data.goals.length === 0 && data.kindieSelected.length === 0) return c
  return Math.round((a + c) / 2)
}

// ── 날짜 포맷 ─────────────────────────────────────────
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 최근 7일 날짜 문자열 목록 (오늘 제외) */
export function recentDates(): string[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (i + 1))
    return d.toISOString().slice(0, 10)
  })
}
