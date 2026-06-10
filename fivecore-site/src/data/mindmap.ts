// 마인드맵 도구 — 데이터 구조, 학년군별 템플릿, 저장 유틸 (커리큘럼 2.6장 기반)
import type { GradeCode } from '../types'

// ── 데이터 구조 ───────────────────────────────────────
export interface MindMapBranch {
  id: string
  text: string
  color: string
  children: string[]
}

export interface MindMapData {
  id: string
  date: string       // YYYY-MM-DD
  grade: GradeCode
  centerTopic: string
  branches: MindMapBranch[]
}

export interface MindMapTemplate {
  name: string
  centerTopic: string
  branches: Omit<MindMapBranch, 'id'>[]
}

// ── 색상 팔레트 (6색) ─────────────────────────────────
export const BRANCH_COLORS = [
  '#ef4444',  // red
  '#f97316',  // orange
  '#eab308',  // yellow
  '#22c55e',  // green
  '#3b82f6',  // blue
  '#a855f7',  // purple
] as const

// ── 학년군별 최대 복잡도 ───────────────────────────────
export const MAX_BRANCHES: Record<GradeCode, number> = {
  age6: 3, age7: 4, elem13: 6, elem46: 7, mid: 7, high: 7,
}
export const MAX_SUBITEMS: Record<GradeCode, number> = {
  age6: 0, age7: 0, elem13: 2, elem46: 3, mid: 3, high: 3,
}

// ── 학년군별 마인드맵 템플릿 ──────────────────────────
export const MINDMAP_TEMPLATES: Record<GradeCode, MindMapTemplate[]> = {
  age6: [
    {
      name: '오늘의 이야기',
      centerTopic: '오늘의 이야기',
      branches: [
        { text: '처음에는', color: '#3b82f6', children: [] },
        { text: '중간에는', color: '#22c55e', children: [] },
        { text: '끝에는',   color: '#a855f7', children: [] },
      ],
    },
    {
      name: '내가 좋아하는 것',
      centerTopic: '내가 좋아하는 것',
      branches: [
        { text: '색깔', color: '#ef4444', children: [] },
        { text: '음식', color: '#f97316', children: [] },
        { text: '놀이', color: '#eab308', children: [] },
      ],
    },
  ],
  age7: [
    {
      name: '새로운 낱말',
      centerTopic: '새로운 낱말',
      branches: [
        { text: '뜻',      color: '#3b82f6', children: [] },
        { text: '예시',    color: '#22c55e', children: [] },
        { text: '비슷한 말', color: '#a855f7', children: [] },
        { text: '내 문장', color: '#f97316', children: [] },
      ],
    },
    {
      name: '오늘 배운 것',
      centerTopic: '오늘 배운 것',
      branches: [
        { text: '국어', color: '#ef4444', children: [] },
        { text: '수학', color: '#3b82f6', children: [] },
        { text: '영어', color: '#22c55e', children: [] },
      ],
    },
  ],
  elem13: [
    {
      name: '곱셈이란?',
      centerTopic: '곱셈이란?',
      branches: [
        { text: '의미',    color: '#3b82f6', children: ['같은 수 더하기', '곱셈식'] },
        { text: '구구단',  color: '#ef4444', children: ['2~5단', '6~9단'] },
        { text: '활용',    color: '#22c55e', children: ['물건 세기', '넓이'] },
        { text: '기억법',  color: '#f97316', children: ['노래', '패턴'] },
      ],
    },
    {
      name: '이야기 구조',
      centerTopic: '이야기 구조',
      branches: [
        { text: '인물',  color: '#a855f7', children: ['주인공', '주변 인물'] },
        { text: '배경',  color: '#3b82f6', children: ['장소', '시간'] },
        { text: '사건',  color: '#ef4444', children: ['문제', '해결'] },
        { text: '결말',  color: '#22c55e', children: ['교훈', '느낌'] },
      ],
    },
  ],
  elem46: [
    {
      name: '오늘 읽은 글',
      centerTopic: '오늘 읽은 글',
      branches: [
        { text: '주제',       color: '#3b82f6', children: ['주제문', '핵심 내용', '뒷받침'] },
        { text: '근거',       color: '#ef4444', children: ['근거 1', '근거 2', '근거 3'] },
        { text: '핵심어',     color: '#f97316', children: ['단어 1', '단어 2', '단어 3'] },
        { text: '새로 알게 됨', color: '#22c55e', children: ['사실 1', '사실 2'] },
        { text: '내 생각',    color: '#a855f7', children: ['동의/비동의', '이유'] },
      ],
    },
    {
      name: '단원 개념 정리',
      centerTopic: '단원 주제',
      branches: [
        { text: '핵심 개념', color: '#3b82f6', children: ['정의', '특징', '종류'] },
        { text: '예시',      color: '#22c55e', children: ['예시 1', '예시 2'] },
        { text: '적용',      color: '#f97316', children: ['활용 1', '활용 2'] },
        { text: '연결',      color: '#a855f7', children: ['관련 개념'] },
      ],
    },
  ],
  mid: [
    {
      name: '논설문 구조',
      centerTopic: '논설문 구조',
      branches: [
        { text: '문제 제기', color: '#ef4444', children: ['쟁점', '현황'] },
        { text: '핵심 주장', color: '#3b82f6', children: ['입장', '요약'] },
        { text: '근거 1',   color: '#22c55e', children: ['내용', '타당성'] },
        { text: '근거 2',   color: '#f97316', children: ['내용', '사례'] },
        { text: '결론',     color: '#a855f7', children: ['재주장', '의의'] },
      ],
    },
    {
      name: '단원 개념 통합',
      centerTopic: '단원 주제',
      branches: [
        { text: '핵심 개념', color: '#3b82f6', children: ['정의', '특성', '분류'] },
        { text: '배경·원인', color: '#ef4444', children: ['원인 1', '원인 2'] },
        { text: '과정',     color: '#22c55e', children: ['단계 1', '단계 2'] },
        { text: '결과',     color: '#f97316', children: ['단기', '장기'] },
        { text: '해석',     color: '#a855f7', children: ['의의', '비판'] },
      ],
    },
  ],
  high: [
    {
      name: '수능 지문 압축',
      centerTopic: '지문 압축',
      branches: [
        { text: '분야',    color: '#3b82f6', children: ['인문·사회', '과학·기술', '예술'] },
        { text: '핵심 개념', color: '#ef4444', children: ['정의', '세부 구분'] },
        { text: '전개 방식', color: '#22c55e', children: ['비교·분류', '인과·과정'] },
        { text: '문단 요약', color: '#f97316', children: ['전반부', '후반부', '결론'] },
        { text: '핵심 주장', color: '#a855f7', children: ['한 줄 요약'] },
      ],
    },
    {
      name: '진로 탐색',
      centerTopic: '나의 진로',
      branches: [
        { text: '관심 분야', color: '#3b82f6', children: ['전공', '직업'] },
        { text: '필요 역량', color: '#ef4444', children: ['지식', '기술', '태도'] },
        { text: '준비 방법', color: '#22c55e', children: ['학교 공부', '자기계발'] },
        { text: '롤모델',   color: '#f97316', children: ['인물', '배울 점'] },
        { text: '단기 목표', color: '#a855f7', children: ['3개월', '6개월'] },
      ],
    },
  ],
}

// ── localStorage 키 ────────────────────────────────────
export const MINDMAP_LOG_KEY   = 'mindmap_log_v1'
export const MINDMAP_GRADE_KEY = 'mindmap_grade_pref'

export function loadMindmaps(): MindMapData[] {
  try {
    const raw = localStorage.getItem(MINDMAP_LOG_KEY)
    return raw ? (JSON.parse(raw) as MindMapData[]) : []
  } catch { return [] }
}

export function saveMindmap(data: MindMapData): void {
  const existing = loadMindmaps()
  const idx = existing.findIndex((m) => m.id === data.id)
  const updated =
    idx >= 0
      ? existing.map((m, i) => (i === idx ? data : m))
      : [data, ...existing].slice(0, 20)
  localStorage.setItem(MINDMAP_LOG_KEY, JSON.stringify(updated))
}

export function deleteMindmap(id: string): void {
  const updated = loadMindmaps().filter((m) => m.id !== id)
  localStorage.setItem(MINDMAP_LOG_KEY, JSON.stringify(updated))
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── 새 가지 생성 ───────────────────────────────────────
export function newBranch(index: number): MindMapBranch {
  return {
    id: `${Date.now()}_${index}`,
    text: '',
    color: BRANCH_COLORS[index % BRANCH_COLORS.length],
    children: [],
  }
}
