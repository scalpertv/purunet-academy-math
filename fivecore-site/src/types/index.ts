// 전역 공유 타입 정의

export type GradeCode = 'age6' | 'age7' | 'elem13' | 'elem46' | 'mid' | 'high'

export type DimensionId = 1 | 2 | 3 | 4 | 5

export type SubjectCode = 'korean' | 'math' | 'english' | 'social' | 'science'

/** 5단계 학습 사이클 단계 */
export type CycleStep = 'planner' | 'meditation' | 'reading' | 'analysis' | 'mindmap'

/** 플래너 하루 기록 */
export interface DailyRecord {
  date: string // YYYY-MM-DD
  grade: GradeCode
  cycleCompleted: Record<CycleStep, boolean>
  achievementRate: number // 0~100
  goals: string[]
  reflection: {
    good: string
    bad: string
    improve: string
  }
  body: {
    sleep: number // 시간
    exercise: number // 분
    water: number // 잔
    breakfast: boolean
  }
}

/** 독서 기록 */
export interface ReadingRecord {
  id: string
  date: string
  title: string
  charCount: number
  durationSeconds: number
  cpm: number // 분당 글자 수
  summary: string
  notes: {
    beforePredict: string
    afterCheck: string
    newLearning: string
    questions: string
  }
}

/** 글분석 기록 */
export interface AnalysisRecord {
  id: string
  date: string
  grade: GradeCode
  title: string
  textType: string
  fields: Record<string, string>
}

/** 마인드맵 노드 */
export interface MindMapNode {
  id: string
  text: string
  color: string
  children: MindMapNode[]
}

/** 마인드맵 기록 */
export interface MindMapRecord {
  id: string
  date: string
  title: string
  grade: GradeCode
  subject: string
  root: MindMapNode
}

/** 5차원 자기 평가 점수 */
export interface DimensionScore {
  dim1: number // 1~5
  dim2: number
  dim3: number
  dim4: number
  dim5: number
}
