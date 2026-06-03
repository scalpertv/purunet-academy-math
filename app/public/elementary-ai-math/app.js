// 초등 AI 수학 코치 - 집중 연산 4지선다 AI 코치 메인 로직
// generators.js(번들)가 먼저 로드되어야 합니다.

// ============================================================
// 상태
// ============================================================
const AI_MODULE_ID = "ai-elementary-math:purunet-math-ebook-elementary-ai-math";

const app = {
  grade: 1, semester: 1, topicId: "",
  problem: null, choices: [], answered: false,
  total: 0, correct: 0, wrong: 0, streak: 0,
  xp: 0, gems: 0, badges: 0, bossHp: 100,
  toastId: 0, coachTypingTimer: null, weakMap: {},
  questCoachAnswers: 0, questHinted: false, questExplained: false,
  setLimit: 10, sessionProblems: 0
};

const $ = id => document.getElementById(id);

// ============================================================
// 헬퍼 함수
// ============================================================
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gcdNum(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  return b === 0 ? a : gcdNum(b, a % b);
}

function escapeHTML(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ============================================================
// 문제의 answer로부터 4지선다 생성
// ============================================================
function buildChoices4(answer, kind) {
  const ansStr = String(answer);
  const pool = new Set([ansStr]);

  if (kind === "compare") {
    ["<", ">", "="].forEach(s => pool.add(s));
  } else if (/^-?\d+\/-?\d+$/.test(ansStr)) {
    // 분수 형식: n/d
    const [n, d] = ansStr.split("/").map(Number);
    pool.add(`${n + 1}/${d}`);
    pool.add(`${Math.max(1, n - 1)}/${d}`);
    pool.add(`${n}/${d + 1}`);
    pool.add(`${n}/${Math.max(1, d - 1)}`);
    if (gcdNum(n, d) !== 1) {
      const g = gcdNum(n, d);
      pool.add(`${n / g}/${d / g}`);
    }
  } else {
    const numeric = Number(ansStr);
    if (Number.isFinite(numeric)) {
      const n = numeric;
      [n + 1, n - 1, n + 2, n - 2, n + 3, n - 3, n + 10, n - 10,
       n * 2, Math.round(n / 2)].forEach(v => {
        if (v !== n) pool.add(String(v));
      });
    } else {
      // 문자열 답(pi 포함 등)
      const withPi = ansStr.includes("π");
      if (withPi) {
        pool.add(ansStr.replace(/\d+π/, m => `${parseInt(m) + 1}π`));
        pool.add(ansStr.replace(/\d+π/, m => `${Math.max(1,parseInt(m) - 1)}π`));
        pool.add(ansStr + "2");
      }
      ["1", "2", "3", "4", "5"].forEach(v => pool.add(v));
    }
  }

  const distractors = [...pool].filter(v => v !== ansStr);
  const chosen = shuffle(distractors).slice(0, 3);
  return shuffle([ansStr, ...chosen]);
}

// ============================================================
// 번들 generators를 이용한 커리큘럼 구성
// ============================================================
let CURRICULUM = {}; // { gradeNum: { label, emoji, 1: [topics], 2: [topics] } }

const GRADE_META = {
  1: { label: "1학년", emoji: "🌱" },
  2: { label: "2학년", emoji: "🌿" },
  3: { label: "3학년", emoji: "🍀" },
  4: { label: "4학년", emoji: "⭐" },
  5: { label: "5학년", emoji: "🔷" },
  6: { label: "6학년", emoji: "🏆" },
};

function initCurriculum() {
  const raw = window.PurunetGenerators && window.PurunetGenerators.OP_CURRICULUM;
  if (!raw) {
    console.error("PurunetGenerators not loaded");
    return;
  }
  for (const [grade, semesters] of Object.entries(raw)) {
    const g = Number(grade);
    CURRICULUM[g] = { ...GRADE_META[g], 1: semesters["1"] || [], 2: semesters["2"] || [] };
  }
}

function currentTopics() {
  const entry = CURRICULUM[app.grade];
  return (entry && entry[app.semester]) || [];
}

function currentTopicEntry() {
  const topics = currentTopics();
  return topics.find(t => t.id === app.topicId) || topics[0] || null;
}

// ============================================================
// 문제 생성: generators 번들 사용
// ============================================================
function generateProblem(topicEntry) {
  if (!topicEntry || typeof topicEntry.generate !== "function") return null;

  let raw;
  try { raw = topicEntry.generate(); } catch(e) { return null; }
  if (!raw) return null;

  const ansStr = String(raw.answer ?? "");
  // kind: "choice" → choices 이미 있음, 나머지 → 새로 생성
  const choices = (raw.kind === "choice" && Array.isArray(raw.choices) && raw.choices.length >= 2)
    ? shuffle(raw.choices.map(String))
    : buildChoices4(ansStr, raw.kind);

  // 4개로 맞춤
  const choices4 = choices.slice(0, 4);
  while (choices4.length < 4) choices4.push(String(choices4.length + 1));

  return {
    skillId:    topicEntry.id,
    skillTitle: topicEntry.title,
    question:   raw.prompt || "계산하세요.",
    expression: raw.expression || "",
    answer:     ansStr,
    solution:   raw.solution || "",
    hint:       raw.hint || "",
    kind:       raw.kind || "integer",
    visual:     raw.visual || null,
    steps:      raw.steps || [],
    choices:    shuffle(choices4),
  };
}

// ============================================================
// UI 렌더링: 학년/학기/주제 선택
// ============================================================
function renderTopicSelect() {
  const topics = currentTopics();
  const sel = $("topic-select");
  if (!sel) return;
  sel.innerHTML = topics.map(t =>
    `<option value="${escapeHTML(t.id)}">${escapeHTML(t.title)}</option>`
  ).join("");
  if (topics.length > 0) {
    app.topicId = topics[0].id;
    sel.value = app.topicId;
  }
  const topicCount = Object.values(CURRICULUM[app.grade] || {})
    .filter(v => Array.isArray(v)).reduce((s, arr) => s + arr.length, 0);
  $("course-state").textContent = `${topicCount}개 연산 주제`;
}

function initGradeTabs() {
  document.querySelectorAll(".grade-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".grade-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      app.grade = Number(btn.dataset.grade);
      renderTopicSelect();
    });
  });
  document.querySelectorAll(".semester-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".semester-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      app.semester = Number(btn.dataset.sem);
      renderTopicSelect();
    });
  });
  const topicSel = $("topic-select");
  if (topicSel) topicSel.addEventListener("change", e => { app.topicId = e.target.value; });
}

// ============================================================
// 문제 시각화
// ============================================================
function renderProblemVisual(problem) {
  const q = escapeHTML(problem.question);
  const expr = escapeHTML(problem.expression);
  return `<div style="text-align:center">
    <div class="expr-question">${q}</div>
    <div class="expr-display">${expr}</div>
  </div>`;
}

// ============================================================
// 미션 생성 및 렌더링
// ============================================================
function makeMission() {
  if (app.sessionProblems > 0 && app.sessionProblems >= app.setLimit) {
    const accuracy = app.total ? Math.round((app.correct / app.total) * 100) : 0;
    setCoach("good", `${app.setLimit}세트 완료!`,
      `총 ${app.sessionProblems}문제 중 ${app.correct}개 정답, 정확도 ${accuracy}%.`,
      [["🎉","미션 완료",`정확도 ${accuracy}%`],["⭐","XP 획득",`총 ${app.xp} XP`],
       ["🔄","다시 도전","미션 시작 버튼을 눌러주세요."],["📊","리포트","우측 AI 코치 리포트 확인"]]
    );
    setMascot("win", `${app.setLimit}세트 완료! 수고했어요!`);
    return;
  }

  const topicEntry = currentTopicEntry();
  if (!topicEntry) {
    $("problem-title").textContent = "주제를 선택해주세요.";
    return;
  }

  let problem = null;
  for (let i = 0; i < 5 && !problem; i++) problem = generateProblem(topicEntry);
  if (!problem) {
    $("problem-title").textContent = "문제 생성 중 오류가 발생했습니다.";
    return;
  }

  app.problem = problem;
  app.choices = problem.choices.map(v => ({ value: v, correct: v === problem.answer }));
  app.answered = false;
  app.questCoachAnswers = 0;
  app.questHinted = false;
  app.questExplained = false;

  renderMission();
  const tip = coachStartTip(problem.skillId);
  setCoach("thinking", "새 미션 준비",
    `${problem.skillTitle} 문제입니다. ${tip}`,
    [["🎯","바로 풀기","선택지를 누르면 즉시 정답 여부와 보상이 표시됩니다."],
     ["🧠","AI 질문","정답이나 오답 뒤에 이유를 묻는 짧은 질문이 이어집니다."]]
  );
  renderCoachQuestion("start");
  setMascot("ready","새 미션이 열렸습니다. 바로 답을 골라 AI 피드백을 받아보세요.");
}

function renderMission() {
  const p = app.problem;
  const gradeMeta = GRADE_META[app.grade] || { label: `${app.grade}학년`, emoji: "" };
  $("mission-kicker").textContent = `${gradeMeta.label} · ${p.skillTitle}`;
  $("problem-title").textContent = p.question;
  $("problem-visual").innerHTML = renderProblemVisual(p);
  renderChoices(true);
  renderRoad();
  updateStats();
  renderGameProgress();
  updateBoss("idle");
  $("choice-lock").textContent = "즉시 선택 가능";
  $("ai-judgement").textContent = "대기";
  $("mission-note").innerHTML = `<span class="live-dot" style="display:inline-block;margin-right:6px;vertical-align:middle"></span><b>${escapeHTML(p.skillTitle)}</b> 문제입니다. 보기를 선택하면 AI 코치가 즉시 피드백합니다.`;
  const mf = $("meter-fill"), mt = $("meter-text");
  if (mf) mf.className = "meter-fill low";
  if (mt) mt.textContent = "선택 전 · 0%";
  const feedbackEl = $("micro-feedback");
  if (feedbackEl) feedbackEl.innerHTML = `🎯 <b>AI 코치 피드백:</b><br>보기를 선택하면 즉시 정답 여부와 코칭이 제공됩니다.`;
}

function renderChoices(unlocked) {
  const grid = $("choice-grid");
  if (!unlocked) {
    grid.className = "choice-grid-4 horizontal-choice is-locked";
    grid.innerHTML = ["A","B","C","D"].map(l =>
      `<button class="option4" type="button" disabled><span class="option4-label">${l}</span><span>대기</span></button>`
    ).join("");
    return;
  }
  grid.className = "choice-grid-4 horizontal-choice is-unlocked";
  const labels = ["A","B","C","D"];
  grid.innerHTML = app.choices.map((ch, i) =>
    `<button class="option4" type="button" data-choice="${escapeHTML(ch.value)}">
      <span class="option4-label">${labels[i]}</span>
      ${escapeHTML(ch.value)}
    </button>`
  ).join("");
  grid.querySelectorAll("[data-choice]").forEach(btn => {
    btn.addEventListener("click", () => selectChoice(btn.dataset.choice, btn));
  });
}

// ============================================================
// 선택지 처리
// ============================================================
function sameAnswer(problem, value) {
  const a = String(problem.answer).trim();
  const v = String(value).trim();
  if (a === v) return true;
  // 숫자 비교 (소수점 허용)
  const na = parseFloat(a), nv = parseFloat(v);
  if (!isNaN(na) && !isNaN(nv) && Math.abs(na - nv) < 0.001) return true;
  // 분수 비교: 2/4 = 1/2
  const fa = a.match(/^(-?\d+)\/(-?\d+)$/), fv = v.match(/^(-?\d+)\/(-?\d+)$/);
  if (fa && fv) {
    const [,an,ad] = fa.map(Number), [,vn,vd] = fv.map(Number);
    return an * vd === vn * ad;
  }
  return false;
}

function selectChoice(value, button) {
  if (app.answered) return;
  app.answered = true;
  const correct = sameAnswer(app.problem, value);
  app.total += 1;
  app.sessionProblems += 1;
  const xpReward = correct ? 40 + Math.min(app.streak + 1, 5) * 5 : 8;
  if (correct) {
    app.correct++; app.streak++; app.xp += xpReward; app.gems += 2;
    if (app.streak > 0 && app.streak % 3 === 0) app.badges++;
  } else {
    app.wrong++; app.streak = 0; app.xp += 8;
    app.weakMap[app.problem.skillTitle] = (app.weakMap[app.problem.skillTitle] || 0) + 1;
  }

  document.querySelectorAll("[data-choice]").forEach(btn => {
    btn.disabled = true;
    if (sameAnswer(app.problem, btn.dataset.choice)) btn.classList.add("is-correct");
  });
  if (button) button.classList.add(correct ? "is-correct" : "is-wrong");

  const analysis = correct ? correctCoach() : wrongCoach(value);
  updateBoss(correct ? "hit" : "danger");
  setCoach(correct ? "good" : "alert", analysis.title, analysis.speech, analysis.cards);
  setMascot(
    correct ? "happy" : "alert",
    correct ? "정답입니다. 보상 젬을 획득했습니다." : "괜찮아요. AI 코치가 오답 이유를 정리했습니다."
  );
  renderCoachQuestion(correct ? "correct" : `wrong_${analysis.errorType || "concept"}`, value);
  showToast(correct ? `정답! XP +${xpReward}, 젬 +2` : "오답도 학습 기록에 반영됐습니다. XP +8");
  $("ai-judgement").textContent = correct ? "정답" : "오답";

  const feedbackEl = $("micro-feedback");
  if (feedbackEl) {
    feedbackEl.innerHTML = correct
      ? `✅ <b>정답입니다!</b><br>${escapeHTML(app.problem.skillTitle)} 개념을 정확히 이해했습니다. 정답: <b>${escapeHTML(app.problem.answer)}</b>`
      : `⚠️ <b>오답 분석:</b><br>${escapeHTML(analysis.speech)}`;
  }
  const meterFill = $("meter-fill"), meterText = $("meter-text");
  if (meterFill && meterText) {
    meterFill.className = `meter-fill ${correct ? "low" : "mid"}`;
    meterText.textContent = correct ? "낮음 · 20%" : "중간 · 55%";
  }
  updateStats();
  renderGameProgress();
  renderReport();
}

// ============================================================
// AI 코치 시작 팁 (topic ID 기반)
// ============================================================
function coachStartTip(skillId) {
  const tips = {
    "add":"두 수를 더해보세요.",
    "sub":"큰 수에서 작은 수를 빼세요.",
    "mul":"같은 수를 여러 번 더하거나 구구단을 사용하세요.",
    "div":"나누는 수의 구구단을 떠올려보세요.",
    "frac":"분모를 통분한 뒤 분자를 계산하세요.",
    "decimal":"소수점 위치를 맞춰 계산하세요.",
    "gcd":"공약수 중 가장 큰 수를 구하세요.",
    "lcm":"공배수 중 가장 작은 수를 구하세요.",
    "times":"구구단을 활용하세요.",
    "place":"각 자리값을 확인하세요.",
    "length":"단위를 통일한 뒤 계산하세요.",
    "area":"공식에 값을 대입하세요.",
    "perimeter":"모든 변의 길이를 더하세요.",
    "angle":"내각의 합 규칙을 이용하세요.",
    "round":"반올림 기준 자리를 확인하세요.",
    "compare":"두 수의 크기를 비교하세요.",
    "pattern":"규칙을 찾아 다음 수를 예상하세요.",
  };
  const id = skillId || "";
  for (const [key, tip] of Object.entries(tips)) {
    if (id.includes(key)) return tip;
  }
  return "조건을 확인하고 알맞은 계산 방법을 생각해 보세요.";
}

// ============================================================
// 정답 코칭
// ============================================================
function correctCoach() {
  const skillId = app.problem.skillId || "";
  return {
    title: "정답 반응",
    speech: `정답입니다. ${coachStartTip(skillId)} 계속 이 방법으로 연습하세요.`,
    cards: [
      ["✅","정답 확인",`정답: ${app.problem.answer}`],
      ["⭐","미션 보상", `연속 ${app.streak}회 정답`],
      ["💡","다음 팁",   coachStartTip(skillId)],
      ["➡️","다음 미션", "같은 유형을 한 문항 더 풀어 자동화를 높여 보세요."]
    ]
  };
}

// ============================================================
// 오답 코칭 (topic ID 기반 키워드 분류)
// ============================================================
function wrongCoach(value) {
  const skillId = app.problem.skillId || "";
  const hint = app.problem.hint || "풀이 첫 단계를 다시 확인하세요.";

  function makeCoachCards(title, speech, errorType) {
    return {
      title, speech, errorType,
      cards: [
        ["⚠️","오답 확인",`${value}를 골랐습니다.`],
        ["💡","핵심 힌트", hint],
        ["📝","풀이 힌트", app.problem.solution || "다시 한 번 풀이를 확인하세요."],
        ["🔄","재도전",   "처음 단계부터 다시 확인해봅시다."]
      ]
    };
  }

  if (skillId.includes("add-carry") || skillId.includes("m04-add") || skillId.includes("m07-add") || skillId.includes("m08-add") || skillId.includes("m11-add"))
    return makeCoachCards("받아올림 오답", "일의 자리 합이 10 이상이면 십의 자리로 1을 올립니다.", "add-carry");
  if (skillId.includes("sub-borrow") || skillId.includes("sub-bridge") || skillId.includes("m04-sub") || skillId.includes("m11-sub"))
    return makeCoachCards("받아내림 오답", "일의 자리를 못 빼면 십의 자리에서 10을 빌려옵니다.", "sub-borrow");
  if (skillId.includes("times") || skillId.includes("multiplication") || skillId.includes("mul"))
    return makeCoachCards("곱셈 오답", "구구단을 확인하거나 같은 수를 여러 번 더해 확인해보세요.", "mul");
  if (skillId.includes("division") || skillId.includes("div"))
    return makeCoachCards("나눗셈 오답", "나누는 수의 구구단으로 답을 확인해보세요.", "div");
  if (skillId.includes("gcd") || skillId.includes("common-factor"))
    return makeCoachCards("최대공약수 오답", "공통 약수 중 가장 큰 수를 찾으세요. 지수가 작은 쪽을 선택합니다.", "gcd");
  if (skillId.includes("lcm") || skillId.includes("common-multiple"))
    return makeCoachCards("최소공배수 오답", "공통 배수 중 가장 작은 수를 찾으세요. 지수가 큰 쪽을 선택합니다.", "lcm");
  if (skillId.includes("frac") || skillId.includes("fraction"))
    return makeCoachCards("분수 오답", "분모가 다르면 통분 먼저. 곱셈은 분자×분자, 분모×분모.", "frac");
  if (skillId.includes("decimal"))
    return makeCoachCards("소수 오답", "소수점 위치를 맞춰 계산하세요.", "decimal");
  if (skillId.includes("reduce") || skillId.includes("equivalent"))
    return makeCoachCards("약분/통분 오답", "최대공약수로 분자와 분모를 나누면 기약분수가 됩니다.", "reduce");
  if (skillId.includes("place") || skillId.includes("compose") || skillId.includes("skip"))
    return makeCoachCards("자리값 오답", "백·십·일의 자리값을 각각 확인하세요.", "place");
  if (skillId.includes("compare") || skillId.includes("order"))
    return makeCoachCards("크기 비교 오답", "통분하거나 소수로 바꿔 크기를 비교하세요.", "compare");
  if (skillId.includes("missing") || skillId.includes("blank"))
    return makeCoachCards("빈칸 찾기 오답", "완성된 식에서 역연산으로 빈칸 값을 구하세요.", "missing");
  if (skillId.includes("area") || skillId.includes("perimeter"))
    return makeCoachCards("도형 넓이/둘레 오답", "해당 도형의 공식(넓이/둘레)을 확인하고 대입하세요.", "area");
  if (skillId.includes("angle"))
    return makeCoachCards("각도 오답", "삼각형 내각의 합=180°, 사각형=360°를 기억하세요.", "angle");
  if (skillId.includes("round"))
    return makeCoachCards("반올림 오답", "기준 자리 다음 숫자가 5 이상이면 올리고, 4 이하이면 버립니다.", "round");
  if (skillId.includes("pattern") || skillId.includes("calendar"))
    return makeCoachCards("규칙 찾기 오답", "연속된 값의 변화량을 확인해 규칙을 파악하세요.", "pattern");

  return makeCoachCards("개념 점검 오답",
    `선택한 보기는 풀이 흐름과 다릅니다. ${hint}`, "concept");
}

// ============================================================
// 풀이 흐름 확인
// ============================================================
function showSolutionFlow() {
  if (!app.problem) return;
  app.questExplained = true;
  renderRoad();
  const steps = app.problem.steps && app.problem.steps.length
    ? app.problem.steps.map((s, i) => [String(i+1), `${i+1}단계`, s])
    : [
        ["1","문제 확인", app.problem.question],
        ["2","풀이",      app.problem.solution],
        ["3","힌트",      app.problem.hint || coachStartTip(app.problem.skillId)],
        ["4","정답",      `정답: ${app.problem.answer}`]
      ];
  setMascot("thinking","풀이 흐름을 보고 각 단계를 내 말로 따라 말해봅시다.");
  setCoach("thinking","단계별 풀이법","정답을 외우기보다 풀이 단계의 이유를 이해해봅시다.", steps);
  renderCoachQuestion("solution");
  showToast("풀이 흐름을 열었습니다.");
}

// ============================================================
// AI 힌트 표시
// ============================================================
function showHint() {
  if (!app.problem) return;
  app.questHinted = true;
  renderRoad();
  const meterFill = $("meter-fill"), meterText = $("meter-text");
  if (meterFill) meterFill.className = "meter-fill mid";
  if (meterText) meterText.textContent = "중간 · 55%";
  setMascot("thinking","힌트를 봐도 괜찮아요. 답은 직접 고르는 게 핵심입니다.");
  showToast("AI 힌트를 열었습니다. 정답은 아직 숨겨져 있습니다.");
  const stageEl = $("ai-stage"), orbEl = $("ai-orb");
  if (stageEl) { stageEl.classList.remove("correct-glow","wrong-glow"); stageEl.classList.add("hint-glow"); }
  if (orbEl)   { orbEl.classList.remove("react-correct","react-wrong"); orbEl.classList.add("react-hint"); }
  setCoach("thinking","힌트 제공", app.problem.hint || coachStartTip(app.problem.skillId), [
    ["1","힌트", app.problem.hint || "핵심 조건을 확인하세요."],
    ["2","주의", "정답은 아직 공개하지 않습니다."]
  ]);
  renderCoachQuestion("hint");
}

// ============================================================
// renderCoachQuestion
// ============================================================
function renderCoachQuestion(type, selectedValue) {
  const skillId = app.problem ? (app.problem.skillId || "") : "";

  const correctQ = getCorrectQuestion(skillId);
  const wrongQ   = getWrongQuestion(skillId);

  const questionBank = {
    start:    ["AI 코치와 이 미션을 시작하는 가장 좋은 방법은?", [
      ["보기 하나를 고르고 즉시 피드백 받기", true,  "맞아요. 짧게 풀고 바로 반응을 받는 흐름이 핵심입니다."],
      ["정답을 먼저 찾은 뒤 보기를 고르기",  false, "선택 이유를 생각하며 고르는 것이 실력으로 남습니다."],
      ["아무 보기나 눌러보기",               false, "이유를 생각하며 고르는 습관이 중요합니다."]
    ]],
    hint:     ["힌트를 본 뒤 해야 할 행동은?", [
      ["내 말로 한 줄 풀이를 정리하기", true,  "맞아요. 힌트를 내 풀이로 바꾸면 기억에 남습니다."],
      ["정답을 기다리기",               false, "정답 대기보다 직접 선택이 중요합니다."],
      ["다음 문제로 넘어가기",          false, "힌트를 활용해 이 문제를 먼저 풀어봅시다."]
    ]],
    solution: ["풀이 흐름을 볼 때 가장 중요한 태도는?", [
      ["각 단계를 내 말로 따라 말하기", true,  "맞아요. 내 말로 설명해야 다음 문제에서 살아납니다."],
      ["정답 숫자만 외우기",            false, "숫자만 외우면 새 문제에서 흔들립니다."],
      ["빠르게 넘어가기",              false, "각 단계의 이유를 이해하는 것이 중요합니다."]
    ]],
    correct:  ["다음 유사 문제를 연습하는 좋은 방법은?", [
      ["같은 유형의 문제를 반복해서 속도를 올리기", true,  "맞아요. 반복으로 자동화가 이루어집니다."],
      ["이 문제를 외워두기",                        false, "원리를 이해해야 새 숫자에서도 풀 수 있습니다."],
      ["더 어려운 단원으로 넘어가기",              false, "기초를 탄탄히 한 뒤 심화로 가는 것이 좋습니다."]
    ]],
  };

  let qData = null;
  if (type === "correct" && correctQ)                        qData = correctQ;
  else if ((type === "wrong" || type.startsWith("wrong_")) && wrongQ) qData = wrongQ;
  if (!qData) {
    const key = type.startsWith("wrong_") ? "hint"
              : (type in questionBank ? type : "hint");
    qData = questionBank[key] || questionBank.hint;
  }

  const [question, options] = qData;
  $("coach-question-text").textContent = question;
  $("coach-options").innerHTML = options.map(([label, good, feedback], i) =>
    `<button class="answer-btn" type="button" data-good="${good}" data-feedback="${escapeHTML(feedback)}">
      ${i+1}. ${escapeHTML(label)}
    </button>`
  ).join("");
  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", () => handleCoachOption(btn));
  });
}

function getCorrectQuestion(skillId) {
  if (skillId.includes("add-carry"))    return ["받아올림 덧셈이 필요한 이유는?", [
    ["일의 자리 합이 10 이상이면 십의 자리로 1을 올려야 하기 때문", true, "정확합니다. 받아올림으로 자리값을 유지합니다."],
    ["십의 자리 수가 크면 올림이 필요하기 때문", false, "올림은 일의 자리 합이 10 이상일 때입니다."],
    ["계산 결과가 두 자리 수일 때", false, "두 자리 결과가 아니라 일의 자리 합이 기준입니다."]
  ]];
  if (skillId.includes("sub-borrow"))   return ["받아내림 뺄셈이 필요한 이유는?", [
    ["일의 자리 윗수가 아랫수보다 작을 때 십의 자리에서 10을 빌려야 하기 때문", true, "정확합니다."],
    ["빼는 수가 클 때 항상 받아내림이 필요하기 때문", false, "자리별로 확인해야 합니다."],
    ["빼는 수가 두 자리 수일 때", false, "자리별 비교가 기준입니다."]
  ]];
  if (skillId.includes("gcd"))          return ["최대공약수를 구할 때 지수를 선택하는 방법은?", [
    ["공통 소인수의 지수 중 작은 쪽을 선택한다", true, "맞아요. 두 수 모두의 약수가 되는 최대 범위입니다."],
    ["지수 중 큰 쪽을 선택한다", false, "큰 지수는 최소공배수에 씁니다."],
    ["지수를 더한다", false, "지수를 더하지 않고 작은 쪽만 선택합니다."]
  ]];
  if (skillId.includes("lcm"))          return ["최소공배수를 구할 때 지수를 선택하는 방법은?", [
    ["모든 소인수의 지수 중 큰 쪽을 선택한다", true, "맞아요. 두 수의 배수가 모두 되려면 큰 지수가 필요합니다."],
    ["지수 중 작은 쪽을 선택한다", false, "작은 지수는 최대공약수에 씁니다."],
    ["한쪽에만 있는 소인수는 무시한다", false, "한쪽에만 있어도 반드시 포함합니다."]
  ]];
  if (skillId.includes("frac"))         return ["분모가 다른 분수를 더하기 전에 해야 할 일은?", [
    ["최소공배수로 통분하기", true, "맞아요. 분모를 같게 만들어야 분자끼리 더할 수 있습니다."],
    ["분자끼리 바로 더하기", false, "분모가 다르면 바로 더할 수 없습니다."],
    ["분모끼리 더하기", false, "분모는 통분하는 것이지 더하는 것이 아닙니다."]
  ]];
  return null;
}

function getWrongQuestion(skillId) {
  if (skillId.includes("add-carry"))    return ["47 + 36을 계산할 때 일의 자리 합 13은 어떻게 처리하나요?", [
    ["3을 일의 자리에 쓰고 1을 십의 자리로 받아올림", true, "맞아요. 13 = 10 + 3입니다."],
    ["13을 그대로 쓴다", false, "자릿값을 유지하기 위해 분리해야 합니다."],
    ["3만 일의 자리에 쓰고 받아올림 없음", false, "십의 자리로 1을 올려야 합니다."]
  ]];
  if (skillId.includes("sub-borrow"))   return ["52 - 8을 계산할 때 일의 자리에서 2 - 8을 할 수 없으면?", [
    ["십의 자리에서 1을 빌려 12 - 8 = 4로 계산", true, "맞아요. 십의 자리는 1 줄어듭니다."],
    ["8 - 2 = 6으로 계산", false, "빼는 순서를 바꾸면 틀립니다."],
    ["답이 없다", false, "받아내림으로 해결할 수 있습니다."]
  ]];
  if (skillId.includes("frac"))         return ["1/2 + 1/3을 계산하면?", [
    ["5/6 (통분: 3/6 + 2/6)", true, "맞아요. LCM(2,3)=6으로 통분합니다."],
    ["2/5 (분자·분모 각각 더함)", false, "분모끼리 더하면 안 됩니다."],
    ["1/6", false, "통분 후 3/6+2/6=5/6입니다."]
  ]];
  if (skillId.includes("gcd"))          return ["두 수의 최대공약수를 구할 때 왜 작은 지수를 선택하나요?", [
    ["두 수 모두 나누어지려면 더 작은 지수까지만 공통으로 가능하기 때문", true, "정확합니다."],
    ["계산이 쉬워서", false, "작은 지수를 쓰는 이유는 공약수 조건 때문입니다."],
    ["큰 지수는 배수에서만 쓰기 때문", false, "배수와 약수의 지수 선택 차이가 핵심입니다."]
  ]];
  return null;
}

function handleCoachOption(button) {
  const good = button.dataset.good === "true";
  document.querySelectorAll(".answer-btn").forEach(item => {
    item.disabled = true;
    item.classList.toggle("is-good", item === button && good);
    item.classList.toggle("is-bad",  item === button && !good);
  });
  if (good) { app.xp += 3; renderGameProgress(); }
  setMascot(good ? "happy" : "thinking",
    good ? "좋은 선택입니다. AI 질문 보너스 XP +3!" : "괜찮아요. 방금 선택도 생각을 고치는 재료입니다.");
  setCoach(good ? "good" : "thinking", good ? "AI 질문 성공" : "AI 질문 다시 생각",
    button.dataset.feedback,
    [["Q","질문 반응", good ? "핵심 사고를 잘 골랐습니다." : "틀린 답도 괜찮습니다."],
     ["XP","질문 보상", good ? "XP +3이 추가됐습니다." : "다음 질문에서 다시 보상을 받을 수 있습니다."]]
  );
  app.questCoachAnswers++;
  renderRoad();
}

// ============================================================
// AI 코치 스테이지 / 마스코트 / 러너
// ============================================================
function setCoach(mood, title, speech, cards) {
  const aiStatus = $("ai-status");
  if (aiStatus) aiStatus.textContent = title;

  const stageEl = $("ai-stage"), orbEl = $("ai-orb");
  if (stageEl) {
    stageEl.classList.remove("correct-glow","wrong-glow","hint-glow");
    if      (mood === "good")     stageEl.classList.add("correct-glow");
    else if (mood === "alert")    stageEl.classList.add("wrong-glow");
    else if (mood === "thinking") stageEl.classList.add("hint-glow");
  }
  if (orbEl) {
    orbEl.classList.remove("react-correct","react-wrong","react-hint");
    if      (mood === "good")     orbEl.classList.add("react-correct");
    else if (mood === "alert")    orbEl.classList.add("react-wrong");
    else if (mood === "thinking") orbEl.classList.add("react-hint");
    const emojiMap = { good:"🤩", alert:"🧐", thinking:"🤔" };
    orbEl.textContent = emojiMap[mood] || "🤖";
  }

  const speechEl = $("ai-speech");
  if (speechEl) {
    clearInterval(app.coachTypingTimer);
    speechEl.textContent = "";
    speechEl.classList.add("typing-cursor");
    const chars = Array.from(String(speech));
    let idx = 0;
    app.coachTypingTimer = setInterval(() => {
      speechEl.textContent += chars[idx] || "";
      idx++;
      if (idx >= chars.length) { clearInterval(app.coachTypingTimer); speechEl.classList.remove("typing-cursor"); }
    }, 18);
  }

  const moodClassMap = { good:"is-correct", alert:"is-error", thinking:"is-hint" };
  const cardClass = moodClassMap[mood] || "is-active";
  const missionsEl = $("coach-missions");
  if (missionsEl) {
    missionsEl.innerHTML = (cards || []).map(([icon, head, body]) =>
      `<div class="c-mission-card ${cardClass}">
        <div class="c-mission-icon">${escapeHTML(String(icon))}</div>
        <div><strong>${escapeHTML(String(head))}</strong><small>${escapeHTML(String(body))}</small></div>
      </div>`
    ).join("");
  }
}

function setMascot(mood, speech) {
  const charEl = $("mascot-character");
  if (charEl) {
    charEl.className = `avatar-emoji is-${mood}`;
    const emojiMap = { happy:"🤩", alert:"😤", thinking:"🤔", ready:"🦊", win:"🎉", wrong:"😅" };
    charEl.textContent = emojiMap[mood] || "🦊";
  }
  const speechEl = $("mascot-speech");
  if (speechEl) speechEl.textContent = speech;
}

function setRunner(mood, title, message) {
  const emotionEl = $("ai-emotion");
  if (emotionEl) {
    const emojiMap = { running:"🏃", win:"🎉", wrong:"⚠️", thinking:"🤔", good:"✅", alert:"❗" };
    emotionEl.textContent = `${emojiMap[mood] || "🤖"} ${title}`;
  }
  const promptEl = $("next-prompt");
  if (promptEl) promptEl.textContent = message;
}

// ============================================================
// 보스 / 게임화
// ============================================================
function updateBoss(event) {
  if (event === "hit")    app.bossHp = Math.max(0, app.bossHp - 26);
  if (event === "danger") app.bossHp = Math.min(100, app.bossHp + 10);
  if (app.bossHp <= 0) {
    app.badges++; app.gems += 3;
    showToast("오답 보스를 클리어했습니다. 배지 +1, 젬 +3");
    app.bossHp = 100;
  }
  $("boss-hp-bar").style.width = `${app.bossHp}%`;
  $("boss-hp-text").textContent = `${app.bossHp}%`;
  $("boss-face").textContent = event === "hit" ? "💥" : event === "danger" ? "🔥" : "👾";
}

function renderGameProgress() {
  const level = Math.floor(app.xp / 120) + 1;
  const lp = app.xp % 120;
  $("xp-count").textContent = app.xp;
  $("level-badge").textContent = `Lv.${level}`;
  const xpBar = $("xp-bar");
  if (xpBar) xpBar.style.width = `${Math.round((lp / 120) * 100)}%`;
  $("gem-count").textContent = app.gems;
  $("badge-count").textContent = app.badges;
  $("chest-state").textContent = app.gems >= 6 ? "OPEN" : "LOCK";
}

function updateStats() {
  const accuracy = app.total ? Math.round((app.correct / app.total) * 100) : 0;
  $("total-count").textContent = app.total;
  $("accuracy-rate").textContent = `${accuracy}%`;
  $("streak-count").textContent = app.streak;
}

function renderReport() {
  const accuracy     = app.total ? Math.round((app.correct / app.total) * 100) : 0;
  const manipulation = Math.min(100, 44 + app.total * 8 + app.streak * 6);
  const independence = Math.max(20, 88 - app.wrong * 10);
  const correction   = Math.min(100, 58 + app.correct * 7);
  $("report-bars").innerHTML = [
    ["정확도",accuracy],["미션 몰입도",manipulation],
    ["힌트 독립성",independence],["오답 수정력",correction]
  ].map(([label, value]) =>
    `<div class="bar-row">
      <div class="bar-top"><span>${label}</span><strong>${value}%</strong></div>
      <div class="bar-track-outer"><div class="bar-track-fill" style="width:${value}%"></div></div>
    </div>`
  ).join("");
  const weak = Object.entries(app.weakMap).sort((a,b) => b[1]-a[1])[0];
  $("weak-signal").textContent = weak ? "보충 필요" : "안정";
  $("weak-note").textContent = weak
    ? `${weak[0]} 유형에서 오답 ${weak[1]}회가 누적됐습니다. 같은 유형을 한 번 더 연습하세요.`
    : "아직 두드러진 약점은 없습니다. 같은 리듬으로 다음 미션을 이어가세요.";
}

function renderRoad() {
  const q1Done = app.questCoachAnswers >= 3;
  const q2Done = app.questExplained;
  const q3Done = !app.questHinted && app.answered;
  const skillTitle = app.problem ? app.problem.skillTitle : "연산";
  $("mission-road").innerHTML = [
    ["💬","AI 질문 3개 답하기",`${skillTitle} 학습 확인`, q1Done],
    ["📋","단계별 풀이 확인",  "AI 코치 단계 설명 보기", q2Done],
    ["🧠","힌트 없이 도전",    "힌트 미터가 보상에 반영", q3Done]
  ].map(([icon, title, body, done]) =>
    `<div class="qitem${done ? " is-done" : ""}">
      <div class="qbadge">${icon}</div>
      <div><b>${done ? "✅ " : ""}${escapeHTML(title)}</b><small>${escapeHTML(body)}</small></div>
    </div>`
  ).join("");
}

function showToast(message) {
  const toast = $("game-toast");
  app.toastId++;
  const id = app.toastId;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => { if (id === app.toastId) toast.classList.remove("show"); }, 2200);
}

// ============================================================
// 프린트
// ============================================================
function printProblemSet() {
  const topicEntry = currentTopicEntry();
  if (!topicEntry) return;
  const count = app.setLimit;
  const gradeLabel = (GRADE_META[app.grade] || {}).label || `${app.grade}학년`;

  const problems = [];
  for (let i = 0; i < count; i++) {
    const p = generateProblem(topicEntry);
    if (p) problems.push(p);
  }

  const rows = problems.map((p, i) => `<div class="pp">
    <div class="ph"><span class="pn">${i+1}</span><span class="pq">${escapeHTML(p.question)} &nbsp; <b>${escapeHTML(p.expression)}</b></span></div>
    <div class="pa">답: ______________________</div>
  </div>`).join("");

  const answers = problems.map((p, i) =>
    `<span class="ak"><b>${i+1}.</b> ${escapeHTML(String(p.answer))}</span>`
  ).join("");

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${gradeLabel} ${topicEntry.title} 학습지</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Malgun Gothic',sans-serif;font-size:11pt;color:#111;padding:12mm 14mm}
h1{font-size:14pt;font-weight:700;border-bottom:2px solid #111;padding-bottom:4px;margin-bottom:6px}
.meta{font-size:10pt;display:flex;gap:24px;margin-bottom:10px;border-bottom:1px solid #bbb;padding-bottom:6px}
.meta span{display:inline-flex;gap:6px;align-items:center}
.meta span::after{content:'';display:inline-block;width:80px;border-bottom:1px solid #555}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}
.pp{border:1px solid #ddd;border-radius:4px;padding:6px 8px;break-inside:avoid}
.ph{display:flex;gap:6px;align-items:baseline;margin-bottom:4px}
.pn{min-width:20px;font-weight:700;color:#333;flex-shrink:0}
.pq{flex:1;font-size:11pt;line-height:1.5}
.pa{font-size:9pt;color:#666;border-top:1px dotted #ccc;padding-top:3px;margin-top:2px}
.spacer{min-height:14mm}
.cut-line{border:none;border-top:1px dashed #aaa;margin:10px 0;position:relative}
.cut-line::before{content:'✂  정답';position:absolute;left:50%;transform:translateX(-50%) translateY(-50%);background:#fff;padding:0 8px;font-size:9pt;color:#aaa}
.ak-grid{display:flex;flex-wrap:wrap;gap:3px 14px;padding-top:6px}
.ak{font-size:10pt}
@media print{body{padding:8mm 10mm}@page{margin:8mm 10mm;size:A4 portrait}}
</style></head><body>
<h1>${gradeLabel} ${escapeHTML(topicEntry.title)} 학습지 <small style="font-weight:400;font-size:11pt">(${count}문제)</small></h1>
<div class="meta"><span>이름</span><span>날짜</span><span>점수</span></div>
<div class="grid">${rows}</div>
<div class="spacer"></div>
<hr class="cut-line">
<div class="ak-grid">${answers}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const win = window.open("","_blank","width=794,height=1123");
  if (win) { win.document.write(html); win.document.close(); }
}

// ============================================================
// 새 세션 시작
// ============================================================
function startNewSession() {
  app.sessionProblems = 0;
  makeMission();
}

// ============================================================
// 이벤트 리스너
// ============================================================
$("new-mission").addEventListener("click", startNewSession);
const newMissionAlt = $("new-mission-alt");
if (newMissionAlt) newMissionAlt.addEventListener("click", startNewSession);
$("set-count-select").addEventListener("change", e => { app.setLimit = Number(e.target.value); });
$("next-button").addEventListener("click", makeMission);
$("hint-button").addEventListener("click", showHint);
$("explain-button").addEventListener("click", showSolutionFlow);
const printBtn = $("print-btn");
if (printBtn) printBtn.addEventListener("click", printProblemSet);

// ============================================================
// 초기화 (boot)
// ============================================================
function boot() {
  initCurriculum();
  initGradeTabs();
  renderTopicSelect();
  renderReport();
  renderGameProgress();
  makeMission();
}

boot();
