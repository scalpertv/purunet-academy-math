// 미구현 페이지 공통 Placeholder (Phase 3~10에서 교체됨)
import { useNavigate } from 'react-router-dom'

interface PlaceholderPageProps {
  icon: string
  title: string
  description: string
  phase: string
}

export function PlaceholderPage({ icon, title, description, phase }: PlaceholderPageProps) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-b from-gray-700 to-gray-600 text-white px-4 pt-6 pb-6">
        <button onClick={() => navigate(-1)} className="text-white/70 text-sm mb-4 block">
          ← 뒤로
        </button>
        <div className="text-4xl mb-2">{icon}</div>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
          <div className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            {phase} 구현 예정
          </div>
        </div>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
