// 메인 랜딩 페이지 — 학년군 선택 및 5차원 소개
import { useNavigate } from 'react-router-dom'
import { GRADE_GROUPS, DIMENSIONS, QUICK_ACTIONS } from '../data/grades'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 히어로 헤더 */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-600 text-white px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">5차원 자기주도학습</h1>
          <p className="text-blue-200 text-sm">원동연 박사 5차원 전면교육 기반</p>
          <p className="text-blue-300 text-xs mt-1">6세 ~ 고등 · 매일 5단계 학습 사이클</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* 5차원 소개 카드 */}
        <div className="card -mt-5 p-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            5차원 전면교육
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {DIMENSIONS.map((dim) => (
              <div key={dim.id} className="text-center">
                <div
                  className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl ${dim.bgColor} mb-1`}
                >
                  {dim.icon}
                </div>
                <p className={`text-[11px] font-semibold ${dim.textColor}`}>{dim.shortName}</p>
                <p className="text-[9px] text-gray-400 leading-tight mt-0.5 hidden sm:block">
                  {dim.description.split('·')[0]}
                </p>
              </div>
            ))}
          </div>

          {/* 5단계 사이클 간략 표시 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">매일 5단계 학습 사이클</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {['📝 플래너', '🧘 3분 묵상', '📚 속해독서', '🔎 글분석', '🗺️ 마인드맵'].map(
                (step, i) => (
                  <div key={i} className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                      {step}
                    </span>
                    {i < 4 && <span className="text-gray-300 text-xs">→</span>}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* 학년군 선택 */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">학년군 선택</h2>
          <div className="grid grid-cols-2 gap-3">
            {GRADE_GROUPS.map((grade) => (
              <button
                key={grade.id}
                onClick={() => navigate(`/guide/${grade.id}`)}
                className={`card p-4 text-left border-2 ${grade.borderColor} ${grade.hoverBg} active:scale-95 transition-all duration-100`}
              >
                <div className="text-3xl mb-2">{grade.icon}</div>
                <div className="font-bold text-gray-800 text-sm">{grade.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">{grade.subtitle}</div>
                <div className={`text-xs font-medium mt-2 ${grade.textColor}`}>
                  하루 {grade.dailyMinutes}분
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 오늘 학습 빠른 접근 */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-3">오늘 학습 시작</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`card border ${action.color} p-3 text-center active:scale-95 transition-all duration-100`}
              >
                <div className="text-2xl mb-1">{action.icon}</div>
                <div className="text-xs font-medium text-gray-700">{action.name}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 사이트 소개 footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            원동연 박사 5차원 전면교육 × 2022 개정 교육과정
            <br />
            6세 ~ 고등학교 3학년 · 자기주도학습 완성
          </p>
        </div>
      </div>
    </div>
  )
}
