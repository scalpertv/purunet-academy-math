// 5차원 컬러 시스템 정의 Tailwind 설정
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 1차원: 지적 역량
        dim1: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // 2차원: 정서 강건성
        dim2: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // 3차원: 신체 강건성
        dim3: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // 4차원: 자기관리능력
        dim4: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // 5차원: 인간관계 회복능력
        dim5: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        korean: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Noto Sans KR"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config
