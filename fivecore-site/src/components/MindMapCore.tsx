// 마인드맵 SVG 렌더러 + 가지 편집 컴포넌트 — ReviewPage·MindmapPage 공용
import { BRANCH_COLORS } from '../data/mindmap'
import type { MindMapBranch, MindMapData } from '../data/mindmap'

export const CX = 300
export const CY = 255
export const BRANCH_R = 148
export const SUB_R = 84
export const SVG_W = 600
export const SVG_H = 510

function trunc(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
}

export function splitCenter(text: string): string[] {
  const t = text || '주제'
  if (t.length <= 7) return [t]
  const spaceIdx = t.indexOf(' ', 3)
  if (spaceIdx > 0 && spaceIdx < t.length - 2) {
    return [t.slice(0, spaceIdx), t.slice(spaceIdx + 1)]
  }
  const half = Math.ceil(t.length / 2)
  return [t.slice(0, half), t.slice(half)]
}

export function getSpread(count: number): number[] {
  if (count === 0) return []
  if (count === 1) return [0]
  const total = count <= 2 ? 0.7 : 0.95
  return Array.from({ length: count }, (_, i) =>
    count === 1 ? 0 : -total / 2 + (i / (count - 1)) * total
  )
}

// ── SVG 마인드맵 렌더러 ───────────────────────────────
export function MindMapSVG({ data, svgId }: { data: MindMapData; svgId?: string }) {
  const n = data.branches.length
  const centerLines = splitCenter(data.centerTopic)

  return (
    <svg
      id={svgId}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl"
    >
      <rect width={SVG_W} height={SVG_H} fill="#f8fafc" rx="16" />
      <circle cx={CX} cy={CY} r={BRANCH_R} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

      {data.branches.map((branch, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2
        const bx = CX + BRANCH_R * Math.cos(angle)
        const by = CY + BRANCH_R * Math.sin(angle)
        const spread = getSpread(branch.children.filter(Boolean).length)
        const validChildren = branch.children.filter((c) => c.trim())

        return (
          <g key={branch.id}>
            <line x1={CX} y1={CY} x2={bx} y2={by}
              stroke={branch.color} strokeWidth="3" strokeOpacity="0.65" strokeLinecap="round" />
            <rect x={bx - 42} y={by - 17} width="84" height="34" rx="10" fill={branch.color} />
            <text x={bx} y={by + 5} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize="12"
              fontFamily="'Malgun Gothic', 'Apple Gothic', Arial, sans-serif" fontWeight="bold">
              {trunc(branch.text || '가지', 9)}
            </text>
            {validChildren.map((child, j) => {
              const subAngle = angle + spread[j]
              const sx = bx + SUB_R * Math.cos(subAngle)
              const sy = by + SUB_R * Math.sin(subAngle)
              return (
                <g key={j}>
                  <line x1={bx} y1={by} x2={sx} y2={sy}
                    stroke={branch.color} strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
                  <rect x={sx - 34} y={sy - 13} width="68" height="26" rx="8"
                    fill={branch.color + '22'} stroke={branch.color} strokeWidth="1.5" />
                  <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle"
                    fill="#374151" fontSize="10"
                    fontFamily="'Malgun Gothic', 'Apple Gothic', Arial, sans-serif">
                    {trunc(child, 7)}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      <circle cx={CX} cy={CY} r="54" fill="#0f172a" />
      <circle cx={CX} cy={CY} r="54" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.15" />
      {centerLines.map((line, i) => (
        <text key={i} x={CX} y={CY + (i - (centerLines.length - 1) / 2) * 17}
          textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13"
          fontFamily="'Malgun Gothic', 'Apple Gothic', Arial, sans-serif" fontWeight="bold">
          {trunc(line, 9)}
        </text>
      ))}

      {n === 0 && (
        <text x={CX} y={CY + 90} textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="Arial, sans-serif">
          가지를 추가하세요
        </text>
      )}
    </svg>
  )
}

// ── 색상 선택기 ───────────────────────────────────────
export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5">
      {BRANCH_COLORS.map((c) => (
        <button key={c} onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-all active:scale-90 flex-shrink-0"
          style={{ backgroundColor: c, borderColor: value === c ? '#0f172a' : 'transparent',
            transform: value === c ? 'scale(1.15)' : undefined }}
          aria-label={c} />
      ))}
    </div>
  )
}

// ── 가지 편집 카드 ────────────────────────────────────
interface BranchCardProps {
  branch: MindMapBranch
  maxSubs: number
  onUpdate: (updates: Partial<MindMapBranch>) => void
  onDelete: () => void
}

export function BranchCard({ branch, maxSubs, onUpdate, onDelete }: BranchCardProps) {
  function updateChild(i: number, val: string) {
    const next = [...branch.children]; next[i] = val
    onUpdate({ children: next })
  }
  function addChild() { onUpdate({ children: [...branch.children, ''] }) }
  function removeChild(i: number) { onUpdate({ children: branch.children.filter((_, idx) => idx !== i) }) }

  return (
    <div className="card p-3 space-y-2" style={{ borderLeft: `4px solid ${branch.color}` }}>
      <div className="flex items-center gap-2">
        <ColorPicker value={branch.color} onChange={(c) => onUpdate({ color: c })} />
        <input type="text" value={branch.text} onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="가지 이름 (최대 9자)" maxLength={12}
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
        <button onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1"
          aria-label="가지 삭제">×</button>
      </div>
      {maxSubs > 0 && (
        <div className="pl-1 space-y-1.5">
          {branch.children.map((child, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 flex-shrink-0">└</span>
              <input type="text" value={child} onChange={(e) => updateChild(i, e.target.value)}
                placeholder={`세부 항목 ${i + 1}`} maxLength={10}
                className="flex-1 border border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 bg-gray-50"
                style={{ borderColor: branch.color + '60' }} />
              <button onClick={() => removeChild(i)} className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0">×</button>
            </div>
          ))}
          {branch.children.length < maxSubs && (
            <button onClick={addChild} className="text-xs text-gray-400 hover:text-gray-600 ml-4 transition-colors">
              + 세부 항목 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
