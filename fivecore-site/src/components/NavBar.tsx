// 하단 고정 네비게이션 바
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: '홈', exact: true },
  { path: '/planner', icon: '📝', label: '플래너', exact: false },
  { path: '/reading', icon: '📚', label: '독서', exact: false },
  { path: '/analysis', icon: '🔎', label: '글분석', exact: false },
  { path: '/dashboard', icon: '📊', label: '대시보드', exact: false },
] as const

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
