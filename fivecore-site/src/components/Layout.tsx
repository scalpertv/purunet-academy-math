// 전체 페이지를 감싸는 공통 레이아웃 (하단 NavBar 포함)
import type { ReactNode } from 'react'
import { NavBar } from './NavBar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-lg mx-auto">{children}</main>
      <NavBar />
    </div>
  )
}
