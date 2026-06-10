// 학년군별 5단계 사이클 가이드 페이지 — 커리큘럼 3장 기반 전체 구현
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGradeById, CYCLE_STEPS } from '../data/grades'
import { getGuideByCradeCode } from '../data/cycleGuide'
import type { StepDetail } from '../data/cycleGuide'
import type { CycleStep } from '../types'

const STEP_COLORS: Record<CycleStep, string> = {
  planner: 'bg-blue-600',
  meditation: 'bg-yellow-500',
  reading: 'bg-green-600',
  analysis: 'bg-orange-500',
  mindmap: 'bg-purple-600',
}

const STEP_LIGHT: Record<CycleStep, string> = {
  planner: 'bg-blue-50 border-blue-200',
  meditation: 'bg-yellow-50 border-yellow-200',
  reading: 'bg-green-50 border-green-200',
  analysis: 'bg-orange-50 border-orange-200',
  mindmap: 'bg-purple-50 border-purple-200',
}

const STEP_TEXT: Record<CycleStep, string> = {
  planner: 'text-blue-700',
  meditation: 'text-yellow-700',
  reading: 'text-green-700',
  analysis: 'text-orange-700',
  mindmap: 'text-purple-700',
}

const TODAY_KEY = (grade: string) => `guide_checked_${grade}_${new Date().toISOString().slice(0, 10)}`

export function GuidePage() {
  const { grade } = useParams<{ grade: string }>()
  const navigate = useNavigate()
  const gradeInfo = getGradeById(grade ?? '')
  const guideContent = getGuideByCradeCode(grade ?? '')

  const [openStep, setOpenStep] = useState<CycleStep | null>('planner')
  const [checked, setChecked] = useState<Record<CycleStep, boolean>>({
    planner: false,
    meditation: false,
    reading: false,
    analysis: false,
    mindmap: false,
  })

  // 오늘 체크 상태 localStorage 로드
  useEffect(() => {
    if (!grade) return
    const saved = localStorage.getItem(TODAY_KEY(grade))
    if (saved) {
      try {
        setChecked(JSON.parse(saved) as Record<CycleStep, boolean>)
      } catch {
        /* 무시 */
      }
    }
  }, [grade])

  function toggleCheck(key: CycleStep) {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    if (grade) localStorage.setItem(TODAY_KEY(grade), JSON.stringify(next))
  }

  if (!gradeInfo || !guideContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-gray-500 mb-4">학년군을 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/')} className="btn-primary w-auto px-6">
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const completedCount = Object.values(checked).filter(Boolean).length
  const totalSteps = 5
  const progressPct = Math.round((completedCount / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className={`${gradeInfo.headerBg} text-white px-4 pt-6 pb-6`}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/70 text-sm mb-4"
        >
          ← 뒤로
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="text-4xl mb-2">{gradeInfo.icon}</div>
            <h1 className="text-xl font-bold">{gradeInfo.name}</h1>
            <p className="text-white/80 text-sm mt-0.5">{gradeInfo.subtitle}</p>
          </div>
          {/* 특별 배지 (고등: 수능 연계 등) */}
          {guideContent.badges && (
            <div className="flex flex-col gap-1 items-end mt-1">
              {guideContent.badges.map((badge) => (
                <span
                  key={badge}
                  className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/30"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
            하루 {gradeInfo.dailyMinutes}분
          </span>
          {guideContent.isKindie && (
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
              👨‍👩‍👧 함께 진행
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* ── 학년군 소개 ── */}
        <div className="card p-4">
          <p className="text-sm text-gray-600 leading-relaxed">{guideContent.intro}</p>
        </div>

        {/* ── 오늘의 체크리스트 ── */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-sm">오늘의 5단계 체크리스트</h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                completedCount === totalSteps
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {completedCount}/{totalSteps}
            </span>
          </div>

          {/* 진행 바 */}
          <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${gradeInfo.headerBg}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {CYCLE_STEPS.map((step) => (
              <button
                key={step.key}
                onClick={() => toggleCheck(step.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                  checked[step.key]
                    ? `${STEP_COLORS[step.key]} text-white border-transparent`
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <span>{step.icon}</span>
                <span>{step.name}</span>
                {checked[step.key] && <span>✓</span>}
              </button>
            ))}
          </div>

          {completedCount === totalSteps && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-green-700">🎉 오늘의 5단계 완료!</p>
              <p className="text-xs text-green-600 mt-0.5">플래너에 달성률을 기록해보세요.</p>
            </div>
          )}
        </div>

        {/* ── 단계별 상세 가이드 (아코디언) ── */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">단계별 가이드</h2>

          {guideContent.isKindie ? (
            /* 6세/7세 전용 UI — 카드 형태, 크고 이모지 중심 */
            <KindieStepCards steps={guideContent.steps} openStep={openStep} onToggle={setOpenStep} />
          ) : (
            /* 초등 이상 — 아코디언 형태 */
            <NormalStepAccordion steps={guideContent.steps} openStep={openStep} onToggle={setOpenStep} />
          )}
        </div>

        {/* ── 주간 목표 ── */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">📅 주간 목표</h3>
          <ul className="space-y-2">
            {guideContent.weeklyGoals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>

        {/* ── 오늘 시작 버튼 ── */}
        <div className="space-y-3 pb-4">
          <button onClick={() => navigate('/planner')} className="btn-primary">
            📝 오늘 학습 플래너 작성하기
          </button>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/reading')}
              className="card border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700 active:scale-95 transition-all text-center"
            >
              📚<br />속해독서
            </button>
            <button
              onClick={() => navigate('/analysis')}
              className="card border border-orange-200 bg-orange-50 p-3 text-xs font-semibold text-orange-700 active:scale-95 transition-all text-center"
            >
              🔎<br />글분석
            </button>
            <button
              onClick={() => navigate('/mindmap')}
              className="card border border-purple-200 bg-purple-50 p-3 text-xs font-semibold text-purple-700 active:scale-95 transition-all text-center"
            >
              🗺️<br />마인드맵
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 6세/7세 전용 카드 UI ──────────────────────────
interface StepPanelProps {
  steps: StepDetail[]
  openStep: CycleStep | null
  onToggle: (key: CycleStep | null) => void
}

function KindieStepCards({ steps, openStep, onToggle }: StepPanelProps) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const meta = CYCLE_STEPS.find((s) => s.key === step.key)!
        const isOpen = openStep === step.key
        return (
          <div
            key={step.key}
            className={`card border-2 overflow-hidden transition-all ${STEP_LIGHT[step.key]}`}
          >
            <button
              onClick={() => onToggle(isOpen ? null : step.key)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <span className="text-3xl">{meta.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-base">{meta.name}</div>
                <div className="text-xs text-gray-500">{step.duration}분</div>
              </div>
              <span className={`text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                <ul className="space-y-2">
                  {step.activities.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">{['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] ?? '▸'}</span>
                      <span className="text-sm text-gray-700 leading-relaxed">{act}</span>
                    </li>
                  ))}
                </ul>
                {step.tip && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs text-yellow-800">
                      <span className="font-bold">💡 팁: </span>{step.tip}
                    </p>
                  </div>
                )}
                {step.ageNote && (
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-3">
                    <p className="text-xs text-pink-800">
                      <span className="font-bold">👨‍👩‍👧 포인트: </span>{step.ageNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── 초등 이상 아코디언 UI ──────────────────────────
function NormalStepAccordion({ steps, openStep, onToggle }: StepPanelProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const meta = CYCLE_STEPS.find((s) => s.key === step.key)!
        const isOpen = openStep === step.key
        return (
          <div key={step.key} className="card overflow-hidden">
            <button
              onClick={() => onToggle(isOpen ? null : step.key)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              {/* 스텝 번호 */}
              <div
                className={`w-8 h-8 rounded-full ${STEP_COLORS[step.key]} text-white text-sm flex items-center justify-center font-bold flex-shrink-0`}
              >
                {idx + 1}
              </div>
              <span className="text-lg">{meta.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-sm">{meta.name}</div>
                <div className="text-xs text-gray-400">{step.duration}분</div>
              </div>
              <span
                className={`text-gray-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <ul className="space-y-2 mt-3">
                  {step.activities.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      {act.startsWith('·') || act.startsWith('①') || act.startsWith('②') || act.startsWith('③') || act.startsWith('④') || act.startsWith('⑤') ? (
                        <span className="leading-relaxed pl-2">{act}</span>
                      ) : (
                        <>
                          <span className={`font-bold mt-0.5 flex-shrink-0 ${STEP_TEXT[step.key]}`}>
                            {i + 1}.
                          </span>
                          <span className="leading-relaxed">{act}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                {step.tip && (
                  <div className={`mt-3 rounded-xl p-3 border ${STEP_LIGHT[step.key]}`}>
                    <p className="text-xs leading-relaxed">
                      <span className={`font-bold ${STEP_TEXT[step.key]}`}>💡 실천 팁: </span>
                      <span className="text-gray-700">{step.tip}</span>
                    </p>
                  </div>
                )}

                {step.ageNote && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-bold">📌 포인트: </span>{step.ageNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
