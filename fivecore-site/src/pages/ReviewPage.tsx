// 복습 노트 페이지 — 과목별 학습 복습 기록 작성·검색·관리
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAcademyData } from '../context/AcademyDataContext'
import {
  REVIEW_SUBJECTS,
  SUBJECT_COLORS,
  deleteReviewNote,
  loadReviewNotes,
  makeReviewNote,
  saveReviewNote,
  type ReviewNote,
} from '../data/reviewNote'

// ── 노트 카드 ─────────────────────────────────────────────
function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleStar,
}: {
  note: ReviewNote
  onEdit: () => void
  onDelete: () => void
  onToggleStar: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = SUBJECT_COLORS[note.subject] ?? SUBJECT_COLORS['기타']

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-3 p-3.5 text-left"
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${colorClass}`}>
          {note.subject}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {note.title || '(제목 없음)'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{note.date}</span>
            {note.content && (
              <span className="text-xs text-gray-400 truncate max-w-[140px]">
                {note.content.slice(0, 30)}…
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar() }}
            className={`text-sm transition-colors ${note.isStarred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
          >
            ★
          </button>
          <span className={`text-gray-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content || '(내용 없음)'}</p>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl active:scale-95 transition-all"
            >
              ✎ 편집
            </button>
            <button
              onClick={onDelete}
              className="py-1.5 px-3 bg-red-50 border border-red-100 text-red-400 text-xs font-semibold rounded-xl active:scale-95 transition-all"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 노트 편집 폼 ─────────────────────────────────────────
function NoteEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: ReviewNote
  onSave: (note: ReviewNote) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState<ReviewNote>(initial)

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">
          {initial.title ? '노트 편집' : '새 복습 노트'}
        </h3>
        <button onClick={onCancel} className="text-gray-400 text-lg">×</button>
      </div>

      {/* 과목 + 날짜 */}
      <div className="flex gap-2">
        <select
          value={note.subject}
          onChange={(e) => setNote((p) => ({ ...p, subject: e.target.value }))}
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
        >
          {REVIEW_SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          value={note.date}
          onChange={(e) => setNote((p) => ({ ...p, date: e.target.value }))}
          className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
        />
      </div>

      {/* 제목 */}
      <input
        type="text"
        value={note.title}
        onChange={(e) => setNote((p) => ({ ...p, title: e.target.value }))}
        placeholder="복습 노트 제목"
        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 placeholder-gray-300"
      />

      {/* 내용 */}
      <textarea
        value={note.content}
        onChange={(e) => setNote((p) => ({ ...p, content: e.target.value }))}
        placeholder={`오늘 배운 핵심 내용, 어려웠던 점, 다음에 복습할 것을 적어보세요.\n\n예:\n- 핵심 개념: …\n- 어려웠던 부분: …\n- 다음 복습 포인트: …`}
        rows={7}
        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none placeholder-gray-300"
      />

      <button
        onClick={() => {
          const updated: ReviewNote = { ...note, updatedAt: new Date().toISOString() }
          onSave(updated)
        }}
        className="w-full py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl active:scale-95 transition-all"
      >
        저장
      </button>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────
export function ReviewPage() {
  const navigate = useNavigate()
  const { data: academyData, syncReviewNote, academyContext } = useAcademyData()

  const [notes, setNotes] = useState<ReviewNote[]>(() => loadReviewNotes())
  const [editing, setEditing] = useState<ReviewNote | null>(null)
  const [filterSubject, setFilterSubject] = useState<string>('전체')
  const [filterStar, setFilterStar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  function handleSave(note: ReviewNote) {
    saveReviewNote(note)
    setNotes(loadReviewNotes())
    setEditing(null)
    syncReviewNote(note)
  }

  function handleDelete(id: string) {
    deleteReviewNote(id)
    setNotes(loadReviewNotes())
  }

  function handleToggleStar(note: ReviewNote) {
    const updated = { ...note, isStarred: !note.isStarred, updatedAt: new Date().toISOString() }
    saveReviewNote(updated)
    setNotes(loadReviewNotes())
  }

  function openNew(subject?: string) {
    setEditing(makeReviewNote(subject ?? '국어'))
    setTimeout(() => document.getElementById('review-editor')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // 필터 적용
  const filtered = notes.filter((n) => {
    if (filterSubject !== '전체' && n.subject !== filterSubject) return false
    if (filterStar && !n.isStarred) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-500 text-white px-4 pt-6 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold">📓 복습 노트</h1>
            <button onClick={() => navigate(-1)} className="text-white/60 text-sm">← 뒤로</button>
          </div>
          <p className="text-indigo-200 text-sm">오늘 배운 내용을 복습하고 정리하세요.</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              전체 {notes.length}개
            </span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              ★ {notes.filter((n) => n.isStarred).length}개
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* 현재 학습 중인 모듈 컨텍스트 배너 */}
        {academyContext && academyContext.title && !editing && (
          <div className="card p-3 bg-amber-50 border border-amber-200 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">📖</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800">지금 학습 중</p>
              <p className="text-sm font-semibold text-amber-900 truncate">{academyContext.title}</p>
            </div>
            <button
              onClick={() => {
                const note = makeReviewNote(
                  academyContext.subject.includes('math') || academyContext.subject.includes('수학') ? '수학' :
                  academyContext.subject.includes('english') || academyContext.subject.includes('영어') ? '영어' : '기타'
                )
                setEditing({ ...note, title: academyContext.title + ' 복습', subject: note.subject })
                setTimeout(() => document.getElementById('review-editor')?.scrollIntoView({ behavior: 'smooth' }), 50)
              }}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-amber-500 text-white font-semibold rounded-xl active:scale-95 transition-all"
            >
              바로 작성 →
            </button>
          </div>
        )}

        {/* 아카데미 빠른 생성 */}
        {academyData && academyData.recentSubjects.length > 0 && !editing && (
          <div className="card p-3 bg-indigo-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-2">
              📚 최근 아카데미 학습 — 복습 노트 바로 작성
            </p>
            <div className="flex flex-wrap gap-1.5">
              {academyData.recentSubjects.slice(0, 5).map((s, i) => (
                <button
                  key={i}
                  onClick={() => openNew(s.title.slice(0, 4))}
                  className="text-[11px] px-2.5 py-1 bg-white border border-indigo-200 rounded-full text-indigo-700 font-medium active:scale-95 transition-all hover:bg-indigo-100"
                >
                  + {s.title} 복습
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 노트 편집 폼 */}
        {editing && (
          <div id="review-editor">
            <NoteEditor
              initial={editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {/* 검색 + 필터 */}
        <div className="space-y-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="노트 검색..."
            className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 placeholder-gray-300"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['전체', ...REVIEW_SUBJECTS].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSubject(s)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  filterSubject === s
                    ? 'bg-indigo-600 text-white border-transparent'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setFilterStar((p) => !p)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filterStar ? 'bg-amber-400 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              ★ 중요만
            </button>
          </div>
        </div>

        {/* 새 노트 버튼 */}
        {!editing && (
          <button
            onClick={() => openNew()}
            className="w-full py-3 bg-indigo-600 text-white font-semibold text-sm rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">📝</span> 새 복습 노트 작성
          </button>
        )}

        {/* 노트 목록 */}
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-3">📓</p>
            <p className="text-sm text-gray-500">
              {notes.length === 0 ? '아직 작성된 복습 노트가 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => setEditing({ ...note })}
                onDelete={() => handleDelete(note.id)}
                onToggleStar={() => handleToggleStar(note)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
