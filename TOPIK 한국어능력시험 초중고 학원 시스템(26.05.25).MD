한국어능력시험(TOPIK) 기반의 초등·중등·고등 학원용 전자북 시스템은 단순 PDF 뷰어가 아니라,
“AI 자기주도 학습 + CBT 시험 + 인터랙티브 전자책 + 학습관리(LMS)” 구조로 설계하는 것이 핵심입니다.

특히 최근 TOPIK 학습은:

* CBT(Computer Based Test)
* AI 자동 문제 생성
* 음성 듣기 평가
* 인터랙티브 오답관리
* 모바일 학습
* 다국어 해설

방향으로 빠르게 이동 중입니다. ([KCI][1])

---

# 1. 추천 시스템 구조

## 전체 구조

```text
TOPIK 전자북 플랫폼
├─ 학생 앱 (모바일/태블릿)
├─ 교사용 관리자
├─ AI 문제 생성 엔진
├─ CBT 시험 시스템
├─ 전자북 뷰어
├─ 음성 듣기 시스템
├─ 학습 분석 AI
└─ 클라우드 서버
```

---

# 2. 학년별 전략

## 초등 과정

### 목표

* 한글 기초
* 한국어 읽기
* 어휘력
* 문장 이해

### 전자북 구성

```text
단어 → 문장 → 짧은 글 → 대화 → 게임형 문제
```

### 핵심 기능

* 그림 단어 카드
* AI 발음 듣기
* 따라 읽기
* 음절 색상 분리
* 받아쓰기
* 클릭형 퀴즈
* 캐릭터 보상 시스템

### 추천 UI

웹툰형 + 애니메이션형

---

## 중등 과정

### 목표

* TOPIK I 대비
* 읽기/듣기 강화
* 문법 패턴 학습

### 핵심 기능

* 문장 분석
* 문법 하이라이트
* AI 오답 설명
* 듣기 반복
* 속도 조절
* CBT 모의고사

### 추천 구조

```text
전자북
→ 단원 학습
→ 미니 테스트
→ AI 피드백
→ CBT 실전
```

---

## 고등 과정

### 목표

* TOPIK II
* 대학 입시형 독해
* 논리적 쓰기

### 핵심 기능

* 장문 독해
* 요약 훈련
* AI 첨삭
* 서술형 평가
* 시간 제한 CBT
* 실전 시험 분석

### 핵심 차별화

TOPIK + 수능국어 + 논술 결합 가능

---

# 3. 전자북 포맷 추천

## 가장 추천

```text
PDF → HTML5 → JSON/XML 구조화
```

이 방식이 가장 중요합니다.

이유:

| 포맷       | 장점       | 단점       |
| -------- | -------- | -------- |
| PDF      | 제작 쉬움    | 상호작용 약함  |
| EPUB     | 전자책 표준   | 수학/문법 약함 |
| HTML5    | 인터랙션 최고  | 개발 필요    |
| XML/JSON | AI 활용 최고 | 초기 구축 필요 |

---

# 4. 가장 중요한 핵심 기술

## ① OCR + 구조화

교재를:

```text
PDF
→ OCR
→ XML
→ AI 데이터베이스
```

로 변환.

---

## ② AI 문제 자동 생성

최근 연구에서는 GPT 기반 TOPIK 문제 자동 생성이 실제 가능성이 입증되었습니다. ([KCI][1])

예시:

```text
지문 입력
→ GPT 분석
→ 객관식 생성
→ 듣기 문제 생성
→ 빈칸 문제 생성
→ 난이도 조절
```

---

## ③ CBT 시험 엔진

TOPIK은 CBT 방식이 매우 중요합니다.

참고 사례:

* [전자문제집 CBT](https://www.comcbt.com/?utm_source=chatgpt.com)
* [맞추다 CBT 시스템](https://www.machuda.kr/?utm_source=chatgpt.com)

핵심 기능:

* 자동 채점
* 시간 제한
* OMR UI
* 오답노트
* 약점 분석
* 랭킹
* AI 추천 문제

---

# 5. 추천 기술 스택

## 프론트엔드

| 영역    | 추천                   |
| ----- | -------------------- |
| 웹앱    | React                |
| 모바일   | React Native         |
| 전자북   | HTML5 Canvas         |
| 애니메이션 | GSAP / Framer Motion |

---

## 백엔드

| 영역    | 추천             |
| ----- | -------------- |
| 서버    | Node.js        |
| AI 서버 | Python FastAPI |
| DB    | PostgreSQL     |
| 캐시    | Redis          |

---

## AI

| 기능    | 모델               |
| ----- | ---------------- |
| 문제 생성 | GPT-4.1 / Claude |
| 음성    | XTTS-v2          |
| OCR   | PaddleOCR        |
| 번역    | NLLB             |
| 문장분석  | spaCy + KoNLPy   |

---

# 6. 추천 학습 흐름

## 초등

```text
그림 단어
→ 따라읽기
→ 미니게임
→ 짧은 대화
→ AI 칭찬
```

---

## 중등

```text
전자북 학습
→ 문법 분석
→ 듣기
→ CBT
→ 오답노트
→ AI 복습 추천
```

---

## 고등

```text
실전 독해
→ 시간 제한
→ AI 첨삭
→ 약점 분석
→ TOPIK 실전 모드
```

---

# 7. 가장 강력한 차별화 전략

## ① 한국어 NLP 문장 분석

사용자가 올린 영어 5형식 NLP 분석처럼,
한국어도:

```text
주어
서술어
목적어
관형어
부사어
조사
어미
```

자동 분석 가능.

---

## ② AI 맞춤형 학습

학생마다:

* 약한 문법
* 약한 어휘
* 듣기 약점
* 읽기 속도

자동 분석.

---

## ③ 웹툰형 한국어 학습

이 부분이 시장성이 큽니다.

예시:

```text
상황 대화
→ 웹툰
→ 클릭 단어
→ AI 음성
→ 역할극
```

---

# 8. 추천 수익 모델

| 모델     | 설명       |
| ------ | -------- |
| 학원 월구독 | 학생당 월 과금 |
| B2B 공급 | 학원용 라이선스 |
| CBT 시험 | 유료 모의고사  |
| AI 첨삭  | 프리미엄     |
| 다국어 과정 | 해외 시장    |

---

# 9. 추천 개발 순서

## 1단계 (1~2개월)

MVP 구축

* 전자북 뷰어
* 단어 학습
* 기본 CBT

---

## 2단계 (3~4개월)

AI 기능 추가

* 자동 문제 생성
* 오답 분석
* 음성 듣기

---

## 3단계 (5~6개월)

상용화

* 학원 관리자
* 결제
* 학생 관리
* 통계

---

# 10. 가장 추천하는 최종 구조

당신 경우에는:

```text
TOPIK
+
초중등 국어
+
영어
+
수학
```

통합 자기주도학습 플랫폼으로 가는 것이 가장 유리합니다.

이미 구상 중인:

* 전자북
* AI 학습
* CBT
* OCR 자동화
* 웹툰형 학습
* 자기주도학습

방향과 매우 잘 맞습니다.

---

# 추천 최종 아키텍처

```text
OCR 문서 수집
→ XML 구조화
→ AI 문제 생성
→ HTML5 전자북
→ CBT 시험
→ AI 분석
→ LMS 관리
→ 모바일 앱
```

---

추천하는 실제 구현 방향은:

* React 기반 HTML5 전자북
* Supabase/Firebase 백엔드
* GPT 기반 문제 생성
* XTTS 음성
* Stable Diffusion 웹툰 이미지
* Cloudflare Pages 배포

조합입니다.

원하면 다음 단계로 이어서:

1. TOPIK 전자북 실제 화면 시안
2. DB 설계도
3. XML 구조 예시
4. React 기반 프로토타입
5. CBT 시험 UI
6. AI 문제 생성 프롬프트
7. 학원 관리자 시스템
8. 초중고 TOPIK 커리큘럼
9. 서버 비용 계산
10. 100일 개발 로드맵

까지 설계해줄 수 있습니다.

[1]: https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003124491&utm_source=chatgpt.com "생성형 AI 기술을 활용한 한국어능력시험(TOPIK) 읽기 문제 ..."


# TOPIK 초·중·고 학원 전자북 AI 시스템 종합 설계서

# 1. TOPIK 전자북 실제 화면 시안

## 전체 UI 구조

```text id="1jbykt"
┌──────────────────────┐
│ 상단 학습바            │
├──────────────────────┤
│ 좌측 목차 │ 우측 학습영역 │
│           │              │
│ 단원      │ 웹툰형 대화   │
│ 단어      │ 음성 듣기     │
│ 문법      │ 클릭 문제     │
│ 시험      │ AI 피드백     │
├──────────────────────┤
│ 하단 AI 학습 분석 패널    │
└──────────────────────┘
```

---

## 초등 UI

### 특징

* 캐릭터 중심
* 색상 강조
* 터치형 학습
* 음성 버튼 큼

### 구성

```text id="5qkty4"
그림
↓
단어
↓
클릭 발음
↓
미니게임
↓
보상 스티커
```

---

## 중등 UI

### 특징

* 문법 강조
* 듣기 반복
* CBT 연습

### 구성

```text id="sqgjnq"
본문
→ 문법 하이라이트
→ 단어 설명
→ 문제풀이
→ AI 오답 분석
```

---

## 고등 UI

### 특징

* 실전 시험형
* 시간 제한
* AI 첨삭

### 구성

```text id="9g9o0q"
독해 지문
→ 논리 분석
→ 서술형 작성
→ AI 첨삭
→ 실전 CBT
```

---

# 2. 데이터베이스(DB) 설계

## 핵심 DB 구조

```text id="7k4d0m"
Users
Courses
Lessons
Vocabulary
Grammar
Questions
CBT_Results
AI_Analysis
Payments
```

---

## 학생 테이블

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  grade TEXT,
  level TEXT,
  email TEXT
);
```

---

## 문제 테이블

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  lesson_id UUID,
  type TEXT,
  question TEXT,
  answer TEXT,
  difficulty INT
);
```

---

## AI 분석 테이블

```sql
CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY,
  user_id UUID,
  weak_point TEXT,
  recommendation TEXT
);
```

---

# 3. XML 전자북 구조 예시

## 추천 구조

```xml
<lesson>
  <title>TOPIK Beginner 1</title>

  <vocabulary>
    <word>
      <korean>학교</korean>
      <english>school</english>
      <audio>school.mp3</audio>
      <image>school.png</image>
    </word>
  </vocabulary>

  <grammar>
    <pattern>~습니다</pattern>
    <example>저는 학생입니다.</example>
  </grammar>

  <quiz>
    <question>학교에 갑니다.</question>
    <answer>I go to school.</answer>
  </quiz>
</lesson>
```

---

# 4. React 기반 프로토타입 구조

## 추천 구조

```text id="v8g2i9"
src/
 ├─ components/
 ├─ pages/
 ├─ ai/
 ├─ cbt/
 ├─ ebook/
 ├─ audio/
 └─ analytics/
```

---

## 주요 컴포넌트

| 컴포넌트        | 기능    |
| ----------- | ----- |
| EbookViewer | 전자북   |
| AudioPlayer | 듣기    |
| QuizEngine  | 문제    |
| AIChat      | AI 튜터 |
| CBTSystem   | 시험    |
| Analytics   | 학습분석  |

---

## 추천 프레임워크

| 영역  | 추천           |
| --- | ------------ |
| 웹   | React        |
| 모바일 | React Native |
| 서버  | FastAPI      |
| DB  | PostgreSQL   |
| AI  | Python       |

---

# 5. CBT 시험 UI 설계

## 시험 화면

```text id="wqwxg6"
┌─────────────────┐
│ 남은 시간 32:15 │
├─────────────────┤
│ 문제 영역        │
│                 │
│ ①               │
│ ②               │
│ ③               │
│ ④               │
├─────────────────┤
│ 이전 │ 다음 │ 제출 │
└─────────────────┘
```

---

## 핵심 기능

| 기능    | 설명      |
| ----- | ------- |
| 자동 채점 | 즉시 결과   |
| 시간 제한 | 실전 대비   |
| 랜덤 출제 | 부정행위 방지 |
| 오답노트  | 약점 분석   |
| AI 추천 | 맞춤 문제   |

---

# 6. AI 문제 생성 프롬프트

## 단어 문제 생성

```text id="y8t3na"
다음 단어로 TOPIK 초급 객관식 문제 5개 생성:
단어: 학교
난이도: 초등
형식: 객관식 4지선다
```

---

## 문법 문제 생성

```text id="qqj9lf"
다음 문법 패턴으로 중등 수준 TOPIK 문제 생성:
문법: ~고 싶다
문제 수: 10개
```

---

## 독해 생성

```text id="4cqrrn"
TOPIK II 수준 장문 독해 생성:
주제: 환경 보호
길이: 1000자
문제 포함
```

---

# 7. 학원 관리자 시스템

## 관리자 기능

| 기능     | 설명     |
| ------ | ------ |
| 학생 관리  | 출석/진도  |
| 성적 분석  | 점수 통계  |
| 과제 관리  | 숙제 자동화 |
| 결제 관리  | 월구독    |
| AI 리포트 | 학습 분석  |

---

## 관리자 대시보드

```text id="c4z5vv"
학생 수
오늘 접속
약점 통계
TOPIK 합격률
과제 제출률
```

---

# 8. 초중고 TOPIK 커리큘럼

# 초등

| 단계 | 내용    |
| -- | ----- |
| 입문 | 한글    |
| 기초 | 단어    |
| 초급 | 짧은 문장 |
| 응용 | 대화    |

---

# 중등

| 단계      | 내용 |
| ------- | -- |
| TOPIK I | 읽기 |
| 듣기      | 회화 |
| 문법      | 패턴 |
| CBT     | 실전 |

---

# 고등

| 단계       | 내용     |
| -------- | ------ |
| TOPIK II | 독해     |
| 논술       | 쓰기     |
| 실전       | 모의고사   |
| 첨삭       | AI 피드백 |

---

# 9. 예상 서버 및 운영 비용

# 초기 MVP

| 항목               | 비용        |
| ---------------- | --------- |
| Cloudflare Pages | 무료~       |
| Supabase         | 무료~       |
| GPT API          | 월 10~50만원 |
| OCR 서버           | 월 5만원     |
| 음성 서버            | 월 5만원     |

---

# 중형 학원 규모

| 항목     | 비용         |
| ------ | ---------- |
| 서버     | 월 30~100만원 |
| AI API | 월 50~300만원 |
| 스토리지   | 월 10만원     |
| CDN    | 월 5만원      |

---

# 대형 플랫폼

| 항목       | 비용           |
| -------- | ------------ |
| GPU 서버   | 월 300~1000만원 |
| AI 모델    | 자체 운영        |
| 음성 서버    | 자체 구축        |
| OCR 클러스터 | 구축 필요        |

---

# 10. 100일 개발 로드맵

# 1~20일

## 기획

* UI 설계
* DB 설계
* XML 설계
* 커리큘럼

---

# 21~40일

## 전자북 개발

* HTML5 뷰어
* 오디오
* 단어 시스템
* 문제 엔진

---

# 41~60일

## CBT 구축

* 시험 시스템
* 자동 채점
* 오답노트
* 통계

---

# 61~80일

## AI 기능

* GPT 문제 생성
* AI 피드백
* 약점 분석
* 음성 AI

---

# 81~100일

## 상용화

* 결제
* 관리자
* 모바일 최적화
* 배포
* 학원 테스트

---

# 추천 최종 기술 스택

| 영역       | 기술               |
| -------- | ---------------- |
| Frontend | React            |
| Mobile   | React Native     |
| Backend  | FastAPI          |
| Database | PostgreSQL       |
| OCR      | PaddleOCR        |
| AI       | GPT / Claude     |
| TTS      | XTTS-v2          |
| 이미지      | Stable Diffusion |
| 배포       | Cloudflare       |

---

# 최종 추천 전략

당신 경우에는 단순 TOPIK 플랫폼보다:

```text id="6yz52z"
TOPIK
+
초중고 국어
+
영어
+
수학
+
AI 자기주도학습
```

통합 플랫폼으로 가는 것이 훨씬 경쟁력이 높습니다.

특히 강력한 방향은:

* 웹툰형 학습
* AI 오답 분석
* CBT 실전 시스템
* OCR 자동 교재 변환
* XML 기반 자동 콘텐츠 생성
* GPT 기반 문제 생성

조합입니다.

이 구조는 향후:

* 학원 프랜차이즈
* B2B 공급
* 해외 한국어 교육
* 교육청 연계
* AI 에듀테크 사업

까지 확장 가능합니다.
