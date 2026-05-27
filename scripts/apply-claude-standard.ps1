# 새 프로젝트에 CLAUDE.md 기준 작업 지침을 적용하는 도구
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$ProjectPath,

  [string]$SourceRoot,

  [switch]$Force
)

$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -lt 6) {
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
  $OutputEncoding = [System.Text.UTF8Encoding]::new()
}

function Resolve-Or-CreateDirectory {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }

  return (Resolve-Path -LiteralPath $Path).Path
}

function Copy-StandardFile {
  param(
    [string]$Source,
    [string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    throw "기준 파일을 찾을 수 없습니다. $Source"
  }

  if ((Test-Path -LiteralPath $Destination) -and -not $Force) {
    Write-Host "유지: $Destination"
    return
  }

  Copy-Item -LiteralPath $Source -Destination $Destination -Force
  Write-Host "적용: $Destination"
}

function Ensure-TextFile {
  param(
    [string]$Path,
    [string]$Content
  )

  if (Test-Path -LiteralPath $Path) {
    Write-Host "유지: $Path"
    return
  }

  Set-Content -LiteralPath $Path -Value $Content -Encoding UTF8
  Write-Host "생성: $Path"
}

$targetRoot = Resolve-Or-CreateDirectory -Path $ProjectPath
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
  $SourceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
}
$sourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path

Copy-StandardFile -Source (Join-Path $sourceRoot "CLAUDE.md") -Destination (Join-Path $targetRoot "CLAUDE.md")
Copy-StandardFile -Source (Join-Path $sourceRoot "AGENTS.md") -Destination (Join-Path $targetRoot "AGENTS.md")

$checklist = @"
# 프로젝트 체크리스트

## 0. 작업 기준

- [ ] CLAUDE.md 확인
- [ ] AGENTS.md 확인
- [ ] 작업 전 계획과 검증 기준 정리

## 1. 진행 작업

- [ ] 첫 작업 항목 작성
"@

$notes = @"
# 컨텍스트 노트

## 작업 기준

- 이 프로젝트는 CLAUDE.md를 공통 작업 기준으로 사용한다.
- AGENTS.md는 에이전트가 CLAUDE.md를 우선 참조하도록 연결한다.
- 중요한 결정과 검증 결과는 이 파일에 계속 추가한다.
"@

Ensure-TextFile -Path (Join-Path $targetRoot "checklist.md") -Content $checklist
Ensure-TextFile -Path (Join-Path $targetRoot "context-notes.md") -Content $notes

Write-Host "완료: CLAUDE.md 기준 적용이 끝났습니다."
