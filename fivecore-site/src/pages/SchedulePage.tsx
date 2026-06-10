// 주간 학습 계획표 — 요일별 시간대 학습 블록 편집/완료 체크
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAcademyData } from '../context/AcademyDataContext'
import {
  DAY_LABELS,
  TIME_SLOTS,
  SCHEDULE_SUBJECTS,
  calcScheduleStats,
  getDayDates,
  getWeekKey,
  loadWeekSchedule,
  makeBlock,
  offsetWeek,
  saveWeekSchedule,
  type ScheduleBlock,
  type WeekSchedule,
} from '../data/schedule'

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180]

// ── 블록 카드 ─────────────────────────────────────────────
function BlockCard({
  block,
  onToggleDone,
  onUpdate,
  onDelete,
}: {
  block: ScheduleBlock
  onToggleDone: () => void
  onUpdate: (patch: Partial<ScheduleBlock>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)

  function handleSubjectChange(s: string) {
    const colorMap: Record<string, string> = {
      국어: '#3b82f6', 수학: '#ef4444', 영어: '#10b981',
      사회: '#f59e0b', 과학: '#8b5cf6', 독서: '#06b6d4', 기타: '#6b7280',
    }
    onUpdate({ subject: s, color: colorMap[s] ?? '#6b7280' })
  }

  return (
    <div
      className={`rounded-xl border-l-4 p-2.5 transition-all ${block.done ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: block.color, background: block.color + '14' }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDone}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all ${
            block.done ? 'text-white' : 'border-gray-300'
          }`}
          style={block.done ? { background: block.color, borderColor: block.color } : {}}
        >
          {block.done ? '✓' : ''}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold rounded-full px-1.5 py-0.5 text-white flex-shrink-0"
              style={{ background: block.color }}
            >
              {block.subject}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">{block.durationMin}분</span>
            {block.title && (
              <span className="text-xs text-gray-700 truncate">{block.title}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((p) => !p)}
          className="text-gray-400 text-sm px-1"
        >
          {editing ? '✕' : '✎'}
        </button>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-400 text-sm px-0.5">
          ×
        </button>
      </div>

      {editing && (
        <div className="mt-2 space-y-1.5 pt-2 border-t border-gray-200">
          <div className="flex gap-2">
            <select
              value={block.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 flex-1"
            >
              {SCHEDULE_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={block.durationMin}
              onChange={(e) => onUpdate({ durationMin: Number(e.target.value) })}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}분</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="세부 내용 (예: 2단원 연습문제)"
            className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 placeholder-gray-300"
          />
        </div>
      )}
    </div>
  )
}

// ── 일별 블록 패널 ────────────────────────────────────────
function DayPanel({
  day,
  dayDate,
  schedule,
  onChange,
}: {
  day: number
  dayDate: Date
  schedule: WeekSchedule
  onChange: (s: WeekSchedule) => void
}) {
  const dayBlocks = schedule.blocks.filter((b) => b.day === day)

  function addBlock(slot: number) {
    const b = makeBlock(day, slot)
    onChange({ ...schedule, blocks: [...schedule.blocks, b], updatedAt: new Date().toISOString() })
  }

  function updateBlock(id: string, patch: Partial<ScheduleBlock>) {
    onChange({
      ...schedule,
      blocks: schedule.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      updatedAt: new Date().toISOString(),
    })
  }

  function deleteBlock(id: string) {
    onChange({
      ...schedule,
      blocks: schedule.blocks.filter((b) => b.id !== id),
      updatedAt: new Date().toISOString(),
    })
  }

  const isToday = dayDate.toDateString() === new Date().toDateString()
  const mmdd = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`

  return (
    <div>
      <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {DAY_LABELS[day]}
        </span>
        <span className="text-xs text-gray-400">{mmdd}</span>
        {dayBlocks.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {dayBlocks.filter((b) => b.done).length}/{dayBlocks.length} 완료
          </span>
        )}
      </div>

      <div className="space-y-3">
        {TIME_SLOTS.map((slot, si) => {
          const slotBlocks = dayBlocks.filter((b) => b.slot === si)
          return (
            <div key={si}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{slot.icon}</span>
                <span className="text-xs font-semibold text-gray-500">{slot.label}</span>
                <span className="text-[10px] text-gray-300">{slot.hours}</span>
              </div>

              <div className="space-y-1.5 pl-1">
                {slotBlocks.map((b) => (
                  <BlockCard
                    key={b.id}
                    block={b}
                    onToggleDone={() => updateBlock(b.id, { done: !b.done })}
                    onUpdate={(patch) => updateBlock(b.id, patch)}
                    onDelete={() => deleteBlock(b.id)}
                  />
                ))}
                <button
                  onClick={() => addBlock(si)}
                  className="text-xs text-gray-400 hover:text-blue-500 pl-1 transition-colors"
                >
                  + 추가
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────
export function SchedulePage() {
  const navigate = useNavigate()
  const { data: academyData, syncSchedule } = useAcademyData()

  const [weekKey, setWeekKey] = useState(() => getWeekKey())
  const [schedule, setSchedule] = useState<WeekSchedule>(() => loadWeekSchedule(getWeekKey()))
  const [activeDay, setActiveDay] = useState<number>(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })

  const dayDates = getDayDates(weekKey)
  const stats = calcScheduleStats(schedule)

  const updateSchedule = useCallback((s: WeekSchedule) => {
    setSchedule(s)
    saveWeekSchedule(s)
    syncSchedule(s)
  }, [syncSchedule])

  function gotoWeek(delta: number) {
    const newKey = offsetWeek(weekKey, delta)
    setWeekKey(newKey)
    setSchedule(loadWeekSchedule(newKey))
  }

  // 아카데미 최근 학습 주제로 블록 빠른 추가
  function quickAddFromAcademy(title: string, day: number) {
    const subjectMap: Record<string, string> = {
      수학: '수학', 영어: '영어', 국어: '국어', 사회: '사회', 과학: '과학',
    }
    const subject = Object.keys(subjectMap).find((k) => title.includes(k)) ?? '기타'
    const b = makeBlock(day, 1) // 오전 슬롯 기본
    const updated: ScheduleBlock = { ...b, subject, title: title.slice(0, 20) }
    updateSchedule({
      ...schedule,
      blocks: [...schedule.blocks, updated],
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-teal-600 to-teal-500 text-white px-4 pt-6 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold">📅 학습 계획표</h1>
            <button onClick={() => navigate(-1)} className="text-white/60 text-sm">← 뒤로</button>
          </div>

          {/* 주차 네비게이션 */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => gotoWeek(-1)}
              className="bg-white/20 rounded-xl px-3 py-1.5 text-sm font-semibold"
            >
              ‹ 이전
            </button>
            <span className="flex-1 text-center text-sm font-semibold">
              {schedule.weekLabel}
            </span>
            <button
              onClick={() => gotoWeek(1)}
              className="bg-white/20 rounded-xl px-3 py-1.5 text-sm font-semibold"
            >
              다음 ›
            </button>
          </div>

          {/* 주간 달성률 */}
          {stats.total > 0 && (
            <div className="mt-3 bg-white/20 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>주간 달성률</span>
                <span className="font-bold">{stats.rate}%</span>
              </div>
              <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${stats.rate}%` }}
                />
              </div>
              <p className="text-[10px] text-white/70 mt-1">
                {stats.done}/{stats.total} 블록 · 총 {Math.round(stats.totalMin / 60 * 10) / 10}시간 계획
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* 주간 목표 */}
        <div className="card p-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">🎯 이번 주 학습 목표</label>
          <input
            type="text"
            value={schedule.weeklyGoal}
            onChange={(e) =>
              updateSchedule({ ...schedule, weeklyGoal: e.target.value, updatedAt: new Date().toISOString() })
            }
            placeholder="예: 수학 2단원 완성, 영어 단어 50개"
            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 placeholder-gray-300"
          />
        </div>

        {/* 아카데미 빠른 추가 */}
        {academyData && academyData.recentSubjects.length > 0 && (
          <div className="card p-3 bg-teal-50 border border-teal-100">
            <p className="text-xs font-semibold text-teal-700 mb-2">
              📚 최근 아카데미 학습 — 오늘({DAY_LABELS[activeDay]}) 계획에 빠른 추가
            </p>
            <div className="flex flex-wrap gap-1.5">
              {academyData.recentSubjects.slice(0, 5).map((s, i) => (
                <button
                  key={i}
                  onClick={() => quickAddFromAcademy(s.title, activeDay)}
                  className="text-[11px] px-2.5 py-1 bg-white border border-teal-200 rounded-full text-teal-700 font-medium active:scale-95 transition-all hover:bg-teal-100"
                >
                  + {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 요일 선택 탭 */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {DAY_LABELS.map((label, i) => {
            const d = dayDates[i]
            const isToday = d.toDateString() === new Date().toDateString()
            const hasDone = schedule.blocks.some((b) => b.day === i && b.done)
            const hasBlocks = schedule.blocks.some((b) => b.day === i)
            return (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all text-xs font-semibold relative ${
                  activeDay === i
                    ? 'bg-teal-600 text-white'
                    : isToday
                      ? 'bg-teal-50 text-teal-600 border border-teal-200'
                      : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                <span>{label}</span>
                <span className="text-[9px] opacity-70">{d.getMonth() + 1}/{d.getDate()}</span>
                {hasBlocks && (
                  <span
                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${hasDone ? 'bg-green-400' : 'bg-amber-400'}`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* 일별 상세 패널 */}
        <div className="card p-4">
          <DayPanel
            day={activeDay}
            dayDate={dayDates[activeDay]}
            schedule={schedule}
            onChange={updateSchedule}
          />
        </div>
      </div>
    </div>
  )
}
