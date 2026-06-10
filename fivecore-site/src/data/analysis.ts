// 글분석 도구 — 학년군별 국어/영어 분석 틀 정의 (커리큘럼 2.5장 + 4.1~4.3장)
import type { GradeCode } from '../types'

export type AnalysisLang = 'korean' | 'english'

// ── 필드 정의 ──────────────────────────────────────────
export interface AnalysisFieldDef {
  key: string
  label: string
  /** select 타입은 placeholder 불필요 */
  placeholder?: string
  /** text=한 줄 입력, textarea=여러 줄, select=버튼 선택 */
  type: 'text' | 'textarea' | 'select'
  options?: string[]
  rows?: number
}

// ── 분석 틀 (템플릿) ────────────────────────────────────
export interface AnalysisTemplate {
  gradeCode: GradeCode
  lang: AnalysisLang
  name: string
  /** 글 종류 선택지 */
  textTypes: string[]
  fields: AnalysisFieldDef[]
}

// ── 저장 기록 타입 ─────────────────────────────────────
export interface AnalysisRecord {
  id: string
  date: string        // YYYY-MM-DD
  grade: GradeCode
  lang: AnalysisLang
  textTitle: string
  textType: string
  templateName: string
  answers: Record<string, string>
}

// ── localStorage 키 ───────────────────────────────────
export const ANALYSIS_LOG_KEY = 'analysis_log_v1'
export const ANALYSIS_GRADE_KEY = 'analysis_grade_pref'

// ══════════════════════════════════════════════════════
// 국어 글분석 틀 — 6개 학년군
// ══════════════════════════════════════════════════════

const KO_age6: AnalysisTemplate = {
  gradeCode: 'age6', lang: 'korean',
  name: '이야기 순서 카드',
  textTypes: ['동화', '그림책', '이야기책'],
  fields: [
    { key: 'begin',   label: '처음에는?',       type: 'textarea', rows: 2, placeholder: '이야기가 어떻게 시작됐나요?' },
    { key: 'middle',  label: '중간에는?',        type: 'textarea', rows: 2, placeholder: '어떤 일이 있었나요?' },
    { key: 'end',     label: '끝에는?',          type: 'textarea', rows: 2, placeholder: '이야기가 어떻게 끝났나요?' },
    { key: 'feeling', label: '어떤 느낌이 들었나요?', type: 'textarea', rows: 2, placeholder: '기쁨, 슬픔, 신남, 무서움...' },
  ],
}

const KO_age7: AnalysisTemplate = {
  gradeCode: 'age7', lang: 'korean',
  name: '핵심 단어 + 원인-결과',
  textTypes: ['동화', '이야기', '짧은 글', '그림책'],
  fields: [
    { key: 'keywords', label: '핵심 단어',          type: 'text',     placeholder: '가장 중요한 단어 2~3개를 써보세요.' },
    { key: 'cause',    label: '무슨 일이 생겼나요? (원인)', type: 'textarea', rows: 2, placeholder: '왜 그런 일이 생겼나요?' },
    { key: 'effect',   label: '그래서 어떻게 됐나요? (결과)', type: 'textarea', rows: 2, placeholder: '결과가 어떻게 됐나요?' },
    { key: 'learned',  label: '새로 알게 된 것',    type: 'textarea', rows: 2, placeholder: '읽고 나서 새롭게 알게 된 것이 있나요?' },
  ],
}

const KO_elem13: AnalysisTemplate = {
  gradeCode: 'elem13', lang: 'korean',
  name: '기본 5단계 글분석',
  textTypes: ['설명문', '이야기', '동화', '시', '기타'],
  fields: [
    { key: 'purpose',   label: '글의 목적',             type: 'select',   options: ['설명', '설득', '감동', '정보 전달'] },
    { key: 'keywords',  label: '문단별 핵심어 (최대 3개/문단)', type: 'textarea', rows: 2, placeholder: '각 문단의 핵심 단어를 써보세요.' },
    { key: 'summary',   label: '문단 한 줄 요약',        type: 'textarea', rows: 3, placeholder: '각 문단을 한 줄씩 요약해보세요.' },
    { key: 'structure', label: '글의 구조',             type: 'select',   options: ['두괄식', '미괄식', '양괄식', '기타'] },
    { key: 'thesis',    label: '전체 주제문 (한 문장)',  type: 'textarea', rows: 2, placeholder: '이 글의 핵심 메시지를 한 문장으로 써보세요.' },
  ],
}

const KO_elem46: AnalysisTemplate = {
  gradeCode: 'elem46', lang: 'korean',
  name: '기본 5단계 + 심화 비판적 읽기',
  textTypes: ['설명문', '논설문', '신문 기사', '이야기', '기타'],
  fields: [
    { key: 'purpose',   label: '글의 목적',             type: 'select',   options: ['설명', '설득', '감동', '정보 전달'] },
    { key: 'keywords',  label: '문단별 핵심어 (최대 3개/문단)', type: 'textarea', rows: 2, placeholder: '각 문단의 핵심 단어를 써보세요.' },
    { key: 'summary',   label: '문단 한 줄 요약',        type: 'textarea', rows: 3, placeholder: '각 문단을 한 줄씩 요약해보세요.' },
    { key: 'structure', label: '글의 구조',             type: 'select',   options: ['두괄식', '미괄식', '양괄식', '기타'] },
    { key: 'thesis',    label: '전체 주제문 (한 문장)',  type: 'textarea', rows: 2, placeholder: '이 글의 핵심 메시지를 한 문장으로 써보세요.' },
    { key: 'factVsOp',  label: '사실 vs. 의견 구분',    type: 'textarea', rows: 2, placeholder: '사실: (검증 가능한 내용)\n의견: (필자의 판단·주장)' },
    { key: 'claimEvid', label: '주장 vs. 근거 분리',    type: 'textarea', rows: 2, placeholder: '주장: \n근거: ' },
    { key: 'critical',  label: '비판적 읽기',           type: 'textarea', rows: 2, placeholder: '빠진 것은? 다른 관점은 없을까?' },
    { key: 'myView',    label: '나의 반응',             type: 'textarea', rows: 2, placeholder: '동의/비동의? 이유는?' },
  ],
}

const KO_mid: AnalysisTemplate = {
  gradeCode: 'mid', lang: 'korean',
  name: '논설문 분석 6단계 틀',
  textTypes: ['논설문', '설명문', '비문학', '신문 기사', '기타'],
  fields: [
    { key: 'problem',   label: '① 문제 제기',          type: 'textarea', rows: 2, placeholder: '무엇이 문제인가?' },
    { key: 'claim',     label: '② 핵심 주장',          type: 'textarea', rows: 2, placeholder: '필자의 입장은 무엇인가?' },
    { key: 'evidence',  label: '③ 주요 논거',          type: 'textarea', rows: 3, placeholder: '논거 1:\n논거 2:\n논거 3:' },
    { key: 'counterArg',label: '④ 반론 인정 여부',     type: 'textarea', rows: 2, placeholder: '반론을 인정하는 부분이 있나요? 있다면 어떻게 처리했나요?' },
    { key: 'conclusion',label: '⑤ 결론의 설득력',      type: 'textarea', rows: 2, placeholder: '결론이 설득력 있나요? 이유는?' },
    { key: 'myEval',    label: '⑥ 내 평가',            type: 'textarea', rows: 2, placeholder: '동의하나요, 비동의하나요? 이유를 3가지 이상 써보세요.' },
  ],
}

const KO_high: AnalysisTemplate = {
  gradeCode: 'high', lang: 'korean',
  name: '수능 비문학 독해 분석 틀',
  textTypes: ['인문', '사회', '과학', '기술', '예술'],
  fields: [
    { key: 'domain',    label: '① 글의 분야',          type: 'select',   options: ['인문', '사회', '과학', '기술', '예술'] },
    { key: 'concept',   label: '② 핵심 개념 정의',     type: 'textarea', rows: 2, placeholder: '지문에서 핵심 개념을 직접 정의하세요.' },
    { key: 'develop',   label: '③ 전개 방식',          type: 'select',   options: ['비교', '분류', '예시', '인과', '과정', '복합'] },
    { key: 'paraSum',   label: '④ 문단별 핵심 내용 (한 줄씩)', type: 'textarea', rows: 4, placeholder: '1문단:\n2문단:\n3문단:\n4문단:' },
    { key: 'difficult', label: '⑤ 어렵게 느껴진 부분', type: 'textarea', rows: 2, placeholder: '이해하기 어려웠던 부분과 이유를 써보세요.' },
    { key: 'gist',      label: '⑥ 이 글이 말하려는 것 (한 줄)', type: 'text', placeholder: '지문 전체의 핵심을 한 문장으로 압축하세요.' },
  ],
}

// ══════════════════════════════════════════════════════
// 영어 글분석 틀 — 학년군별 3가지 수준
// ══════════════════════════════════════════════════════

const makeEN_lower = (gradeCode: GradeCode): AnalysisTemplate => ({
  gradeCode, lang: 'english',
  name: '4-Question Story Analysis',
  textTypes: ['Story', 'Picture Book', 'Fairy Tale', 'Short Text'],
  fields: [
    { key: 'character', label: 'Who is the main character?', type: 'text',     placeholder: 'Write the main character\'s name.' },
    { key: 'plot',      label: 'What happened? (Beginning → Middle → End)', type: 'textarea', rows: 3, placeholder: 'Beginning:\nMiddle:\nEnd:' },
    { key: 'feeling',   label: 'How did the character feel?', type: 'text',     placeholder: 'happy / sad / scared / excited...' },
    { key: 'learned',   label: 'What did you learn?',         type: 'textarea', rows: 2, placeholder: 'Write one thing you learned from this story.' },
  ],
})

const EN_age6  = makeEN_lower('age6')
const EN_age7  = makeEN_lower('age7')
const EN_elem13 = makeEN_lower('elem13')

const EN_elem46: AnalysisTemplate = {
  gradeCode: 'elem46', lang: 'english',
  name: '6-Field Text Analysis',
  textTypes: ['Narrative', 'Informational', 'Persuasive', 'News Article'],
  fields: [
    { key: 'textType',    label: 'Text Type',            type: 'select',   options: ['Narrative', 'Informational', 'Persuasive'] },
    { key: 'mainIdea',    label: 'Main Idea',            type: 'textarea', rows: 2, placeholder: 'What is the main idea of this text?' },
    { key: 'details',     label: 'Key Details',          type: 'textarea', rows: 3, placeholder: '1. \n2. \n3. ' },
    { key: 'vocabulary',  label: 'New Vocabulary',       type: 'textarea', rows: 2, placeholder: 'List new words and their meanings.' },
    { key: 'opinion',     label: 'My Opinion',           type: 'textarea', rows: 2, placeholder: 'What do you think about this text?' },
    { key: 'connection',  label: 'Connection to My Life', type: 'textarea', rows: 2, placeholder: 'How does this connect to your own experience?' },
  ],
}

const makeEN_upper = (gradeCode: GradeCode): AnalysisTemplate => ({
  gradeCode, lang: 'english',
  name: '수능 영어 독해 전략 4단계',
  textTypes: ['수능 영어 지문', 'EBS 연계 지문', '영어 기사', '영어 에세이'],
  fields: [
    { key: 'blank',   label: '① 빈칸 추론 전략', type: 'textarea', rows: 2, placeholder: '주제문 위치 파악 → 반복 어휘 찾기 → 빈칸 추론 근거:' },
    { key: 'order',   label: '② 순서 배열 전략', type: 'textarea', rows: 2, placeholder: '접속사·대명사·지시어 연결 확인 → 논리적 흐름:' },
    { key: 'unfit',   label: '③ 무관한 문장',    type: 'textarea', rows: 2, placeholder: '글의 흐름에서 벗어난 문장과 이유:' },
    { key: 'summary', label: '④ 요약문 완성',    type: 'text',     placeholder: '지문 전체 핵심을 한 문장으로 요약하세요.' },
  ],
})

const EN_mid  = makeEN_upper('mid')
const EN_high = makeEN_upper('high')

// ── 전체 템플릿 목록 ───────────────────────────────────
const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  KO_age6, KO_age7, KO_elem13, KO_elem46, KO_mid, KO_high,
  EN_age6, EN_age7, EN_elem13, EN_elem46, EN_mid, EN_high,
]

export function getTemplate(grade: GradeCode, lang: AnalysisLang): AnalysisTemplate | undefined {
  return ANALYSIS_TEMPLATES.find((t) => t.gradeCode === grade && t.lang === lang)
}

// ── localStorage 유틸 ──────────────────────────────────
export function loadAnalysisLog(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(ANALYSIS_LOG_KEY)
    return raw ? (JSON.parse(raw) as AnalysisRecord[]) : []
  } catch {
    return []
  }
}

export function saveAnalysisRecord(record: AnalysisRecord): void {
  const log = loadAnalysisLog()
  const updated = [record, ...log].slice(0, 30)
  localStorage.setItem(ANALYSIS_LOG_KEY, JSON.stringify(updated))
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
