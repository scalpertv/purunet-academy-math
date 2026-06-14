// 꿈쟁이 AI 아카데미 계정으로 로그인하는 모달
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function LoginModal() {
  const { loginModalOpen, closeLoginModal, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!loginModalOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if (result.ok) {
      setUsername('')
      setPassword('')
    } else {
      setError(result.error || '로그인에 실패했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">꿈쟁이 AI 아카데미 로그인</h2>
            <p className="text-xs text-gray-500 mt-0.5">저장 기능을 사용하려면 로그인이 필요합니다.</p>
          </div>
          <button
            onClick={closeLoginModal}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">아이디 / 이메일</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="아이디 또는 이메일"
              className="input-field"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-1"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          <a
            href="https://dreamer-ai-academy.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            꿈쟁이 AI 아카데미
          </a>
          에서 계정을 만들 수 있습니다.
        </p>
      </div>
    </div>
  )
}
