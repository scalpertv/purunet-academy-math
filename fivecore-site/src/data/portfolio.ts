// 포트폴리오 보관함 — 학기별 성장 기록 타입·저장·헬퍼 (커리큘럼 7.4장 기반)
import type { GradeCode } from '../types'
import type { DimScores } from './dashboard'
import { calcOverallRate, calcCycleRate } from './planner'

// ── 학기 목록 ───────────────────────────────────────────
export const SEMESTERS = [
  { id: '2026-1', label: '2026년 1학기', period: '2026.03 ~ 2026.08' },
  { id: '2026-2', label: '2026년 2학기', period: '2026.09 ~ 2027.02' },
  { id: '2027-1', label: '2027년 1학기', period: '2027.03 ~ 2027.08' },
]
export const DEFAULT_SEMESTER = '2026-1'

// ── 포트폴리오 구조 ────────────────────────────────────
export interface Portfolio {
  id: string
  semester: string
  cover: {
    name: string
    school: string
    grade: GradeCode | ''
    period: string
    promise: string    // 학기 다짐
  }
  assessment: {
    start: DimScores   // 학기 초 자기평가
    end: DimScores     // 학기 말 자기평가
  }
  bestPlannerDates: string[]   // 날짜 최대 3개
  bestMindmapIds: string[]     // ID 최대 3개
  bestAnalysisIds: string[]    // ID 최대 2개
  essay: string                // ⑧ 자기성찰 에세이
  meditationNote: string       // ⑦ 묵상 특별 기록
  teacherFeedback: string      // ⑨ 선생님·부모님 피드백
  nextGoals: string            // ⑩ 다음 학기 목표
  updatedAt: string
}

// ── 초기 포트폴리오 생성 ───────────────────────────────
export function makeEmptyPortfolio(semester: string): Portfolio {
  const sem = SEMESTERS.find((s) => s.id === semester) ?? SEMESTERS[0]
  return {
    id: `portfolio_${semester}`,
    semester,
    cover: { name: '', school: '', grade: '', period: sem.period, promise: '' },
    assessment: {
      start: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
      end:   { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
    },
    bestPlannerDates: [],
    bestMindmapIds:   [],
    bestAnalysisIds:  [],
    essay:            '',
    meditationNote:   '',
    teacherFeedback:  '',
    nextGoals:        '',
    updatedAt: new Date().toISOString(),
  }
}

// ── localStorage 키 ────────────────────────────────────
export const PORTFOLIO_KEY    = (sem: string) => `portfolio_v1_${sem}`
export const PORTFOLIO_SEM_KEY = 'portfolio_current_semester'

export function loadPortfolio(semester: string): Portfolio {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY(semester))
    return raw ? (JSON.parse(raw) as Portfolio) : makeEmptyPortfolio(semester)
  } catch { return makeEmptyPortfolio(semester) }
}

export function savePortfolio(portfolio: Portfolio): void {
  localStorage.setItem(PORTFOLIO_KEY(portfolio.semester), JSON.stringify(portfolio))
}

// ── 플래너 날짜 스캔 ───────────────────────────────────
export interface PlannerSummary {
  date: string
  rate: number
  cycleRate: number
  goalCount: number
}

export function scanPlannerDates(days = 90): PlannerSummary[] {
  const result: PlannerSummary[] = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const raw = localStorage.getItem(`planner_v1_${date}`)
    if (!raw) continue
    try {
      const data = JSON.parse(raw)
      result.push({
        date,
        rate: calcOverallRate(data),
        cycleRate: calcCycleRate(data),
        goalCount: (data.goals?.length ?? 0) + (data.kindieSelected?.length ?? 0),
      })
    } catch { /* 무시 */ }
  }
  return result
}

// ── JSON 내보내기 ──────────────────────────────────────
export function exportPortfolioJson(portfolio: Portfolio): void {
  const json = JSON.stringify(portfolio, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `portfolio_${portfolio.semester}_${portfolio.cover.name || 'unnamed'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ── 날짜 표시 포맷 ─────────────────────────────────────
export function formatPortfolioDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`
}
