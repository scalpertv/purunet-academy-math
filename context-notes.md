# 컨텍스트 노트 — 결정과 근거

## 중3 수학 연산 PDF 기반 학습 페이지 제작 (2026-05-24)
- 요청 목표는 업로드된 `바빠수학(중3)연산1권 본책(미리보기 1~30).pdf`, `바빠수학(중3)연산2권 본책(미리보기 1~31).pdf`, `바빠중3도형 (1~38).pdf`를 참고해 중학교 3학년 수학 연산 학습 페이지를 만드는 것이다.
- 저작권 보호를 위해 PDF 지면, 문항, 해설을 그대로 복제하지 않고 목차·유형 흐름만 확인해 새 문제 생성 루틴과 학습 UI를 만든다.
- 기존 `academy-portal`에는 사용자 변경으로 보이는 `elem-vocab.html`, `assets/elem-vocab.css`, `js/elem-vocab.js` 변경이 있으므로 이번 작업에서는 건드리지 않는다.

## Supertonic TTS 설치 (2026-05-24)
- 요청 목표는 TTS를 `supertone-inc/supertonic`으로 대체하기 위해 해당 GitHub 저장소를 로컬에 설치하는 것이다.
- 설치 위치는 사용자 홈의 `C:\Users\paten\supertonic`으로 두고, 프로젝트 앱과 충돌하지 않도록 별도 Python 가상환경을 사용한다.
- 공식 README 확인 결과 Python SDK는 `pip install supertonic` 방식이 권장되고, 서버 용도는 `pip install 'supertonic[serve]'` 후 `supertonic serve --host 127.0.0.1 --port 7788`로 실행한다.
- 설치 완료: `C:\Users\paten\supertonic`에 저장소를 clone했고, `C:\Users\paten\supertonic\supertonic-env` Python 3.11 가상환경에 `supertonic[serve]==1.3.1`을 설치했다.
- 검증 완료: `from supertonic import TTS` import 성공, `supertonic --help`는 `PYTHONIOENCODING=utf-8` 환경에서 정상 출력, 첫 실행 모델 26개 파일 자동 다운로드 후 샘플 음성 `C:\Users\paten\supertonic\supertonic_test_en.wav` 생성 성공.
- 서버 검증 완료: `supertonic serve --host 127.0.0.1 --port 7788` 실행 후 `http://127.0.0.1:7788/docs`가 HTTP 200과 Swagger UI로 응답함을 확인했고, 테스트 서버 프로세스는 종료했다.

## 초등 영단어·영문법 실제 AI 이미지·TTS 자산 생성 및 배포 (2026-05-24)
- 요청 목표는 초등 영문법과 초등 영단어용 AI 이미지와 AI TTS를 실제 파일로 생성해 로컬과 Cloudflare Pages 운영 사이트에 저장하는 것이다.
- 대표 생성 대상으로 초등 필수 영단어 첫 단원 `가족과 나`와 초등 영문법 첫 패턴 `명사와 관사`를 먼저 선택한다. 이유는 방금 업그레이드한 AI 제작실의 첫 진입 경로라서 운영 검증과 사용자 확인이 가장 빠르기 때문이다.
- 로컬 저장 경로는 `푸르넷 영어 수학 학원(26.05.21)/academy-portal/assets/ai-elementary/`로 둔다. Cloudflare Pages는 이 폴더를 정적 자산으로 그대로 배포한다.
- 이미지는 무료 온라인 AI 이미지 생성 엔드포인트에서 JPEG로 내려받고, TTS는 로컬 설치된 Coqui XTTS-v2 CLI로 WAV를 생성한다.
- 이후 TTS 엔진 요청이 Supertonic으로 변경되어, Coqui CLI 방식 대신 `supertonic serve --host 127.0.0.1 --port 7788` 서버를 띄우고 `POST /v1/tts`를 호출하는 방식으로 전환했다.
- 분리 기준: 초등 영단어는 12개 단원을 `초급 1~4단원`, `중급 5~8단원`, `고급 9~12단원`으로 나누고, 초등 영문법 12개 패턴도 `초급 1~4`, `중급 5~8`, `고급 9~12`로 나누었다.
- 현재 앱에 내장된 초등 필수 영단어 대표 세트는 240개이며, 교육청 전체 800개 원문 목록은 아직 프로젝트 안에 없다. 따라서 현재 실제 생성 범위는 앱 내장 240개 전체와 초등 영문법 12개 전체다.
- Supertonic 서버 방식 TTS 완료: `assets/ai-elementary/words/...` 아래 단어 WAV 240개, `assets/ai-elementary/grammar/...` 아래 문법 WAV 12개, 총 252개 생성 완료. WAV 합계는 약 115,214,120 bytes다.
- 이미지 생성은 무료 이미지 서버 응답 지연으로 부분 진행 상태다. 현재 단어 이미지 15개, 문법 이미지 0개가 저장되어 있고, 대표 샘플 이미지 2개는 `assets/ai-elementary/` 루트에 남아 있다.

## 초등 영단어·영문법 AI 전자북 업그레이드 (2026-05-24)
- 요청 목표는 `초등 단어 학원 전자북 제작 루트(26.0524).md`를 기준으로 초등 영단어와 초등 영문법을 인터랙티브, 이미지, TTS, 게임화, 학습 추적이 결합된 고품질 전자북형 학습으로 업그레이드하는 것이다.
- 기존 `academy-portal`에는 `js/english-core-sites.js` 기반 초등 필수 영단어와 초등 영문법 과목이 이미 있고, `js/views.js`의 `renderEnglishCoreLab`, `renderVocabLab`, `renderGrammarLab`이 실제 학습실 UI를 렌더링한다.
- 무료 온라인 AI 이미지는 키 없이 URL 기반으로 호출할 수 있는 Pollinations 계열 이미지 생성 엔드포인트를 사용하고, 로컬 이미지는 이미 설치된 Stable Diffusion WebUI/DirectML에 붙여 넣을 수 있는 프롬프트와 부정 프롬프트를 제공하는 방향으로 설계한다.
- 무료 TTS는 브라우저 Web Speech API `SpeechSynthesis`를 기존 `actions.speakText`와 연결하고, 로컬 고품질 TTS는 설치된 Coqui XTTS-v2 CLI용 명령 큐를 화면에 제공하는 방향으로 설계한다.
- 구현 완료: `js/views.js`의 초등 영어 코어 학습실에 `elementary-ai-studio`를 추가했다. 초등 영단어는 현재 단어 6개 기반 웹툰형 장면 프롬프트를 만들고, 초등 영문법은 문법 패턴과 예문 기반 장면 프롬프트를 만든다.
- 구현 완료: 화면에는 무료 AI 이미지 열기, 브라우저 TTS 듣기, 이미지 프롬프트 복사, Coqui 명령 복사 버튼과 Stable Diffusion Prompt, Negative Prompt, Coqui XTTS-v2 PowerShell 큐가 표시된다.
- 구현 완료: `assets/styles.css`에 AI 제작실 반응형 레이아웃을 추가했고, 390px 모바일에서도 가로 overflow가 없도록 1열로 전환한다.
- 검증 완료: `node --check js/views.js`, `node --check js/english-core-sites.js`, `npm run build` 통과. Pollinations 이미지 엔드포인트는 HTTP 200 및 `image/jpeg`로 응답했다.
- 배포 완료: `npm run deploy`로 Cloudflare Pages에 반영했고 preview URL은 `https://8378007c.purunet-academy.pages.dev`다. 운영 URL `https://purunet-academy.pages.dev/`에서 초등 필수 영단어 U1과 초등 영문법 G1의 AI 제작실, Pollinations 이미지, 모바일 overflow 0, 콘솔 오류 0을 확인했다.

## Cloudflare 실제 로그인 후 푸르넷 영어·수학 진행사항 재검증 (2026-05-24)
- 요청 목표는 Cloudflare에 실제 로그인한 상태에서 운영 `purunet-academy`의 푸르넷 영어·수학 진행사항을 다시 검증하는 것이다.
- 현재 기본 PATH에는 Node/npm/npx가 없어서 프로젝트 `.node-version`에 맞춘 Node `22.16.0` ZIP 실행 환경을 `C:\Users\paten\node-v22.16.0-win-x64`에 준비했다.
- `npx wrangler@latest login` OAuth 플로우가 성공했고, `wrangler whoami` 결과 `scalpertv@gmail.com` OAuth 토큰으로 로그인되어 있으며 계정은 `Scalpertv@gmail.com's Account`, Account ID는 `419eed7ea1fec882ca2358aab66bf815`다.
- Pages 프로젝트 목록에서 `purunet-academy`와 도메인 `purunet-academy.pages.dev`가 확인되었다.
- 원격 D1은 `purunet_academy_learning_db`, database ID `373856c5-aed3-46d6-b55d-37dec2c4479a`이며, `wrangler d1 execute ... --remote`로 직접 조회했다.
- 원격 D1 테이블 수량은 학생 2명, 교사 0명, 클래스 0개, 진행 기록 1건이다.
- 학생은 `Test Student`와 `Academy E2E 1779348652370` 2명이며 둘 다 payload 기준 승인 완료, 수학·영어·진도·문제지 권한이 켜져 있고 contentEdit 권한은 꺼져 있다.
- 진행 기록은 `guest` 학생의 `math:g1-m03` 1건뿐이며 subject는 `math`, 진행률은 11%, 스티커는 1개, 완료 토픽은 `g1-op-m03-picture-add`, 갱신 시각은 `2026-05-20T21:46:40.306Z`다.
- `student_progress`에서 `subject_id='english'` 또는 `module_id LIKE 'english:%'` 조건으로 조회한 영어 진행 기록은 0건이다.
- 운영 API `https://purunet-academy.pages.dev/api/snapshot`도 HTTP 200이며 D1 직접 조회와 동일하게 교사 0명, 클래스 0개, 학생 2명, 진행 1건, 수학 1건, 영어 0건을 반환했다.

## Cloudflare 푸르넷 영어·수학 진행사항 점검 (2026-05-24)
- 요청 목표는 Cloudflare에 로그인한 뒤 운영 URL `https://purunet-academy.pages.dev`의 푸르넷 영어·수학 학습 진행사항을 확인하는 것이다.
- 우선 로컬 Wrangler 인증 세션과 `academy-portal`의 D1 바인딩, sync API, 스키마를 확인한 뒤 운영 D1 데이터를 직접 조회한다.
- 현재 PowerShell 세션은 기본 PATH에 `npx`가 없어 `C:\Program Files\nodejs`를 PATH 앞에 붙여 Wrangler 명령을 실행해야 한다.
- 로컬 `.wrangler/cache/wrangler-account.json`에는 `Scalpertv@gmail.com's Account` 계정 캐시가 남아 있었다.
- 현재 PC에는 Node/npm/npx 실행 파일이 PATH와 일반 설치 경로에서 확인되지 않아 Wrangler CLI 직접 조회 대신 운영 Pages Function `/api/snapshot`을 호출했다.
- 대상 D1은 `purunet_academy_learning_db`, 바인딩은 `ACADEMY_DB`이다.
- `/api/snapshot` 응답 기준 교사 0명, 클래스 0개, 학생 2명, 진행 기록 1건이 있다.
- 학생 2명은 `Test Student`, `Academy E2E 1779348652370`이며 둘 다 승인 완료, 수학·영어·진도저장 권한이 켜져 있다.
- 진행 기록은 `guest` 학생의 `math:g1-m03` 1건뿐이며 subject는 `math`, 진행률은 11%, 스티커는 1개, 완료 토픽은 `g1-op-m03-picture-add`, 갱신 시각은 `2026-05-20T21:46:40.306Z`이다.
- 영어 subject인 `english` 및 중등·초등·고등 영어 계열 진행 기록은 운영 스냅샷에 없다.

## Fish Speech 로컬 설치 (2026-05-24)
- 요청 목표는 Fish Speech를 현재 Windows PC에 로컬 설치하는 것이다.
- 공식 문서 기준 Fish Speech는 Python 3.12 환경을 권장하고, CPU 설치는 `pip install -e .[cpu]`로 가능하나 GPU 대비 매우 느린 테스트용 경로다.
- 현재 PC는 AMD Radeon RX 570으로 CUDA 가속을 사용할 수 없고, Fish Speech의 공식 고속 실행 기준인 NVIDIA GPU 환경과 맞지 않는다.
- 설치는 CPU 기준으로 분리된 `C:\Users\paten\fish-speech` 폴더와 별도 가상환경에 진행한다.

## Wan2GP 로컬 설치 (2026-05-24)
- 요청 목표는 Wan2GP를 현재 Windows PC에 설치하는 것이다.
- 공식 저장소는 `deepbeepmeep/Wan2GP`이며, 문서상 Windows 원클릭 스크립트 또는 수동 설치를 지원한다.
- 공식 AMD Windows 설치 문서는 Python 3.11과 TheRock ROCm PyTorch 휠을 사용하며, 지원 GPU는 RDNA2 이상 계열 중심이다.
- 현재 PC는 Radeon RX 570 Series로 확인되어 공식 AMD Windows 지원 목록의 RDNA2/RDNA3/RDNA4 계열에 포함되지 않는다.
- 따라서 설치는 저장소와 Python 환경, 의존성 확인까지 진행하되, GPU 가속 실행 검증에서 미지원이 확인될 가능성이 높다.

## Coqui TTS XTTS-v2 로컬 설치 (2026-05-24)
- 요청 목표는 Coqui TTS의 XTTS-v2 모델을 현재 Windows PC에서 로컬 실행할 수 있게 설치하는 것이다.
- 공식 Coqui 문서 기준 XTTS-v2 모델명은 `tts_models/multilingual/multi-dataset/xtts_v2`이며, 한국어 `ko`를 포함한 다국어 TTS와 음성 복제를 지원한다.
- 현재 PC는 AMD Radeon RX 570이므로 CUDA 가속 대신 CPU 실행 기준으로 설치한다.
- Stable Diffusion 검증 도중 남아 있던 Python 프로세스는 새 작업과 충돌하지 않도록 종료했다.
- XTTS-v2 모델은 Coqui Public Model License를 따르므로 첫 다운로드와 실행 시 약관 동의 처리가 필요할 수 있다.
- 설치 위치는 `C:\Users\paten\coqui-xtts-v2`이며, Python 3.10 가상환경은 `venv` 하위 폴더에 만들었다.
- 설치 패키지는 `coqui-tts==0.27.5`, `torch==2.8.0+cpu`, `torchaudio==2.8.0+cpu`, `transformers==4.57.1` 조합으로 고정했다.
- `transformers` 5.x는 `isin_mps_friendly` import 호환성 문제가 있었고, PyTorch 2.12는 `torchcodec`/FFmpeg 의존성이 강해 Windows CPU 환경에서 불안정하여 2.8 CPU 조합으로 낮췄다.
- 검증 결과 `tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 --list_language_idxs`가 성공했고, 언어 목록에 `ko`가 포함됨을 확인했다.
- 한국어 샘플 생성 검증을 완료했고 결과 파일은 `C:\Users\paten\coqui-xtts-v2\xtts_v2_ko_test.wav`이다.

## Stable Diffusion 1.5 로컬 설치 (2026-05-24)
- 요청 목표는 현재 Windows 작업 환경에 Stable Diffusion 1.5를 로컬에서 실행할 수 있게 설치하는 것이다.
- 설치 방식은 범용성이 높은 AUTOMATIC1111 Stable Diffusion WebUI 기준으로 진행한다.
- 초기 점검 결과 기본 PATH의 Python은 Microsoft Store 실행 별칭처럼 보이며 정상 실행되지 않았고, Git은 PATH에서 찾을 수 없었다.
- 설치에는 Python 3.10.x, Git, WebUI 저장소, Stable Diffusion 1.5 체크포인트 모델 파일이 필요하다.
- 네트워크 다운로드와 프로그램 설치는 샌드박스 밖 권한 승인이 필요할 수 있다.

## 수학 단계별 생성 방식 교과서식·STEM 응용 보강 (2026-05-21)
- 요청 목표는 현재 수학 학습의 `개념`, `유형`, `고난이도` 단계가 단순 연산식 중심으로 느껴지지 않도록 단계별 문항 표현과 학습 의도를 강화하는 것이다.
- 현재 앱 구조에서는 `learningArea`가 주로 단원·목차 필터로 쓰이고, 실제 문항은 `topic.generate()`가 반환한 `Problem`을 학습 화면과 문제지 출력에 그대로 전달한다.
- 수천 줄의 기존 생성기를 직접 수정하면 회귀 범위가 커지므로, 생성된 `Problem`을 학습 영역별로 변환하는 공통 경로를 `App.tsx`에 두고 학습 시작과 문제지 출력이 같은 보강 결과를 쓰도록 한다.
- 검증 기준은 `app/`에서 `npm run lint`, `npm run verify`, `npm run onefile`을 통과시키고, 단일 HTML과 모바일 `study.html` 산출물을 최신 빌드로 반영하는 것이다.
- 구현 결과 `개념`은 교과서식 개념 설명, 스토리텔링 수학, STEM 연결, 교과서 예제 구조로 변환된다. `유형`은 정보 표시, 관계식 세우기, 계산, 검산의 중간 단계 풀이 전략을 붙이고, `고난이도`는 현실 조건을 수학 모델로 바꾸는 스토리텔링 STEM 미션으로 변환된다.
- 학습 화면 시작과 선택 문제지 출력 모두 `buildTopicProblemSet()`의 동일한 보강 경로를 거치도록 연결했다. 기존 정답, 보기, 시각 자료, 채점 방식은 그대로 유지한다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile` 통과. 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 HTML의 SHA256은 `95E58925F2DECDB252561821535941571A4BD01A73394EB50ABF60FE00366ED2`로 동일하다.
- 모바일 서비스 워커 캐시는 `codex-math-mobile-v81`로 갱신했다.

## 유치원 학습 놀이터 회원가입과 교사용 3D 모니터링 (2026-05-20)
- 요청 목표는 프로그램 제목을 `푸르넷 유치원`으로 바꾸고, 학생용·교사용 회원가입과 역할 분기를 만들며, 교사용 화면에서 등록 클래스와 학생 학습 내용을 실시간으로 모니터링하게 만드는 것이다.
- 기존 큰 수학 앱의 교사용 모니터링은 클래스 요약과 학생별 진행 행을 중심으로 구성되어 있었다. 이번 유치원 앱은 단일 HTML 구조이므로 같은 개념을 localStorage roster와 학생별 진행 스냅샷으로 축소 구현했다.
- 학생용은 기존 365일 학습 놀이터를 유지한다. 학생 계정으로 학습하면 `currentDay`, `currentWeek`, 완료 활동, 스티커, 최근 활동 시간이 학생 record에 동기화된다.
- 교사용 화면은 `teacher-dashboard`로 분리했다. 클래스·학생 등록, 클래스 필터, 요약 카드, 학생별 진행 카드, 3D 진행률 막대를 포함한다.
- 검증 결과는 `kindergarten-learning-playground`에서 `npm run check`, `npm run smoke` 통과다. Edge 기반 파일 실행 점검에서도 회원가입, 교사용 대시보드, 학생 등록, 3D 캔버스, 모바일 overflow 없음이 확인됐다.

## 유치원 학습 놀이터 365일 코스와 학습지도 모니터링 (2026-05-20)
- 요청 목표는 `푸르넷 유치원(26.05.20)/kindergarten-learning-playground`의 기존 52주 코스를 365일 기준으로 확장하고, 현재 학습 위치와 진행 상황을 모니터링할 수 있게 만드는 것이다.
- 구현 방향은 52주 테마 데이터를 삭제하지 않고 `js/data.js`에서 365일 일차 계획을 생성하는 방식이다. 365일차는 52주차 입학 준비 발표회로 두고 5종 활동을 모두 연결했다.
- `js/models.js`는 `currentDay`를 추가해 일차 중심으로 이동하고, `currentWeek`는 현재 일차에서 자동 계산하도록 했다. 완료 기록에는 완료 당시 일차와 주차를 저장한다.
- `js/views.js`는 교실 화면에 일차 슬라이더, 주차 바로 이동, 365일 학습지도, 오늘 목표와 주차·전체 진행률, 가정 미션과 교사 체크 문구를 표시한다. 보상 정원에도 선택 교실의 365일 진행 요약을 표시한다.
- 현재 앱 폴더에 검증용 `package.json`과 `scripts/smoke.mjs`가 없어 복구했다. 검증은 `npm run check`, `npm run smoke`, Edge 기반 `file://` Playwright 점검을 통과했다.

## Cloudflare 서버와 PC 설치 프로그램 업데이트 (2026-05-20)
- 요청 목표는 직전 교사용 roster 범위 제한 변경을 Cloudflare Pages 운영 서버와 Windows PC 설치 프로그램에 반영하는 것이다.
- 작업 기준은 `app` 패키지의 `npm run pages:deploy`로 Cloudflare Pages production 배포를 실행하고, 운영 URL의 HTTP 응답과 참조 asset을 확인한 뒤 `npm run installer:win`으로 Windows 설치 파일을 다시 만드는 것이다.
- 설치 배포 묶음도 기존 루틴처럼 `app/release.zip`으로 다시 압축하고, 설치 EXE·blockmap·app.asar·release.zip SHA256을 기록한다.
- Cloudflare Pages 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://01c5414d.purunet-math-ebook.pages.dev`이고 운영 URL `https://purunet-math-ebook.pages.dev/`는 HTTP 200이며 `assets/index-BMrGLTPt.js`를 참조한다. 운영 JS SHA256은 로컬 빌드와 같은 `C494DE4CF8AAD721A69045DDEA76DEA7F35581B672777BB2E2F58A52397E7638`이고 `담당 교사 범위`, `담당 학습자 실시간 진도맵` 문자열을 확인했다.
- Windows 설치 파일 갱신 완료: `npm run installer:win` 성공 후 `app/release.zip`도 최신 `app/release` 기준으로 다시 압축했다. 설치 EXE 크기는 `102797013` bytes, `release.zip` 크기는 `250557183` bytes다.
- 최신 설치 산출물 SHA256: 설치 EXE `A1D5369042A86058C59E3437E2FAE8F58DEA317B2BC7363DC3D2F079EDC665B7`, blockmap `273E67341B439EE4CFB42C90DBCD3A6C00BF29DAC98060A5E1ED085E0E57F25B`, app.asar `2EDBDE3D8C978B9988858A0165222A3DB7828FE5D4557DDF8667F2E4C0B9771E`, release.zip `F03549A6BACD36E7FD8C7D4216AE30F19060EBFEB3B2B75EC018D58CD57BBF27`이다.
- 설치본 `app.asar` 내부에서 `dist/index.html`, `assets/index-BMrGLTPt.js`, `assets/index-CZIj7P0w.css`, `electron/main.cjs` 포함을 확인했다. Electron Builder의 앱 아이콘 fallback 경고, Vite 큰 번들 경고, DEP0190 경고는 기존과 같은 비차단 경고다.

## 교사용 로그인 roster 범위 제한 (2026-05-20)
- 요청 목표는 교사용 계정으로 로그인했을 때 해당 선생님이 만든 클래스와 그 클래스에 등록된 학생만 보이고, 다른 선생님의 클래스나 같은 이름의 학생이 섞여 노출되지 않게 하는 것이다.
- 현재 구조에서는 `loadLearningRosterSnapshot()`이 전체 교사·클래스·학생 목록을 반환하고, `App.tsx`의 등록/관리/모니터링 UI가 이 목록을 그대로 순회하는 경로가 있다. 따라서 교사용 로그인 상태에서는 `activeTeacherAccount.teacherId`를 기준으로 화면용 목록을 한 번 더 좁히는 것이 가장 작은 변경이다.
- 이전 로그인이나 관리자 대리 사용으로 다른 교사의 `classId`와 `studentId`가 settings에 남아 있을 수 있으므로, roster snapshot을 만들 때 active class와 active student가 active teacher 범위 안에 있는지도 함께 확인한다.
- 검증 기준은 `npm run lint`, `npm run verify`, `npm run onefile` 통과와 단일 HTML 산출물 반영이다.
- 구현 완료: `App.tsx`에서 교사용 로그인 상태의 `teacherId`를 `teacherScopedId`로 잡고, 화면용 선생님·클래스·학생·학생 계정·진도 목록을 이 범위로 제한했다. 학생 관리, 클래스 관리, 등록 스트립, 모니터링 패널, 학생 계정 조회도 같은 목록을 사용한다.
- 구현 완료: 클래스 선택, 학생 선택, 클래스 수정, 학생 수정, 비밀번호 초기화 핸들러에 교사 범위 밖 데이터 선택 방어를 추가했다. 교사용 모니터링 문구도 `담당 교사 범위`로 바꿔 관리 범위를 명확히 표시한다.
- 구현 완료: `learnerDb.ts`에서 교사 로그인 시 남아 있던 다른 클래스·학생 선택값을 비우고, roster snapshot 생성 시 active class와 active student가 active teacher와 일치할 때만 유지하도록 보강했다. `loadAllLearningProgress()`는 선택적으로 `teacherId`를 받아 담당 학생 진도만 계산할 수 있게 했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile` 통과. 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 모바일 서비스 워커 캐시는 `codex-math-mobile-v80`으로 올렸다. 단일 HTML 3개 파일 SHA256은 모두 `6DBC132F57D4A2235E32750A53531AAFF2059D3B80D498F42D5CCED0219BA507`이다.

## 기존 Cloudflare 주소 최신 출력본 동기화 (2026-05-20)
- 점검 결과 신규 운영 주소 `https://purunet-math-ebook.pages.dev/`는 최신 `assets/index-BmUNbY-V.js`를 참조하고 `print-visual`, `renderToStaticMarkup` 코드가 포함되어 있었다.
- 기존 주소 `https://prunet-math-ebook.pages.dev/`도 아직 HTTP 200으로 살아 있으나 예전 `assets/index-DJ_DOl9Q.js`를 참조하고 있었다. 사용자가 기존 주소로 접속하면 문제지·답안지 출력 변경이 전혀 보이지 않는 것이 정상적인 증상이다.
- 조치 방향은 공식 주소는 `purunet`으로 유지하되, 기존 북마크와 설치/안내 잔존 사용자를 위해 기존 `prunet-math-ebook` Pages 프로젝트에도 같은 최신 빌드를 배포하는 것이다.
- 기존 주소 동기화 완료: `npx wrangler pages deploy dist --project-name prunet-math-ebook --branch main` 성공. 새 preview URL은 `https://51cd49fe.prunet-math-ebook.pages.dev`다.
- 최종 검증 완료: `https://purunet-math-ebook.pages.dev/`, `https://prunet-math-ebook.pages.dev/`, `https://51cd49fe.prunet-math-ebook.pages.dev/` 모두 HTTP 200이고 `assets/index-BmUNbY-V.js`, `assets/index-CZIj7P0w.css`를 참조한다. 양쪽 JS SHA256은 모두 `4F6A1B1FD2EE6DB600141537378493E7E5F9C909578FB7259CCBA7996F15DA4C`이며 `print-visual`, `renderToStaticMarkup` 포함을 확인했다.

## 시각 자료 출력 보정본 서버·설치 파일 반영 (2026-05-20)
- 요청 목표는 문제지·답안지 출력에서 벡터 이미지와 도표·그래프·도형이 보이도록 수정한 최신 앱을 Cloudflare Pages 운영 서버와 Windows 설치 파일까지 반영하는 것이다.
- 배포 기준은 `app/`에서 기존 `npm run pages:deploy`를 사용해 `purunet-math-ebook` production `main` 브랜치에 올리고, 설치 파일은 `npm run installer:win` 후 최신 `app/release` 기준으로 `app/release.zip`을 다시 압축하는 것이다.
- 검증 기준은 Cloudflare 운영 URL HTTP 200, 운영 HTML의 최신 asset 참조 확인, Windows 설치 EXE·blockmap·app.asar·release.zip SHA256 기록이다.
- Cloudflare Pages 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://d119d65b.purunet-math-ebook.pages.dev`이고 운영 URL `https://purunet-math-ebook.pages.dev/`는 HTTP 200이며 `assets/index-BmUNbY-V.js`, `assets/index-CZIj7P0w.css`를 참조한다. 운영 JS SHA256은 로컬 빌드와 같은 `4F6A1B1FD2EE6DB600141537378493E7E5F9C909578FB7259CCBA7996F15DA4C`이고 `print-visual`, `renderToStaticMarkup` 문자열을 확인했다.
- Windows 설치 파일 갱신 완료: `npm run installer:win` 성공 후 `app/release.zip`도 최신 `app/release` 기준으로 다시 압축했다. 설치 EXE 크기는 `102796617` bytes, `release.zip` 크기는 `250556548` bytes다.
- 최신 설치 산출물 SHA256: 설치 EXE `0F49900588A19B4F7AECDA63AB082DF3DC3021A09DAF713145F0500DF25C4830`, blockmap `E0820BFE8286EBCD7D1BE042A53FCD5B8D6C3D4386DBC3C3BEC35131714FDF48`, app.asar `FC1B0AD66875EBA3EE5531F966B1F967AA3F9D081CA6B6E782106A004E33B559`, release.zip `556BB950CBA44DBCEDE04D4109CEC319E41DBDC354B409FEC37CA4A3F23476A4`다.
- 참고: Electron Builder의 앱 아이콘 fallback 경고, Vite 큰 번들 경고, DEP0190 경고는 기존과 같은 비차단 경고이며 설치 파일 생성과 배포는 정상 완료됐다.

## 문제지·답안지 출력 시각 자료 표시 보정 (2026-05-20)
- 요청 목표는 문제지 출력과 답안지 출력에서 벡터 이미지, 도표, 그래프, 도형 같은 모든 문제 시각 자료가 실제 그림으로 보이게 하는 것이다.
- 현재 인쇄 경로는 `Problem.visual`을 `visualToPrintableText`로 설명 문장만 출력한다. 학습 화면에서는 `MathVisual` 컴포넌트가 같은 데이터를 SVG와 표로 이미 렌더링하므로, 인쇄 HTML에서는 해당 컴포넌트를 정적 마크업으로 변환해 재사용하는 것이 가장 작고 누락이 적다.
- 검증 기준은 `npm run lint`, `npm run verify`, `npm run onefile`, 단일 HTML 및 모바일 `study.html` 반영, 모바일 서비스 워커 캐시 버전 갱신이다.
- 구현 완료: `app/src/App.tsx`에서 `MathVisual`을 `renderToStaticMarkup`으로 인쇄 HTML에 넣고, 팝업 문서에 SVG·표·그래프용 `.print-visual` CSS를 추가했다. 같은 `printableProblemHtml` 경로를 쓰므로 문제지와 답안지 모두 적용된다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile` 통과. 단일 HTML 3개 파일 SHA256은 모두 `B9359EFC82EE367700A354F0B5AE5A7A43CE13A9236CCA6FC425745C265C561B`이고, 모바일 서비스 워커 캐시는 `codex-math-mobile-v79`로 올렸다.

## 문제지 출력 분수·나눗셈 표기 보정 (2026-05-20)
- 요청 목표는 문제지 출력에서 분수나 나눗셈 표현에 `/`가 보이는 것을 수학 표기답게 바꾸는 것이다.
- 적용 범위는 문제지·답안지 팝업 HTML 생성 경로다. 학습 화면의 `MathText` 렌더링과 문제 생성 원본 데이터는 그대로 두고, 인쇄용 HTML 변환 단계에서만 표시를 보정하는 것이 가장 작고 안전하다.
- 구현 기준은 `1/2`, `2 1/3`, `\\frac{1}{2}` 같은 분수 표기는 인쇄에서 분수 막대로 보이게 하고, 공백을 둔 나눗셈 slash는 `÷`로 바꾸는 것이다. 학생 입력 안내와 정답 데이터 자체는 바꾸지 않는다.
- 검증 기준은 `npm run lint`, `npm run verify`, `npm run onefile`, 단일 HTML 및 모바일 `study.html` 반영, 모바일 서비스 워커 캐시 버전 갱신이다.
- 구현 완료: `app/src/App.tsx`의 문제지·답안지 인쇄용 HTML 변환 함수에서 일반 분수, 대분수, LaTeX `\\frac{}{}` 표기를 인쇄용 분수 막대 HTML로 바꾸고 공백을 둔 `/` 나눗셈은 `÷`로 표시하게 했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile` 통과. 단일 HTML 3개 파일 SHA256은 모두 `7495B1CFBAA6E62D61123C9EBAEF1D48E918C8FFF9CF5B6E76A9876CAE4291AD`이고, 모바일 서비스 워커 캐시는 `codex-math-mobile-v78`로 올렸다.

## Cloudflare 수학 익힘책 운영 주소 변경 (2026-05-20)
- 요청 목표는 수학 익힘책 운영 주소를 기존 `https://prunet-math-ebook.pages.dev`에서 신규 `https://purunet-math-ebook.pages.dev`로 변경하고, 현재 프로젝트 파일의 서버 주소 참조도 같은 값으로 맞추는 것이다.
- 변경 범위는 Pages 프로젝트명, 배포 스크립트, Electron 라이브 URL, OAuth 안내 문구다. D1 데이터베이스 이름 `prunet_math_learning_db`는 실제 원격 DB 식별자와 백업/마이그레이션 명령에 연결되어 있으므로 주소 표기 변경과 분리해 유지한다.
- 검증 기준은 `npm run lint`, `npm run verify`, `npm run onefile`, 단일 HTML 및 모바일 `study.html` 반영, 모바일 서비스 워커 캐시 버전 갱신, 신규 Pages 운영 URL HTTP 200 확인, Electron 설치 파일 재생성 여부 확인이다.
- 구현 완료: `wrangler.toml`, `app/wrangler.toml`, `app/package.json`, `app/electron/main.cjs`, `app/main.cjs`, `app/src/App.tsx`의 현재 운영 주소 참조를 `purunet-math-ebook` 기준으로 변경했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile` 통과. 단일 HTML은 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고 모바일 캐시는 `codex-math-mobile-v77`로 올렸다.
- Cloudflare Pages 신규 프로젝트 `purunet-math-ebook` 생성 후 production `main` 배포 완료. 새 배포 URL은 `https://e9b59731.purunet-math-ebook.pages.dev`이고 운영 URL `https://purunet-math-ebook.pages.dev/`는 HTTP 200이다.
- 운영 검증 완료: 운영 HTML은 `assets/index-jWjpvSDu.js`를 참조하고, 운영 JS SHA256은 로컬 `dist/assets/index-jWjpvSDu.js`와 같은 `08AF59391C0DA31E724079B32D99F7923D16883005023F73AB08A54F0179CEEA`다. `/api/learning/snapshot`도 새 도메인에서 HTTP 200으로 응답해 기존 D1 바인딩 연결을 확인했다.
- Windows 설치 파일 갱신 완료: `npm run installer:win` 통과 후 `app/release.zip`을 최신 `app/release` 기준으로 다시 압축했다. `app.asar` 내부 `electron/main.cjs`도 `https://purunet-math-ebook.pages.dev/`를 우선 로드하고 기존 주소는 포함하지 않는다.
- 최신 산출물 SHA256: 설치 EXE `FDED0534483A5FAC5D74C59BD88E30D7D17F8BC0DB354D959815D15B78E259EF`, blockmap `3EA6E879DF34C179D2BCB7503E62D60280F7688266972F07E702842CD521905A`, app.asar `A0CFE6F2F774AE1DCB90C22B4BB3ACC47B45956B10755D57C132503130E1665D`, release.zip `5BE030FB565F77C7E144B3BB19F31E31DD6A5219D8546A48FAF80FEA4E05635F`다.

## 문제 세트 선택과 출력 기능 추가 (2026-05-20)
- 요청 목표는 단원·세부 단원 문제 생성 수를 기존 10문제에서 20문제, 30문제까지 선택할 수 있게 하고, 학생과 교사가 선택한 세트를 문제지와 답안지로 출력할 수 있게 하는 것이다.
- 기존 구조에서는 `App.tsx`의 `PROBLEMS_PER_TOPIC`과 `buildTopicProblemSet()`이 세부 유형 생성기를 10회 호출한다. 생성기 자체를 복제하기보다 세트 크기 설정을 저장하고 같은 생성기를 선택한 횟수만큼 호출하도록 바꾸는 방식이 가장 작고 안전하다.
- 문제지·답안지는 브라우저 팝업 인쇄 방식으로 구현한다. 상단에는 현재 활성 선생님, 학습자, 반, 날짜를 자동으로 넣고, 답안지는 같은 문제 배열에서 정답과 풀이를 출력해 문제지와 불일치하지 않도록 한다.
- Git 저장소가 아니므로 완료 시 커밋 대신 변경 파일과 검증 결과를 보고한다.
- 구현 완료: `LearningSettings`에 `problemSetSize`를 추가해 10·20·30문제 세트를 저장하고, `buildTopicProblemSet()`이 선택된 개수만큼 세부 유형 생성기를 호출하게 했다.
- 구현 완료: 학생·교사 공용 학습 선택 메뉴에 `문제 세트` 콤보박스와 `문제지 출력`, `답안지 출력` 버튼을 추가했다. 단원 전체 선택 시에는 각 세부 내용마다 선택한 세트 수만큼 생성한다.
- 구현 완료: 출력 팝업은 선생님 이름, 학생 이름, 반, 문제풀이 날짜를 자동 표시한다. 문제지와 답안지는 같은 문제 배열을 재사용하며, 답안지에는 정답과 풀이가 함께 표시된다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile` 통과. Playwright와 설치된 Chrome으로 20문제 문제지 팝업 20문항, 30문제 답안지 팝업 30문항 및 자동 메타데이터 표시를 확인했다.
- 산출물 반영 완료: 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 복사했고, 모바일 서비스 워커 캐시를 `codex-math-mobile-v76`으로 올렸다.

## 문제 세트 선택 기능 서버·설치 파일 반영 (2026-05-20)
- 요청 목표는 방금 구현한 10·20·30문제 세트 선택, 문제지 출력, 답안지 출력 기능을 Cloudflare 운영 서버와 Windows 설치 파일까지 반영하는 것이다.
- 배포 기준은 기존 프로젝트 스크립트 그대로 `npm run pages:deploy`를 사용하고, 설치 파일은 `npm run installer:win` 후 `app/release.zip`을 최신 `app/release` 폴더 기준으로 다시 압축한다.
- Cloudflare Pages 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://f2ad7607.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`도 HTTP 200이다.
- 운영 서버 확인 완료: 운영 HTML이 `index-DJ_DOl9Q.js`, `index-CZIj7P0w.css`를 참조하고, `curl`로 내려받은 운영 JS SHA256이 로컬 `dist/assets/index-DJ_DOl9Q.js`와 같은 `F00722EB60B8F31BBAC438A38B3F6615FC75A87C3CCB49704215426AC0661462`이다. 운영 JS 안에서 `문제 세트`, `문제지 출력`, `답안지 출력`, `20문제 세트`, `30문제 세트` 문자열을 확인했다.
- Windows 설치 파일 갱신 완료: `npm run installer:win` 성공. 아이콘 파일 미지정 경고와 Vite 큰 번들 경고는 기존 성격의 경고이며 빌드와 NSIS 생성은 완료됐다.
- 최신 산출물 해시: 설치 EXE `B5618FAE4827F8DF3535991BFB0C4A52C84BB05F70B950493222D960F99B8628`, blockmap `3E9F79D4585D510E598BCC0264FE3460C8DD19938137B5F93235CC22F178F028`, app.asar `B840489B09297B52F3B8C1DF4435AFE1E261AACB91EBA49A3B90A2613E67484C`, release.zip `E13C4F95D5480EA54C209431A4A08D797A323C671B7F5961C55A31AAFD0856B2`이다.

## 푸르넷 영어 모바일 버튼 가독성 보강 (2026-05-20)
- 요청 목표는 모바일 화면에서 팝업성 버튼과 학습 버튼의 글씨가 활성화 전에도 보이도록 가독성을 높이는 것이다.
- 진단 결과 라이트 모드는 큰 문제가 없었고, 다크 모드에서 `primary`, `danger`, 활성 stage/axis 버튼은 배경이 너무 밝아 흰 글씨 대비가 낮았으며 비활성 stage/axis 버튼은 글자색과 어두운 배경이 거의 붙어 보였다.
- 구현 완료: 다크 모드 `--teal`, `--blue`, `--coral`을 각각 `#087b72`, `#0b6e8a`, `#b93a30`으로 깊게 조정하고, 비활성 `axis-btn`, `stage-btn`, `choice-btn`은 `#123f3a` 배경과 `var(--ink)` 글자색으로 분리했다.
- 구현 완료: 모바일 폭에서 주요 버튼의 `font-weight`를 950으로 강화하고 `text-shadow`를 제거해 작은 화면에서도 번짐 없이 읽히게 했다.
- 검증 완료: `npm run check` 통과. 정적 대비 계산에서 다크 primary 5.14:1, active 5.81:1, danger 5.66:1, inactive 11.2:1로 확인했고, Edge 채널 Playwright 모바일 다크 스크린샷에서 버튼 글자가 보이는 것을 확인했다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 최신 preview URL은 `https://9f1b6274.purunet-english-ebook.pages.dev`이고 운영 URL `https://purunet-english-ebook.pages.dev/`는 HTTP 200, 운영 CSS에서 새 다크 버튼 토큰과 모바일 글자 두께 규칙 반영을 확인했다.

## 푸르넷 영어 에머랄드 팔레트 가독성 보정 (2026-05-20)
- 요청 목표는 에머랄드 바다빛 팔레트 적용 후 일부 요소의 글씨 가독성이 떨어진 문제를 바로잡는 것이다.
- 진단 기준은 Playwright로 실제 DOM을 렌더링한 뒤 텍스트 색과 배경색 대비를 계산하고, 4.5:1 미만 후보를 우선 보정하는 것이다.
- 1차 진단에서 흰 글씨가 올라가는 primary 버튼, 활성 단계 버튼, 트랙 코드, 위험 버튼, 일부 muted label이 기준보다 약하게 나왔다. gradient 배경 추정 한계가 있는 요소도 있었지만, 실제 사용자 시야에서 약해질 수 있는 색은 함께 보정한다.
- 구현 기준은 에머랄드 바다빛 방향은 유지하면서 `--teal`, `--blue`, `--coral`, `--focus`, `--muted`를 더 깊게 낮추고, hero 내부 secondary 버튼은 별도 규칙으로 어두운 hero 배경과 구분되게 만드는 것이다.
- 구현 완료: `--muted`를 `#335f5b`, `--teal`을 `#00786f`, `--blue`를 `#086f8c`, `--coral`을 `#bd3f34`, `--focus`를 `#005d56`으로 조정했다. hero gradient도 더 깊은 바다빛으로 낮추고 `.learner-hero .secondary-btn`은 `#004f48` 텍스트와 밝은 아쿠아 배경으로 분리했다.
- 검증 완료: Playwright 대비 점검에서 4.5:1 미만 후보가 0개로 줄었다. `npm run check` 통과, 데스크톱·390px 모바일에서 hero와 16개 트랙이 렌더링되고 가로 overflow가 없는 것도 확인했다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 최신 preview URL은 `https://f0b6662e.purunet-english-ebook.pages.dev`이고 운영 URL `https://purunet-english-ebook.pages.dev/`는 HTTP 200, 운영 CSS에서 대비 보정 토큰과 hero 버튼 보정 규칙 반영을 확인했다.

## 푸르넷 영어 에머랄드 바다빛 팔레트 전환 (2026-05-20)
- 요청 목표는 영어 학습 화면의 색상을 에머랄드 바다빛 색상들이 많이 들어가도록 바꾸는 것이다.
- 구현 기준은 기존 레이아웃과 Cloudflare D1 기능을 유지하면서 CSS 디자인 토큰, body 배경, topbar 배지, hero 배경, 트랙 카드, 진행률, 보조 패널, SVG 시각 자산까지 에머랄드·아쿠아·바다 청록 계열이 주색으로 보이게 만드는 것이다.
- 의미색은 최소화한다. 위험·오답 의미의 coral은 남기되, 일반 강조색과 진행 색은 베이지·노랑·남색 중심에서 emerald sea palette로 교체한다.
- 검증 기준은 `npm run check`, Playwright 렌더링에서 hero와 SVG가 정상 로딩되고 가로 overflow가 없는지 확인, Cloudflare Pages production 재배포, 운영 CSS와 SVG 반영 확인이다.
- 구현 완료: `assets/styles.css`의 기본 팔레트를 `--bg: #e7fbf8`, `--teal: #009b8e`, `--blue: #0c8fb3`, `--amber: #22c6b5`, `--lime: #4ed7b2` 중심으로 바꾸고, body 배경·hero·배지·버튼·진행률·읽기/단어/문법 패널 보조색을 emerald sea 계열로 조정했다.
- 구현 완료: `assets/learning-studio.svg`의 배경 stop, 원형 포인트, 헤드셋, 텍스트 라인, 그래프 색에서 기존 노랑·파랑 포인트를 제거하고 emerald·aqua 계열로 다시 칠했다.
- 검증 완료: `npm run check` 통과. Playwright에서 데스크톱 팔레트 토큰 `#e7fbf8`, `#009b8e`, `#0c8fb3`, `#22c6b5`, hero 존재, SVG 로딩, 16개 진행률 바, 데스크톱·모바일 가로 overflow 없음이 확인됐다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 최신 preview URL은 `https://4e1aadf3.purunet-english-ebook.pages.dev`이고 운영 URL `https://purunet-english-ebook.pages.dev/`는 HTTP 200, 운영 CSS와 SVG의 emerald sea palette 반영을 확인했다.

## 푸르넷 영어 좌우 패널 스크롤바 최소화 (2026-05-20)
- 요청 목표는 왼쪽 제어 패널의 세로 스크롤바를 투명하고 최소 굵기로 바꾸고, 오른쪽 스크롤바도 같은 패턴으로 맞추는 것이다.
- 구현 기준은 `track-panel`과 `teacher-panel`에 Firefox용 `scrollbar-width: thin`, `scrollbar-color`, Chromium/WebKit용 `::-webkit-scrollbar` 4px, transparent track, 약한 opacity thumb, hover 시에만 조금 더 보이는 thumb을 적용하는 것이다.
- 오른쪽 패널은 데스크톱에서 sticky 내부 스크롤을 사용하고, 1280px 이하에서는 전체폭 그리드로 내려가므로 sticky와 internal scroll을 해제해 모바일 흐름을 깨지 않게 한다.
- 검증 기준은 `npm run check`, 브라우저에서 좌우 패널의 scrollbar CSS 계산값 확인, Cloudflare Pages production 재배포, 운영 CSS 반영 확인이다.
- 구현 완료: `assets/styles.css`에서 `track-panel`과 `teacher-panel`에 `scrollbar-width: thin`, transparent track, 4px WebKit scrollbar, 약한 teal thumb, hover opacity 증가를 적용했다. 오른쪽 `teacher-panel`은 데스크톱에서 `position: sticky`, `max-height: calc(100vh - 112px)`, `overflow: auto`로 맞췄고 1280px 이하에서는 `position: static`, `overflow: visible`로 되돌린다.
- 검증 완료: `npm run check` 통과. Playwright 계산값에서 데스크톱 `track-panel`과 `teacher-panel` 모두 `overflow-y: auto`, `scrollbar-width: thin`으로 확인됐고, 900px 폭에서는 오른쪽 패널이 `position: static`, `overflow-y: visible`로 확인됐다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 최신 preview URL은 `https://80c261cd.purunet-english-ebook.pages.dev`이고 운영 URL `https://purunet-english-ebook.pages.dev/`는 HTTP 200, 운영 CSS에서 좌우 패널 scrollbar selector와 transparent thin 설정 반영을 확인했다.

## 푸르넷 영어 학습 사이트 전면 리디자인 (2026-05-20)
- 요청 목표는 직전 리프레시가 여전히 정적이고 학습자 친화적이지 않다는 평가를 반영해, 영어 학습용 사이트의 웹 디자인을 부분 수정이 아니라 전체 구조 기준으로 다시 바꾸는 것이다.
- 이번 개편은 기능 로직과 Cloudflare D1 API는 유지하고, 화면 경험을 `상단 브랜드 바 → 학습자 hero cockpit → 트랙 진행률 레일 → 중앙 수업 카드 → 오른쪽 코칭·포트폴리오 패널`로 재구성한다.
- 학습자 친화성 기준은 첫 화면에서 오늘 학습 목표, 현재 TESOL 단계, 모델 음성 듣기, 단계 완료, 완료율, 학습 증거, 단어·문법 정확도, 서버 저장 상태가 즉시 보이도록 하는 것이다.
- 시각 자산 기준은 외부 의존 없이 `assets/learning-studio.svg`를 로컬 자산으로 추가해 책, 말풍선, 오디오 웨이브, 학습 카드가 보이는 학습 스튜디오 분위기를 만든다.
- 디자인 기준은 bento형 정보 구조, 목적 있는 microinteraction, accessible contrast, 모바일 단일 열 전환, dark mode, reduced-motion 대응이다. 장식만 있는 랜딩 페이지가 아니라 실제 학습 조작을 첫 화면에서 바로 할 수 있게 유지한다.
- 검증 기준은 `npm run check`, 데스크톱·모바일 Playwright 렌더링에서 hero 존재, SVG 로딩, 16개 트랙, 16개 진행률 바, 가로 overflow 없음 확인, Cloudflare Pages production 재배포, 운영 URL 반영 확인이다.
- 구현 완료: `index.html`의 브랜드명을 `푸르넷 영어 인터랙티브 스튜디오`로 바꾸고 `learner-hero` 영역을 추가했다. `views.js`는 선택 트랙 기반 hero cockpit, hero action, floating status, hero stats, 트랙별 진행률을 렌더링하도록 확장했다.
- 구현 완료: `assets/learning-studio.svg`를 추가하고 `assets/styles.css`를 새 디자인 시스템으로 전면 교체했다. 새 CSS는 학습자 hero, SVG float motion, 진행률 트랙 카드, 단계 완료 표시, 코칭 패널 accent, dark mode, reduced-motion, 1280px·900px·560px 반응형을 포함한다.
- 검증 완료: `npm run check` 통과. 로컬 Playwright와 운영 URL Playwright 모두 데스크톱과 390px 모바일에서 hero 존재, SVG 로딩, 16개 트랙, 16개 진행률 바, 가로 overflow 없음이 확인됐다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 최신 preview URL은 `https://84836731.purunet-english-ebook.pages.dev`이고 운영 URL `https://purunet-english-ebook.pages.dev/`는 HTTP 200, 새 hero 구조와 CSS, `assets/learning-studio.svg` 로딩을 확인했다.

## 푸르넷 영어 학습 사이트 최신 UI 디자인 개선 (2026-05-20)
- 요청 목표는 `mvc-english-learning` 영어 학습용 사이트 화면이 오래된 스타일로 보이는 문제를 해결하고 최신 홈페이지·학습 플랫폼 트렌드에 맞게 개선하는 것이다.
- 2026년 UI 흐름은 bento형 모듈 배치, 절제된 translucent surface, 다크 모드 성숙도, 명확한 정보 위계, 접근성 우선 대비, 모바일 우선 반응형이 핵심이다. 이번 작업은 장식형 랜딩 페이지가 아니라 실제 학습 화면의 생산성을 유지하는 앱형 홈페이지 리프레시로 진행한다.
- 수정 범위는 `index.html`의 상단 상태 배지와 `assets/styles.css`의 전체 디자인 토큰·레이아웃·컴포넌트 스타일이다. 학습 데이터, MVC 로직, Cloudflare D1 API 구조는 바꾸지 않는다.
- 검증 기준은 `npm run check`, 브라우저에서 16개 트랙과 서버 DB 저장 버튼 렌더링 확인, 모바일 폭 레이아웃 확인, Cloudflare Pages production 재배포와 운영 URL HTTP 200 확인이다.
- 구현 완료: 상단 헤더를 앱형 command bar로 정리하고 `16 Tracks`, `D1 Live Sync`, `TESOL Flow` 상태 배지를 추가했다. CSS는 밝은 테마·다크 테마, translucent panel, 모듈형 트랙 목록, 현대적 버튼 hover, 명확한 focus, 모바일 단일 열 흐름, reduced-motion 대응으로 교체했다.
- 검증 완료: `npm run check` 통과. Playwright 렌더링 점검에서 데스크톱과 390px 모바일 모두 16개 트랙이 렌더링되고 가로 overflow가 없는 것을 확인했다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 최신 preview URL은 `https://ae1a7ff7.purunet-english-ebook.pages.dev`이고 운영 URL `https://purunet-english-ebook.pages.dev/`는 HTTP 200, `D1 Live Sync` 문구, `assets/styles.css`의 `top-meta`, dark mode, dark chip 대비 보정, reduced-motion 스타일 반영을 확인했다.

## 푸르넷 영어 Cloudflare Pages와 D1 서버 DB 전환 (2026-05-19)
- 요청 목표는 독립 영어 MVC 학습 프로그램을 Cloudflare Pages 프로젝트 `purunet-english-ebook`로 운영하고, 접속 주소를 `https://purunet-english-ebook.pages.dev`로 고정하며, 학습 데이터 저장소를 Cloudflare D1 서버 DB로 확장하는 것이다.
- 기존 수학 전자북 Pages 프로젝트 `prunet-math-ebook`과 D1 DB `prunet_math_learning_db`는 유지하고, 영어 앱은 `강태훈샘_푸르넷영어책(26.05.19)/mvc-english-learning` 안에 별도 `wrangler.toml`, Pages Function, D1 migration을 둔다.
- Cloudflare 계정은 Wrangler OAuth 로그인 상태로 확인됐고, 새 D1 데이터베이스 `purunet_english_learning_db`를 APAC 리전에 생성했다. database_id는 `e0d4cb13-db16-4272-846b-6515ac3bc2ab`이다.
- D1 스키마는 학습 증거, 포트폴리오, 성찰, 영단어 숙련도, 영문법 숙련도, 전체 진행 스냅샷을 저장하도록 구성한다. 클라이언트는 localStorage를 계속 오프라인 캐시로 쓰고, 운영 Pages 주소에서는 `/api/progress`로 서버 DB에 업서트한다.
- 검증 기준은 `npm run check`, `npm run db:migrate`, Cloudflare Pages production 배포, 운영 URL HTTP 200, `/api/progress` D1 저장·조회 확인이다.
- 구현 완료: `wrangler.toml`, `migrations/0001_english_learning.sql`, `functions/api/progress.js`, 영어 MVC의 Model·View·Controller, `package.json`, `README.md`를 갱신했다. 화면에는 `Cloudflare D1 서버 DB` 상태와 `서버 DB 저장` 버튼이 추가됐다.
- 검증 완료: `npm run check` 통과, `npm run db:migrate`로 remote D1에 12개 SQL 쿼리 적용, Pages 프로젝트 `purunet-english-ebook` 생성, production `main` 배포 완료. 새 preview URL은 `https://b7807dc4.purunet-english-ebook.pages.dev`이고 운영 URL은 `https://purunet-english-ebook.pages.dev`다.
- 운영 확인: `https://purunet-english-ebook.pages.dev/`는 HTTP 200이고 HTML title은 `강태훈 푸르넷 영어 MVC 학습 프로그램`이다. `/api/progress?learnerId=local-demo`는 D1 binding을 통해 HTTP 200으로 응답했고, POST smoke에서 학습 증거·포트폴리오·성찰·단어·문법·스냅샷 저장을 확인했다.

## Cloudflare Pages와 Windows 설치 파일 최신 낭독 코드 반영 (2026-05-19)
- 이번 요청은 새 기능 추가가 아니라 직전 낭독 수학 기호 읽기 보정본을 Cloudflare Pages 운영 배포와 Windows 설치 파일까지 반영하는 배포 작업이다.
- Cloudflare 배포 기준은 `app/`에서 검증과 빌드를 다시 통과시킨 뒤 `npm run pages:deploy`로 `prunet-math-ebook` production `main` 브랜치에 올리는 것이다.
- 설치 파일 기준은 `npm run installer:win`으로 `app/release`를 다시 만들고, 최신 `app/release` 기준으로 `app/release.zip`도 다시 압축하는 것이다.
- 검증은 로컬 `dist`와 설치본 `app.asar` 안에서 낭독 보정 코드 또는 대표 문자열을 확인하는 방식으로 마무리한다.
- `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile`을 통과했고 단일 HTML, 루트 HTML, 모바일 `study.html` 해시는 모두 같았다.
- Cloudflare Pages는 `npm run pages:deploy`로 재배포했고 배포 URL은 `https://c650d33a.prunet-math-ebook.pages.dev`다. 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200과 새 번들 참조를 확인했다.
- `npm run installer:win`으로 Windows 설치 파일을 다시 만들고 `app/release.zip`을 재압축했다. 설치 파일 SHA256은 `F0B04147B733AEDB15B23BD5610D8FB2674407EB82760D9A6A80CB19F72318D5`, `release.zip` SHA256은 `2B872966476CA464D4BD2A73BE93D78CC845E77B653D6630F6BE21704FC85187`이다.
- `dist`와 설치본 `app.asar`에서 `voiceschanged`, `문제 식은`, `더하기` 문자열을 확인해 최신 낭독 보정 코드가 배포 산출물 양쪽에 포함된 것을 검증했다.

## 낭독 음성 품질, 학습 화면 스크롤바, 클래스 삭제 접근 개선 (2026-05-19)
- 목표는 기존 학습 흐름을 유지하면서 낭독 음성을 더 자연스럽게 고르고, 오른쪽 학습 화면의 스크롤바 시각 노출을 줄이고, 클래스 등록 화면에서 삭제 동선을 바로 제공하는 것이다.
- 낭독은 무료 조건을 유지해야 하므로 외부 유료 TTS API를 붙이지 않고 브라우저 `speechSynthesis`에서 제공하는 한국어 자연/신경망 계열 음성을 우선 선택한다.
- 클래스 삭제는 이미 있는 `removeClassRecord`와 클래스 관리 삭제 흐름을 재사용해 DB 스키마를 바꾸지 않는다.
- 검증 기준은 `npm run lint`, `npm run verify`, `npm run onefile` 통과와 루트 단일 HTML, 모바일 `study.html`, 모바일 서비스워커 캐시 버전 갱신이다.
- 구현 결과 `AI 낭독` 버튼이 한국어 자연음 후보를 우선 선택하고, 페이지와 연습 화면 스크롤바가 4px 투명 계열로 정리되었다.
- 클래스 등록 화면의 `새 클래스` 옆에 `클래스 삭제` 버튼을 추가했고, 저장된 클래스 칩에는 클래스 등록 화면에서 바로 쓰는 `삭제` 버튼을 붙였다.
- `npm run lint`, `npm run verify`, `npm run onefile`을 모두 통과했고 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 복사했다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v74`로 올렸다.

## 낭독 수학 기호 읽기 보정 (2026-05-19)
- 문제 원인은 음성 모델 선택만이 아니라 `+`, `-`, `×`, `÷`, `/`, `=` 같은 수식 기호가 원문 그대로 TTS에 전달되는 것이다.
- 무료 조건은 유지하되, 유료 외부 TTS API를 붙이지 않고 브라우저 자연음 후보를 계속 사용한다.
- 해결 방향은 낭독 전용 문자열에서 사칙연산, 등호, 비교, 분수, 빈칸 기호를 한국어 문장으로 변환한 뒤 `SpeechSynthesisUtterance`에 전달하는 것이다.
- 검증 기준은 `npm run lint`, `npm run verify`, `npm run onefile` 통과와 단일 HTML, 모바일 `study.html`, 서비스워커 캐시 버전 갱신이다.
- 구현 결과 `3 + 4`, `36 ÷ 12 × 13`, `3/5`, `□` 같은 낭독 원문을 `더하기`, `나누기`, `곱하기`, `5분의 3`, `빈칸`처럼 읽도록 바꿨다.
- `speechSynthesis.getVoices()`가 처음에 빈 배열을 반환하는 브라우저를 위해 `voiceschanged`를 최대 450ms 기다린 뒤 자연음 후보를 고르게 했다.
- `npm run lint`, `npm run verify`, `npm run onefile`을 통과했고 단일 HTML을 루트와 모바일 `study.html`에 복사했다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v75`로 올렸다.

## 무엇을 만드는가
업로드한 PDF(푸르넷수학 5학년 3월 플러스북 해답)의 학습 내용을 바탕으로
한 인터랙티브 수학 연습 웹앱. 현대적 전자북 스타일.

## 사용자 선택 (질문 응답)
- 결과물: **React 웹앱 프로젝트** (Vite + React + TypeScript)
- 콘텐츠 범위: **두 단원 핵심 + 샘플** — 1단원(자연수의 혼합 계산),
  2단원(약수와 배수)의 대표 유형을 자동 생성형으로 구현
- 핵심 기능: **자동 채점 + 즉시 피드백**

## 설계 결정
- **자동 생성형 문제**: PDF의 고정 문항을 그대로 옮기지 않고, 같은 유형의
  문제를 난수로 생성. "비슷한 내용으로 수정" 요구에 부합하며 무한 연습 가능.
- **정수 보장**: 워크북은 자연수 범위. 나눗셈은 항상 나누어떨어지도록,
  중간/최종값이 음수가 되지 않도록 거부 표본추출(retry) + 안전 폴백.
- **연산 순서 평가기**: 사칙연산 혼합은 구조화된 식 템플릿 + 정수 평가기로
  연산 순서를 검증해 정답을 산출(직접 파싱 대신 템플릿 기반이라 안전).
- **즉시 피드백 우선**: 오답 시 정답 + 한 줄 풀이 표시. 단계별 애니메이션
  해설/진도 저장은 사용자가 선택하지 않아 범위에서 제외(단순성 우선).
- **세션 점수**: 정답/전체 카운트만. 새로고침 시 초기화(저장 미선택).
- **의존성 최소화**: Vite/React/TS 외 추가 라이브러리 없음. 애니메이션은
  CSS 전환/키프레임으로 처리.
- **디자인 톤**: 원본 책 색감(민트·코랄)을 계승한 현대적 전자북 UI.
  Pretendard 웹폰트, 글래스/그라데이션 카드, 반응형.

## 폴더
- 프로젝트 루트: `app/` (한글/공백 경로 회피 위해 ASCII 하위폴더)

## 원클릭 실행 (추가 요청)
- Vite 일반 빌드는 JS가 별도 모듈 파일이라 `file://` 더블클릭 시
  브라우저의 모듈 CORS 정책으로 빈 화면 → **모든 자산을 인라인한
  단일 HTML**로 합쳐 해결 (`app/scripts/bundle-singlefile.mjs`,
  `npm run onefile`). 결과: 루트의 `푸르넷수학-연습.html`.
- 바탕화면에 `푸르넷수학 연습.lnk` 바로가기 생성 → 더블클릭으로 실행.
- Pretendard 폰트는 CDN 링크 유지(온라인 시 적용, 오프라인 시 시스템
  한글 폰트로 자동 대체) — 글꼴 파일까지 인라인하지는 않음.
- **버그/학습**: `String.replace(s, 치환문자열)`은 치환문자열의
  `` $` ``·`$&`·`$'`가 특수 패턴으로 해석됨. 압축 JS를 인라인할 때
  head가 23번 복제되는 원인이었음 → 치환을 **함수 콜백**(`() => ...`)으로
  바꿔 해결. 압축 코드 삽입 시 항상 함수 치환을 쓸 것.

## 4·5월 단원 추가 (2026-05-17)
- 사용자 선택: **기존과 동일한 자동 생성형**, **3·4·5단원 모두**.
- 4월 = 3단원(대응 관계) + 4단원(약분과 통분), 5월 = 5단원(분수의
  덧셈과 뺄셈). 단원별 대표 5유형씩 난수 생성.
- **분수 채점 인프라 신설**: 기존 채점기는 정수/수의 집합만 지원 →
  `frac.ts`(분수 파싱·약분·통분·대분수)와 답 종류
  `fraction`/`fractionPair`/`compare` 추가. 값(교차곱) 동치로 채점하되,
  - 기약분수 유형은 `requireReduced`로 기약형만 정답,
  - 크기가 같은 분수 유형은 `requireDenominator`로 분모 강제,
  - 통분 유형은 `commonDenominator`(=두 분모 최소공배수)로 분모 강제.
  → "약분/통분을 실제로 수행"하는 학습 의도를 채점에 반영.
- 표시/값 분리: `answerText`(선택)로 오답 시 보여줄 표기를 풀이와 일치.
- **3단원 검증 가능성**: 대응 관계는 문장형이라 식 평가가 어려움 →
  풀이를 항상 `식: a × b = r` 형식으로 끝내고 verify가 이 줄을 파싱·평가.
  (학생 풀이에도 대응 관계 식을 보여주어 교재 의도와도 부합.)
- verify.mjs는 앱 코드를 import하지 않고 **독립 분수 구현**으로 교차검증
  (기존 철학 유지). 단원 prefix(topicId)로 분기.

## CLAUDE.md 작업 기준 적용 (2026-05-17)
- 루트 `CLAUDE.md`를 현재 프로젝트의 공통 작업 기준으로 유지한다.
- Codex가 바로 인식할 수 있도록 루트 `AGENTS.md`를 추가해 `CLAUDE.md` 참조를 명시했다.
- 새 프로젝트에는 `scripts/apply-claude-standard.ps1`로 `CLAUDE.md`, `AGENTS.md`, 기본 `checklist.md`, 기본 `context-notes.md`를 적용한다.
- 이 폴더는 Git 저장소가 아니므로 의미 단위 커밋 규칙은 현재 변경에는 적용하지 못했다. 대신 변경 파일과 검증 결과를 보고에 남긴다.

## 6학년 3월~다음 해 2월 과정 추가 (2026-05-17)
- 업로드된 6학년 PDF 12종을 월별로 대조해 3월 분수의 나눗셈부터 다음 해 2월 일차방정식 준비까지 흐름을 잡았다.
- 6학년 학습자가 적용되면 6학년 단원만 보이도록 기존 4학년/5학년 필터에 `6학년` 분기를 추가했다.
- 첫 실행 화면은 기본 학습자를 `6학년`으로 잡고, 모바일 첫 페이지에는 4·5·6학년 바로 시작 버튼을 둔다.
- `study.html?grade=6`처럼 URL로 들어온 학년값을 읽어 처음 열 때 해당 학년 과정으로 바로 진입하도록 했다.
- 준비 학년 표기는 별도 과정으로 두지 않고 4학년 1~2월 학습으로 표시한다. URL의 `grade=pre5`나 직접 입력한 준비 학년 값도 4학년으로 정규화한다.
- 문제는 PDF 원문을 그대로 복제하지 않고 같은 학습 목표의 자동 생성형으로 구성했다. 월별 6개 세부 체계, 전체 72개 유형을 등록했다.
- 그래프·공간·원 단원은 앱의 수학 렌더링 정책에 맞춰 텍스트 계산식과 벡터 기반 보조 표시가 결합될 수 있도록 topicId를 분리했다.
- 배포 기준은 `npm run lint`, `npm run verify`, `npm run onefile` 통과 후 단일 HTML을 루트와 모바일 전용 폴더에 동기화하는 방식으로 유지한다.

## 6학년 시각 자료 고도화 (2026-05-17)
- 6학년 PDF를 다시 확인해 3월·7월·9월 분수 막대, 5월·8월 비율 띠, 6월 원그래프, 10월 쌓기나무, 11월 원 도형을 앱 문제에 직접 연결했다.
- `MathVisual`에 `fraction-strip`, `ratio-strip`, `circle-chart`, `circle-diagram`을 추가해 외부 이미지 없이 SVG 벡터로 렌더링한다.
- 6학년 생성기는 숫자만 내보내지 않고, 해당 단원에서 필요한 보조 도형을 `visual` 필드로 함께 반환하도록 보강했다.

## 학습 단계·문제 수준 필터 (2026-05-17)
- 학년 아래에 `초급/중급/고급` 학습 단계 메뉴와 `기초연산/개념/유형/고난이도` 문제 수준 메뉴를 추가했다.
- 현재까지 작성한 4·5·6학년 PDF 기반 문제는 모두 기본 `초급`으로 지정한다. 중급·고급은 이후 자료가 들어오면 같은 메타데이터로 분리된다.
- 문제 수준은 topicId, 제목, 설명의 키워드를 바탕으로 자동 분류한다. 명시 메타데이터가 있으면 `Topic.learningArea`를 우선하고, 없으면 기초연산/개념/유형/고난이도 중 하나로 판정한다.
- 선택한 단계·문제 수준은 localStorage에 저장되어 다음 학습 때도 유지된다.

## 6학년 연산 과정 추가 (2026-05-17)
- 업로드 폴더에서 6학년 수학연산 PDF는 3월, 4월, 5월, 6월, 8월, 9월, 10월, 12월, 1월, 2월 총 10종을 확인했다. 7월과 11월 PDF는 현재 폴더에 없어서 교과 흐름 보완 단원으로 구성했다.
- `6학년 연산`은 일반 6학년 과정과 분리된 학습자 선택값으로 둔다. URL은 `study.html?grade=6-op`를 사용한다.
- 12개월 각각 6개 세부 유형을 등록해 전체 72개 연산 유형을 구성했다. 기존 정책대로 세부 유형 하나당 10문제 학습 흐름을 유지한다.
- 생성기는 기존 6학년 수학 표현과 시각 자료를 재사용한다. 분수 나눗셈, 소수 나눗셈, 비율·백분율, 띠그래프·원그래프, 쌓기나무, 원주·원의 넓이, 소인수분해, 일차방정식 유형을 연산 과정에 연결했다.
- 모바일 첫 화면, 설치 매니페스트, 서비스워커 캐시 버전을 함께 갱신했다.
- 결과 보고서는 `6학년_수학연산_PDF_대조_추가_보고서(26.05.17).md`에 남겼다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile` 순서로 통과했고, 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 다시 복사했다.

## 6학년 수학연산 PDF 재대조와 시각 자료 보강 (2026-05-17)
- 6학년 수학연산 PDF를 다시 대조해 기존 6학년 연산 월별 배치가 실제 PDF 흐름과 다른 부분을 수정했다.
- 3월은 각기둥·각뿔과 전개도, 4월은 분수÷분수와 소수 나눗셈, 5월은 비율과 원주, 6월은 원의 넓이와 직육면체 겉넓이·부피로 재배치했다.
- 8월은 띠그래프·원그래프·정비례·반비례, 9월은 쌓기나무와 비례배분, 10월은 원기둥·원뿔·구와 원그래프로 재배치했다.
- 12월부터 다음 해 2월까지는 소인수분해, 정수 수직선, 정수 연산, 문자식, 등식, 방정식, 좌표평면, 함수 그래프 흐름을 반영했다.
- `MathVisual`에 `solid-shape`를 추가해 각기둥, 각뿔, 원기둥, 원뿔, 구를 외부 이미지 없이 SVG 벡터로 표시한다.
- 6학년 연산 72개 토픽의 생성기 연결을 확인했고 누락은 없었다.
- `npm run verify`에서 반비례 문장제의 후보 없음 난수 조합을 발견해 후보가 있는 조합만 생성하도록 고쳤다.
- `npm run lint`, `npm run verify`, `npm run onefile`을 통과했고 단일 HTML을 루트와 모바일 전용 `study.html`에 반영했다.

## 초기 실행화면 6학년 연산 보강 (2026-05-17)
- 새로 실행하는 기본 학습자 과정을 `6학년 연산`으로 변경했다.
- 모바일 홈페이지의 대표 시작 버튼과 빠른 학습 카드가 `study.html?grade=6-op`로 바로 진입하도록 변경했다.
- 모바일 연산 과정 그리드에서는 `6학년 연산`을 기본 강조 항목으로 표시한다.
- `npm run lint`, `npm run verify`, `npm run onefile` 통과 후 생성 HTML을 루트와 모바일 학습 파일에 반영하고 모바일 캐시를 v48로 갱신했다.

## Windows 설치 파일 배포 (2026-05-18)
- 요청 목표는 프로젝트를 Windows에서 설치 가능한 독립 실행 앱으로 만들고, 설치 후 바탕화면 바로가기에서 실행되게 하는 것이다.
- 기존 앱은 Vite React 웹앱이므로 Electron으로 `dist/index.html`을 감싸고, `electron-builder`의 NSIS 설치 프로그램을 사용한다.
- 설치 바로가기는 수동 스크립트 대신 NSIS 설정의 `createDesktopShortcut`, `createStartMenuShortcut`, `shortcutName`으로 처리한다.
- 생성 산출물은 `app/release/` 아래 Windows 설치 파일로 둔다.
- 현재 PC에 `C:\Program Files\nodejs`가 없어 `winget`으로 Node.js LTS 24.15.0과 npm 11.12.1을 설치한 뒤 작업했다.
- `winCodeSign` 압축 해제 중 심볼릭 링크 권한 오류가 발생해 `win.signAndEditExecutable=false`와 `CSC_IDENTITY_AUTO_DISCOVERY=false`를 적용했다. 앱 실행과 NSIS 설치 파일 생성에는 영향이 없고, 코드 서명만 하지 않는 구성이다.
- 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`로 생성되었다. 설치하면 바탕화면과 시작 메뉴에 `푸르넷수학 전자북` 바로가기가 생성된다.
- 검증은 `npm run installer:win`, `npm run lint`, `npm run verify`, `npm run onefile`을 통과했다.

## 1학년 문제 정답 숨김 (2026-05-18)
- 요청 목표는 1학년 과정에서 문제와 함께 노출되는 정답을 학생 풀이 화면에서 숨기는 것이다.
- 채점 로직과 오답 피드백에서 쓰는 정답 데이터는 유지하고, 문제 본문이나 보조 시각 자료에 섞여 보이는 정답만 제거하는 방향으로 확인한다.
- 수정 후 프로젝트 기본 검증인 `npm run lint`, `npm run verify`, `npm run onefile`을 실행하고 단일 HTML 산출물을 루트와 모바일 파일에 반영한다.
- 원인은 1학년 생성기 일부가 `object-array`, `ten-frame`, 자리값 블록, 계산 결과 막대그래프에 정답 숫자 라벨을 함께 넣는 구조였다.
- `GENERATORS` 반환 직후 1학년 문제만 후처리해 시각 자료의 정답 숫자 라벨을 끄고, 채점용 `answer`와 오답 피드백용 표시 값은 유지한다.
- `verify.mjs`에는 1학년 시각 자료가 다시 정답 숫자 라벨을 켜면 실패하는 회귀 검증을 추가했다.
- 새 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영하고, 모바일 캐시 버전을 `v49`로 올렸다.

## 1학년 정답 숨김 설치 파일 반영 (2026-05-18)
- 기존 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`는 2026-05-18 오후 2시 산출물이라 이번 수정이 들어가지 않은 상태였다.
- `npm run installer:win`으로 Electron/NSIS 설치 파일을 다시 생성해 현재 앱 코드가 설치본에 포함되도록 한다.
- 재생성 결과 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`는 2026-05-18 오후 9:48, 102,737,377바이트가 되었다.
- `app/release.zip`도 현재 `release` 폴더 기준으로 다시 압축해 2026-05-18 오후 9:48, 250,396,890바이트가 되었다.

## 선생님·클래스·학생 영구 등록과 진도 모니터링 (2026-05-18)
- 목표는 앱 내용 업데이트 후에도 학생별 풀이 기록, 오답 기록, 등록 정보가 유지되도록 데이터베이스를 확장하는 것이다.
- 기존 `learnerDb.ts`는 이미 `kang-taehoon-math-learner-db` IndexedDB와 localStorage 대체 저장을 사용한다. 이번 수정은 DB 버전을 올려 저장소와 인덱스만 추가하고, 기존 `attempts` 기록은 삭제하지 않는다.
- 선생님, 클래스, 학생 등록 정보는 콘텐츠 DB와 분리해 학습 기록 DB에 저장한다. 학생의 실제 학습자 ID는 기존 `readerPrefs` 학습자 ID 규칙을 재사용해 기존 단원별 통계와 연결한다.
- 상단 메뉴바는 등록 진입점을 빠르게 노출하는 용도이고, 실제 모니터링은 클래스 보드에서 담당 선생님, 학생별 진도, 코칭 문구, 진도맵을 한 번에 확인하도록 구성한다.
- `learnerDb.ts`의 DB 버전을 2로 올리고 `teachers`, `classes`, `students`, `settings` 저장소를 추가했다. 업그레이드는 저장소와 인덱스 추가만 수행하므로 기존 풀이 기록은 유지된다.
- 풀이 기록에는 `teacherId`, `teacherName`, `classId`, `className`을 함께 저장한다. 예전 기록은 학생의 `learnerId`로 다시 읽기 때문에 등록 이후에도 같은 학생의 기존 진도와 오답 기록을 클래스 보드에서 볼 수 있다.
- 선생님 이름을 바꾸면 이미 연결된 클래스와 학생 레코드의 선생님 이름도 같이 갱신한다. 클래스 이름이나 담당 선생님을 바꾸면 해당 클래스 학생의 클래스명과 담당 선생님도 같이 맞춘다.
- 상단에 `선생님 이름 등록`, `클래스 등록`, `학생 등록` 메뉴바를 추가했고, 등록된 선생님 이름은 메인 제목과 브라우저 제목, 학습 화면 라벨에 반영된다.
- 클래스 모니터링 패널은 등록 학생 수, 클래스 누적 풀이, 평균 정답률, 코칭 필요 학생 수를 보여주고 학생별 정답률, 오답률, 진도맵, 다음 추천 학습을 표시한다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`을 통과했다. 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영하고 모바일 캐시를 `v50`으로 올렸다.

## 교사용·학생용 로그인 분리와 계정 관리 (2026-05-18)
- 목표는 교사용 관리 모드와 학생용 학습 모드를 분리하고, 교사용 아이디/비밀번호와 학생용 아이디/비밀번호를 별도 데이터베이스 저장소로 관리하는 것이다.
- 기존 학생 풀이 기록은 그대로 유지해야 하므로 `attempts`, `teachers`, `classes`, `students` 저장소를 삭제하거나 재작성하지 않고, 계정 저장소만 추가하는 IndexedDB 업그레이드로 처리한다.
- 로컬 전자북 구조라 서버 인증은 없다. 비밀번호는 평문 저장을 피하고 브라우저 Web Crypto SHA-256 해시를 우선 사용하며, Web Crypto가 없는 실행 환경에서는 로컬 해시 대체값을 저장한다.
- 회원가입은 상단 메뉴에서 역할을 고르게 하고 약관 동의 후 생성한다. 교사용 가입은 선생님 레코드와 연결하고, 학생용 가입은 선택한 클래스의 학생 레코드와 연결한다.
- `learnerDb.ts`의 DB 버전을 3으로 올리고 `teacherAccounts`, `studentAccounts` 저장소를 추가했다. 기존 학습 기록과 등록 정보 저장소는 유지한다.
- 교사용 로그인은 `teacherAccountId`, 학생용 로그인은 `studentAccountId`로 `settings`에 따로 저장한다. 학생용 로그인은 연결된 학생 레코드를 활성 학습자로 전환한다.
- 상단 메뉴바는 `교사용 로그인`, `학생용 로그인`, `회원가입/약관`, `선생님 이름 등록`, `클래스 등록`, `학생 등록`으로 확장했다.
- 학생용 로그인이 없으면 학습 시작 함수가 학생 로그인 메뉴로 돌려보내고 학습을 시작하지 않는다. 교사용 로그인이 없으면 선생님/클래스/학생 관리와 클래스 모니터링은 잠금 안내를 표시한다.
- 회원가입 패널에는 역할 선택, 아이디, 비밀번호, 비밀번호 확인, 이름, 학생 클래스/학년, 약관 보기, 약관 동의 체크를 넣었다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`을 통과했다. 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영하고 모바일 캐시를 `v51`로 올렸다.

## 교사용·학생용 로그인 분리 설치 파일 반영 (2026-05-18)
- 요청 목표는 교사용·학생용 로그인 분리와 회원가입/약관 UI가 Windows 설치 파일에도 들어가도록 `app/release` 산출물을 다시 만드는 것이다.
- 기존 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`는 2026-05-18 오후 9:48 산출물이므로 오후 10:32 이후 반영된 로그인 분리 변경이 들어가지 않은 상태다.
- `npm run installer:win`으로 Electron/NSIS 설치 파일을 다시 생성하고, `app/release.zip`도 현재 `release` 폴더 기준으로 다시 압축한다.
- 재생성 결과 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`는 2026-05-18 오후 10:38, 102,744,107바이트가 되었다.
- `app/release/푸르넷수학 전자북-설치-1.0.0.exe.blockmap`은 2026-05-18 오후 10:38, 106,548바이트가 되었다.
- `app/release.zip`은 현재 `release` 폴더 기준으로 다시 압축해 2026-05-18 오후 10:39, 250,411,663바이트가 되었다.
- `app/dist/assets/index-mFZOYMcP.js`에서 `교사용 로그인`, `학생용 로그인`, `회원가입/약관`, `teacherAccounts`, `studentAccounts` 문구가 확인되었고, `app/release/win-unpacked/resources/app.asar`에 같은 `dist` 빌드 파일이 포함되어 있다.

## 학생 등록 옆 클래스 관리 (2026-05-18)
- 요청 목표는 상단 등록 메뉴에서 `학생 등록` 옆에 `클래스 관리` 버튼을 노출하고, 등록된 클래스를 별도 패널에서 바로 관리할 수 있게 하는 것이다.
- 기존에는 `클래스 등록` 폼과 하단 클래스 칩 선택만 있었으므로, 새 패널은 저장소를 새로 만들지 않고 기존 `classes`, `students`, `settings` 데이터와 `registerClassRecord`, `selectLearningRosterClass` 흐름을 재사용한다.
- 클래스 관리는 교사용 관리 기능이므로 교사용 로그인이 없을 때는 로그인 안내를 보여주고, 로그인 후에는 클래스별 학생 수와 담당 선생님을 확인하면서 선택, 수정, 학생 추가로 이동할 수 있게 한다.
- 상단 메뉴 순서는 `학생 등록` 다음에 `클래스 관리`가 오도록 확장했다. 클래스 관리 카드의 `선택`은 현재 클래스 전환, `수정`은 기존 클래스 등록 폼에 해당 클래스 값을 채워 이동, `학생 추가`는 학생 등록 폼에 해당 클래스와 학년을 채워 이동한다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile` 순서로 통과했다. 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영하고 모바일 캐시 버전을 `v52`로 올렸다.

## 클래스 관리 설치 파일 반영 (2026-05-18)
- 요청 목표는 `학생 등록` 옆 `클래스 관리` 버튼과 관리 로직이 Windows 설치 파일에도 포함되도록 `app/release` 산출물을 다시 만드는 것이다.
- 기존 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`는 2026-05-18 오후 10:38 산출물이므로 오후 10:51 이후 반영된 클래스 관리 변경이 들어가지 않은 상태였다.
- `npm run installer:win`으로 Electron/NSIS 설치 파일을 다시 생성하고, `app/release.zip`도 현재 `release` 폴더 기준으로 다시 압축했다.
- 재생성 결과 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`는 2026-05-18 오후 10:55, 102,742,731바이트가 되었다.
- `app/release/푸르넷수학 전자북-설치-1.0.0.exe.blockmap`은 2026-05-18 오후 10:55, 106,591바이트가 되었다.
- `app/release.zip`은 현재 `release` 폴더 기준으로 다시 압축해 2026-05-18 오후 10:55, 250,411,556바이트가 되었다.
- `app/dist`와 `app/release/win-unpacked/resources/app.asar`에서 `클래스 관리`, `classManage`, `class-management` 문구가 확인되어 설치본에 새 UI가 포함된 것을 확인했다.

## Cloudflare Pages 서버 운영 최적화 (2026-05-18)
- 요청 목표는 현재 전자북을 별도 Node 서버 없이 Cloudflare Pages 정적 호스팅 기준으로 운영하기 쉽게 만드는 것이다.
- 공식 문서 기준으로 Pages는 빌드 출력 디렉터리를 정적 자산으로 서빙하고, `_headers` 파일은 빌드 산출물 안에 있을 때 정적 응답 헤더로 적용된다.
- 현재 앱은 Vite React 정적 앱이므로 서버 코드를 만들지 않고 `app/dist`를 Pages 출력물로 고정하는 방식이 가장 작다.
- `wrangler.toml`은 현재 폴더를 프로젝트 루트로 보는 직접 배포와 CI 배포에서 `app/dist`를 사용하도록 루트에 둔다.
- Cloudflare Pages v3 빌드 이미지의 기본 Node.js는 `22.16.0`이고 현재 Vite 8 엔진 조건도 `^20.19.0 || >=22.12.0`이므로, 루트와 `app`에 `.node-version`을 두어 빌드 재현성을 맞춘다.
- `app/public/_headers`는 Vite 빌드 때 `dist/_headers`로 복사된다. 해시가 붙는 `/assets/*`는 1년 immutable 캐시를 주고, `/`와 `/*.html`은 즉시 재검증하도록 하여 새 배포가 오래 묶이지 않게 한다.
- CSP는 현재 React 컴포넌트가 인라인 style 속성을 여러 곳에서 쓰고 외부 Pretendard CSS를 로드하므로, 이번 작업에서는 기능을 깨지 않는 보안 헤더만 적용했다.
- Cloudflare Pages 프로젝트 루트가 현재 폴더라면 빌드 명령은 `cd app && npm ci && npm run pages:build`, 출력 디렉터리는 `app/dist`다. 프로젝트 루트가 `app`이라면 빌드 명령은 `npm ci && npm run pages:build`, 출력 디렉터리는 `dist`다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile` 순서로 통과했다. `onefile`의 Vite 빌드에서 500kB 초과 청크 경고는 기존 단일 번들 크기 경고이며 빌드 실패는 아니다.
- 빌드 후 `app/dist/_headers`가 생성되어 Pages 산출물에 캐시와 보안 헤더 정책이 포함되는 것을 확인했다.
- 단일 HTML 산출물 `CODEX 수학 익힘북 전자북(26.05.17)/CODEX-수학-익힘북-전자북.html`, `푸르넷수학-연습.html`, `모바일 홈페이지형 전자북(26.05.17)/study.html`의 SHA256이 모두 `9C25EA7D105ADED1B34EDB993267E5B4D76ADEE9F3F3D427B654E1AC08E760DA`로 같아서 별도 복사 갱신은 필요하지 않았다.

## Cloudflare Pages 서버 등록과 첫 배포 (2026-05-18)
- Wrangler OAuth 로그인을 완료했고, Cloudflare Pages 프로젝트 `prunet-math-ebook`을 생성했다.
- 프로젝트는 Git 연결 없이 직접 업로드 방식으로 등록되었고, 도메인은 `prunet-math-ebook.pages.dev`다.
- `npm run pages:build`로 `app/dist`를 다시 생성한 뒤 `npx wrangler pages deploy dist --project-name prunet-math-ebook --branch main`으로 production 배포했다.
- 실제 배포 명령과 맞추기 위해 `npm run pages:deploy`도 `--branch main`을 포함하도록 갱신했다.
- 첫 배포 ID는 `7cbad7e8-2665-44b9-a9c4-ddb53ea59bf2`이고, Wrangler가 반환한 배포 URL은 `https://7cbad7e8.prunet-math-ebook.pages.dev`다.
- 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200으로 응답했고 HTML title은 `강태훈샘 수학 익힘책`으로 확인했다.
- `https://prunet-math-ebook.pages.dev/`의 `Cache-Control`은 `public, max-age=0, must-revalidate`로 확인했다.
- `https://prunet-math-ebook.pages.dev/assets/index-BhqB9KXi.js`의 `Cache-Control`은 `public, max-age=31536000, immutable`로 확인했다.
- Windows Schannel에서 버전별 배포 URL HEAD 요청은 TLS 오류가 났지만, production Pages URL과 asset URL은 정상 응답했다.

## 학습 DB·회원가입·클래스·학생 관리 점검 (2026-05-18)
- 요청 목표는 학습용 IndexedDB/localStorage 저장 경로가 실제 화면 흐름에서 동작하는지, 회원가입과 클래스 관리, 학생 관리가 깨지지 않는지 확인하는 것이다.
- 점검 범위는 교사용 회원가입, 교사용 로그인 상태, 클래스 등록, 클래스 관리의 선택·수정·학생 추가 이동, 학생 등록, 학생용 회원가입, 학생용 로그인, 학습 기록 저장이다.
- Browser Use 플러그인 지침을 확인했지만 현재 세션에 Node REPL 브라우저 제어 도구가 노출되지 않아, 로컬 Vite 서버와 Playwright 기반 스모크 테스트로 대체한다.

## 관리자 로그인과 전체 학습 데이터 모니터링 (2026-05-18)
- 요청 목표는 교사용 로그인 왼쪽에 관리자 로그인을 추가하고, 교사용은 전체 학생 진도 모니터링, 관리자는 교사·학생·계정·학습 기록 전체 조회와 백업이 가능하도록 만드는 것이다.
- 기존 계정 구조는 `teacherAccounts`, `studentAccounts`가 비밀번호 평문이 아닌 해시를 저장한다. 새 관리자 기능도 평문 비밀번호를 저장하지 않고 `adminAccounts` 저장소에 `passwordHash`만 저장한다.
- IndexedDB 버전은 기존 학습 시도와 교사·클래스·학생 데이터를 지우지 않는 업그레이드로 올리고, localStorage fallback에도 관리자 계정 배열을 추가한다.
- 교사용 모니터링은 기존 활성 클래스 기준 화면에서 전체 학생 기준 `loadAllLearningProgress()`로 바꾸고, 5초 주기로 갱신해 학생별 풀이 수, 정답률, 오답률, 코칭을 확인하도록 한다.
- 관리자 화면은 계정 해시 목록, 전체 학습자 진도, 최근 학습 데이터, 백업 JSON 복사와 파일 저장을 제공한다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db`, 마지막 `npm run lint` 순서로 통과했다.
- `npm run smoke:learning-db`는 관리자 계정 생성, `adminAccounts` 저장, 교사용 회원가입, 클래스 등록과 관리, 학생 등록, 학생용 회원가입과 로그인, 학습 기록 저장, 관리자 화면의 계정 해시와 최근 학습 데이터 표시를 확인한다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일의 SHA256은 `B3FD367DE898777997E4EA017E874C8FB90E40A89AE2A9E9A82C830BCE5B183E`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v53`으로 올렸다.
- Cloudflare Pages도 `npm run pages:deploy`로 production `main` 브랜치에 재배포했다. 배포 URL은 `https://68036e85.prunet-math-ebook.pages.dev`이고, 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200과 `Cache-Control: public, max-age=0, must-revalidate`로 확인했다.

## Google 관리자 인증과 교사용 학생 계정·진도 관리 (2026-05-19)
- 요청 목표는 관리자 모드를 Google 로그인 인증으로 전환하고, 관리자 허용 이메일을 지정하며, 교사용 로그인 상태에서 클래스·학생·학생 계정·학생 진도 수정까지 가능하도록 확장하는 것이다.
- Cloudflare Pages 정적 앱만으로는 Google ID 토큰 서명 검증을 서버에서 강제할 수 없으므로, 이번 구현은 Google Identity Services 프런트엔드 로그인 게이트와 Client ID·이메일·만료시간 확인을 적용한다. 운영 보안을 더 강하게 하려면 Cloudflare Worker에서 Google ID 토큰 검증을 추가해야 한다.
- 관리자 계정 저장소는 비밀번호 계정을 더 만들지 않고 Google 이메일, 표시 이름, Google subject, 토큰 audience와 만료 시각을 저장한다. 현재 관리자 로그인은 `purunetkangtaehun@gmail.com`의 이메일 확인이 된 Google 응답에서만 열린다.
- Google OAuth Client ID는 `VITE_GOOGLE_CLIENT_ID` 환경변수 또는 관리자 로그인 화면에서 저장한 로컬 설정을 사용한다. Cloudflare Pages 운영 환경에서는 빌드 변수로 넣는 방식이 가장 재현 가능하다.
- 교사용 학생 등록 폼은 학생 이름·학년·클래스에 더해 학생 로그인 아이디, 새 비밀번호, 비밀번호 확인, 수정 진도, 수정 정답 수를 입력할 수 있게 했다.
- 기존 학생 계정을 열어 진도만 수정할 때 새 비밀번호를 강제로 요구하지 않도록, 기존 아이디 유지와 계정 변경 요청을 분리했다.
- 학습자 모니터링 목록과 관리자 전체 진도 목록에 `계정·진도 수정` 버튼을 추가해 선택한 학생의 계정과 진도 수정 폼으로 바로 이동한다.
- 브라우저 스모크 테스트는 Google Identity Services를 테스트용으로 목 처리해 실제 OAuth 팝업 없이 관리자 Google 인증, 교사 회원가입, 클래스 관리, 학생 가입·로그인, 학습 기록, 학생 계정 비밀번호 변경, 학생 진도 override 저장을 검증하도록 갱신했다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 순서로 통과했다. `npm run onefile`과 Pages 빌드의 500kB 초과 청크 경고는 기존 단일 번들 크기 경고이며 빌드 실패는 아니다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일의 SHA256은 `867F7643D2129659BCEF21BFCC7171009475592F0E49422D448C2D67844F7D66`으로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v54`로 올렸다.
- Cloudflare Pages는 `npm run pages:deploy`로 production `main` 브랜치에 재배포했다. 배포 URL은 `https://bf3b24a4.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200, HTML 캐시 `public, max-age=0, must-revalidate`, asset 캐시 `public, max-age=31536000, immutable`로 확인했다.

## 접힘형 관리 메뉴 UI 최적화 (2026-05-19)
- 요청 목표는 관리자 로그인, 교사용 로그인, 학생용 로그인, 회원가입 약관, 선생님 이름 등록, 클래스 등록, 학생 등록, 클래스 관리 버튼과 입력 패널이 학습 콘텐츠 상단을 계속 차지하지 않게 하는 것이다.
- 기본 화면은 학습 콘텐츠 가독성을 우선해 상단에 `관리 메뉴`와 `오늘 학습`만 남긴다.
- `관리 메뉴`를 열었을 때만 로그인·회원가입·등록·관리 버튼과 선택한 입력 폼을 보여주고, 닫으면 입력 UI는 렌더링하지 않는다.
- 학생 로그인이 필요해 학습 시작을 막는 경우, 클래스·학생 관리에서 수정으로 이동하는 경우처럼 입력이 필요한 흐름은 관리 메뉴가 자동으로 열리도록 처리한다.
- 구현 결과 기본 홈 화면에서는 등록 메뉴바와 입력 패널이 렌더링되지 않고, 헤더 오른쪽의 `관리 메뉴` 버튼을 눌렀을 때 `registration-drawer` 안에 기존 메뉴와 폼이 표시된다.
- 브라우저 스모크 테스트는 첫 화면에서 `nav.registration-menu-bar`가 보이지 않는지 확인한 뒤, `관리 메뉴`를 열어 기존 Google 관리자 로그인, 교사용 회원가입, 클래스 관리, 학생 로그인, 학습 기록, 학생 계정·진도 수정 흐름을 검증한다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 순서로 통과했다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일의 SHA256은 `9CBECA52C0B28D723769B648F4E16ED90BFDAFE934477660AE5C16762D92BBFD`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v55`로 올렸다.
- Cloudflare Pages는 `npm run pages:deploy`로 production `main` 브랜치에 재배포했다. 배포 URL은 `https://f5f6da1c.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200, 새 asset `/assets/index-CioVF-Ua.js`, asset 캐시 `public, max-age=31536000, immutable`로 확인했다.

## 교사용 일일 학습 진단서와 학부모 상담일지 자동 생성 (2026-05-19)
- 요청 목표는 관리자 Google 이메일을 `purunetkangtaehun@gmail.com`으로 변경하고, 교사용 로그인 상태에서 학생별·날짜별 학습 진단서와 학부모 상담일지를 자동 생성하는 것이다.
- 리포트 기준은 ASCA의 데이터 기반 학교상담, CASEL의 SEL 5개 역량, IES 초등 수학 중재 가이드의 체계적 명시 지도 관점을 참고한다.
- 문구는 임상적 심리 진단이 아니라 학습 데이터 기반 교육 상담 참고 문서로 제한한다. 정서·동기 표현은 관찰 가능한 학습 행동과 가정 협력 제안으로만 작성한다.
- 기존 `ClassLearningProgressSnapshot`의 학생별 요약만으로는 날짜별 보고서를 만들 수 없으므로, 학생별 실제 풀이 기록 배열을 진행 데이터에 포함해 교사용 모니터링에서 날짜별로 묶는다.
- 구현 결과 교사용 학습자 모니터링에서 학생 카드별로 `날짜별 학습 진단서·학부모 상담일지` 접힘 영역이 표시되고, 날짜별 풀이 기록이 있는 학생은 학습 진단서와 학부모 상담일지가 자동 생성된다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 순서로 통과했다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일의 SHA256은 `232C5DE5B0FA7F5A39F35E72FCC83FD563279CB7500BAF8FC049FBC615E29EEE`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v56`으로 올렸다.
- Cloudflare Pages는 `npm run pages:deploy`로 production `main` 브랜치에 재배포했다. 배포 URL은 `https://d6f9da6e.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200, 새 asset `/assets/index-BJ-bbl9J.js`, asset 캐시 `public, max-age=31536000, immutable`로 확인했다.

## 학습 보고서 공유 버튼 제거와 관리자·교사용 상담 문서 패널 배치 (2026-05-19)
- 요청 목표는 학습 보고서 헤더의 텔레그램·카카오톡 전송 버튼을 제거하고, 관리자 또는 교사 로그인 상태에서 학습 보고서 아래에 학생별 학습 진단서와 학부모 상담서 화면을 보이게 하는 것이다.
- 보고서 복사 기능은 유지한다. 외부 메신저 직접 전송 상태와 함수는 제거해 UI와 개인정보 노출 가능성을 줄인다.
- 기존 교사용 학습자 모니터링 카드는 진도와 코칭 요약 중심으로 남기고, 긴 진단서·상담서 본문은 학습 보고서 아래의 별도 관리자·교사용 문서 패널로 모은다.
- 구현 결과 학습 보고서 헤더에는 `보고서 복사`만 남고, 관리자 또는 교사용 로그인 상태에서는 학습 보고서 바로 아래 `학생별 학습 진단서와 학부모 상담서` 패널이 표시된다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 순서로 통과했다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일의 SHA256은 `BB3C9EA64903293E5866064047D94927A90B3C31110E368375F33F5DAE6E24F6`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v57`로 올렸다.
- Cloudflare Pages는 `npm run pages:deploy`로 production `main` 브랜치에 재배포했다. 배포 URL은 `https://d913c00f.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200, 새 asset `/assets/index-DKXHMy54.js`, asset 캐시 `public, max-age=31536000, immutable`로 확인했다.
- 운영 asset에서 `manager-counsel-panel`과 `student-counsel-report` 클래스가 포함되고, `kakaotalk://`와 `https://t.me/share/url` 외부 전송 경로는 포함되지 않는 것을 확인했다.

## 모험 지도 STEM 스토리텔링 고도화 (2026-05-19)
- 요청 목표는 `모험 지도 > 스토리 단원 보기`를 1학년부터 6학년까지 현재 선택된 단원과 목차에 맞는 전문 스토리텔링 수학 이야기로 채우는 것이다.
- 구현 기준은 National Academies의 통합 STEM 관점, ISTE의 컴퓨팅 사고와 데이터·알고리즘·추상화 관점, OECD PISA 2025의 디지털 세계 문제해결과 자기조절 학습 관점을 참고한다.
- 콘텐츠는 외부 본문을 복사하지 않고, 현재 전자북 단원·목차 제목과 설명을 기반으로 단원별 이야기, 목차별 미션, STEM 설계 과제, 그래프·도표·수식·벡터 장면을 자동 생성한다.
- 기존 `CHAPTERS`는 5학년 중심 제목이 고정되어 있어 1~6학년 전체에는 맞지 않는다. 새 방식은 `contentUnits`를 받아 현재 학년·연산 과정의 모든 단원에 맞춰 스토리 챕터를 동적으로 만든다.
- 구현 결과 `app/src/lib/story.ts`에 `buildStemStoryChapters`를 추가해 현재 선택된 `contentUnits` 전체를 단원별 STEM 스토리 챕터로 변환한다. 각 챕터에는 단원 이야기, STEM 초점, 설계 과제, 데이터 질문, 핵심 수식, 목차별 미션이 포함된다.
- `app/src/App.tsx`의 모험 지도는 고정 `CHAPTERS` 대신 `stemStoryChapters`를 사용하며, 단원 카드를 열면 인라인 SVG 벡터 장면, 역량 분포 막대 도표, 탐구 난이도 선 그래프, 목차별 탐구 미션 버튼이 표시된다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 순서로 통과했다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일의 SHA256은 `3F0F194A37EFC15B261430BEC20AF9634523C0667512EBDFCE48B15276B82955`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v58`로 올렸다.
- Cloudflare Pages는 `npm run pages:deploy`로 production `main` 브랜치에 재배포했다. 배포 URL은 `https://ceea1a0c.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200, 새 asset `/assets/index-C-20szea.js`와 `/assets/index-2RUyZAMS.css`, asset 캐시 `public, max-age=31536000, immutable`로 확인했다.
- 운영 asset에서 `story-vector`, `story-chapter-card`, `story-topic-mission` 클래스가 포함되는 것을 확인했다.

## 학생용 로그인 학습자 이름 자동 반영과 개별 학습 선택 (2026-05-19)
- 요청 목표는 학생용 로그인 후 학습자 이름이 학생 등록 이름으로 자동 표시되고, 학생이 단원과 목차를 직접 골라 개별 학습을 시작할 수 있게 만드는 것이다.
- 기존 `applyStudentRecordToLearner`는 학생 레코드를 학습자 상태로 반영하지만, 로그인 직후에는 인증 계정의 `studentId`를 우선으로 확인하는 보강이 필요하다.
- 학생 모드에서는 이름·학년 입력을 계정 학생 정보로 고정하고, 학습 내용 선택 영역은 `학생 선택 학습`으로 명확히 표시해 단원·공부할 내용 드롭다운을 바로 사용할 수 있게 한다.
- 구현 완료: 학생용 로그인 계정의 `studentId`를 타입 가드로 확인한 뒤 해당 학생 레코드를 학습자 프로필에 우선 반영하고, 학생 모드에서는 학습자 이름·학년 입력과 학년 빠른 선택 버튼을 잠가 계정값이 유지되도록 했다.
- 구현 완료: 학생 로그인 상태의 학습 차례 UI를 `학생 선택 학습`으로 표시하고, 단원·목차 드롭다운에서 학생이 직접 선택한 목차를 `선택한 목차 학습` 버튼으로 시작할 수 있게 했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 통과. 스모크 결과의 `learnerName`은 등록 학생명 `점검 학생 mpbfacjq`로 확인됐다.
- 산출물 반영: 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 복사했고, 세 파일 SHA256은 `BD25146014F8A781E857951F9D129DCE55D9BC6C6AB7F950F7FF2B0F4C6E6D07`로 일치한다.
- 모바일 캐시: `모바일 홈페이지형 전자북(26.05.17)/sw.js`의 `CACHE_NAME`을 `codex-math-mobile-v59`로 갱신했다.
- Cloudflare Pages 배포: `npm run pages:deploy` 통과, 새 URL `https://e0401159.prunet-math-ebook.pages.dev` 응답 `200`, 새 번들 `index-TKy7bg9g.css`와 `index-DHvkym_Z.js` 참조 확인.

## 윈도우 설치 파일 반영 (2026-05-19)
- 요청 목표는 직전 학생용 로그인 이름 자동 반영과 개별 학습 선택 기능을 Windows 설치 파일에도 포함시키는 것이다.
- 현재 Windows 설치 파일은 `app/package.json`의 `installer:win` 스크립트가 `dist/**/*`, `electron/**/*`, `package.json`을 Electron Builder NSIS 패키지로 묶어 `app/release`에 생성하는 구조다.
- 기존 설치 산출물은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`, `app/release/푸르넷수학 전자북-설치-1.0.0.exe.blockmap`, `app/release/win-unpacked`로 확인됐다.
- 반영 완료: `npm run installer:win` 통과. 새 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`이며 크기는 `102752917` bytes, 수정 시각은 `2026-05-19 오전 1:38:15`다.
- 검증 완료: `app/release/win-unpacked/resources/app.asar` 안에 최신 번들 `dist/assets/index-TKy7bg9g.css`, `dist/assets/index-DHvkym_Z.js`, `dist/index.html`, `electron/main.cjs`가 포함되어 있다.
- 기능 포함 확인: `app.asar` 내부 CSS/JS에서 `student-study-selector`, `input[readonly]`, `learner-name` 문자열을 확인해 학생용 개별 학습 선택 UI와 학습자 이름 자동 반영 경로가 설치 패키지에도 들어간 것을 검증했다.
- SHA256: 설치 EXE `DA4106F93451BBE64C8984DE050AF0D39C7FBFB2B23BE04F1F2D31DFEAACAC0D`, blockmap `F13341BD655B329819CDA885AD9BB3806917DEE4E5955659DE4BCB7B8DCFC0C4`, app.asar `E3409C0F8F2F8C9DD54FFD6C68E56550776A85F52447190A65A1E9A21C00213D`.
- 참고: Electron Builder 출력에서 별도 앱 아이콘 파일이 없어 기본 Electron 아이콘이 사용된다는 경고가 있었으나, NSIS 설치 파일 생성은 정상 완료됐다.

## 교사용 로그인 학습 진행 허용 (2026-05-19)
- 요청 목표는 교사용 계정으로 로그인한 상태에서도 오늘 학습, 선택 단원, 선택 목차, 전체 학습 등 모든 학습 시작 버튼을 바로 진행할 수 있게 하는 것이다.
- 원인은 `App.tsx`의 공통 `start()` 함수가 학생용 로그인만 학습 시작 권한으로 인정해, 교사용 로그인 상태에서도 학생용 로그인 화면으로 되돌리는 조건이었다.
- 학습 기록 저장 구조와 학생 계정 자동 적용 로직은 건드리지 않는다. 교사가 학습을 시작하면 현재 선택된 학습자 프로필과 활성 클래스 기준으로 기존 기록 저장 경로를 그대로 사용한다.
- 구현 방향은 공통 권한값 `canStartLearning`을 두고 학생용 로그인 또는 교사용 로그인 중 하나가 있으면 `start()`가 학습 화면으로 진입하도록 하는 것이다.
- 미로그인 상태의 안내 문구는 학생용 또는 교사용 아이디로 로그인하라는 문구로 맞췄다.
- `npm run onefile` 첫 실행은 `app/index.html`이 이전 빌드 산출물 `./assets/index-DHvkym_Z.js`를 직접 참조하고 있어 실패했다. 원본 Vite 엔트리인 `/src/main.tsx` 스크립트로 복구한 뒤 재검증했다.
- 검증은 `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 순서로 통과했다. 스모크 결과는 교사 계정 1개, 학생 계정 1개, 풀이 기록 1개, `learnerName` `점검 학생 mpbg8fth`로 확인됐다.
- 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일 SHA256은 `1146D9FE00EBC750D1D4AE61FA8AD2C2914ED6AF8802F75A2BE11673CA15E77E`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v60`으로 올렸다.

## 교사용 로그인 학습 진행 허용 설치 파일 반영 (2026-05-19)
- 요청 목표는 교사용 로그인으로 모든 학습 내용을 진행할 수 있게 한 최신 앱 코드를 Windows 설치 파일에도 포함하는 것이다.
- 기존 설치 파일은 `app/package.json`의 `installer:win` 스크립트가 `dist/**/*`, `electron/**/*`, `package.json`을 Electron Builder NSIS 패키지로 묶어 `app/release`에 생성하는 구조다.
- 반영 완료: `npm run installer:win` 통과. 새 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`이며 크기는 `102752984` bytes, 수정 시각은 `2026-05-19 오전 2:02:33`이다.
- 새 blockmap은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe.blockmap`이며 크기는 `106541` bytes, 수정 시각은 `2026-05-19 오전 2:02:35`이다.
- 검증 완료: `app/release/win-unpacked/resources/app.asar` 내부 목록에 `\dist\index.html`, `\dist\assets\index-B1eUpA_g.js`, `\dist\assets\index-TKy7bg9g.css`, `\electron\main.cjs`가 포함되어 있다.
- 기능 포함 확인: `app.asar`를 임시 폴더에 풀어 확인한 결과 `dist/index.html`은 `index-B1eUpA_g.js`와 `index-TKy7bg9g.css`를 참조하고, 번들 JS에는 학습 시작 권한 조건이 `Ge=Re||Le`로 들어가 학생 로그인 또는 교사용 로그인을 허용한다.
- SHA256: 설치 EXE `C26953D881C20C8656E667C80B9399C3F3B41EE530FEC764E139C4D158491EB9`, blockmap `0F7C7932D3FB9B2EA15BD7D6723ABAB50881D02CE038D56C807691844EAF5EFF`, app.asar `360F6C5CED9B444F92C805800DF75C8DD3AD9B2AA2D1D094E83B2FDB3EF2B7F3`.
- 참고: Electron Builder 출력에서 별도 앱 아이콘 파일이 없어 기본 Electron 아이콘이 사용된다는 경고와 큰 번들 크기 경고가 있었으나, NSIS 설치 파일 생성과 내부 번들 검증은 정상 완료됐다.

## 교사용 계정 전체 학습 데이터 접근 보강 (2026-05-19)
- 요청 목표는 교사용 아이디로만 로그인한 상태에서도 모든 학생용 학습 데이터에 접근하고, 모든 학습 콘텐츠를 바로 실행할 수 있게 하는 것이다.
- 현재 학습 시작 권한은 이미 교사용 로그인을 허용하지만, 최근 학습 기록과 전체 원시 데이터 스냅샷은 관리자 로그인일 때만 갱신되어 교사용 단독 로그인 상태에서는 데이터 접근이 비어 보일 수 있다.
- 구현 기준은 관리자 Google 계정 권한을 교사용 계정에 넘기는 것이 아니라, 교사용 계정도 학생·클래스·학습 기록 조회용 스냅샷과 전체 진도 스냅샷을 읽게 하는 것이다.
- 검증 기준은 스모크 테스트에서 학생 풀이 기록 생성 후 학생과 관리자를 모두 로그아웃하고, 교사용 아이디만 로그인한 상태로 학생별 진도, 최근 학습 데이터, 선택 학습 시작을 확인하는 것이다.
- 구현 완료: `canViewAllStudentLearningData` 권한값을 추가해 교사용 또는 관리자 로그인 상태에서 전체 학생 진도와 학습 기록 스냅샷을 갱신하도록 했다.
- 구현 완료: 하단 학습자 모니터링 패널에 `최근 학습 데이터` 표를 추가해 교사용 로그인만으로도 학생명, 클래스, 단원, 정오답, 일시를 바로 볼 수 있게 했다.
- 스모크 테스트 보강: 학생 풀이 기록 생성 후 학생용, 관리자, 교사용 세션을 모두 로그아웃하고 교사용 아이디로 다시 로그인해 `교사용 전체`, `최근 학습 데이터`, 학생명, 클래스명, 선택 학습 시작을 검증하도록 했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile` 통과. 스모크 결과는 교사 계정 1개, 학생 계정 1개, 풀이 기록 1개, `learnerName` `점검 학생 mpbocxyb`, `className` `점검 6학년반 mpbocxyb`로 확인됐다.
- 산출물 반영: 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일 SHA256은 `4102940375CF59B87798AFE5CA10FFAABB0D1F78BAC6631CED8190DD9CE60A1F`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v61`로 올렸다.
- Cloudflare Pages 배포: `npm run pages:deploy` 통과, 새 배포 URL은 `https://c4c31db9.prunet-math-ebook.pages.dev`이다. 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200, HTML 캐시 `public, max-age=0, must-revalidate`, asset 캐시 `public, max-age=31536000, immutable`로 확인했다.
- 운영 HTML은 새 번들 `index-B_W3Bx7I.js`와 `index-TKy7bg9g.css`를 참조하고, 운영 JS 번들에서 `teacher-recent-attempts` 클래스가 포함된 것을 확인했다.

## 교사용 전체 학습 데이터 접근 보강 설치 파일 반영 (2026-05-19)
- 요청 목표는 Cloudflare Pages에 배포한 교사용 전체 학습 데이터 접근 보강 버전을 Windows 설치 파일에도 포함하는 것이다.
- 반영 완료: `npm run installer:win` 통과. 새 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`이며 크기는 `102752929` bytes, 수정 시각은 `2026-05-19 05:52:18`이다.
- 새 blockmap은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe.blockmap`이며 크기는 `106603` bytes, 수정 시각은 `2026-05-19 05:52:20`이다.
- `app/release/win-unpacked/resources/app.asar`는 크기 `12884347` bytes, 수정 시각 `2026-05-19 05:51:50`로 갱신됐다.
- `app/release.zip`은 최신 `app/release` 폴더 기준으로 다시 압축했고 크기는 `250432830` bytes, 수정 시각은 `2026-05-19 05:53:57`이다. ZIP 내부에 `푸르넷수학 전자북-설치-1.0.0.exe`와 `win-unpacked\resources\app.asar`가 포함된 것을 확인했다.
- 기능 포함 확인: `app/dist/assets/index-B_W3Bx7I.js`와 `app/release/win-unpacked/resources/app.asar`에서 `teacher-recent-attempts` 문자열을 확인했고, `app.asar` 안에서 `index-B_W3Bx7I.js` 참조도 확인했다.
- SHA256: 설치 EXE `E7891AEA9711945D997D3CE116BD3BDED629E1CD423C3B7A5A89F56A309C2323`, blockmap `F85864508AE616E11CAC4B52E41482F088B873CD3FEE774093CB67F7245AA082`, app.asar `43452470FAD45A36705C8BE39D715F7DACB69A512E2B65875BAC771FE199B881`, release.zip `B0708CA6DDED9224BA0F977B90A56794E76D164DF9CFD3574C30D5F2AFA8F4AC`.
- 참고: Electron Builder 출력에서 별도 앱 아이콘이 없어 기본 Electron 아이콘이 사용된다는 기존 경고와 큰 번들 크기 경고가 있었지만, 설치 파일 생성과 내부 번들 검증은 정상 완료됐다.

## 관리자 계정별 학습 데이터 접근 권한과 보안 보강 (2026-05-19)
- 요청 목표는 관리자 모드에서 교사와 학생 계정별로 로그인, 학습 실행, 학생 학습 데이터 접근 권한을 따로 제한하고, 불량 사용자를 차단하며, 비밀번호 해킹 위험을 줄이는 것이다.
- 현재 계정 저장 구조는 비밀번호 평문을 저장하지 않고 `passwordHash`를 저장하지만, 관리자 계정 데이터 표와 백업 JSON에는 해시가 노출될 수 있어 이 경로를 차단해야 한다.
- 브라우저 단일 HTML/IndexedDB 앱은 서버 권한 검증을 대체할 수 없으므로, 이번 보강은 로컬 앱의 실제 UI·실행 경로 차단과 해시 비노출, 백업 민감정보 제외를 기준으로 적용한다.
- 검증 기준은 관리자가 교사·학생 권한을 바꾸면 즉시 로그인, 학습 시작, 전체 학습 데이터 조회가 제한되는지 스모크 테스트로 확인하는 것이다.
- 구현 완료: 교사·학생 계정에 `access` 권한 정책을 추가하고 기존 계정은 정상 권한으로 자동 해석하도록 했다. 권한에는 로그인, 학습 실행, 학생 학습 데이터 조회, 클래스·학생 관리 허용값이 들어간다.
- 구현 완료: 관리자 모드 계정 데이터 영역에 `교사·학생 개별 제한` 카드를 추가했다. 관리자는 계정별로 `전체 허용`, `학습 데이터 차단`, `학습 차단`, `계정 차단`을 바로 적용할 수 있다.
- 구현 완료: 계정 차단 시 로그인 단계에서 거부하고, 학생 계정이 로그인된 상태에서는 학생 학습 실행 권한을 우선 적용해 같은 브라우저에 남은 교사용 세션으로 학생 차단을 우회하지 못하게 했다.
- 구현 완료: 교사용 학습 데이터 조회 권한이 꺼진 경우 전체 학습자 진도와 최근 학습 데이터 패널 대신 제한 안내를 표시한다.
- 보안 보강: 관리자 계정 표에는 비밀번호 해시를 표시하지 않고 `해시 비노출` 상태만 표시한다. 관리자 백업 JSON에서도 `passwordHash`를 제거하고 `password-hash-redacted` 표시와 접근 권한만 남긴다.
- 스모크 테스트 보강: 관리자 권한 카드가 보이는지, 해시 비노출 문구가 보이는지, 학생 학습 차단, 교사 데이터 차단, 교사 계정 차단, 재허용 후 교사 로그인과 학습 시작이 모두 동작하는지 확인하도록 했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile` 통과. 스모크 결과는 교사 계정 1개, 학생 계정 1개, 풀이 기록 1개, `learnerName` `점검 학생 mpbpbpy8`, `className` `점검 6학년반 mpbpbpy8`로 확인됐다.
- 산출물 반영: 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 파일 SHA256은 `A3F3BAF6710560727102D5CCF930ED54913951510D65D88E8DF64717D79C154F`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v62`로 올렸다.
- Cloudflare Pages 배포 완료: `npm run pages:deploy` 통과, 새 배포 URL은 `https://26381ad3.prunet-math-ebook.pages.dev`이다. 운영 URL `https://prunet-math-ebook.pages.dev/`는 HTTP 200이고 운영 JS `assets/index-Cpbcef99.js`에서 `account-access-card`, `password-hash-redacted` 문자열이 확인됐다.
- 설치 파일 반영 완료: `npm run installer:win` 통과. 새 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`, 크기 `102755607` bytes, 수정 시각 `2026-05-19 06:17:55`, SHA256 `F5AF7F871ECDA229DC5C9D6BF8F12AAC740890D3CFDCF794D8EF5C3BABC77D69`이다.
- 설치 산출물 검증: blockmap SHA256 `6FDBB111220C7545E7E1F70C342DD268A81410A428E6DD3BC88C28AA472D6322`, `app.asar` SHA256 `FCBB622C42888B3A496CD1F4709DD35C2848AB48A7E0E5B136DA74376699275E`, `release.zip` SHA256 `9E5D5D0801D8BFD7DD268CE2118C0C654C41246D237AE67FB24249570080A6F0`이다.
- 참고: Electron Builder 출력에서 별도 앱 아이콘이 없어 기본 Electron 아이콘이 사용된다는 기존 경고와 Vite 번들 크기 경고가 있었지만, 설치 파일 생성과 배포는 정상 완료됐다.

## 관리자 Google 승인 오류 로컬 복구 로그인 (2026-05-19)
- 증상은 Google 계정 로그인 팝업에서 `액세스 차단됨: 승인 오류`, `no registered origin`, `401 오류: invalid_client`가 표시되는 것이다.
- 원인은 앱의 내부 관리자 권한 코드가 아니라 Google Cloud OAuth Web Client에 현재 실행 주소가 승인된 JavaScript Origin으로 등록되지 않았거나, 웹 클라이언트 ID가 아닌 값을 넣은 경우다.
- Cloudflare 운영 주소는 Google Cloud Console에서 `https://prunet-math-ebook.pages.dev`를 승인된 Origin에 등록해야 한다. 개발 주소는 `http://127.0.0.1:4174`와 필요한 경우 `http://localhost:4174`를 등록한다.
- Windows 설치 파일이나 단일 HTML처럼 `file://`로 실행되는 환경은 Google Identity Services가 Origin 승인을 안정적으로 통과하기 어렵기 때문에, 앱 안에 로컬 관리자 PIN 복구 로그인을 추가하는 방향으로 보강한다.
- 로컬 관리자 PIN은 평문 저장 없이 기존 계정 해시 저장 경로를 사용하고, 관리자 백업에서는 해시를 계속 제외한다.
- 구현 완료: 관리자 로그인 화면에 승인된 JavaScript Origin 안내와 로컬 관리자 PIN 로그인·저장 폼을 추가했다. 기존 관리자 계정이 이미 있는 기기에서는 무단 PIN 재설정을 막기 위해 관리자 로그인 상태에서만 기존 관리자 PIN 변경을 허용한다.
- 보안 보강: 관리자 PIN은 `sha256-v1` 해시로 저장하고 백업 JSON에서는 `passwordHash`를 제거한 뒤 `local-admin-pin-redacted` 또는 `google-oauth-local-pin-redacted` 상태만 남긴다.
- 스모크 테스트 보강: Google 테스트 로그인 후 로컬 관리자 PIN 저장, 관리자 로그아웃, 로컬 PIN 재로그인까지 확인한다. 이번 실행 결과 `SMOKE PASSED`, 관리자/교사/학생 계정 각 1개와 풀이 기록 1개가 생성됐다.
- 검증 완료: `app` 폴더 기준 `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile` 통과. 루트에서 실행한 `npm run lint`는 루트에 `package.json`이 없어 `ENOENT`로 실패했고, 실제 앱 패키지 위치인 `app`에서 같은 검증을 완료했다.
- 산출물 반영: 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 모바일 서비스워커 캐시는 `codex-math-mobile-v63`으로 올렸다.
- Cloudflare Pages 배포 완료: `npm run pages:deploy` 통과, 새 배포 URL은 `https://1e40a8a0.prunet-math-ebook.pages.dev`이다. 운영 URL `https://prunet-math-ebook.pages.dev/`와 새 배포 URL 모두 HTTP 200을 확인했다.
- 배포/설치 번들 확인: 운영 빌드 JS는 `assets/index-DTJgLsRB.js`이고 `local-admin-login-form`, `local-admin-pin-redacted` 문자열이 확인됐다. `app.asar` 내부 `\dist\assets\index-DTJgLsRB.js`에서도 같은 문자열이 확인됐다.
- 설치 파일 반영 완료: `npm run installer:win` 통과. 새 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`, 크기 `102755334` bytes, 수정 시각 `2026-05-19 06:42:53`, SHA256 `5F30B3990FD4E33BDCEE644B44E12E0D66D2114DDECC8042C5A54E600E71130B`이다.
- 설치 산출물 검증: blockmap SHA256 `AD3F9B542AB1589094F7524F2F8CE20677D51F90DCA92A31DAF7043DBC9B9DEA`, `app.asar` SHA256 `10AB36523EC7837ABB061F371DB1EDDEB4178820F04883E7742B444CC816DCAA`, `release.zip` SHA256 `391DF13F4B0FCF00DCBE93E92FBCCEC3100688AA085D314AE83AE8981FF00B54`이다.
- 참고: Electron Builder 출력에서 앱 아이콘 미설정 fallback 경고와 Vite 번들 크기 경고가 있었지만, 설치 파일 생성과 배포는 정상 완료됐다.

## 관리자 대리 사용과 이상행동 자동 차단 알림 (2026-05-19)
- 업로드된 새 증상은 Google 로그인 중 Windows 보안 패스키 확인 단계에서 `알 수 없는 오류가 발생했습니다`가 뜨는 것이다. 이 단계는 Google/Windows 인증 UI라 앱 코드가 직접 제어할 수 없으므로, 앱 내부에서는 로컬 관리자 PIN과 교사·학생 계정 대리 사용 경로를 더 강화한다.
- 목표는 관리자 모드에서 교사·학생 계정을 명시적으로 대리 사용해 학습 데이터와 학습 화면에 접근할 수 있게 하고, 반복 실패 로그인이나 학생의 비정상 빠른 연속 오답 같은 악성 사용 징후를 자동 감시해 권한을 제한하는 것이다.
- 정적 Cloudflare Pages와 Windows 단일 앱 구조에서는 서버 비밀키를 보관해 이메일·카카오톡을 자동 발송할 수 없으므로, 이번 구현은 관리자 화면의 실시간 알림함, 이메일 `mailto:` 작성, 카카오톡 메시지 복사용 알림 문구를 제공하는 방식으로 적용한다.
- 검증 기준은 관리자 대리 사용 버튼으로 교사/학생 계정 세션이 열리고, 자동 감시 기준 초과 시 해당 계정 권한이 제한되며, 관리자 알림함에서 이메일·카카오톡 안내 문구가 확인되는지 스모크 테스트로 확인하는 것이다.
- 구현 결과: 관리자 계정 관리 카드에 `관리자 대리 사용` 버튼을 추가했고, 교사·학생 계정의 학습 데이터 접근 권한을 관리자 모드에서 개별적으로 켜고 끌 수 있게 유지했다. 대리 사용은 비밀번호 입력 없이 관리자 권한으로 해당 교사/학생 세션을 활성화한다.
- 보안 감시 결과: 교사/학생 로그인 실패가 10분 안에 5회 이상 반복되면 로그인·학습·데이터 열람 권한을 자동 제한한다. 학생이 3분 안에 빠른 연속 오답 6회 이상을 기록하면 학습과 데이터 열람 권한을 자동 제한한다.
- 알림 결과: 관리자 화면에 자동 제한 알림함을 추가했고, 각 알림에서 이메일 작성 창 열기, 카카오톡 전달 문구 복사, 확인 처리 버튼을 제공한다.
- 검증 결과: `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile` 통과. 스모크 테스트는 관리자 대리 사용, 반복 실패 로그인 자동 제한, 관리자 알림함, 카카오톡 문구 복사를 포함한다.
- 배포 결과: Cloudflare Pages 새 배포 `https://98c9a8a2.prunet-math-ebook.pages.dev` 완료, `https://prunet-math-ebook.pages.dev` HTTP 200 확인. Windows 설치 파일과 `release.zip`을 새 빌드로 재생성했다.
- 설치 산출물 검증: `app/release/푸르넷수학 전자북-설치-1.0.0.exe` SHA256 `F9AB73D5289CFB0AB3FC95D7F6895C2B502BA4D15FCE207E515B3886A171CC57`, `app/release.zip` SHA256 `21BE0A4B2EFB4DAF0D635D1C2A5383E3B3EDF1BFE335E11F506F574447580980`이다.
## 관리자 교사·학생 아이디 사용 승인 UI (2026-05-19)
- 요청 목표는 관리자 계정으로 로그인했을 때 등록된 교사용 아이디와 학생용 아이디의 사용 승인을 화면 상단에서 바로 처리하게 하는 것이다.
- 기존 `canLogin` 권한이 로그인 허용과 차단을 이미 담당하므로, 별도 저장소를 만들지 않고 `blockedReason`에 승인 대기 상태를 표시해 승인 전 로그인을 막는 방향이 가장 작고 안전하다.
- 신규 회원가입 계정은 곧바로 로그인시키지 않고 승인 대기 상태로 저장한 뒤, 관리자가 `승인 인증`을 누르면 기본 권한으로 전환한다.
- 검증 기준은 가입 후 승인 대기 문구, 승인 전 로그인 차단, 관리자 승인 후 교사·학생 로그인이 정상 진행되는 브라우저 스모크 흐름과 기본 lint/verify/onefile 통과다.
- 구현 결과: 관리자 로그인 화면 상단에 `사용 승인` 바로가기와 `사용 승인 관리` 패널을 배치했고, 승인 대기·승인 완료·등록 계정 수를 함께 표시한다.
- 구현 결과: 교사용·학생용 계정 카드마다 `승인 인증`과 `승인 보류` 버튼을 제공해 신규 계정 승인과 승인 취소를 같은 권한 저장 흐름으로 처리한다.
- 구현 결과: 승인 대기 계정은 `approval-pending` 차단 사유로 저장되며, 로그인 시 `관리자 승인 후 로그인할 수 있습니다` 안내를 표시한다.
- 검증 결과: `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile` 통과. 스모크 테스트는 교사와 학생 가입 후 승인 전 로그인 차단, 관리자 승인, 승인 후 로그인을 확인한다.
- 산출물 반영: 생성된 단일 HTML을 `푸르넷수학-연습.html`과 `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고, 세 HTML SHA256은 `DC456EC89D5F1BA805E0DAE1DCF06471F884697D22CB69399B7D7AC636BA1009`로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v65`로 올렸다.

## 승인 UI Cloudflare Pages와 Windows 설치 파일 반영 (2026-05-19)
- 요청 목표는 관리자 교사·학생 아이디 사용 승인 UI가 반영된 최신 앱을 Cloudflare Pages 운영 서버와 Windows 설치 파일에 반영하는 것이다.
- 검증 기준은 `npm run pages:deploy` 배포 성공, 운영 URL HTTP 200 확인, `npm run installer:win` 설치 파일 생성 성공, `app/release.zip` 최신화와 산출물 SHA256 기록이다.
- Cloudflare Pages 결과: `npm run pages:deploy`는 `npm run build`와 Vite 빌드까지 성공했지만 Wrangler가 비대화형 환경에서 `CLOUDFLARE_API_TOKEN`이 없다고 거부해 업로드가 완료되지 않았다.
- 운영 URL 확인: `https://prunet-math-ebook.pages.dev/`는 HTTP 200으로 응답하지만 현재 운영 JS `assets/index-B_ESa1It.js`에는 `approval-pending`과 `approval-management-panel` 문자열이 없어 최신 승인 UI가 아직 반영되지 않았다.
- Windows 설치 파일 반영 완료: `npm run installer:win` 통과. 새 설치 파일은 `app/release/푸르넷수학 전자북-설치-1.0.0.exe`, 크기 `102757410` bytes, 수정 시각 `2026-05-19 15:06:42`, SHA256 `832F367823F48009E6808ABEEE65E6689E53827EFF3F525D93DD210E68EFA6F3`이다.
- 설치 산출물 검증: blockmap SHA256 `39D063DFB34106A0FDA7839C946F2C4AB683B8947EFEE9094137935A5F0F7C07`, `app.asar` SHA256 `B9FCD85AE56363218E9A3B75813CD1E310F1532EA5BD7EFC8C9A8EB32EC65241`, `release.zip` SHA256 `D21303DF13BC66A0121F0C13BE3FCF9A086DFE5C9DC5541D5D4C85BE4F922BEA`이다.
- 기능 포함 확인: `app/dist`와 `app/release/win-unpacked/resources/app.asar`에서 `approval-management-panel`, `approval-pending`, `승인 인증`, `사용 승인 관리` 문자열을 확인했다.
- 참고: Electron Builder 출력에서 앱 아이콘 미설정 fallback 경고와 Vite 번들 크기 경고가 있었지만, Windows 설치 파일 생성은 정상 완료됐다.
- Cloudflare Pages 최종 반영: `npx wrangler login`으로 CLI OAuth 로그인을 완료한 뒤 `npm run pages:deploy` 재실행에 성공했다. 새 배포 URL은 `https://6fd8ba36.prunet-math-ebook.pages.dev`이다.
- 운영 서버 최종 확인: `https://prunet-math-ebook.pages.dev/`와 새 배포 URL 모두 HTTP 200이며, 운영 JS `assets/index-Btney19w.js`에서 `approval-pending`, `approval-management-panel`, `승인 인증`, `사용 승인 관리`, `관리자 승인 후 로그인` 문자열을 확인했다.

## Cloudflare Pages 운영 URL 신규 데이터 갱신 (2026-05-19)
- 요청 목표는 `https://prunet-math-ebook.pages.dev/` 운영 URL을 현재 로컬 최신 빌드 데이터로 다시 배포하는 것이다.
- 검증 기준은 `npm run pages:deploy` 성공, 새 배포 URL 확인, 운영 URL HTTP 200 확인, 운영 JS에 최신 승인 UI 관련 문자열이 남아 있는지 확인하는 것이다.
- 배포 결과: `npm run pages:deploy` 통과. Wrangler가 `dist`를 배포했고 새 배포 URL은 `https://c75a8a08.prunet-math-ebook.pages.dev`이다.
- 업로드 결과: 서버에 동일 파일이 이미 있어 `Uploaded 0 files (4 already uploaded)`로 표시됐지만 `_headers`와 새 배포는 정상 완료됐다.
- 운영 URL 확인: `https://prunet-math-ebook.pages.dev/`는 HTTP 200이며 `assets/index-Btney19w.js`와 `assets/index-DRRYYWyb.css`를 참조한다.
- 최신 반영 확인: 운영 JS와 새 배포 JS 모두 HTTP 200이며 `approval-pending`, `approval-management-panel` 문자열이 확인됐다.

## 사라진 교사·학생 계정 데이터 확인과 승인 복구 (2026-05-19)
- 요청 증상은 기존 Cloudflare 서버에 저장됐다고 생각한 교사용 아이디와 학생용 아이디가 운영 URL에서 보이지 않는 것이다.
- 현재 앱 구조상 교사·학생 계정은 Cloudflare Pages 서버 DB가 아니라 각 브라우저의 IndexedDB `kang-taehoon-math-learner-db`에 저장된다. 배포 URL이 바뀌거나 다른 브라우저/프로필에서 열면 기존 계정이 없는 것처럼 보일 수 있다.
- 우선 확인 기준은 운영 URL과 최근 preview URL별 브라우저 IndexedDB 폴더를 찾아 계정 저장소가 남아 있는지 확인하고, 발견되면 승인 상태로 바꾸는 복구 경로를 정하는 것이다.
- Cloudflare에는 이 작업 전 계정용 D1/KV 서버 DB가 없었으므로 서버에서 기존 교사·학생 아이디를 복구할 원본은 없었다.
- 확인한 Chrome Default 운영 URL IndexedDB에는 관리자 계정 1개만 있었고 teacherAccounts, studentAccounts, teachers, classes, students, attempts는 0개였다.
- 광범위한 AppData 추가 검색은 사용자가 중단했으므로 다른 브라우저 프로필이나 다른 PC에 남아 있는 데이터는 아직 미확인 상태다.

## Cloudflare D1 서버 계정·학습 데이터 DB 전환 (2026-05-19)
- 요청 목표는 IndexedDB/localStorage에만 저장되던 교사용 아이디, 학생용 아이디, 사용자 승인 상태, 교사·학습자·학습 데이터를 Cloudflare 서버의 실제 DB로 옮겨 중앙 관리되게 하는 것이다.
- Cloudflare Pages 정적 앱에 붙이기 가장 작은 서버 구성은 Pages Functions + D1이다. D1은 계정·교사·반·학생 같은 관계형 데이터와 풀이 기록 조회 인덱스를 만들 수 있고, Pages Functions에서 여러 row를 batch upsert할 수 있어 현재 앱 구조에 바로 붙이기 쉽다.
- 로그인 세션까지 서버에 저장하면 한 기기의 로그인 상태가 다른 기기에 보이는 문제가 생기므로, 서버에는 계정·승인·학습 데이터만 저장하고 현재 로그인 세션은 각 기기의 로컬 설정에 남긴다.
- 구현 기준은 기존 `learnerDb` 공개 함수 이름을 유지하고, Cloudflare API가 가능하면 D1을 우선 읽고 쓰며 실패 시 기존 IndexedDB/localStorage로 fallback하는 것이다.
- Cloudflare D1 DB `prunet_math_learning_db`를 APAC 리전에 생성했고 DB id는 `08743c63-9a74-4215-93a8-c5b01a3cec73`이다.
- `app/migrations/0001_learning_cloud.sql` 마이그레이션을 원격 D1에 적용해 teachers, classes, students, 관리자·교사·학생 계정, 풀이 기록, 진도 보정, 보안 알림, 앱 설정 테이블과 조회 인덱스를 만들었다.
- Pages Function API는 `/api/learning/snapshot`이며 GET은 D1 전체 스냅샷을 읽고 PUT은 같은 origin 요청에서 스냅샷을 batch upsert한다.
- 운영 배포는 `npm run pages:deploy`로 완료했고 새 preview URL은 `https://5a5cfe86.prunet-math-ebook.pages.dev`, 운영 URL `https://prunet-math-ebook.pages.dev/`는 `assets/index-CcCJFWxg.js`를 참조한다.
- 운영 API `https://prunet-math-ebook.pages.dev/api/learning/snapshot`은 HTTP 200으로 응답했고, 현재 D1 count는 teachers/classes/students/admin_accounts/teacher_accounts/student_accounts/learning_attempts/student_progress_overrides/learning_security_alerts가 0, app_settings가 1이다.
- 이전에는 Cloudflare 서버 DB가 없었기 때문에 사라진 교사·학생 계정을 서버에서 복구할 원본은 없었다. 새 구조에서는 운영 HTTPS 접속 시 D1을 우선 사용하고 IndexedDB/localStorage는 캐시와 오프라인 fallback으로만 사용한다.
- 로컬 Vite smoke에서는 Pages Function이 없으므로 `canUseCloudLearningDb()`를 HTTPS에서만 D1을 쓰도록 제한했다. 운영 HTTPS에서는 D1 API를 사용하고 필요 시 `VITE_DISABLE_CLOUD_LEARNING_DB=1`로 끌 수 있다.
- 검증 결과는 `npm run lint`, `npm run verify`, `npm run smoke:learning-db`, `npm run onefile` 모두 통과했다.
- 단일 HTML 산출물은 `CODEX 수학 익힘북 전자북(26.05.17)/CODEX-수학-익힘북-전자북.html`, `푸르넷수학-연습.html`, `모바일 홈페이지형 전자북(26.05.17)/study.html`에 반영했고 세 파일 SHA256은 `61653BA59D0FAD893E1F553B9C2C0014A6523A620CF018F29AB9DE88A7325C13`으로 일치한다.
- 모바일 서비스워커 캐시 버전은 `codex-math-mobile-v66`으로 올렸다.
- Windows 설치 앱은 `app/electron/main.cjs`에서 `https://prunet-math-ebook.pages.dev/`를 먼저 열고 실패하면 내장 `dist/index.html`을 여는 방식으로 바꿨다. 설치 앱이 온라인일 때는 운영 Pages origin에서 실행되므로 D1 API도 같은 origin으로 사용한다.
- `npm run installer:win` 통과. 설치 파일 `app/release/푸르넷수학 전자북-설치-1.0.0.exe` SHA256은 `D9F649A1E995D8665251CE453DF081DE080BAD2A6895863B84301E417F90B01A`, blockmap SHA256은 `A21EC57FB48772CA626C6F78286CD40EEA232B97A3DE87FB76C88A8C3E01DA4A`, `app.asar` SHA256은 `7E9D6BBCC04B277000DB788BFBB2AA682362E954ACCF6DCA3196A04F9CDFF2A1`, `app/release.zip` SHA256은 `23B3FEBF7ECD4AFE7C88CF2807A425147CC0B553CC731E68E9C9B50ABD369DAD`이다.
- `app.asar` 내부 `electron/main.cjs`에서 운영 URL 문자열과 fallback 함수가 포함된 것을 확인했다.

## Cloudflare D1 데이터 보호·보고서·교사용 관리 보강 (2026-05-19)
- 요청 목표는 중요한 교사·학생·학습 데이터를 주기적으로 유효성 검사하고, 학습 보고서·학습 진단서·학부모 상담서 데이터를 교사별·학생별로 서버 DB에 누적 기록하며, 필요 시 주기 백업까지 수행하는 것이다.
- Cloudflare 문서 기준으로 Cron Trigger는 Worker의 `scheduled()` handler를 통해 주기 작업을 실행하므로 Pages Function API와 별도의 유지보수 Worker를 같은 D1에 바인딩하는 방향이 맞다.
- Cloudflare D1은 현재 `wrangler d1 export`와 Time Travel/백업 기능을 제공하므로, 배포 전에는 원격 DB export를 만들고 앱 내부에서도 스냅샷 백업 row를 남기는 이중 보호가 적합하다.
- DB 보호 기준은 기존 테이블을 drop/delete하지 않는 additive migration, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, upsert만 사용, 배포 전 export 백업 스크립트 유지다.
- Windows 설치 앱은 이미 운영 URL 우선 로드로 바꿨으므로 온라인 설치 모드는 Cloudflare Pages origin에서 실행되어 D1 서버 DB와 같은 방식으로 동기화된다. 이번 보강에서는 서버 유지보수 API와 교사용 UI를 추가 반영한다.
- 구현 완료: `0002_learning_maintenance.sql`로 `learning_data_validations`, `learning_periodic_reports`, `learning_db_backups`, `student_progress_map_settings` 테이블과 인덱스를 추가했다. 기존 테이블 삭제 없이 `CREATE TABLE IF NOT EXISTS`와 `CREATE INDEX IF NOT EXISTS`만 사용했다.
- 구현 완료: `functions/_learningMaintenance.ts`, `functions/api/learning/maintenance.ts`, `workers/maintenance.ts`, `wrangler.maintenance.toml`을 추가했다. Pages Function은 수동 실행과 상태 조회를 제공하고, Worker `prunet-math-maintenance`는 `17 * * * *`, `0 18 * * *` UTC Cron으로 운영 D1 유지보수를 실행한다.
- 구현 완료: `scripts/backup-d1.mjs`와 `db:backup`, `db:migrate:remote`, `maintenance:deploy` 스크립트를 추가했다. 원격 마이그레이션 전 `wrangler d1 export prunet_math_learning_db --remote`로 SQL 백업을 먼저 만들도록 바꿨다.
- 원격 DB 적용 완료: `npm run db:migrate:remote`가 백업 후 `0001_learning_cloud.sql`, `0002_learning_maintenance.sql`을 운영 D1 `prunet_math_learning_db`에 적용했다. DB id는 `08743c63-9a74-4215-93a8-c5b01a3cec73`다.
- 유지보수 Worker 배포 완료: `npm run maintenance:deploy` 성공. Worker URL은 `https://prunet-math-maintenance.scalpertv.workers.dev`, 배포 version id는 `198003a2-d340-449a-92a3-69ee1ffb482c`다.
- 운영 Pages 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://5e302ed5.prunet-math-ebook.pages.dev`, 운영 URL은 `https://prunet-math-ebook.pages.dev`다.
- 운영 API 검증 완료: `POST https://prunet-math-ebook.pages.dev/api/learning/maintenance`에 same-origin header로 `manual-verify`를 실행했고 `ok: true`, `issueCount: 0`, `validationId: validation-1779177144374-4aohbq`, `backupId: backup-1779177144374-nf0392`가 반환됐다.
- 운영 D1 확인 완료: `learning_data_validations` 1건, `learning_db_backups` 1건, `learning_periodic_reports` 0건이다. 현재 운영 DB에 교사·학생 데이터가 없어 보고서는 아직 생성되지 않았고, 학생 데이터가 들어오면 학생별 3종 보고서가 생성된다.
- 교사용 UI 구현 완료: 학생 비밀번호 임시 초기화, 학생별 진도맵 목표/중점/메모 설정, 보고서 파일 저장, PDF 저장/PC 출력용 인쇄 창, 카카오톡 전송용 시스템 공유/클립보드 fallback, 이메일 작성 링크를 추가했다.
- Windows 설치 앱 갱신 완료: `npm run installer:win` 성공. 설치 앱의 `app.asar`에서 운영 URL 우선 로드, 내장 fallback, `/api/learning/maintenance` 코드 포함을 확인했다.
- 최신 산출물 SHA256: 설치 EXE `261D7669EBE9667AE0ABA5D38CA890C987A0AF027AA2B1DC11AEE09CEEDF1CA6`, blockmap `F54CDCAD97B64F4C1A2FC67EE211CB03E69BC0889812718116A93CE22AA5389B`, app.asar `C1BEC80491613610B10BC1A04855505965AD8A3F073C7CE978058675866D28A5`, release.zip `D0E72745D1E30975097C33C2A7A37083CE8F0D3FBECD9213895489AF11A4A72B`다.
- 단일 HTML 산출물 갱신 완료: `CODEX 수학 익힘북 전자북(26.05.17)/CODEX-수학-익힘북-전자북.html`, `푸르넷수학-연습.html`, `모바일 홈페이지형 전자북(26.05.17)/study.html` SHA256은 모두 `063BD1840A30D1258E0209EBB9C8B6BC882EBF0F0B26557D832C46DB4E531314`다. 모바일 서비스워커 캐시는 `codex-math-mobile-v67`로 올렸다.
- 검증 완료: `npm run lint`, `npm run build`, `npm run smoke:learning-db`, `npm run verify`, `npm run onefile`, `npm run pages:deploy`, `npm run installer:win` 모두 통과했다. Electron Builder의 기본 아이콘 fallback 경고와 Vite 번들 크기 경고는 기존과 같은 비차단 경고다.

## 관리자 root 권한·교사용 운영·학습 콘텐츠 DB 분리 보강 (2026-05-19)
- 요청 목표는 관리자 계정에 전체 프로그램 root 권한을 명시적으로 부여하고, 관리자 상단 메뉴에서 교사·학생 승인과 계정/비밀번호/학습 데이터/접근 권한 관리를 바로 처리하게 하는 것이다.
- 교사용 목표는 등록 학생의 아이디·비밀번호 수정, 클래스 등록·수정, 실시간 진도 모니터링, 보충수업과 반복학습 숙제 부여, 학생별 일간·주간·월간 진도와 진단서·상담서 출력/공유를 한 흐름으로 처리하는 것이다.
- 데이터베이스 목표는 사용자·교사·학습자 운영 DB와 학습 콘텐츠 DB를 분리하고, 초등 수학과 중등 수학, 초등 영어, 중등 영어, 내신 대비 출판사별 콘텐츠를 추후 추가해도 기존 데이터를 훼손하지 않는 additive 구조를 마련하는 것이다.
- 구현 기준은 기존 D1 데이터를 drop/delete하지 않고 `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, upsert 중심으로 확장하는 것이다.
- 이번 변경은 이미 들어간 보고서 출력/공유 기능은 재사용하고, 부족한 root 권한 표시, 상단 승인 바로가기, 교사용 클래스·숙제 운영, 콘텐츠 DB 분리 스키마를 보강하는 방향이 가장 안전하다.
- 구현 완료: 관리자 로그인 상태에서 `ROOT 권한` 패널을 표시하고 교사 아이디·비밀번호 관리, 학생 아이디·비밀번호 관리, 학습 데이터 관리, 유저별 접근 학습 접근 관리, 사용자 승인, 서버 DB 검증·백업 관리를 명시했다.
- 구현 완료: 화면 상단 메뉴바에 `교사 승인`, `학생 승인` 바로가기 버튼과 승인 대기 건수를 표시했다. 버튼은 관리자 패널을 즉시 열고 최신 관리자 데이터를 새로고침한다.
- 구현 완료: 관리자 접근 권한 카드에 교사 비밀번호 임시 초기화 버튼을 추가했다. 학생은 기존 학생 계정·비밀번호 수정과 임시 비밀번호 초기화 흐름을 유지한다.
- 구현 완료: 교사용 실시간 진도맵 학생 카드에 `보충수업 추가`, `반복숙제 부여` 버튼을 추가했다. 부여 기록은 `StudentLearningAssignmentRecord`로 저장하고 학생별 진도 카드에 최근 과제 chip으로 표시한다.
- 구현 완료: 학생별 상담 문서 영역에 일간·주간·월간 진도 도표를 추가했다. 기존 학습 진단서와 학부모 상담서의 PDF 저장·PC 출력·파일 저장·카카오톡 공유·이메일 전송 기능은 그대로 연결된다.
- DB 구현 완료: `0003_learning_root_content_partition.sql`로 `learning_assignments`, `learning_content_databases`, `learning_content_units`, `learning_content_topics`, `learning_content_items`를 추가했다. 기존 테이블 삭제 없이 additive SQL만 사용했다.
- Cloudflare API 구현 완료: `/api/learning/snapshot`에 `assignments` 동기화를 추가했고, `/api/learning/content` Pages Function을 새로 만들어 학습 콘텐츠 카탈로그와 단원·유형 메타데이터를 D1에 분리 저장하게 했다.
- 콘텐츠 DB 분리 완료: 운영 페이지 로드 후 원격 D1에 `learning_content_databases` 5건, `learning_content_units` 74건, `learning_content_topics` 811건이 저장된 것을 확인했다. 5개 DB는 초등 수학, 중등 수학, 초등 영어, 중등 영어, 내신 대비 출판사별 DB다.
- 원격 DB 적용 완료: `npm run db:migrate:remote`는 백업을 성공한 뒤 Wrangler fetch 오류로 한 번 끊겼고, `npx wrangler d1 migrations apply prunet_math_learning_db --remote` 재실행으로 `0003_learning_root_content_partition.sql` 적용을 완료했다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://ebe0cb4a.prunet-math-ebook.pages.dev`, 운영 URL은 `https://prunet-math-ebook.pages.dev`다. `/api/learning/snapshot`은 HTTP 200, `/api/learning/content`도 HTTP 200으로 확인했다.
- 단일 HTML 산출물 갱신 완료: `CODEX 수학 익힘북 전자북(26.05.17)/CODEX-수학-익힘북-전자북.html`, `푸르넷수학-연습.html`, `모바일 홈페이지형 전자북(26.05.17)/study.html` SHA256은 모두 `6078478B23F1A8CAFFD9B9559A634EC14CE58D9A342A1FE85982102D90412B13`다. 모바일 서비스워커 캐시는 `codex-math-mobile-v68`로 올렸다.
- Windows 설치 앱 갱신 완료: `npm run installer:win` 성공. `app.asar`에서 운영 URL 우선 로드, 내장 fallback, `/api/learning/content`, `studentLearningAssignments` 포함을 확인했다.
- 최신 설치 산출물 SHA256: 설치 EXE `71736266D0004502C3D5541D6836AEB141181738EABDD03EDDD4A92FE53B76CE`, blockmap `88B42576A0B0C5B1A5398FA83707A9EFC88F6F50186215CDB6ED10A3985E5B8B`, app.asar `7A51EC335C442BB39547DD55D05D57DFC8E50B7A691E30CA2ED11A0EE2F14768`, release.zip `8FD3D724EBB0B5A7C51CC958CD929C4937875DAA6EF4E36825644008853A8992`다.
- 검증 완료: `npm run lint`, `npm run build`, `npm run smoke:learning-db`, `npm run verify`, `npm run onefile`, `npm run pages:deploy`, `npm run installer:win` 모두 통과했다. Electron Builder의 기본 아이콘 fallback 경고, Vite 번들 크기 경고, Electron Builder DEP0190 경고는 기존과 같은 비차단 경고다.

## 학생 계정 학년별 전체 접근과 다른 학년 선택 학습 (2026-05-19)
- 요청 목표는 등록된 학생 아이디로 로그인하면 본인 등록 학년의 모든 학습 데이터를 기본으로 열고, 학생이 원하면 다른 학년 데이터도 선택해서 학습할 수 있게 하는 것이다.
- 현재 앱은 학생 로그인 시 `activeStudent.grade`를 `learner.grade`로 넣고 `unitsForLearner`가 그 학년 콘텐츠만 필터링한다. 동시에 학생 로그인 상태에서는 학년 입력과 빠른 학년 버튼이 비활성화되어 다른 학년 선택이 막혀 있다.
- 안전한 구현 기준은 학생 계정의 이름, 학생 id, teacher/class 연결은 그대로 유지하고, 화면에서 선택하는 `learner.grade`만 바꿔 콘텐츠 필터를 전환하는 것이다. 이렇게 해야 다른 학년 선택 학습 중에도 기록이 같은 학생 계정에 계속 연결된다.
- 클래스 등록 확장은 기존 클래스 폼을 유지하면서 학년·과정 선택 버튼 영역을 넓히고, 일반 학년과 연산 과정을 모두 빠르게 선택할 수 있게 하는 방향이 가장 작고 안전하다.
- 검증 기준은 학생 로그인 상태에서 학년 버튼이 활성화되고, 다른 학년 선택 시 학습 단원이 전환되며, 본인 학년으로 돌아가는 버튼이 보이고, 클래스 등록에서 확장된 학년 선택 UI가 보이는 것이다. 이후 lint, verify, onefile, smoke, 운영 배포, Windows 설치 파일 갱신까지 완료한다.
- 구현 완료: 학생 로그인 상태에서도 학년 입력과 학년·연산 빠른 선택 버튼을 사용할 수 있게 했다. 이름은 계속 읽기 전용으로 두고, 학년만 바꾸도록 했다.
- 구현 완료: 학생이 다른 학년을 선택해도 `learnerProfileFromStudent(activeAccountStudent)` 기반 학생 id, 교사, 클래스 연결을 유지하고 `grade`만 바꿔 저장한다. 학습 기록은 기존 학생 계정에 계속 묶인다.
- 구현 완료: 학생 화면에는 `내 학년 전체` 버튼과 `선택 학습` 상태 문구를 추가했다. 등록 학년이 `6학년 연산`이어도 `내 학년 전체`를 누르면 `6학년` 전체 자료로 전환할 수 있다.
- 구현 완료: 클래스 등록 폼에 `클래스 학년·과정 빠른 선택` 영역을 추가해 1~6학년 일반 학년과 1~6학년 연산 과정을 모두 버튼으로 선택할 수 있게 했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 통과. 추가 DOM 점검에서 클래스 빠른 선택 버튼 12개와 학습자 학년 버튼 12개가 렌더링되는 것을 확인했다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://170da45e.prunet-math-ebook.pages.dev`, 운영 URL `https://prunet-math-ebook.pages.dev/`는 `assets/index-BT0QvDEs.js`, `assets/index-CmjGsVBN.css`를 참조하며 `내 학년 전체`, `선택 학습`, `class-grade-menu` 반영을 확인했다.
- 단일 HTML 산출물 갱신 완료: `CODEX 수학 익힘북 전자북(26.05.17)/CODEX-수학-익힘북-전자북.html`, `푸르넷수학-연습.html`, `모바일 홈페이지형 전자북(26.05.17)/study.html` SHA256은 모두 `B61DC92952BD6DAAB6FAD1BBC2EA379FD790AA27B9B12ECC08B0B4280F47CDBB`다. 모바일 서비스워커 캐시는 `codex-math-mobile-v69`로 올렸다.
- Windows 설치 앱 갱신 완료: `npm run installer:win` 성공 후 `app/release.zip`도 최신 `release` 기준으로 다시 압축했다. 설치 EXE SHA256은 `C0FAB1002876E1A59784AD49E371B74D5F36613BAA1C7B8C64418728E1338D40`, blockmap은 `DDC44F884310E8EA0E82306A53587E546F0290FC5CAD1309CD1FD66F7D3674EA`, app.asar는 `78AB636CEAF8960818A3712AE42F6AA5879138CD893B64C8A539FEC1E48316BD`, release.zip은 `B9F1E3D068F32F889282C6314AAAEFF56E3F2E00730DFB652109CAA04805D3A8`이다.

## 클래스 과정 다중 선택 저장과 모험지도 위치 조정 (2026-05-19)
- 요청 목표는 클래스 등록의 `클래스 학년·과정 빠른 선택`에서 여러 과정을 동시에 선택하고, 저장 시 선택한 과정들이 실제 클래스 목록에 저장되게 하는 것이다.
- 현재 `ClassRecord`는 `grade` 한 개만 저장한다. 기존 DB 스키마를 바꾸지 않는 안전한 방식은 다중 선택을 UI 상태로만 관리하고, 저장할 때 선택한 과정마다 같은 클래스명과 담당 선생님으로 `registerClassRecord`를 순차 호출해 과정별 클래스 레코드를 만드는 것이다.
- 기존 클래스를 수정 중일 때 여러 과정을 선택하면 첫 번째 과정은 기존 클래스 id로 저장하고, 나머지 과정은 신규 클래스 레코드로 추가하는 방향이 데이터 손실 위험이 가장 낮다.
- 두 번째 요청 목표는 왼쪽 학습 메뉴의 `모험 지도 / 스토리 단원 보기` 섹션을 `학습 보고서`보다 위에 배치하는 것이다. 기존 컴포넌트를 새로 만들지 않고 JSX 위치만 옮기는 방식으로 처리한다.
- 검증 기준은 빠른 선택 버튼이 여러 개 active로 유지되고, 저장 로직이 선택 과정 개수만큼 호출되며, 화면 DOM에서 모험지도 섹션이 학습 보고서보다 먼저 나오는 것이다. 이후 기본 lint, verify, onefile, smoke 검증과 운영 배포, 설치 파일 갱신을 수행한다.
- 구현 완료: `classForm.grades`를 추가해 빠른 선택 버튼이 다중 active 상태를 유지하게 했다. 직접 입력은 단일 과정 입력으로 동작하고, 빠른 선택 버튼은 토글 방식으로 누적 선택된다.
- 구현 완료: 클래스 저장 시 `selectedClassGrades`를 순회하며 `registerClassRecord`를 순차 호출한다. 첫 번째 선택 과정은 기존 `classForm.id`를 유지하고, 나머지 과정은 신규 클래스 레코드로 저장된다.
- 구현 완료: 클래스 등록 UI에 `N개 과정 저장 예정` 문구와 저장 버튼의 `N개 과정 저장` 표시를 추가했다.
- 구현 완료: 왼쪽 사이드바의 `모험 지도 / 스토리 단원 보기` 블록을 제거하고, 메인 학습 영역의 `학습 보고서` 바로 위로 이동했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db` 통과. 추가 브라우저 DOM 점검에서 빠른 선택 active 버튼 3개와 `3개 과정 저장` 버튼 문구, 모험지도 섹션이 학습 보고서보다 먼저 나오는 것을 확인했다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://504134d2.prunet-math-ebook.pages.dev`, 운영 URL `https://prunet-math-ebook.pages.dev/`는 `assets/index-27INhryS.js`, `assets/index-CmjGsVBN.css`를 참조하며 다중 과정 저장 문구와 모험지도 이동 문자열을 확인했다.
- 단일 HTML 산출물 갱신 완료: `CODEX 수학 익힘북 전자북(26.05.17)/CODEX-수학-익힘북-전자북.html`, `푸르넷수학-연습.html`, `모바일 홈페이지형 전자북(26.05.17)/study.html` SHA256은 모두 `F522D78E9E70862EE42AA19F1094AFA43DC6E6BA8891661FD96906DB3CC29AFC`다. 모바일 서비스워커 캐시는 `codex-math-mobile-v70`으로 올렸다.
- Windows 설치 앱 갱신 완료: `npm run installer:win` 성공 후 `app/release.zip`도 최신 `release` 기준으로 다시 압축했다. 설치 EXE SHA256은 `EAA7986DD5E37276E77861CA250B103F49034B76E758ECB7800F9C9A421B7C96`, blockmap은 `072BEE2CF6B4A38A334CAC0443CB7C79DBA48D4FA9F1AD9E7C0608409456F6E9`, app.asar는 `867E28B1243BEF8AF6B573E1133FE32D6813CD12D4B675C0DA62A3EEB2E9A35F`, release.zip은 `D11534C8885A734A632406E8B5BEA52C7C0F832DA910F29C055C42497E38A571`이다.

## 가독성 보강과 교사용 모니터링 버튼 로직 수정 (2026-05-19)
- 요청 목표는 모험 지도 스토리 단원 보기, 보고서 자세히 보기, 학습 진단서, 학부모 상담서의 글씨를 키우고, 좌우 여백을 줄여 실제 학습 콘텐츠 폭을 넓히는 것이다.
- 글씨 크기는 개발 지침상 `vw` 기반 연속 스케일 대신 CSS 변수와 미디어쿼리 브레이크포인트를 사용한다. 이렇게 하면 화면 크기에 맞춰 적응하지만 글자가 흔들리거나 과하게 커지지 않는다.
- 학습자 모니터링은 학생 계정에서는 보이지 않아야 하므로 `canViewAllStudentLearningData` 또는 관리자/교사 권한을 기준으로 섹션 자체를 렌더링하지 않게 한다.
- 모니터링 버튼은 기존 함수가 폼만 채우거나 출력/공유를 한 버튼에 섞어 처리해 사용자가 동작을 못 느낄 수 있다. 버튼별로 관리 패널 이동, 메시지 표시, PDF 저장, 프린터 출력 동작을 분리해 명확하게 만든다.
- 구현 완료: 앱 좌우 기본 여백을 줄이고 학습 셸 최대 폭을 1760px로 넓혔다. 스토리 단원 카드와 보고서, 상담 문서 textarea는 `--readable-*`, `--report-*` CSS 변수와 1280px, 1600px, 560px 브레이크포인트로 가독성을 높였다.
- 구현 완료: 학습자 모니터링 섹션은 관리자 또는 교사용 계정 로그인 상태에서만 렌더링한다. 기본 접속과 학생 계정 조건에서는 `.class-monitor-panel`이 화면에 나오지 않는다.
- 구현 완료: 계정·진도 수정과 진도맵 설정 버튼은 학생을 선택하고 학생 관리 폼을 연 뒤 현재 진도, 목표 문제 수, 중점 단원, 교사 메모를 채운다. 비번 초기화는 교사/관리자 권한을 먼저 검사하고, 보충수업 추가와 반복숙제 부여는 기존 서버 진도 갱신 경로와 연결된 상태를 유지한다.
- 구현 완료: 상담 문서 버튼은 `PDF 저장`과 `프린터 출력`으로 분리했다. 두 버튼 모두 브라우저 인쇄 창을 열지만, PDF 저장 버튼은 PDF 대상 선택 안내를 별도로 표시하고 출력 문서 글씨 크기도 17px로 키웠다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db`를 모두 통과했다. 추가 브라우저 DOM 점검에서 기본 접속 기준 `monitorVisible=false`, `--readable-text=17px`, `--report-text=18px`, 앱 좌우 padding 12px 적용을 확인했다.
- 산출물 갱신 완료: 단일 HTML 3개 파일 SHA256은 모두 `E8A6E65B9897B0E8BDE510344603C3F5AE58E04339A43E8813DC6DC069D9630D`다. 모바일 서비스워커 캐시는 `codex-math-mobile-v71`로 올렸다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://ae8f95a3.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`에서 `assets/index-CS3Clv_S.js`, `assets/index-DXDAyHSq.css` 반영을 확인했다.
- Windows 설치 파일 갱신 완료: `app/release/푸르넷수학 전자북-설치-1.0.0.exe` SHA256은 `A2F43B12C8BB54963F8CA84B46F75303925AF2D17A94D4EF40739D7A3D2691AC`, blockmap은 `EDEE72D9F168C31F76C5655A81C7C049CCD8B2098F4010C767CEF2E10094F547`, app.asar는 `05D6DAAB64A2FC10FE85D7222A0524EDBC6E4CDA2D08714871118371BAADDDFF`, `app/release.zip`은 `A6C525847EF095E0160BE5D90A602DD94EA8862606BC0B5D99BEF9CD8DDB5E77`다.

## 클래스 등록 저장 안정화와 관리 UI 고도화 (2026-05-19)
- 요청 목표는 클래스 복수 과정 저장 후 학생 이름, 학년, 학생 로그인 아이디, 학생 비밀번호가 실제 클래스에 정상 연결되고, 저장 후에도 “등록 학생 없음”처럼 보이는 상태 불일치를 없애는 것이다.
- 현재 위험 지점은 클래스 등록이 복수 과정 저장을 하면서 마지막 저장 클래스만 activeClass로 남거나 학생 폼의 classId가 사용자가 의도한 클래스와 어긋나는 경우다. 학생 저장 직전 classId와 실제 클래스 목록을 확인해 불일치를 줄인다.
- 클래스 관리는 현재 선택, 수정, 학생 추가 중심이므로 제거 버튼과 복수 과정 선택/수정 로직을 추가해야 한다. DB 삭제는 기존 데이터 보호 원칙 때문에 학생이 있는 클래스 제거는 차단하거나 명확히 처리하는 방향이 안전하다.
- 디자인 변경은 기능 구조를 바꾸지 않고 CSS 중심으로 진행한다. 왼쪽 제어패널은 너무 넓거나 답답하지 않게 줄이고, 오른쪽 학습 화면은 더 넓게 쓰며, 글씨는 `vw`가 아닌 CSS 변수와 브레이크포인트로 키운다.
- 검증 기준은 등록/관리 흐름 스모크, lint, verify, onefile, smoke DB, 단일 HTML과 모바일 반영, Cloudflare 운영 배포, Windows 설치 파일 갱신까지다.
- 구현 완료: 복수 과정 클래스 저장 후 첫 번째 선택 과정 클래스를 다시 activeClass로 확정하고 학생 등록 폼의 classId, 학년, 계정 입력값을 바로 새 학생 등록 상태로 초기화한다. 학생 저장은 선택 클래스 존재 여부를 검사하고, 저장 후 `selectLearningRosterStudent`로 activeClass와 activeStudent를 다시 맞춘다.
- 구현 완료: 학생 이름, 학년, 학생 로그인 아이디, 비밀번호를 한 번에 저장할 때 실패 메시지가 조용히 사라지지 않도록 클래스 저장과 학생 저장 모두 try/catch로 사용자 메시지를 표시한다. 학생 계정 저장 성공 메시지는 관리자 승인 필요 상태까지 안내한다.
- 구현 완료: 클래스 관리는 같은 선생님과 같은 클래스 이름의 여러 과정 클래스를 한 카드로 묶어 표시한다. 수정 버튼은 묶인 과정 전체를 클래스 등록 폼의 복수 선택 상태로 불러오고, 학생 추가는 해당 묶음의 현재 대표 클래스로 연결한다.
- 구현 완료: 클래스 제거 버튼을 추가했다. 등록 학생이 있는 클래스는 제거를 차단하고, 학생이 없는 클래스는 `deletedAt` 복구 표시를 남겨 서버 DB에는 보존하면서 화면 목록에서는 숨긴다.
- 디자인 구현 완료: 왼쪽 제어패널은 272px 기준으로 줄이고 오른쪽 학습 영역을 넓혔다. 글씨 크기는 CSS 변수와 브레이크포인트로 키웠고, `clamp()` 기반 viewport 글씨 스케일은 제거했다. 제어패널 스크롤바는 thin/투명 계열로 줄였다.
- 디자인 구현 완료: 학습 히어로, 대시보드, 제어 카드, 클래스 관리 카드에 반투명 표면과 가벼운 블러, 얇은 테두리, 큰 버튼/입력 글씨를 적용해 더 현대적인 교육 사이트 느낌으로 정리했다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db`를 모두 통과했다. 추가 브라우저 DOM 점검에서 `--readable-text=18px`, `--hero-title=50px`, 학습 레이아웃 `272px 1134px`, 제어패널 스크롤바 `thin`, CSS 내 `clamp()` 없음 상태를 확인했다.
- 산출물 갱신 완료: 단일 HTML 3개 파일 SHA256은 모두 `5BF951B2E96B35397A400B3B156836628F8586CE33FA94AE24AC237F3FE6B457`다. 모바일 서비스워커 캐시는 `codex-math-mobile-v72`로 올렸다.
- 운영 배포 완료: `npm run pages:deploy` 성공. 새 preview URL은 `https://e3669d93.prunet-math-ebook.pages.dev`이고 운영 URL `https://prunet-math-ebook.pages.dev/`에서 `assets/index-B5KqaBEq.js`, `assets/index-BvvKLRBL.css` 반영을 확인했다.
- Windows 설치 파일 갱신 완료: `app/release/푸르넷수학 전자북-설치-1.0.0.exe` SHA256은 `E4DA55D787AB243BABB7ECC3C1697D3874CAAA80D7157E50AD3D3CAF4AA648A2`, blockmap은 `853D9680E5975E121C35062027702CC46EC4E409437CBB21ECB1D662B465752D`, app.asar는 `9B600031C94DAB99A545FA73F9198897F9BF8059A8E85C7EBFECF3F9C8D40E53`, `app/release.zip`은 `62C2D9B09FD205DD79387FA4EBF0C22E33F2A8C51DC0A5AD2239DD2A4C00B635`다.
# 학생 선택 학습 라벨과 학생 관리 고도화 (2026-05-19)
- 요청 목표는 왼쪽 제어패널의 학생 선택 학습에서 같은 `5학년 3월` 버튼이 중복 표시되는 문제를 일반 과정과 연산 과정으로 구분하고, 클래스 관리와 학생 관리 흐름을 실제 수정 중심으로 정리하는 것이다.
- 구현 기준은 기존 학습 데이터와 서버 DB를 삭제하지 않고, 단원 선택 UI 라벨만 보완하며, 학습 코칭 과제는 삭제 대신 `deletedAt` 표시로 숨기는 방향이 안전하다.
- 클래스 관리에서는 이름 영역을 눌러도 수정 폼이 열리게 하고, 학생 비밀번호 초기화는 모니터링 카드에서 빼서 `학생 등록` 옆 `학생 관리` 메뉴로 이동시키는 것이 사용자 흐름에 맞다.
- 검증 기준은 중복 단원 버튼 라벨 구분, 클래스명 클릭 수정, 과제 문구 수정·삭제, 학생 관리 메뉴의 아이디·비밀번호 수정과 초기화 동작 확인, 이후 lint/verify/onefile/smoke 및 배포 산출물 갱신이다.
- 구현 완료: 단원 선택용 `unitSelectionLabel`을 추가해 수학연산 과정은 `5학년 3월 연산`처럼 월 라벨에 연산 표시가 붙도록 했다. 일반 과정 라벨과 보고서용 기존 라벨은 그대로 유지한다.
- 구현 완료: 클래스 관리 카드의 클래스 이름 영역을 수정 버튼으로 바꾸고, 내부 접근성 라벨 충돌은 `과정 목록`으로 정리해 기존 `선택` 버튼과 함께 안정적으로 동작하게 했다.
- 구현 완료: 학습 코칭 과제 chip에 `수정`, `삭제` 버튼을 추가했다. 수정은 제목을 갱신하고 삭제는 `deletedAt` 표시로 숨겨 Cloudflare D1 payload에는 복구 가능한 기록을 남긴다.
- 구현 완료: 상단 관리 메뉴에서 `학생 등록` 오른쪽에 `학생 관리`를 추가했다. 학생 관리 카드에서 학생 아이디·비밀번호 수정 폼을 열고, 비밀번호 초기화는 이 화면에서 임시 비밀번호를 발급하도록 옮겼다.
- 검증 완료: `npm run lint`, `npm run verify`, `npm run onefile`, `npm run smoke:learning-db`가 통과했다. 운영 URL은 `https://prunet-math-ebook.pages.dev/`에서 `index-CUm__Evl.js`, `index-DjbVtTxu.css`를 참조하고 `/api/learning/snapshot`은 HTTP 200으로 확인했다.
- 산출물 갱신 완료: 단일 HTML 3개 SHA256은 모두 `93BB57CAABDD1AE18DCF8967CB425BE7379023B21A9AC70964D5959E6BF08076`이고 모바일 캐시는 `codex-math-mobile-v73`으로 올렸다. Windows 설치 EXE SHA256은 `09E631717D24086127A67F5BAF51CCE55360CC1995735E6B10A972615A376789`, `release.zip`은 `6F5DA3D4AA0D8287C79358CC93F3A79F65932286FC8F29B540A507F1FD605737`이다.

## 초중등 영어 전자북 구조·설계 루틴 문서화 (2026-05-19)
- 요청 목표는 푸르넷 수학 전자북에서 확립한 작업 루틴과 노하우를 바탕으로 초등 교육청 필수 영단어, 초등 영문법, 중등 교육청 필수 영단어, 중등 영문법 전자북을 만들기 위한 구조와 설계 루틴 문서를 먼저 만드는 것이다.
- 이번 작업은 앱 코드 수정이 아니라 문서화 작업이므로 `npm run lint`, `npm run verify`, `npm run onefile`은 실행 대상에서 제외했다. 검증 기준은 새 Markdown 파일 존재, 네 개 영어 콘텐츠 DB 구조 포함, 기존 수학 전자북 운영 루틴 반영, `checklist.md`와 `context-notes.md` 갱신 여부로 잡았다.
- 새 문서는 `강태훈샘_푸르넷영어책(26.05.19)/초중등_영어_전자북_구조_설계_루틴.md`에 만들었다. 내용에는 콘텐츠 DB와 사용자·학습 DB 분리, additive migration 원칙, 영단어·영문법 스키마, 화면 구조, 학습 흐름, 보고서 지표, 검증·배포 루틴, 다음 작업 체크리스트를 포함했다.
- 교육청 필수 영단어 자료는 지역과 연도에 따라 달라질 수 있으므로 실제 콘텐츠 입력 전에는 최신 출처, 발행 연도, 사용 가능 범위, 원본 항목 수를 먼저 검증하고 별도 출처 검증 보고서에 남기는 기준으로 정리했다.
- 후속 요청으로 영어 파닉스 교실을 추가했다. 파닉스는 영단어 전 단계의 별도 학습 흐름이므로 `english_phonics_classroom` 콘텐츠 DB, 음가·입 모양·블렌딩·디코딩 스키마, 파닉스 기본 학습 흐름, 파닉스 리포트 지표, 구현 순서와 다음 작업 체크리스트에 독립 항목으로 반영했다.
- 후속 요청으로 영어 내신 대비반과 영어 리딩반을 추가했다. 내신 대비반은 `english_school_exam_textbook` 콘텐츠 DB로 두고 8종 영어 교과서별 출판사, 판본, Lesson, 본문 분석, 문법 분석, 단어 분석, 문장 분석, 학교 시험형 문제를 분리해 관리하도록 정리했다.
- 리딩반은 `english_reading_class` 콘텐츠 DB로 두고 지문, 장르, 난이도, 독해 스킬, 정답 근거, 요약·확장 쓰기 과제를 관리하도록 정리했다. 교과서 본문은 저작권 자료이므로 실제 수록 전 출판사, 판본, 학교 채택본, 사용 가능 범위를 확인하고 원문 전문보다 분석 메타데이터를 우선 저장하는 기준을 남겼다.
- 후속 요청으로 유치원 영어반과 영어 도서관을 추가했다. 유치원 영어반은 `english_kindergarten_class` 콘텐츠 DB로 두고 그림카드, 원어민 음성, 챈트, 몸동작 반응, 생활영어 표현, 가정 미션을 저장하도록 정리했다.
- 영어 도서관은 `english_library` 콘텐츠 DB로 두고 레벨별 서가, 도서 메타데이터, 오디오 키, 핵심 어휘, 이해 질문, 읽기 기록장, 독후활동 템플릿을 관리하도록 정리했다. 도서 원문, 표지, 오디오도 저작권 자료이므로 정식 라이선스가 있는 자료만 저장하고, 기본은 메타데이터와 자체 요약·독후활동 중심으로 운영하는 기준을 남겼다.
- 후속 요청으로 초등 영어 교과서를 추가했다. 초등 영어 교과서는 `english_elementary_textbook` 콘텐츠 DB로 두고 학년, 출판사, 학기, Lesson, 의사소통 표현, 듣기·말하기 대화, 단원 어휘, 읽기 요약, 쓰기 활동, 교실 활동, 복습 문제를 관리하도록 정리했다.
- 초등 영어 교과서는 내신 대비반과 목적이 다르므로 학교 수업 예습·복습 흐름으로 분리했다. 교과서 원문, 삽화, 음성은 저작권 자료이므로 실제 수록 전 출판사, 판본, 학교 채택본, 사용 가능 범위를 확인하고 기본은 단원 메타데이터와 자체 제작 활동문으로 구성하는 기준을 남겼다.
- 후속 요청으로 영어 노래방과 영어 동화책을 추가했다. 영어 노래방은 `english_karaoke_class` 콘텐츠 DB로 두고 노래 제목, 레벨, 주제, 핵심 표현, 가사 학습 단위, 가사 하이라이트 타이밍, 반주·가이드 음성, 발음·리듬 포인트, 녹음 과제를 관리하도록 정리했다.
- 영어 동화책은 `english_storybook_class` 콘텐츠 DB로 두고 장면별 요약, 읽어주기 음성, 등장인물 역할극, 핵심 어휘, 반복 문장, 이해 질문, 이야기 순서, 다시 말하기, 독후활동 템플릿을 관리하도록 정리했다. 노래 가사·음원과 동화 원문·삽화·오디오는 저작권 자료이므로 정식 라이선스 또는 자체 제작 콘텐츠를 우선하는 기준을 남겼다.
- 후속 요청으로 영어 듣기, 영어 말하기, 영어 읽기, 영어 쓰기를 추가했다. 영어 듣기는 `english_listening_class` 콘텐츠 DB로 두고 대화·지시문·시험형 듣기, 대본, 받아쓰기, 섀도잉, 정답 근거를 관리하도록 정리했다.
- 영어 말하기는 `english_speaking_class` 콘텐츠 DB로 두고 따라 말하기, 역할극, 질문·응답, 발표, 녹음 과제, 교사용 피드백 기준을 관리하도록 정리했다. 영어 읽기는 기존 `english_reading_class` 리딩반과 분리해 `english_reading_fluency` DB로 두고 소리내어 읽기, 끊어 읽기, 시간 읽기, 녹음, 유창성 피드백을 관리하도록 정리했다.
- 영어 쓰기는 `english_writing_class` 콘텐츠 DB로 두고 단어 쓰기, 문장 완성, 문단 쓰기, 주제 글쓰기, 첨삭, 다시 쓰기, 포트폴리오 저장을 관리하도록 정리했다. 리딩반은 계속 독해 스킬 중심으로 유지하고, 읽기반은 유창성 중심으로 분리하는 기준을 남겼다.
- 후속 요청으로 현재 영어 프로젝트 구성을 미국 영어교육 전문가와 영국 영어교육 전문가 관점에서 최대치로 구체화했다. 공식 기준 확인 후 Common Core, ACTFL, WIDA, 영국 National Curriculum, DfE Reading Framework, CEFR형 `can-do` 성취문을 상위 설계 프레임으로 묶고, 16개 트랙을 입문·흥미, 소리·문자, 교과·내신, 문해력·산출 축으로 조직했다.
- 미국식 표준 기반 문해력은 목표 성취문, 수행 과제, 평가 증거, 보충 루틴 중심으로 반영했다. 영국식 초기 문해력은 systematic synthetic phonics, decodable text, 반복 읽기, reading for pleasure 중심으로 반영했다.
- 모든 콘텐츠 item에 `learningObjective`, `skillStrand`, `cefrCanDo`, `englishVariant`, `sourceLicenseStatus`, `evidenceType`, `teacherAction`을 붙이는 기준을 추가했다. 교사용 운영 대시보드는 오늘 수업 큐, 기능별 프로필, 파닉스·읽기 결손, 교과·내신 관리, 산출물 포트폴리오, 미국·영국 변이 검토, 리포트 발행 영역으로 구성했다.
- 후속 요청으로 TESOL 전문 영어교육 과정에 맞춰 현재 영어 학습법을 다시 고도화했다. TESOL 6 Principles, TESOL standards, Cambridge CELTA course topics, British Council CPD Framework를 확인하고 학습자 분석, 언어 분석, 네 기능 수업 설계, 수업 계획, 교수 기술, 지속 평가, 교사 공동체 관점으로 프로젝트 설계를 확장했다.
- 모든 Lesson을 `diagnose → prepare → notice → practice → communicate → feedback → reflect` 루틴으로 재정의했다. 언어 분석은 form, meaning, use, pronunciation, appropriacy, common errors, CCQ, model sentence 기준으로 보강했다.
- 콘텐츠 공통 메타데이터에 `tesolStage`, `languageAnalysis`, `interactionPattern`, `scaffolding`, `ccqIcq`, `reflectionPrompt`를 추가했다. 교사용 TESOL 수업안 템플릿에는 main aim, subsidiary aim, learner profile, anticipated problems, solutions, materials, procedure, CCQ·ICQ, assessment evidence, feedback plan, reflection을 포함했다.
- 후속 요청으로 `강태훈_푸르넷영어_자기주도학습_학원형(26.05.19).md` 요청 기록과 영어 설계 문서를 기반으로 HTML5·JavaScript MVC 영어 학습 프로그램을 만들기로 했다. 기존 수학 Vite 앱을 직접 섞지 않고 `강태훈샘_푸르넷영어책(26.05.19)/mvc-english-learning`에 독립 실행형 앱을 만든다.
- 구현 기준은 브라우저에서 바로 열리는 HTML5 앱, Model·View·Controller 분리, 16개 트랙 카탈로그, TESOL 단계 학습 플로우, 듣기·말하기·읽기·쓰기 상호작용, 교사용 대시보드, localStorage 기반 학습 기록 저장이다. 검증 기준은 HTML·JS 문법 점검, 핵심 파일 존재 확인, 브라우저 실행 가능성 확인이다.
- 구현 완료: `mvc-english-learning/index.html`, `assets/styles.css`, `js/data.js`, `js/models.js`, `js/views.js`, `js/controllers.js`, `js/app.js`, `README.md`를 만들었다. 16개 트랙 필터, TESOL 7단계 탭, 언어 분석 카드, 퀴즈, 받아쓰기, TTS 듣기, 말하기 인식 fallback, 읽기 타이머, 쓰기·성찰 포트폴리오, 교사용 TESOL 대시보드를 포함했다.
- 검증 완료: `node --check`로 5개 JavaScript 파일 문법을 확인했다. 시스템 Chrome executablePath를 지정한 Playwright smoke에서 `file:///.../index.html`을 열고 트랙 16개 렌더링, 말하기 트랙 선택, practice 단계 퀴즈 정답 처리, localStorage 기록 생성을 확인했다.
- 후속 요청으로 영단어와 영문법을 자기주도 학습 루틴으로 다시 프로그래밍한다. 최신 영어교육 흐름은 근거 기반 구어 상호작용, 문맥 기반 어휘, 인출 연습, 메타인지, human-centred AI, 음성·텍스트 인터랙션을 반영하고, 앱에는 단어와 문법 전용 루틴 엔진을 추가한다.
- 구현 기준은 영단어의 `문맥 노출 → 발음·의미 → 인출 → 문장 사용 → 간격 복습` 루틴과 영문법의 `예문 발견 → form·meaning·use 분석 → 오류 수정 → 문장 변환 → 자유 산출` 루틴이다. 검증은 JavaScript 문법 검사와 브라우저 스모크에서 단어·문법 인터랙션이 실제 저장되는지 확인하는 것으로 잡는다.
- 구현 완료: `js/data.js`에 `vocabularyBank`와 `grammarPatterns`를 추가하고, `js/models.js`에 단어 숙달도와 문법 숙달도 저장, 단어 인출, 단어 문장 산출, 문법 오류 수정, 문장 변환, 자유 산출 저장 로직을 추가했다.
- 구현 완료: `js/views.js`에 `Vocabulary Self-Study Lab`과 `Grammar Discovery Lab`을 추가하고, `js/controllers.js`에 단어·문법 전용 이벤트를 연결했다. `assets/styles.css`에는 전문 학습 랩과 루틴 단계 UI를 추가했고, `README.md`에도 새 루틴을 기록했다.
- 검증 완료: `node --check`로 5개 JavaScript 파일 문법을 통과했다. Chrome 기반 Playwright smoke에서 초등 영단어 트랙의 단어 인출·문장 산출, 중등 영문법 트랙의 오류 수정·문장 변환·자유 산출을 실행했고 `localStorage`에 `wordMastery=1`, `grammarMastery=1`, `portfolio=2`, `evidence=5`가 저장되는 것을 확인했다.

## 유치원 학습 놀이터 기획 문서화 (2026-05-20)
- 요청 목표는 `푸르넷 유치원(26.05.20)` 폴더에 6세반과 7세반 아이들을 위한 초등학교 입학 준비용 유치원 학습 놀이터 기획서, 실천 계획, 프로그램 요소, 체크리스트를 만드는 것이다.
- 이번 작업은 앱 코드 수정이 아니라 문서화 작업이므로 `npm run lint`, `npm run verify`, `npm run onefile`은 실행 대상에서 제외했다. 검증 기준은 새 Markdown 문서 존재, 6세·7세 계획표 포함, 국어·수학·영어 교실 포함, 카드북·국어동화·영어동화·수학동화 포함, 개발 체크리스트 포함 여부로 잡았다.
- 새 문서는 `푸르넷 유치원(26.05.20)/푸르넷 유치원 학습 놀이터(26.05.20).md`에 작성했다. 내용에는 전체 목표, 기본 방향, 화면 구조, 6세반·7세반 12주 학습 계획표, 국어교실·수학교실·영어교실 구성, 카드북과 동화책 계획, 게임형 학습 요소, 프로그램 필수 요소, 데이터 구조 초안, 실천 계획, 주간 운영 예시, 교사용 리포트, 구현 메모, 검증 기준, 개발 체크리스트를 포함했다.
- 유치원생용 콘텐츠는 실제 아이가 누르고 듣고 말하는 흐름이 중요하므로 정답률 중심보다 참여 횟수, 반복, 발화, 읽기, 스티커 보상, 교사 관찰 리포트가 함께 저장되는 방향으로 정리했다.
- 동화 원문, 삽화, 음원은 저작권 위험이 있으므로 자체 제작 콘텐츠 또는 정식 라이선스를 확인한 자료만 수록하고, 문서에는 이를 별도 기준으로 남겼다.

## 유치원 학습 놀이터 HTML5·JavaScript MVC 구현 (2026-05-20)
- 요청 목표는 금방 만든 유치원 학습 놀이터 기획 문서를 실제로 실행 가능한 프로그램으로 구현하는 것이다.
- 구현 방향은 기존 영어 MVC 앱과 비슷하게 메인 Vite 수학 앱에 바로 섞지 않고 `푸르넷 유치원(26.05.20)/kindergarten-learning-playground`에 독립 실행형 HTML5·JavaScript MVC 앱을 만드는 것으로 잡았다. 이렇게 하면 `index.html`을 바로 열 수 있고, 이후 단일 HTML, 모바일 PWA, 설치 앱으로 흡수하기 쉽다.
- 구현 파일은 `index.html`, `assets/styles.css`, `assets/playground-scene.svg`, `js/data.js`, `js/models.js`, `js/views.js`, `js/controllers.js`, `js/app.js`, `scripts/smoke.mjs`, `README.md`이다.
- 6세반과 7세반 각각 국어·수학·영어 과목별 카드북, 동화책, 게임을 1개씩 넣어 총 18개 샘플 활동을 구성했다. 카드 넘기기, 동화 장면 넘기기, 듣기 버튼, 게임 정답 확인, 활동 완료, 보상 스티커, `localStorage` 기록 저장, 교사용 입학 준비 리포트를 포함했다.
- 검증 기준은 `node --check` 기반 JavaScript 문법 검사와 Playwright 스모크에서 파일 URL로 앱을 열고 7세반 수학 카드북·게임 완료, 교사용 리포트 렌더링, `localStorage` 기록 저장을 확인하는 것이다.
- 검증 완료: `npm run check` 통과. `npm run smoke`에서 파일 URL로 앱을 열고 초기 국어 활동 3개 렌더링, 7세반 수학교실 선택, `math-7-number-cardbook` 카드 넘기기와 완료, `math-7-add-game` 정답 처리와 완료, 교사용 리포트 렌더링, `localStorage`의 7세반·수학교실·완료·정답·보상 기록 저장을 확인했다.

## 유치원 학습 놀이터 이미지·3D·동적 상호작용 고도화 (2026-05-20)
- 요청 목표는 학습 내용이 빈약하고 이미지가 없다는 문제를 해결하고, 학습용 이미지, 게임용 이미지, 3차원 로직, 동적 상호 반응을 추가해 입체적인 학습 놀이터로 만드는 것이다.
- 구현 기준은 유치원생이 실제로 보고 누를 수 있는 이미지와 조작 요소를 우선하고, 기존 독립 실행형 `index.html` 더블클릭 실행을 깨지 않는 것이다.
- 이미지 보강 완료: `assets/images/`에 국어·수학·영어 카드북, 동화, 게임용 자체 제작 SVG 9종을 추가했다. 기존 활동 목록과 상세 화면, 카드북, 동화 장면에 이미지를 연결했다.
- 학습 내용 보강 완료: `js/data.js`에서 각 활동에 준비놀이, 손 조작 미션, 교사 질문, 감각 태그를 자동 부여했다. 화면에는 `준비놀이`, `손 조작 미션`, `교사 질문` 3개 확장 학습 카드로 표시한다.
- 3D 구현 완료: Three.js를 의존성으로 추가하고 `js/three-playground.mjs`에 3D 활동 블록, 현재 활동 이미지 패널, 정답 큐브, 보상 별, 과목 캐릭터, hover 확대, 회전 애니메이션, 드래그 회전, 클릭 이벤트를 구현했다.
- file URL 이슈 처리: Chrome은 `file://`에서 ES module 로딩을 CORS로 차단하므로 `esbuild`를 devDependency로 추가하고 `js/three-playground.bundle.js` 일반 스크립트 번들을 생성해 `index.html`에서 불러오게 했다.
- 스모크 보강 완료: `scripts/smoke.mjs`에서 활동 이미지 로딩, 데스크톱 3D 캔버스 크기와 WebGL 픽셀, 애니메이션 픽셀 변화, 3D 정답 큐브 클릭, 모바일 3D 캔버스 픽셀, 가로 overflow 없음, 데스크톱·모바일 스크린샷 생성을 검증한다.
- 검증 완료: `npm run check` 통과. `npm run smoke` 통과. 스크린샷은 `scripts/.smoke-output/desktop-3d.png`, `scripts/.smoke-output/mobile-3d.png`에 생성됐다.

## 유치원 학습 놀이터 교육용 게임 앱 전면 개편 (2026-05-20)
- 요청 목표는 기존 프로그램이 재미와 반응성이 부족하다는 문제를 해결하고, 최근 인기 학습 프로그램과 앱의 패턴을 참고해 교육용 게임 앱 형식으로 디자인과 학습 데이터를 전부 고치는 것이다.
- 참고 기준은 Khan Academy Kids의 캐릭터·책·게임·창작 활동과 교사용 진행 확인, Lingokids의 structured lesson과 자기 속도 학습, ABCmouse의 티켓·보상 시스템, Duolingo ABC의 hands-on reading lesson과 tracing·drag-and-drop 류의 다감각 활동, Teach Your Monster to Read의 월드·미니게임·파닉스 진행 구조다. 특정 앱의 UI나 캐릭터를 복제하지 않고 공통 패턴만 자체 디자인으로 반영했다.
- 데이터 전면 개편 완료: `js/data.js`를 72개 퀘스트 생성형 데이터로 교체했다. 6세·7세, 국어·수학·영어, 과목별 4개 월드, 카드북·동화·게임 활동이 생성된다.
- 게임화 데이터 추가 완료: 각 활동에 레벨, 난이도, XP, 코인, 배지, 미니게임 타입, 스킬 코드, 퀘스트 설명, 준비놀이, 손 조작 미션, 교사 질문, 감각 태그를 넣었다.
- 모델 개편 완료: `js/models.js`에 XP, 코인, 연속 완료, 등급, 캐릭터 반응, 최근 퀘스트 로그 저장을 추가했다.
- 화면 개편 완료: `js/views.js`에 게임 HUD, 레벨·XP·코인·연속 완료 표시, 캐릭터 반응, 퀘스트 목표판, 보상 미터, 최근 퀘스트 로그를 추가했다.
- 상호작용 개편 완료: `js/controllers.js`에 정답·완료 효과음과 XP 폭죽 애니메이션을 추가했다.
- 3D 수정 완료: `js/three-playground.mjs`의 카메라가 3D 월드를 중앙으로 바라보게 조정했다. `file://` CORS를 피하기 위해 3D 활동 패널은 외부 SVG 텍스처 대신 캔버스 텍스처로 직접 그린다.
- 버그 수정 완료: 게임 문제 영역에서 `undefined`가 보이던 원인은 게임 round가 `prompt` 대신 `clue`를 쓰는데 렌더러가 `prompt`만 읽어서 생긴 문제였다. `prompt || clue` fallback으로 수정했다.
- 검증 완료: `npm run check` 통과. `npm run smoke` 통과. 추가 확인에서 모바일 `undefined? false`를 확인했다. 새 스크린샷은 `scripts/.smoke-output/desktop-3d.png`, `scripts/.smoke-output/mobile-3d.png`에 생성됐다.

## 유치원 ROOT 관리자 모니터링 화면 (2026-05-20)
- 요청 목표는 `푸르넷 유치원(26.05.20)/kindergarten-learning-playground`에서 교사용 버튼 옆에 관리자 버튼을 추가하고, 교사용·학생용 아이디와 비밀번호 및 학습 콘텐츠 전체를 ROOT 관리자 화면에서 관리하는 것이다.
- 구현 기준은 현재 독립 실행형 단일 HTML 앱 구조를 유지하는 것이다. 서버 인증을 새로 만들지 않고 localStorage roster에 교사·학생 `username`, `password` 필드를 추가하고, 기존 데이터에는 기본 아이디와 비밀번호를 자동 보강하도록 했다.
- 상단 헤더는 `회원가입`, `학생용`, `교사용`, `관리자` 순서로 정리했다. `관리자` 버튼은 `admin-dashboard`로 진입하며, 관리자 모드에서는 새로고침으로 저장소 최신 roster와 콘텐츠 관리 상태를 다시 읽는다.
- ROOT 관리자 화면은 교사 계정 수, 등록 클래스 수, 학생 계정 수, 콘텐츠 코스 수, 평균 진도를 요약하고, 전체 학생 진행률을 기존 Three.js 모니터링 장면으로 보여준다.
- 계정 관리는 교사용과 학생용을 나눠 아이디와 비밀번호를 바로 수정하는 폼으로 구성했다. 콘텐츠 관리는 6세·7세 × 국어·수학·영어 6개 코스별 운영 상태와 운영 메모를 `contentAdmin`에 저장한다.
- 검증 완료: `npm run check`, `npm run smoke` 통과. Edge 파일 실행 점검에서 관리자 버튼, ROOT 대시보드, 계정 수정 저장, 콘텐츠 운영 상태 저장, 3D 캔버스 출력, 모바일 가로 overflow 없음이 확인됐다.

## 유치원 학습 놀이터 Cloudflare Pages 배포 (2026-05-20)
- 요청 목표는 지금까지 작업한 유치원 앱을 `https://purunet-kindergarten.pages.dev` 주소에서 홈페이지로 작동하게 업데이트하는 것이다.
- 기존 루트 `wrangler.toml`은 수학 전자북용 `purunet-math-ebook` 설정이어서 유치원 앱 배포에는 사용하지 않았다. Wrangler로 `purunet-kindergarten` Pages 프로젝트를 새로 생성했다.
- 배포 전 `푸르넷 유치원(26.05.20)/kindergarten-learning-playground`에서 `npm run check`와 `npm run smoke`를 실행했고 모두 통과했다.
- 운영 배포에는 앱 실행에 필요한 `index.html`, `assets`, `js`, `vendor`만 포함했다. 문서, 스크립트, 패키지 파일은 운영 사이트에 노출하지 않도록 임시 배포 폴더에서 제외했다.
- 배포 명령은 `npx wrangler pages deploy "$env:TEMP\purunet-kindergarten-pages" --project-name purunet-kindergarten --branch main`으로 실행했다. Wrangler는 9개 파일 업로드와 배포 완료를 반환했다.
- 운영 검증 완료: `https://purunet-kindergarten.pages.dev/`는 HTTP 200이고 제목은 `푸르넷 유치원`이다. `assets/styles.css`, `js/models.js`, `js/views.js`, `vendor/three.min.js`도 모두 HTTP 200으로 확인했다.
- Edge 운영 URL 점검에서 홈 화면, 관리자 버튼, ROOT 관리자 대시보드, 3D 캔버스 렌더링이 통과했다.

## 유치원 학습 놀이터 Cloudflare D1 병행 동기화 (2026-05-20)
- 요청 목표는 사이트의 학습용 데이터, 학습자 데이터, 교사 데이터를 Cloudflare 전용 DB와 현재 프로젝트 DB에 병행 저장하고 동기화하는 것이다.
- 현재 프로젝트 DB는 기존 브라우저 `localStorage`이며, 이를 제거하지 않고 Cloudflare D1을 추가 저장소로 붙였다. D1 이름은 `purunet_kindergarten_learning_db`, 바인딩 이름은 `KINDERGARTEN_DB`다.
- D1 스키마는 전체 snapshot 백업용 `sync_snapshots`와 조회용 `teachers`, `classes`, `students`, `student_progress`, `learning_content`, `content_admin` 테이블로 구성했다.
- Cloudflare Pages Advanced Worker `_worker.js`를 추가해 `/api/kindergarten/sync`를 처리한다. 같은 origin PUT만 저장하고, GET은 snapshot과 조회 테이블 데이터를 반환한다.
- 브라우저 쪽에는 `js/cloud-sync.js`를 추가했다. `models.js`는 localStorage 저장 후 운영 HTTPS 환경에서 Cloudflare D1 저장을 debounce로 병행 실행하고, 앱 시작 및 새로고침 시 D1 snapshot을 받아 localStorage와 병합한다.
- 배포 전 `npm run check`, `npm run smoke`가 통과했다. 운영 URL에서 Edge로 교사·학생 등록을 수행한 뒤 `/api/kindergarten/sync`와 원격 D1 SQL 조회에서 teachers 1, classes 1, students 1, progress 1, content 6 저장을 확인했다.
- 검증 후 운영 DB의 더미 교사·학생·진행 데이터와 활성 snapshot은 삭제했다. 현재 D1에는 학습 콘텐츠 6개만 남아 있다.
## 유치원 Google 관리자 인증과 영어·수학 통합 포털 (2026-05-21)
- 요청 목표는 유치원 ROOT 관리자 화면을 Google 인증 이후에만 열고, 기존 `https://purunet-math-ebook.pages.dev/`와 `https://purunet-english-ebook.pages.dev/`를 `푸르넷 영어 수학 학원` 신규 포털에서 선택할 수 있게 만드는 것이다.
- 유치원 앱은 순수 HTML/JS 구조라 Google Identity Services 프런트엔드 게이트를 적용했다. 관리자는 Google OAuth 웹 Client ID와 허용 이메일을 저장한 뒤, ID 토큰의 audience, 이메일, 이메일 확인 여부, 만료 시간을 통과해야 `admin-dashboard`로 이동한다.
- 신규 포털은 `푸르넷 영어 수학 학원(26.05.21)/academy-portal`에 만들었다. 첫 화면에는 상단 `회원가입`, `학생용`, `교사용`, `관리자` 버튼과 `푸르넷 수학`, `푸르넷 영어` 선택 카드가 있고, 배경은 Three.js 기반 3D 입체 포털 장면이다.
- 요청 주소 `purunet_academy.pages.dev`는 밑줄 때문에 DNS 호스트명으로 사용할 수 없어 Cloudflare Pages 프로젝트는 `purunet-academy`로 생성했다. 운영 주소는 `https://purunet-academy.pages.dev/`이다.
- 검증 완료: 유치원 `npm run check`, `npm run smoke` 통과. 로컬·운영 Playwright에서 신규 포털 3D 캔버스 비공백, 수학·영어 링크, 권한 버튼, 모바일 390px overflow 0을 확인했고, 운영 유치원 사이트에서 Google 관리자 게이트 목 인증 후 ROOT 대시보드 진입을 확인했다.

## 푸르넷 영어 수학 학원 통합 학습 앱 재구축 (2026-05-21)
- 사용자 정정에 따라 기존 `purunet-academy` 외부 링크 게이트를 폐기하고, 수학·영어 데이터를 앱 내부에서 직접 학습하는 통합 사이트로 다시 만들었다.
- `푸르넷 영어 수학 학원(26.05.21)/academy-portal/js/learning-data.js`는 수학 1~6학년 개념 72개, 수학 1~6학년 연산 72개, 영어 16트랙과 영어 집중 코스를 합쳐 총 173개 학습 모듈을 생성한다.
- `js/app.js`는 과목 탭, 코스 목록, 카드북, 대표 문제 게임, 음성 듣기, 학습 지도, localStorage 진도 저장, 회원가입, 학생용 현재 학습, 교사용 모니터링, 관리자 콘텐츠 인벤토리를 렌더링한다.
- 3D 환경은 단순 게이트가 아니라 수학 탑과 영어 탑, 학습자 오브젝트가 있는 학습 캠퍼스로 바꿨고, 과목과 진행률에 따라 학습자 오브젝트가 반응한다.
- 검증 완료: `node --check js/learning-data.js`, `node --check js/app.js`, 로컬 Playwright, 운영 Playwright를 통과했다. 운영 URL은 `https://purunet-academy.pages.dev/`이고, 운영 HTML에는 기존 외부 수학·영어 링크 문자열이 남아 있지 않다.

## 중등 내신 영어 8종 교과서 분석 사이트 (2026-05-21)
- 이번 요청은 기존 `purunet-academy`를 중등 내신 영어 대비반까지 확장하는 작업이다.
- 구현은 8개 출판사 그룹, 중1·중2·중3, 단원별 본문 분석·단어·문장 암기·자습서 정리·평가문제집 대비를 앱 내부 학습 과목으로 추가하는 방향으로 잡았다.
- 교과서 본문, 자습서, 평가문제집 원문은 저작권 자료이므로 자동 수집하거나 전문을 코드에 넣지 않는다. 교사가 가진 정식 자료를 입력하면 localStorage에서 분석과 문제를 생성하는 방식으로 처리한다.
- 검증 기준은 중등 영어 데이터 카운트, 문법 검사, 빌드, 브라우저 스모크다.
- 구현 완료: `academy-portal/js/middle-english-textbooks.js`에 8개 출판사 그룹, 중1·중2·중3, 총 192개 Lesson 분석 세트를 추가했다.
- 구현 완료: `middle-english` 과목을 기존 수학·영어 통합 카탈로그, 문제 생성, 학습 화면, 관리자 콘텐츠 인벤토리에 연결했다.
- 검증 완료: 새 데이터 카운트 8개 출판사, 3개 학년, 24개 코스, 192개 중등 영어 모듈을 확인했고, 전체 모듈은 282개다.
- 검증 완료: `node --check`, `npm run build`, 로컬 Playwright 스모크가 통과했다. `lint/verify/onefile`은 이 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://07646f6b.purunet-academy.pages.dev`다.

## 초등·중등 필수 영단어와 영문법 학습 사이트 (2026-05-21)
- 이번 요청은 `academy-portal` 안에 초등 필수 영단어, 중등 필수 영단어, 초등 영문법, 중등 영문법 과목을 추가하는 작업이다.
- 2022 개정 영어과 교육과정과 기본 어휘 목록 연구를 기준으로 삼되, 전체 단어 목록은 교사용 붙여넣기 확장 방식으로 처리한다.
- 검증 기준은 새 데이터 카운트, JS 문법 검사, 빌드, 로컬·운영 브라우저 스모크다.
- 구현 완료: `academy-portal/js/english-core-sites.js`를 추가하고 네 과목 총 48개 모듈을 만들었다.
- 구현 완료: 단어는 기본 대표 세트와 교사용 붙여넣기 저장을 제공하고, 문법은 초등 12개·중등 14개 문법 루틴을 제공한다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://36e4f4dc.purunet-academy.pages.dev`다.

## 초등 내신 영어 8종 교과서 학습 세트 (2026-05-21)
- 이번 요청은 `academy-portal`에 초등 내신 영어 8종 교과서 학습 세트를 추가하는 작업이다.
- 교과서 원문은 저작권 자료이므로 기본 탑재하지 않고, 교사용 입력형 분석과 학습 루틴을 제공한다.
- 검증 기준은 새 데이터 카운트, JS 문법 검사, 빌드, 로컬·운영 브라우저 스모크다.
- 구현 완료: 8개 채택판 그룹, 초3~초6, 총 352개 Lesson 학습 세트를 추가했다.
- 구현 완료: 대화문, 단원 단어, 파닉스, 핵심 문장, 수행평가, 단원평가 대비와 교사용 입력 저장을 기존 앱 흐름에 연결했다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://980c206a.purunet-academy.pages.dev`다.
- 운영 검증 완료: 전체 682개 모듈, 8개 과목 카드, 초등 내신 영어 352개 학습 세트, 교사용 대화문 localStorage 저장, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 고등 내신 영어 교과서·고등 영문법·고등 필수 영단어 (2026-05-21)
- 이번 요청은 `academy-portal`에 고등 내신 영어 교과서 분석, 고등 필수 영단어, 고등 영문법 과목을 추가하는 작업이다.
- 공개 자료 확인 기준으로 2022 개정 고등학교 1학년 영어 교과서는 공통영어1·공통영어2 읽기 자료 위계가 중요하므로, 앱은 공통영어1·공통영어2·영어Ⅰ·영어Ⅱ 단원 흐름을 제공한다.
- 사용자 요청은 8종 세트이므로 8개 대표 채택판 그룹을 기본으로 두고, 복수 저자판·학교별 채택판명은 교사용 입력 메모로 보정할 수 있게 한다.
- 교과서 원문은 저작권 자료이므로 기본 탑재하지 않고, 교사용 입력형 분석과 고등 내신 문제 루틴을 제공한다.
- 검증 기준은 새 데이터 카운트, JS 문법 검사, 빌드, 로컬·운영 브라우저 스모크다.
- 구현 완료: `academy-portal/js/high-english-textbooks.js`를 추가하고 8개 대표 채택판 그룹, 공통영어1·공통영어2·영어Ⅰ·영어Ⅱ, 총 256개 고등 내신 영어 분석 세트를 만들었다.
- 구현 완료: `academy-portal/js/english-core-sites.js`에 고등 필수 영단어 12개 코스와 고등 영문법 16개 코스를 추가했다.
- 구현 완료: 고등 본문 구조, 핵심 어휘, 구문 분석, 어법 포인트, 문장 암기, 서술형, 평가문제집 대비 루틴을 기존 문제 생성·듣기·진도·관리자 흐름에 연결했다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://5e32906e.purunet-academy.pages.dev`다.
- 운영 검증 완료: 전체 966개 모듈, 11개 과목 카드, 고등 내신 영어 256개, 고등 필수 영단어 12개, 고등 영문법 16개, 교사용 본문 localStorage 저장, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 중등 내신 수학 (2026-05-21)
- 이번 요청은 `academy-portal`에 중등 내신 수학 과목을 추가하는 작업이다.
- 2022 개정 중학교 수학의 4개 영역인 수와 연산, 변화와 관계, 도형과 측정, 자료와 가능성을 기준으로 단원 카탈로그를 구성한다.
- 범위는 중1·중2·중3 단원별 내신 대비이며, 교과서 원문이 아니라 개념, 기본, 유형, 서술형, 고난도, 오답 루틴과 교사용 시험범위 메모를 제공한다.
- 검증 기준은 새 데이터 카운트, JS 문법 검사, 빌드, 로컬·운영 브라우저 스모크다.
- 구현 완료: `academy-portal/js/middle-math-exams.js`를 추가하고 중1·중2·중3 총 30개 중등 내신 수학 세트를 만들었다.
- 구현 완료: 각 세트는 개념 압축, 기본 계산, 대표 유형, 서술형, 고난도, 오답 클리닉 6개 루틴과 생성형 문제를 제공한다.
- 구현 완료: 교사용 시험범위·교재·오답 메모 입력을 localStorage에 저장하고, 기존 문제 생성·듣기·진도·관리자 권한 흐름에 연결했다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://679e2a6f.purunet-academy.pages.dev`다.
- 운영 검증 완료: 전체 996개 모듈, 12개 과목 카드, 중등 내신 수학 30개, 교사용 시험범위 localStorage 저장, 문제 생성, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 홈 화면 학년군 탭 메뉴 (2026-05-21)
- 이번 요청은 메인 3D 배경 아래에 나열된 과목 메뉴를 초등학생, 중학생, 고등학생 탭 아래의 세부 메뉴로 재구성하는 작업이다.
- 기존 과목 데이터, 문제 생성, 진도 저장, 관리자 흐름은 유지하고 홈 화면 과목 선택 UI만 바꾼다.
- 검증 기준은 JS 문법 검사, 빌드, 로컬·운영 브라우저에서 탭 전환·과목 선택·모바일 overflow를 확인하는 것이다.
- 구현 완료: 홈 화면을 초등학생, 중학생, 고등학생 탭과 세부 과목 패널 구조로 바꿨다.
- 검증 완료: `node --check`, `npm run build`, 로컬·운영 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://5640f984.purunet-academy.pages.dev`다.
- 운영 검증 완료: 초등 탭 5개 메뉴, 중등 탭 4개 메뉴, 고등 탭 3개 메뉴, 중등 수학 선택 후 30개 모듈 표시, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 중등 내신 국어·사회·과학·역사 (2026-05-21)
- 이번 요청은 `academy-portal` 중학생 탭 아래에 중등 내신 국어, 중등 내신 사회, 중등 내신 과학, 중등 내신 역사를 추가하는 작업이다.
- NCIC 2022 개정 교육과정 공개 자료를 참고해 과목별 단원 구조를 잡되, 교과서 원문은 수록하지 않고 내신 대비용 개념·자료 분석·문제 루틴으로 구성했다.
- 구현 완료: `js/middle-core-exams.js`를 추가해 국어 12개, 사회 12개, 과학 12개, 역사 12개, 총 48개 중등 내신 세트를 만들었다.
- 구현 완료: 각 세트는 개념 핵심, 자료·지문 분석, 대표 유형, 서술형, 고난도, 오답 클리닉 토픽과 생성형 문제를 제공한다.
- 구현 완료: `js/learning-data.js`, `js/worksheet.js`, `js/models.js`, `js/controllers.js`, `js/views.js`, `assets/styles.css`, `index.html`, `README.md`를 연결해 메뉴, 학습 화면, 문제 생성, 저장, 권한, 관리자 인벤토리를 반영했다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬 Playwright 스모크, 운영 Playwright 스모크가 통과했다. `npm run lint`, `npm run verify`, `npm run onefile`은 `academy-portal/package.json`에 스크립트가 없어 실행 불가했다.
- 배포 완료: `npx --yes wrangler pages deploy . --project-name purunet-academy --branch main` 성공, 최종 프리뷰는 `https://31461d1b.purunet-academy.pages.dev`다.
- 운영 검증 완료: `https://purunet-academy.pages.dev/`와 프리뷰 URL에서 전체 1044개 모듈, 중학생 탭 8개 카드, 국어·사회·과학·역사 각 12개 세트, 교사용 메모 localStorage 저장, 문제 생성, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 초등 내신 국어·수학·사회·과학·역사·한자·독서논술·문해력 (2026-05-22)
- 이번 요청은 `academy-portal` 초등학생 탭 아래에 초등 내신 국어, 초등 내신 수학, 초등 내신 사회, 초등 내신 과학, 초등 내신 역사, 초등 한자, 초등 독서논술, 초등 문해력을 추가하는 작업이다.
- NCIC 2022 개정 교육과정 공개 자료와 교육부 안내 자료를 참고해 과목별 학습 세트 구조를 잡는다.
- 초등 역사는 독립 정규 교과가 아니므로 초등 사회 속 역사 기초와 한국사 준비 루틴으로 해석한다.
- 초등 한자, 독서논술, 문해력은 교과서 원문 수록이 아니라 보충 학습과 내신 서술형 대비 세트로 구성한다.
- 검증 기준은 데이터 카운트, JS 문법 검사, `npm run build`, 로컬·운영 브라우저 스모크다.
- 구현 완료: `academy-portal/js/elementary-core-exams.js`를 추가해 신규 초등 8개 과목과 총 96개 학습 세트를 만들었다.
- 구현 완료: 초등학생 탭에 신규 8개 과목을 넣고, 각 학습 화면에 범위 입력, 분석 카드, 문제 생성, 진도 저장 흐름을 연결했다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬·운영 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://817c272c.purunet-academy.pages.dev`다.
- 운영 검증 완료: 전체 1140개 모듈, 초등학생 탭 13개 카드, 신규 초등 8개 과목 각 12개 세트, 교사용 메모 저장, 문제 생성, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 고등 내신 국어·수학·사회·과학 (2026-05-22)
- 이번 요청은 `academy-portal` 고등학생 탭 아래에 고등 내신 국어, 고등 내신 수학, 고등 내신 사회, 고등 내신 과학을 추가하는 작업이다.
- NCIC 2022 개정 교육과정 공개 자료와 고등학교 과목 구조 안내 자료를 참고해 과목별 학습 세트 구조를 잡는다.
- 고등 과목은 공통 과목과 주요 선택 과목 폭이 넓으므로 과목별 16개 세트, 총 64개 세트로 구성한다.
- 교과서 원문은 수록하지 않고 교육과정 단원 구조 기반의 내신 대비 루틴과 교사용 시험범위 입력 구조로 처리한다.
- 검증 기준은 데이터 카운트, JS 문법 검사, `npm run build`, 로컬·운영 브라우저 스모크다.
- 구현 완료: `academy-portal/js/high-core-exams.js`를 추가해 신규 고등 4개 과목과 총 64개 내신 세트를 만들었다.
- 구현 완료: 고등학생 탭에 신규 4개 과목을 넣고, 각 학습 화면에 범위 입력, 분석 카드, 문제 생성, 진도 저장 흐름을 연결했다.
- 검증 완료: `node --check`, 데이터 카운트, `npm run build`, 로컬·운영 Playwright 스모크가 통과했다. `lint/verify/onefile`은 하위 앱에 스크립트가 없어 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/` 운영 URL에 반영했고, 최종 프리뷰는 `https://756b0d6d.purunet-academy.pages.dev`다.
- 운영 검증 완료: 전체 1204개 모듈, 고등학생 탭 7개 카드, 신규 고등 4개 과목 각 16개 세트, 교사용 메모 저장, 문제 생성, 데스크톱 overflow 0, 모바일 390px overflow 0, 콘솔 오류 0, 400 이상 응답 0을 확인했다.

## 푸르넷 아카데미 Windows 설치 파일 (2026-05-22)
- 이번 요청은 최신 `academy-portal` 운영본을 PC 설치 파일로도 사용할 수 있게 갱신하는 작업이다.
- 기존 `app/release` 설치 파일은 수학 전자북 전용이므로, `academy-portal` 안에 별도 Electron 래퍼와 설치 산출물을 만든다.
- 설치 앱은 `https://purunet-academy.pages.dev/`를 우선 로드하고, 실패하면 설치 파일에 포함된 정적 파일을 연다.
- 검증 기준은 빌드, 설치 파일 생성, release 압축, 산출물 해시 기록이다.
- 구현 완료: `academy-portal/electron/main.cjs`와 `academy-portal/package.json`의 `installer:win` NSIS 설정을 추가했다.
- 검증 완료: `node --check`, `package.json` 파싱, `npm run build`, `npm run installer:win`이 통과했다.
- 설치 산출물 생성 완료: `academy-portal/release/푸르넷 아카데미-설치-1.0.0.exe`와 `academy-portal/release.zip`을 생성했다.
- 패키지 검증 완료: `app.asar` 내부에서 운영 URL, `js/high-core-exams.js`, `PurunetHighCore`, `high-korean` 포함을 확인했다.
- 최신 산출물 SHA256: 설치 EXE `6BD6CD2D6336FC741F224B8EDFC41542B3B9353C667AE904281EB5406378825D`, blockmap `0914753793E0E27C49B3B067D689192658767BE79AC38A0853AEDD304782847F`, app.asar `1186BA87D02C4B1B1DA46DA2BD123684A3E1F45A14AE542320BBD7ED31C04431`, release.zip `14AB99D8EA2FC08BAC4CD9C608E8FF104CD505105B6B383E34F1F05FB0CFEC0D`이다.

## 학생용 고등학생 탭 제한 (2026-05-22)
- 이번 요청은 학생용 홈 메뉴에서 고등학생 탭을 숨기고, 교사용에서만 고등학생 탭을 보이게 하는 작업이다.
- 교사용 역할은 기존에 모니터링 화면만 렌더링했으므로, 모니터링 아래 학습 메뉴도 함께 붙이는 방향으로 처리한다.
- 학생용으로 돌아올 때 고등 과목이 선택된 상태가 남아 있으면 초등 기본 과목으로 돌려 학생 화면에 고등 코스가 노출되지 않게 한다.
- 검증 기준은 학생용 탭 2개, 교사용 탭 3개, 학생용 전환 후 고등 코스 미노출, 빌드, 배포, 설치 파일 갱신이다.
- 구현 완료: 학생용은 초등학생·중학생 탭만 표시하고, 교사용은 초등학생·중학생·고등학생 탭을 표시하게 했다.
- 구현 완료: 교사용 모니터링 아래 학습 메뉴와 코스 목록을 붙여 교사용에서 고등학생 탭을 사용할 수 있게 했다.
- 구현 완료: 학생용 전환 시 고등 과목 상태를 초등 기본 과목으로 초기화하고, 학생용 고등 과목 선택을 차단했다.
- 배포 완료: `npm run deploy`를 설치 산출물 제외 임시 배포 방식으로 보정하고 `https://purunet-academy.pages.dev/`에 반영했다. 최종 프리뷰는 `https://8fce8b4c.purunet-academy.pages.dev`다.
- 검증 완료: 로컬과 운영 Playwright에서 학생용 탭 2개, 교사용 탭 3개, 교사용 고등 카드 7개, 전체 모듈 1204개를 확인했다.
- 설치 파일 갱신 완료: `academy-portal/release/푸르넷 아카데미-설치-1.0.0.exe`와 `academy-portal/release.zip`을 최신 UI 기준으로 다시 생성했다.
- 최신 산출물 SHA256: 설치 EXE `760F5BDD3D5188B8FE65CC583F64A7791785959F8260BDA48E1A28032D41386A`, blockmap `3CE061E351BDB04FE48C9C0DA7C64B20785186BC7EE90EEBFD703F42092C7E8F`, app.asar `CA89BE71D8D6FC9D90E7C8F52BDC19CEE0A6839DCA5B1F06C3517F9AD6F78ED9`, release.zip `AC53F6E5E376FA9BD68CB3721606C973D775369BA82557CE409F1DACD5AEBE11`이다.

## PC 설치 파일 재갱신 (2026-05-22)
- 이번 요청은 `academy-portal`의 PC 설치 파일을 최신 학생용 고등학생 탭 제한 UI 기준으로 다시 생성하는 작업이다.
- 검증 기준은 `npm run installer:win`, `app.asar` 내부 UI 로직 확인, `release.zip` 재압축, 산출물 해시 기록이다.
- 설치 파일 재생성 완료: `academy-portal`에서 `npm run installer:win`이 통과했다.
- 패키지 검증 완료: `app.asar` 내부에서 운영 URL, `visibleSubjectsForRole`, 교사용 학습 메뉴 렌더링, 고등학생 메뉴 차단 문구를 확인했다.
- `release.zip` 재압축 완료: 최신 `academy-portal/release/` 기준으로 다시 생성했다.
- 최신 산출물 SHA256: 설치 EXE `96B1F56940D5ABC85E05C8E1CD1FD1AFA6D1A33248DD7F63C17FEC2A47D44C31`, blockmap `EB9C927BC63C31FE0325B1A111C4A5972F57CE4136142AA691D00DB1A7E1B973`, app.asar `CA89BE71D8D6FC9D90E7C8F52BDC19CEE0A6839DCA5B1F06C3517F9AD6F78ED9`, release.zip `EC5B7D6F58D50789C0772BA514B9890B1F998289EF16828437AEE44DC09551B6`이다.

## 중3 수학 연산 PDF 기반 학습 페이지 제작 (2026-05-24)
- 요청 목표는 업로드된 `바빠수학(중3)연산1권`, `바빠수학(중3)연산2권`, `바빠중3도형` 3개 PDF를 참고해 중학교 3학년 수학 연산 학습 페이지를 만드는 것이다.
- 저작권 보호를 위해 PDF 지면, 문항, 해설을 그대로 복제하지 않고 단원·유형 흐름만 확인해 새 문제 생성 루틴과 학습 UI를 만들었다.
- 기존 `academy-portal`에는 사용자 변경으로 보이는 `elem-vocab.html`, `assets/elem-vocab.css`, `js/elem-vocab.js` 변경이 있으므로 이번 작업에서는 건드리지 않았다.
- 구현 완료: `academy-portal/middle3-math.html`, `academy-portal/assets/middle3-math.css`, `academy-portal/js/middle3-math.js`를 추가해 연산 1권 24단계, 연산 2권 23단계, 도형 25단계의 총 72단계 문제 생성형 학습 페이지를 만들었다.
- 배포 보정: `academy-portal/scripts/deploy-pages.mjs`의 배포 포함 목록에 `middle3-math.html`을 추가했다.
- 검증 완료: `node --check`, `npm run build`, 로컬 Playwright, Cloudflare 프리뷰 Playwright, 운영 URL 모바일 Playwright가 통과했다. `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 실행 불가했다.
- 운영 접근 URL은 `https://purunet-academy.pages.dev/middle3-math.html`이다.

## 중3 수학 연산 학습 페이지 문제 수 확장 (2026-05-24)
- 사용자 피드백은 현재 단계 수는 있으나 문제집에 비해 실제 풀이 문제 수가 너무 적다는 것이다.
- 저작권 보호 기준은 유지한다. PDF 원문 문제를 그대로 옮기지 않고, 문제집 분량에 맞는 목표 문항 수와 새 무작위 생성 문제 풀을 늘리는 방식으로 처리한다.
- 기존 사용자 변경으로 보이는 `academy-portal/assets/elem-vocab.css`, `academy-portal/elem-vocab.html`, `academy-portal/js/elem-vocab.js`는 계속 건드리지 않는다.
- 구현 완료: `middle3-math.html`, `assets/middle3-math.css`, `js/middle3-math.js`를 갱신해 각 단계 20문항, 전체 72단계 1,440문항 목표를 표시하고 단계별 진행률을 저장하게 했다.
- 검증 완료: `node --check js/middle3-math.js`, `node --check scripts/deploy-pages.mjs`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다.
- 프로젝트 공통 명령 `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `academy-portal/package.json`에 스크립트가 없어 `Missing script`로 실행 불가했다.
- 배포 완료: 운영 URL `https://purunet-academy.pages.dev/middle3-math.html`에서 목표 1,440문항과 단계별 0/20 → 1/20 진행 증가를 확인했다.

## 중3 수학 설명·도형 직관화 고도화 (2026-05-24)
- 사용자 요청은 설명 부분과 도형 부분을 더 고도화해 이해하기 쉽고 직관적으로 표현하는 것이다.
- 기존 사용자 변경으로 보이는 `academy-portal/assets/elem-vocab.css`, `academy-portal/elem-vocab.html`, `academy-portal/js/elem-vocab.js`는 계속 건드리지 않는다.
- 구현 방향은 문제 원문 복제 없이 현재 생성형 문제에 맞춰 단계별 풀이 순서, 시각 단서, 도형 SVG를 보강하는 것이다.
- 구현 완료: `middle3-math.html`에 풀이 안내 패널을 추가하고, `assets/middle3-math.css`로 반응형 설명 카드 스타일을 붙였다.
- 구현 완료: `js/middle3-math.js`에 유형별 풀이 순서·그림 읽기 설명을 추가하고, 피타고라스·삼각비·원 단원은 문제 값이 표시되는 동적 SVG로 개선했다.
- 오답 피드백도 정답만 보여주지 않고 해당 유형의 풀이 순서를 함께 안내하게 했다.
- 검증 완료: `node --check js/middle3-math.js`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다. `npm run lint`, `npm run verify`, `npm run onefile`은 현재 스크립트가 없어 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/middle3-math.html`에서 피타고라스 설명, 동적 삼각형 값 표시, 설명 패널 2개, overflow 0을 확인했다.

## 중3 수학 SVG 정확도·문제 연동 고도화 (2026-05-24)
- 사용자 지적은 SVG 이미지가 문제에 맞춰 충분히 바뀌지 않고, 그래프와 그림의 정확도가 낮다는 것이다.
- 기존 사용자 변경으로 보이는 `academy-portal/assets/elem-vocab.css`, `academy-portal/elem-vocab.html`, `academy-portal/js/elem-vocab.js`는 계속 건드리지 않는다.
- 구현 방향은 그래프·삼각형·원 SVG에 문제별 `visualData`를 더 많이 넣고, 고정 그림 대신 값과 비율을 반영하는 렌더러로 바꾸는 것이다.
- 구현 완료: 이차함수 문제 생성 함수들이 계수, 꼭짓점, 축, 절편, 대입점 데이터를 SVG에 넘기고, `graphSvg`가 이를 좌표로 변환해 동적 포물선과 표시점을 그리게 했다.
- 구현 완료: `triangleSvg`는 문제의 변 길이 비율을 반영해 삼각형의 밑변과 높이를 조절하고, 직각 표시와 강조 변 색상을 유지하게 했다.
- 구현 완료: `circleSvg`의 원주각 문제는 각도에 따라 같은 호의 양 끝점, 중심각, 원주각을 계산해 그리게 했다.
- 검증 완료: `node --check js/middle3-math.js`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다. 운영 URL에서 x절편, 삼각형 변 길이, 원주각·중심각 텍스트가 문제별로 바뀌는 것을 확인했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 스크립트가 없어 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/middle3-math.html`에 반영했다.

## buk.io 권한 보유 페이지 PDF 생성 스크립트 (2026-05-24)
- 사용자 요청은 `https://buk.io/@kb4010/1`부터 `https://buk.io/@kb4010/42`까지 웹 크롤링으로 PDF 문서를 만드는 파이썬 파일을 작성하는 것이다.
- 이전 확인에서 첫 URL은 외부 접근 시 403이었다. 따라서 접근 제한 우회, 로그인 우회, 유료/저작권 자료 복제를 지원하지 않는 안전한 스크립트로 작성한다.
- 스크립트는 사용자가 권한을 가진 페이지에 한해 실행하며, robots.txt와 HTTP 401/403을 존중하도록 만든다.
- 최신 요청은 PDF 스크립트가 아니라 `@kb4010` 1~42, `@kb4011` 1~48, `@kb4007` 1~64 범위를 참고해 중1 연산 페이지를 만드는 것이다.
- 확인 결과 `https://buk.io/robots.txt`는 `Allow: /`이고 세 첫 페이지는 HTTP 200으로 접근됐다. 다만 페이지 텍스트는 앱 스크립트 중심이라 원문 문항을 추출·복제하지 않고, 범위 쪽수만 반영한 생성형 중1 연산 페이지로 처리한다.
- 구현 완료: `academy-portal/middle1-math.html`, `academy-portal/assets/middle1-math.css`, `academy-portal/js/middle1-math.js`를 추가했다.
- 구성 완료: `@kb4010`은 42단계, `@kb4011`은 48단계, `@kb4007`은 64단계로 만들고 각 단계 20문항 목표를 적용해 총 3,080문항 목표로 표시했다.
- 배포 보정: `academy-portal/scripts/deploy-pages.mjs`에 `middle1-math.html`을 포함했다.
- 검증 완료: `node --check js/middle1-math.js`, `node --check scripts/deploy-pages.mjs`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다. `npm run lint`, `npm run verify`, `npm run onefile`은 현재 스크립트가 없어 `Missing script`로 실행 불가했다.
- 운영 접근 URL은 `https://purunet-academy.pages.dev/middle1-math.html`이다.

## 중1·중3 수학 기호 표기 고도화 (2026-05-24)
- 사용자 요청은 중1 문제집과 중3 문제집의 수학 기호들을 수학 전문 기호에 맞춰 고도화하는 것이다.
- 구현 방향은 정답 비교 문자열은 유지하고, 화면 표시만 위첨자, 루트, 세로 분수, 수학 폰트로 렌더링하는 것이다.
- 기존 사용자 변경으로 보이는 `academy-portal/assets/elem-vocab.css`, `academy-portal/elem-vocab.html`, `academy-portal/js/elem-vocab.js`는 계속 건드리지 않는다.
- 구현 완료: `middle1-math.js`와 `middle3-math.js`에 `mathHtml` 렌더러를 추가해 문제, 선택지, 힌트, 피드백 표시를 수학 기호 HTML로 변환하게 했다.
- 구현 완료: `middle1-math.css`와 `middle3-math.css`에 `Cambria Math` 계열 폰트, 위첨자, 세로 분수, 루트 윗줄 스타일을 추가했다.
- 검증 완료: `node --check js/middle1-math.js`, `node --check js/middle3-math.js`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다. 운영에서 중3 `√3/2`류 선택지가 루트+세로분수로, 중1 분수 문제가 세로분수로 표시되는 것을 확인했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 스크립트가 없어 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/middle1-math.html`, `https://purunet-academy.pages.dev/middle3-math.html`에 반영했다.

## 중2 연산 페이지 제작 (2026-05-24)
- 사용자 요청은 `@kb4012` 1~38, `@kb4013` 1~64, `@kb4014` 1~70을 웹 크롤링해 중2 연산 새 페이지를 만들고 각 단원마다 문제집의 최대치 문제 숫자로 작성하는 것이다.
- `https://buk.io/robots.txt`는 `Allow: /`이고 세 첫 페이지는 HTTP 200으로 접근됐다.
- 원문 문제를 그대로 추출·복제하지 않고 URL 범위의 쪽수만 반영한 생성형 중2 연산 페이지로 처리한다.
- 기존 사용자 변경으로 보이는 `academy-portal/assets/elem-vocab.css`, `academy-portal/elem-vocab.html`, `academy-portal/js/elem-vocab.js`는 계속 건드리지 않는다.
- 구현 완료: `middle2-math.html`, `assets/middle2-math.css`, `js/middle2-math.js`를 추가했다.
- 구성 완료: `@kb4012` 38단계, `@kb4013` 64단계, `@kb4014` 70단계이며 각 단계 20문항 목표라 전체 목표는 3,440문항이다.
- 배포 보정: `scripts/deploy-pages.mjs`에 `middle2-math.html`을 포함했다.
- 검증 완료: `node --check js/middle2-math.js`, `node --check scripts/deploy-pages.mjs`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 스크립트가 없어 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/middle2-math.html`에서 38·64·70단계와 목표 3,440문항을 확인했다.

## 중등 필수 영단어 학습 페이지 노출 보정 (2026-05-24)
- 사용자 요청은 중등 초급·중급·고급 필수 영단어 작업은 했는데 학습용 페이지가 나오지 않는 문제를 수정하는 것이다.
- 조사 결과 `middle-vocab.html`, `js/middle-vocab.js`, `js/middle-vocab-data.js`는 로컬에 있고 `js/views.js`에서도 iframe으로 연결하지만, `scripts/deploy-pages.mjs`의 Cloudflare Pages 배포 포함 목록에는 `middle-vocab.html`이 빠져 있었다.
- 수정 기준은 기존 초등 영단어 파일 변경은 건드리지 않고, 누락된 중등 영단어 HTML을 배포 산출물에 포함한 뒤 초급·중급·고급 URL을 각각 검증하는 것이다.
- 구현 완료: `scripts/deploy-pages.mjs` 배포 포함 목록에 `middle-vocab.html`을 추가했다.
- 구현 완료: `js/middle-vocab.js`가 `?level=beginner`, `?level=intermediate`, `?level=advanced`를 읽어 해당 레벨 학습 세션으로 바로 진입하게 했다.
- 검증 완료: `node --check js/middle-vocab.js`, `node --check js/middle-vocab-data.js`, `node --check scripts/deploy-pages.mjs`, `npm run build`, 로컬 Playwright, 운영 URL Playwright가 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 각각 `Missing script`로 실행 불가했다.
- 배포 완료: 프리뷰 `https://a1d3a78c.purunet-academy.pages.dev`, 운영 `https://purunet-academy.pages.dev/middle-vocab.html?level=beginner` 등에서 세 레벨 모두 HTTP 200, 학습 세션 1개, 단어 카드 1개, 콘솔 오류 0을 확인했다.

## 초등·중등 영단어 의미연상암기 고도화 (2026-05-24)
- 사용자 요청은 AutoVoca의 의미연상암기법과 ScienceDirect 논문을 참고해 초등 영단어와 중등 영단어 학습을 더 고도화하는 것이다.
- AutoVoca 세 페이지는 브라우저 접근은 가능했지만 정적 텍스트 추출이 거의 되지 않아 원문 문구나 콘텐츠는 복제하지 않고, 사용자가 제시한 “뇌과학 원리에 기반한 의미연상암기법” 방향만 참고한다.
- ScienceDirect 논문은 Kiwamu Kasahara의 2011년 System 논문이며, 익숙한 단어와 새 단어를 결합한 two-word collocation이 단일 단어 학습보다 의미 보존과 인출을 더 잘 돕는다는 결과를 제시한다. DOI는 `10.1016/j.system.2011.10.001`이다.
- 구현 기준은 새 단어를 familiar cue, 의미 장면, 회상 질문과 함께 부호화하고, 카드 뒤집기와 확인 퀴즈에서 같은 cue를 다시 보여주어 인출 단서를 일관되게 제공하는 것이다.
- 구현 완료: `js/elem-vocab.js`와 `js/middle-vocab.js`에 `meaningLink`, `familiarCue`, `linkBox`를 추가해 같은 테마 안의 익숙한 단어와 목표 단어를 결합한 의미연상 고리를 생성한다.
- 구현 완료: 새 단어 카드 앞면·뒷면, 스펠링 카드, 묶음 확인 퀴즈, 복습 카드에 의미연상 고리와 회상 질문을 표시한다.
- 구현 완료: 초등 영단어도 `?level=beginner`, `?level=intermediate`, `?level=advanced`로 바로 학습 세션에 진입하게 했다.
- 구현 완료: `assets/elem-vocab.css`에 의미연상 박스 스타일을 추가했다.
- 검증 완료: `node --check js/elem-vocab.js`, `node --check js/middle-vocab.js`, `node --check js/elem-vocab-data.js`, `node --check js/middle-vocab-data.js`, `npm run build`, 로컬 Playwright, 운영 Playwright, 운영 모바일 390px Playwright가 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 각각 `Missing script`로 실행 불가했다.
- 배포 완료: 프리뷰 `https://28bff01a.purunet-academy.pages.dev`, 운영 초등·중등 영단어 6개 레벨 URL에서 HTTP 200, 의미연상 박스 2개, overflow 0, 콘솔 오류 0을 확인했다.

## 초등 영문법 단계형 패턴 전자북 고도화 (2026-05-24)
- 사용자 요청은 초등 영문법을 초급·중급·고급으로 나누고, 미국과 영국 유명 영어 출판사의 문법책·전자북 구성을 참고해 최신 영어 교육법과 패턴 영어 학습법을 적용한 사용자 친화적 전자북으로 고도화하는 것이다.
- 참고한 공식 자료의 방향은 Cambridge Primary Grammar Box의 연령·레벨별 문법 게임과 활동, Oxford Grammar Friends의 6레벨 young learner 문법 보충 교재, Pearson Primary의 paced content와 age-appropriate assessment, Macmillan Primary Grammar의 Pre-A1~A1+ 3레벨 구조다. 원문 문항과 지면은 복제하지 않고 범위와 교수 설계 원리만 참고한다.
- 구현 방향은 `elementary-grammar` 단일 과목을 초급·중급·고급으로 분리하고, 각 문법 카드를 입력·패턴 말하기·규칙 발견·오류 수정·문장 산출 루틴으로 재구성하는 것이다.
- 구현 완료: `elementary-grammar` 단일 과목을 `elementary-grammar-beginner`, `elementary-grammar-intermediate`, `elementary-grammar-advanced` 3개 과목으로 분리했다.
- 구성 완료: 각 단계 8개 문법 모듈, 총 24개 모듈로 만들고 초급은 명사·be동사·복수·전치사, 중급은 일반동사·질문·조동사·현재진행, 고급은 과거·미래·비교·접속·관계 확장으로 배치했다.
- 구현 완료: 학습 카드에 단계 표시, 리듬 패턴 말하기, 4단계 학습 프로세스, 산출 미션을 추가했고 문법 랩 루틴도 입력·패턴 말하기·오류 수정·산출 중심으로 바꿨다.
- 검증 완료: `node --check`, `npm run build`, 로컬 Playwright, 운영 Playwright, 운영 모바일 390px Playwright가 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 각각 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/`에서 초등 영문법 초급·중급·고급 3개 과목과 각 8개 모듈, 문법 카드 요소, overflow 0, 콘솔 오류 0을 확인했다.
## 중등 영문법 단계형 패턴 전자북 고도화 (2026-05-24)
- 사용자 요청은 중등 영문법도 초급·중급·고급으로 나누고, 미국·영국 유명 영어 출판사의 문법책·전자북 구성을 참고해 최신 영어 교육법과 패턴 영어 학습법을 적용한 사용자 친화적 문법 전자북으로 고도화하는 것이다.
- 공식 자료 조사 요약: Pearson Focus on Grammar는 주제 기반 문법, 충분한 연습, 비판적 사고, 지속 평가, 의사소통 자신감을 강조한다. Macmillan English Grammar in Context는 맥락 속 핵심 문법 구조의 복습과 정착을 위한 3레벨 구성이다. Cambridge·Oxford 계열 자료는 어린 학습자와 청소년에게 단계형 문법, 활동형 과제, 문법을 쓰기·말하기로 연결하는 흐름을 제공한다.
- 구현 기준은 원문 지면이나 문항 복제가 아니라 중등 문법 위계와 학습 프로세스만 참고해 맥락 입력, 패턴 말하기, 오류 수정, 문장 변환, 자기 산출 루틴으로 재구성하는 것이다.
- 구현 완료: `middle-grammar` 단일 과목을 `middle-grammar-beginner`, `middle-grammar-intermediate`, `middle-grammar-advanced` 3개 과목으로 분리했다.
- 구성 완료: 각 단계 10개 문법 모듈, 총 30개 모듈로 만들고 초급은 시제·조동사·준동사 기초, 중급은 현재완료·수동태·관계사·간접의문문, 고급은 가정법·분사구문·명사절·강조와 도치·통합 편집으로 배치했다.
- 구현 완료: 중등 문법도 단계 표시, 리듬 패턴 말하기, 4단계 학습 프로세스, 산출 미션이 보이는 문법 카드형 전자북으로 렌더링한다.
- 검증 완료: `node --check`, `npm run build`, 로컬 Playwright, 운영 Playwright, 운영 모바일 390px Playwright가 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 각각 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/`에서 중등 영문법 초급·중급·고급 3개 과목과 각 10개 모듈, 문법 카드 요소, overflow 0, 콘솔 오류 0을 확인했다.
## 초등·중등 전문 문법책 신규 페이지 분리 제작 (2026-05-24)
- 사용자 요청은 `초등 중등 전문 문법책 제작 노하우(26.05.24).md`를 따라 초등 문법책 신규 페이지와 중등 문법책 신규 페이지를 따로 작성하는 것이다.
- 확인 결과 해당 노하우 문서는 현재 0바이트로 비어 있어, 기존에 반영한 미국·영국 ELT 출판사형 문법책 원리와 현재 `english-core-sites.js`의 초등·중등 단계형 문법 데이터를 기준으로 구현한다.
- 구현 방향은 기존 통합 학습 화면과 별개로 읽기 좋은 전자문법책 페이지를 만들고, 단계별 목차, 범위표, 개념 설명, 대표 예문, 오류 교정, 변형 연습, 산출 미션, 복습 체크를 한 화면에서 제공하는 것이다.
- 구현 완료: `elementary-grammar-book.html`, `middle-grammar-book.html`, `assets/grammar-book.css`, `js/grammar-book.js`를 추가했다.
- 구현 완료: 초등 페이지는 초급·중급·고급 각 8단원, 중등 페이지는 초급·중급·고급 각 10단원을 불러오며, 단원별 패턴·개념·예문·오류교정·문장변형·4단계 워크북을 제공한다.
- 배포 보정 완료: `scripts/deploy-pages.mjs` 포함 목록에 신규 문법책 2개 HTML을 추가했다.
- 검증 완료: `node --check js/grammar-book.js`, `node --check scripts/deploy-pages.mjs`, `npm run build`, 로컬 Playwright 데스크톱·모바일, 운영 Playwright 데스크톱·모바일이 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 각각 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/elementary-grammar-book.html`, `https://purunet-academy.pages.dev/middle-grammar-book.html`에서 stages 3, 단원 수 정상, workbook rows 4, overflow 0, 콘솔 오류 0을 확인했다.
## 연구·오픈소스 기반 영문법 학습 고도화 (2026-05-24)
- 사용자 요청은 GitHub의 영문법 학습 관련 자료와 미국·영국 영어교육 논문을 찾아 현재 초등·중등 영문법 학습 사이트를 업그레이드하는 것이다.
- 조사한 GitHub 자료 방향은 `learn-english` topic의 타이핑·퀴즈·간격 복습형 학습 UI, LanguageTool의 오픈소스 문법 오류 탐지, Harper의 로컬·프라이버시 우선 문법 검사, GrammarTagger의 문법 feature profiling이다.
- 조사한 논문·연구 방향은 Cambridge Core의 focus-on-form/corrective feedback, ScienceDirect의 명시·암시 문법 지도 비교, extensive reading/translation 기반 문법 지식 연구, RetrievalPractice.org의 spaced retrieval practice 가이드다.
- 구현 기준은 외부 콘텐츠나 문제를 복제하지 않고, 현재 문법책 페이지에 능동 회상, 문장 조립, 오류 유형 분석, 간격 복습 예약, 연구 기반 루틴 설명을 기능으로 반영하는 것이다.
- 구현 완료: `js/grammar-book.js`에 연구 기반 학습 카드 4개, 문법 feature 프로파일, 오류 유형 태그, 능동 회상 문장 조립기, localStorage 기반 1일·3일·7일 간격 복습 저장 기능을 추가했다.
- 구현 완료: `assets/grammar-book.css`에 연구 카드, feature 태그, 문장 조립, 복습 예약 UI의 데스크톱·모바일 반응형 스타일을 추가했다.
- 검증 완료: `node --check js/grammar-book.js`, `npm run build`, 로컬 Playwright 데스크톱·모바일, 운영 Playwright 데스크톱·모바일이 통과했다.
- `npm run lint`, `npm run verify`, `npm run onefile`은 현재 `package.json`에 스크립트가 없어 각각 `Missing script`로 실행 불가했다.
- 배포 완료: `https://purunet-academy.pages.dev/elementary-grammar-book.html`, `https://purunet-academy.pages.dev/middle-grammar-book.html`에서 연구 카드 4개, builder 1개, 복습 박스 1개, overflow 0, 콘솔 오류 0을 확인했다.

## 초등 교과 영문법 전체 새 페이지 제작 (2026-05-25)
- 요청 목표는 ClassCard Grammar의 학습 구조를 참고하고, 교육청 초등 교과서에 반복 출현하는 초등 영어 언어형식을 빠짐없이 다루는 새 문법 페이지를 만드는 것이다.
- ClassCard Grammar 공개 페이지에서 확인한 반영 요소는 초등 대상 69개 유닛, 유닛별 반복훈련, 오답 다시풀기, 문제은행, 개념톡, 자동채점, 서술형 중심 훈련이다.
- 교육과정 기준은 2022 개정 영어과 교육과정의 초등 영어 성취기준과 언어형식 범위를 직접 원문 복제하지 않고, 자체 예문과 자체 문제로 재구성한다.
- 기존 `elementary-grammar-book.html`은 다른 작업의 산출물이므로 보존하고, 이번 요청 전용 새 페이지를 별도로 추가해 접근 URL을 분리한다.

## 초등 교과 영문법 전체 새 페이지 제작 완료 기록 (2026-05-25)
- 새 페이지는 `푸르넷 영어 수학 학원(26.05.21)/academy-portal/elementary-school-grammar.html`이다.
- 새 자산은 `assets/elementary-school-grammar.css`, `js/elementary-school-grammar.js`이며, 3~4학년 23유닛, 5학년 23유닛, 6학년 23유닛으로 총 69유닛을 구성했다.
- 기능은 개념톡, 예문 듣기, 빈칸 자동채점, 오답 다시풀기, 문장 조립, 문제은행 카드, XP와 오답 localStorage 저장을 포함한다.
- 배포 스크립트 `scripts/deploy-pages.mjs`에 `elementary-school-grammar.html`을 포함해 Cloudflare Pages 배포 대상에 들어가도록 했다.
- 검증 결과 `node --check js/elementary-school-grammar.js`, `node --check scripts/deploy-pages.mjs`, `npm.cmd run build`, Playwright 데스크톱 1280px, 모바일 390px 렌더링이 통과했다.

## 중등 교과 영문법 전체 새 페이지 제작 (2026-05-25)
- 요청 목표는 ClassCard Grammar를 참고해 교육청 중등 영어 교과서에 나오는 주요 영문법 전체를 새 문법 페이지로 만드는 것이다.
- ClassCard Grammar 공개 페이지에서 중등 대상 179개 유닛, 유닛별 100문항, 오답 다시풀기, 문제은행, 개념톡, 자동채점, 내신대비 서술형 중심 흐름을 확인했다.
- 저작권 보호를 위해 ClassCard 문항이나 교재 문항은 복제하지 않고, 중등 교과 문법 범위와 학습 구조만 반영한 자체 예문과 자체 오답 문장으로 구성한다.
- 기존 `middle-grammar-book.html`은 보존하고, 이번 요청 전용 새 페이지를 별도로 추가한다.

## 중등 교과 영문법 전체 새 페이지 제작 완료 기록 (2026-05-25)
- 새 페이지는 `푸르넷 영어 수학 학원(26.05.21)/academy-portal/middle-school-grammar.html`이다.
- 새 자산은 `assets/middle-school-grammar.css`, `js/middle-school-grammar.js`이며, 중1 기초 60유닛, 중2 확장 60유닛, 중3 내신 59유닛으로 총 179유닛을 구성했다.
- 기능은 개념톡, 예문 듣기, 빈칸 자동채점, 오답 다시풀기, 문장 조립, 문제은행 카드, XP와 오답 localStorage 저장을 포함한다.
- 배포 스크립트 `scripts/deploy-pages.mjs`에 `middle-school-grammar.html`을 포함해 Cloudflare Pages 배포 대상에 들어가도록 했다.
- 검증 결과 `node --check js/middle-school-grammar.js`, `node --check scripts/deploy-pages.mjs`, `npm.cmd run build`, Playwright 데스크톱 1280px, 모바일 390px 렌더링이 통과했다.

## 초등·중등 내신 문법 홈 메뉴 분리 (2026-05-25)
- 요청 목표는 직전에 만든 `elementary-school-grammar.html`과 `middle-school-grammar.html`을 메인 학습 메뉴에서 각각 초등 내신 문법, 중등 내신 문법으로 따로 보이게 하는 것이다.
- 기존 과목 데이터와 학습 흐름은 유지하고, `js/views.js`의 홈 학교급별 메뉴에 외부 페이지 바로가기 카드만 추가하는 방식으로 처리한다.

## 초등·중등 내신 문법 홈 메뉴 분리 완료 기록 (2026-05-25)
- `js/views.js`의 학교급별 홈 메뉴에 `elementary-school-grammar.html` 바로가기 카드와 `middle-school-grammar.html` 바로가기 카드를 추가했다.
- 초등 메뉴 카드는 `초등 내신 문법`으로 69유닛을 표시하고, 중등 메뉴 카드는 `중등 내신 문법`으로 179유닛을 표시한다.
- `assets/styles.css`의 `.subject-card`에 링크 카드용 `cursor: pointer`, `text-decoration: none`을 추가했다.
- 검증 결과 `node --check js/views.js`, `npm.cmd run build`, 로컬 HTTP Playwright에서 두 href와 overflow 없음, 콘솔 오류 0을 확인했다.

## 초등·중등 내신 문법 운영 배포 (2026-05-25)
- 사용자가 운영 URL `https://purunet-academy.pages.dev/`에 새 문법 메뉴가 아직 보이지 않는다고 요청했다.
- `academy-portal`에서 `npm.cmd run build` 통과 후 `npm.cmd run deploy`를 실행해 Cloudflare Pages를 갱신했다.
- Wrangler 배포 결과 프리뷰 URL은 `https://066e8f79.purunet-academy.pages.dev`이다.
- 운영 URL 검증에서 `elementary-school-grammar.html`, `middle-school-grammar.html` 메뉴 href가 보이고, 두 페이지 모두 HTTP 200이며 콘솔 오류 0, 가로 overflow 없음으로 확인했다.

## 고등 교과 영문법 전체 새 페이지 제작 (2026-05-25)
- 요청 목표는 ClassCard Grammar를 참고해 교육청 고등 영어 교과서에 나오는 주요 영문법 전체를 새 문법 페이지로 만드는 것이다.
- ClassCard Grammar 공개 페이지에서 고등 대상 23개 유닛, 유닛별 100문항, 오답 다시풀기, 문제은행, 개념톡, 자동채점, 내신대비 서술형 중심 흐름을 확인했다.
- 저작권 보호를 위해 ClassCard 문항이나 교재 문항은 복제하지 않고, 고등 교과 문법 범위와 학습 구조만 반영한 자체 예문과 자체 오답 문장으로 구성한다.
- 기존 `high-grammar` 학습 흐름은 보존하고, 이번 요청 전용 새 페이지를 별도로 추가한다.

## 고등 교과 영문법 전체 새 페이지 제작 완료 기록 (2026-05-25)
- 새 페이지는 `푸르넷 영어 수학 학원(26.05.21)/academy-portal/high-school-grammar.html`이다.
- 새 자산은 `assets/high-school-grammar.css`, `js/high-school-grammar.js`이며, 고등 핵심 문법 23유닛을 구성했다.
- 기능은 개념톡, 예문 듣기, 빈칸 자동채점, 오답 다시풀기, 문장 조립, 문제은행 카드, XP와 오답 localStorage 저장을 포함한다.
- `js/views.js`의 고등학생 메뉴에 `고등 내신 문법` 23유닛 바로가기 카드를 추가했다.
- 학생 기본 화면에서도 고등 전체 과목 권한은 그대로 막고, 고등 탭의 새 문법 바로가기 카드만 보이도록 `js/controllers.js`의 학교급 탭 선택 제한을 조정했다.
- 배포 스크립트 `scripts/deploy-pages.mjs`에 `high-school-grammar.html`을 포함했다.
- 검증 결과 `node --check js/high-school-grammar.js`, `node --check js/views.js`, `node --check js/controllers.js`, `node --check scripts/deploy-pages.mjs`, `npm.cmd run build`, Playwright 데스크톱 1280px, 모바일 390px 렌더링이 통과했다.

## 고등 교과 영문법 운영 배포 (2026-05-25)
- `academy-portal` 커밋은 `7f19182 Add high school grammar page`이다.
- `npm.cmd run deploy`로 Cloudflare Pages를 갱신했고 프리뷰 URL은 `https://bf3f6dd8.purunet-academy.pages.dev`이다.
- 운영 URL 검증에서 고등학생 탭의 `high-school-grammar.html` 메뉴 href가 보이고, 페이지 HTTP 200, 콘솔 오류 0, 가로 overflow 없음으로 확인했다.

## 초중고 내신 영문법 메뉴명 운영 반영 (2026-05-25)
- 사용자가 초등학생 메뉴에 `초등 내신 영문법`, 중학생 메뉴에 `중등 내신 영문법`, 고등학생 메뉴에 `고등 내신 영문법`을 추가해 달라고 요청했다.
- 기존 바로가기 카드가 `내신 문법`으로 되어 있어 `js/views.js`의 세 shortcut label을 모두 `내신 영문법`으로 수정했다.
- 로컬 Playwright에서 세 카드가 각각 `초등 내신 영문법 69유닛`, `중등 내신 영문법 179유닛`, `고등 내신 영문법 23유닛`으로 보이는 것을 확인했다.

## 문법 페이지 홈 버튼 문구 수정 (2026-05-25)
- 요청 목표는 초등·중등·고등 내신 영문법 페이지 상단의 `통합 학습` 버튼 문구를 더 직관적인 `홈`으로 바꾸는 것이다.
- 변경 범위는 `js/elementary-school-grammar.js`, `js/middle-school-grammar.js`, `js/high-school-grammar.js`의 상단 홈 링크 텍스트로 제한했다.
- 검증 결과 `node --check` 3개 파일, `npm.cmd run build`, 운영 URL Playwright 확인이 통과했고, 세 페이지 모두 링크 텍스트가 `홈`이며 기존 `통합 학습` 문구는 0개로 확인했다.

## 내신 영문법 문제은행 세트 확장 (2026-05-25)
- 요청 목표는 초등·중등·고등 내신 영문법의 각 목차 문제은행에서 10, 20, 30, 40, 50, 60, 70, 80, 90, 100문제 세트를 메뉴바 형식으로 선택하고 실제 문항을 볼 수 있게 만드는 것이다.
- 구현 방향은 기존 유닛 데이터를 그대로 활용해 빈칸, 오류수정, 개념확인, 문장쓰기, 내신형 서술 문제를 반복 변형 생성하는 방식으로 잡았다. 저작권 보호를 위해 외부 문항 복제가 아니라 기존 자체 예문과 규칙 기반 문항을 만든다.
- 검증 결과 `node --check` 3개 파일, `npm.cmd run build`, 로컬·운영 Playwright가 통과했다. 운영 URL 모바일 폭에서 세 페이지 모두 메뉴 10개, 기본 10문제, 100문제 선택 시 카드 100개, 콘솔 오류 0, 가로 overflow 없음으로 확인했다.

## 내신 영문법 문제은행 풀이형 전환 (2026-05-25)
- 요청 목표는 문제은행을 정답 노출 카드가 아니라 실제 풀이형 화면으로 바꾸는 것이다.
- 구현 방향은 각 문항을 빈칸, 오답, 조립 유형으로 순환 생성하고, 학생이 답을 쓰는 입력칸을 제공한 뒤 `정답 보기` 버튼을 누를 때만 답을 보여주는 방식이다.
- 검증 결과 초등·중등·고등 운영 URL에서 문제은행 첫 3문항이 `빈칸`, `오답`, `조립` 순서로 나오고, 초기 정답 노출 0개, 입력칸 10개, `정답 보기` 클릭 후 정답 1개만 노출됨을 확인했다.

## 내신 영문법 문제은행 기존 풀이 형식 반영 (2026-05-25)
- 사용자가 문제은행을 주관식 입력 방식이 아니라 기존 `빈칸`, `오답`, `조립` 탭에서 쓰던 풀이 형식으로 바꾸길 요청했다.
- 구현 완료: 문제은행 문항 생성은 `빈칸`, `오답`, `조립`만 순환하고, 렌더링은 각각 보기 선택, 정답 보기 토글, 토큰 조립·채점 UI를 사용한다.
- 검증 결과 운영 URL의 초등·중등·고등 문법 페이지 모두 문제은행 첫 3문항이 `빈칸`, `오답`, `조립`으로 나오고, textarea 0개, 빈칸 보기 4개, 오답 정답 초기 0개/클릭 후 1개, 조립 토큰 및 동작 버튼 정상, 100문제 렌더링, 콘솔 오류 0, 가로 overflow 없음으로 확인했다.

## NLP 내신 문법 끊어읽기 문제 확장과 색상 강조 (2026-05-25)
- 요청 목표는 초등·중등·고등 NLP 내신 문법 화면의 끊어읽기 화면을 `끊어읽기 NLP 문제`로 명확히 바꾸고, 10~100세트 문제 선택을 제공하며, 개념·빈칸·오답·조립·문제은행의 문장과 단어를 가독성 높은 색상 표현으로 바꾸는 것이다.
- 구현 방향은 기존 문법 JS 세 파일의 NLP 모드 라벨을 바꾸고, `makeNLPQuestions()` 기반 세트 선택 UI를 유지하면서, 단어 역할 추정 함수와 `renderColorText()`를 추가해 조동사·전치사·접속사·대명사·어미 변화를 색상 칩으로 표시하는 방식이다.
- `nlp-elementary-grammar.html`, `nlp-middle-grammar.html`, `nlp-high-grammar.html`도 Cloudflare Pages 배포 목록에 포함되도록 배포 스크립트를 갱신했다.
- 검증 결과 운영 URL의 초등·중등·고등 NLP 문법 페이지 모두 HTTP 200, 탭명 `끊어읽기 NLP 문제`, 세트 버튼 10개, 100세트 선택 시 문제 카드 100개, 색상 단어 칩 렌더링, 콘솔 오류 0, 모바일 가로 overflow 없음으로 확인했다.

## NLP 고도화 전략 기반 문제은행 재구성 (2026-05-25)
- 사용자가 `초등 중등 고등 nlp 영문법 고도화 전략(26.05.25).md`를 기준으로 문제은행 전체 수정과 불필요한 줄바꿈 복귀를 요청했다.
- 문서 핵심은 단순 POS/색상 태깅만으로는 `The song sounds beautiful` 같은 2형식 SVC를 잘못 분석할 수 있으므로, S/V/O/C 성분, 5형식, 연결동사, 목적보어 규칙을 결합해야 한다는 것이다.
- 구현 방향은 기존 문제은행 생성기를 예문 기반 문제 풀로 바꾸고, 빈칸·오답·조립 외에 `문형`과 `성분` 선택형 문제를 추가하는 것이다.
- 색상 강조 단어는 inline-block 칩에서 inline 강조로 바꿔 불필요한 줄바꿈을 줄였다.
- 검증 결과 운영 URL의 초등·중등·고등 문법 페이지 모두 문제은행 100문제에서 `빈칸`, `오답`, `조립`, `문형`, `성분` 유형이 섞여 나오고, 색상 단어 표시가 `inline`, 콘솔 오류 0, 모바일 가로 overflow 없음으로 확인했다.

## 내신 영문법 문제은행 줄바꿈 복귀와 NLP 문형 분석 보정 (2026-05-25)
- 요청 목표는 초등·중등·고등 내신 영문법 문제은행에서 색상 단어 강조 때문에 생긴 불필요한 줄바꿈을 되돌리고, 끊어읽기 NLP 문제의 5형식 성분 분석을 다시 점검하는 것이었다.
- 문제은행의 `esg-color-text`, `esg-word-tone` 표시를 inline 흐름으로 맞춰 문장 안에서 단어 색상만 강조되도록 유지했다.
- 기존 NLP 분석은 POS 추정 중심이라 `My name is Minho`, `I am happy today`, `The train leaves at seven` 같은 문장에서 명사·수식어를 목적어 또는 동사로 오인할 수 있었다. 이번 보정에서는 예문 기반 5형식 규칙을 우선 적용하고, SC(주격보어), OC(목적격보어), M(수식어)를 별도 청크로 분리했다.
- 연결동사는 보어를 SC로 잡되 뒤따르는 시간·장소 표현은 M으로 분리한다. 사역·지각·목적격보어 동사는 대명사 목적어와 실제 보어가 뒤따르는 경우에만 O+OC로 분리해 `made a birthday cake` 같은 일반 타동사 구문을 5형식으로 오분석하지 않게 했다.
- 문제은행의 문형·성분 문제도 같은 `buildPatternChunks` 분석 결과를 사용하도록 바꿔, 수식어가 붙은 1형식 문장이 3형식으로 출제되는 문제를 줄였다.
- 검증 결과 `node --check` 3개 JS, `npm.cmd run build`, 로컬 Playwright 6개 페이지, 운영 URL Playwright 6개 페이지가 통과했다. 운영 배포 프리뷰는 `https://48004bc1.purunet-academy.pages.dev`였다.

## 초등 문제은행 문형·성분 문제 제외 (2026-05-25)
- 요청 목표는 초등 문제은행에서 중등 교육과정에 가까운 문장 성분 질문을 제거하는 것이었다.
- 초등 문제은행 생성기 `makeBankQuestions`에서 `문형`과 `성분` 문제를 모두 제외했다. 초등 화면에는 `빈칸`, `조립`, `오답` 유형만 남겼다.
- 중등·고등 문제은행과 NLP 끊어읽기 문제는 이번 요청 범위가 아니므로 유지했다.
- 검증 결과 로컬과 운영 URL의 초등 문제은행 100문제에서 `문형`, `성분` 문제는 0건이었다. 배포 프리뷰는 `https://04c03298.purunet-academy.pages.dev`였다.

## 중등 문제은행 성분 보기 한글 병행 표기 (2026-05-25)
- 요청 목표는 중학교 문제은행에서 문장 성분 문제의 `S/V/O/C` 보기를 한글과 함께 표기하는 것이었다.
- `js/middle-school-grammar.js`의 `makeRoleQuestion`에서 보기와 정답 표시를 `S(주어)`, `V(동사)`, `O(목적어)`, `C(보어)` 형식으로 변경했다.
- 정답 비교도 새 표기 문자열 기준으로 맞춰, 화면 표기와 채점 기준이 어긋나지 않게 했다.
- 로컬과 운영 URL에서 중등 문제은행 100문제를 열어 성분 카드가 33개 생성되고 한글 병행 표기가 표시되는 것을 확인했다. 배포 프리뷰는 `https://bcae166e.purunet-academy.pages.dev`였다.

## 수동태 p.p. NLP 동사구 분석 보정 (2026-05-25)
- 요청 목표는 NLP 끊어읽기 문제에서 수동태의 p.p.가 주격보어로 해석되는 문제를 전체 수정하는 것이었다.
- 원인은 `has been told`, `were taken`, `is sung`, `has been broken`처럼 `be/have + p.p.`가 이어질 때 불규칙 p.p.를 동사구에 포함하지 못하고 `been/were/is`를 연결동사처럼 처리하는 데 있었다.
- 초등·중등·고등 문법 JS의 `buildPatternChunks`에 공통으로 불규칙 과거분사 목록과 `isVerbPhraseFollower` 규칙을 추가했다. 이제 `was written`, `is sung`, `were taken`, `has been broken`, `had been spoken`, `will have been completed`를 하나의 동사구로 묶는다.
- `have never seen`처럼 조동사와 p.p. 사이에 `never`, `already`, `just`, `not` 등이 들어간 완료형도 동사구로 유지하도록 보정했다.
- 검증 결과 로컬과 운영 URL의 중등 수동태, 고등 불규칙 p.p., 고등 완료수동태 NLP 100문제에서 p.p.가 주격보어로 표시되는 사례는 0건이었다. 배포 프리뷰는 `https://5ec85bc1.purunet-academy.pages.dev`였다.

## 고등 교육부 필수 영단어 3000단어 메뉴 추가 (2026-05-25)
- 요청 목표는 업로드된 `2022년 교육부 기본 어휘 3000개_전체.txt`를 사용해 고등학생 메뉴에 고등 초급, 중급, 고급 영단어 메뉴를 만드는 것이다.
- 작업 전 가정은 3000단어를 원본 순서 기준으로 1000개씩 초급·중급·고급으로 나누고, 기존 영단어 학습 UI 패턴을 재사용하는 것이다.

- 원본 txt는 3206개 항목으로 파싱되었고, 요청 명칭에 맞춰 앞 3000개를 초급·중급·고급 각 1000개로 분리했다.
- 고등 단어 화면은 기존 중등 단어 학습 UI를 설정화해 재사용하고, 진행도 저장 키는 hv3:*로 분리했다.
- 고등 초급·중급·고급 메뉴는 고등학생 탭에 표시되며 학생 화면에서도 열 수 있게 고등 단어 3단계만 제한 예외로 두었다.
- 검증은 node --check 6개 파일, npm.cmd run build, 로컬 Playwright, 운영 URL과 프리뷰 URL Playwright로 완료했다.
- Cloudflare Pages 배포 프리뷰는 https://15ee3206.purunet-academy.pages.dev 이며, 운영 https://purunet-academy.pages.dev 에서도 고등 3단계 메뉴와 high-vocab.html 화면을 확인했다.

## 초중고 TEPS 단어 기존 영단어 기반 확장 (2026-05-26)
- 요청 목표는 TEPS 단어장을 기존 초등 영단어 800개, 중등 영단어 1800개, 고등 영단어 3000개 데이터를 기반으로 같은 목표 개수까지 확장하는 것이다.
- 구현 기준은 TEPS HTML에서 기존 영단어 데이터 파일을 먼저 로드하고, TEPS JS가 해당 데이터를 20개 단위 단어 유닛으로 변환해 단어 탭에 표시하는 방식이다.
- 기존 TEPS 문법, 듣기, 독해, 실전 모의고사 확장 루틴은 유지하고, 이번 변경의 직접 대상은 TEPS 단어 데이터 연결과 정확한 단어 수 보장으로 제한한다.
- 구현 완료: `elementary-teps.html`, `middle-teps.html`, `high-teps.html`에서 각각 기존 영단어 데이터 파일을 TEPS JS보다 먼저 로드하도록 연결했다.
- 구현 완료: `js/elementary-teps.js`, `js/middle-teps.js`, `js/high-teps.js`에 기존 영단어 데이터를 20개 단위 TEPS 단어 유닛으로 변환하는 함수를 추가했다.
- 검증 완료: 원본 데이터 카운트는 초등 800개, 중등 1800개, 고등 3000개이고, 브라우저 렌더링에서 TEPS 단어 유닛은 초등 40개, 중등 90개, 고등 150개이며 각 유닛은 20개 단어로 확인했다.

## 초중고 TEPS 문법 NLP 내신 수준 확장 (2026-05-26)
- 요청 목표는 초등 TEPS 문법을 초등 NLP 내신 문법 수준으로, 중등 TEPS 문법을 중등 NLP 내신 문법 수준으로, 고등 TEPS 문법을 고등 NLP 내신 문법 수준으로 확장하는 것이다.
- 기존 NLP 내신 문법 페이지의 핵심 구조는 단순 객관식이 아니라 개념, 오답교정, 문장 성분 또는 구문 역할 분석, 서술형 전환을 한 단원 안에 함께 제공하는 방식이다.
- 구현 기준은 TEPS 문법 탭의 기존 렌더링 구조를 유지하면서 DATA.grammar를 학교급별 NLP 스타일 단원으로 재구성하고, 듣기·독해·실전 탭은 기존 확장 흐름을 유지하는 것이다.
- 구현 완료: 초등 TEPS 문법은 23개 NLP 문법 주제에 개념·오답교정·NLP 성분 변형을 붙여 69개 단원으로 구성했다.
- 구현 완료: 중등 TEPS 문법은 30개 NLP 내신 핵심 주제에 개념·오답교정·NLP 성분 변형을 붙여 90개 단원으로 구성했다.
- 구현 완료: 고등 TEPS 문법은 27개 고등 NLP 심화 주제에 심화 개념·서술형 전환·NLP 독해문법 변형을 붙여 81개 단원으로 구성했다.
- 검증 완료: `node --check` 3개 TEPS JS, `npm.cmd run build`, 로컬 Playwright 문법 탭 렌더링 검증을 통과했다.

## 초중고 TEPS 듣기·독해·활동 50회 모의고사 확장 (2026-05-26)
- 요청 목표는 TEPS 듣기, 독해, 활동 영역을 모의고사 50회 분량으로 확장하는 것이다.
- 구현 기준은 초등은 듣기·독해·활동을 각각 50묶음으로 맞추고, 중등·고등은 듣기·독해·실전 테스트를 각각 50묶음으로 맞추는 것이다.
- 기존 단어 800·1800·3000개와 NLP 문법 확장 데이터는 그대로 유지한다.
