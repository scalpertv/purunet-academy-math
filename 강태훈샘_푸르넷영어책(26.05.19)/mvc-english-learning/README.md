# 푸르넷 영어 MVC 학습 프로그램

이 폴더는 `강태훈_푸르넷영어_자기주도학습_학원형(26.05.19).md`와 영어 전자북 설계 문서를 바탕으로 만든 독립 실행형 HTML5·JavaScript 영어 학습 프로그램입니다.

## 실행

로컬에서는 `index.html`을 브라우저에서 바로 열 수 있습니다.

운영 서버는 Cloudflare Pages 프로젝트 `purunet-english-ebook`입니다.

- 운영 주소: `https://purunet-english-ebook.pages.dev`
- 서버 DB: Cloudflare D1 `purunet_english_learning_db`
- D1 binding: `ENGLISH_LEARNING_DB`

## 구조

```text
mvc-english-learning/
  index.html
  wrangler.toml
  package.json
  assets/
    styles.css
  js/
    data.js
    models.js
    views.js
    controllers.js
    app.js
  functions/
    api/
      progress.js
  migrations/
    0001_english_learning.sql
```

## MVC 역할

| 계층 | 파일 | 역할 |
| --- | --- | --- |
| Model | `js/models.js` | 선택 트랙, TESOL 단계, 퀴즈, 포트폴리오, localStorage, Cloudflare D1 동기화 상태 관리 |
| View | `js/views.js` | 16개 트랙 목록, Lesson 화면, 활동 화면, 교사용 대시보드, 서버 DB 저장 UI 렌더링 |
| Controller | `js/controllers.js` | 클릭, 입력, 음성 합성, 말하기 인식, 읽기 타이머, 저장, 서버 DB 동기화 이벤트 처리 |
| Data | `js/data.js` | 유치원부터 내신·리딩·도서관까지 16개 영어 트랙 샘플 콘텐츠 |
| Pages Function | `functions/api/progress.js` | 학습 증거, 포트폴리오, 성찰, 단어·문법 숙련도, 전체 스냅샷을 Cloudflare D1에 저장 |

## 포함 기능

- 16개 영어 트랙 카탈로그와 축별 필터.
- TESOL 단계형 학습 흐름.
- `diagnose → prepare → notice → practice → communicate → feedback → reflect`.
- 듣기 TTS, 퀴즈, 받아쓰기, 읽기 타이머, 말하기 인식, 쓰기 포트폴리오.
- 영단어 자기주도 루틴: 문맥 노출, 발음·의미, 인출, 문장 사용, 간격 복습.
- 영문법 자기주도 루틴: 예문 발견, form·meaning·use 분석, 오류 수정, 문장 변환, 자유 산출.
- 브라우저 `localStorage` 학습 기록 저장.
- Cloudflare Pages 운영 주소에서 D1 서버 DB 동기화.

## Cloudflare 운영 명령

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
cd "강태훈샘_푸르넷영어책(26.05.19)\mvc-english-learning"
npm run check
npm run db:migrate
npm run pages:deploy
```

운영 반영 후 확인할 주소는 `https://purunet-english-ebook.pages.dev`입니다.

## 다음 구현 후보

- 실제 교육청 필수 영단어와 교과서 메타데이터 CSV import.
- 교사·반·학생 계정 권한 분리.
- 학생별 서버 DB 기록 조회 대시보드.
- 단일 HTML 번들링과 모바일 `study.html` 반영.
