// 디지털 학습 플래너 — 목표 설정·실행·성찰·달성률 자동 계산
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  KINDIE_ACTIVITIES,
  SUBJECTS,
  PRIORITY_OPTIONS,
  makePlannerData,
  calcAchievementRate,
  calcCycleRate,
  calcOverallRate,
  formatDate,
  todayStr,
  recentDates,
  PLANNER_KEY,
  GRADE_PREF_KEY,
  type Goal,
  type Priority,
  type PlannerData,
} from '../data/planner'
import { GRADE_GROUPS, CYCLE_STEPS } from '../data/grades'
import type { CycleStep } from '../types'

// ── 학년 그룹 판별 ─────────────────────────────────────
const isKindieGrade = (g: string) => g === 'age6' || g === 'age7'
const isSmartGrade = (g: string) => ['elem46', 'mid', 'high'].includes(g)
const isMidHigh = (g: string) => g === 'mid' || g === 'high'

// ── localStorage 로드/초기화 ───────────────────────────
function loadOrInit(date: string, grade: string): PlannerData {
  const saved = localStorage.getItem(PLANNER_KEY(date))
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as PlannerData
      // grade가 변경되었으면 유지하되 grade 필드 업데이트
      return { ...parsed, grade: grade || parsed.grade }
    } catch {
      /* fall through */
    }
  }
  return makePlannerData(date, grade)
}

// ──────────────────────────────────────────────────────
// PlannerPage
// ──────────────────────────────────────────────────────
export function PlannerPage() {
  const navigate = useNavigate()
  const { isLoggedIn, openLoginModal } = useAuth()
  const today = todayStr()

  const [savedGrade] = useState(() => localStorage.getItem(GRADE_PREF_KEY) ?? '')
  const [data, setData] = useState<PlannerData>(() => loadOrInit(today, savedGrade))
  const [tab, setTab] = useState<'today' | 'history'>('today')

  // 자동 저장 (로그인 상태일 때만)
  useEffect(() => {
    if (data.grade && isLoggedIn) {
      localStorage.setItem(PLANNER_KEY(data.date), JSON.stringify(data))
      localStorage.setItem(GRADE_PREF_KEY, data.grade)
    }
  }, [data, isLoggedIn])

  const update = useCallback((partial: Partial<PlannerData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  // 학년군 설정
  function setGrade(grade: string) {
    update({ grade })
  }

  // ── 목표 조작 ────────────────────────────────────────
  function addGoal() {
    const newGoal: Goal = {
      id: Date.now().toString(),
      subject: '국어',
      text: '',
      estimatedMin: 30,
      priority: 'mid',
      done: null,
      unit: '',
      measurable: '',
    }
    update({ goals: [...data.goals, newGoal] })
  }

  function updateGoal(id: string, patch: Partial<Goal>) {
    update({ goals: data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
  }

  function removeGoal(id: string) {
    update({ goals: data.goals.filter((g) => g.id !== id) })
  }

  // ── 6/7세 활동 조작 ──────────────────────────────────
  function toggleKindieSelect(id: string) {
    const selected = data.kindieSelected.includes(id)
      ? data.kindieSelected.filter((x) => x !== id)
      : [...data.kindieSelected, id]
    // 선택 해제 시 완료 목록에서도 제거
    const completed = data.kindieCompleted.filter((x) => selected.includes(x))
    update({ kindieSelected: selected, kindieCompleted: completed })
  }

  function toggleKindieComplete(id: string) {
    const completed = data.kindieCompleted.includes(id)
      ? data.kindieCompleted.filter((x) => x !== id)
      : [...data.kindieCompleted, id]
    update({ kindieCompleted: completed })
  }

  // ── 사이클 체크 ───────────────────────────────────────
  function toggleCycle(key: CycleStep) {
    update({ cycleChecked: { ...data.cycleChecked, [key]: !data.cycleChecked[key] } })
  }

  // ── 계산값 ────────────────────────────────────────────
  const achRate = calcAchievementRate(data)
  const cycleRate = calcCycleRate(data)
  const overallRate = calcOverallRate(data)
  const gradeInfo = GRADE_GROUPS.find((g) => g.id === data.grade)
  const cycleCount = Object.values(data.cycleChecked).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-600 text-white px-4 pt-6 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold">📝 학습 플래너</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-white/60 text-sm"
            >
              ← 뒤로
            </button>
          </div>
          <p className="text-blue-200 text-sm">{formatDate(data.date)}</p>

          {/* 학년군 선택 */}
          <div className="mt-3">
            <select
              value={data.grade}
              onChange={(e) => setGrade(e.target.value)}
              className="bg-white/20 text-white text-sm rounded-xl px-3 py-2 border border-white/30 appearance-none pr-8"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='white' d='M6 8L0 0h12z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="" className="text-gray-800">학년군 선택</option>
              {GRADE_GROUPS.map((g) => (
                <option key={g.id} value={g.id} className="text-gray-800">
                  {g.icon} {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 학년군 미선택 안내 ─────────────────────────── */}
      {!data.grade && (
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-600 mb-4 text-sm">위에서 학년군을 선택하면 맞춤 플래너가 시작됩니다.</p>
          <div className="grid grid-cols-2 gap-3">
            {GRADE_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGrade(g.id)}
                className={`card border-2 ${g.borderColor} ${g.hoverBg} p-3 text-left active:scale-95 transition-all`}
              >
                <span className="text-xl">{g.icon}</span>
                <span className="font-semibold text-gray-800 text-sm ml-2">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.grade && (
        <div className="max-w-lg mx-auto">
          {/* ── 종합 달성률 카드 ─────────────────────────── */}
          <div className="px-4 pt-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">오늘 종합 달성률</span>
                <span
                  className={`text-lg font-bold ${
                    overallRate >= 80
                      ? 'text-green-600'
                      : overallRate >= 50
                        ? 'text-blue-600'
                        : 'text-gray-500'
                  }`}
                >
                  {overallRate}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    gradeInfo?.headerBg ?? 'bg-blue-500'
                  }`}
                  style={{ width: `${overallRate}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>📋 목표 {achRate}%</span>
                <span>
                  🔄 사이클 {cycleCount}/5 ({cycleRate}%)
                </span>
              </div>
            </div>
          </div>

          {/* ── 탭 ──────────────────────────────────────── */}
          <div className="px-4 mt-4 flex border-b border-gray-200">
            {(['today', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-400'
                }`}
              >
                {t === 'today' ? '오늘 플래너' : '이전 기록'}
              </button>
            ))}
          </div>

          {/* ── 오늘 탭 ─────────────────────────────────── */}
          {tab === 'today' && (
            <div className="px-4 pt-4 space-y-4">
              {/* 목표 섹션 */}
              {isKindieGrade(data.grade) ? (
                <KindieGoals
                  selected={data.kindieSelected}
                  completed={data.kindieCompleted}
                  onToggleSelect={toggleKindieSelect}
                  onToggleComplete={toggleKindieComplete}
                />
              ) : (
                <GoalsSection
                  goals={data.goals}
                  isSmart={isSmartGrade(data.grade)}
                  onAdd={addGoal}
                  onUpdate={updateGoal}
                  onRemove={removeGoal}
                />
              )}

              {/* 에너지 레벨 (중/고등) */}
              {isMidHigh(data.grade) && (
                <EnergySection
                  level={data.energyLevel}
                  onChange={(v) => update({ energyLevel: v })}
                />
              )}

              {/* 5단계 사이클 체크 */}
              <CycleSection checked={data.cycleChecked} onToggle={toggleCycle} />

              {/* 신체 기록 */}
              <BodySection
                body={data.body}
                onChange={(body) => update({ body })}
                grade={data.grade}
              />

              {/* 성찰 */}
              <ReflectionSection
                reflection={data.reflection}
                onChange={(r) => update({ reflection: r })}
                isKindie={isKindieGrade(data.grade)}
              />

              {/* 저장 완료 안내 */}
              <div className="text-center pb-2">
                {isLoggedIn
                  ? <p className="text-xs text-gray-400">변경할 때마다 자동 저장됩니다.</p>
                  : <button onClick={openLoginModal} className="text-xs text-amber-600 underline">로그인하면 자동 저장됩니다.</button>
                }
              </div>
            </div>
          )}

          {/* ── 이전 기록 탭 ─────────────────────────────── */}
          {tab === 'history' && <HistoryView currentGrade={data.grade} />}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// 6/7세 활동 카드 선택
// ═══════════════════════════════════════════════
function KindieGoals({
  selected,
  completed,
  onToggleSelect,
  onToggleComplete,
}: {
  selected: string[]
  completed: string[]
  onToggleSelect: (id: string) => void
  onToggleComplete: (id: string) => void
}) {
  return (
    <div className="card p-4">
      <h3 className="font-bold text-gray-800 mb-1">오늘 배울 것 선택</h3>
      <p className="text-xs text-gray-400 mb-3">카드를 눌러 선택하세요.</p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {KINDIE_ACTIVITIES.map((act) => {
          const isSelected = selected.includes(act.id)
          return (
            <button
              key={act.id}
              onClick={() => onToggleSelect(act.id)}
              className={`rounded-2xl p-2 text-center transition-all active:scale-95 border-2 ${
                isSelected
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">{act.icon}</div>
              <div className="text-[10px] font-medium leading-tight">{act.label}</div>
            </button>
          )
        })}
      </div>

      {/* 선택된 활동 달성 체크 */}
      {selected.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">했어요? ✓</p>
          <div className="space-y-2">
            {KINDIE_ACTIVITIES.filter((a) => selected.includes(a.id)).map((act) => {
              const isDone = completed.includes(act.id)
              return (
                <div
                  key={act.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2"
                >
                  <span className="text-xl">{act.icon}</span>
                  <span className="flex-1 text-sm text-gray-700">{act.label}</span>
                  <button
                    onClick={() => onToggleComplete(act.id)}
                    className={`w-10 h-8 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                      isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : '○'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// 목표 섹션 (초등 이상)
// ═══════════════════════════════════════════════
function GoalsSection({
  goals,
  isSmart,
  onAdd,
  onUpdate,
  onRemove,
}: {
  goals: Goal[]
  isSmart: boolean
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Goal>) => void
  onRemove: (id: string) => void
}) {
  const doneCount = goals.filter((g) => g.done === true).length
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800">오늘의 학습 목표</h3>
          {goals.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {doneCount}/{goals.length} 달성
            </p>
          )}
        </div>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
        >
          + 목표 추가
        </button>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <p className="text-2xl mb-1">📋</p>
          <p className="text-sm">위 버튼으로 오늘 목표를 추가해보세요.</p>
        </div>
      )}

      <div className="space-y-3">
        {goals.map((goal, idx) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            index={idx + 1}
            isSmart={isSmart}
            onChange={(patch) => onUpdate(goal.id, patch)}
            onRemove={() => onRemove(goal.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// 개별 목표 카드
// ═══════════════════════════════════════════════
function GoalItem({
  goal,
  index,
  isSmart,
  onChange,
  onRemove,
}: {
  goal: Goal
  index: number
  isSmart: boolean
  onChange: (patch: Partial<Goal>) => void
  onRemove: () => void
}) {
  const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === goal.priority)!

  return (
    <div className={`border rounded-2xl overflow-hidden ${goal.done === true ? 'border-green-200 bg-green-50' : goal.done === false ? 'border-red-100 bg-red-50/30' : 'border-gray-200 bg-white'}`}>
      {/* 목표 헤더 */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {index}
        </span>
        {/* 과목 */}
        <select
          value={goal.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          className="text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg px-2 py-1 border-none appearance-none"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {/* 우선순위 */}
        {isSmart && (
          <select
            value={goal.priority}
            onChange={(e) => onChange({ priority: e.target.value as Priority })}
            className={`text-xs font-semibold rounded-lg px-2 py-1 border-none appearance-none ${priorityOption.bgColor} ${priorityOption.textColor}`}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}
        {/* 삭제 */}
        <button
          onClick={onRemove}
          className="ml-auto text-gray-300 hover:text-red-400 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {/* 단원 (SMART) */}
        {isSmart && (
          <input
            type="text"
            placeholder="단원·주제 (예: 분수 나눗셈)"
            value={goal.unit ?? ''}
            onChange={(e) => onChange({ unit: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 placeholder-gray-300"
          />
        )}

        {/* 목표 내용 */}
        <input
          type="text"
          placeholder={isSmart ? '구체적 목표 (예: 기본 문제 5문제 풀기)' : '오늘 목표를 입력하세요'}
          value={goal.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 placeholder-gray-300"
        />

        {/* 측정 기준 (SMART) */}
        {isSmart && (
          <input
            type="text"
            placeholder="측정 기준 (예: 5문제 중 4개 이상 정답)"
            value={goal.measurable ?? ''}
            onChange={(e) => onChange({ measurable: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 placeholder-gray-300"
          />
        )}

        {/* 시간 + 달성 체크 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">예상</span>
          <input
            type="number"
            min={5}
            max={180}
            step={5}
            value={goal.estimatedMin || ''}
            onChange={(e) => onChange({ estimatedMin: Number(e.target.value) })}
            className="w-16 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center"
          />
          <span className="text-xs text-gray-400">분</span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => onChange({ done: true })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${goal.done === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              달성 ✓
            </button>
            <button
              onClick={() => onChange({ done: goal.done === false ? null : false })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${goal.done === false ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              미달성
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// 에너지 레벨 (중/고등)
// ═══════════════════════════════════════════════
function EnergySection({ level, onChange }: { level: number; onChange: (v: number) => void }) {
  const labels = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음']
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500']
  return (
    <div className="card p-4">
      <h3 className="font-bold text-gray-800 mb-3">
        ⚡ 오늘의 에너지 레벨
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full text-white ${colors[level]}`}>
          {labels[level]}
        </span>
      </h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              level === v ? `${colors[v]} text-white` : 'bg-gray-100 text-gray-400'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">에너지가 낮다면 쉬운 과목부터 시작하세요.</p>
    </div>
  )
}

// ═══════════════════════════════════════════════
// 5단계 사이클 체크
// ═══════════════════════════════════════════════
function CycleSection({
  checked,
  onToggle,
}: {
  checked: Record<CycleStep, boolean>
  onToggle: (key: CycleStep) => void
}) {
  const count = Object.values(checked).filter(Boolean).length
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">5단계 사이클 실천</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${count === 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
        >
          {count}/5
        </span>
      </div>
      <div className="space-y-2">
        {CYCLE_STEPS.map((step) => {
          const isDone = checked[step.key]
          return (
            <button
              key={step.key}
              onClick={() => onToggle(step.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all active:scale-[0.98] text-left ${
                isDone ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isDone ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? '✓' : step.number}
              </span>
              <span className="text-lg">{step.icon}</span>
              <div className="flex-1">
                <span className={`text-sm font-semibold ${isDone ? 'text-blue-700' : 'text-gray-700'}`}>
                  {step.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// 신체 기록
// ═══════════════════════════════════════════════
function BodySection({
  body,
  onChange,
  grade,
}: {
  body: PlannerData['body']
  onChange: (b: PlannerData['body']) => void
  grade: string
}) {
  const gradeInfo = GRADE_GROUPS.find((g) => g.id === grade)
  // 학년군별 수면 목표 (커리큘럼 5.3)
  const sleepTarget =
    grade === 'age6' || grade === 'age7'
      ? 10
      : grade === 'elem13' || grade === 'elem46'
        ? 9
        : grade === 'mid'
          ? 8
          : 7

  return (
    <div className="card p-4">
      <h3 className="font-bold text-gray-800 mb-3">💪 신체 기록</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* 수면 */}
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-base">💤</span>
            <span className="text-xs font-semibold text-blue-700">수면</span>
            <span className="text-[10px] text-blue-400 ml-auto">목표 {sleepTarget}시간</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={14}
              step={0.5}
              value={body.sleep || ''}
              onChange={(e) => onChange({ ...body, sleep: Number(e.target.value) })}
              className="w-16 text-sm font-bold bg-white border border-blue-200 rounded-lg px-2 py-1 text-center"
            />
            <span className="text-xs text-gray-500">시간</span>
            {body.sleep > 0 && (
              <span
                className={`text-xs ml-auto ${body.sleep >= sleepTarget ? 'text-green-600' : 'text-orange-500'}`}
              >
                {body.sleep >= sleepTarget ? '✓' : '↑ 필요'}
              </span>
            )}
          </div>
        </div>

        {/* 운동 */}
        <div className="bg-green-50 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-base">🏃</span>
            <span className="text-xs font-semibold text-green-700">운동</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={200}
              step={10}
              value={body.exercise || ''}
              onChange={(e) => onChange({ ...body, exercise: Number(e.target.value) })}
              className="w-16 text-sm font-bold bg-white border border-green-200 rounded-lg px-2 py-1 text-center"
            />
            <span className="text-xs text-gray-500">분</span>
          </div>
        </div>

        {/* 물 */}
        <div className="bg-cyan-50 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-base">💧</span>
            <span className="text-xs font-semibold text-cyan-700">물</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => onChange({ ...body, water: n === body.water ? 0 : n })}
                className={`w-5 h-5 rounded-full flex-shrink-0 transition-all text-[10px] font-bold ${n <= body.water ? 'bg-cyan-400 text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                {n <= body.water ? '●' : '○'}
              </button>
            ))}
          </div>
          <p className="text-xs text-cyan-600 mt-1">{body.water}잔</p>
        </div>

        {/* 아침 식사 */}
        <div className="bg-orange-50 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-base">🍳</span>
            <span className="text-xs font-semibold text-orange-700">아침 식사</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...body, breakfast: true })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${body.breakfast ? 'bg-orange-400 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
            >
              먹었어요
            </button>
            <button
              onClick={() => onChange({ ...body, breakfast: false })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!body.breakfast ? 'bg-gray-300 text-gray-600' : 'bg-white text-gray-400 border border-gray-200'}`}
            >
              못 먹었어요
            </button>
          </div>
        </div>
      </div>

      {gradeInfo && (
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          {gradeInfo.name} 권장: 수면 {sleepTarget}시간 이상 · 운동 {grade === 'high' ? '30' : '45~60'}분 이상
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// 성찰
// ═══════════════════════════════════════════════
function ReflectionSection({
  reflection,
  onChange,
  isKindie,
}: {
  reflection: PlannerData['reflection']
  onChange: (r: PlannerData['reflection']) => void
  isKindie: boolean
}) {
  return (
    <div className="card p-4">
      <h3 className="font-bold text-gray-800 mb-3">🌅 오늘의 성찰</h3>
      {isKindie ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              😊 오늘 가장 즐거웠던 것
            </label>
            <input
              type="text"
              placeholder="오늘 뭐가 제일 재밌었어?"
              value={reflection.good}
              onChange={(e) => onChange({ ...reflection, good: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              💪 내일 더 잘하고 싶은 것
            </label>
            <input
              type="text"
              placeholder="내일은 이걸 해볼게요!"
              value={reflection.improve}
              onChange={(e) => onChange({ ...reflection, improve: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-green-700 mb-1 block">
              ✅ 잘한 것
            </label>
            <textarea
              rows={2}
              placeholder="오늘 잘 이루어낸 것은?"
              value={reflection.good}
              onChange={(e) => onChange({ ...reflection, good: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-orange-700 mb-1 block">
              💭 아쉬운 것
            </label>
            <textarea
              rows={2}
              placeholder="아쉬웠거나 부족했던 점은?"
              value={reflection.bad}
              onChange={(e) => onChange({ ...reflection, bad: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-blue-700 mb-1 block">
              🚀 내일 개선할 한 가지
            </label>
            <input
              type="text"
              placeholder="내일은 구체적으로 ___를 바꿔볼게요."
              value={reflection.improve}
              onChange={(e) => onChange({ ...reflection, improve: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// 이전 기록 탭
// ═══════════════════════════════════════════════
function HistoryView({ currentGrade: _currentGrade }: { currentGrade: string }) {
  const dates = recentDates()
  const records = dates.map((d) => {
    const saved = localStorage.getItem(PLANNER_KEY(d))
    if (!saved) return null
    try {
      return JSON.parse(saved) as PlannerData
    } catch {
      return null
    }
  })

  const hasAny = records.some(Boolean)

  return (
    <div className="px-4 pt-4 space-y-3 pb-4">
      {!hasAny && (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm text-gray-500">아직 저장된 이전 플래너가 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">오늘 플래너를 작성하면 내일 이곳에 보입니다.</p>
        </div>
      )}

      {records.map((record, i) => {
        if (!record) {
          return (
            <div key={dates[i]} className="card p-3 border border-dashed border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-300 w-24 flex-shrink-0">
                  {formatDate(dates[i])}
                </span>
                <span className="text-xs text-gray-300">기록 없음</span>
              </div>
            </div>
          )
        }

        const overall = calcOverallRate(record)
        const gradeInfo = GRADE_GROUPS.find((g) => g.id === record.grade)
        const goalCount = isKindieGrade(record.grade)
          ? record.kindieSelected.length
          : record.goals.length
        const doneCount = isKindieGrade(record.grade)
          ? record.kindieCompleted.length
          : record.goals.filter((g) => g.done === true).length
        const cycleCount = Object.values(record.cycleChecked).filter(Boolean).length

        return (
          <div key={dates[i]} className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {formatDate(dates[i])}
                  </span>
                  {gradeInfo && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${gradeInfo.headerBg}`}>
                      {gradeInfo.icon} {gradeInfo.name}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-lg font-bold ${
                  overall >= 80 ? 'text-green-600' : overall >= 50 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {overall}%
              </span>
            </div>

            {/* 미니 진행 바 */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${gradeInfo?.headerBg ?? 'bg-blue-400'}`}
                style={{ width: `${overall}%` }}
              />
            </div>

            <div className="flex gap-4 text-xs text-gray-500">
              <span>📋 목표 {doneCount}/{goalCount}</span>
              <span>🔄 사이클 {cycleCount}/5</span>
              {record.reflection.good && (
                <span className="text-green-600 truncate max-w-[120px]">
                  ✓ {record.reflection.good}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
