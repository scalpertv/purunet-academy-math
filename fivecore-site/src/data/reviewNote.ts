// 복습 노트 — 데이터 구조, localStorage 헬퍼

export const REVIEW_SUBJECTS = ['국어', '수학', '영어', '사회', '과학', '독서', '기타']

export interface ReviewNote {
  id: string
  date: string        // "YYYY-MM-DD"
  subject: string
  title: string
  content: string
  isStarred: boolean
  createdAt: string
  updatedAt: string
}

// ── localStorage 키 ─────────────────────────────────────
const REVIEW_NOTES_KEY = 'fivecore-review-notes-v1'

// ── 노트 전체 로드/저장 ──────────────────────────────────
export function loadReviewNotes(): ReviewNote[] {
  try {
    const raw = localStorage.getItem(REVIEW_NOTES_KEY)
    return raw ? (JSON.parse(raw) as ReviewNote[]) : []
  } catch (_) { return [] }
}

function saveAllNotes(notes: ReviewNote[]): void {
  try {
    localStorage.setItem(REVIEW_NOTES_KEY, JSON.stringify(notes))
  } catch (_) {}
}

export function saveReviewNote(note: ReviewNote): void {
  const notes = loadReviewNotes()
  const idx = notes.findIndex((n) => n.id === note.id)
  if (idx >= 0) notes[idx] = note
  else notes.unshift(note)
  saveAllNotes(notes)
}

export function deleteReviewNote(id: string): void {
  saveAllNotes(loadReviewNotes().filter((n) => n.id !== id))
}

export function makeReviewNote(subject = '국어'): ReviewNote {
  const now = new Date().toISOString()
  return {
    id: `rn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: now.slice(0, 10),
    subject,
    title: '',
    content: '',
    isStarred: false,
    createdAt: now,
    updatedAt: now,
  }
}

export const SUBJECT_COLORS: Record<string, string> = {
  국어:  'bg-blue-100 text-blue-700',
  수학:  'bg-red-100 text-red-700',
  영어:  'bg-green-100 text-green-700',
  사회:  'bg-amber-100 text-amber-700',
  과학:  'bg-violet-100 text-violet-700',
  독서:  'bg-cyan-100 text-cyan-700',
  기타:  'bg-gray-100 text-gray-600',
}
