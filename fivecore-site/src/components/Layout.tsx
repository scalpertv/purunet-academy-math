// 전체 페이지를 감싸는 공통 레이아웃 (하단 NavBar + 인증 배너 포함)
import type { ReactNode } from 'react'
import { NavBar } from './NavBar'
import { LoginModal } from './LoginModal'
import { useAuth } from '../auth/AuthContext'

interface LayoutProps {
  children: ReactNode
}

function AuthBanner() {
  const { user, isLoggedIn, logout, openLoginModal } = useAuth()

  if (isLoggedIn) {
    return (
      <div className="bg-blue-600 text-white text-xs flex items-center justify-between px-4 py-1.5 max-w-lg mx-auto">
        <span>👤 {user!.name}{user!.role === 'teacher' ? ' 선생님' : ''}</span>
        <button onClick={logout} className="underline opacity-80 hover:opacity-100">로그아웃</button>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-xs flex items-center justify-between px-4 py-1.5 max-w-lg mx-auto">
      <span className="text-amber-700">게스트 모드 — 저장하려면 로그인이 필요합니다.</span>
      <button
        onClick={openLoginModal}
        className="text-blue-600 font-semibold underline"
      >
        로그인
      </button>
    </div>
  )
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthBanner />
      <LoginModal />
      <main className="max-w-lg mx-auto">{children}</main>
      <NavBar />
    </div>
  )
}
