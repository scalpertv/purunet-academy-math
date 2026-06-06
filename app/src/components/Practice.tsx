// 연습 화면: 선택한 문제 세트, 자동 채점, 선택형/입력형 응답, 세션 진행률

import { useEffect, useMemo, useRef, useState } from "react";
import { isCorrect, formatAnswer } from "../lib/check";
import type { Problem, SolutionStep } from "../lib/types";
import type { ReaderPrefs } from "../lib/readerPrefs";
import MathText from "./MathText";
import MathVisual from "./MathVisual";
import LogicFlowCard from "./LogicFlowCard";

interface Props {
  title: string;
  accent: string;
  problems: Problem[];
  problemSetSize: 5 | 10 | 20 | 30 | 40 | 50;
  prefs: ReaderPrefs;
  learnerLabel: string;
  onPrefsChange: (prefs: ReaderPrefs) => void;
  onAttempt: (ok: boolean, problem: Problem, learnerAnswer: string) => void;
  onBookmark: () => void;
  onPrintWorksheet: () => void;
  onPrintAnswerSheet: () => void;
  onExit: () => void;
}

type Phase = "input" | "graded";

const KIND_LABEL: Record<string, string> = {
  integer: "계산형",
  fraction: "분수형",
  fractionPair: "통분형",
  compare: "비교형",
  choice: "선택형",
  numberSet: "집합형",
};

function inputModeFor(problem: Problem): React.HTMLAttributes<HTMLInputElement>["inputMode"] {
  if (problem.kind === "integer") return "numeric";
  return "text";
}

function placeholderFor(problem: Problem): string {
  if (problem.kind === "fraction") return "예: 3/5";
  if (problem.kind === "fractionPair") return "예: 4/12, 9/12";
  if (problem.kind === "numberSet") return "예: 1, 2, 4";
  return "정답 입력";
}

function pickNaturalKoreanVoice(voices: SpeechSynthesisVoice[]) {
  const scored = voices
    .map((voice) => {
      const searchable = `${voice.name} ${voice.lang} ${voice.voiceURI}`.toLowerCase();
      let score = 0;
      if (voice.lang.toLowerCase().startsWith("ko")) score += 100;
      if (/korean|한국|ko-kr|ko_kr/.test(searchable)) score += 30;
      if (/natural|neural|online|premium/.test(searchable)) score += 35;
      if (/microsoft|google|siri|apple/.test(searchable)) score += 20;
      if (/sunhi|heami|yuna|injoo|injoon|서연|유나|한국어/.test(searchable)) score += 12;
      if (!voice.localService) score += 4;
      return { voice, score };
    })
    .filter((item) => item.score >= 80)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.voice;
}

function waitForSpeechVoices() {
  if (!("speechSynthesis" in window)) return Promise.resolve([] as SpeechSynthesisVoice[]);
  const loaded = window.speechSynthesis.getVoices();
  if (loaded.length > 0) return Promise.resolve(loaded);
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.speechSynthesis.removeEventListener("voiceschanged", finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish);
    window.setTimeout(finish, 450);
  });
}

function toKoreanMathSpeech(text: string) {
  return text
    .replace(/\\frac\{(-?\d+)\}\{(-?\d+)\}/g, (_m, n: string, d: string) => `${d}분의 ${n}`)
    .replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, (_m, w: string, n: string, d: string) => `${w}와 ${d}분의 ${n}`)
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_m, n: string, d: string) => `${d}분의 ${n}`)
    .replace(/(\d)\s*:\s*(\d)/g, "$1 대 $2")
    .replace(/[+＋]/g, " 더하기 ")
    .replace(/[×＊*]/g, " 곱하기 ")
    .replace(/[÷]/g, " 나누기 ")
    .replace(/(\d)\s*-\s*(?=\d|□|\()/g, "$1 빼기 ")
    .replace(/[−–]/g, " 빼기 ")
    .replace(/[=＝]/g, " 은 ")
    .replace(/\(/g, " 괄호 열고 ")
    .replace(/\)/g, " 괄호 닫고 ")
    .replace(/□/g, " 빈칸 ")
    .replace(/[>＞]/g, " 보다 큼 ")
    .replace(/[<＜]/g, " 보다 작음 ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Practice({
  title,
  accent,
  problems,
  prefs,
  learnerLabel,
  onPrefsChange,
  onAttempt,
  onBookmark,
  onPrintWorksheet,
  onPrintAnswerSheet,
  onExit,
}: Props) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [correct, setCorrect] = useState(false);
  const [stats, setStats] = useState({ right: 0, total: 0, streak: 0 });
  const [saved, setSaved] = useState(false);
  const [results, setResults] = useState<Array<boolean | null>>(() => Array(problems.length).fill(null));
  const inputRef = useRef<HTMLInputElement>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);

  // 단계별 풀이 state
  const [stepValues, setStepValues] = useState<string[]>([]);
  const [stepResults, setStepResults] = useState<Array<boolean | null>>([]);

  // 개념 카드 열림/닫힘 state
  const [conceptOpen, setConceptOpen] = useState(true);

  const problem = (problems[index] ?? problems[0])!;
  const sessionTarget = problems.length;
  const isLastProblem = index >= sessionTarget - 1;
  const isComplete = phase === "graded" && isLastProblem;
  const isChoice = Boolean(problem.choices?.length);
  const isCompare = problem.kind === "compare" && !isChoice;

  useEffect(() => {
    if (!isChoice && !isCompare) inputRef.current?.focus();
  }, [problem, isChoice, isCompare]);

  // 문제 바뀔 때 단계 state 초기화
  useEffect(() => {
    const count = problem.solutionSteps?.length ?? 0;
    setStepValues(Array(count).fill(""));
    setStepResults(Array(count).fill(null));
    // 개념카드: 첫 문제는 열림, 이후는 닫힘
    setConceptOpen(index === 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const accuracy = useMemo(
    () => (stats.total === 0 ? 0 : Math.round((stats.right / stats.total) * 100)),
    [stats],
  );

  const progress = Math.min(100, Math.round((stats.total / sessionTarget) * 100));

  useEffect(() => {
    window.speechSynthesis?.cancel();
    const prev = ttsAudioRef.current;
    if (prev) { prev.pause(); prev.src = ""; }
    setTtsSpeaking(false);

    const promptSpeech = toKoreanMathSpeech(problem.prompt);
    const expressionSpeech = toKoreanMathSpeech(problem.expression).replace(/\n/g, ". ");
    const text = `${promptSpeech}. ${expressionSpeech}.`;
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=Seoyeon&text=${encodeURIComponent(text.slice(0, 500))}`;

    const audio = new Audio(url);
    audio.preload = "auto";
    ttsAudioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  function grade(nextValue = value) {
    if (phase === "graded" || nextValue.trim() === "") return;
    const ok = isCorrect(problem, nextValue);
    setValue(nextValue);
    setCorrect(ok);
    setPhase("graded");
    setResults((prev) => {
      const next = [...prev];
      next[index] = ok;
      return next;
    });
    setStats((s) => ({
      right: s.right + (ok ? 1 : 0),
      total: s.total + 1,
      streak: ok ? s.streak + 1 : 0,
    }));
    onAttempt(ok, problem, nextValue);

    // 단계별 풀이 결과 채점
    if (problem.solutionSteps) {
      setStepResults(
        problem.solutionSteps.map((step: SolutionStep, si: number) => {
          const sv = stepValues[si]?.trim() ?? "";
          if (sv === "") return null;
          return sv === step.answer.trim();
        }),
      );
    }
  }

  function next() {
    if (isLastProblem) { onExit(); return; }
    setIndex((c) => c + 1);
    setValue("");
    setPhase("input");
    setSaved(false);
  }

  function updateStepValue(si: number, v: string) {
    setStepValues((prev) => {
      const next = [...prev];
      next[si] = v;
      return next;
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    if (phase === "input") grade();
    else next();
  }

  async function speakMission() {
    window.speechSynthesis?.cancel();
    const audio = ttsAudioRef.current;
    if (!audio) return;
    if (ttsSpeaking) {
      audio.pause();
      audio.currentTime = 0;
      setTtsSpeaking(false);
      return;
    }
    const promptSpeech = toKoreanMathSpeech(problem.prompt);
    const expressionSpeech = toKoreanMathSpeech(problem.expression).replace(/\n/g, ". ");
    const fallbackText = `${promptSpeech}. 문제는, ${expressionSpeech}.`;

    async function fallbackToWebSpeech() {
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      const naturalVoice = pickNaturalKoreanVoice(await waitForSpeechVoices());
      if (naturalVoice) {
        utterance.voice = naturalVoice;
        utterance.lang = naturalVoice.lang || "ko-KR";
      } else {
        utterance.lang = "ko-KR";
      }
      utterance.rate = naturalVoice ? 0.86 : 0.9;
      utterance.pitch = naturalVoice ? 1.04 : 1;
      utterance.volume = 1;
      utterance.onend = () => setTtsSpeaking(false);
      setTtsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }

    audio.currentTime = 0;
    audio.onended = () => setTtsSpeaking(false);
    audio.onerror = () => { setTtsSpeaking(false); void fallbackToWebSpeech(); };
    setTtsSpeaking(true);
    audio.play().catch(() => { setTtsSpeaking(false); void fallbackToWebSpeech(); });
  }

  function saveForReview() {
    try {
      const raw = localStorage.getItem("codex-math-review-list");
      const list = raw ? JSON.parse(raw) : [];
      const next = [
        { title, topicId: problem.topicId, prompt: problem.prompt, expression: problem.expression, savedAt: new Date().toISOString() },
        ...list,
      ].slice(0, 30);
      localStorage.setItem("codex-math-review-list", JSON.stringify(next));
      if (!saved) onBookmark();
      setSaved(true);
    } catch {
      setSaved(true);
    }
  }

  const shellClass = [
    "practice-shell",
    "prac-shell",
    prefs.theme === "night" ? "reader-night" : "",
    prefs.textSize === "large" ? "reader-large" : "",
  ].filter(Boolean).join(" ");

  // 진행 도트: 최대 50개 표시
  const dotCount = Math.min(sessionTarget, 50);

  return (
    <div className={shellClass} style={{ ["--accent" as string]: accent }}>

      {/* ── 헤더 ── */}
      <header className="prac-header">
        <button className="prac-back" onClick={onExit} aria-label="단원 선택으로 돌아가기">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          단원 선택
        </button>
        <div className="prac-header-center">
          <h1 className="prac-title">{title}</h1>
          {learnerLabel && <span className="prac-learner">{learnerLabel}</span>}
        </div>
        <div className="prac-score-box">
          <strong>{accuracy}%</strong>
          <span>{stats.right}/{stats.total}</span>
        </div>
      </header>

      {/* ── 진행 도트 ── */}
      <div className="prac-dots-wrap" aria-label={`문제 진행 ${stats.total}/${sessionTarget}`}>
        <div className="prac-dots">
          {Array.from({ length: dotCount }, (_, i) => (
            <span
              key={i}
              className={[
                "prac-dot",
                results[i] === true ? "prac-dot--ok" :
                results[i] === false ? "prac-dot--ng" :
                i === index ? "prac-dot--cur" : "",
              ].filter(Boolean).join(" ")}
            />
          ))}
        </div>
        <div className="prac-progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── 문제 메인 ── */}
      <main className="prac-main">
        <article className="prac-card fade-in" key={`${index}-${problem.topicId}`}>

          {/* 문제 번호 + 뱃지 + 도구 버튼 */}
          <div className="prac-card-top">
            <div className="prac-badges">
              <span className="prac-num-badge">
                {String(index + 1).padStart(2, "0")} / {sessionTarget}
              </span>
              <span className="prac-kind-badge">
                {KIND_LABEL[problem.kind] ?? "풀기"}
              </span>
            </div>
            <div className="prac-card-tools">
              <button
                className={`prac-tool-btn ${ttsSpeaking ? "on" : ""}`}
                onClick={speakMission}
                title="문제 읽어주기"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ttsSpeaking
                    ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                    : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                  }
                </svg>
                {ttsSpeaking ? "정지" : "읽기"}
              </button>
              <button
                className={`prac-tool-btn ${saved ? "on" : ""}`}
                onClick={saveForReview}
                title="복습 저장"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {saved ? "저장됨" : "저장"}
              </button>
            </div>
          </div>

          {/* 지시문 */}
          <p className="prac-prompt">{problem.prompt}</p>

          {/* 개념 핵심 카드 (conceptNote가 있을 때만 표시) */}
          {problem.conceptNote && (
            <div className={`prac-concept-card ${conceptOpen ? "open" : ""}`}>
              <button
                className="prac-concept-toggle"
                onClick={() => setConceptOpen((o) => !o)}
                aria-expanded={conceptOpen}
              >
                <span className="prac-concept-icon">💡</span>
                <span className="prac-concept-label">개념 핵심</span>
                <span className="prac-concept-chevron">{conceptOpen ? "▲" : "▼"}</span>
              </button>
              {conceptOpen && (
                <p className="prac-concept-body">{problem.conceptNote}</p>
              )}
            </div>
          )}

          {/* 풀이 흐름도 카드 (solutionSteps가 있을 때만 표시) */}
          {problem.solutionSteps && problem.solutionSteps.length > 0 && (
            <LogicFlowCard
              steps={problem.solutionSteps}
              stepValues={stepValues}
              stepResults={stepResults}
              phase={phase}
              onStepChange={updateStepValue}
            />
          )}

          {/* 수식 표현 영역 */}
          <div className="prac-expr" aria-live="polite">
            {problem.visual && <MathVisual visual={problem.visual} />}
            {problem.expression.split("\n").map((line, li) => (
              <span key={`${problem.topicId}-${index}-${li}`}>
                <MathText text={line} />
              </span>
            ))}
          </div>

          {problem.hint && <p className="prac-hint">{problem.hint}</p>}

          {/* ── 입력 영역 ── */}

          {/* 비교형: <  =  > 버튼 */}
          {isCompare && (
            <div className="prac-cmp-wrap">
              <p className="prac-cmp-label">두 값의 크기를 비교해 선택하세요.</p>
              <div className="prac-cmp-row">
                {(["<", "=", ">"] as const).map((sym) => (
                  <button
                    key={sym}
                    className={[
                      "prac-cmp-btn",
                      value === sym ? "chosen" : "",
                      phase === "graded" && value === sym ? (correct ? "ok" : "ng") : "",
                      phase === "graded" && sym === formatAnswer(problem) && !correct ? "reveal" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => phase === "input" ? grade(sym) : undefined}
                    disabled={phase === "graded"}
                    aria-label={sym === "<" ? "작다" : sym === "=" ? "같다" : "크다"}
                  >
                    <span className="prac-cmp-sym">{sym}</span>
                    <small>{sym === "<" ? "작다" : sym === "=" ? "같다" : "크다"}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 선택형 */}
          {isChoice && (
            <div className="prac-choices">
              {problem.choices?.map((ch, ci) => {
                const chosen = value === ch;
                const correctChoice = phase === "graded" && ch === formatAnswer(problem);
                return (
                  <button
                    key={ch}
                    className={[
                      "prac-choice",
                      chosen ? "chosen" : "",
                      phase === "graded" && chosen ? (correct ? "ok" : "ng") : "",
                      correctChoice ? "reveal" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => phase === "input" ? grade(ch) : undefined}
                    disabled={phase === "graded"}
                  >
                    <span className="prac-choice-num">
                      {String.fromCharCode(0x2460 + ci)}
                    </span>
                    <span className="prac-choice-body">
                      <MathText text={ch} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 입력형 */}
          {!isChoice && !isCompare && (
            <div className="prac-input-area">
              <div className="prac-input-row">
                <input
                  ref={inputRef}
                  className="prac-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={placeholderFor(problem)}
                  disabled={phase === "graded"}
                  inputMode={inputModeFor(problem)}
                  autoComplete="off"
                  aria-label="정답 입력"
                />
                <button
                  className="prac-submit-btn"
                  onClick={() => grade()}
                  disabled={phase === "graded" || value.trim() === ""}
                >
                  제출
                </button>
              </div>
              {problem.kind === "fraction" && phase === "input" && (
                <p className="prac-input-tip">
                  진분수 <code>3/5</code> · 대분수 <code>2 3/5</code>
                </p>
              )}
              {problem.kind === "fractionPair" && phase === "input" && (
                <p className="prac-input-tip">
                  두 분수를 쉼표로 입력 <code>4/12, 9/12</code>
                </p>
              )}
              {problem.kind === "numberSet" && phase === "input" && (
                <p className="prac-input-tip">
                  숫자를 쉼표로 나열 <code>1, 2, 4</code>
                </p>
              )}
            </div>
          )}

          {/* ── 채점 피드백 ── */}
          {phase === "graded" && (
            <div className={`prac-feedback ${correct ? "prac-fb--ok" : "prac-fb--ng"} slide-in`}>
              <div className="prac-fb-head">
                <span className="prac-fb-icon">{correct ? "✓" : "✗"}</span>
                <div className="prac-fb-text">
                  <strong>{correct ? "정답입니다!" : "틀렸어요"}</strong>
                  {!correct && (
                    <p className="prac-correct-reveal">
                      정답&nbsp;→&nbsp;<MathText text={formatAnswer(problem)} />
                    </p>
                  )}
                </div>
              </div>
              <div className="prac-solution">
                <MathText text={problem.solution} />
              </div>
            </div>
          )}

          {/* ── 다음 문제 버튼 ── */}
          {phase === "graded" && !isComplete && (
            <button className="prac-next-btn" onClick={next}>
              다음 문제 →
            </button>
          )}

          {/* ── 완료 카드 ── */}
          {isComplete && (
            <div className="prac-complete slide-in">
              <div className="prac-complete-emoji">🎉</div>
              <strong className="prac-complete-title">학습 완료!</strong>
              <p className="prac-complete-summary">
                정답률 <b>{accuracy}%</b> &nbsp;·&nbsp; {stats.right} / {sessionTarget}문제 정답
                {stats.streak >= 3 && <>&nbsp;·&nbsp; 연속 {stats.streak}개 🔥</>}
              </p>
              <button className="prac-exit-btn" onClick={onExit}>
                ← 단원 선택으로
              </button>
            </div>
          )}

        </article>
      </main>

      {/* ── 하단 통계 바 ── */}
      <footer className="prac-stats-bar">
        <div className="prac-stat">
          <span>맞힌 문제</span>
          <strong>{stats.right}</strong>
        </div>
        <div className="prac-stat">
          <span>연속 정답</span>
          <strong className={stats.streak >= 3 ? "prac-streak-hot" : ""}>
            {stats.streak}{stats.streak >= 3 ? "🔥" : ""}
          </strong>
        </div>
        <div className="prac-stat">
          <span>정답률</span>
          <strong>{accuracy}%</strong>
        </div>
        <div className="prac-stat">
          <span>남은 문제</span>
          <strong>{Math.max(0, sessionTarget - stats.total)}</strong>
        </div>
        <div className="prac-bar-tools">
          <button
            className={prefs.theme === "night" ? "on" : ""}
            onClick={() => onPrefsChange({ ...prefs, theme: prefs.theme === "night" ? "storybook" : "night" })}
            title="야간 모드"
          >
            {prefs.theme === "night" ? "☀️" : "🌙"}
          </button>
          <button
            className={prefs.textSize === "large" ? "on" : ""}
            onClick={() => onPrefsChange({ ...prefs, textSize: prefs.textSize === "large" ? "normal" : "large" })}
            title="글자 크기"
          >
            {prefs.textSize === "large" ? "A−" : "A+"}
          </button>
          <button onClick={onPrintWorksheet} title="문제지 출력">
            🖨️ 문제지
          </button>
          <button onClick={onPrintAnswerSheet} title="답안지 출력">
            📋 답안지
          </button>
        </div>
      </footer>

    </div>
  );
}
