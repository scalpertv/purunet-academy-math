// 푸르넷 아카데미 로그인 상태를 관리하는 Auth Context
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const AUTH_KEY = 'fivecore-auth-v1'
const ACADEMY_AUTH_URL = 'https://purunet-academy.pages.dev/api/fivecore-auth'

export interface AcademyUser {
  id: string
  name: string
  role: 'student' | 'teacher'
}

interface AuthContextType {
  user: AcademyUser | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  requireLogin: (action: () => void) => void
  loginModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function loadStoredUser(): AcademyUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AcademyUser
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AcademyUser | null>(loadStoredUser)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(ACADEMY_AUTH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      })
      const data = await res.json() as { ok: boolean; user?: AcademyUser; error?: string }
      if (data.ok && data.user) {
        setUser(data.user)
        localStorage.setItem(AUTH_KEY, JSON.stringify(data.user))
        return { ok: true }
      }
      return { ok: false, error: data.error || '로그인에 실패했습니다.' }
    } catch {
      return { ok: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  const requireLogin = useCallback((action: () => void) => {
    if (user) {
      action()
    } else {
      setPendingAction(() => action)
      setLoginModalOpen(true)
    }
  }, [user])

  const openLoginModal = useCallback(() => setLoginModalOpen(true), [])
  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false)
    setPendingAction(null)
  }, [])

  // 로그인 성공 후 대기 중인 action 실행
  const loginAndRun = useCallback(async (username: string, password: string) => {
    const result = await login(username, password)
    if (result.ok && pendingAction) {
      pendingAction()
      setPendingAction(null)
      setLoginModalOpen(false)
    }
    return result
  }, [login, pendingAction])

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn: !!user,
      login: loginAndRun,
      logout,
      requireLogin,
      loginModalOpen,
      openLoginModal,
      closeLoginModal,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
