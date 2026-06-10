// 글분석 도구 페이지 — 학년군/언어별 분석 틀 폼 + 기록 관리
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { GRADE_GROUPS } from '../data/grades'
import type { GradeCode } from '../types'
import {
  ANALYSIS_GRADE_KEY,
  getTemplate,
  loadAnalysisLog,
  saveAnalysisRecord,
  todayStr,
} from '../data/analysis'
import type { AnalysisFieldDef, AnalysisLang, AnalysisRecord } from '../data/analysis'

// ── 선택형 필드 (버튼 칩) ─────────────────────────────
function SelectField({
  field,
  value,
  onChange,
}: {
  field: AnalysisFieldDef
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1.5">{field.label}</p>
      <div className="flex flex-wrap gap-2">
        {field.options!.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(value === opt ? '' : opt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              value === opt
                ? 'bg-orange-500 text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 단일 분석 필드 렌더러 ─────────────────────────────
function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: AnalysisFieldDef
  value: string
  onChange: (v: string) => void
}) {
  if (field.type === 'select') {
    return <SelectField field={field} value={value} onChange={onChange} />
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          rows={field.rows ?? 2}
          className="input-field resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className="input-field"
        />
      )}
    </div>
  )
}

// ── 기록 카드 ──────────────────────────────────────────
function RecordCard({ record }: { record: AnalysisRecord }) {
  const [expanded, setExpanded] = useState(false)
  const gradeInfo = GRADE_GROUPS.find((g) => g.id === record.grade)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl flex-shrink-0">{gradeInfo?.icon ?? '📝'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{record.textTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{record.date}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                record.lang === 'korean'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {record.lang === 'korean' ? '국어' : 'English'}
            </span>
            {record.textType && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {record.textType}
              </span>
            )}
          </div>
        </div>
        <span className={`text-gray-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-400">{record.templateName}</p>
          {Object.entries(record.answers).map(([key, val]) => {
            if (!val) return null
            const template = getTemplate(record.grade, record.lang)
            const fieldDef = template?.fields.find((f) => f.key === key)
            return (
              <div key={key} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-0.5">
                  {fieldDef?.label ?? key}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{val}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────
export function AnalysisPage() {
  const navigate = useNavigate()
  const { requireLogin } = useAuth()

  const [grade, setGrade] = useState<string>(
    () => localStorage.getItem(ANALYSIS_GRADE_KEY) ?? ''
  )
  const [lang, setLang] = useState<AnalysisLang>('korean')
  const [tab, setTab] = useState<'korean' | 'english' | 'log'>('korean')

  // 폼 상태
  const [textTitle, setTextTitle] = useState('')
  const [textType, setTextType] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // 기록 목록
  const [log, setLog] = useState<AnalysisRecord[]>(() => loadAnalysisLog())
  const [logFilter, setLogFilter] = useState<'all' | 'korean' | 'english'>('all')

  // 탭 변경 시 lang 동기화
  useEffect(() => {
    if (tab === 'korean') setLang('korean')
    else if (tab === 'english') setLang('english')
  }, [tab])

  // 학년군 또는 언어 변경 시 폼 초기화
  useEffect(() => {
    setTextTitle('')
    setTextType('')
    setAnswers({})
  }, [grade, lang])

  function handleGradeSelect(g: string) {
    setGrade(g)
    localStorage.setItem(ANALYSIS_GRADE_KEY, g)
  }

  function setAnswer(key: string, val: string) {
    setAnswers((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    if (!grade) return
    const template = getTemplate(grade as GradeCode, lang)
    if (!template) return

    const record: AnalysisRecord = {
      id: Date.now().toString(),
      date: todayStr(),
      grade: grade as GradeCode,
      lang,
      textTitle: textTitle.trim() || '제목 없음',
      textType: textType || template.textTypes[0],
      templateName: template.name,
      answers: { ...answers },
    }
    saveAnalysisRecord(record)
    setLog(loadAnalysisLog())
    setTextTitle('')
    setTextType('')
    setAnswers({})
    setTab('log')
  }

  const template = grade ? getTemplate(grade as GradeCode, lang) : undefined
  const filteredLog =
    logFilter === 'all' ? log : log.filter((r) => r.lang === logFilter)

  const hasAnyAnswer = Object.values(answers).some((v) => v.trim())

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className="bg-orange-500 text-white px-4 pt-6 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/70 text-sm mb-4"
        >
          ← 뒤로
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔎</span>
          <div>
            <h1 className="text-xl font-bold">글분석 도구</h1>
            <p className="text-white/80 text-sm">학년군별 맞춤 분석 틀로 깊이 읽기</p>
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
          {grade && template && (
            <p className="text-xs text-orange-600 font-semibold mt-2 ml-0.5">
              {template.name}
            </p>
          )}
        </div>

        {/* ── 탭 바 ── */}
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1 mb-4">
          {(
            [
              { key: 'korean',  label: '🇰🇷 국어 분석' },
              { key: 'english', label: '🇺🇸 영어 분석' },
              { key: 'log',     label: '📋 분석 기록' },
            ] as { key: typeof tab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            분석 폼 탭 (국어 / 영어)
        ══════════════════════════════════════════════ */}
        {(tab === 'korean' || tab === 'english') && (
          <div className="space-y-4">
            {!grade ? (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-gray-500 text-sm">학년군을 먼저 선택하세요.</p>
              </div>
            ) : !template ? (
              <div className="card p-6 text-center">
                <p className="text-gray-400 text-sm">이 학년군의 분석 틀을 준비 중입니다.</p>
              </div>
            ) : (
              <>
                {/* 글 정보 입력 */}
                <div className="card p-4 space-y-3">
                  <h3 className="font-bold text-gray-700 text-sm">글 정보</h3>

                  {/* 글 제목 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {lang === 'korean' ? '글 제목 / 출처' : 'Text Title / Source'}
                    </label>
                    <input
                      type="text"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder={lang === 'korean' ? '분석할 글의 제목을 입력하세요.' : 'Enter the title of the text.'}
                      className="input-field"
                    />
                  </div>

                  {/* 글 종류 */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">
                      {lang === 'korean' ? '글 종류' : 'Text Type'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {template.textTypes.map((tt) => (
                        <button
                          key={tt}
                          onClick={() => setTextType(textType === tt ? '' : tt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                            textType === tt
                              ? 'bg-orange-500 text-white border-transparent'
                              : 'bg-white text-gray-500 border-gray-200'
                          }`}
                        >
                          {tt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 분석 틀 */}
                <div className="card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-700 text-sm">{template.name}</h3>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {template.fields.length}단계
                    </span>
                  </div>

                  {template.fields.map((field) => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={answers[field.key] ?? ''}
                      onChange={(v) => setAnswer(field.key, v)}
                    />
                  ))}
                </div>

                {/* 저장 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setTextTitle('')
                      setTextType('')
                      setAnswers({})
                    }}
                    disabled={!hasAnyAnswer && !textTitle}
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm disabled:opacity-30 active:scale-95 transition-all"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => requireLogin(handleSave)}
                    disabled={!hasAnyAnswer && !textTitle}
                    className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"
                  >
                    분석 저장
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            기록 탭
        ══════════════════════════════════════════════ */}
        {tab === 'log' && (
          <div className="space-y-3">
            {/* 필터 */}
            <div className="flex gap-2">
              {(
                [
                  { key: 'all',     label: '전체' },
                  { key: 'korean',  label: '국어' },
                  { key: 'english', label: 'English' },
                ] as { key: typeof logFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLogFilter(f.key)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    logFilter === f.key
                      ? 'bg-orange-500 text-white border-transparent'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400 self-center">
                {filteredLog.length}건
              </span>
            </div>

            {filteredLog.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-4xl mb-3">🔎</p>
                <p className="text-gray-500 text-sm">아직 분석 기록이 없어요.</p>
                <p className="text-gray-400 text-xs mt-1">글을 분석하고 저장해보세요.</p>
                <button
                  onClick={() => setTab('korean')}
                  className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all"
                >
                  국어 분석 시작
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLog.map((record) => (
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
