// 꿈쟁이 AI 아카데미에서 로그인한 학생의 학습 진도·계획표·복습노트 데이터를 양방향 동기화하는 Context
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth, type AcademyUser } from '../auth/AuthContext'
import { type WeekSchedule } from '../data/schedule'
import { type ReviewNote } from '../data/reviewNote'

const ACADEMY_BASE = 'https://dreamer-ai-academy.pages.dev'
const ACADEMY_ORIGIN = ACADEMY_BASE
const LEARNING_DATA_URL = `${ACADEMY_BASE}/api/fivecore-learning-data`
const SCHEDULE_SYNC_URL = `${ACADEMY_BASE}/api/fivecore-schedule`
const REVIEW_SYNC_URL = `${ACADEMY_BASE}/api/fivecore-review-notes`

export interface ProgressItem {
  moduleId: string
  subjectId: string
  percent: number
  stickers: number
  updatedAt: string
  title: string
  moduleTitle: string
}

export interface ActivityItem {
  moduleId: string
  eventType: string
  occurredAt: string
  title: string
  subjectId: string
}

export interface SubjectTag {
  title: string
  subjectId: string
}

export interface AcademyLearningData {
  student: { id: string; name: string }
  progress: ProgressItem[]
  activity: ActivityItem[]
  recentSubjects: SubjectTag[]
  // 동기화된 계획표/복습노트
  remoteSchedules?: WeekSchedule[]
  remoteNotes?: ReviewNote[]
}

export interface AcademyContext {
  subject: string
  title: string
  moduleId: string
}

interface AcademyDataContextType {
  data: AcademyLearningData | null
  isLoading: boolean
  refresh: () => void
  syncSchedule: (schedule: WeekSchedule) => Promise<void>
  syncReviewNote: (note: ReviewNote) => Promise<void>
  academyContext: AcademyContext | null
}

const AcademyDataContext = createContext<AcademyDataContextType | null>(null)

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    const json = await res.json()
    return json.ok ? json : null
  } catch (_) { return null }
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    return json.ok ? json : null
  } catch (_) { return null }
}

export function AcademyDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, loginFromAcademy } = useAuth()
  const [data, setData] = useState<AcademyLearningData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [academyContext, setAcademyContext] = useState<AcademyContext | null>(null)

  const fetchData = useCallback(async (currentUser: AcademyUser) => {
    setIsLoading(true)
    try {
      const [learningJson, schedJson, reviewJson] = await Promise.all([
        fetchJson<{ ok: boolean } & Partial<AcademyLearningData>>(
          `${LEARNING_DATA_URL}?student_id=${encodeURIComponent(currentUser.id)}`
        ),
        fetchJson<{ ok: boolean; schedules?: WeekSchedule[] }>(
          `${SCHEDULE_SYNC_URL}?student_id=${encodeURIComponent(currentUser.id)}`
        ),
        fetchJson<{ ok: boolean; notes?: ReviewNote[] }>(
          `${REVIEW_SYNC_URL}?student_id=${encodeURIComponent(currentUser.id)}`
        ),
      ])

      if (learningJson?.ok) {
        setData({
          student: learningJson.student!,
          progress: learningJson.progress || [],
          activity: learningJson.activity || [],
          recentSubjects: learningJson.recentSubjects || [],
          remoteSchedules: schedJson?.schedules || [],
          remoteNotes: reviewJson?.notes || [],
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && user) fetchData(user)
    else setData(null)
  }, [isLoggedIn, user, fetchData])

  // 계획표 서버 저장
  const syncSchedule = useCallback(async (schedule: WeekSchedule) => {
    if (!user) return
    await postJson(SCHEDULE_SYNC_URL, { student_id: user.id, schedule })
  }, [user])

  // 복습 노트 서버 저장
  const syncReviewNote = useCallback(async (note: ReviewNote) => {
    if (!user) return
    await postJson(REVIEW_SYNC_URL, { student_id: user.id, note })
  }, [user])

  // iframe에서 아카데미 postMessage 수신 (세션 + 컨텍스트)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== ACADEMY_ORIGIN) return
      const msg = event.data as {
        type?: string
        user?: AcademyUser | null
        subject?: string
        title?: string
        moduleId?: string
      }
      if (msg?.type === 'PURUNET_ACADEMY_SESSION' && msg.user) {
        loginFromAcademy(msg.user)
        event.source?.postMessage?.({ type: 'FIVECORE_READY' }, { targetOrigin: ACADEMY_ORIGIN })
      }
      if (msg?.type === 'ACADEMY_CONTEXT' && msg.title) {
        setAcademyContext({
          subject: msg.subject || '',
          title: msg.title || '',
          moduleId: msg.moduleId || '',
        })
      }
    }
    window.addEventListener('message', handleMessage)
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'FIVECORE_READY' }, ACADEMY_ORIGIN)
    }
    return () => window.removeEventListener('message', handleMessage)
  }, [loginFromAcademy])

  const refresh = useCallback(() => {
    if (isLoggedIn && user) fetchData(user)
  }, [isLoggedIn, user, fetchData])

  return (
    <AcademyDataContext.Provider value={{ data, isLoading, refresh, syncSchedule, syncReviewNote, academyContext }}>
      {children}
    </AcademyDataContext.Provider>
  )
}

export function useAcademyData() {
  const ctx = useContext(AcademyDataContext)
  if (!ctx) throw new Error('useAcademyData must be used within AcademyDataProvider')
  return ctx
}
