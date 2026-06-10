// 속해독서 타이머 관련 타입·상수·유틸 — 커리큘럼 2.4장 기반
import type { GradeCode } from '../types'

// ── 학년군별 분당 목표 글자 수 ─────────────────────────
export interface CpmTarget {
  /** 목표 분당 글자 수 (0 = 해당 없음) */
  target: number
  /** 목표 하한 (범위 표시용) */
  min: number
  label: string
}

export const CPM_TARGETS: Record<GradeCode, CpmTarget> = {
  age6:   { target: 0,   min: 0,   label: '교사 낭독 중심' },
  age7:   { target: 100, min: 80,  label: '분당 100자' },
  elem13: { target: 250, min: 200, label: '분당 200~300자' },
  elem46: { target: 400, min: 300, label: '분당 300~400자' },
  mid:    { target: 600, min: 500, label: '분당 600자' },
  high:   { target: 800, min: 700, label: '분당 800자' },
}

// ── 독서 기록 타입 ─────────────────────────────────────
export interface ReadingNotes {
  beforePredict: string
  afterCheck: string
  newLearning: string
  questions: string
}

export interface ReadingRecord {
  id: string
  date: string          // YYYY-MM-DD
  grade: GradeCode
  title: string
  durationSeconds: number
  charCount: number
  cpm: number
  notes: ReadingNotes
  summary: string
}

// ── localStorage ───────────────────────────────────────
export const READING_LOG_KEY = 'reading_log_v1'
export const READING_GRADE_KEY = 'reading_grade_pref'

export function loadReadingLog(): ReadingRecord[] {
  try {
    const raw = localStorage.getItem(READING_LOG_KEY)
    return raw ? (JSON.parse(raw) as ReadingRecord[]) : []
  } catch {
    return []
  }
}

export function saveReadingRecord(record: ReadingRecord): void {
  const log = loadReadingLog()
  const updated = [record, ...log].slice(0, 50)
  localStorage.setItem(READING_LOG_KEY, JSON.stringify(updated))
}

// ── 계산 유틸 ──────────────────────────────────────────
export function calcCpm(charCount: number, durationSeconds: number): number {
  if (durationSeconds === 0 || charCount === 0) return 0
  return Math.round(charCount / (durationSeconds / 60))
}

export type CpmStatus = 'good' | 'ok' | 'low' | 'none'

export function getCpmStatus(cpm: number, grade: GradeCode): CpmStatus {
  const t = CPM_TARGETS[grade]
  if (t.target === 0) return 'none'
  if (cpm >= t.target) return 'good'
  if (cpm >= t.min) return 'ok'
  return 'low'
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}초`
  if (s === 0) return `${m}분`
  return `${m}분 ${s}초`
}

// ── 이번 달 통계 ───────────────────────────────────────
export interface MonthlyStats {
  count: number
  totalMinutes: number
  avgCpm: number
}

export function calcMonthlyStats(log: ReadingRecord[]): MonthlyStats {
  const ym = new Date().toISOString().slice(0, 7)
  const thisMonth = log.filter((r) => r.date.startsWith(ym))
  if (thisMonth.length === 0) return { count: 0, totalMinutes: 0, avgCpm: 0 }
  const totalSec = thisMonth.reduce((s, r) => s + r.durationSeconds, 0)
  const cpmList = thisMonth.filter((r) => r.cpm > 0)
  const avgCpm = cpmList.length
    ? Math.round(cpmList.reduce((s, r) => s + r.cpm, 0) / cpmList.length)
    : 0
  return {
    count: thisMonth.length,
    totalMinutes: Math.round(totalSec / 60),
    avgCpm,
  }
}

// ── 기록지 양식 레이블 (학년 적응형) ──────────────────
export interface NoteField {
  key: keyof ReadingNotes
  label: string
  placeholder: string
}

export function getNoteFields(grade: GradeCode): NoteField[] {
  if (grade === 'age6' || grade === 'age7') {
    return [
      { key: 'beforePredict', label: '읽기 전', placeholder: '이 책은 어떤 이야기일 것 같아요?' },
      { key: 'afterCheck',    label: '읽은 후', placeholder: '이야기가 어떻게 됐나요?' },
      { key: 'newLearning',   label: '새로 알게 된 것', placeholder: '새로 배운 낱말이나 사실이 있나요?' },
      { key: 'questions',     label: '궁금한 것', placeholder: '더 알고 싶은 게 있나요?' },
    ]
  }
  if (grade === 'mid' || grade === 'high') {
    return [
      { key: 'beforePredict', label: '읽기 전 예측 + 질문', placeholder: 'Survey: 제목·소제목 훑기 → 핵심 질문 3가지 작성' },
      { key: 'afterCheck',    label: '읽은 후 확인', placeholder: '예측이 맞았나요? 핵심 논지·구조는?' },
      { key: 'newLearning',   label: '새로 알게 된 것', placeholder: '핵심 개념·사실·논리 구조 정리' },
      { key: 'questions',     label: '심화 탐구 질문', placeholder: '"이 글에서 빠진 것은? 다른 관점은?"' },
    ]
  }
  return [
    { key: 'beforePredict', label: '읽기 전 예측', placeholder: '제목·그림을 보고 어떤 내용일지 예측해보세요.' },
    { key: 'afterCheck',    label: '읽은 후 확인', placeholder: '예측이 맞았나요? 핵심 내용은 무엇인가요?' },
    { key: 'newLearning',   label: '새로 알게 된 것', placeholder: '오늘 새로 배운 내용을 써보세요.' },
    { key: 'questions',     label: '궁금한 것', placeholder: '더 알고 싶거나 이해가 안 된 부분은?' },
  ]
}
