# Purunet Elementary RealWorld

초등용 실감형 콘텐츠 프로토타입 모음입니다. `index.html`이 진입점이며, 음료수 만들기, 쌓기나무 시뮬레이터, A-Frame 모듈을 포함합니다.

Deployment

- 이 폴더를 정적 사이트로 배포하려면 GitHub Pages 또는 Cloudflare Pages에 업로드하세요. 기본적으로 `index.html`이 진입점입니다.
- GitHub Pages(간단): 저장소 루트나 `gh-pages` 브랜치에 이 폴더를 복사하고 GitHub Pages를 활성화하세요.
- Cloudflare Pages: 새 프로젝트로 이 디렉터리를 등록하면 자동으로 빌드 없이 배포됩니다.

Notes

- A-Frame 모듈은 데스크톱/모바일 브라우저에서 잘 동작하지만 카메라 권한 등은 환경에 따라 다릅니다.
- 통합 작업: 워크북 문제를 모듈에 연결하려면 각 문제의 콘텐츠(ID/이미지/설명)를 `content/` 폴더에 정리하고, 각 모듈에서 해당 ID를 불러와 시나리오로 매핑하세요.
