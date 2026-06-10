// 3분 묵상 가이드 + 신체 기록 + 주간 현황 + 부모/교사 코멘트 페이지
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { GRADE_GROUPS } from '../data/grades'
import {
  EMOTION_COLORS,
  MEDITATION_GRADE_KEY,
  TEACHER_PIN_KEY,
  getMeditationSteps,
  getPin,
  loadComments,
  loadMeditationLog,
  saveComment,
  saveMeditationRecord,
  setPin,
} from '../data/meditation'
import type { MeditationRecord, TeacherComment } from '../data/meditation'
import type { GradeCode } from '../types'
import { PLANNER_KEY, makePlannerData, todayStr } from '../data/planner'
import type { PlannerData } from '../data/planner'

// ── 신체 목표 (학년군별) ───────────────────────────────
const BODY_TARGETS: Record<GradeCode, { sleep: number; exercise: number; water: number }> = {
  age6:   { sleep: 10, exercise: 60, water: 5 },
  age7:   { sleep: 10, exercise: 60, water: 5 },
  elem13: { sleep: 9,  exercise: 60, water: 6 },
  elem46: { sleep: 9,  exercise: 60, water: 6 },
  mid:    { sleep: 8,  exercise: 45, water: 7 },
  high:   { sleep: 7,  exercise: 30, water: 8 },
}

// ── 플래너 데이터 로드/저장 헬퍼 ──────────────────────
function loadTodayPlanner(grade: GradeCode): PlannerData {
  const today = todayStr()
  try {
    const raw = localStorage.getItem(PLANNER_KEY(today))
    return raw ? (JSON.parse(raw) as PlannerData) : makePlannerData(today, grade)
  } catch { return makePlannerData(today, grade) }
}

function saveTodayBody(planner: PlannerData): void {
  localStorage.setItem(PLANNER_KEY(planner.date), JSON.stringify(planner))
}

// ── 원형 타이머 SVG ────────────────────────────────────
const TIMER_R = 56
const TIMER_CIRC = 2 * Math.PI * TIMER_R

function TimerRing({ elapsed, duration, color }: { elapsed: number; duration: number; color: string }) {
  const offset = TIMER_CIRC * (elapsed / duration)
  const remaining = Math.max(0, duration - elapsed)
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={72} cy={72} r={TIMER_R} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle
          cx={72} cy={72} r={TIMER_R} fill="none"
          stroke={color} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={TIMER_CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s linear' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-gray-800 leading-none">
          {mm > 0 ? `${mm}:${ss.toString().padStart(2, '0')}` : ss.toString()}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">초</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 탭 1 — 묵상 타이머
// ════════════════════════════════════════════════════
function MeditationTimer({ grade, onGradeChange, requireLogin }: { grade: GradeCode; onGradeChange: (g: GradeCode) => void; requireLogin: (action: () => void) => void }) {
  const steps = getMeditationSteps(grade)
  const [phase, setPhase] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [emotionColor, setEmotionColor] = useState<string>('')
  const [emotionTemp, setEmotionTemp] = useState<number>(5)
  const [note, setNote] = useState('')
  const startedRef = useRef(new Date().toISOString())

  // 타이머 인터벌
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      setElapsed((e) => e + 1)
      setTotalElapsed((t) => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // 스텝 자동 전진
  useEffect(() => {
    if (phase !== 'running') return
    if (elapsed >= steps[stepIdx].duration) {
      if (stepIdx < steps.length - 1) {
        setStepIdx((s) => s + 1)
        setElapsed(0)
      } else {
        setPhase('completed')
      }
    }
  }, [elapsed, phase, stepIdx, steps])

  function handleStart() {
    startedRef.current = new Date().toISOString()
    setPhase('running')
  }

  function handleReset() {
    setPhase('idle')
    setStepIdx(0)
    setElapsed(0)
    setTotalElapsed(0)
    setEmotionColor('')
    setNote('')
  }

  function handleSave() {
    const rec: MeditationRecord = {
      id: startedRef.current,
      date: todayStr(),
      grade,
      completedSteps: phase === 'completed' ? 5 : stepIdx,
      durationSeconds: totalElapsed,
      ...(grade === 'age6' && emotionColor ? { emotionColor } : {}),
      ...(grade === 'age7' && emotionTemp ? { emotionTemp } : {}),
      note,
    }
    saveMeditationRecord(rec)
    handleReset()
    alert('묵상 기록을 저장했습니다.')
  }

  const step = steps[stepIdx]
  const gradeDef = GRADE_GROUPS.find((g) => g.id === grade)!

  // ── 완료 화면 ────────────────────────────────────
  if (phase === 'completed') {
    return (
      <div className="space-y-4">
        <div className="card p-5 text-center space-y-3">
          <p className="text-5xl">✨</p>
          <p className="text-xl font-bold text-gray-800">3분 묵상 완료!</p>
          <p className="text-sm text-gray-500">총 {Math.floor(totalElapsed / 60)}분 {totalElapsed % 60}초 집중했어요.</p>
        </div>

        {/* 6세: 감정 색깔 카드 */}
        {grade === 'age6' && (
          <div className="card p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">지금 기분이 어때요? 색깔을 골라보세요.</p>
            <div className="grid grid-cols-4 gap-2">
              {EMOTION_COLORS.map((ec) => (
                <button
                  key={ec.id}
                  onClick={() => setEmotionColor(ec.id)}
                  className={`rounded-2xl py-3 text-center transition-all ${
                    emotionColor === ec.id ? 'ring-2 ring-offset-1 scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: ec.color + '33',
                    outline: emotionColor === ec.id ? `2px solid ${ec.color}` : 'none',
                  }}
                >
                  <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: ec.color }} />
                  <p className="text-[10px] font-bold text-gray-700">{ec.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7세: 감정 온도계 */}
        {grade === 'age7' && (
          <div className="card p-4 space-y-2">
            <p className="text-sm font-bold text-gray-700">감정 온도계: 지금 기분은 몇 점인가요?</p>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  onClick={() => setEmotionTemp(n)}
                  className="w-8 h-8 rounded-full text-xs font-bold border-2 transition-all"
                  style={{
                    backgroundColor: n <= emotionTemp ? '#3b82f6' : 'transparent',
                    borderColor: '#3b82f6',
                    color: n <= emotionTemp ? 'white' : '#3b82f6',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">1=매우 낮음 · 10=매우 높음</p>
          </div>
        )}

        <div className="card p-4 space-y-2">
          <label className="block text-sm font-bold text-gray-700">오늘 묵상 메모 (선택)</label>
          <textarea
            className="input-field resize-none" rows={3}
            placeholder="오늘 묵상에서 기억하고 싶은 한 마디를 적어보세요."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleReset} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm">
            처음으로
          </button>
          <button
            onClick={() => requireLogin(handleSave)}
            className="flex-2 flex-grow-[2] py-3 rounded-2xl bg-green-600 text-white font-bold text-sm active:scale-95"
          >
            기록 저장
          </button>
        </div>
      </div>
    )
  }

  // ── 진행 중 / 대기 화면 ─────────────────────────
  return (
    <div className="space-y-4">
      {/* 학년군 선택 */}
      {phase === 'idle' && (
        <div className="card p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">학년군 선택.</p>
          <div className="flex gap-1.5 flex-wrap">
            {GRADE_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => onGradeChange(g.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  grade === g.id
                    ? `${g.headerBg} text-white border-transparent`
                    : `bg-white ${g.textColor} border-gray-200`
                }`}
              >
                {g.icon} {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 스텝 진행 점 */}
      <div className="flex justify-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`rounded-full transition-all ${
              i < stepIdx ? 'w-2 h-2 bg-green-400' :
              i === stepIdx ? 'w-3 h-3 bg-green-600' :
              'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* 현재 스텝 카드 */}
      <div
        className="card p-5 text-center space-y-3"
        style={{ backgroundColor: phase === 'idle' ? 'white' : '#f0fdf4' }}
      >
        <p className="text-5xl">{step.emoji}</p>
        <p className="text-lg font-bold text-gray-800">
          {stepIdx + 1}단계: {step.label}
        </p>

        {phase !== 'idle' && (
          <TimerRing elapsed={elapsed} duration={step.duration} color="#16a34a" />
        )}

        <p className="text-sm text-gray-600 leading-relaxed px-2">{step.guide}</p>

        {phase === 'idle' && (
          <p className="text-xs text-gray-400">총 5단계 · 약 3분</p>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="flex gap-2">
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm active:scale-95"
          >
            🧘 묵상 시작
          </button>
        )}
        {phase === 'running' && (
          <>
            <button
              onClick={() => setPhase('paused')}
              className="flex-1 py-3 rounded-2xl bg-yellow-500 text-white font-bold text-sm"
            >
              ⏸ 일시정지
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm"
            >
              ✕
            </button>
          </>
        )}
        {phase === 'paused' && (
          <>
            <button
              onClick={() => setPhase('running')}
              className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-bold text-sm"
            >
              ▶ 계속하기
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* 최근 묵상 기록 */}
      <RecentMeditationLog grade={grade} gradeDef={gradeDef} />
    </div>
  )
}

// ── 최근 묵상 기록 (3개) ───────────────────────────────
function RecentMeditationLog({ grade, gradeDef }: { grade: GradeCode; gradeDef: (typeof GRADE_GROUPS)[0] }) {
  const log = loadMeditationLog().filter((r) => r.grade === grade).slice(0, 3)
  if (log.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500">{gradeDef.name} 최근 묵상 기록.</p>
      {log.map((rec) => (
        <div key={rec.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
          <span className="text-xl">{rec.completedSteps >= 5 ? '✨' : rec.completedSteps >= 3 ? '🌱' : '💭'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700">{rec.date}</p>
            {rec.note && <p className="text-xs text-gray-500 truncate italic">"{rec.note}"</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500">{rec.completedSteps}/5단계</p>
            {rec.emotionColor && (
              <div
                className="w-4 h-4 rounded-full ml-auto mt-0.5"
                style={{ backgroundColor: EMOTION_COLORS.find(e => e.id === rec.emotionColor)?.color ?? '#gray' }}
              />
            )}
            {rec.emotionTemp !== undefined && (
              <p className="text-xs font-bold text-blue-500">{rec.emotionTemp}점</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════
// 탭 2 — 신체 기록
// ════════════════════════════════════════════════════
function BodyLog({ grade }: { grade: GradeCode }) {
  const [planner, setPlanner] = useState<PlannerData>(() => loadTodayPlanner(grade))
  const target = BODY_TARGETS[grade]

  function update(key: keyof PlannerData['body'], value: number | boolean) {
    const updated = { ...planner, body: { ...planner.body, [key]: value } }
    setPlanner(updated)
    saveTodayBody(updated)
  }

  const items = [
    {
      key: 'sleep' as const,
      label: '수면', icon: '😴', unit: '시간',
      value: planner.body.sleep,
      target: target.sleep,
      met: planner.body.sleep >= target.sleep,
    },
    {
      key: 'exercise' as const,
      label: '운동', icon: '🏃', unit: '분',
      value: planner.body.exercise,
      target: target.exercise,
      met: planner.body.exercise >= target.exercise,
    },
    {
      key: 'water' as const,
      label: '수분', icon: '💧', unit: '잔',
      value: planner.body.water,
      target: target.water,
      met: planner.body.water >= target.water,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <div>
            <p className="font-bold text-gray-800 text-sm">오늘 신체 기록</p>
            <p className="text-xs text-gray-400">{todayStr()}</p>
          </div>
        </div>

        {items.map(({ key, label, icon, unit, value, target: t, met }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{icon} {label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                met ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                목표 {t}{unit} {met ? '✓' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => update(key, Math.max(0, value - (key === 'sleep' ? 0.5 : 1)))}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center active:scale-90"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-gray-800">{value}</span>
                <span className="text-sm text-gray-400 ml-1">{unit}</span>
              </div>
              <button
                onClick={() => update(key, value + (key === 'sleep' ? 0.5 : 1))}
                className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-bold text-lg flex items-center justify-center active:scale-90"
              >
                +
              </button>
            </div>
            {/* 진행 바 */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (value / t) * 100)}%`,
                  backgroundColor: met ? '#16a34a' : '#60a5fa',
                }}
              />
            </div>
          </div>
        ))}

        {/* 아침 식사 */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-gray-700">🍳 아침 식사</span>
          <button
            onClick={() => update('breakfast', !planner.body.breakfast)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              planner.body.breakfast
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {planner.body.breakfast ? '✓ 먹었어요' : '아직'}
          </button>
        </div>
      </div>

      <div className="bg-green-50 rounded-2xl p-3">
        <p className="text-xs font-bold text-green-700 mb-1">
          {GRADE_GROUPS.find(g => g.id === grade)?.icon} {GRADE_GROUPS.find(g => g.id === grade)?.name} 권장 기준
        </p>
        <p className="text-xs text-green-600">
          수면 {target.sleep}시간 이상 · 운동 {target.exercise}분 이상 · 물 {target.water}잔 이상 · 아침 식사 필수
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 탭 3 — 주간 신체 현황 히트맵
// ════════════════════════════════════════════════════
function WeeklyBodyChart({ grade }: { grade: GradeCode }) {
  const target = BODY_TARGETS[grade]

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const dayData = days.map((date) => {
    try {
      const raw = localStorage.getItem(PLANNER_KEY(date))
      if (!raw) return null
      const p = JSON.parse(raw) as PlannerData
      return p.body
    } catch { return null }
  })

  type CellStatus = 'good' | 'partial' | 'miss' | 'none'

  function sleepStatus(v: number | null): CellStatus {
    if (v === null || v === 0) return 'none'
    if (v >= target.sleep) return 'good'
    if (v >= target.sleep * 0.7) return 'partial'
    return 'miss'
  }
  function exerciseStatus(v: number | null): CellStatus {
    if (v === null) return 'none'
    if (v >= target.exercise) return 'good'
    if (v >= target.exercise * 0.5) return 'partial'
    return v === 0 ? 'none' : 'miss'
  }
  function waterStatus(v: number | null): CellStatus {
    if (v === null) return 'none'
    if (v >= target.water) return 'good'
    if (v >= Math.floor(target.water * 0.5)) return 'partial'
    return v === 0 ? 'none' : 'miss'
  }
  function breakfastStatus(v: boolean | null): CellStatus {
    if (v === null) return 'none'
    return v ? 'good' : 'miss'
  }

  const STATUS_STYLE: Record<CellStatus, string> = {
    good:    'bg-green-400',
    partial: 'bg-yellow-300',
    miss:    'bg-red-200',
    none:    'bg-gray-100',
  }

  const ROWS = [
    { key: 'sleep',     label: '수면', icon: '😴' },
    { key: 'exercise',  label: '운동', icon: '🏃' },
    { key: 'water',     label: '수분', icon: '💧' },
    { key: 'breakfast', label: '아침', icon: '🍳' },
  ]

  function getStatus(key: string, body: PlannerData['body'] | null): CellStatus {
    if (!body) return 'none'
    if (key === 'sleep')     return sleepStatus(body.sleep)
    if (key === 'exercise')  return exerciseStatus(body.exercise)
    if (key === 'water')     return waterStatus(body.water)
    if (key === 'breakfast') return breakfastStatus(body.breakfast)
    return 'none'
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="font-bold text-gray-700 text-sm mb-3">📊 최근 7일 신체 기록</p>
        {/* 날짜 헤더 */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div />
          {days.map((d) => {
            const date = new Date(d + 'T00:00:00')
            const isToday = d === todayStr()
            return (
              <div key={d} className="text-center">
                <p className={`text-[10px] font-bold ${isToday ? 'text-green-600' : 'text-gray-400'}`}>
                  {['일','월','화','수','목','금','토'][date.getDay()]}
                </p>
                <p className={`text-[10px] ${isToday ? 'text-green-600 font-bold' : 'text-gray-300'}`}>
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>
        {/* 히트맵 그리드 */}
        {ROWS.map(({ key, label, icon }) => (
          <div key={key} className="grid grid-cols-8 gap-1 mb-1.5">
            <div className="flex items-center gap-0.5">
              <span className="text-xs">{icon}</span>
              <span className="text-[10px] text-gray-500 hidden sm:block">{label}</span>
            </div>
            {dayData.map((body, i) => (
              <div
                key={i}
                className={`h-7 rounded-md ${STATUS_STYLE[getStatus(key, body)]}`}
                title={days[i]}
              />
            ))}
          </div>
        ))}
        {/* 범례 */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {[
            { s: 'good',    label: '달성' },
            { s: 'partial', label: '부분' },
            { s: 'miss',    label: '미달' },
            { s: 'none',    label: '미기록' },
          ].map(({ s, label }) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${STATUS_STYLE[s as CellStatus]}`} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 이번 주 요약 */}
      <div className="card p-4">
        <p className="text-xs font-bold text-gray-600 mb-2">이번 주 달성 횟수 (7일 기준)</p>
        <div className="grid grid-cols-2 gap-2">
          {ROWS.map(({ key, label, icon }) => {
            const count = dayData.filter((b) => b && getStatus(key, b) === 'good').length
            return (
              <div key={key} className={`flex items-center gap-2 p-2 rounded-xl ${count >= 5 ? 'bg-green-50' : 'bg-gray-50'}`}>
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-base font-bold ${count >= 5 ? 'text-green-700' : 'text-gray-700'}`}>
                    {count}일 / 7일
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 탭 4 — 부모/교사 코멘트 (PIN 잠금)
// ════════════════════════════════════════════════════
function CommentSection({ requireLogin }: { requireLogin: (action: () => void) => void }) {
  const [pinState, setPinState] = useState<'locked' | 'setup' | 'unlocked'>(() => {
    return getPin() ? 'locked' : 'setup'
  })
  const [pinInput, setPinInput] = useState('')
  const [from, setFrom] = useState<'teacher' | 'parent'>('teacher')
  const [newText, setNewText] = useState('')
  const [error, setError] = useState('')
  const comments = loadComments()

  function handlePinSetup() {
    if (pinInput.length !== 4) { setError('4자리 숫자를 입력하세요.'); return }
    setPin(pinInput)
    setPinState('unlocked')
    setPinInput('')
    setError('')
  }

  function handlePinUnlock() {
    if (pinInput === getPin()) {
      setPinState('unlocked')
      setPinInput('')
      setError('')
    } else {
      setError('PIN이 틀렸습니다.')
      setPinInput('')
    }
  }

  function handleSaveComment() {
    if (!newText.trim()) return
    const comment: TeacherComment = {
      id: new Date().toISOString(),
      date: todayStr(),
      from,
      text: newText.trim(),
    }
    saveComment(comment)
    setNewText('')
    // 컴포넌트 리렌더: state 없이 저장 후 refresh
    window.location.reload()
  }

  function handleResetPin() {
    if (!confirm('PIN을 초기화하면 모든 코멘트가 유지되지만 새 PIN을 설정해야 합니다. 계속하시겠습니까?')) return
    localStorage.removeItem(TEACHER_PIN_KEY)
    setPinState('setup')
    setPinInput('')
    setError('')
  }

  if (pinState === 'setup') {
    return (
      <div className="card p-6 space-y-4 text-center">
        <p className="text-4xl">🔒</p>
        <p className="font-bold text-gray-800">부모/교사 코멘트 공간</p>
        <p className="text-sm text-gray-500">학생이 볼 수 없도록 4자리 PIN을 설정하세요.</p>
        <PinInput value={pinInput} onChange={setPinInput} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handlePinSetup}
          className="w-full py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95"
        >
          PIN 설정하기
        </button>
      </div>
    )
  }

  if (pinState === 'locked') {
    return (
      <div className="card p-6 space-y-4 text-center">
        <p className="text-4xl">🔒</p>
        <p className="font-bold text-gray-800">PIN을 입력하세요</p>
        <p className="text-sm text-gray-500">부모/교사 전용 공간입니다.</p>
        <PinInput value={pinInput} onChange={setPinInput} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handlePinUnlock}
          className="w-full py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95"
        >
          잠금 해제
        </button>
        <button onClick={handleResetPin} className="text-xs text-gray-400 underline">
          PIN 잊어버렸어요
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">💬 부모/교사 코멘트</p>
        <button
          onClick={() => setPinState('locked')}
          className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full"
        >
          🔒 잠금
        </button>
      </div>

      {/* 새 코멘트 */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          {(['teacher', 'parent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFrom(f)}
              className={`flex-1 py-2 rounded-full text-xs font-bold border transition-all ${
                from === f ? 'bg-teal-600 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {f === 'teacher' ? '👩‍🏫 선생님' : '👪 부모님'}
            </button>
          ))}
        </div>
        <textarea
          className="input-field resize-none" rows={3}
          placeholder="학생에게 전달하고 싶은 피드백이나 응원 메시지를 남겨주세요."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button
          onClick={() => requireLogin(handleSaveComment)}
          className="w-full py-2.5 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95"
        >
          저장
        </button>
      </div>

      {/* 코멘트 목록 */}
      {comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">아직 코멘트가 없어요.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-teal-700">
                  {c.from === 'teacher' ? '👩‍🏫 선생님' : '👪 부모님'}
                </span>
                <span className="text-xs text-gray-400">{c.date}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PIN 입력 컴포넌트 ──────────────────────────────────
function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
              value.length > i ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-300 text-gray-300'
            }`}
          >
            {value.length > i ? '●' : '○'}
          </div>
        ))}
      </div>
      <input
        type="tel"
        maxLength={4}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="input-field text-center text-2xl tracking-[1rem] font-mono"
        placeholder="0000"
      />
    </div>
  )
}

// ════════════════════════════════════════════════════
// 메인 페이지
// ════════════════════════════════════════════════════
type TabKey = 'timer' | 'body' | 'weekly' | 'comment'

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'timer',   icon: '🧘', label: '묵상' },
  { key: 'body',    icon: '💪', label: '신체 기록' },
  { key: 'weekly',  icon: '📊', label: '주간 현황' },
  { key: 'comment', icon: '💬', label: '코멘트' },
]

export function MeditationPage() {
  const navigate = useNavigate()
  const { requireLogin } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('timer')
  const [grade, setGrade] = useState<GradeCode>(
    () => (localStorage.getItem(MEDITATION_GRADE_KEY) as GradeCode | null) ?? 'elem46'
  )

  function handleGradeChange(g: GradeCode) {
    setGrade(g)
    localStorage.setItem(MEDITATION_GRADE_KEY, g)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className="bg-green-700 text-white px-4 pt-6 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
          ← 뒤로
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧘</span>
          <div>
            <h1 className="text-xl font-bold">3분 묵상 + 신체 기록</h1>
            <p className="text-white/80 text-sm">감사·회상·수용·다짐·조절 5단계 루틴</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ── 탭 ── */}
        <div className="flex gap-1.5 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex flex-col items-center py-2 rounded-2xl text-xs font-bold border transition-all ${
                activeTab === t.key
                  ? 'bg-green-700 text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'timer'   && <MeditationTimer grade={grade} onGradeChange={handleGradeChange} requireLogin={requireLogin} />}
        {activeTab === 'body'    && <BodyLog grade={grade} />}
        {activeTab === 'weekly'  && <WeeklyBodyChart grade={grade} />}
        {activeTab === 'comment' && <CommentSection requireLogin={requireLogin} />}
      </div>
    </div>
  )
}
