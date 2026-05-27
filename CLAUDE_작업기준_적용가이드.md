# CLAUDE.md 작업 기준 적용 가이드

## 목적

현재 프로젝트와 앞으로 만드는 프로젝트가 같은 작업 기준을 사용하도록 `CLAUDE.md`를 기준 문서로 둔다.

## 현재 프로젝트

- 루트의 `CLAUDE.md`가 공통 작업 기준이다.
- 루트의 `AGENTS.md`가 Codex와 다른 에이전트에게 `CLAUDE.md`를 읽고 따르도록 연결한다.
- 비자명한 작업은 `checklist.md`와 `context-notes.md`를 함께 갱신한다.
- 코드 변경 후에는 가능한 검증을 실행하고 결과를 남긴다.

## 새 프로젝트에 적용하는 방법

새 프로젝트 폴더를 만들거나 기존 폴더를 기준화할 때 아래 명령을 실행한다.

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\apply-claude-standard.ps1" -ProjectPath "C:\path\to\new-project"
```

기존 `CLAUDE.md`나 `AGENTS.md`를 덮어써야 할 때만 `-Force`를 붙인다.

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\apply-claude-standard.ps1" -ProjectPath "C:\path\to\new-project" -Force
```

## 적용 후 확인

- 새 프로젝트 루트에 `CLAUDE.md`가 있는지 확인한다.
- 새 프로젝트 루트에 `AGENTS.md`가 있는지 확인한다.
- `checklist.md`와 `context-notes.md`가 없던 프로젝트는 기본 파일이 생성된다.
- 프로젝트별 검증 명령은 `AGENTS.md`의 현재 프로젝트 검증 항목을 새 프로젝트에 맞게 수정한다.
