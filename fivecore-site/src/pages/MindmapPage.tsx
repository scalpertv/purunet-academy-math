// 마인드맵 도구 페이지 — SVG 렌더러 + 가지 편집기 + 저장 갤러리
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAcademyData } from '../context/AcademyDataContext'
import { GRADE_GROUPS } from '../data/grades'
import type { GradeCode } from '../types'
import {
  MINDMAP_GRADE_KEY,
  MINDMAP_TEMPLATES,
  MAX_BRANCHES,
  MAX_SUBITEMS,
  deleteMindmap,
  loadMindmaps,
  newBranch,
  saveMindmap,
  todayStr,
} from '../data/mindmap'
import type { MindMapBranch, MindMapData } from '../data/mindmap'

import { MindMapSVG, BranchCard, SVG_W, SVG_H } from '../components/MindMapCore'

// ── PNG 내보내기 ──────────────────────────────────────
function exportPng(svgId: string, filename: string) {
  const svgEl = document.getElementById(svgId) as SVGSVGElement | null
  if (!svgEl) return
  const svgStr = new XMLSerializer().serializeToString(svgEl)
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`
  const canvas = document.createElement('canvas')
  canvas.width = SVG_W
  canvas.height = SVG_H
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    })
  }
  img.src = dataUrl
}

// ── 메인 페이지 ───────────────────────────────────────
export function MindmapPage() {
  const navigate = useNavigate()
  const { requireLogin } = useAuth()
  const { data: academyData } = useAcademyData()
  const previewSvgId = 'mindmap-preview-svg'

  const [grade, setGrade] = useState<string>(
    () => localStorage.getItem(MINDMAP_GRADE_KEY) ?? ''
  )
  const [tab, setTab] = useState<'editor' | 'gallery'>('editor')
  const [centerTopic, setCenterTopic] = useState('')
  const [branches, setBranches] = useState<MindMapBranch[]>([])
  const [savedMaps, setSavedMaps] = useState<MindMapData[]>(() => loadMindmaps())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [galleryView, setGalleryView] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const gradeCode = grade as GradeCode
  const maxBranches = grade ? MAX_BRANCHES[gradeCode] : 7
  const maxSubs = grade ? MAX_SUBITEMS[gradeCode] : 3

  function handleGradeSelect(g: string) {
    setGrade(g)
    localStorage.setItem(MINDMAP_GRADE_KEY, g)
  }

  function loadTemplate(t: (typeof MINDMAP_TEMPLATES)[GradeCode][number]) {
    setCenterTopic(t.centerTopic)
    setBranches(
      t.branches
        .slice(0, MAX_BRANCHES[gradeCode] ?? 7)
        .map((b, i) => ({ ...b, children: b.children.slice(0, maxSubs), id: `${Date.now()}_${i}` }))
    )
    setEditingId(null)
    previewRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function addBranch() {
    if (branches.length >= maxBranches) return
    setBranches((p) => [...p, newBranch(p.length)])
  }

  function updateBranch(id: string, updates: Partial<MindMapBranch>) {
    setBranches((p) => p.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  function removeBranch(id: string) {
    setBranches((p) => p.filter((b) => b.id !== id))
  }

  function handleSave() {
    const data: MindMapData = {
      id: editingId ?? `mm_${Date.now()}`,
      date: todayStr(),
      grade: gradeCode || 'elem13',
      centerTopic: centerTopic.trim() || '주제',
      branches: branches.filter((b) => b.text.trim()),
    }
    saveMindmap(data)
    setSavedMaps(loadMindmaps())
    setEditingId(data.id)
    setTab('gallery')
    setGalleryView(data.id)
  }

  function handleLoadToEditor(map: MindMapData) {
    setCenterTopic(map.centerTopic)
    setBranches(map.branches.map((b) => ({ ...b })))
    setEditingId(map.id)
    if (map.grade) handleGradeSelect(map.grade)
    setTab('editor')
  }

  function handleDelete(id: string) {
    deleteMindmap(id)
    setSavedMaps(loadMindmaps())
    if (galleryView === id) setGalleryView(null)
  }

  const currentData: MindMapData = {
    id: editingId ?? 'preview',
    date: todayStr(),
    grade: gradeCode || 'elem13',
    centerTopic,
    branches,
  }

  const templates = grade ? MINDMAP_TEMPLATES[gradeCode] ?? [] : []

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── 헤더 ── */}
      <div className="bg-purple-600 text-white px-4 pt-6 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/70 text-sm mb-4">
          ← 뒤로
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">🗺️</span>
          <div>
            <h1 className="text-xl font-bold">마인드맵 도구</h1>
            <p className="text-white/80 text-sm">개념을 시각적으로 구조화하기</p>
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
            <p className="text-xs text-purple-600 font-semibold mt-2 ml-0.5">
              최대 가지 {maxBranches}개 · 세부 항목 {maxSubs}개/가지
              {maxSubs === 0 && ' (그림으로 표현 권장)'}
            </p>
          )}
        </div>

        {/* ── 탭 바 ── */}
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1 mb-4">
          {(['editor', 'gallery'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400'
              }`}
            >
              {t === 'editor' ? '✏️ 편집' : `🗂️ 갤러리 (${savedMaps.length})`}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            편집 탭
        ══════════════════════════════════════════════ */}
        {tab === 'editor' && (
          <div className="space-y-4">
            {/* 템플릿 */}
            {templates.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-gray-700 text-sm mb-2">빠른 시작 템플릿</h3>
                <div className="flex gap-2 flex-wrap">
                  {templates.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => loadTemplate(t)}
                      className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold rounded-xl active:scale-95 transition-all"
                    >
                      {t.name}
                    </button>
                  ))}
                  <button
                    onClick={() => { setCenterTopic(''); setBranches([]); setEditingId(null) }}
                    className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-500 text-xs rounded-xl active:scale-95 transition-all"
                  >
                    처음부터
                  </button>
                </div>
              </div>
            )}

            {/* 아카데미 최근 학습 주제 — 중심 주제 빠른 입력 */}
            {academyData && academyData.recentSubjects.length > 0 && (
              <div className="card p-3 bg-purple-50 border border-purple-100">
                <p className="text-xs font-semibold text-purple-700 mb-2">
                  📚 최근 아카데미 학습 — 중심 주제로 바로 입력
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {academyData.recentSubjects.slice(0, 5).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCenterTopic(s.title.slice(0, 20))}
                      className="text-[11px] px-2.5 py-1 bg-white border border-purple-200 rounded-full text-purple-700 font-medium active:scale-95 transition-all hover:bg-purple-100"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 중심 주제 */}
            <div className="card p-4">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">중심 주제</label>
              <input
                type="text"
                value={centerTopic}
                onChange={(e) => setCenterTopic(e.target.value)}
                placeholder="마인드맵 중심 주제를 입력하세요"
                maxLength={20}
                className="input-field"
              />
            </div>

            {/* 가지 편집 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">
                  가지 ({branches.length}/{maxBranches})
                </h3>
                {branches.length < maxBranches && (
                  <button
                    onClick={addBranch}
                    className="flex items-center gap-1 text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 active:scale-95 transition-all"
                  >
                    + 가지 추가
                  </button>
                )}
              </div>

              {branches.length === 0 ? (
                <div className="card p-6 text-center text-gray-400 text-sm">
                  <p className="text-2xl mb-2">🌿</p>
                  <p>가지를 추가해보세요.</p>
                  {!grade && <p className="text-xs mt-1">학년군을 선택하면 추천 템플릿이 제공됩니다.</p>}
                </div>
              ) : (
                branches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    maxSubs={maxSubs}
                    onUpdate={(u) => updateBranch(branch.id, u)}
                    onDelete={() => removeBranch(branch.id)}
                  />
                ))
              )}
            </div>

            {/* SVG 미리보기 */}
            <div ref={previewRef}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 text-sm">미리보기</h3>
                {editingId && (
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    저장됨
                  </span>
                )}
              </div>
              <div className="card p-2 overflow-hidden">
                <MindMapSVG data={currentData} svgId={previewSvgId} />
              </div>
            </div>

            {/* 저장 + PNG 내보내기 */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  exportPng(
                    previewSvgId,
                    `mindmap_${centerTopic || 'untitled'}_${todayStr()}.png`
                  )
                }
                disabled={branches.length === 0 && !centerTopic}
                className="flex-1 py-3 rounded-2xl border-2 border-purple-200 text-purple-600 font-semibold text-sm disabled:opacity-30 active:scale-95 transition-all"
              >
                PNG 저장
              </button>
              <button
                onClick={() => requireLogin(handleSave)}
                disabled={branches.length === 0 && !centerTopic}
                className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-all"
              >
                {editingId ? '업데이트' : '마인드맵 저장'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            갤러리 탭
        ══════════════════════════════════════════════ */}
        {tab === 'gallery' && (
          <div className="space-y-4">
            {savedMaps.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="text-gray-500 text-sm">저장된 마인드맵이 없어요.</p>
                <button
                  onClick={() => setTab('editor')}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all"
                >
                  마인드맵 만들기
                </button>
              </div>
            ) : (
              savedMaps.map((map) => {
                const gradeInfo = GRADE_GROUPS.find((g) => g.id === map.grade)
                const isViewing = galleryView === map.id

                return (
                  <div key={map.id} className="card overflow-hidden">
                    {/* 카드 헤더 */}
                    <button
                      onClick={() => setGalleryView(isViewing ? null : map.id)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <span className="text-2xl flex-shrink-0">{gradeInfo?.icon ?? '🗺️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {map.centerTopic}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{map.date}</span>
                          <div className="flex gap-1">
                            {map.branches.slice(0, 6).map((b) => (
                              <span
                                key={b.id}
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: b.color }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">가지 {map.branches.length}개</span>
                        </div>
                      </div>
                      <span className={`text-gray-400 text-sm transition-transform ${isViewing ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>

                    {/* 확장: SVG 뷰 */}
                    {isViewing && (
                      <div className="px-3 pb-4 border-t border-gray-100 pt-3 space-y-3">
                        <div className="overflow-hidden rounded-xl">
                          <MindMapSVG data={map} svgId={`gallery_svg_${map.id}`} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => exportPng(
                              `gallery_svg_${map.id}`,
                              `mindmap_${map.centerTopic}_${map.date}.png`
                            )}
                            className="flex-1 py-2 rounded-xl border border-purple-200 text-purple-600 text-xs font-semibold active:scale-95 transition-all"
                          >
                            PNG 저장
                          </button>
                          <button
                            onClick={() => handleLoadToEditor(map)}
                            className="flex-1 py-2 rounded-xl bg-purple-100 text-purple-700 text-xs font-semibold active:scale-95 transition-all"
                          >
                            편집하기
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`"${map.centerTopic}" 마인드맵을 삭제할까요?`)) {
                                handleDelete(map.id)
                              }
                            }}
                            className="py-2 px-3 rounded-xl bg-red-50 text-red-400 text-xs font-semibold active:scale-95 transition-all"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
