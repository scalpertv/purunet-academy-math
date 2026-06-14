// 초등 집중 연산반: dmath.i-scream.co.kr UI 기반 뇌과학 고도화 연산 허브

import { useState, useMemo } from "react";
import type { Unit, Problem } from "../lib/types";

type ProblemSetSize = 5 | 10 | 20 | 30 | 40 | 50;
type Grade = 1 | 2 | 3 | 4 | 5 | 6;
type OperationType = "basic" | "mixed";
type Semester = 1 | 2;

interface Props {
  units: Unit[];
  onStart: (title: string, accent: string, generators: Array<() => Problem>, size: ProblemSetSize) => void;
  onPrint: (title: string, generators: Array<() => Problem>, size: ProblemSetSize) => void;
  onPrintAnswer: (title: string, generators: Array<() => Problem>, size: ProblemSetSize) => void;
  onExit?: () => void;
}

const GRADE_CONFIG: Record<Grade, { label: string; color: string; bg: string; border: string; emoji: string; range: string }> = {
  1: { label: "1학년", color: "#e53e3e", bg: "#fff5f5", border: "#fc8181", emoji: "🌱", range: "9까지의 수 · 덧셈 · 뺄셈" },
  2: { label: "2학년", color: "#dd6b20", bg: "#fffaf0", border: "#f6ad55", emoji: "🌿", range: "세 자리 수 · 곱셈 기초" },
  3: { label: "3학년", color: "#38a169", bg: "#f0fff4", border: "#68d391", emoji: "🍀", range: "곱셈 · 나눗셈 · 분수 기초" },
  4: { label: "4학년", color: "#2b6cb0", bg: "#ebf8ff", border: "#63b3ed", emoji: "⭐", range: "혼합 계산 · 분수 · 소수" },
  5: { label: "5학년", color: "#553c9a", bg: "#faf5ff", border: "#b794f4", emoji: "🔷", range: "분수 곱나눗셈 · 비와 비율" },
  6: { label: "6학년", color: "#b7791f", bg: "#fffff0", border: "#f6e05e", emoji: "🏆", range: "비례식 · 분수 나눗셈 · 중등 연계" },
};

// 학기별 월 매핑
const SEMESTER_MONTHS: Record<Semester, number[]> = {
  1: [3, 4, 5, 6, 7, 8],
  2: [9, 10, 11, 12, 1, 2],
};

function monthFromUnit(unit: Unit): number {
  const m = unit.month;
  if (!m) return 3;
  const n = parseInt(m.replace("월", ""), 10);
  return isNaN(n) ? 3 : n;
}

function opUnitsForGrade(units: Unit[], grade: Grade): Unit[] {
  const prefix = `g${grade}-op-`;
  const courseName = `${grade}학년`;
  return units
    .filter((u) => u.course === courseName)
    .map((u) => ({
      ...u,
      topics: u.topics.filter((t) => t.id.startsWith(prefix)),
    }))
    .filter((u) => u.topics.length > 0);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const BRAIN_TIPS = [
  { icon: "🧠", text: "혼합 연습(인터리빙)은 단순 반복보다 시험 성적을 평균 25% 높입니다 — Taylor & Rohrer (2010)" },
  { icon: "⚡", text: "기초 연산이 자동화되면 뇌의 작업기억이 해방되어 더 복잡한 문제를 풀 수 있습니다 — Geary (2011)" },
  { icon: "🎯", text: "정답률 70~85% 구간이 가장 학습 효율이 높은 '최적 도전 수준'입니다 — Bjork (1994)" },
  { icon: "✅", text: "오답 직후 즉각 피드백을 받으면 같은 오류를 반복할 확률이 크게 줄어듭니다 — Hattie (2009)" },
  { icon: "🔀", text: "힌트 없이 직접 풀면 같은 시간 공부해도 기억에 3배 더 오래 남습니다 — Roediger & Butler (2011)" },
];

const COUNT_OPTIONS: { value: ProblemSetSize; label: string; desc: string }[] = [
  { value: 5, label: "5문제", desc: "맛보기" },
  { value: 10, label: "10문제", desc: "빠른 확인" },
  { value: 20, label: "20문제", desc: "충분 연습" },
  { value: 30, label: "30문제", desc: "집중 반복" },
  { value: 40, label: "40문제", desc: "심화 훈련" },
  { value: 50, label: "50문제", desc: "완전 정복" },
];

export default function OperationDrillHub({ units, onStart, onPrint, onPrintAnswer }: Props) {
  const [grade, setGrade] = useState<Grade>(1);
  const [opType, setOpType] = useState<OperationType>("basic");
  const [semester, setSemester] = useState<Semester>(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [problemCount, setProblemCount] = useState<ProblemSetSize>(20);
  const [tipIdx] = useState(() => Math.floor(Math.random() * BRAIN_TIPS.length));
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);

  const cfg = GRADE_CONFIG[grade];

  // 해당 학년의 연산 단원 전체
  const allGradeUnits = useMemo(() => opUnitsForGrade(units, grade), [units, grade]);

  // 학기 필터링
  const semesterUnits = useMemo(() =>
    allGradeUnits.filter((u) => {
      const m = monthFromUnit(u);
      return SEMESTER_MONTHS[semester].includes(m);
    }),
    [allGradeUnits, semester],
  );

  // 선택된 단원 (없으면 첫 번째)
  const activeUnit = useMemo(() => {
    if (selectedUnitId) {
      const found = semesterUnits.find((u) => u.id === selectedUnitId);
      if (found) return found;
    }
    return semesterUnits[0] ?? null;
  }, [semesterUnits, selectedUnitId]);

  // 선택된 토픽
  const activeTopic = useMemo(() => {
    if (!activeUnit) return null;
    if (selectedTopicId) {
      const found = activeUnit.topics.find((t) => t.id === selectedTopicId);
      if (found) return found;
    }
    return null; // null = 전체
  }, [activeUnit, selectedTopicId]);

  // 학년/학기 변경 시 선택 초기화
  function changeGrade(g: Grade) {
    setGrade(g);
    setSelectedUnitId(null);
    setSelectedTopicId(null);
  }
  function changeSemester(s: Semester) {
    setSemester(s);
    setSelectedUnitId(null);
    setSelectedTopicId(null);
  }

  // 기본 연산 - 단원/유형 직접 선택
  function handleBasicStart() {
    if (!activeUnit) return;
    setIsMobileConfigOpen(false);
    const gens = activeTopic
      ? [activeTopic.generate]
      : activeUnit.topics.map((t) => t.generate);
    const title = activeTopic
      ? `${activeUnit.label ?? activeUnit.subtitle} ${activeTopic.title}`
      : `${activeUnit.label ?? activeUnit.subtitle} 전체 연산`;
    onStart(title, cfg.color, gens, problemCount);
  }

  // 혼합 연산 - 학기 전체 혼합
  function handleMixedStart() {
    const gens = shuffle(semesterUnits.flatMap((u) => u.topics.map((t) => t.generate)));
    if (!gens.length) return;
    setIsMobileConfigOpen(false);
    const label = `${cfg.label} ${semester}학기 혼합 연산`;
    onStart(label, cfg.color, gens, problemCount);
  }

  function handleBasicPrint() {
    if (!activeUnit) return;
    const gens = activeTopic ? [activeTopic.generate] : activeUnit.topics.map((t) => t.generate);
    const title = activeTopic
      ? `${activeUnit.label ?? activeUnit.subtitle} ${activeTopic.title}`
      : `${activeUnit.label ?? activeUnit.subtitle} 전체 연산`;
    onPrint(title, gens, problemCount);
  }

  function handleMixedPrint() {
    const gens = shuffle(semesterUnits.flatMap((u) => u.topics.map((t) => t.generate)));
    if (!gens.length) return;
    onPrint(`${cfg.label} ${semester}학기 혼합 연산`, gens, problemCount);
  }

  function handleBasicPrintAnswer() {
    if (!activeUnit) return;
    const gens = activeTopic ? [activeTopic.generate] : activeUnit.topics.map((t) => t.generate);
    const title = activeTopic
      ? `${activeUnit.label ?? activeUnit.subtitle} ${activeTopic.title}`
      : `${activeUnit.label ?? activeUnit.subtitle} 전체 연산`;
    onPrintAnswer(title, gens, problemCount);
  }

  function handleMixedPrintAnswer() {
    const gens = shuffle(semesterUnits.flatMap((u) => u.topics.map((t) => t.generate)));
    if (!gens.length) return;
    onPrintAnswer(`${cfg.label} ${semester}학기 혼합 연산`, gens, problemCount);
  }

  const canStart = opType === "basic" ? !!activeUnit : semesterUnits.length > 0;
  const tip = BRAIN_TIPS[tipIdx % BRAIN_TIPS.length]!;

  return (
    <div className="drill-page">
      {/* ── 모바일 오버레이 ── */}
      {isMobileConfigOpen && (
        <div className="drill-mobile-overlay" onClick={() => setIsMobileConfigOpen(false)} />
      )}

      {/* ── 헤더 ── */}
      <header className="drill-header">
        <div className="drill-header-inner">
          <div className="drill-header-left">
            <div className="drill-logo">
              <span className="drill-logo-icon">⚡</span>
              <div>
                <strong>꿈쟁이 집중 연산반</strong>
                <small>뇌과학 기반 초등 1~6학년 연산 훈련</small>
              </div>
            </div>
          </div>
          <div className="drill-header-right">
            <span className="drill-tip-badge">{tip.icon} {tip.text}</span>
            <a
              href="https://dreamer-ai-academy.pages.dev"
              className="drill-home-btn"
              title="꿈쟁이 AI 아카데미 홈으로"
            >
              🏠 학원 홈
            </a>
          </div>
        </div>
      </header>

      <div className="drill-body">
        {/* ── 학년 탭 ── */}
        <nav className="drill-grade-nav" role="tablist" aria-label="학년 선택">
          {([1, 2, 3, 4, 5, 6] as Grade[]).map((g) => {
            const c = GRADE_CONFIG[g];
            return (
              <button
                key={g}
                role="tab"
                aria-selected={grade === g}
                className={`drill-grade-tab ${grade === g ? "active" : ""}`}
                style={{
                  ["--g-color" as string]: c.color,
                  ["--g-bg" as string]: c.bg,
                  ["--g-border" as string]: c.border,
                }}
                onClick={() => changeGrade(g)}
              >
                <span className="drill-grade-emoji">{c.emoji}</span>
                <span className="drill-grade-label">{c.label}</span>
                <span className="drill-grade-range">{c.range}</span>
              </button>
            );
          })}
        </nav>

        <div className="drill-main">
          {/* ── 좌측 설정 패널 (모바일: 하단 드로어) ── */}
          <aside className={`drill-config-panel${isMobileConfigOpen ? " mobile-open" : ""}`}>
            {/* 모바일 드래그 핸들 */}
            <div className="drill-config-drag-handle" onClick={() => setIsMobileConfigOpen(false)}>
              <span />
            </div>

            {/* 연산 유형 토글 */}
            <div className="drill-config-block">
              <span className="drill-config-label">연산 유형</span>
              <div className="drill-toggle-group" role="group" aria-label="연산 유형 선택">
                <button
                  className={`drill-toggle-btn ${opType === "basic" ? "active" : ""}`}
                  onClick={() => setOpType("basic")}
                >
                  기본 연산
                  <small>단원별 집중</small>
                </button>
                <button
                  className={`drill-toggle-btn ${opType === "mixed" ? "active" : ""}`}
                  onClick={() => setOpType("mixed")}
                >
                  혼합 연산
                  <small>섞어서 강화</small>
                </button>
              </div>
            </div>

            {/* 학기 토글 */}
            <div className="drill-config-block">
              <span className="drill-config-label">학기</span>
              <div className="drill-semester-group" role="group" aria-label="학기 선택">
                {([1, 2] as Semester[]).map((s) => (
                  <button
                    key={s}
                    className={`drill-semester-btn ${semester === s ? "active" : ""}`}
                    style={{ ["--g-color" as string]: cfg.color }}
                    onClick={() => changeSemester(s)}
                  >
                    {s}학기
                  </button>
                ))}
              </div>
            </div>

            {/* 단원 선택 (기본 연산일 때만) */}
            {opType === "basic" && (
              <div className="drill-config-block">
                <span className="drill-config-label">단원 선택</span>
                {semesterUnits.length === 0 ? (
                  <p className="drill-empty-note">해당 학기에 연산 단원이 없습니다.</p>
                ) : (
                  <div className="drill-unit-pills">
                    {semesterUnits.map((u) => (
                      <button
                        key={u.id}
                        className={`drill-unit-pill ${(activeUnit?.id === u.id) ? "active" : ""}`}
                        style={{ ["--g-color" as string]: cfg.color, ["--g-border" as string]: cfg.border }}
                        onClick={() => { setSelectedUnitId(u.id); setSelectedTopicId(null); }}
                      >
                        <span>{u.label ?? u.subtitle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 문제 유형 선택 (기본 연산 + 단원 선택됐을 때) */}
            {opType === "basic" && activeUnit && (
              <div className="drill-config-block">
                <span className="drill-config-label">문제 유형</span>
                <div className="drill-topic-pills">
                  <button
                    className={`drill-topic-pill ${selectedTopicId === null ? "active" : ""}`}
                    style={{ ["--g-color" as string]: cfg.color }}
                    onClick={() => setSelectedTopicId(null)}
                  >
                    전체 유형
                    <small>{activeUnit.topics.length}가지</small>
                  </button>
                  {activeUnit.topics.map((t) => (
                    <button
                      key={t.id}
                      className={`drill-topic-pill ${selectedTopicId === t.id ? "active" : ""}`}
                      style={{ ["--g-color" as string]: cfg.color }}
                      onClick={() => setSelectedTopicId(t.id)}
                    >
                      {t.title}
                      <small>{t.desc}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 혼합 연산 요약 */}
            {opType === "mixed" && (
              <div className="drill-config-block">
                <span className="drill-config-label">혼합 구성</span>
                <div className="drill-mixed-summary">
                  <div className="drill-mixed-stat">
                    <strong>{semesterUnits.length}</strong>
                    <span>단원</span>
                  </div>
                  <div className="drill-mixed-stat">
                    <strong>{semesterUnits.reduce((s, u) => s + u.topics.length, 0)}</strong>
                    <span>유형</span>
                  </div>
                  <div className="drill-mixed-stat">
                    <strong>🔀</strong>
                    <span>랜덤 섞기</span>
                  </div>
                </div>
                <p className="drill-mixed-desc">
                  {cfg.label} {semester}학기의 모든 연산 유형을 무작위로 섞어서 출제합니다.
                  혼합 연습은 단순 반복보다 장기 기억에 훨씬 효과적입니다.
                </p>
              </div>
            )}

            {/* 문제 수 */}
            <div className="drill-config-block">
              <span className="drill-config-label">문제 수</span>
              <div className="drill-count-group" role="group" aria-label="문제 수 선택">
                {COUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`drill-count-btn ${problemCount === opt.value ? "active" : ""}`}
                    style={{ ["--g-color" as string]: cfg.color }}
                    onClick={() => setProblemCount(opt.value)}
                  >
                    <strong>{opt.label}</strong>
                    <small>{opt.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* 시작 버튼 */}
            <button
              className="drill-start-btn"
              style={{ ["--g-color" as string]: cfg.color }}
              disabled={!canStart}
              onClick={opType === "basic" ? handleBasicStart : handleMixedStart}
            >
              <span className="drill-start-icon">▶</span>
              학습 시작하기
              <small>{problemCount}문제 · {opType === "mixed" ? "혼합 연산" : (activeTopic ? activeTopic.title : (activeUnit ? `${activeUnit.label ?? activeUnit.subtitle} 전체` : ""))}</small>
            </button>

            {/* 프린트 버튼 */}
            <button
              className="drill-print-btn"
              style={{ ["--g-color" as string]: cfg.color }}
              disabled={!canStart}
              onClick={opType === "basic" ? handleBasicPrint : handleMixedPrint}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              학습지 출력하기
              <small>문제지 인쇄</small>
            </button>

            {/* 해답 출력 버튼 */}
            <button
              className="drill-print-btn"
              style={{ ["--g-color" as string]: cfg.color }}
              disabled={!canStart}
              onClick={opType === "basic" ? handleBasicPrintAnswer : handleMixedPrintAnswer}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              해답 출력하기
              <small>정답지 인쇄</small>
            </button>

          </aside>

          {/* ── 우측 단원 카드 그리드 ── */}
          <section className="drill-content">

            {/* 학년 소개 헤더 */}
            <div className="drill-content-header" style={{ ["--g-color" as string]: cfg.color, ["--g-bg" as string]: cfg.bg, ["--g-border" as string]: cfg.border }}>
              <div className="drill-content-header-text">
                <span className="drill-grade-badge">{cfg.emoji} {cfg.label} {semester}학기</span>
                <h2>{cfg.label} 집중 연산반</h2>
                <p>{cfg.range}</p>
              </div>
              <div className="drill-content-header-stats">
                <div>
                  <strong>{semesterUnits.length}</strong>
                  <span>단원</span>
                </div>
                <div>
                  <strong>{semesterUnits.reduce((s, u) => s + u.topics.length, 0)}</strong>
                  <span>유형</span>
                </div>
                <div>
                  <strong>{problemCount}</strong>
                  <span>문제/세션</span>
                </div>
              </div>
            </div>

            {/* 단원 카드 그리드 */}
            {semesterUnits.length === 0 ? (
              <div className="drill-no-units">
                <span>📭</span>
                <p>이 학기에는 연산 단원이 없습니다.</p>
                <button onClick={() => changeSemester(semester === 1 ? 2 : 1)}>
                  {semester === 1 ? "2학기" : "1학기"} 보기
                </button>
              </div>
            ) : (
              <div className="drill-unit-grid">
                {semesterUnits.map((unit) => {
                  const isSelected = activeUnit?.id === unit.id;
                  return (
                    <article
                      key={unit.id}
                      className={`drill-unit-card ${isSelected ? "selected" : ""}`}
                      style={{ ["--g-color" as string]: cfg.color, ["--g-bg" as string]: cfg.bg, ["--g-border" as string]: cfg.border }}
                      onClick={() => { setSelectedUnitId(unit.id); setSelectedTopicId(null); setOpType("basic"); }}
                    >
                      <header className="drill-unit-card-header">
                        <span className="drill-unit-month-badge">{unit.label ?? unit.subtitle}</span>
                        <span className="drill-unit-topic-count">{unit.topics.length}유형</span>
                      </header>
                      <strong className="drill-unit-title">{unit.subtitle}</strong>
                      <div className="drill-unit-topics">
                        {unit.topics.slice(0, 4).map((t) => (
                          <span key={t.id} className="drill-unit-topic-chip">{t.title}</span>
                        ))}
                        {unit.topics.length > 4 && (
                          <span className="drill-unit-topic-chip more">+{unit.topics.length - 4}</span>
                        )}
                      </div>
                      <div className="drill-unit-card-actions">
                        <button
                          className="drill-unit-start-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMobileConfigOpen(false);
                            onStart(`${unit.label ?? unit.subtitle} 전체`, cfg.color, unit.topics.map((t) => t.generate), problemCount);
                          }}
                        >
                          ▶ {problemCount}문제 시작
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* 혼합 연산 카드 */}
                <article
                  className="drill-unit-card mixed-card"
                  style={{ ["--g-color" as string]: cfg.color }}
                  onClick={() => { setOpType("mixed"); }}
                >
                  <header className="drill-unit-card-header">
                    <span className="drill-unit-month-badge mixed">혼합 연산</span>
                    <span className="drill-unit-topic-count">{semesterUnits.reduce((s, u) => s + u.topics.length, 0)}유형</span>
                  </header>
                  <strong className="drill-unit-title">전체 혼합 연산</strong>
                  <p className="drill-unit-mixed-desc">
                    {semester}학기 전 단원을 무작위 섞기.<br />
                    인터리빙 효과로 장기 기억 강화
                  </p>
                  <div className="drill-unit-card-actions">
                    <button
                      className="drill-unit-start-btn mixed"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileConfigOpen(false);
                        const gens = shuffle(semesterUnits.flatMap((u) => u.topics.map((t) => t.generate)));
                        if (gens.length) onStart(`${cfg.label} ${semester}학기 혼합`, cfg.color, gens, problemCount);
                      }}
                    >
                      🔀 혼합 {problemCount}문제 시작
                    </button>
                  </div>
                </article>
              </div>
            )}

            {/* 뇌과학 가이드 */}
            <section className="drill-brain-section">
              <h3 className="drill-brain-title">🧠 뇌과학 기반 학습 가이드</h3>
              <div className="drill-brain-grid">
                {BRAIN_TIPS.map((t, i) => (
                  <div key={i} className={`drill-brain-card ${i === tipIdx % BRAIN_TIPS.length ? "highlight" : ""}`}>
                    <span className="drill-brain-icon">{t.icon}</span>
                    <p>{t.text}</p>
                  </div>
                ))}
              </div>
              <div className="drill-routine-box">
                <h4>📅 추천 하루 학습 루틴</h4>
                <div className="drill-routine-steps">
                  <div className="drill-routine-step">
                    <span>01</span>
                    <div>
                      <strong>워밍업 5분</strong>
                      <small>어제 단원 10문제 인출 연습</small>
                    </div>
                  </div>
                  <div className="drill-routine-step">
                    <span>02</span>
                    <div>
                      <strong>집중 15분</strong>
                      <small>오늘 단원 20문제 (목표 정답률 70~85%)</small>
                    </div>
                  </div>
                  <div className="drill-routine-step">
                    <span>03</span>
                    <div>
                      <strong>혼합 10분</strong>
                      <small>3개 이상 단원 섞어서 30문제 스프린트</small>
                    </div>
                  </div>
                  <div className="drill-routine-step">
                    <span>04</span>
                    <div>
                      <strong>오답 복기 5분</strong>
                      <small>틀린 문제 원리를 소리 내어 설명하기</small>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>

      {/* ── 모바일 FAB: 설정 드로어 열기 ── */}
      <button
        className="drill-mobile-fab"
        style={{ ["--g-color" as string]: cfg.color }}
        onClick={() => setIsMobileConfigOpen(true)}
        aria-label="학습 설정 열기"
      >
        ⚙️ <span>학습 설정</span>
        {problemCount && <small>{problemCount}문제 · {opType === "mixed" ? "혼합" : "기본"}</small>}
      </button>
    </div>
  );
}
