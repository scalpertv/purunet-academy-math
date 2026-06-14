# 담쟁이 자기주도 학습코칭 UI 개편 기록

- 운영 페이지는 기능별 패널 전환이 이미 구현되어 있으므로 데이터 로직은 유지하고 정보 구조와 반응형 스타일을 집중 개선한다.
- 메인 내비게이션은 7개 메뉴를 넓은 화면에서는 한 줄 그리드로, 좁은 화면에서는 햄버거 메뉴형 세로 목록으로 제공한다.
- 선택된 메뉴만 표시하는 기존 패널 방식을 유지하되, 현재 메뉴 제목과 설명을 별도 컨텍스트 바에 표시해 탐색성을 높인다.
- 지도자 과정의 3개 메뉴는 고정 너비 버튼 대신 `repeat(3, minmax(0, 1fr))` 그리드를 사용하고 모바일에서는 한 열로 전환한다.
- 메인 화면은 반투명 컨텍스트 카드, 카드형 섹션 머리말, 부드러운 패널 전환을 적용했으며 기존 입력 폼과 저장 함수는 수정하지 않았다.
- 교사 세션을 주입한 Playwright 검증에서 메인 7개 메뉴와 지도자 과정 3개 메뉴를 모두 전환했다. 1440·1024·768·390·320px 메인 화면과 1100·600·390·320px 지도자 화면의 가로 넘침은 모두 0이었다.
- 기능 커밋은 `1241f20`이며 Cloudflare Pages 프리뷰 `https://c9ac76a8.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev`에 배포했다.
- 운영 Playwright에서 1440·390·320px의 메인 7개 메뉴와 지도자 과정 3개 메뉴를 다시 검증했다. 가로 넘침과 페이지 오류는 모두 0이었다.

## 지도자 과정 상호작용형 교육 채널 설계

- 기존 15강 본문과 워크북은 보존하고 JavaScript로 학습 도구를 덧붙여 콘텐츠 중복과 대규모 마크업 수정을 피한다.
- 지도자 과정 상태는 `ivyInstructorState` 키에 완료 강의, 강의별 메모, 워크북 체크, 퀴즈 기록, 실천 기록을 구조화해 저장한다.
- iframe은 같은 출처이므로 로컬 저장 후 부모 페이지에 `ivy-instructor-state` 메시지를 보내 기존 `save()`와 `/api/save` 비동기 클라우드 저장을 재사용한다.
- 최신 교육 플랫폼의 모바일 우선, 짧은 학습 단위, 학습자 선택, 즉시 피드백, 명확한 진도 표시 원칙을 적용한다.
- Playwright로 데스크톱 전체 흐름을 검증했다. 15개 강의, 검색 5건, 완료 필터, 메모 자동 저장, 즉시 채점, 실천 기록, 새로고침 복원, iframe 가로 넘침 0을 확인했다.
- 390px와 320px 모바일 화면에서 대시보드와 검색 도구가 한 열로 전환되고 가로 넘침이 0인 것을 확인했다.
- `index.html`과 `instructor.html`의 인라인 JavaScript 파싱과 `git diff --check`는 통과했다.
- 프로젝트에 `package.json`이 없어 `npm run lint`, `npm run verify`, `npm run onefile`은 모두 `ENOENT`로 실행할 수 없다.
- 기능 커밋은 `380d973`이며 프리뷰 `https://219e61a0.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev`에 `v20260613c`를 배포했다.
- 운영 Playwright에서 검색 5건, 진도·메모 새로고침 복원, 퀴즈와 실천 기록, 데스크톱·390px·320px 가로 넘침 0, 페이지 오류 0을 확인했다.
- 기존 Pages Functions 번들은 배포되지만 `/api/load`와 `/api/save`가 SPA의 `index.html`로 응답하는 프로젝트 라우팅 문제가 있어 D1 왕복 검증은 완료하지 못했다. 브라우저 로컬 저장과 부모 페이지 연동은 정상 동작한다.

## 지도자 과정 듀얼 네비게이터 설계

- 속해독서 듀얼모드의 선택 메뉴와 본문 분리 방식을 지도자 과정에 적용한다.
- 15강 본문과 워크북 마크업은 이동하거나 복제하지 않고 JavaScript로 메뉴를 생성해 기존 저장 이벤트를 유지한다.
- 데스크톱은 왼쪽 고정 메뉴와 오른쪽 선택 본문, 모바일은 상단 가로 스크롤 메뉴와 한 열 본문을 사용한다.
- 강의 네비게이터는 검색과 완료 필터 결과를 즉시 반영하고 조건에 맞는 첫 강의를 자동 선택한다.
- 워크북 네비게이터는 6개 영역별 완료 항목 수를 메뉴에 표시하며 체크 상태는 기존 `ivyInstructorState`에 저장한다.
- Playwright에서 15강·워크북 6개 전환, 이전·다음 이동, 검색 3건, 완료 필터, 메모와 체크 새로고침 복원을 확인했다.
- 1440·768·390·320px 직접 화면과 1440·390·320px 메인 iframe에서 가로 넘침과 페이지 오류가 모두 0이었다.
- 프로젝트에 `package.json`이 없어 `npm run lint`, `npm run verify`, `npm run onefile`은 `ENOENT`로 실행되지 않았다.
- 기능 커밋 `aa6ebf3`을 프리뷰 `https://db208cbe.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#instructor`에 `v20260613d`로 배포했다.
- 운영 주소에서 15강과 워크북 6개 전환을 재검증했고 1440·390·320px 직접 화면과 1440·390px 메인 iframe의 가로 넘침과 페이지 오류는 모두 0이었다.

## 스터디 플래너 PDF 분석

- `스터디 플래너.pdf`는 155쪽이며 이미지 OCR이 필요한 스캔본이 아니라 한글 텍스트가 포함된 PDF라 원문을 직접 추출했다.
- 앞부분은 꿈·진로 선언, 학교 시간표와 시험 일정, 플래너 작성법, 월간 목표, 고정 시간표와 가용시간으로 구성된다.
- 본문은 16주 과정이며 매주 주간 계획 1쪽, 일일 계획 7쪽, 주간 피드백 1쪽이 반복된다.
- 주간 계획의 핵심 항목은 가용·목표·실제 자기공부시간, 과목별 분량과 요일 실행, 성취 여부, 월~금 수업집중도다.
- 일일 계획의 핵심 항목은 시간대별 예정·실행, 우선순위 학습, 숙제·수행평가, 계획·실행 공부시간, 하루 평가, Good/Bad Point다.
- 주간 피드백은 목표 대비 실제 공부시간 달성률, Good/Bad Point, 대안, 자투리·여유시간 활용, 부모·교사 의견으로 구성된다.
- 기존 `planner_날짜` 데이터는 `name`, `time`, `done` 값을 유지하면서 과목, 우선순위, 실제 시간, 평가 필드를 자동 보완한다.
- 새 데이터는 `planner_week_주월요일`, `planner_profile`, `planner_month_연월` 키로 저장하며 모두 기존 `save()`를 거쳐 로컬·클라우드 저장 호출 흐름을 사용한다.
- Playwright로 기존 데이터 호환, 일일·주간·목표·피드백 입력, 50% 달성률 계산과 새로고침 복원을 확인했다.
- 1440·768·390·320px에서 가로 넘침과 페이지 오류는 모두 0이었고 숨은 전역 알림의 투명도도 0으로 확인했다.
- `index.html` 인라인 JavaScript 파싱과 `git diff --check`는 통과했다. `package.json`이 없어 npm 3개 검증 명령은 `ENOENT`로 실행되지 않았다.
- 기능 커밋 `b0d86e1`을 프리뷰 `https://ad62259e.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#planner`에 `v20260613e`로 배포했다.
- 운영 Playwright에서 4개 플래너 메뉴, 입력 저장과 새로고침 복원을 확인했으며 1440·390·320px의 가로 넘침과 페이지 오류는 모두 0이었다.

## 글분석 초급 A PDF 교재 반영

- 요청 대상은 `담쟁이 학습코칭 교재/자기주도 글분석력/글분석초급A.pdf`와 운영 `#analysis` 화면이다.
- PDF는 106쪽이며 4쪽부터 104쪽까지 짝수 페이지에 본문 51개, 각 다음 홀수 페이지에 마인드맵·서술형 글쓰기 활동지가 배치되어 있다.
- PDF에 한글 텍스트층이 있어 별도 이미지 OCR 엔진 없이 PyMuPDF로 본문을 추출할 수 있다. 첫쪽·중간쪽·마지막쪽 렌더링을 원본과 대조해 텍스트층의 본문 일치를 확인했다.
- 원문 활동 순서는 의미 단위 사선 읽기, 주제문장 두 줄 밑줄, 중요문장 밑줄, 핵심단어 동그라미, 모르는 낱말 네모 표시, 제목·소주제·핵심어·내용 구조화, 마인드맵, 서술형 글쓰기이다.
- 기존 자유 글분석 기능은 유지하고, 교재 지문 선택 시 원문만 자동 입력한다. 제목과 분석 답은 학생이 직접 작성하도록 정답형 제목을 노출하지 않는다.
- 저장 데이터는 기존 `analyses` 배열과 호환되게 유지하면서 `sourceId`, `sourceNumber`, `subtopic`, `structure`, `writing` 필드를 선택적으로 추가한다.
- `analysis-beginner-a.js`에 51개 지문, 고유 ID, PDF 쪽 번호, 공백 제외 글자 수를 저장했다. 활동지 표 제목과 빈 입력 칸은 제거하고 본문만 남겼다.
- `#analysis` 화면에 51개 번호 메뉴, 이전·다음 이동, 선택 지문 읽기, 교재 완료율을 추가했다. 분석 시작 시 원문만 입력하고 제목·소주제·핵심어·요약·구조도·서술형 글쓰기는 비워 둔다.
- 로컬 Playwright 검증에서 51개 버튼, 마지막 지문 선택, 교재 원문 복사, 추가 필드 저장, `sourceId` 저장, 새로고침 후 완료 표시 복원을 확인했다.
- 1440×1000과 390×844 화면의 가로 넘침은 모두 0이고 페이지·콘솔 오류도 0이었다.
- `analysis-beginner-a.js`와 `index.html` 인라인 JavaScript의 `node --check`, 대상 파일 `git diff --check`, 51개 ID·본문 자동 검사가 통과했다.
- 기능 커밋은 `3cb2306 feat: 글분석 초급 A 교재 추가`이다.
- Cloudflare Pages 프리뷰 `https://780ea3a2.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 배포했다.
- 운영 재검증에서 프리뷰·운영 모두 HTTP 200, 교재 버튼 51개, 데이터 51개, `analysis-beginner-a.js` HTTP 200과 34,995바이트, 모바일 가로 넘침 0, 페이지·콘솔·네트워크 오류 0을 확인했다.

## 글분석 상호작용형 5차원 학습 화면 설계

- 5차원 자기주도학습의 초4~6 국어 분석 틀에서 글의 목적, 문단별 핵심어, 문단 요약, 글의 구조, 전체 주제문, 사실과 의견, 주장과 근거, 비판적 읽기, 나의 반응을 가져온다.
- 초급 A 교재에는 모든 항목을 한 번에 노출하지 않고 `표시하며 읽기 → 국어 구조 분석 → 마인드맵 → 내 문장 완성`의 4단계로 나눈다.
- 표시 읽기는 낱말 단위 사선·핵심어·모르는 말과 문장 단위 주제문장·중요문장 표시를 지원한다. 원문 자체는 수정하지 않고 표시 상태를 별도 데이터로 저장한다.
- 마인드맵은 5차원 페이지의 600×510 SVG 방사형 구조를 단일 HTML 환경에 맞게 재구현한다. 중심 주제와 최대 6개 색상 가지, 가지별 세부 항목을 편집할 수 있게 한다.
- 기존 `analyses` 데이터는 유지하고 `purpose`, `textStructure`, `factOpinion`, `claimEvidence`, `critical`, `annotations`, `mindmap`, `selfChecks`를 선택 필드로 추가한다.
- 단계 진행률은 필수 입력과 표시 활동의 실제 완료 여부로 계산하며, 저장 여부와 별개로 학생이 다음 행동을 알 수 있는 코치 메시지를 실시간 제공한다.
- 로컬 Playwright에서 표시 3개, 자동 생성 마인드맵 가지 5개, 학습 완성도 83점과 서술형 미리보기를 확인했다.
- 390×844 모바일 화면에서 문서 너비가 390px로 유지되어 가로 넘침이 없었고 페이지 오류도 발생하지 않았다.
- `index.html` 인라인 JavaScript 문법 검사, `analysis-beginner-a.js`의 `node --check`, 대상 파일 `git diff --check`가 통과했다.
- 기능 커밋은 `3449305 feat: 글분석 상호작용 학습 화면 고도화`이다.
- Cloudflare Pages 미리보기 `https://94f931c8.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 배포했다.
- 미리보기와 운영 Playwright 재검증에서 HTTP 200, 4단계, 교재 지문 51개, 자동 마인드맵 가지 5개, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.

## 글분석 초급 B PDF 교재 반영

- 대상 PDF는 108쪽이며 4쪽부터 106쪽까지 짝수 쪽에 본문 52개, 다음 홀수 쪽에 마인드맵·서술형 활동지가 배치되어 있다.
- PDF에 한글 텍스트 레이어가 있어 별도 이미지 OCR 대신 PyMuPDF로 본문을 추출한다.
- 첫 본문인 4쪽 머리말만 원본에서 `글분석 초급-A`로 잘못 표기되어 있지만 표지와 나머지 페이지가 모두 초급 B이므로 초급 B 1번으로 처리한다.
- PDF 줄 끝 공백이 있으면 낱말 사이를 띄우고, 공백이 없으면 줄바꿈으로 갈라진 낱말을 붙이는 방식으로 본문을 정제한다.
- 초급 A와 B는 지문 번호가 겹치므로 저장 데이터에 `sourceLevel`을 추가하고 고유 ID는 `beginner-b-01` 형식을 사용한다.
- `analysis-beginner-b.js`에 52개 지문, 초급 단계, PDF 쪽 번호, 공백 제외 글자 수를 저장했다. 머리말과 구조도 표는 본문에서 제외했다.
- 글분석 화면에 초급 A·B 탭을 추가하고 선택 교재의 지문 수, 번호 메뉴, 완료 진도와 안내 문구를 동적으로 표시한다.
- 로컬 Playwright에서 A 51개, B 52개, B 52번 본문, 분석 시작, `sourceLevel: B` 저장, A 0/51·B 1/52 진도 분리를 확인했다.
- 390×844 모바일 화면에서 문서 너비가 390px로 유지되었고 페이지 오류는 0건이었다.
- `analysis-beginner-b.js`와 인라인 JavaScript 문법 검사, 52개 ID·번호·본문·글자 수 무결성 검사, 대상 파일 `git diff --check`가 통과했다.
- 기능 커밋은 `f7b3c2b feat: 글분석 초급 B 교재 추가`이다.
- Cloudflare Pages 미리보기 `https://5ccd3bbd.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 배포했다.
- 미리보기와 운영 재검증에서 HTTP 200, A 51개, B 52개, B 52번 본문·분석 시작, B 데이터 파일 HTTP 200, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.

## 글분석 초급 C PDF 교재 반영

- 대상 PDF는 106쪽이며 4쪽부터 104쪽까지 짝수 쪽에 본문 51개, 다음 홀수 쪽에 마인드맵·서술형 활동지가 배치되어 있다.
- PDF에 한글 텍스트 레이어가 있어 PyMuPDF로 본문을 추출하고, 머리말과 구조도 표는 제외한다.
- 초급 B와 같은 줄 끝 공백 기반 정제 규칙을 적용하고 고유 ID는 `beginner-c-01` 형식을 사용한다.
- 기존 저장 구조의 `sourceLevel`에 `C`를 저장해 A·B와 번호가 겹쳐도 진도와 기록을 분리한다.
- `analysis-beginner-c.js`에 51개 지문, 초급 단계, PDF 쪽 번호, 공백 제외 글자 수를 저장했다.
- 원본 화면과 대조해 깨진 온도 기호 두 곳을 `℃`로, 중점 기호를 `·`로, 중복 마침표를 하나로 보정했다.
- 글분석 화면에 초급 C 탭을 추가하고 기존 단계 판별을 `beginner-{단계}-번호` 형식 전체에 대응하도록 일반화했다.
- 로컬 Playwright에서 A 51개, B 52개, C 51개, C 51번 본문·분석 시작, `sourceLevel: C` 저장과 교재별 진도 분리를 확인했다.
- 390×844 모바일 화면에서 문서 너비가 390px로 유지되었고 페이지 오류는 0건이었다.
- A·B·C 총 154개 지문의 ID·번호·본문·글자 수 무결성 검사, 데이터와 인라인 JavaScript 문법 검사, 대상 파일 `git diff --check`가 통과했다.
- 기능 커밋은 `de7a8ff feat: 글분석 초급 C 교재 추가`이다.
- Cloudflare Pages 미리보기 `https://544d7b92.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 배포했다.
- 미리보기와 운영 재검증에서 HTTP 200, A 51개, B 52개, C 51개, C 온도 기호·51번 본문·분석 시작, C 데이터 파일 HTTP 200, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.

## 글분석 초급 D PDF 교재 반영

- 대상 PDF는 106쪽이며 4쪽부터 104쪽까지 짝수 쪽에 본문 51개, 다음 홀수 쪽에 마인드맵·서술형 활동지가 배치되어 있다.
- 파일명과 표지는 초급 D이지만 본문 머리말이 앞부분은 `글분석 중-A`, 뒷부분은 `글분석 초-C`로 오표기되어 있어 본문 중복 여부를 별도로 확인한다.
- PDF에 한글 텍스트 레이어가 있으므로 PyMuPDF로 본문을 추출하고 머리말과 구조도 표를 제외한다.
- 표지 화면에는 `자기주도학습능력-초C`로 적혀 있으나 사용자가 제공한 파일명과 교재 순서를 기준으로 초급 D로 등록한다.
- D 1~4번은 기존 C 48~51번과 이어지는 반복 지문이며, D 4번은 A 40번과도 같다. D 37·38번은 PDF 내부에서 같은 맨틀 지문이 연속 수록되어 있다.
- 중복은 원본 교재 구성으로 판단해 제거하지 않고 `beginner-d-01`부터 `beginner-d-51`까지 별도 진도로 유지한다.
- `analysis-beginner-d.js`에 51개 지문, 초급 단계, PDF 쪽 번호와 공백 제외 글자 수를 저장하고 A·B·C·D 탭에 연결했다.
- 로컬 Playwright에서 A 51개, B 52개, C 51개, D 51개, D 51번 본문·분석 시작, `sourceLevel: D` 저장과 교재별 진도 분리를 확인했다.
- 390×844 모바일 화면에서 문서 너비가 390px로 유지되었고 페이지 오류는 0건이었다.
- A·B·C·D 총 205개 지문의 ID·번호·본문·글자 수 무결성 검사, D 37·38번 원본 중복 검사, 데이터와 인라인 JavaScript 문법 검사, 대상 파일 `git diff --check`가 통과했다.
- 기능 커밋은 `44a4434 feat: 글분석 초급 D 교재 추가`이다.
- Cloudflare Pages 미리보기 `https://af598771.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 배포했다.
- 미리보기와 운영 재검증에서 HTTP 200, A 51개, B 52개, C 51개, D 51개, D 51번 본문·분석 시작, D 데이터 파일 HTTP 200, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.

## 글분석 중급 A PDF 교재 반영

- 요청 대상은 `담쟁이 학습코칭 교재/자기주도 글분석력/글분석중급A.pdf`와 운영 `#analysis` 화면이다.
- 대상 PDF는 106쪽이며 4쪽부터 104쪽까지 짝수 쪽에 본문 51개, 다음 홀수 쪽에 마인드맵·서술형 활동지가 배치되어 있다.
- PDF에 한글 텍스트 레이어가 있어 PyMuPDF로 본문을 직접 추출하고 머리말과 구조도 표는 제외한다.
- 기존 초급 교재는 `A`부터 `D`까지의 키를 사용하므로 중급 A는 `intermediate-a` 키와 `intermediate-a-01` 형식의 고유 ID를 사용해 초급 A의 진도·저장 기록과 분리한다.
- 화면에 표시할 교재명은 데이터별 `label`로 관리해 기존 `초급 A` 고정 문구를 `초급 A` 또는 `중급 A`로 정확히 표시한다.
- 중급 A의 일부 지문은 초급 B·D에 수록된 지문과 정확히 일치한다. 원본 PDF의 재수록 구성으로 판단해 제거하지 않고 중급 A의 별도 학습 순서와 진도로 유지한다.
- `analysis-intermediate-a.js`에 51개 지문, `intermediate-a` 단계, PDF 쪽 번호와 공백 제외 글자 수를 저장했다. 머리말과 구조도 표는 본문에서 제외했다.
- 로컬 Playwright에서 교재 탭 5개, 중급 A 지문 51개, 51번 본문·분석 시작, `sourceLevel: intermediate-a` 저장, 초급 A 0/51·중급 A 1/51 진도 분리를 확인했다.
- 390×844 모바일 화면에서 문서 너비가 390px로 유지되어 가로 넘침이 없었고 페이지 오류는 0건이었다.
- PDF 51개 본문 재추출 대조, 데이터 ID·번호·쪽·글자 수 무결성 검사, 데이터 파일과 인라인 JavaScript 문법 검사, 대상 파일 `git diff --check`가 통과했다.
- 프로젝트 루트에 `package.json`이 없어 `npm run lint`, `npm run verify`, `npm run onefile`은 모두 `ENOENT`로 실행할 수 없었다.
- 기능 커밋은 `cc73f59 feat: 글분석 중급 A 교재 추가`이다.
- Cloudflare Pages 미리보기 `https://442636b8.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 `v20260614a`를 배포했다.
- 미리보기와 운영 재검증에서 HTTP 200, 중급 A 데이터 파일 52,256바이트, 지문 51개, 51번 본문·분석 시작·저장, 초급 A와 중급 A의 진도 분리, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.

## 글분석 중급 B PDF 교재 반영

- 요청 대상은 `담쟁이 학습코칭 교재/자기주도 글분석력/글분석중급B.pdf`와 운영 `#analysis` 화면이다.
- 대상 PDF는 104쪽이며 4쪽부터 102쪽까지 짝수 쪽에 본문 50개, 다음 홀수 쪽에 마인드맵·서술형 활동지가 배치되어 있다. 104쪽은 뒤표지이다.
- PDF에 한글 텍스트 레이어가 있어 PyMuPDF로 본문을 직접 추출한다.
- 일부 본문 쪽에는 `학습능력 (글분석 중급-B), 담쟁이학습코칭` 머리말이 두 번 추출되므로 모든 반복 머리말과 구조도 표를 제거한다.
- PDF 줄바꿈에서 마침표 뒤 다음 문장이 붙는 경우에는 문장 경계에만 공백을 보완하고, 낱말 중간 줄바꿈은 기존 줄 끝 공백 규칙으로 연결한다.
- 중급 B는 `intermediate-b` 키와 `intermediate-b-01` 형식의 고유 ID를 사용해 기존 교재의 진도·저장 기록과 분리한다.
- 중급 B 25번과 50번은 PDF 내부에서 같은 우리나라 지역 구분 지문이 반복 수록되어 있다. 원본 교재 구성이므로 두 번호를 모두 별도 진도로 유지한다.
- `analysis-intermediate-b.js`에 50개 지문, `intermediate-b` 단계, PDF 쪽 번호와 공백 제외 글자 수를 저장했다.
- 로컬 Playwright에서 교재 탭 6개, 중급 B 지문 50개, 50번 본문·분석 시작, `sourceLevel: intermediate-b` 저장, 초급 A·중급 A·중급 B 진도 분리를 확인했다.
- 390×844 모바일 화면에서 가로 넘침이 없었고 페이지 오류는 0건이었다.
- PDF 50개 본문 재추출 대조, 데이터 ID·번호·쪽·글자 수 무결성 검사, 데이터 파일과 인라인 JavaScript 문법 검사, 대상 파일 `git diff --check`가 통과했다.
- 프로젝트 루트에 `package.json`이 없어 `npm run lint`, `npm run verify`, `npm run onefile`은 모두 `ENOENT`로 실행할 수 없었다.
- 기능 커밋은 `58c4512 feat: 글분석 중급 C 교재 추가`이다.
- Cloudflare Pages 미리보기 `https://8802b405.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 `v20260614c`를 배포했다.
- 미리보기와 운영 재검증에서 HTTP 200, 중급 C 데이터 파일 58,475바이트, 지문 50개, 50번 본문·분석 시작·저장, 기존 교재와 중급 C의 진도 분리, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.
- 기능 커밋은 `ed07884 feat: 글분석 중급 B 교재 추가`이다.
- Cloudflare Pages 미리보기 `https://b86c2d6e.ivy-self-directed-learning-coach.pages.dev`와 운영 `https://ivy-self-directed-learning-coach.pages.dev/#analysis`에 `v20260614b`를 배포했다.
- 미리보기와 운영 재검증에서 HTTP 200, 중급 B 데이터 파일 53,278바이트, 지문 50개, 50번 본문·분석 시작·저장, 기존 교재와 중급 B의 진도 분리, 모바일 문서 너비 390px, 페이지 오류 0건을 확인했다.

## 글분석 중급 C PDF 교재 반영

- 요청 대상은 `담쟁이 학습코칭 교재/자기주도 글분석력/글분석중급C.pdf`와 운영 `#analysis` 화면이다.
- 대상 PDF는 104쪽이며 4쪽부터 102쪽까지 짝수 쪽에 본문 50개, 다음 홀수 쪽에 마인드맵·서술형 활동지가 배치되어 있다. 104쪽은 뒤표지이다.
- PDF에 한글 텍스트 레이어가 있어 PyMuPDF로 본문을 직접 추출하고 머리말과 구조도 표를 제외한다.
- 중급 C는 `intermediate-c` 키와 `intermediate-c-01` 형식의 고유 ID를 사용해 기존 교재의 진도·저장 기록과 분리한다.
- 원문 기준 완전 중복은 9·50번, 11·48번, 43·44번이며 10·49번은 첫 문장의 `줄기 세포`/`줄기세포` 띄어쓰기만 다르다. 교재 순서와 표기를 그대로 유지한다.
- 로컬 Playwright에서 교재 탭 7개, 중급 C 지문 50개, 50번 본문·분석 시작, `sourceLevel: intermediate-c` 저장, 초급 A·중급 B·중급 C 진도 분리를 확인했다.
- 390×844 모바일 화면에서 가로 넘침이 없었고 페이지 오류는 0건이었다.
- PDF 50개 본문 재추출 대조, 데이터 ID·번호·쪽·글자 수 무결성 검사, 데이터 파일과 인라인 JavaScript 문법 검사, 대상 파일 `git diff --check`가 통과했다.
- 프로젝트 루트에 `package.json`이 없어 `npm run lint`, `npm run verify`, `npm run onefile`은 모두 `ENOENT`로 실행할 수 없었다.
