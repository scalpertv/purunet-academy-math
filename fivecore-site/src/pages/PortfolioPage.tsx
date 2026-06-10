// 포트폴리오 보관함 페이지 — 학기별 성장 기록 편집·내보내기·인쇄
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { GRADE_GROUPS, DIMENSIONS } from '../data/grades'
import { loadReadingLog } from '../data/reading'
import { loadMindmaps } from '../data/mindmap'
import { loadAnalysisLog } from '../data/analysis'
import {
  DEFAULT_SEMESTER,
  PORTFOLIO_SEM_KEY,
  SEMESTERS,
  exportPortfolioJson,
  formatPortfolioDate,
  loadPortfolio,
  savePortfolio,
  scanPlannerDates,
} from '../data/portfolio'
import type { Portfolio } from '../data/portfolio'
import type { DimScores } from '../data/dashboard'

// ── 5차원 점수 선택기 (1~5 버튼) ─────────────────────
function ScoreSelector({ value, color, onChange }: { value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="w-7 h-7 rounded-full text-xs font-bold border-2 transition-all active:scale-90"
          style={{
            backgroundColor: n <= value ? color : 'transparent',
            borderColor: color,
            color: n <= value ? 'white' : color,
          }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

// ── 5차원 성장 비교 섹션 ──────────────────────────────
function AssessmentCompare({
  start,
  end,
  onChangeStart,
  onChangeEnd,
}: {
  start: DimScores
  end: DimScores
  onChangeStart: (scores: DimScores) => void
  onChangeEnd: (scores: DimScores) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 mb-1">
        <span className="text-xs font-bold text-gray-500 col-span-1">차원</span>
        <span className="text-xs font-bold text-blue-600 text-center">학기 초</span>
        <span className="text-xs font-bold text-green-600 text-center">학기 말</span>
      </div>

      {DIMENSIONS.map((dim) => {
        const s = start[dim.id] ?? 3
        const e = end[dim.id] ?? 3
        const diff = e - s
        return (
          <div key={dim.id} className="grid grid-cols-3 gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{dim.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{dim.shortName}</span>
              {diff !== 0 && (
                <span
                  className={`text-[10px] font-bold px-1 rounded-full ${
                    diff > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
                  }`}
                >
                  {diff > 0 ? `▲+${diff}` : `▼${diff}`}
                </span>
              )}
            </div>
            <div className="flex justify-center">
              <ScoreSelector
                value={s} color={dim.color}
                onChange={(v) => onChangeStart({ ...start, [dim.id]: v })}
              />
            </div>
            <div className="flex justify-center">
              <ScoreSelector
                value={e} color={dim.color}
                onChange={(v) => onChangeEnd({ ...end, [dim.id]: v })}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 플래너 날짜 선택 ──────────────────────────────────
function PlannerPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (dates: string[]) => void
}) {
  const dates = scanPlannerDates(90)

  if (dates.length === 0) {
    return <p className="text-xs text-gray-400 py-2 text-center">저장된 플래너 기록이 없어요. 플래너를 먼저 작성해보세요.</p>
  }

  function toggle(date: string) {
    if (selected.includes(date)) {
      onChange(selected.filter((d) => d !== date))
    } else if (selected.length < 3) {
      onChange([...selected, date])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">최대 3개 선택 ({selected.length}/3)</p>
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {dates.map(({ date, rate, cycleRate, goalCount }) => {
          const isSelected = selected.includes(date)
          return (
            <button
              key={date}
              onClick={() => toggle(date)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-98 ${
                isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className={`text-lg flex-shrink-0 ${isSelected ? '' : 'opacity-40'}`}>
                {isSelected ? '✅' : '⬜'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-800">{formatPortfolioDate(date)}</span>
                <span className="text-xs text-gray-400 ml-2">목표 {goalCount}개</span>
              </div>
              <div className="flex gap-2 text-xs flex-shrink-0">
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  rate >= 80 ? 'bg-green-100 text-green-700' :
                  rate > 0   ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-400'
                }`}>{rate}%</span>
                <span className="text-gray-400">사이클 {cycleRate}%</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 마인드맵 선택 ──────────────────────────────────────
function MindmapPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const maps = loadMindmaps()

  if (maps.length === 0) {
    return <p className="text-xs text-gray-400 py-2 text-center">저장된 마인드맵이 없어요.</p>
  }

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((i) => i !== id))
    } else if (selected.length < 3) {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">최대 3개 선택 ({selected.length}/3)</p>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {maps.map((map) => {
          const isSelected = selected.includes(map.id)
          const gradeInfo = GRADE_GROUPS.find((g) => g.id === map.grade)
          return (
            <button
              key={map.id}
              onClick={() => toggle(map.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-100'
              }`}
            >
              <span className={`text-lg flex-shrink-0 ${isSelected ? '' : 'opacity-40'}`}>
                {isSelected ? '✅' : '⬜'}
              </span>
              <span className="text-lg">{gradeInfo?.icon ?? '🗺️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{map.centerTopic}</p>
                <p className="text-xs text-gray-400">{map.date} · 가지 {map.branches.length}개</p>
              </div>
              <div className="flex gap-0.5">
                {map.branches.slice(0, 5).map((b) => (
                  <span key={b.id} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 글분석 선택 ────────────────────────────────────────
function AnalysisPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const records = loadAnalysisLog()

  if (records.length === 0) {
    return <p className="text-xs text-gray-400 py-2 text-center">저장된 글분석이 없어요.</p>
  }

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((i) => i !== id))
    } else if (selected.length < 2) {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">최대 2개 선택 ({selected.length}/2)</p>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {records.map((rec) => {
          const isSelected = selected.includes(rec.id)
          return (
            <button
              key={rec.id}
              onClick={() => toggle(rec.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-100'
              }`}
            >
              <span className={`text-lg flex-shrink-0 ${isSelected ? '' : 'opacity-40'}`}>
                {isSelected ? '✅' : '⬜'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{rec.textTitle}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{rec.date}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    rec.lang === 'korean' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>{rec.lang === 'korean' ? '국어' : 'English'}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 독서 기록 목록 (자동) ─────────────────────────────
function ReadingList() {
  const log = loadReadingLog()
  if (log.length === 0) {
    return <p className="text-xs text-gray-400 py-2 text-center">독서 기록이 없어요. 속해독서 타이머로 읽기를 기록해보세요.</p>
  }
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {log.map((rec, i) => (
        <div key={rec.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
          <span className="text-xs font-bold text-gray-400 w-4 text-center flex-shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{rec.title}</p>
            {rec.summary && (
              <p className="text-xs text-gray-500 truncate mt-0.5 italic">"{rec.summary.split('\n')[0]}"</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500">{rec.date.slice(5)}</p>
            {rec.cpm > 0 && <p className="text-[10px] text-gray-400">{rec.cpm}자/분</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 메인 페이지
// ══════════════════════════════════════════════════════

type SectionKey = 'cover' | 'growth' | 'best' | 'reading' | 'essay' | 'share'

const SECTIONS: { key: SectionKey; icon: string; label: string }[] = [
  { key: 'cover',   icon: '📋', label: '표지' },
  { key: 'growth',  icon: '📈', label: '5차원 성장' },
  { key: 'best',    icon: '⭐', label: '베스트' },
  { key: 'reading', icon: '📚', label: '독서' },
  { key: 'essay',   icon: '💭', label: '에세이' },
  { key: 'share',   icon: '⬇️', label: '내보내기' },
]

export function PortfolioPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [semester, setSemester] = useState<string>(
    () => localStorage.getItem(PORTFOLIO_SEM_KEY) ?? DEFAULT_SEMESTER
  )
  const [portfolio, setPortfolio] = useState<Portfolio>(() => loadPortfolio(semester))
  const [activeSection, setActiveSection] = useState<SectionKey>('cover')
  const [bestSubTab, setBestSubTab] = useState<'planner' | 'mindmap' | 'analysis'>('planner')

  // 자동 저장 (로그인 상태일 때만)
  useEffect(() => {
    if (isLoggedIn) {
      savePortfolio({ ...portfolio, updatedAt: new Date().toISOString() })
    }
  }, [portfolio, isLoggedIn])

  // 학기 변경 시 포트폴리오 로드
  useEffect(() => {
    localStorage.setItem(PORTFOLIO_SEM_KEY, semester)
    setPortfolio(loadPortfolio(semester))
  }, [semester])

  function update(updates: Partial<Portfolio>) {
    setPortfolio((p) => ({ ...p, ...updates }))
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Portfolio
        setPortfolio(imported)
        setSemester(imported.semester)
        alert('포트폴리오를 불러왔습니다.')
      } catch {
        alert('파일 형식이 올바르지 않습니다.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const semInfo = SEMESTERS.find((s) => s.id === semester) ?? SEMESTERS[0]

  return (
    <>
      {/* ── 인쇄용 CSS ── */}
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          .print-show { display: block !important; }
          .print-page-break { page-break-before: always; }
          body { background: white !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 pb-24">
        {/* ── 헤더 ── */}
        <div className="bg-teal-600 text-white px-4 pt-6 pb-5 print-hide">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
            ← 뒤로
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">📁</span>
              <div>
                <h1 className="text-xl font-bold">포트폴리오 보관함</h1>
                <p className="text-white/80 text-sm">나의 학기 성장 기록</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-4">
          {/* ── 학기 선택 ── */}
          <div className="card p-3 mb-4 print-hide">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 flex-shrink-0">학기 선택.</span>
              {SEMESTERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSemester(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    semester === s.id
                      ? 'bg-teal-600 text-white border-transparent'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {portfolio.updatedAt && (
              <p className="text-[10px] text-gray-400 mt-1.5 ml-0.5">
                마지막 저장: {new Date(portfolio.updatedAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* ── 섹션 탭 ── */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 print-hide" style={{ scrollbarWidth: 'none' }}>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border flex-shrink-0 transition-all ${
                  activeSection === s.key
                    ? 'bg-teal-600 text-white border-transparent'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════
              ① 표지
          ══════════════════════════════════════════════ */}
          <div className={activeSection === 'cover' ? '' : 'hidden print-show print-page-break'}>
            <div className="card p-5 space-y-4">
              {/* 인쇄용 포트폴리오 제목 */}
              <div className="hidden print-show text-center py-4 border-b border-gray-200 mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  {portfolio.cover.name || '___'}의 5차원 성장 포트폴리오
                </h1>
                <p className="text-gray-500 mt-1">{semInfo.label} · {portfolio.cover.period}</p>
              </div>

              <h2 className="font-bold text-gray-700 text-base print-hide">① 표지</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">이름</label>
                  <input
                    type="text" className="input-field"
                    placeholder="이름을 입력하세요"
                    value={portfolio.cover.name}
                    onChange={(e) => update({ cover: { ...portfolio.cover, name: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">학교</label>
                  <input
                    type="text" className="input-field"
                    placeholder="학교명"
                    value={portfolio.cover.school}
                    onChange={(e) => update({ cover: { ...portfolio.cover, school: e.target.value } })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">학년군</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADE_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => update({ cover: { ...portfolio.cover, grade: g.id } })}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        portfolio.cover.grade === g.id
                          ? `${g.headerBg} text-white border-transparent`
                          : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {g.icon} {g.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">학기 기간</label>
                <input
                  type="text" className="input-field"
                  placeholder="예: 2026.03 ~ 2026.08"
                  value={portfolio.cover.period}
                  onChange={(e) => update({ cover: { ...portfolio.cover, period: e.target.value } })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">학기 시작 다짐</label>
                <textarea
                  className="input-field resize-none" rows={3}
                  placeholder="이번 학기 나의 다짐을 써보세요."
                  value={portfolio.cover.promise}
                  onChange={(e) => update({ cover: { ...portfolio.cover, promise: e.target.value } })}
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              ② 5차원 성장 비교
          ══════════════════════════════════════════════ */}
          <div className={activeSection === 'growth' ? '' : 'hidden print-show print-page-break'}>
            <div className="card p-5">
              <h2 className="font-bold text-gray-700 text-base mb-4">② 5차원 성장 비교</h2>
              <AssessmentCompare
                start={portfolio.assessment.start}
                end={portfolio.assessment.end}
                onChangeStart={(scores) => update({ assessment: { ...portfolio.assessment, start: scores } })}
                onChangeEnd={(scores) => update({ assessment: { ...portfolio.assessment, end: scores } })}
              />
              <p className="text-xs text-gray-400 mt-3 text-center">
                학기 초와 학기 말의 자기평가를 입력하면 성장 차이가 표시됩니다.
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              ③④⑤ 베스트 기록 선택
          ══════════════════════════════════════════════ */}
          <div className={activeSection === 'best' ? '' : 'hidden print-show print-page-break'}>
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-700 text-base">③④⑤ 베스트 기록 선택</h2>

              <div className="flex gap-1.5 print-hide">
                {(
                  [
                    { key: 'planner',  label: '📝 플래너', count: portfolio.bestPlannerDates.length, max: 3 },
                    { key: 'mindmap',  label: '🗺️ 마인드맵', count: portfolio.bestMindmapIds.length, max: 3 },
                    { key: 'analysis', label: '🔎 글분석', count: portfolio.bestAnalysisIds.length, max: 2 },
                  ] as { key: typeof bestSubTab; label: string; count: number; max: number }[]
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setBestSubTab(t.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      bestSubTab === t.key
                        ? 'bg-teal-600 text-white border-transparent'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {t.label}
                    <span className="ml-1 opacity-70">({t.count}/{t.max})</span>
                  </button>
                ))}
              </div>

              {bestSubTab === 'planner' && (
                <PlannerPicker
                  selected={portfolio.bestPlannerDates}
                  onChange={(dates) => update({ bestPlannerDates: dates })}
                />
              )}
              {bestSubTab === 'mindmap' && (
                <MindmapPicker
                  selected={portfolio.bestMindmapIds}
                  onChange={(ids) => update({ bestMindmapIds: ids })}
                />
              )}
              {bestSubTab === 'analysis' && (
                <AnalysisPicker
                  selected={portfolio.bestAnalysisIds}
                  onChange={(ids) => update({ bestAnalysisIds: ids })}
                />
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              ⑥ 독서 기록
          ══════════════════════════════════════════════ */}
          <div className={activeSection === 'reading' ? '' : 'hidden print-show print-page-break'}>
            <div className="card p-5">
              <h2 className="font-bold text-gray-700 text-base mb-3">⑥ 독서 기록 목록</h2>
              <ReadingList />
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              ⑦⑧⑨⑩ 에세이 & 목표
          ══════════════════════════════════════════════ */}
          <div className={activeSection === 'essay' ? '' : 'hidden print-show print-page-break'}>
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-700 text-base">⑦~⑩ 성찰 & 목표</h2>

              {[
                { key: 'meditationNote',  emoji: '🧘', title: '⑦ 묵상 특별 기록', placeholder: '이번 학기 기억에 남는 다짐이나 묵상 내용을 써보세요.' },
                { key: 'essay',           emoji: '✍️', title: '⑧ 자기성찰 에세이', placeholder: '이번 학기 내가 가장 성장한 부분은 무엇인가요? 어떤 어려움을 어떻게 극복했나요?' },
                { key: 'teacherFeedback', emoji: '💬', title: '⑨ 선생님·부모님 피드백', placeholder: '선생님이나 부모님의 피드백을 기록해두세요.' },
                { key: 'nextGoals',       emoji: '🎯', title: '⑩ 다음 학기 목표', placeholder: '다음 학기에는 어떤 목표를 가지고 싶나요? 3가지 이상 써보세요.' },
              ].map(({ key, emoji, title, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    {emoji} {title}
                  </label>
                  <textarea
                    className="input-field resize-none" rows={3}
                    placeholder={placeholder}
                    value={portfolio[key as keyof Portfolio] as string}
                    onChange={(e) => update({ [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              내보내기 / 가져오기 / 인쇄
          ══════════════════════════════════════════════ */}
          <div className={`${activeSection === 'share' ? '' : 'hidden'} print-hide`}>
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-gray-700 text-base">내보내기 · 가져오기 · 인쇄</h2>

              <div className="space-y-3">
                <button
                  onClick={() => exportPortfolioJson(portfolio)}
                  className="w-full py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  ⬇️ JSON으로 내보내기
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-2xl border-2 border-teal-300 text-teal-700 font-bold text-sm active:scale-95 transition-all"
                >
                  ⬆️ JSON 가져오기
                </button>
                <input
                  ref={fileInputRef}
                  type="file" accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />

                <button
                  onClick={() => window.print()}
                  className="w-full py-3 rounded-2xl bg-gray-800 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  🖨️ 인쇄 / PDF 저장
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700">인쇄 안내.</p>
                <p>인쇄 버튼을 누르면 포트폴리오 전체가 출력됩니다. 브라우저의 "PDF로 저장" 옵션을 선택하면 PDF 파일로 저장할 수 있습니다.</p>
                <p>JSON 내보내기는 모든 데이터를 파일로 저장합니다. 다른 기기에서 JSON 가져오기로 복원할 수 있습니다.</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">포트폴리오 완성도</p>
                <div className="space-y-1 text-xs text-blue-600">
                  {[
                    { label: '표지 (이름/다짐)', done: !!(portfolio.cover.name && portfolio.cover.promise) },
                    { label: '5차원 성장 입력', done: Object.values(portfolio.assessment.end).some((v) => v !== 3) },
                    { label: '베스트 플래너 선택', done: portfolio.bestPlannerDates.length > 0 },
                    { label: '베스트 마인드맵 선택', done: portfolio.bestMindmapIds.length > 0 },
                    { label: '자기성찰 에세이', done: portfolio.essay.length > 30 },
                    { label: '다음 학기 목표', done: portfolio.nextGoals.length > 10 },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span>{done ? '✅' : '⬜'}</span>
                      <span className={done ? 'text-blue-700 font-medium' : 'opacity-60'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
