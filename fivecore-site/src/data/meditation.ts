// 3분 묵상 타이머 데이터·기록 타입·저장 헬퍼 (커리큘럼 2.3장 기반)
import type { GradeCode } from '../types'

// ── 감정 색깔 카드 (6세 전용) ─────────────────────────
export const EMOTION_COLORS = [
  { id: 'excited',  label: '신남',  color: '#ef4444' },
  { id: 'happy',    label: '행복',  color: '#eab308' },
  { id: 'calm',     label: '차분',  color: '#3b82f6' },
  { id: 'curious',  label: '궁금',  color: '#8b5cf6' },
  { id: 'peaceful', label: '평화',  color: '#22c55e' },
  { id: 'excited2', label: '설렘',  color: '#f97316' },
  { id: 'sad',      label: '슬픔',  color: '#94a3b8' },
  { id: 'angry',    label: '화남',  color: '#374151' },
] as const

// ── 묵상 5단계 기본 정의 ─────────────────────────────
export type StepKey = 'gratitude' | 'recall' | 'acceptance' | 'commitment' | 'regulation'

export interface MeditationStep {
  key: StepKey
  label: string
  emoji: string
  duration: number   // 초
  guide: string
}

const STEP_BASE: Omit<MeditationStep, 'guide'>[] = [
  { key: 'gratitude',  label: '감사', emoji: '🙏', duration: 30 },
  { key: 'recall',     label: '회상', emoji: '💭', duration: 60 },
  { key: 'acceptance', label: '수용', emoji: '🤗', duration: 30 },
  { key: 'commitment', label: '다짐', emoji: '💪', duration: 30 },
  { key: 'regulation', label: '조절', emoji: '🌬️', duration: 30 },
]

const GUIDES: Record<GradeCode, string[]> = {
  age6: [
    '오늘 좋았던 것 하나를 말해보세요',
    '어제 배운 것 하나를 떠올려요',
    '어제 잘못한 것이 있어도 괜찮아요 — "나는 괜찮아!"',
    '오늘 배울 것을 큰 소리로 말해요',
    '코로 깊게 마시고 입으로 천천히 내쉬어요 (3번)',
  ],
  age7: [
    '오늘 감사한 일 하나를 말하거나 써보세요',
    '어제 기억나는 것 하나를 말해보세요',
    '어제 실수가 있어도 괜찮아요 — 솔직하게 인정해요',
    '오늘 목표를 다시 큰 소리로 읽어요',
    '깊은 호흡 3회 + 어깨·목 스트레칭',
  ],
  elem13: [
    '"나는 오늘 ___이/가 감사합니다" 한 문장으로 써보세요',
    '어제 배운 것 3가지를 눈 감고 떠올려보세요',
    '어제의 실수를 인정하기: "나는 ___을 놓쳤어요. 오늘은 잘할 수 있어요!"',
    '오늘 목표를 소리 내어 읽어요',
    '깊은 호흡 3회 + 온몸 스트레칭 30초',
  ],
  elem46: [
    '감사한 것 + 이유: "___이 감사합니다. 왜냐하면 ___이기 때문입니다"',
    '어제 배운 핵심 3가지를 말해보세요 — 기억 안 나는 것은 무엇인가요?',
    '어제의 실수나 놓친 부분을 솔직하게 인정해요',
    '오늘 학습 전략을 선택하세요: "오늘은 ___ 방법으로 공부한다"',
    '피로도·집중도 1~5 점검 + 깊은 호흡 3회',
  ],
  mid: [
    '어제의 나: 잘한 것 1개 + 감사한 것 1개를 써보세요',
    '어제 배운 핵심 3가지 회상 + 오개념이 있다면 오늘 수정 계획',
    '어제 실수·실패를 솔직하게 인정하고 오늘 개선 방법을 결정해요',
    '오늘의 다짐: 구체적 행동 선언 (언제, 무엇을, 어떻게)',
    '학업 목적 재확인 ("내가 이 공부를 왜 하는가?") + 깊은 호흡',
  ],
  high: [
    '나의 진로·꿈과 연결된 감사 1가지를 써보세요',
    '어제 오류 패턴 분석 + 핵심 내용 요약 3가지',
    '어제 실수를 인정하고 오늘 구체적인 수정 방법을 결정해요',
    '수능/진로 목표와 오늘 공부의 연결고리를 확인해요',
    '스트레스 레벨 1~5 체크 + 해소 방법 결정 + 깊은 호흡 3회',
  ],
}

export function getMeditationSteps(grade: GradeCode): MeditationStep[] {
  return STEP_BASE.map((s, i) => ({ ...s, guide: GUIDES[grade][i] }))
}

export const TOTAL_SECONDS = STEP_BASE.reduce((a, s) => a + s.duration, 0) // 180

// ── 묵상 기록 ──────────────────────────────────────────
export interface MeditationRecord {
  id: string
  date: string
  grade: GradeCode
  completedSteps: number    // 0~5
  durationSeconds: number
  emotionColor?: string     // age6
  emotionTemp?: number      // age7: 1~10
  note: string
}

export const MEDITATION_LOG_KEY  = 'meditation_log_v1'
export const MEDITATION_GRADE_KEY = 'meditation_grade_pref'

export function loadMeditationLog(): MeditationRecord[] {
  try {
    const raw = localStorage.getItem(MEDITATION_LOG_KEY)
    return raw ? (JSON.parse(raw) as MeditationRecord[]) : []
  } catch { return [] }
}

export function saveMeditationRecord(rec: MeditationRecord): void {
  const log = loadMeditationLog()
  const idx = log.findIndex((r) => r.id === rec.id)
  if (idx >= 0) log[idx] = rec; else log.unshift(rec)
  localStorage.setItem(MEDITATION_LOG_KEY, JSON.stringify(log.slice(0, 90)))
}

// ── 부모/교사 코멘트 (PIN 잠금) ───────────────────────
export interface TeacherComment {
  id: string
  date: string
  from: 'teacher' | 'parent'
  text: string
}

export const TEACHER_COMMENTS_KEY = 'teacher_comments_v1'
export const TEACHER_PIN_KEY      = 'teacher_pin_v1'

export function loadComments(): TeacherComment[] {
  try {
    const raw = localStorage.getItem(TEACHER_COMMENTS_KEY)
    return raw ? (JSON.parse(raw) as TeacherComment[]) : []
  } catch { return [] }
}

export function saveComment(comment: TeacherComment): void {
  const list = loadComments()
  list.unshift(comment)
  localStorage.setItem(TEACHER_COMMENTS_KEY, JSON.stringify(list.slice(0, 50)))
}

export function getPin(): string | null {
  return localStorage.getItem(TEACHER_PIN_KEY)
}

export function setPin(pin: string): void {
  localStorage.setItem(TEACHER_PIN_KEY, pin)
}
