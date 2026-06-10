// 속해독서 타이머 페이지 — 읽기 타이머 + CPM 계산 + 독서 기록 관리
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { GRADE_GROUPS } from '../data/grades'
import type { GradeCode } from '../types'
import {
  CPM_TARGETS,
  READING_GRADE_KEY,
  calcCpm,
  calcMonthlyStats,
  formatDuration,
  getCpmStatus,
  getNoteFields,
  loadReadingLog,
  saveReadingRecord,
} from '../data/reading'
import type { ReadingNotes, ReadingRecord } from '../data/reading'

type TimerPhase = 'ready' | 'running' | 'paused' | 'completed'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ── 원형 타이머 SVG ────────────────────────────────────
const RADIUS = 74
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface CircularTimerProps {
  seconds: number
  phase: TimerPhase
  color: string
}

function CircularTimer({ seconds, phase, color }: CircularTimerProps) {
  const cycleProgress = (seconds % 60) / 60
  const strokeDashOffset = CIRCUMFERENCE - CIRCUMFERENCE * cycleProgress
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const strokeColor =
    phase === 'running' ? color :
    phase === 'paused'  ? '#f59e0b' :
    phase === 'completed' ? '#10b981' :
    '#d1d5db'

  return (
    <div className="relative mx-auto" style={{ width: 192, height: 192 }}>
      <svg width="192" height="192" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="96" cy="96" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="96" cy="96" r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={phase === 'completed' ? 0 : strokeDashOffset}
          style={{ transition: phase === 'running' ? 'stroke-dashoffset 1s linear' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold font-mono text-gray-800 tracking-tight">
          {mm}:{ss}
        </span>
        <span className="text-xs text-gray-400 mt-1">
          {phase === 'running'   ? '읽는 중...' :
           phase === 'paused'    ? '⏸ 일시정지' :
           phase === 'completed' ? '✓ 완료' : ''}
        </span>
      </div>
    </div>
  )
}

// ── 속해독서 4단계 가이드 카드 ─────────────────────────
const READING_STEPS = [
  { num: '①', name: '훑기', desc: '30초: 제목·소제목·그림·첫/끝 문장 파악', color: 'text-blue-600' },
  { num: '②', name: '예측', desc: '"이 글은 무엇에 관한 것일까?" 생각하기', color: 'text-yellow-600' },
  { num: '③', name: '이해 독서', desc: '중요 문장에 줄 긋기, 모르는 단어 체크', color: 'text-green-600' },
  { num: '④', name: '요약', desc: '눈 감고 내용 떠올리기 → 3줄 요약 작성', color: 'text-purple-600' },
]

function ReadingGuide() {
  return (
    <div className="card p-4 mb-4">
      <h3 className="font-bold text-gray-700 text-sm mb-3">📖 속해독서 4단계</h3>
      <div className="grid grid-cols-2 gap-2">
        {READING_STEPS.map((s) => (
          <div key={s.num} className="bg-gray-50 rounded-xl p-3">
            <div className={`font-bold text-base mb-0.5 ${s.color}`}>
              {s.num} {s.name}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CPM 달성률 표시 ────────────────────────────────────
interface CpmBadgeProps {
  cpm: number
  grade: GradeCode
}

function CpmBadge({ cpm, grade }: CpmBadgeProps) {
  const target = CPM_TARGETS[grade]
  const status = getCpmStatus(cpm, grade)

  if (target.target === 0) return null

  const pct = Math.min(Math.round((cpm / target.target) * 100), 150)

  const statusStyle =
    status === 'good' ? 'bg-green-50 border-green-200 text-green-700' :
    status === 'ok'   ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
    'bg-red-50 border-red-200 text-red-700'

  const barColor =
    status === 'good' ? 'bg-green-500' :
    status === 'ok'   ? 'bg-yellow-400' :
    'bg-red-400'

  const statusLabel =
    status === 'good' ? '목표 달성 🎉' :
    status === 'ok'   ? '거의 다 왔어요' :
    '꾸준히 연습해요'

  return (
    <div className={`rounded-xl border p-3 ${statusStyle}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold">{cpm}자/분</span>
        <span className="text-xs">{statusLabel}</span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs opacity-80">
        목표: {target.label} ({pct}% 달성)
      </p>
    </div>
  )
}

// ── 독서 기록 카드 ─────────────────────────────────────
interface RecordCardProps {
  record: ReadingRecord
}

function RecordCard({ record }: RecordCardProps) {
  const [expanded, setExpanded] = useState(false)
  const gradeInfo = GRADE_GROUPS.find((g) => g.id === record.grade)
  const status = getCpmStatus(record.cpm, record.grade)

  const cpmColor =
    status === 'good' ? 'text-green-600' :
    status === 'ok'   ? 'text-yellow-600' :
    status === 'none' ? 'text-gray-400' :
    'text-red-500'

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="text-2xl flex-shrink-0">{gradeInfo?.icon ?? '📚'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{record.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {record.date} · {formatDuration(record.durationSeconds)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          {record.cpm > 0 ? (
            <span className={`text-sm font-bold ${cpmColor}`}>{record.cpm}<span className="text-xs font-normal text-gray-400">자/분</span></span>
          ) : (
            <span className="text-xs text-gray-400">낭독</span>
          )}
          <p className={`text-xs mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</p>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-2 pt-3">
          {record.summary && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">3줄 요약</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.summary}</p>
            </div>
          )}
          {Object.entries(record.notes).some(([, v]) => v) && (
            <div className="space-y-2">
              {getNoteFields(record.grade).map((f) => {
                const val = record.notes[f.key]
                if (!val) return null
                return (
                  <div key={f.key} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">{f.label}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{val}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 이번 달 통계 카드 ──────────────────────────────────
function MonthlyStatsCard({ log }: { log: ReadingRecord[] }) {
  const stats = calcMonthlyStats(log)
  const month = new Date().getMonth() + 1

  return (
    <div className="card p-4 mb-4">
      <h3 className="font-bold text-gray-700 text-sm mb-3">📊 {month}월 독서 통계</h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '독서 권수', value: `${stats.count}권`, color: 'text-blue-600' },
          { label: '총 독서 시간', value: `${stats.totalMinutes}분`, color: 'text-green-600' },
          { label: '평균 속도', value: stats.avgCpm > 0 ? `${stats.avgCpm}자/분` : '-', color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────
export function ReadingPage() {
  const navigate = useNavigate()
  const { requireLogin } = useAuth()

  const [grade, setGrade] = useState<string>(() => localStorage.getItem(READING_GRADE_KEY) ?? '')
  const [tab, setTab] = useState<'timer' | 'log'>('timer')
  const [phase, setPhase] = useState<TimerPhase>('ready')
  const [elapsed, setElapsed] = useState(0)
  const [log, setLog] = useState<ReadingRecord[]>(() => loadReadingLog())

  // 완료 후 입력 필드
  const [title, setTitle] = useState('')
  const [charCount, setCharCount] = useState('')
  const [notes, setNotes] = useState<ReadingNotes>({ beforePredict: '', afterCheck: '', newLearning: '', questions: '' })
  const [summary, setSummary] = useState('')

  // 타이머 인터벌
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  function handleGradeSelect(g: string) {
    setGrade(g)
    localStorage.setItem(READING_GRADE_KEY, g)
  }

  function startTimer() {
    setPhase('running')
  }

  function pauseTimer() {
    setPhase('paused')
  }

  function resumeTimer() {
    setPhase('running')
  }

  function stopTimer() {
    setPhase('completed')
  }

  function resetTimer() {
    setPhase('ready')
    setElapsed(0)
    setTitle('')
    setCharCount('')
    setNotes({ beforePredict: '', afterCheck: '', newLearning: '', questions: '' })
    setSummary('')
  }

  function handleSave() {
    const chars = parseInt(charCount, 10) || 0
    const cpm = calcCpm(chars, elapsed)
    const record: ReadingRecord = {
      id: Date.now().toString(),
      date: todayStr(),
      grade: grade as GradeCode,
      title: title.trim() || '제목 없음',
      durationSeconds: elapsed,
      charCount: chars,
      cpm,
      notes,
      summary: summary.trim(),
    }
    saveReadingRecord(record)
    setLog(loadReadingLog())
    resetTimer()
    setTab('log')
  }

  const gradeInfo = GRADE_GROUPS.find((g) => g.id === grade)
  const timerHex = gradeInfo ? {
    'bg-blue-600': '#2563eb', 'bg-yellow-500': '#eab308',
    'bg-green-600': '#16a34a', 'bg-orange-500': '#f97316',
    'bg-purple-600': '#9333ea', 'bg-indigo-700': '#4338ca',
  }[gradeInfo.headerBg] ?? '#3b82f6' : '#3b82f6'

  const chars = parseInt(charCount, 10) || 0
  const liveCpm = calcCpm(chars, elapsed)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className="bg-green-600 text-white px-4 pt-6 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/70 text-sm mb-4"
        >
          ← 뒤로
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">📚</span>
          <div>
            <h1 className="text-xl font-bold">속해독서 타이머</h1>
            <p className="text-white/80 text-sm">읽기 속도 측정 + 분당 글자 수 계산</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ── 학년군 선택 ── */}
        <div className="card p-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 flex-shrink-0">학년군 선택.</span>
            {GRADE_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGradeSelect(g.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  grade === g.id
                    ? `${g.headerBg} text-white border-transparent`
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <span>{g.icon}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>
          {grade && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">목표 속도.</span>
              <span className="text-xs font-semibold text-green-700">
                {CPM_TARGETS[grade as GradeCode].label}
              </span>
            </div>
          )}
        </div>

        {/* ── 탭 바 ── */}
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1 mb-4">
          {(['timer', 'log'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              {t === 'timer' ? '⏱️ 읽기 타이머' : '📋 독서 기록'}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            타이머 탭
        ══════════════════════════════════════════════ */}
        {tab === 'timer' && (
          <div className="space-y-4">

            {/* ── READY / RUNNING / PAUSED: 원형 타이머 ── */}
            {phase !== 'completed' && (
              <>
                <div className="card p-6 flex flex-col items-center gap-6">
                  <CircularTimer seconds={elapsed} phase={phase} color={timerHex} />

                  <div className="flex gap-3 w-full max-w-xs">
                    {phase === 'ready' && (
                      <button
                        onClick={startTimer}
                        disabled={!grade}
                        className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold text-base disabled:opacity-40 active:scale-95 transition-all"
                      >
                        읽기 시작
                      </button>
                    )}
                    {phase === 'running' && (
                      <>
                        <button
                          onClick={pauseTimer}
                          className="flex-1 bg-yellow-500 text-white py-3 rounded-2xl font-bold active:scale-95 transition-all"
                        >
                          ⏸ 일시정지
                        </button>
                        <button
                          onClick={stopTimer}
                          className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-bold active:scale-95 transition-all"
                        >
                          ⏹ 정지
                        </button>
                      </>
                    )}
                    {phase === 'paused' && (
                      <>
                        <button
                          onClick={resumeTimer}
                          className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold active:scale-95 transition-all"
                        >
                          ▶ 계속 읽기
                        </button>
                        <button
                          onClick={stopTimer}
                          className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-bold active:scale-95 transition-all"
                        >
                          ⏹ 정지
                        </button>
                      </>
                    )}
                  </div>

                  {!grade && phase === 'ready' && (
                    <p className="text-xs text-gray-400">학년군을 먼저 선택하세요.</p>
                  )}
                </div>

                {/* 가이드는 READY 상태일 때만 표시 */}
                {phase === 'ready' && <ReadingGuide />}
              </>
            )}

            {/* ── COMPLETED: 결과 입력 폼 ── */}
            {phase === 'completed' && (
              <div className="space-y-4">
                {/* 결과 요약 카드 */}
                <div className="card p-5 flex flex-col items-center gap-1 border-green-200 bg-green-50">
                  <span className="text-3xl">🎉</span>
                  <p className="font-bold text-green-800 text-lg">독서 완료!</p>
                  <p className="text-green-700 text-sm font-medium">{formatDuration(elapsed)} 동안 읽었어요.</p>
                </div>

                {/* 책 제목 */}
                <div className="card p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">책 제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="오늘 읽은 책 제목을 입력하세요"
                    className="input-field"
                  />
                </div>

                {/* 글자 수 입력 + CPM 계산 (6세 제외) */}
                {grade !== 'age6' && (
                  <div className="card p-4 space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">읽은 글자 수 입력</label>
                    <p className="text-xs text-gray-400 -mt-1">읽은 부분의 글자 수를 세어 입력하면 분당 속도가 계산됩니다.</p>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={charCount}
                      onChange={(e) => setCharCount(e.target.value)}
                      placeholder="예: 2400"
                      className="input-field"
                    />
                    {chars > 0 && grade && (
                      <CpmBadge cpm={liveCpm} grade={grade as GradeCode} />
                    )}
                  </div>
                )}

                {/* 속해독서 기록지 */}
                {grade && (
                  <div className="card p-4 space-y-3">
                    <h3 className="font-bold text-gray-700 text-sm">속해독서 기록지</h3>
                    {getNoteFields(grade as GradeCode).map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                        <textarea
                          value={notes[f.key]}
                          onChange={(e) => setNotes((p) => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          rows={2}
                          className="input-field resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3줄 요약 */}
                <div className="card p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">3줄 요약</label>
                  <p className="text-xs text-gray-400 mb-2">눈을 감고 내용을 떠올린 다음 핵심만 3줄로 써보세요.</p>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder={"1. \n2. \n3. "}
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                {/* 저장 / 다시 읽기 */}
                <div className="flex gap-3">
                  <button
                    onClick={resetTimer}
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm active:scale-95 transition-all"
                  >
                    다시 읽기
                  </button>
                  <button
                    onClick={() => requireLogin(handleSave)}
                    className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm active:scale-95 transition-all"
                  >
                    기록 저장
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            기록 탭
        ══════════════════════════════════════════════ */}
        {tab === 'log' && (
          <div className="space-y-3">
            <MonthlyStatsCard log={log} />

            {log.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-gray-500 text-sm">아직 독서 기록이 없어요.</p>
                <p className="text-gray-400 text-xs mt-1">타이머로 읽고 기록을 남겨보세요.</p>
                <button
                  onClick={() => setTab('timer')}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all"
                >
                  타이머 시작
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium px-1">최근 독서 기록 ({log.length}건)</p>
                {log.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
