# Context Notes — 5차원 자기주도학습 사이트

## 주요 결정 사항

### 1. 기존 app과 별도 프로젝트로 분리
- 기존 `app/`는 "푸르넷수학 전자북" 제품 (wrangler.toml project-name: purunet-math-ebook)
- 새 사이트는 `fivecore-site/`에 독립 scaffold로 구축
- 이유: 배포 URL이 다르고 (`fivecore-self-directed-learning.pages.dev`), 제품 성격이 전혀 다름

### 2. localStorage MVP → D1 확장 전략
- 1차: localStorage만 사용 (백엔드 없이 빠르게 배포)
- 이유: 사용자가 단일 기기에서 주로 사용하는 학원/가정 환경
- 추후 Cloudflare D1 + Workers로 확장 시 기존 `wrangler.toml`의 DB 바인딩 패턴 참고

### 3. Tailwind CSS 도입
- 기존 app은 Tailwind 미사용 (CSS modules + 인라인 스타일)
- 새 프로젝트는 Tailwind 도입: 반응형 처리와 5차원 색상 시스템 적용이 훨씬 빠름

### 4. 마인드맵 도구 — 외부 라이브러리 미사용
- D3.js, react-flow 등 미사용 결정
- 이유: 번들 크기 절감 + 학년군별 단순한 트리 구조에 SVG 직접 구현으로 충분
- 기준: 최대 3단계 계층, 중심 1개 + 가지 7개 + 세부 3개

### 5. 레이더 차트 — SVG 직접 구현
- Chart.js, recharts 미사용
- 이유: 의존성 최소화, 5개 축 레이더 차트는 SVG 수식으로 구현 가능

### 6. 학년군 코드 정의
```
"age6"   = 6세반
"age7"   = 7세반
"elem13" = 초등 저학년 (1~3학년)
"elem46" = 초등 고학년 (4~6학년)
"mid"    = 중등 (1~3학년)
"high"   = 고등 (1~3학년)
```

### 7. 라우팅
- react-router-dom v7 사용
- SPA 방식, Cloudflare Pages의 `_redirects` 파일로 404 → index.html 처리

## 커리큘럼 문서 → 데이터 매핑 참고

- 학년군별 하루 학습 흐름: 문서 3장 (3.1~3.6)
- 학년군별 속해독서 속도 목표: 문서 2.4 표
- 학년군별 마인드맵 복잡도: 문서 2.6 표
- 글분석 틀: 문서 2.5 (기본 5단계 + 심화 4단계)
- 수능 비문학 분석 틀: 문서 4.1 고등 국어
- 영어 글분석 저학년: 문서 4.3 초등 저학년
- 영어 글분석 고학년: 문서 4.3 초등 고학년
- 5차원별 활동: 문서 5장 (5.1~5.5)
- 포트폴리오 구성: 문서 7.4
- 대시보드 설계안: 문서 7.5
- MVP 필수 기능 목록: 문서 부록 C
