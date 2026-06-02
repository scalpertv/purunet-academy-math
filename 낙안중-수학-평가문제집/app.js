// 낙안중 중1 수학 연산 웹북의 생성형 문제 은행과 학습 흐름을 관리한다.
const STORAGE_KEY = "nakan-middle1-math-webbook:v2";
const SESSION_KEY = "nakan-middle1-math-webbook:session:v2";

const UNITS = [
  {
    id: "numbers",
    title: "Ⅰ. 수와 연산",
    short: "수와 연산",
    note: "소인수분해, 최대공약수와 최소공배수, 정수와 유리수의 사칙계산을 매일 연산 세트로 훈련합니다.",
    visual: "number",
    skills: [
      skill("prime", "소수·합성수 판별", "1과 자기 자신만 약수로 갖는 수를 구분합니다.", genPrime),
      skill("factor", "소인수분해", "자연수를 소인수의 곱과 거듭제곱으로 나타냅니다.", genFactor),
      skill("divisors", "약수의 개수", "소인수분해 결과로 약수의 개수를 구합니다.", genDivisors),
      skill("gcd", "최대공약수", "공통 소인수의 작은 지수를 선택합니다.", genGcd),
      skill("lcm", "최소공배수", "모든 소인수의 큰 지수를 선택합니다.", genLcm),
      skill("integer", "정수 계산", "부호와 절댓값을 분리해 계산합니다.", genInteger),
      skill("fraction", "유리수 계산", "분수의 덧셈·뺄셈·곱셈·나눗셈을 약분까지 처리합니다.", genFraction)
    ]
  },
  {
    id: "algebra",
    title: "Ⅱ. 문자와 식",
    short: "문자와 식",
    note: "문자의 사용, 식의 값, 일차식 정리와 일차방정식을 시험형 계산으로 반복합니다.",
    visual: "algebra",
    skills: [
      skill("substitution", "식의 값", "문자에 수를 대입하고 부호를 정리합니다.", genSubstitution),
      skill("likeTerms", "동류항 정리", "x항과 상수항을 따로 모읍니다.", genLikeTerms),
      skill("distribute", "분배법칙", "괄호 앞 계수를 모든 항에 곱합니다.", genDistribute),
      skill("linearEquation", "일차방정식", "이항과 나눗셈으로 해를 구합니다.", genLinearEquation),
      skill("wordEquation", "방정식 활용", "문장 조건을 식으로 바꾸어 풉니다.", genWordEquation),
      skill("ratioEquation", "비례식", "외항의 곱과 내항의 곱을 이용합니다.", genRatioEquation)
    ]
  },
  {
    id: "graph",
    title: "Ⅲ. 좌표평면과 그래프",
    short: "좌표와 그래프",
    note: "순서쌍, 사분면, 정비례·반비례 그래프를 좌표 시각 자료와 함께 연습합니다.",
    visual: "coordinate",
    skills: [
      skill("quadrant", "좌표와 사분면", "x좌표와 y좌표의 부호를 해석합니다.", genQuadrant),
      skill("pointValue", "좌표 대입", "그래프 식에 좌표를 대입해 값을 찾습니다.", genPointValue),
      skill("direct", "정비례", "y=ax에서 비례상수를 찾습니다.", genDirect),
      skill("inverse", "반비례", "xy=k를 이용해 빠르게 계산합니다.", genInverse),
      skill("table", "대응표", "표의 규칙을 찾아 빠진 값을 구합니다.", genTable),
      skill("graphRead", "그래프 해석", "시간과 양의 변화율을 읽습니다.", genGraphRead)
    ]
  },
  {
    id: "geometry",
    title: "Ⅳ. 도형의 기초",
    short: "도형의 기초",
    note: "각, 평행선, 작도와 합동 조건을 도형 벡터 그림으로 확인합니다.",
    visual: "geometry",
    skills: [
      skill("complement", "여각과 보각", "90도와 180도 관계를 이용합니다.", genComplement),
      skill("verticalAngle", "맞꼭지각", "마주 보는 각의 크기가 같음을 적용합니다.", genVerticalAngle),
      skill("parallelAngle", "평행선의 각", "동위각과 엇각을 구분합니다.", genParallelAngle),
      skill("triangleAngle", "삼각형의 내각", "세 내각의 합 180도를 이용합니다.", genTriangleAngle),
      skill("construction", "작도 조건", "SSS, SAS, ASA 조건을 판별합니다.", genConstruction),
      skill("congruence", "삼각형 합동", "주어진 조건에 맞는 합동 기준을 선택합니다.", genCongruence)
    ]
  },
  {
    id: "shape",
    title: "Ⅴ. 도형의 성질",
    short: "도형의 성질",
    note: "다각형, 원과 부채꼴, 입체도형의 겉넓이와 부피를 식 세우기 중심으로 훈련합니다.",
    visual: "solid",
    skills: [
      skill("polygonDiagonal", "다각형의 대각선", "n(n-3)/2 공식을 적용합니다.", genPolygonDiagonal),
      skill("polygonAngle", "내각과 외각", "내각의 합과 정다각형의 한 외각을 구합니다.", genPolygonAngle),
      skill("sectorArc", "부채꼴의 호", "전체 원의 몇 분의 몇인지 판단합니다.", genSectorArc),
      skill("sectorArea", "부채꼴의 넓이", "πr²에 중심각 비율을 곱합니다.", genSectorArea),
      skill("prismVolume", "기둥의 부피", "밑넓이와 높이를 곱합니다.", genPrismVolume),
      skill("sphere", "구의 겉넓이·부피", "구 공식에서 반지름을 정확히 대입합니다.", genSphere)
    ]
  },
  {
    id: "stats",
    title: "Ⅵ. 통계",
    short: "통계",
    note: "평균, 중앙값, 최빈값, 도수분포표와 상대도수를 짧은 세트로 반복합니다.",
    visual: "stats",
    skills: [
      skill("mean", "평균", "자료의 합을 자료 수로 나눕니다.", genMean),
      skill("median", "중앙값", "자료를 정렬하고 가운데 값을 찾습니다.", genMedian),
      skill("mode", "최빈값", "가장 자주 나오는 값을 찾습니다.", genMode),
      skill("range", "범위", "최댓값에서 최솟값을 뺍니다.", genRange),
      skill("frequency", "도수분포표", "계급과 도수를 읽고 계산합니다.", genFrequency),
      skill("relative", "상대도수", "계급의 도수를 전체 도수로 나눕니다.", genRelative)
    ]
  }
];

const LEVELS = {
  basic: { label: "기본", min: 2, max: 12, boost: 0 },
  standard: { label: "표준", min: 3, max: 24, boost: 1 },
  challenge: { label: "심화", min: 5, max: 60, boost: 2 }
};

const state = {
  unitId: "numbers",
  skillId: "prime",
  mode: "drill",
  difficulty: "standard",
  setSize: 20,
  session: [],
  index: 0,
  startedAt: 0,
  timerId: null,
  progress: loadProgress()
};

const $ = (id) => document.getElementById(id);

function skill(id, title, focus, generator) {
  return { id, title, focus, generator };
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { total: 0, correct: 0, wrongs: [], skillStats: {} };
  } catch {
    return { total: 0, correct: 0, wrongs: [], skillStats: {} };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    unitId: state.unitId,
    skillId: state.skillId,
    mode: state.mode,
    difficulty: state.difficulty,
    setSize: state.setSize,
    session: state.session,
    index: state.index,
    startedAt: state.startedAt
  }));
}

function currentUnit() {
  return UNITS.find((unit) => unit.id === state.unitId) || UNITS[0];
}

function currentSkill() {
  const unit = currentUnit();
  return unit.skills.find((item) => item.id === state.skillId) || unit.skills[0];
}

function activeProblem() {
  return state.session[state.index] || null;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[rand(0, items.length - 1)];
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function simplify(num, den) {
  if (den < 0) {
    num *= -1;
    den *= -1;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

function fracText(f) {
  if (f.den === 1) return String(f.num);
  return `${f.num}/${f.den}`;
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/도/g, "")
    .replace(/°/g, "")
    .replace(/㎠|cm²/g, "cm^2")
    .toLowerCase();
}

function sameAnswer(problem, value) {
  const input = normalize(value);
  return [problem.answer, ...(problem.aliases || [])].some((item) => normalize(item) === input);
}

function makeProblem(skillItem, unit, level, mode) {
  const levelConfig = typeof level === "string" ? LEVELS[level] : level;
  const problem = skillItem.generator(levelConfig, mode);
  return {
    id: `${unit.id}:${skillItem.id}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
    unitId: unit.id,
    unitTitle: unit.title,
    skillId: skillItem.id,
    skillTitle: skillItem.title,
    level: levelConfig.label,
    mode,
    done: false,
    correct: false,
    response: "",
    elapsed: 0,
    ...problem
  };
}

function buildSession() {
  const unit = currentUnit();
  const selected = currentSkill();
  const mode = $("mode-select").value;
  const level = $("difficulty-select").value;
  const size = Number($("set-size").value);
  const pool = mode === "concept" ? unit.skills : selected ? [selected] : unit.skills;
  state.mode = mode;
  state.difficulty = level;
  state.setSize = size;
  state.session = Array.from({ length: size }, function (_, index) {
    const sourceSkill = mode === "concept" ? unit.skills[index % unit.skills.length] : pick(pool);
    return makeProblem(sourceSkill, unit, level, mode);
  });
  state.index = 0;
  state.startedAt = Date.now();
  startTimer();
  saveSession();
  render();
}

function buildWrongSession() {
  const wrongs = state.progress.wrongs || [];
  if (!wrongs.length) {
    showFeedback("info", "오답이 아직 없습니다.", "일반 세트를 먼저 풀면 틀린 유형이 자동으로 저장됩니다.");
    return;
  }
  const size = Math.min(Number($("set-size").value), wrongs.length || 10);
  state.session = wrongs.slice(-size).reverse().map(function (wrong) {
    const unit = UNITS.find((item) => item.id === wrong.unitId) || currentUnit();
    const skillItem = unit.skills.find((item) => item.id === wrong.skillId) || unit.skills[0];
    return makeProblem(skillItem, unit, "standard", "weak");
  });
  state.unitId = state.session[0].unitId;
  state.skillId = state.session[0].skillId;
  state.mode = "weak";
  $("mode-select").value = "weak";
  state.index = 0;
  state.startedAt = Date.now();
  startTimer();
  saveSession();
  render();
}

function startTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = setInterval(function () {
    const seconds = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    $("timer").textContent = formatTime(seconds);
  }, 500);
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function checkAnswer() {
  const problem = activeProblem();
  if (!problem) {
    showFeedback("info", "세트를 시작하세요.", "단원과 유형을 고른 뒤 세트 시작을 누르면 문제가 생성됩니다.");
    return;
  }
  if (problem.done) {
    nextProblem();
    return;
  }
  const value = $("answer-input").value;
  if (!String(value).trim()) {
    showFeedback("info", "답을 입력하세요.", "정수, 분수, 식, π가 들어간 답을 그대로 입력할 수 있습니다.");
    return;
  }
  const correct = sameAnswer(problem, value);
  problem.done = true;
  problem.correct = correct;
  problem.response = value;
  problem.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  state.progress.total += 1;
  if (correct) state.progress.correct += 1;
  const key = `${problem.unitId}:${problem.skillId}`;
  const stat = state.progress.skillStats[key] || { total: 0, correct: 0, title: problem.skillTitle, unit: problem.unitTitle };
  stat.total += 1;
  if (correct) stat.correct += 1;
  state.progress.skillStats[key] = stat;
  if (!correct) {
    state.progress.wrongs = [...(state.progress.wrongs || []), {
      unitId: problem.unitId,
      skillId: problem.skillId,
      question: problem.question,
      answer: problem.answer,
      at: new Date().toISOString()
    }].slice(-120);
  }
  saveProgress();
  saveSession();
  showFeedback(correct ? "correct" : "wrong", correct ? "정답입니다." : "오답입니다.", solutionText(problem, !correct));
  renderStats();
  renderSessionList();
  renderWeakList();
}

function nextProblem() {
  if (state.index < state.session.length - 1) {
    state.index += 1;
    renderProblem();
    renderSessionList();
    saveSession();
    return;
  }
  showFeedback("info", "세트가 끝났습니다.", setSummary());
}

function setSummary() {
  const solved = state.session.filter((item) => item.done).length;
  const correct = state.session.filter((item) => item.correct).length;
  const rate = solved ? Math.round((correct / solved) * 100) : 0;
  return `이번 세트는 ${solved}문항 중 ${correct}문항 정답, 정확도 ${rate}%입니다. 오답 재출제로 약점을 바로 다시 풀 수 있습니다.`;
}

function solutionText(problem, includeAnswer) {
  const steps = (problem.steps || []).map((step, index) => `${index + 1}. ${step}`).join("<br>");
  const answer = includeAnswer ? `<br><br><strong>정답 ${escapeHTML(problem.answer)}</strong>` : "";
  return `${steps}${answer}`;
}

function showFeedback(type, title, body) {
  const box = $("feedback");
  box.className = `feedback show ${type}`;
  box.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${body}</span>`;
  requestAnimationFrame(() => {
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function render() {
  renderUnits();
  renderSkillSelect();
  renderHero();
  renderProblem();
  renderStats();
  renderSessionList();
  renderWeakList();
}

function renderUnits() {
  $("unit-list").innerHTML = UNITS.map(function (unit) {
    const active = unit.id === state.unitId ? "is-active" : "";
    return `<button class="unit-button ${active}" type="button" data-unit="${unit.id}">
      <strong>${unit.title}</strong>
      <span>${unit.skills.length}개 유형 · 무제한 생성</span>
    </button>`;
  }).join("");
  document.querySelectorAll("[data-unit]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.unitId = button.dataset.unit;
      state.skillId = currentUnit().skills[0].id;
      state.session = [];
      state.index = 0;
      render();
    });
  });
}

function renderSkillSelect() {
  const unit = currentUnit();
  $("skill-select").innerHTML = unit.skills.map(function (item) {
    return `<option value="${item.id}">${item.title}</option>`;
  }).join("");
  $("skill-select").value = state.skillId;
}

function renderHero() {
  const unit = currentUnit();
  const skillItem = currentSkill();
  $("unit-kicker").textContent = unit.title;
  $("unit-title").textContent = skillItem.title;
  $("unit-note").textContent = `${unit.note} 현재 유형은 ${skillItem.focus}`;
  $("hero-stats").innerHTML = [
    `${unit.skills.length}개 유형`,
    "무제한 문항 생성",
    "오답 자동 누적",
    "인쇄 학습지"
  ].map((text) => `<span class="stat-pill">${text}</span>`).join("");
  $("unit-visual").innerHTML = unitVisual(unit.visual);
}

function renderProblem() {
  const problem = activeProblem();
  if (!problem) {
    $("problem-meta").textContent = "세트 대기";
    $("problem-title").textContent = "단원과 유형을 선택한 뒤 세트를 시작하세요.";
    const skillTotal = UNITS.reduce((sum, unit) => sum + unit.skills.length, 0);
    $("question").textContent = `전 범위 ${skillTotal}개 핵심 유형에서 문항이 계속 생성됩니다.`;
    $("problem-visual").innerHTML = unitVisual(currentUnit().visual);
    $("answer-input").value = "";
    $("feedback").className = "feedback";
    return;
  }
  $("problem-meta").textContent = `${state.index + 1} / ${state.session.length} · ${problem.unitTitle} · ${problem.level}`;
  $("problem-title").textContent = problem.skillTitle;
  $("question").textContent = problem.question;
  $("answer-input").value = problem.response || "";
  $("answer-input").disabled = problem.done;
  $("check-answer").textContent = problem.done ? "다음" : "채점";
  $("problem-visual").innerHTML = problemVisual(problem);
  $("feedback").className = problem.done ? `feedback show ${problem.correct ? "correct" : "wrong"}` : "feedback";
  $("feedback").innerHTML = problem.done ? `<strong>${problem.correct ? "정답입니다." : "오답입니다."}</strong><span>${solutionText(problem, !problem.correct)}</span>` : "";
  $("answer-input").focus({ preventScroll: true });
}

function renderStats() {
  const solved = state.session.filter((item) => item.done).length;
  const correct = state.session.filter((item) => item.correct).length;
  $("set-score").textContent = `${correct} / ${state.session.length || 0}`;
  $("set-bar").style.width = `${state.session.length ? Math.round((solved / state.session.length) * 100) : 0}%`;
  const total = state.progress.total || 0;
  const totalCorrect = state.progress.correct || 0;
  $("accuracy").textContent = `${total ? Math.round((totalCorrect / total) * 100) : 0}%`;
  $("total-solved").textContent = total;
  $("wrong-count").textContent = (state.progress.wrongs || []).length;
}

function renderSessionList() {
  if (!state.session.length) {
    $("session-list").innerHTML = `<li class="session-item"><strong>세트 없음</strong><small>학습 모드를 고르고 세트를 시작하세요.</small></li>`;
    return;
  }
  $("session-list").innerHTML = state.session.map(function (item, index) {
    const status = index === state.index ? "is-current" : item.done ? (item.correct ? "is-correct" : "is-wrong") : "";
    const label = item.done ? (item.correct ? "정답" : "오답") : "대기";
    return `<li class="session-item ${status}">
      <strong>${index + 1}. ${item.skillTitle}</strong>
      <small>${label} · ${item.level}</small>
    </li>`;
  }).join("");
}

function renderWeakList() {
  const entries = Object.entries(state.progress.skillStats || {})
    .map(([key, item]) => ({ key, ...item, rate: item.total ? item.correct / item.total : 1 }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);
  if (!entries.length) {
    $("weak-list").innerHTML = `<div class="weak-item"><strong>진단 대기</strong><small>문제를 풀면 약점 유형이 자동 정렬됩니다.</small></div>`;
    return;
  }
  $("weak-list").innerHTML = entries.map(function (item) {
    return `<div class="weak-item">
      <strong>${item.title}</strong>
      <small>${item.unit} · ${Math.round(item.rate * 100)}% · ${item.total}회 풀이</small>
    </div>`;
  }).join("");
}

function printSheet() {
  const unit = currentUnit();
  const skillItem = currentSkill();
  const level = $("difficulty-select").value;
  const problems = Array.from({ length: 20 }, () => makeProblem(skillItem, unit, level, "print"));
  $("print-area").innerHTML = `
    <h1>${unit.title} · ${skillItem.title} 학습지</h1>
    <p>이름: ____________ 날짜: ____________ 점수: ____________</p>
    ${problems.map((problem, index) => `<div class="print-problem"><strong>${index + 1}.</strong> ${escapeHTML(problem.question)}<br>답: ______________________________</div>`).join("")}
    <h2>정답</h2>
    <p>${problems.map((problem, index) => `${index + 1}. ${escapeHTML(problem.answer)}`).join(" / ")}</p>
  `;
  window.print();
}

function resetProgress() {
  if (!confirm("누적 풀이 기록과 오답노트를 모두 지울까요?")) return;
  state.progress = { total: 0, correct: 0, wrongs: [], skillStats: {} };
  state.session = [];
  state.index = 0;
  saveProgress();
  localStorage.removeItem(SESSION_KEY);
  render();
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primeFactors(n) {
  const list = [];
  let d = 2;
  while (n > 1) {
    while (n % d === 0) {
      list.push(d);
      n /= d;
    }
    d += d === 2 ? 1 : 2;
  }
  return list;
}

function factorPowerText(n) {
  const counts = {};
  primeFactors(n).forEach((f) => { counts[f] = (counts[f] || 0) + 1; });
  return Object.entries(counts).map(([base, exp]) => exp === 1 ? base : `${base}^${exp}`).join("*");
}

function divisorCount(n) {
  const counts = {};
  primeFactors(n).forEach((f) => { counts[f] = (counts[f] || 0) + 1; });
  return Object.values(counts).reduce((acc, exp) => acc * (exp + 1), 1);
}

function problem(question, answer, steps, hint, visualType, visualData, aliases = []) {
  return { question, answer: String(answer), aliases, steps, hint, visualType, visualData };
}

function genPrime(level) {
  const nums = level.max > 24 ? [29, 31, 37, 41, 43, 47, 53, 57, 61, 67] : [11, 13, 17, 19, 21, 23, 25, 27];
  const n = pick(nums);
  const isPrime = primeFactors(n).length === 1;
  return problem(`${n}은 소수이면 1, 합성수이면 0을 입력하세요.`, isPrime ? 1 : 0, [
    "1보다 큰 자연수의 약수를 확인합니다.",
    isPrime ? `${n}의 약수는 1과 ${n}뿐입니다.` : `${n}은 1과 자기 자신 외의 약수를 가집니다.`
  ], "소수는 약수가 정확히 2개입니다.", "factor", { n });
}

function genFactor(level) {
  const n = rand(level.min + 10, level.max * 3);
  const answer = factorPowerText(n);
  return problem(`${n}을 소인수분해하시오. 곱셈은 *로 입력하세요.`, answer, [
    "작은 소수 2, 3, 5, 7 순서로 나눕니다.",
    `${n} = ${answer}입니다.`
  ], "가장 작은 소수부터 나누면 빠릅니다.", "factor", { n }, [answer.replace(/\*/g, "×")]);
}

function genDivisors(level) {
  const n = rand(18, level.max * 4);
  const answer = divisorCount(n);
  return problem(`${n}의 약수의 개수를 구하시오.`, answer, [
    `${n} = ${factorPowerText(n)}로 소인수분해합니다.`,
    "각 소인수 지수에 1을 더한 뒤 모두 곱합니다."
  ], "2^a * 3^b 꼴이면 약수 개수는 (a+1)(b+1)입니다.", "factor", { n });
}

function genGcd(level) {
  const a = rand(level.min * 3, level.max * 4);
  const b = rand(level.min * 4, level.max * 5);
  const answer = gcd(a, b);
  return problem(`${a}와 ${b}의 최대공약수를 구하시오.`, answer, [
    `${a} = ${factorPowerText(a)}, ${b} = ${factorPowerText(b)}입니다.`,
    "공통 소인수의 작은 지수를 곱합니다."
  ], "두 수를 동시에 나눌 수 있는 가장 큰 수를 찾습니다.", "factor", { n: answer });
}

function genLcm(level) {
  const a = rand(level.min * 2, level.max * 3);
  const b = rand(level.min * 3, level.max * 4);
  const answer = lcm(a, b);
  return problem(`${a}와 ${b}의 최소공배수를 구하시오.`, answer, [
    `${a}와 ${b}를 각각 소인수분해합니다.`,
    "모든 소인수의 큰 지수를 곱하면 최소공배수입니다."
  ], "최대공약수를 먼저 구하면 a*b/gcd로도 계산할 수 있습니다.", "factor", { n: answer });
}

function genInteger(level) {
  const a = rand(-level.max, level.max);
  const b = rand(-level.max, level.max);
  const c = rand(-level.max, level.max);
  const answer = a - b + c;
  return problem(`(${a}) - (${b}) + (${c})을 계산하시오.`, answer, [
    "괄호와 부호를 먼저 정리합니다.",
    `${a} - (${b}) + (${c}) = ${answer}입니다.`
  ], "빼기는 반대 부호를 더하는 것으로 바꿉니다.", "numberline", { points: [a, answer] });
}

function genFraction(level) {
  const a = rand(1, level.max);
  const b = rand(2, 9);
  const c = rand(1, level.max);
  const d = rand(2, 9);
  const op = pick(["+", "-", "*"]);
  let num;
  let den;
  if (op === "+") {
    num = a * d + c * b;
    den = b * d;
  } else if (op === "-") {
    num = a * d - c * b;
    den = b * d;
  } else {
    num = a * c;
    den = b * d;
  }
  const ans = simplify(num, den);
  return problem(`${a}/${b} ${op} ${c}/${d} 를 계산하시오.`, fracText(ans), [
    op === "*" ? "분자는 분자끼리, 분모는 분모끼리 곱합니다." : "분모를 통분한 뒤 분자를 계산합니다.",
    `약분하면 ${fracText(ans)}입니다.`
  ], "답은 기약분수로 입력합니다.", "fraction", { a, b, c, d });
}

function genSubstitution(level) {
  const x = rand(-5, 6);
  const a = rand(2, level.max);
  const b = rand(-level.max, level.max);
  const answer = a * x + b;
  return problem(`x=${x}일 때 ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}의 값을 구하시오.`, answer, [
    `x 자리에 ${x}를 대입합니다.`,
    `${a}×${x} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${answer}입니다.`
  ], "문자 대신 수를 넣고 부호를 조심합니다.", "algebra", { a, b, x });
}

function genLikeTerms(level) {
  const a = rand(2, level.max);
  const b = rand(-level.max, level.max);
  const c = rand(-level.max, level.max);
  const d = rand(-level.max, level.max);
  const coef = a + b;
  const cons = c + d;
  const answer = `${coef}x${cons >= 0 ? "+" : ""}${cons}`;
  return problem(`(${a}x ${c >= 0 ? "+" : "-"} ${Math.abs(c)}) + (${b}x ${d >= 0 ? "+" : "-"} ${Math.abs(d)})를 간단히 하시오.`, answer, [
    "x항끼리, 상수항끼리 모읍니다.",
    `x항은 ${a}+(${b})=${coef}, 상수항은 ${c}+(${d})=${cons}입니다.`
  ], "동류항만 더하거나 뺄 수 있습니다.", "algebra", { a: coef, b: cons }, [answer.replace("+ -", "-")]);
}

function genDistribute(level) {
  const a = rand(-8, 8) || 3;
  const b = rand(2, level.max);
  const c = rand(-level.max, level.max);
  const coef = a * b;
  const cons = a * c;
  const answer = `${coef}x${cons >= 0 ? "+" : ""}${cons}`;
  return problem(`${a}(${b}x ${c >= 0 ? "+" : "-"} ${Math.abs(c)})를 전개하시오.`, answer, [
    "괄호 앞 수를 괄호 안의 모든 항에 곱합니다.",
    `${a}×${b}x=${coef}x, ${a}×(${c})=${cons}입니다.`
  ], "부호가 다른 두 수의 곱은 음수입니다.", "algebra", { a: coef, b: cons });
}

function genLinearEquation(level) {
  const x = rand(-level.max, level.max) || 4;
  const a = rand(2, 9);
  const b = rand(-level.max, level.max);
  const right = a * x + b;
  return problem(`${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${right}의 해를 구하시오.`, x, [
    `양변에서 ${b}를 이항해 ${a}x=${right - b}로 만듭니다.`,
    `양변을 ${a}로 나누면 x=${x}입니다.`
  ], "상수항을 먼저 옮기고 계수로 나눕니다.", "algebra", { a, b, x });
}

function genWordEquation(level) {
  const x = rand(3, level.max);
  const add = rand(2, 12);
  const mul = rand(2, 7);
  const result = (x + add) * mul;
  return problem(`어떤 수에 ${add}를 더한 뒤 ${mul}배 했더니 ${result}가 되었다. 어떤 수를 구하시오.`, x, [
    `어떤 수를 x라 두면 ${mul}(x+${add})=${result}입니다.`,
    `x+${add}=${result / mul}, x=${x}입니다.`
  ], "문장 속 '어떤 수'를 x로 둡니다.", "algebra", { a: mul, b: add, x });
}

function genRatioEquation(level) {
  const a = rand(2, 9);
  const b = rand(2, 9);
  const x = rand(2, level.max);
  const c = (a * x) / b;
  const right = Number.isInteger(c) ? c : a * x;
  const leftB = Number.isInteger(c) ? b : b * b;
  const answer = Number.isInteger(c) ? x : b * x;
  return problem(`${a}:${leftB} = x:${right}일 때 x를 구하시오.`, answer, [
    "비례식은 외항의 곱과 내항의 곱이 같습니다.",
    `${a}×${right} = ${leftB}×x를 풀어 x=${answer}입니다.`
  ], "a:b=c:d이면 a×d=b×c입니다.", "coordinate", { points: [[a, leftB], [answer, right]] });
}

function genQuadrant(level) {
  const x = pick([-1, -2, -3, -4, 2, 3, 4, 5]) * (level.boost + 1);
  const y = pick([-5, -3, -2, 2, 4, 5]);
  const answer = x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : 4;
  return problem(`점 (${x}, ${y})는 제몇사분면에 있는가? 숫자만 입력하시오.`, answer, [
    `x좌표는 ${x > 0 ? "양수" : "음수"}, y좌표는 ${y > 0 ? "양수" : "음수"}입니다.`,
    `따라서 제${answer}사분면입니다.`
  ], "x의 부호를 먼저 보고, y의 부호를 다음에 봅니다.", "coordinate", { points: [[x, y]] });
}

function genPointValue(level) {
  const a = rand(-5, 5) || 2;
  const b = rand(-level.max, level.max);
  const x = rand(-6, 6);
  const y = a * x + b;
  return problem(`y=${a}x${b >= 0 ? "+" : ""}${b}에서 x=${x}일 때 y를 구하시오.`, y, [
    `x에 ${x}를 대입합니다.`,
    `y=${a}×${x}${b >= 0 ? "+" : ""}${b}=${y}입니다.`
  ], "좌표는 (x, y) 순서입니다.", "coordinate", { line: [a, b], points: [[x, y]] });
}

function genDirect(level) {
  const a = rand(-8, 8) || 3;
  const x = rand(2, level.max);
  const y = a * x;
  return problem(`y가 x에 정비례하고 x=${x}일 때 y=${y}이다. 비례상수 a를 구하시오.`, a, [
    "정비례식은 y=ax입니다.",
    `${y}=a×${x}이므로 a=${a}입니다.`
  ], "y를 x로 나누면 비례상수입니다.", "coordinate", { line: [a, 0], points: [[x, y]] });
}

function genInverse(level) {
  const x1 = rand(2, 9);
  const y1 = rand(2, 9);
  const k = x1 * y1;
  const x2 = pick([2, 3, 4, 5, 6, 8, 9, 10]);
  const ans = simplify(k, x2);
  return problem(`y가 x에 반비례하고 x=${x1}일 때 y=${y1}이다. x=${x2}일 때 y를 구하시오.`, fracText(ans), [
    `반비례에서는 xy=k입니다. k=${x1}×${y1}=${k}입니다.`,
    `x=${x2}이면 y=${k}/${x2}=${fracText(ans)}입니다.`
  ], "반비례에서는 x와 y를 곱한 값이 일정합니다.", "coordinate", { inverse: k });
}

function genTable(level) {
  const a = rand(2, 8);
  const b = rand(-5, 5);
  const x = rand(3, 9);
  const y = a * x + b;
  return problem(`대응표가 y=${a}x${b >= 0 ? "+" : ""}${b}의 규칙을 따른다. x=${x}일 때 y를 구하시오.`, y, [
    "대응 규칙에 x값을 넣습니다.",
    `${a}×${x}${b >= 0 ? "+" : ""}${b}=${y}입니다.`
  ], "표의 가로줄이 x, 세로줄이 y인지 확인합니다.", "table", { a, b, x, y });
}

function genGraphRead(level) {
  const rate = rand(2, 8);
  const time = rand(4, level.max);
  const answer = rate * time;
  return problem(`물통에 1분마다 ${rate} L씩 물이 찬다. ${time}분 뒤 물의 양은 몇 L인가?`, answer, [
    "1분 동안의 변화량이 일정합니다.",
    `${rate}×${time}=${answer} L입니다.`
  ], "정비례 상황이므로 시간과 비율을 곱합니다.", "table", { a: rate, b: 0, x: time, y: answer });
}

function genComplement(level) {
  const angle = rand(20, 70);
  const isComp = Math.random() > 0.5;
  const target = isComp ? 90 : 180;
  const answer = target - angle;
  return problem(`${angle}°의 ${isComp ? "여각" : "보각"}을 구하시오.`, answer, [
    `${isComp ? "여각" : "보각"}은 두 각의 합이 ${target}°입니다.`,
    `${target}-${angle}=${answer}°입니다.`
  ], "여각은 90°, 보각은 180°입니다.", "angle", { a: angle, b: answer });
}

function genVerticalAngle(level) {
  const angle = rand(35, 145);
  return problem(`두 직선이 만나 생긴 한 각이 ${angle}°이다. 그 각과 맞꼭지각의 크기를 구하시오.`, angle, [
    "맞꼭지각의 크기는 서로 같습니다.",
    `따라서 ${angle}°입니다.`
  ], "마주 보는 각을 찾습니다.", "angle", { a: angle, b: angle });
}

function genParallelAngle(level) {
  const angle = rand(40, 130);
  return problem(`평행한 두 직선을 한 직선이 가로지를 때 한 동위각이 ${angle}°이다. 대응되는 동위각의 크기를 구하시오.`, angle, [
    "평행선에서 동위각의 크기는 같습니다.",
    `따라서 ${angle}°입니다.`
  ], "평행선 표시를 먼저 확인합니다.", "parallel", { a: angle });
}

function genTriangleAngle(level) {
  const a = rand(35, 80);
  const b = rand(35, 80);
  const answer = 180 - a - b;
  return problem(`삼각형의 두 내각이 ${a}°, ${b}°일 때 나머지 한 각을 구하시오.`, answer, [
    "삼각형의 세 내각의 합은 180°입니다.",
    `180-${a}-${b}=${answer}°입니다.`
  ], "두 각을 더한 뒤 180에서 뺍니다.", "triangle", { a, b, c: answer });
}

function genConstruction(level) {
  const options = ["SSS", "SAS", "ASA"];
  const answer = pick(options);
  return problem(`삼각형 작도에서 ${answer} 조건으로 하나의 삼각형이 정해진다. 이 조건명을 그대로 입력하시오.`, answer, [
    "삼각형이 하나로 정해지는 대표 조건은 SSS, SAS, ASA입니다.",
    `이번 조건은 ${answer}입니다.`
  ], "두 변과 끼인각이면 SAS입니다.", "triangle", { a: 60, b: 70, c: 50 });
}

function genCongruence(level) {
  const answer = pick(["SSS", "SAS", "ASA"]);
  const desc = answer === "SSS" ? "세 변" : answer === "SAS" ? "두 변과 그 끼인각" : "한 변과 양 끝각";
  return problem(`두 삼각형에서 ${desc}이 각각 같다. 합동 조건을 쓰시오.`, answer, [
    `${desc}이 같을 때 사용하는 합동 조건을 확인합니다.`,
    `정답은 ${answer}입니다.`
  ], "조건 속에 변 S와 각 A가 몇 개 있는지 세어 봅니다.", "triangle", { a: 55, b: 65, c: 60 });
}

function genPolygonDiagonal(level) {
  const n = rand(5, level.boost ? 14 : 9);
  const answer = n * (n - 3) / 2;
  return problem(`${n}각형의 대각선의 개수를 구하시오.`, answer, [
    "n각형의 대각선 개수는 n(n-3)/2입니다.",
    `${n}×${n - 3}/2=${answer}입니다.`
  ], "한 꼭짓점에서 자기 자신과 양옆 꼭짓점 2개는 연결하지 않습니다.", "polygon", { n });
}

function genPolygonAngle(level) {
  const n = rand(5, 12);
  const internal = Math.random() > 0.5;
  const answer = internal ? (n - 2) * 180 : 360 / n;
  return problem(`${internal ? `${n}각형의 내각의 합` : `정${n}각형의 한 외각`}을 구하시오.`, answer, [
    internal ? "n각형의 내각의 합은 (n-2)×180°입니다." : "정다각형의 한 외각은 360°를 꼭짓점 수로 나눕니다.",
    `계산 결과 ${answer}°입니다.`
  ], "내각의 합인지 한 외각인지 먼저 구분합니다.", "polygon", { n });
}

function genSectorArc(level) {
  const r = rand(3, 12);
  const angle = pick([30, 45, 60, 90, 120, 180]);
  const ans = simplify(2 * r * angle, 360);
  const text = ans.den === 1 ? `${ans.num}π` : `${ans.num}π/${ans.den}`;
  return problem(`반지름 ${r} cm, 중심각 ${angle}°인 부채꼴의 호의 길이를 π로 나타내시오.`, text, [
    "호의 길이는 2πr×중심각/360입니다.",
    `2π×${r}×${angle}/360 = ${text}입니다.`
  ], "전체 원의 둘레에서 중심각 비율만큼만 남깁니다.", "sector", { r, angle }, [text.replace("π", "pi")]);
}

function genSectorArea(level) {
  const r = rand(3, 12);
  const angle = pick([30, 45, 60, 90, 120, 180]);
  const ans = simplify(r * r * angle, 360);
  const text = ans.den === 1 ? `${ans.num}π` : `${ans.num}π/${ans.den}`;
  return problem(`반지름 ${r} cm, 중심각 ${angle}°인 부채꼴의 넓이를 π로 나타내시오.`, text, [
    "부채꼴의 넓이는 πr²×중심각/360입니다.",
    `π×${r}²×${angle}/360 = ${text}입니다.`
  ], "넓이는 r이 아니라 r²을 씁니다.", "sector", { r, angle }, [text.replace("π", "pi")]);
}

function genPrismVolume(level) {
  const base = rand(12, level.max * 3);
  const h = rand(3, 15);
  const answer = base * h;
  return problem(`밑넓이가 ${base} cm², 높이가 ${h} cm인 기둥의 부피를 구하시오.`, answer, [
    "기둥의 부피는 밑넓이×높이입니다.",
    `${base}×${h}=${answer} cm³입니다.`
  ], "기둥은 위아래가 같은 모양입니다.", "solid", { base, h });
}

function genSphere(level) {
  const r = rand(2, 9);
  const surface = Math.random() > 0.5;
  const answer = surface ? `${4 * r * r}π` : `${4 * r * r * r}/3π`;
  return problem(`반지름 ${r} cm인 구의 ${surface ? "겉넓이" : "부피"}를 π로 나타내시오.`, answer, [
    surface ? "구의 겉넓이는 4πr²입니다." : "구의 부피는 4/3πr³입니다.",
    `r=${r}을 대입하면 ${answer}입니다.`
  ], "겉넓이와 부피 공식을 구분합니다.", "solid", { r }, [answer.replace("π", "pi")]);
}

function sampleData(size) {
  return Array.from({ length: size }, () => rand(2, 18)).sort((a, b) => a - b);
}

function genMean(level) {
  const data = sampleData(level.boost ? 7 : 5);
  const sum = data.reduce((a, b) => a + b, 0);
  const ans = simplify(sum, data.length);
  return problem(`자료 ${data.join(", ")}의 평균을 구하시오.`, fracText(ans), [
    `자료의 합은 ${sum}입니다.`,
    `${sum}/${data.length}=${fracText(ans)}입니다.`
  ], "평균은 전체 합을 자료 수로 나눕니다.", "histogram", { data });
}

function genMedian(level) {
  const data = sampleData(level.boost ? 8 : 7);
  const mid = Math.floor(data.length / 2);
  const ans = data.length % 2 ? data[mid] : fracText(simplify(data[mid - 1] + data[mid], 2));
  return problem(`자료 ${data.join(", ")}의 중앙값을 구하시오.`, ans, [
    "자료를 작은 순서로 정렬합니다.",
    data.length % 2 ? `가운데 값은 ${ans}입니다.` : `가운데 두 값의 평균은 ${ans}입니다.`
  ], "자료 수가 짝수이면 가운데 두 값의 평균입니다.", "histogram", { data });
}

function genMode(level) {
  const m = rand(3, 12);
  const data = sampleData(5).concat([m, m, m]).sort((a, b) => a - b);
  return problem(`자료 ${data.join(", ")}의 최빈값을 구하시오.`, m, [
    "가장 많이 나타나는 값을 찾습니다.",
    `${m}이 가장 자주 나타납니다.`
  ], "같은 값이 몇 번 나오는지 표시해 봅니다.", "histogram", { data });
}

function genRange(level) {
  const data = sampleData(6);
  const answer = data[data.length - 1] - data[0];
  return problem(`자료 ${data.join(", ")}의 범위를 구하시오.`, answer, [
    `최댓값은 ${data[data.length - 1]}, 최솟값은 ${data[0]}입니다.`,
    `범위는 ${answer}입니다.`
  ], "범위는 최댓값-최솟값입니다.", "histogram", { data });
}

function genFrequency(level) {
  const total = rand(30, 80);
  const freq = rand(5, Math.floor(total / 2));
  const rest = total - freq;
  return problem(`전체 도수가 ${total}이고 한 계급의 도수가 ${freq}이다. 나머지 계급들의 도수 합을 구하시오.`, rest, [
    "전체 도수에서 해당 계급의 도수를 뺍니다.",
    `${total}-${freq}=${rest}입니다.`
  ], "도수는 자료의 개수입니다.", "histogram", { data: [freq, rest] });
}

function genRelative(level) {
  const total = pick([40, 50, 60, 80, 100]);
  const freq = rand(4, Math.floor(total / 2));
  const ans = simplify(freq, total);
  return problem(`전체 도수가 ${total}, 한 계급의 도수가 ${freq}일 때 상대도수를 구하시오.`, fracText(ans), [
    "상대도수는 계급의 도수/전체 도수입니다.",
    `${freq}/${total}=${fracText(ans)}입니다.`
  ], "소수 또는 기약분수로 입력할 수 있습니다.", "histogram", { data: [freq, total - freq] }, [String(freq / total)]);
}

function unitVisual(type) {
  if (type === "number") return numberLineSVG([-5, -2, 0, 3, 6]);
  if (type === "algebra") return algebraSVG();
  if (type === "coordinate") return coordinateSVG({ line: [2, 0], points: [[1, 2], [3, 6]] });
  if (type === "geometry") return angleSVG({ a: 58, b: 122 });
  if (type === "solid") return solidSVG({ r: 5, h: 8 });
  return histogramSVG({ data: [5, 9, 13, 8, 6] });
}

function problemVisual(problem) {
  const d = problem.visualData || {};
  if (problem.visualType === "numberline") return numberLineSVG(d.points || []);
  if (problem.visualType === "factor") return factorSVG(d.n || 36);
  if (problem.visualType === "fraction") return fractionSVG(d);
  if (problem.visualType === "algebra") return algebraSVG(d);
  if (problem.visualType === "coordinate") return coordinateSVG(d);
  if (problem.visualType === "table") return tableSVG(d);
  if (problem.visualType === "angle" || problem.visualType === "parallel" || problem.visualType === "triangle") return angleSVG(d);
  if (problem.visualType === "polygon" || problem.visualType === "sector") return polygonSVG(d);
  if (problem.visualType === "solid") return solidSVG(d);
  if (problem.visualType === "histogram") return histogramSVG(d);
  return unitVisual(currentUnit().visual);
}

function numberLineSVG(points) {
  const ticks = Array.from({ length: 13 }, (_, i) => i - 6);
  return `<svg viewBox="0 0 420 170" role="img" aria-label="수직선">
    <line x1="32" y1="90" x2="388" y2="90" stroke="#14212b" stroke-width="2"/>
    ${ticks.map((n, i) => `<g><line x1="${45 + i * 29}" y1="80" x2="${45 + i * 29}" y2="100" stroke="#14212b"/><text x="${45 + i * 29}" y="124" text-anchor="middle" font-size="12">${n}</text></g>`).join("")}
    ${points.map((p, i) => `<circle cx="${45 + (p + 6) * 29}" cy="90" r="8" fill="${i ? "#0f766e" : "#c94f35"}"/><text x="${45 + (p + 6) * 29}" y="55" text-anchor="middle" font-size="13" font-weight="700">${p}</text>`).join("")}
  </svg>`;
}

function factorSVG(n) {
  const factors = primeFactors(Math.max(2, n)).slice(0, 5);
  return `<svg viewBox="0 0 420 180" role="img" aria-label="소인수분해 나무">
    <circle cx="210" cy="34" r="24" fill="#edf5ff" stroke="#2563eb" stroke-width="2"/><text x="210" y="40" text-anchor="middle" font-size="16" font-weight="800">${n}</text>
    ${factors.map((f, i) => {
      const x = 60 + i * 75;
      return `<line x1="210" y1="58" x2="${x}" y2="118" stroke="#9aa8b5"/><circle cx="${x}" cy="132" r="22" fill="#e8f6f3" stroke="#0f766e" stroke-width="2"/><text x="${x}" y="138" text-anchor="middle" font-size="16" font-weight="800">${f}</text>`;
    }).join("")}
  </svg>`;
}

function fractionSVG(d) {
  return `<svg viewBox="0 0 420 170" role="img" aria-label="분수 막대">
    ${bar(36, 40, d.b || 4, d.a || 1, "#2563eb")}
    ${bar(36, 98, d.d || 5, d.c || 1, "#c94f35")}
    <text x="310" y="64" font-size="18" font-weight="800">${d.a || 1}/${d.b || 4}</text>
    <text x="310" y="122" font-size="18" font-weight="800">${d.c || 1}/${d.d || 5}</text>
  </svg>`;
}

function bar(x, y, den, num, color) {
  const w = 250 / den;
  return Array.from({ length: den }, (_, i) => `<rect x="${x + i * w}" y="${y}" width="${w - 2}" height="34" fill="${i < num ? color : "#ffffff"}" stroke="#9aa8b5"/>`).join("");
}

function algebraSVG(d = {}) {
  const a = d.a || 3;
  const b = d.b || 2;
  return `<svg viewBox="0 0 420 170" role="img" aria-label="대수 타일">
    <rect x="44" y="50" width="130" height="48" rx="6" fill="#e8f6f3" stroke="#0f766e" stroke-width="2"/><text x="109" y="81" text-anchor="middle" font-size="20" font-weight="900">${a}x</text>
    <rect x="196" y="50" width="62" height="48" rx="6" fill="#fff7e6" stroke="#b88708" stroke-width="2"/><text x="227" y="81" text-anchor="middle" font-size="20" font-weight="900">${b >= 0 ? "+" : ""}${b}</text>
    <path d="M58 126h260" stroke="#2563eb" stroke-width="3"/><text x="190" y="150" text-anchor="middle" font-size="14">x항과 상수항을 분리</text>
  </svg>`;
}

function coordinateSVG(d = {}) {
  const points = d.points || [[2, 4]];
  const line = d.line || null;
  const toX = (x) => 210 + x * 24;
  const toY = (y) => 88 - y * 12;
  return `<svg viewBox="0 0 420 190" role="img" aria-label="좌표평면">
    <line x1="32" y1="88" x2="388" y2="88" stroke="#14212b"/><line x1="210" y1="20" x2="210" y2="166" stroke="#14212b"/>
    ${line ? `<path d="M${toX(-7)} ${toY(line[0] * -7 + line[1])} L${toX(7)} ${toY(line[0] * 7 + line[1])}" stroke="#0f766e" stroke-width="3" fill="none"/>` : ""}
    ${points.map((p) => `<circle cx="${toX(p[0])}" cy="${toY(p[1])}" r="7" fill="#c94f35"/><text x="${toX(p[0]) + 10}" y="${toY(p[1]) - 8}" font-size="13">(${p[0]}, ${p[1]})</text>`).join("")}
    <text x="394" y="92" font-size="13">x</text><text x="216" y="26" font-size="13">y</text>
  </svg>`;
}

function tableSVG(d = {}) {
  const a = d.a || 2;
  const b = d.b || 0;
  const xs = [1, 2, 3, d.x || 4];
  return `<svg viewBox="0 0 420 170" role="img" aria-label="대응표">
    <rect x="42" y="38" width="320" height="92" fill="#fff" stroke="#9aa8b5"/>
    <line x1="42" y1="84" x2="362" y2="84" stroke="#9aa8b5"/><line x1="122" y1="38" x2="122" y2="130" stroke="#9aa8b5"/>
    ${[202, 282].map((x) => `<line x1="${x}" y1="38" x2="${x}" y2="130" stroke="#9aa8b5"/>`).join("")}
    <text x="82" y="66" text-anchor="middle" font-weight="900">x</text><text x="82" y="112" text-anchor="middle" font-weight="900">y</text>
    ${xs.map((x, i) => `<text x="${162 + i * 80}" y="66" text-anchor="middle">${x}</text><text x="${162 + i * 80}" y="112" text-anchor="middle">${a * x + b}</text>`).join("")}
  </svg>`;
}

function angleSVG(d = {}) {
  const a = d.a || 60;
  const b = d.b || 60;
  return `<svg viewBox="0 0 420 190" role="img" aria-label="각 도형">
    <line x1="60" y1="128" x2="360" y2="128" stroke="#14212b" stroke-width="3"/>
    <line x1="150" y1="154" x2="306" y2="38" stroke="#2563eb" stroke-width="3"/>
    <path d="M190 128 A46 46 0 0 1 226 92" fill="none" stroke="#c94f35" stroke-width="5"/>
    <text x="232" y="92" font-size="16" font-weight="900">${a}°</text>
    <path d="M230 128 A46 46 0 0 0 202 92" fill="none" stroke="#0f766e" stroke-width="5"/>
    <text x="174" y="92" font-size="16" font-weight="900">${b}°</text>
  </svg>`;
}

function polygonSVG(d = {}) {
  const n = d.n || 6;
  const r = 62;
  const cx = 210;
  const cy = 92;
  const pts = Array.from({ length: n }, (_, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n;
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  });
  return `<svg viewBox="0 0 420 190" role="img" aria-label="다각형과 부채꼴">
    <polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="#edf5ff" stroke="#2563eb" stroke-width="2"/>
    <path d="M210 92 L210 30 A62 62 0 0 1 264 122 Z" fill="#e8f6f3" stroke="#0f766e" stroke-width="2"/>
    <text x="210" y="174" text-anchor="middle" font-size="14">${n}각형 · 부채꼴 모델</text>
  </svg>`;
}

function solidSVG(d = {}) {
  return `<svg viewBox="0 0 420 190" role="img" aria-label="입체도형">
    <ellipse cx="128" cy="54" rx="58" ry="18" fill="#edf5ff" stroke="#2563eb" stroke-width="2"/>
    <path d="M70 54v82c0 12 116 12 116 0V54" fill="#edf5ff" stroke="#2563eb" stroke-width="2"/>
    <ellipse cx="128" cy="136" rx="58" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
    <circle cx="300" cy="96" r="54" fill="#e8f6f3" stroke="#0f766e" stroke-width="2"/>
    <path d="M246 96h108M300 42v108" stroke="#0f766e" opacity=".35"/>
    <text x="128" y="170" text-anchor="middle">기둥</text><text x="300" y="170" text-anchor="middle">구</text>
  </svg>`;
}

function histogramSVG(d = {}) {
  const data = d.data || [4, 9, 12, 7, 5];
  const max = Math.max(...data, 1);
  return `<svg viewBox="0 0 420 190" role="img" aria-label="히스토그램">
    <line x1="48" y1="154" x2="374" y2="154" stroke="#14212b"/><line x1="48" y1="24" x2="48" y2="154" stroke="#14212b"/>
    ${data.map((v, i) => {
      const h = (v / max) * 110;
      const x = 70 + i * 54;
      return `<rect x="${x}" y="${154 - h}" width="40" height="${h}" fill="#edf5ff" stroke="#2563eb"/><text x="${x + 20}" y="${170}" text-anchor="middle" font-size="12">${v}</text>`;
    }).join("")}
  </svg>`;
}

$("unit-list").addEventListener("click", function () {});
$("skill-select").addEventListener("change", function (event) {
  state.skillId = event.target.value;
  state.session = [];
  state.index = 0;
  render();
});
$("mode-select").addEventListener("change", function (event) { state.mode = event.target.value; });
$("difficulty-select").addEventListener("change", function (event) { state.difficulty = event.target.value; });
$("set-size").addEventListener("change", function (event) { state.setSize = Number(event.target.value); });
$("start-set").addEventListener("click", buildSession);
$("wrong-set").addEventListener("click", buildWrongSession);
$("check-answer").addEventListener("click", function () {
  const problem = activeProblem();
  if (problem && problem.done) nextProblem();
  else checkAnswer();
});
$("next-problem").addEventListener("click", nextProblem);
$("hint-button").addEventListener("click", function () {
  const problem = activeProblem();
  if (!problem) return showFeedback("info", "힌트", "세트를 시작하면 유형별 힌트가 표시됩니다.");
  showFeedback("info", "힌트", escapeHTML(problem.hint));
});
$("solution-button").addEventListener("click", function () {
  const problem = activeProblem();
  if (!problem) return showFeedback("info", "풀이", "세트를 시작하면 풀이 단계가 표시됩니다.");
  showFeedback("info", "풀이", solutionText(problem, true));
});
$("print-sheet").addEventListener("click", printSheet);
$("reset-progress").addEventListener("click", resetProgress);
$("answer-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const problem = activeProblem();
    if (problem && problem.done) nextProblem();
    else checkAnswer();
  }
});

render();
