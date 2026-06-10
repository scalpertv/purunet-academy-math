// 5차원 성장 대시보드 페이지 — 레이더 차트, 주간 달성률, 스트릭, 독서/마인드맵 통계 통합
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DIMENSIONS, GRADE_GROUPS, CYCLE_STEPS } from '../data/grades'
import { calcMonthlyStats, loadReadingLog } from '../data/reading'
import { loadMindmaps } from '../data/mindmap'
import {
  calcStreak,
  getTodayData,
  getWeeklyBody,
  getWeeklyRates,
  loadAssessmentMonth,
  saveAssessmentMonth,
  prevMonthYm,
  thisMonthYm,
} from '../data/dashboard'
import type { DimScores } from '../data/dashboard'

// ══════════════════════════════════════════════════════
// 5차원 레이더 차트 (SVG)
// ══════════════════════════════════════════════════════

const RADAR_CX = 150, RADAR_CY = 143, RADAR_R = 98
const LABEL_R = RADAR_R * 1.3

function radarPoint(score: number, idx: number): [number, number] {
  const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2
  const r = (Math.max(0, Math.min(5, score)) / 5) * RADAR_R
  return [RADAR_CX + r * Math.cos(angle), RADAR_CY + r * Math.sin(angle)]
}

function gridPoint(level: number, idx: number): [number, number] {
  const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2
  const r = (level / 5) * RADAR_R
  return [RADAR_CX + r * Math.cos(angle), RADAR_CY + r * Math.sin(angle)]
}

function toPolyPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

interface RadarChartProps {
  current: DimScores
  prev: DimScores | null
}

function RadarChart({ current, prev }: RadarChartProps) {
  const currentPts = DIMENSIONS.map((d, i) => radarPoint(current[d.id] ?? 3, i))
  const prevPts    = prev ? DIMENSIONS.map((d, i) => radarPoint(prev[d.id] ?? 3, i)) : null

  return (
    <svg viewBox="0 0 300 280" className="w-full max-w-xs mx-auto">
      {/* 배경 격자 오각형 */}
      {[1, 2, 3, 4, 5].map((lv) => (
        <polygon
          key={lv}
          points={toPolyPoints(DIMENSIONS.map((_, i) => gridPoint(lv, i)))}
          fill={lv === 5 ? '#f8fafc' : 'none'}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* 축 선 */}
      {DIMENSIONS.map((_, i) => {
        const [x, y] = gridPoint(5, i)
        return <line key={i} x1={RADAR_CX} y1={RADAR_CY} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
      })}

      {/* 눈금 점수 레이블 (1~5) */}
      {[1, 3, 5].map((lv) => (
        <text
          key={lv}
          x={RADAR_CX + 3}
          y={RADAR_CY - (lv / 5) * RADAR_R + 3}
          fontSize="8"
          fill="#94a3b8"
          fontFamily="Arial, sans-serif"
        >
          {lv}
        </text>
      ))}

      {/* 지난달 다각형 (회색 점선) */}
      {prevPts && (
        <polygon
          points={toPolyPoints(prevPts)}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.55"
        />
      )}

      {/* 이달 채운 다각형 */}
      <polygon
        points={toPolyPoints(currentPts)}
        fill="#3b82f615"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* 꼭짓점 점 */}
      {currentPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill={DIMENSIONS[i].color} stroke="white" strokeWidth="1.5" />
      ))}

      {/* 축 레이블 */}
      {DIMENSIONS.map((dim, i) => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const lx = RADAR_CX + LABEL_R * Math.cos(angle)
        const ly = RADAR_CY + LABEL_R * Math.sin(angle)
        const anchor = Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle'
        return (
          <text
            key={i}
            x={lx} y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="11"
            fontFamily="'Malgun Gothic', 'Apple Gothic', Arial, sans-serif"
            fontWeight="600"
            fill="#374151"
          >
            {`${dim.icon} ${dim.shortName}`}
          </text>
        )
      })}
    </svg>
  )
}

// ══════════════════════════════════════════════════════
// 오늘 사이클 완성도 카드
// ══════════════════════════════════════════════════════
function TodayCycleCard() {
  const today = getTodayData()
  const checked = today.cycleChecked

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">오늘의 5단계 사이클</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            today.achieveRate >= 80 ? 'bg-green-100 text-green-700' :
            today.achieveRate > 0   ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-400'
          }`}>
            달성 {today.achieveRate}%
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CYCLE_STEPS.map((step) => {
          const done = checked[step.key]
          return (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border ${
                done
                  ? 'bg-indigo-600 text-white border-transparent'
                  : 'bg-gray-50 text-gray-400 border-gray-100'
              }`}
            >
              <span>{step.icon}</span>
              <span>{step.name}</span>
              {done && <span className="text-white/80">✓</span>}
            </div>
          )
        })}
      </div>

      {/* 사이클 진행 바 */}
      <div className="mt-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${today.cycleRate}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-right">{today.cycleRate}% 완료</p>
      </div>

      {!today.hasPlannerData && (
        <p className="text-xs text-gray-400 mt-2 text-center">플래너를 작성하면 실시간으로 반영됩니다.</p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 이번 주 달성률 (7일 원형 진행 바)
// ══════════════════════════════════════════════════════
function WeeklyProgress() {
  const rates = getWeeklyRates()
  const avg = Math.round(rates.reduce((s, r) => s + r.rate, 0) / rates.length)
  const CIRC = 2 * Math.PI * 13  // r=13

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">이번 주 달성률</h3>
        <span className="text-xs text-gray-500 font-medium">평균 {avg}%</span>
      </div>
      <div className="flex justify-around items-end">
        {rates.map(({ date, dayLabel, rate, isToday }) => {
          const strokeColor = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : rate > 0 ? '#3b82f6' : '#e5e7eb'
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-600">{rate > 0 ? `${rate}%` : ''}</span>
              <svg viewBox="0 0 32 32" width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="16" cy="16" r="13" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle
                  cx="16" cy="16" r="13"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(rate / 100) * CIRC} ${CIRC}`}
                />
              </svg>
              <span className={`text-[10px] font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                {isToday ? '오늘' : dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 연속 학습 스트릭
// ══════════════════════════════════════════════════════
function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`text-4xl ${streak > 0 ? 'animate-bounce' : ''}`}>
        {streak >= 30 ? '🔥' : streak >= 7 ? '⚡' : streak > 0 ? '✨' : '💤'}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{streak}일</p>
        <p className="text-xs text-gray-400">연속 학습 스트릭</p>
      </div>
      {streak >= 7 && (
        <span className="ml-auto text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
          {streak >= 30 ? '🏆 한 달 달성!' : streak >= 14 ? '🎯 2주 연속!' : '⭐ 1주 달성!'}
        </span>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 이번 달 독서 통계
// ══════════════════════════════════════════════════════
function ReadingStatsCard() {
  const log = loadReadingLog()
  const stats = calcMonthlyStats(log)
  const month = new Date().getMonth() + 1

  return (
    <div className="card p-4">
      <h3 className="font-bold text-gray-700 text-sm mb-3">📚 {month}월 독서 통계</h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '권수', value: `${stats.count}권`, color: 'text-green-600' },
          { label: '총 시간', value: `${stats.totalMinutes}분`, color: 'text-blue-600' },
          { label: '평균 속도', value: stats.avgCpm > 0 ? `${stats.avgCpm}자/분` : '-', color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="text-center bg-gray-50 rounded-xl p-2.5">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {stats.count === 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">이번 달 독서 기록이 없어요.</p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 최근 마인드맵 3개
// ══════════════════════════════════════════════════════
function RecentMindmaps() {
  const navigate = useNavigate()
  const maps = loadMindmaps().slice(0, 3)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">🗺️ 최근 마인드맵</h3>
        <button
          onClick={() => navigate('/mindmap')}
          className="text-xs text-purple-600 font-semibold"
        >
          전체 보기 →
        </button>
      </div>

      {maps.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">아직 마인드맵이 없어요.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {maps.map((map) => (
            <button
              key={map.id}
              onClick={() => navigate('/mindmap')}
              className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-1.5 border border-gray-100 active:scale-95 transition-all"
            >
              {/* 중심 원 미니 */}
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold leading-tight text-center px-0.5">
                  {map.centerTopic.slice(0, 4)}
                </span>
              </div>
              {/* 가지 색상 점 */}
              <div className="flex gap-0.5 flex-wrap justify-center">
                {map.branches.slice(0, 6).map((b) => (
                  <span key={b.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                ))}
              </div>
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{map.date.slice(5)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 주간 신체 기록
// ══════════════════════════════════════════════════════
function WeeklyBodyCard() {
  const body = getWeeklyBody()

  if (body.recordedDays === 0) {
    return (
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 text-sm mb-2">💪 주간 신체 기록</h3>
        <p className="text-xs text-gray-400 text-center py-2">플래너에 신체 기록을 작성하면 여기 표시됩니다.</p>
      </div>
    )
  }

  const items = [
    { icon: '🛌', label: '평균 수면', value: `${body.avgSleep}시간`, target: '8시간', ok: body.avgSleep >= 7 },
    { icon: '🏃', label: '총 운동', value: `${body.totalExerciseMin}분`, target: '7일 210분', ok: body.totalExerciseMin >= 150 },
    { icon: '💧', label: '평균 수분', value: `${body.avgWater}잔`, target: '8잔', ok: body.avgWater >= 6 },
    { icon: '🍚', label: '아침 식사', value: `${body.breakfastDays}/7일`, target: '매일', ok: body.breakfastDays >= 5 },
  ]

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">💪 주간 신체 기록</h3>
        <span className="text-[10px] text-gray-400">{body.recordedDays}일 기록</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl p-3 border ${item.ok ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span>{item.icon}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
              {item.ok && <span className="text-green-500 text-[10px] ml-auto">✓</span>}
            </div>
            <p className={`text-base font-bold ${item.ok ? 'text-green-700' : 'text-gray-700'}`}>
              {item.value}
            </p>
            <p className="text-[9px] text-gray-400">목표: {item.target}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 5차원 자기평가 슬라이더
// ══════════════════════════════════════════════════════
interface SliderSectionProps {
  scores: DimScores
  onChange: (scores: DimScores) => void
  thisYm: string
  prevYm: string
}

function AssessmentSection({ scores, onChange, thisYm, prevYm }: SliderSectionProps) {
  const prevScores = loadAssessmentMonth(prevYm)
  const hasPrev = Object.values(prevScores).some((v) => v !== 3)

  function updateScore(dimId: number, val: number) {
    const next = { ...scores, [dimId]: val }
    onChange(next)
    saveAssessmentMonth(thisYm, next)
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-gray-700 text-sm">5차원 자기평가</h3>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {thisYm} 기준
        </span>
      </div>

      {hasPrev && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-blue-500 rounded" />
            <span className="text-[10px] text-gray-500">이달</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-gray-400 rounded" style={{ borderTop: '2px dashed #94a3b8', background: 'none' }} />
            <span className="text-[10px] text-gray-500">지난달</span>
          </div>
        </div>
      )}

      <RadarChart current={scores} prev={hasPrev ? prevScores : null} />

      <div className="mt-4 space-y-3">
        {DIMENSIONS.map((dim) => {
          const val = scores[dim.id] ?? 3
          return (
            <div key={dim.id} className="flex items-center gap-3">
              <span className="text-lg flex-shrink-0">{dim.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{dim.name}</span>
                  <span className={`text-xs font-bold`} style={{ color: dim.color }}>{val}/5</span>
                </div>
                <input
                  type="range"
                  min="1" max="5" step="1"
                  value={val}
                  onChange={(e) => updateScore(dim.id, +e.target.value)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: dim.color }}
                />
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-gray-300">1</span>
                  <span className="text-[9px] text-gray-300">5</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 메인 페이지
// ══════════════════════════════════════════════════════
const DASH_GRADE_KEY = 'dashboard_grade_pref'

export function DashboardPage() {
  const navigate = useNavigate()
  const thisYm = thisMonthYm()
  const prevYm = prevMonthYm()

  const [grade, setGrade] = useState<string>(
    () => localStorage.getItem(DASH_GRADE_KEY) ?? ''
  )
  const [scores, setScores] = useState<DimScores>(
    () => loadAssessmentMonth(thisYm)
  )
  const [streak] = useState(() => calcStreak())

  useEffect(() => {
    if (!grade) return
    localStorage.setItem(DASH_GRADE_KEY, grade)
  }, [grade])

  const gradeInfo = GRADE_GROUPS.find((g) => g.id === grade)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className="bg-indigo-700 text-white px-4 pt-6 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
          ← 뒤로
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📊</span>
            <div>
              <h1 className="text-xl font-bold">5차원 성장 대시보드</h1>
              <p className="text-white/80 text-sm">나의 성장을 한눈에 확인해요</p>
            </div>
          </div>
          {gradeInfo && (
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-semibold">
              {gradeInfo.icon} {gradeInfo.name}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* ── 학년군 선택 ── */}
        <div className="card p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 flex-shrink-0">학년군.</span>
            {GRADE_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGrade(g.id)}
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
        </div>

        {/* ── 오늘 사이클 ── */}
        <TodayCycleCard />

        {/* ── 스트릭 + 독서 나란히 ── */}
        <div className="grid grid-cols-2 gap-3">
          <StreakCard streak={streak} />
          <div className="card p-4 flex flex-col justify-center items-center gap-1">
            <span className="text-3xl">📚</span>
            <p className="text-xl font-bold text-green-700">
              {calcMonthlyStats(loadReadingLog()).count}권
            </p>
            <p className="text-xs text-gray-400 text-center">이번 달 독서</p>
          </div>
        </div>

        {/* ── 이번 주 달성률 ── */}
        <WeeklyProgress />

        {/* ── 5차원 자기평가 + 레이더 차트 ── */}
        <AssessmentSection
          scores={scores}
          onChange={setScores}
          thisYm={thisYm}
          prevYm={prevYm}
        />

        {/* ── 독서 통계 ── */}
        <ReadingStatsCard />

        {/* ── 최근 마인드맵 ── */}
        <RecentMindmaps />

        {/* ── 주간 신체 기록 ── */}
        <WeeklyBodyCard />

        {/* ── 바로가기 버튼 ── */}
        <div className="grid grid-cols-3 gap-3 pb-4">
          {[
            { path: '/planner',  icon: '📝', label: '플래너',   bg: 'bg-blue-50 border-blue-200 text-blue-700' },
            { path: '/reading',  icon: '📚', label: '속해독서', bg: 'bg-green-50 border-green-200 text-green-700' },
            { path: '/mindmap',  icon: '🗺️', label: '마인드맵', bg: 'bg-purple-50 border-purple-200 text-purple-700' },
          ].map((btn) => (
            <button
              key={btn.path}
              onClick={() => navigate(btn.path)}
              className={`card border p-3 text-xs font-semibold text-center active:scale-95 transition-all ${btn.bg}`}
            >
              <span className="text-2xl block mb-1">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
