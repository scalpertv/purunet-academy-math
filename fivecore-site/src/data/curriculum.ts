// 과목별 × 학년군별 커리큘럼 데이터 (원동연 박사 5차원 전면교육 + 2022 개정 교육과정)
import type { GradeCode } from '../types'

export type SubjectCode = 'korean' | 'math' | 'english' | 'social' | 'science'

export interface CurriculumBlock {
  title: string
  bullets: string[]
  highlight?: string   // 전략·템플릿 등 인용 표시
}

export interface GradeCurriculum {
  grade: GradeCode
  weeklyGoal: string
  blocks: CurriculumBlock[]
  mindmapTopic: string
}

export interface SubjectDef {
  id: SubjectCode
  label: string
  icon: string
  color: string
  goal: string
  grades: GradeCurriculum[]
}

// ── 국어 ────────────────────────────────────────────────
const KOREAN: SubjectDef = {
  id: 'korean', label: '국어', icon: '📖', color: '#ef4444',
  goal: '비판적·창의적 사고, 의사소통, 자기 성찰·계발, 문화 향유',
  grades: [
    { grade: 'age6', weeklyGoal: '낱말 10개 읽기, 짧은 문장 3개 따라 쓰기', mindmapTopic: '내가 좋아하는 것',
      blocks: [
        { title: '음운 인식', bullets: ['자음·모음 소리 구별', '글자 모양 인식', '그림책 낭독 → 이야기 순서 카드'] },
        { title: '낱말 읽기', bullets: ['받침 없는 낱말 → 받침 있는 낱말', '반복 패턴 그림책 활용', '주인공 마음 말하기'] },
        { title: '문장 이해', bullets: ['그림책 속 짧은 문장 따라 읽기', '1권/일 목표', '처음-중간-끝 구분'] },
      ],
    },
    { grade: 'age7', weeklyGoal: '짧은 글 3편 읽고 각 글 요약 문장 1개 쓰기', mindmapTopic: '내가 좋아하는 것',
      blocks: [
        { title: '읽기 유창성', bullets: ['2~3음절 낱말 빠르게 읽기', '문장 읽기 독립 수행'] },
        { title: '쓰기', bullets: ['주어+서술어 기본 문장 쓰기', '읽은 내용에 대한 생각·느낌 말하기'] },
        { title: '글분석', bullets: ['짧은 글의 시작-중간-끝 찾기', '이야기의 원인-결과 연결하기', '내 생각 한 문장으로 쓰기'] },
        { title: '마인드맵', bullets: ['"내가 좋아하는 것" 낱말+그림 (가지 4개)', '색깔 구분하여 카테고리 나누기'] },
      ],
    },
    { grade: 'elem13', weeklyGoal: '독서 40분/일, 글분석 3회, 마인드맵 3개', mindmapTopic: '이야기 속 인물',
      blocks: [
        { title: '월별 커리큘럼 (1학년 기준)', bullets: [
          '3~4월: 한글 낱자 완성, 낱말 읽기 유창성',
          '5~6월: 짧은 문장 읽기, 소리 내어 읽기 유창성 훈련',
          '7월: 짧은 이야기 이해, 이야기 순서 파악',
          '8~9월: 일기 쓰기, 경험 말하기',
          '10월: 설명하는 글 읽기, 중요한 내용 찾기',
          '11~12월: 독서 포트폴리오 완성, 1년 성장 정리',
        ]},
        { title: '글분석 단계별 목표', bullets: [
          '1학년: 그림+단어로 분석 (인물/배경/사건)',
          '2학년: 단어+짧은 문장으로 분석',
          '3학년: 문장으로 분석, 중심 문장 찾기',
        ]},
        { title: '마인드맵 단계별 목표', bullets: [
          '1학년: 중심 주제 + 가지 3개 + 그림 위주',
          '2학년: 중심 주제 + 가지 4~5개 + 낱말',
          '3학년: 중심 주제 + 가지 5~6개 + 세부 가지 + 색깔 구분',
        ]},
      ],
    },
    { grade: 'elem46', weeklyGoal: '독서 60분/일, 글분석 5회, 통합 마인드맵 3개, SMART 플래너 매일', mindmapTopic: '설득하는 글의 주제',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '4학년: 글의 구조, 주장과 근거 파악, 토의하기',
          '5학년: 글 요약, 설득하는 글 쓰기, 매체 읽기',
          '6학년: 논설문 쓰기, 관점 파악, 작품 감상',
        ]},
        { title: '마인드맵 활용 글쓰기', bullets: [
          '주제 선정 → 마인드맵으로 아이디어 펼치기',
          '글 구조 결정 → 개요 작성 → 초고 쓰기',
          '글분석으로 자기 글 검토 → 고쳐 쓰기',
        ]},
        { title: '비판적 읽기 전략', bullets: [
          '논리 구조 파악: 두괄식/미괄식/양괄식',
          '사실 vs. 의견 구분하기',
          '"이 글에서 빠진 것은? 다른 관점은?"',
        ]},
      ],
    },
    { grade: 'mid', weeklyGoal: '독서 70분/일, 글분석 5회, 개념 마인드맵 5개, 시험 대비 압축 마인드맵 1개', mindmapTopic: '논설문 주장과 근거',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '7학년: 문학의 이해, 문법 기초, 매체 언어',
          '8학년: 비문학 읽기 심화, 토론, 보고서 쓰기',
          '9학년: 논술 기초, 고전 문학, 언어와 사회',
        ]},
        { title: '논설문 분석 틀', bullets: [
          '① 문제 제기: 무엇이 문제인가?',
          '② 핵심 주장: 필자의 입장은?',
          '③ 논거 1, 2, 3: 근거가 타당한가?',
          '④ 반론 인정 여부',
          '⑤ 결론의 설득력',
          '⑥ 내 평가: 동의/비동의 + 이유',
        ], highlight: '논설문 글분석과 마인드맵을 연계 → 논거 구조를 가지로 펼쳐 분석' },
        { title: '마인드맵 유형', bullets: [
          '단원 전체 개념 정리 마인드맵',
          '오개념 교정 마인드맵 (틀린 문제 중심)',
          '서술형 답안 구성 마인드맵',
        ]},
      ],
    },
    { grade: 'high', weeklyGoal: '수능 지문 3~5개/일, 글분석 매일, 압축 마인드맵 2개, 플래너 100% 작성', mindmapTopic: '수능 비문학 핵심 개념',
      blocks: [
        { title: '과목 구성', bullets: [
          '공통 국어 1·2: 독서·문법·화법·작문 통합',
          '선택: 문학, 독서, 화법과 작문, 언어와 매체',
        ]},
        { title: '수능 비문학 독해 분석 틀', bullets: [
          '① 글의 분야: 인문/사회/과학/기술/예술',
          '② 핵심 개념 정의',
          '③ 전개 방식: 비교/분류/예시/인과/과정',
          '④ 문단별 핵심 내용 (한 줄씩)',
          '⑤ 어렵게 느껴진 부분',
          '⑥ 이 글이 말하려는 것 (한 줄)',
        ], highlight: '분야별 전략 — 인문·사회: 주제문 중심 / 과학·기술: 도식화 / 예술·철학: 핵심 개념 정의' },
        { title: '논술 대비 전략', bullets: [
          '논증 구조 분석 (전제-논거-결론)',
          '내가 쓴 글 자기 점검 (논리 구조 검토)',
          '면접 준비용 개념 정리 마인드맵',
        ]},
      ],
    },
  ],
}

// ── 수학 ─────────────────────────────────────────────
const MATH: SubjectDef = {
  id: 'math', label: '수학', icon: '🔢', color: '#3b82f6',
  goal: '수학적 문제 해결, 수학적 추론, 수학적 의사소통, 수학적 태도',
  grades: [
    { grade: 'age6', weeklyGoal: '1~10 숫자 쓰기, 구체물 5개까지 더하기·빼기', mindmapTopic: '숫자 1~10',
      blocks: [
        { title: '수 세기', bullets: ['1~10 수, 수 기호 인식', '구체물로 수 세기', '스티커 달력 활용'] },
        { title: '수 비교', bullets: ['많다/적다/같다 구별', '크기 비교 그림 마인드맵'] },
        { title: '기초 연산', bullets: ['구체물로 더하기·빼기', '10 만들기 맵', '오늘 문제 수 목표 설정'] },
        { title: '패턴 인식', bullets: ['색깔·모양·크기 패턴 찾기', '패턴 그림 마인드맵'] },
      ],
    },
    { grade: 'age7', weeklyGoal: '덧셈 20문제, 뺄셈 20문제 정확하게 풀기', mindmapTopic: '10 만들기',
      blocks: [
        { title: '수 범위 확장', bullets: ['1~20 수 읽기·쓰기', '홀수·짝수 구별'] },
        { title: '덧셈·뺄셈', bullets: ['10 이하 덧셈 (구체물 → 반구체물 → 수식)', '10 이하 뺄셈'] },
        { title: '측정 기초', bullets: ['길이·무게 비교', '"10 만들기" 수 마인드맵'] },
      ],
    },
    { grade: 'elem13', weeklyGoal: '매일 연산 20문제, 개념 마인드맵 1개', mindmapTopic: '곱셈이란?',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '1학년: 100까지 수, 덧셈·뺄셈, 도형 기초, 측정',
          '2학년: 1000까지 수, 곱셈 도입, 길이·시각 측정',
          '3학년: 곱셈·나눗셈, 분수 도입, 도형 심화',
        ]},
        { title: '수학 마인드맵 활용법', bullets: [
          '개념 마인드맵: 중심 → 의미/방법/예시/실생활 가지 뻗기',
          '관계 마인드맵: 덧셈 ↔ 곱셈 관계 시각화',
        ], highlight: '플래너 연결: 오늘 배울 개념 / 풀 문제 수 / 어려울 부분 미리 예상' },
      ],
    },
    { grade: 'elem46', weeklyGoal: '매일 SMART 목표 수학 학습, 오답 마인드맵 1개', mindmapTopic: '내가 자주 틀리는 이유',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '4학년: 큰 수, 각도, 분수·소수 연산, 꺾은선 그래프',
          '5학년: 자연수 혼합계산, 약수·배수, 분수 연산',
          '6학년: 분수·소수 나눗셈, 비와 비율, 경우의 수',
        ]},
        { title: '문장제 속해독서 전략', bullets: [
          '1단계: 문제 전체 빠르게 읽기 (30초)',
          '2단계: 구하는 것에 밑줄',
          '3단계: 조건에 동그라미',
          '4단계: 단위 확인',
          '5단계: 풀이 전략 결정',
        ]},
        { title: '오답 분석 마인드맵', bullets: [
          '중심: 내가 자주 틀리는 이유',
          '가지: 부호 실수 / 단위 혼동 / 개념 오해 / 계산 실수',
        ]},
      ],
    },
    { grade: 'mid', weeklyGoal: '개념 마인드맵 3개, 오답 분석 매일, 서술형 연습 2회', mindmapTopic: '일차방정식',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '7학년: 정수·유리수, 문자식, 일차방정식, 기본 도형',
          '8학년: 이차방정식, 연립방정식, 일차함수, 도형의 성질',
          '9학년: 이차함수, 삼각비, 통계 기초',
        ]},
        { title: '개념 마인드맵 예시 (일차방정식)', bullets: [
          '가지 1: 의미 (미지수, 등호, 일차)',
          '가지 2: 풀이 방법 (등식의 성질, 이항)',
          '가지 3: 활용 (수 문제, 거리·속도, 나이)',
          '가지 4: 연결 개념 (연립방정식, 부등식)',
          '가지 5: 오류 유형 (부호 실수, 이항 실수)',
        ], highlight: '개념 마인드맵 → 서술형 답안 구성 → 오답 노트 마인드맵화로 순환 학습' },
      ],
    },
    { grade: 'high', weeklyGoal: '수능 수학 플래너 매일, 오답 마인드맵 2개, 단원 개념 정리 1개', mindmapTopic: '함수의 종류',
      blocks: [
        { title: '과목 구성', bullets: [
          '공통 수학 1·2: 수와 연산, 방정식·부등식, 함수, 확률·통계',
          '수학Ⅱ·미적분·기하: 이과 계열 심화',
          '확률과 통계: 인문 계열 및 공통',
        ]},
        { title: '수능 수학 플래너 전략', bullets: [
          '단원 + 개념 이해 확인 문제',
          '기본 문제 → 심화 문제 순서',
          '오늘 반드시 이해할 개념 + 틀린 문제 오답 분석',
        ], highlight: '수능 목표 점수 역산 계획 → 오늘 일일 목표 → 마인드맵으로 단원 압축 정리' },
      ],
    },
  ],
}

// ── 영어 ─────────────────────────────────────────────
const ENGLISH: SubjectDef = {
  id: 'english', label: '영어', icon: '🌐', color: '#22c55e',
  goal: '영어 의사소통, 자기관리, 공동체, 지식정보처리 역량',
  grades: [
    { grade: 'age6', weeklyGoal: '알파벳 대문자 쓰기, 색깔 단어 5개 말하기', mindmapTopic: 'Colors',
      blocks: [
        { title: '알파벳 인식', bullets: ['대문자 A~Z 노래로 익히기'] },
        { title: '기초 단어', bullets: ['색깔·동물·숫자·신체 부위 영어 단어 10개'] },
        { title: '기초 표현', bullets: ['Hello, Thank you, Good morning 등 인사말', '영어 그림책 (5~8쪽) 그림 보며 듣기'] },
      ],
    },
    { grade: 'age7', weeklyGoal: 'CVC 단어 20개 읽기, 기초 문장 3개 말하기', mindmapTopic: 'Animals',
      blocks: [
        { title: '파닉스 기초', bullets: ['CVC 단어 (cat, dog, sun) 소리 조합'] },
        { title: '기초 문장', bullets: ['I am ___, I like ___, This is ___ 문형'] },
        { title: '속해독서', bullets: ['반복 패턴 영어 그림책 (10~12쪽)'] },
      ],
    },
    { grade: 'elem13', weeklyGoal: '리더스북 3권, 사이트 워드 20개, 글분석 3회', mindmapTopic: 'My Favorite Story',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '1학년: 파닉스 CVC·CVCe 패턴 완성',
          '2학년: Sight Words 100개, 리더스북 읽기',
          '3학년: 리더스북 레벨업, 기초 문법 (be동사, 일반동사)',
        ]},
        { title: '속해독서 레벨', bullets: [
          '1학년: ORT Stage 1~2 또는 동급',
          '2학년: ORT Stage 3~4 또는 동급',
          '3학년: ORT Stage 5~6, 챕터북 입문',
        ]},
        { title: '글분석 틀 (저학년)', bullets: [
          'Who is the main character?',
          'What happened? (Beginning / Middle / End)',
          'How did the character feel?',
          'What did you learn?',
        ], highlight: '4Q 질문 → 마인드맵의 4가지 가지로 연결하여 정리' },
      ],
    },
    { grade: 'elem46', weeklyGoal: '챕터북 읽기, 단락 글쓰기 1회, 속해독서 전략 연습 3회', mindmapTopic: 'Main Idea & Details',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '4학년: 챕터북 읽기, 편지 쓰기, 현재·과거 시제',
          '5학년: 수준별 독해, 단락 글쓰기, 다양한 시제',
          '6학년: 에세이 입문, 독해 전략 심화, 조동사·수동태 기초',
        ]},
        { title: '속해독서 전략', bullets: [
          'Skimming (전체 파악): 제목+소제목+첫 문장+끝 문장',
          'Scanning (특정 정보): 핵심어 찾아 빠르게 훑기',
          'Intensive reading (정밀 독해): 중요 단락 깊이 읽기',
        ]},
        { title: '글분석 틀 (고학년)', bullets: [
          'Text Type: narrative / informational / persuasive',
          'Main idea + Key details 1, 2, 3',
          'New vocabulary',
          'My opinion & Connection to my life',
        ]},
      ],
    },
    { grade: 'mid', weeklyGoal: '논픽션 독해 5개, 어휘 마인드맵 2개, 영어 글쓰기 1회', mindmapTopic: 'port- (어근 마인드맵)',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '7학년: 독해 전략 확립, 중학 문법 완성, 영어 에세이 기초',
          '8학년: 논픽션 독해, 어휘 심화, 영어 글쓰기 심화',
          '9학년: 수능 준비 기초, 영어 토론, 원서 읽기 입문',
        ]},
        { title: '어휘 마인드맵 (어근 확장)', bullets: [
          '중심: 핵심 어근 (예: port = 운반하다)',
          '가지: export / import / transport / portable / report',
          '각 가지에 문장 예시 연결',
        ], highlight: '어근 하나로 5~7개 어휘 파생 → 시험 단어 암기 효율 3배' },
      ],
    },
    { grade: 'high', weeklyGoal: '수능 영어 지문 3개/일, 빈칸·순서·요약 유형 연습, 원서 독해', mindmapTopic: 'Inference Types',
      blocks: [
        { title: '과목 구성', bullets: [
          '공통 영어 1·2: 독해·듣기·말하기·쓰기 통합',
          '영어독해와 작문: 수능 대비 + 논술 연계',
          '영어 토론: 심화 의사소통',
        ]},
        { title: '수능 영어 글분석 전략', bullets: [
          '빈칸 추론: 주제문 위치 파악 → 반복 어휘 찾기',
          '순서 배열: 접속사·대명사·지시어 연결 확인',
          '무관한 문장: 글의 흐름에서 벗어난 문장 찾기',
          '요약문 완성: 지문 전체 핵심 → 빈칸 채우기',
        ], highlight: '유형별 오답 마인드맵 → 실수 패턴 시각화 → 반복 실수 제거' },
      ],
    },
  ],
}

// ── 사회 ─────────────────────────────────────────────
const SOCIAL: SubjectDef = {
  id: 'social', label: '사회', icon: '🌏', color: '#f97316',
  goal: '지리 이해, 역사 의식, 사회·문화 이해, 민주 시민 역량',
  grades: [
    { grade: 'age6', weeklyGoal: '나/동네/규칙에 대해 이야기하기, 마인드맵 1개', mindmapTopic: '우리 가족',
      blocks: [
        { title: '나 알기', bullets: ['이름·나이·가족 소개', '우리 동네 장소 탐색', '기본 생활 규칙 이해'] },
        { title: '마인드맵', bullets: ['"우리 가족" 그림 마인드맵', '"우리 동네에서 일하는 분들"'] },
      ],
    },
    { grade: 'age7', weeklyGoal: '가족·학교·직업에 대해 이야기하기, 마인드맵 1개', mindmapTopic: '우리 학교',
      blocks: [
        { title: '학습 내용', bullets: ['가족 역할 탐구', '학교 생활 규칙', '직업 탐구 10가지'] },
        { title: '마인드맵', bullets: ['"우리 학교에서 일하는 분들" (가지: 교장/선생님/급식/청소)'] },
      ],
    },
    { grade: 'elem13', weeklyGoal: '지역 소개 글 읽기, 글분석 카드 만들기, 마인드맵 2개', mindmapTopic: '우리 고장',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '1학년: 학교와 가정, 우리 동네 (통합교과 연계)',
          '2학년: 계절과 생활, 이웃과 생활 (통합교과 연계)',
          '3학년: 우리 고장 (지도 읽기, 장소의 의미, 지역 문화)',
        ]},
        { title: '사회 글분석 활동', bullets: [
          '지역 소개 글 읽고 핵심 정보 카드 만들기',
          '역사 이야기 읽고 시간 순서 정리하기',
          '뉴스 기사 읽고 중요한 사실 3가지 찾기',
        ]},
      ],
    },
    { grade: 'elem46', weeklyGoal: '역사 사건 마인드맵 1개, 사회 글분석 3회', mindmapTopic: '역사 사건 분석',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '4학년: 지역의 특성, 사회 변화와 문화 다양성',
          '5학년: 국토와 환경, 인권과 법, 경제 기초',
          '6학년: 한국사 (조선~현대), 세계 여러 나라, 지속 가능한 발전',
        ]},
        { title: '역사 사건 마인드맵 구조', bullets: [
          '중심: 역사 사건명',
          '가지 1: 원인',
          '가지 2: 전개 과정',
          '가지 3: 결과',
          '가지 4: 역사적 의미',
          '가지 5: 오늘날과의 연결',
        ], highlight: '사건명 마인드맵 → 글분석 → 논설문 쓰기로 이어지는 3단계 심화' },
      ],
    },
    { grade: 'mid', weeklyGoal: '사회 개념 마인드맵 3개, 시사 뉴스 글분석 2회', mindmapTopic: '사회 변동의 원인',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '7학년: 자연환경과 인간, 인권과 법, 경제 생활',
          '8학년: 정치 과정, 경제 성장, 사회 변동',
          '9학년: 세계화, 미래 사회, 지속 가능한 발전',
        ]},
        { title: '사회 글분석 전략', bullets: [
          '핵심 개념 + 원인-결과 구조 파악',
          '사실 vs. 의견 구분',
          '다양한 관점 비교 (경제/사회/환경)',
        ]},
      ],
    },
    { grade: 'high', weeklyGoal: '통합사회 단원 마인드맵 1개, 수행평가 논술 연습 1회', mindmapTopic: '행복이란 무엇인가',
      blocks: [
        { title: '과목 구성', bullets: [
          '통합사회 1·2: 행복·자연환경·문화·정치·경제·사회변동·지속가능발전',
          '선택: 한국사, 세계사, 경제, 정치와 법, 지리',
        ]},
        { title: '통합사회 마인드맵 전략', bullets: [
          '대단원 압축 마인드맵 (A4 1장)',
          '개념 연결: 경제 ↔ 정치 ↔ 사회 통합 구조화',
          '세특 연동: 마인드맵을 탐구 활동 근거 자료로 활용',
        ]},
      ],
    },
  ],
}

// ── 과학 ─────────────────────────────────────────────
const SCIENCE: SubjectDef = {
  id: 'science', label: '과학', icon: '🔬', color: '#a855f7',
  goal: '과학적 탐구, 과학적 사고, 과학 문화 이해, 과학·기술·사회 연계',
  grades: [
    { grade: 'age6', weeklyGoal: '관찰 일지 3회, 마인드맵 1개, "왜?" 질문 5개', mindmapTopic: '봄에 볼 수 있는 것들',
      blocks: [
        { title: '학습 내용', bullets: ['오감 탐구', '날씨·계절·식물·동물 관찰', '"왜?" 질문 만들기'] },
        { title: '과학 탐구 사이클', bullets: [
          '관찰 → 질문 → 예상 → 탐구 → 결과 정리 → 마인드맵 → 발표',
        ]},
      ],
    },
    { grade: 'age7', weeklyGoal: '식물 관찰 일지, 고체·액체·기체 실험, 마인드맵 1개', mindmapTopic: '씨앗에서 열매까지',
      blocks: [
        { title: '학습 내용', bullets: [
          '고체·액체·기체 기초 (만지기·흘리기·불기)',
          '식물의 자람 (씨앗 → 싹 → 꽃 → 열매)',
          '동물 탐구 (집 근처 동물 관찰)',
        ]},
        { title: '마인드맵', bullets: ['"씨앗에서 열매까지" 성장 과정 마인드맵'] },
      ],
    },
    { grade: 'elem13', weeklyGoal: '실험 보고서 2회, 과학 개념 마인드맵 2개', mindmapTopic: '동물의 한살이',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '1학년: 살아있는 것과 살아있지 않은 것, 날씨',
          '2학년: 동물과 식물, 물질의 성질 기초',
          '3학년: 동물의 한살이, 자석, 지층과 화석, 날씨와 우리 생활',
        ]},
        { title: '실험 보고서 글분석 구조', bullets: [
          '목적 → 가설 → 준비물 → 방법 → 결과 → 결론',
        ], highlight: '실험 후 보고서 → 마인드맵으로 개념 정리 → 플래너에 오늘의 과학 목표 기록' },
      ],
    },
    { grade: 'elem46', weeklyGoal: '탐구 보고서 1회, 과학 개념 마인드맵 2개, 독해 3회', mindmapTopic: '태양계',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '4학년: 식물, 지층·화석, 혼합물, 그림자',
          '5학년: 온도와 열, 태양계, 용해, 산과 염기',
          '6학년: 생물과 환경, 전기, 연소, 계절의 변화',
        ]},
        { title: '개념 마인드맵 예시 (태양계)', bullets: [
          '가지 1: 태양 (크기, 역할, 에너지)',
          '가지 2: 행성 8개 (수금지화목토천해)',
          '가지 3: 지구의 특징 (물, 공기, 생명체)',
          '가지 4: 달과 조석 현상',
          '가지 5: 인공위성·우주 탐사',
        ]},
      ],
    },
    { grade: 'mid', weeklyGoal: '단원 개념 마인드맵 3개, 탐구 보고서 1회, 실험 글분석 3회', mindmapTopic: '광합성',
      blocks: [
        { title: '학년별 학습 내용', bullets: [
          '7학년: 생물 다양성, 지구계, 힘과 운동',
          '8학년: 광합성, 지구 내부, 전기와 자기',
          '9학년: 유전, 판 구조론, 에너지',
        ]},
        { title: '과학 마인드맵 전략', bullets: [
          '단원 핵심 개념 → 관련 현상·실험 연결',
          '수식·그래프를 가지로 시각화',
          '생활 속 응용 예시 연결 (인과 가지)',
        ]},
      ],
    },
    { grade: 'high', weeklyGoal: '통합과학 단원 마인드맵 1개, 수능 과학 지문 분석 3회', mindmapTopic: '에너지 전환',
      blocks: [
        { title: '과목 구성', bullets: [
          '통합과학 1·2: 물질과 규칙성, 시스템과 상호작용, 변화와 다양성, 환경과 에너지',
          '선택: 물리학Ⅱ, 화학Ⅱ, 생명과학Ⅱ, 지구과학Ⅱ',
        ]},
        { title: '수능 과학 지문 독해 전략', bullets: [
          '과학·기술 지문: 핵심 개념 정의 → 도식화 마인드맵',
          '실험 설계 글: 조건-결과-결론 구조 파악',
          '그래프·표 해석: 변수 관계를 가지로 표현',
        ], highlight: '개념 마인드맵 + 수능 지문 분석 연계 → 통합과학 세특 자료로 활용' },
      ],
    },
  ],
}

export const SUBJECTS: SubjectDef[] = [KOREAN, MATH, ENGLISH, SOCIAL, SCIENCE]

export function getSubject(id: SubjectCode): SubjectDef {
  return SUBJECTS.find((s) => s.id === id) ?? KOREAN
}

// ── 연간 학습 로드맵 요약 ───────────────────────────
export interface AnnualRoadmapRow {
  grade: GradeCode
  gradeLabel: string
  sem1: string
  sem2: string
  reading: string
  mindmap: string
}

export const ANNUAL_ROADMAP: AnnualRoadmapRow[] = [
  { grade: 'age6',   gradeLabel: '6세',    sem1: '학습 사이클 적응, 기초 문해',       sem2: '그림책 독립 읽기, 수 감각',  reading: '그림책 50권',   mindmap: '그림 마인드맵 20개' },
  { grade: 'age7',   gradeLabel: '7세',    sem1: '파닉스 완성, 덧셈·뺄셈 기초',      sem2: '챕터북 입문, 기초 글쓰기',   reading: '동화책 30권',   mindmap: '낱말+그림 20개' },
  { grade: 'elem13', gradeLabel: '초1~3',  sem1: '한글 완성, 기초 연산',             sem2: '짧은 글 독해, 일기 쓰기',    reading: '40권',         mindmap: '기초 마인드맵 30개' },
  { grade: 'elem46', gradeLabel: '초4~6',  sem1: '글분석 기초, 분수 도입',           sem2: '논리적 글쓰기, 단원 마인드맵', reading: '30권',        mindmap: '발전 마인드맵 25개' },
  { grade: 'mid',    gradeLabel: '중1~3',  sem1: '논증 독해, 대수 기초',             sem2: '서술형 글쓰기, 수능 입문',    reading: '20권',         mindmap: '개념 마인드맵 20개' },
  { grade: 'high',   gradeLabel: '고1~3',  sem1: '수능 기초, 학점제 적응',           sem2: '수능 실전, 진로 확정',        reading: '15권 이상',     mindmap: '압축 마인드맵 15개' },
]
