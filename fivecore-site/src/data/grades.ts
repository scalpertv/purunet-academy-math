// 학년군 정의 및 5차원 데이터 — 커리큘럼 문서 2~3장 기반
import type { GradeCode, DimensionId } from '../types'

export interface GradeGroup {
  id: GradeCode
  name: string
  subtitle: string
  icon: string
  dailyMinutes: string
  /** Tailwind bg 클래스 (헤더 배경용) */
  headerBg: string
  /** Tailwind border 클래스 */
  borderColor: string
  /** Tailwind hover bg 클래스 */
  hoverBg: string
  /** Tailwind text 클래스 */
  textColor: string
  /** 5단계 각 소요 시간(분) */
  cycleMinutes: {
    planner: string
    meditation: string
    reading: string
    analysis: string
    mindmap: string
  }
  weeklyGoal: string
}

export const GRADE_GROUPS: GradeGroup[] = [
  {
    id: 'age6',
    name: '6세반',
    subtitle: '즐겁고 안전한 첫 학습',
    icon: '🌱',
    dailyMinutes: '40~50',
    headerBg: 'bg-pink-500',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-50',
    textColor: 'text-pink-600',
    cycleMinutes: {
      planner: '3',
      meditation: '3',
      reading: '10~15',
      analysis: '5~10',
      mindmap: '10',
    },
    weeklyGoal: '그림책 5권, 감정 카드 매일, 그림 마인드맵 5개',
  },
  {
    id: 'age7',
    name: '7세반',
    subtitle: '자립 연습 시작',
    icon: '🌻',
    dailyMinutes: '50~60',
    headerBg: 'bg-orange-500',
    borderColor: 'border-orange-200',
    hoverBg: 'hover:bg-orange-50',
    textColor: 'text-orange-600',
    cycleMinutes: {
      planner: '5',
      meditation: '3',
      reading: '15~20',
      analysis: '10~15',
      mindmap: '10~15',
    },
    weeklyGoal: '동화 3권, 글분석 3회, 낱말+그림 마인드맵 5개',
  },
  {
    id: 'elem13',
    name: '초등 저학년',
    subtitle: '1~3학년 · 기초 습관 형성',
    icon: '📖',
    dailyMinutes: '60~70',
    headerBg: 'bg-yellow-500',
    borderColor: 'border-yellow-200',
    hoverBg: 'hover:bg-yellow-50',
    textColor: 'text-yellow-600',
    cycleMinutes: {
      planner: '5~7',
      meditation: '3',
      reading: '15~20',
      analysis: '15~20',
      mindmap: '15',
    },
    weeklyGoal: '독서 40분/일, 글분석 3회, 마인드맵 3개',
  },
  {
    id: 'elem46',
    name: '초등 고학년',
    subtitle: '4~6학년 · 전략적 학습',
    icon: '🔍',
    dailyMinutes: '70~90',
    headerBg: 'bg-green-600',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-50',
    textColor: 'text-green-700',
    cycleMinutes: {
      planner: '7~10',
      meditation: '3',
      reading: '20~25',
      analysis: '20~25',
      mindmap: '15~20',
    },
    weeklyGoal: '독서 60분/일, 글분석 5회, 통합 마인드맵 3개, SMART 플래너 매일',
  },
  {
    id: 'mid',
    name: '중등',
    subtitle: '1~3학년 · 메타인지 심화',
    icon: '🧩',
    dailyMinutes: '80~100',
    headerBg: 'bg-blue-600',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-50',
    textColor: 'text-blue-700',
    cycleMinutes: {
      planner: '10',
      meditation: '3',
      reading: '25~30',
      analysis: '25~30',
      mindmap: '15~20',
    },
    weeklyGoal: '독서 70분/일, 글분석 5회, 개념 마인드맵 5개, 시험 대비 압축 마인드맵 1개',
  },
  {
    id: 'high',
    name: '고등',
    subtitle: '1~3학년 · 수능·학점제 연계',
    icon: '🎯',
    dailyMinutes: '90~120',
    headerBg: 'bg-purple-600',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-50',
    textColor: 'text-purple-700',
    cycleMinutes: {
      planner: '10~15',
      meditation: '3',
      reading: '25~35',
      analysis: '30~35',
      mindmap: '15~20',
    },
    weeklyGoal: '수능 지문 3~5개/일, 글분석 매일, 압축 마인드맵 2개, 플래너 100% 작성',
  },
]

export interface Dimension {
  id: DimensionId
  name: string
  shortName: string
  icon: string
  /** Tailwind bg 클래스 */
  bgColor: string
  /** Tailwind text 클래스 */
  textColor: string
  description: string
  /** 헥스 컬러 (SVG 레이더 차트용) */
  color: string
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 1,
    name: '지적 역량',
    shortName: '지적',
    icon: '🧠',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: '지식 습득·분석·통합·창의적 활용 능력',
    color: '#3b82f6',
  },
  {
    id: 2,
    name: '정서 강건성',
    shortName: '정서',
    icon: '💛',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    description: '긍정적 자아상, 스트레스 대처, 실패 극복, 감사',
    color: '#f59e0b',
  },
  {
    id: 3,
    name: '신체 강건성',
    shortName: '신체',
    icon: '💪',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    description: '건강한 신체, 규칙적 운동, 수면, 올바른 식습관',
    color: '#10b981',
  },
  {
    id: 4,
    name: '자기관리',
    shortName: '자기',
    icon: '🗓️',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    description: '시간 관리, 목표 설정, 자기 모니터링, 습관 형성',
    color: '#f97316',
  },
  {
    id: 5,
    name: '인간관계',
    shortName: '관계',
    icon: '🤝',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    description: '배려, 소통, 협력, 갈등 해결, 공감 능력',
    color: '#8b5cf6',
  },
]

/** 5단계 사이클 메타 정보 */
export const CYCLE_STEPS = [
  {
    key: 'planner' as const,
    number: '①',
    name: '학습 플래너',
    icon: '📝',
    description: '오늘의 목표 설정 → 시간 배분 → 우선순위 확인',
    purpose: '자기관리의 핵심 도구 — 계획·실행·성찰의 반복',
  },
  {
    key: 'meditation' as const,
    number: '②',
    name: '3분 묵상',
    icon: '🧘',
    description: '감사 → 회상 → 수용 → 다짐 → 조절',
    purpose: '학습 시작 전 마음과 뇌를 준비시키는 메타인지 훈련',
  },
  {
    key: 'reading' as const,
    number: '③',
    name: '속해독서',
    icon: '📚',
    description: '훑기 → 이해 독서 → 핵심 파악',
    purpose: '빠르게 읽되 정확하게 이해하는 능력 훈련',
  },
  {
    key: 'analysis' as const,
    number: '④',
    name: '글분석',
    icon: '🔎',
    description: '핵심어 추출 → 단락 요약 → 구조 파악',
    purpose: '비판적 사고력과 깊은 이해력 훈련',
  },
  {
    key: 'mindmap' as const,
    number: '⑤',
    name: '마인드맵',
    icon: '🗺️',
    description: '중심 개념 → 가지 확장 → 연결 관계 시각화',
    purpose: '좌뇌(논리)와 우뇌(창의)를 동시에 활성화',
  },
] as const

/** 빠른 접근 메뉴 */
export const QUICK_ACTIONS = [
  { path: '/planner', icon: '📝', name: '학습 플래너', color: 'bg-blue-50 border-blue-200' },
  { path: '/reading', icon: '⏱️', name: '속해독서', color: 'bg-green-50 border-green-200' },
  { path: '/mindmap', icon: '🗺️', name: '마인드맵', color: 'bg-purple-50 border-purple-200' },
  { path: '/analysis', icon: '🔎', name: '글분석', color: 'bg-yellow-50 border-yellow-200' },
  { path: '/dashboard', icon: '📊', name: '대시보드', color: 'bg-orange-50 border-orange-200' },
  { path: '/portfolio',  icon: '📁', name: '포트폴리오', color: 'bg-pink-50 border-pink-200' },
  { path: '/meditation', icon: '🧘', name: '3분 묵상',   color: 'bg-teal-50 border-teal-200' },
] as const

export function getGradeById(id: string): GradeGroup | undefined {
  return GRADE_GROUPS.find((g) => g.id === id)
}
