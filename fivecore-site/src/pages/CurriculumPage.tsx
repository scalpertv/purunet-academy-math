// 과목별 × 학년군별 커리큘럼 가이드 페이지
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GRADE_GROUPS } from '../data/grades'
import {
  ANNUAL_ROADMAP,
  SUBJECTS,
  getSubject,
} from '../data/curriculum'
import type { SubjectCode } from '../data/curriculum'
import type { GradeCode } from '../types'

const VALID_SUBJECTS: SubjectCode[] = ['korean', 'math', 'english', 'social', 'science']

function isSubjectCode(s: string | undefined): s is SubjectCode {
  return VALID_SUBJECTS.includes(s as SubjectCode)
}

// ── 펼치기/접기 블록 ──────────────────────────────────
function AccordionBlock({
  title,
  bullets,
  highlight,
  accentColor,
  defaultOpen,
}: {
  title: string
  bullets: string[]
  highlight?: string
  accentColor: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left active:opacity-80 transition-all"
        style={{ backgroundColor: open ? `${accentColor}0d` : 'white' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-bold text-gray-800">{title}</span>
        <span
          className="text-xs font-black transition-transform duration-200"
          style={{ color: accentColor, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 bg-white">
          <ul className="space-y-1.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {highlight && (
            <div
              className="mt-2 rounded-xl px-3 py-2.5 text-xs text-gray-700 leading-relaxed"
              style={{ backgroundColor: `${accentColor}12`, borderLeft: `3px solid ${accentColor}` }}
            >
              💡 {highlight}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 연간 로드맵 ─────────────────────────────────────────
function AnnualRoadmapCard() {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-80"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <span className="font-bold text-gray-800 text-sm">연간 학습 로드맵 요약</span>
        </div>
        <span className={`text-gray-400 text-xs font-black transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-2 text-left text-gray-500 font-semibold border-b border-gray-200 whitespace-nowrap">학년군</th>
                <th className="px-2 py-2 text-left text-gray-500 font-semibold border-b border-gray-200">1학기 핵심</th>
                <th className="px-2 py-2 text-left text-gray-500 font-semibold border-b border-gray-200">2학기 핵심</th>
                <th className="px-2 py-2 text-left text-gray-500 font-semibold border-b border-gray-200 whitespace-nowrap">독서 목표</th>
                <th className="px-2 py-2 text-left text-gray-500 font-semibold border-b border-gray-200 whitespace-nowrap">마인드맵</th>
              </tr>
            </thead>
            <tbody>
              {ANNUAL_ROADMAP.map((row) => {
                const g = GRADE_GROUPS.find((g) => g.id === row.grade)!
                return (
                  <tr key={row.grade} className="border-b border-gray-100 last:border-0">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="flex items-center gap-1 font-semibold" style={{ color: 'inherit' }}>
                        <span>{g.icon}</span>
                        <span className={g.textColor}>{row.gradeLabel}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-gray-600">{row.sem1}</td>
                    <td className="px-2 py-2 text-gray-600">{row.sem2}</td>
                    <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{row.reading}</td>
                    <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{row.mindmap}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// 메인 페이지
// ══════════════════════════════════════════════════════
export function CurriculumPage() {
  const navigate = useNavigate()
  const { subject } = useParams<{ subject: string }>()

  const activeSubject: SubjectCode = isSubjectCode(subject) ? subject : 'korean'
  const subjectDef = getSubject(activeSubject)

  const [activeGrade, setActiveGrade] = useState<GradeCode>('elem46')
  const gradeDef = GRADE_GROUPS.find((g) => g.id === activeGrade)!
  const gradeCurriculum = subjectDef.grades.find((g) => g.grade === activeGrade)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className="text-white px-4 pt-6 pb-5" style={{ backgroundColor: subjectDef.color }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
          ← 뒤로
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{subjectDef.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{subjectDef.label} 커리큘럼</h1>
            <p className="text-white/80 text-xs mt-0.5 leading-snug">{subjectDef.goal}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* ── 과목 탭 ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/curriculum/${s.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border flex-shrink-0 transition-all"
              style={
                s.id === activeSubject
                  ? { backgroundColor: s.color, color: 'white', borderColor: 'transparent' }
                  : { backgroundColor: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* ── 학년군 선택 ── */}
        <div className="card p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">학년군 선택.</p>
          <div className="flex gap-1.5 flex-wrap">
            {GRADE_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGrade(g.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeGrade === g.id
                    ? `${g.headerBg} text-white border-transparent`
                    : `bg-white ${g.textColor} border-gray-200`
                }`}
              >
                {g.icon} {g.name}
              </button>
            ))}
          </div>
        </div>

        {gradeCurriculum ? (
          <>
            {/* ── 이번 주 목표 ── */}
            <div
              className="rounded-2xl px-4 py-3 flex items-start gap-3"
              style={{ backgroundColor: `${subjectDef.color}12`, border: `1.5px solid ${subjectDef.color}30` }}
            >
              <span className="text-xl flex-shrink-0">🎯</span>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: subjectDef.color }}>
                  {gradeDef.name} 주간 목표
                </p>
                <p className="text-sm font-semibold text-gray-700 leading-snug">
                  {gradeCurriculum.weeklyGoal}
                </p>
              </div>
            </div>

            {/* ── 커리큘럼 블록 ── */}
            <div className="space-y-2">
              {gradeCurriculum.blocks.map((block, idx) => (
                <AccordionBlock
                  key={block.title}
                  title={block.title}
                  bullets={block.bullets}
                  highlight={block.highlight}
                  accentColor={subjectDef.color}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>

            {/* ── 마인드맵 바로가기 ── */}
            <button
              onClick={() => navigate('/mindmap')}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-98"
              style={{ borderColor: subjectDef.color, backgroundColor: `${subjectDef.color}08` }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🗺️</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">관련 마인드맵 만들기</p>
                  <p className="text-xs text-gray-500">추천 주제: {gradeCurriculum.mindmapTopic}</p>
                </div>
              </div>
              <span className="text-gray-400 font-bold">→</span>
            </button>
          </>
        ) : (
          <div className="card p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">🚧</p>
            <p className="text-sm">이 학년군의 커리큘럼은 준비 중입니다.</p>
          </div>
        )}

        {/* ── 연간 로드맵 ── */}
        <AnnualRoadmapCard />

        {/* ── 5단계 사이클 연결 안내 ── */}
        <div className="card p-4">
          <p className="text-xs font-bold text-gray-700 mb-2">💡 5단계 사이클 연결 방법.</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            {[
              { step: '① 플래너', tip: `${subjectDef.label} 오늘 목표를 SMART하게 설정` },
              { step: '② 묵상',   tip: `어제 ${subjectDef.label} 배운 것 3가지 회상` },
              { step: '③ 독서',   tip: `${subjectDef.label} 관련 텍스트 속해독서` },
              { step: '④ 글분석', tip: `읽은 내용 핵심어 추출 + 구조 파악` },
              { step: '⑤ 마인드맵', tip: `"${gradeCurriculum?.mindmapTopic ?? '오늘 배운 개념'}" 마인드맵 완성` },
            ].map(({ step, tip }) => (
              <div key={step} className="flex items-start gap-2">
                <span
                  className="font-bold px-1.5 py-0.5 rounded-md text-[10px] flex-shrink-0"
                  style={{ backgroundColor: `${subjectDef.color}18`, color: subjectDef.color }}
                >
                  {step}
                </span>
                <span className="leading-snug">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
