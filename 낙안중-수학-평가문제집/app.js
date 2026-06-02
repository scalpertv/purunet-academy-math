// 낙안중 중1 수학 평가문제집의 문항 데이터와 학습 상호작용을 관리한다.
const STORAGE_KEY = "nakan-middle1-math-workbook:v1";

const units = [
  {
    id: "numbers",
    title: "Ⅰ. 수와 연산",
    note: "소인수분해, 최대공약수와 최소공배수, 정수와 유리수의 사칙계산을 점검합니다.",
    visual: "numbers",
    problems: [
      p("n1", "소인수분해", "하", "선택형", "84를 소인수분해한 것은?", ["2^2 × 3 × 7", "2 × 3^2 × 7", "2^2 × 3^2", "4 × 21"], "2^2 × 3 × 7", "84 = 2 × 42 = 2 × 2 × 21 = 2^2 × 3 × 7입니다."),
      p("n2", "거듭제곱", "하", "입력형", "3 × 3 × 5 × 5 × 5를 거듭제곱으로 나타내시오.", null, "3^2×5^3", "같은 소인수를 묶으면 3이 2개, 5가 3개이므로 3^2 × 5^3입니다.", ["3^2 × 5^3", "5^3×3^2"]),
      p("n3", "최대공약수", "중", "입력형", "72와 108의 최대공약수를 구하시오.", null, "36", "72 = 2^3 × 3^2, 108 = 2^2 × 3^3이므로 공통 소인수의 작은 지수를 택해 2^2 × 3^2 = 36입니다."),
      p("n4", "최소공배수", "중", "입력형", "18, 24, 30의 최소공배수를 구하시오.", null, "360", "18 = 2 × 3^2, 24 = 2^3 × 3, 30 = 2 × 3 × 5입니다. 큰 지수를 모아 2^3 × 3^2 × 5 = 360입니다."),
      p("n5", "정수와 유리수", "하", "선택형", "다음 중 정수가 아닌 유리수만 모두 고른 것은?", ["-4, 0", "2.5, -7/3", "6, -9", "0, 11"], "2.5, -7/3", "유리수 중 정수가 아닌 수는 소수나 분수 꼴이면서 정수로 딱 떨어지지 않는 수입니다."),
      p("n6", "수의 대소", "중", "선택형", "-3.2, -7/2, 0, 5/3을 작은 것부터 바르게 나열한 것은?", ["-7/2, -3.2, 0, 5/3", "-3.2, -7/2, 0, 5/3", "0, 5/3, -3.2, -7/2", "-7/2, 0, -3.2, 5/3"], "-7/2, -3.2, 0, 5/3", "-7/2 = -3.5입니다. 음수끼리는 절댓값이 큰 수가 더 작습니다."),
      p("n7", "유리수의 덧셈", "중", "입력형", "(-5) + 12 + (-9)를 계산하시오.", null, "-2", "-5 + 12 = 7이고, 7 + (-9) = -2입니다."),
      p("n8", "유리수의 곱셈", "상", "입력형", "(-3/4) × 8 ÷ (-2)를 계산하시오.", null, "3", "(-3/4) × 8 = -6이고, -6 ÷ (-2) = 3입니다.")
    ]
  },
  {
    id: "symbols",
    title: "Ⅱ. 문자와 식",
    note: "문자의 사용, 일차식 계산, 방정식의 해와 일차방정식 활용을 평가합니다.",
    visual: "symbols",
    problems: [
      p("s1", "식의 값", "하", "입력형", "a = -2, b = 5일 때 3a + 2b의 값을 구하시오.", null, "4", "3(-2) + 2(5) = -6 + 10 = 4입니다."),
      p("s2", "문자의 사용", "하", "선택형", "한 권에 x원인 공책 4권과 700원짜리 연필 2자루의 값은?", ["4x + 1400", "4x + 700", "2x + 2800", "x + 1400"], "4x + 1400", "공책은 4x원, 연필은 700 × 2 = 1400원이므로 4x + 1400입니다."),
      p("s3", "일차식의 곱셈", "중", "입력형", "-3(2x - 5)를 전개하시오.", null, "-6x+15", "분배법칙을 적용하면 -3 × 2x + (-3) × (-5) = -6x + 15입니다.", ["-6x + 15"]),
      p("s4", "일차식의 덧셈", "중", "입력형", "(5x - 7) - (2x + 4)를 간단히 하시오.", null, "3x-11", "괄호를 풀면 5x - 7 - 2x - 4 = 3x - 11입니다.", ["3x - 11"]),
      p("s5", "방정식의 해", "하", "선택형", "x = 3이 해인 방정식은?", ["2x + 1 = 7", "x - 4 = 0", "3x = 6", "x + 5 = 10"], "2x + 1 = 7", "x = 3을 넣으면 2 × 3 + 1 = 7로 참입니다."),
      p("s6", "일차방정식", "중", "입력형", "4x - 7 = 21의 해를 구하시오.", null, "7", "양변에 7을 더하면 4x = 28, 따라서 x = 7입니다."),
      p("s7", "활용", "상", "입력형", "어떤 수에 5를 더한 뒤 3배 했더니 42가 되었다. 어떤 수를 구하시오.", null, "9", "어떤 수를 x라 하면 3(x + 5) = 42입니다. x + 5 = 14이므로 x = 9입니다.")
    ]
  },
  {
    id: "graph",
    title: "Ⅲ. 좌표평면과 그래프",
    note: "순서쌍, 좌표, 그래프 해석, 정비례와 반비례 관계를 확인합니다.",
    visual: "graph",
    problems: [
      p("g1", "순서쌍", "하", "선택형", "점 A가 x축의 왼쪽으로 3칸, y축의 위쪽으로 2칸에 있다. A의 좌표는?", ["(3, 2)", "(-3, 2)", "(2, -3)", "(-2, 3)"], "(-3, 2)", "왼쪽은 x좌표가 음수, 위쪽은 y좌표가 양수입니다."),
      p("g2", "사분면", "하", "선택형", "점 (-4, -1)이 있는 사분면은?", ["제1사분면", "제2사분면", "제3사분면", "제4사분면"], "제3사분면", "x좌표와 y좌표가 모두 음수이면 제3사분면입니다."),
      p("g3", "그래프 해석", "중", "입력형", "한 물통에 2분마다 6 L씩 물이 찬다. 10분 뒤 물의 양은 몇 L인가?", null, "30", "2분에 6 L이면 1분에 3 L입니다. 10분 뒤에는 30 L입니다."),
      p("g4", "정비례", "중", "선택형", "y가 x에 정비례하고 x = 4일 때 y = 12이다. 관계식은?", ["y = 3x", "y = 4x", "y = 12x", "y = x/3"], "y = 3x", "y = ax에서 12 = 4a이므로 a = 3입니다."),
      p("g5", "정비례 그래프", "중", "입력형", "y = -2x의 그래프에서 x = -3일 때 y의 값을 구하시오.", null, "6", "y = -2 × (-3) = 6입니다."),
      p("g6", "반비례", "상", "입력형", "y가 x에 반비례하고 x = 5일 때 y = 6이다. x = 3일 때 y를 구하시오.", null, "10", "xy = 일정하므로 5 × 6 = 30입니다. x = 3이면 y = 10입니다."),
      p("g7", "그래프 선택", "상", "선택형", "반비례 y = 12/x의 그래프가 지나지 않는 점은?", ["(2, 6)", "(3, 4)", "(-4, -3)", "(6, -2)"], "(6, -2)", "반비례식 y = 12/x에서는 xy = 12입니다. (6, -2)는 xy = -12입니다.")
    ]
  },
  {
    id: "basic-geometry",
    title: "Ⅳ. 도형의 기초",
    note: "점, 선, 면, 각, 위치 관계, 평행선, 작도, 삼각형 합동 조건을 다룹니다.",
    visual: "geometry",
    problems: [
      p("b1", "기본 도형", "하", "선택형", "한 점에서 시작하여 한쪽으로 끝없이 뻗은 곧은 선은?", ["직선", "반직선", "선분", "평면"], "반직선", "시작점이 있고 한 방향으로 끝없이 뻗으면 반직선입니다."),
      p("b2", "각", "하", "입력형", "35°의 여각을 구하시오.", null, "55", "두 각의 합이 90°이면 여각입니다. 90 - 35 = 55°입니다.", ["55도", "55°"]),
      p("b3", "맞꼭지각", "중", "입력형", "두 직선이 만나 생긴 한 각이 128°일 때, 그 각과 맞꼭지각의 크기는 몇 도인가?", null, "128", "맞꼭지각의 크기는 서로 같습니다.", ["128도", "128°"]),
      p("b4", "평행선", "중", "선택형", "평행한 두 직선이 한 직선과 만날 때 항상 크기가 같은 각은?", ["동위각", "한 내각", "인접각", "보각"], "동위각", "평행선에서 동위각과 엇각의 크기는 각각 같습니다."),
      p("b5", "삼각형 작도", "중", "선택형", "삼각형이 하나로 정해지는 조건이 아닌 것은?", ["세 변의 길이", "두 변과 그 끼인각", "한 변과 양 끝각", "두 변과 끼이지 않은 한 각"], "두 변과 끼이지 않은 한 각", "SSA 조건은 일반적으로 삼각형이 하나로 정해지지 않을 수 있습니다."),
      p("b6", "합동 조건", "상", "선택형", "두 삼각형에서 AB = DE, AC = DF, ∠A = ∠D이면 사용할 수 있는 합동 조건은?", ["SSS", "SAS", "ASA", "RHS"], "SAS", "두 변과 그 끼인각이 각각 같으므로 SAS 합동입니다."),
      p("b7", "위치 관계", "중", "선택형", "공간에서 한 직선과 한 평면이 만나는 점이 없을 때의 관계는?", ["직선이 평면 위에 있다", "직선과 평면이 평행하다", "직선과 평면이 수직이다", "직선이 평면을 한 점에서 만난다"], "직선과 평면이 평행하다", "공통점이 없으면 직선과 평면은 평행합니다.")
    ]
  },
  {
    id: "solid-geometry",
    title: "Ⅴ. 도형의 성질",
    note: "다각형의 각, 원과 부채꼴, 다면체와 회전체, 입체도형의 겉넓이와 부피를 연습합니다.",
    visual: "solid",
    problems: [
      p("d1", "다각형", "하", "입력형", "칠각형의 대각선의 개수를 구하시오.", null, "14", "n각형의 대각선 개수는 n(n - 3)/2입니다. 7 × 4 ÷ 2 = 14입니다."),
      p("d2", "내각의 합", "중", "입력형", "구각형의 내각의 크기의 합은 몇 도인가?", null, "1260", "(n - 2) × 180°이므로 7 × 180° = 1260°입니다.", ["1260도", "1260°"]),
      p("d3", "외각", "중", "선택형", "정십이각형의 한 외각의 크기는?", ["15°", "30°", "45°", "60°"], "30°", "정다각형의 한 외각은 360° ÷ n입니다. 360° ÷ 12 = 30°입니다."),
      p("d4", "부채꼴", "중", "입력형", "반지름 6 cm, 중심각 60°인 부채꼴의 호의 길이를 π를 사용하여 나타내시오.", null, "2π", "호의 길이는 2πr × 60/360 = 12π × 1/6 = 2π입니다.", ["2pi", "2πcm", "2 pi"]),
      p("d5", "다면체", "하", "선택형", "오각기둥의 면의 개수는?", ["5", "6", "7", "10"], "7", "n각기둥의 면은 옆면 n개와 밑면 2개이므로 n + 2입니다. 오각기둥은 7개입니다."),
      p("d6", "기둥의 부피", "중", "입력형", "밑넓이가 24 cm², 높이가 9 cm인 기둥의 부피를 구하시오.", null, "216", "기둥의 부피는 밑넓이 × 높이입니다. 24 × 9 = 216입니다."),
      p("d7", "구", "상", "입력형", "반지름이 3 cm인 구의 겉넓이를 π를 사용하여 나타내시오.", null, "36π", "구의 겉넓이는 4πr²입니다. 4π × 3² = 36π입니다.", ["36pi", "36πcm^2", "36π㎠"])
    ]
  },
  {
    id: "statistics",
    title: "Ⅵ. 통계",
    note: "대푯값, 도수분포표, 히스토그램, 상대도수와 통계적 문제해결 과정을 확인합니다.",
    visual: "stats",
    problems: [
      p("t1", "평균", "하", "입력형", "자료 4, 7, 9, 10, 10의 평균을 구하시오.", null, "8", "합은 40이고 자료 수는 5개이므로 평균은 8입니다."),
      p("t2", "중앙값", "하", "입력형", "자료 12, 5, 8, 11, 4, 6의 중앙값을 구하시오.", null, "7", "작은 순서로 4, 5, 6, 8, 11, 12입니다. 가운데 두 값 6과 8의 평균은 7입니다."),
      p("t3", "최빈값", "하", "선택형", "자료 2, 3, 3, 5, 6, 6, 6, 8의 최빈값은?", ["3", "5", "6", "8"], "6", "가장 자주 나타나는 값은 6입니다."),
      p("t4", "도수분포표", "중", "입력형", "어떤 계급의 도수가 9이고 전체 도수가 45일 때, 이 계급의 상대도수를 구하시오.", null, "0.2", "상대도수는 계급의 도수 ÷ 전체 도수입니다. 9 ÷ 45 = 0.2입니다.", ["1/5"]),
      p("t5", "히스토그램", "중", "선택형", "히스토그램에서 가로축은 주로 무엇을 나타내는가?", ["계급", "평균", "최빈값", "조사 대상 이름"], "계급", "히스토그램의 가로축은 계급, 세로축은 도수입니다."),
      p("t6", "상대도수", "중", "입력형", "상대도수가 0.16이고 전체 도수가 50이면 그 계급의 도수는?", null, "8", "도수 = 상대도수 × 전체 도수 = 0.16 × 50 = 8입니다."),
      p("t7", "통계적 문제해결", "상", "선택형", "통계적 문제해결 과정의 순서로 알맞은 것은?", ["문제 설정 → 자료 수집 → 자료 정리와 해석 → 결론", "자료 수집 → 결론 → 문제 설정 → 자료 정리", "결론 → 자료 수집 → 문제 설정 → 해석", "자료 정리 → 문제 설정 → 결론 → 자료 수집"], "문제 설정 → 자료 수집 → 자료 정리와 해석 → 결론", "먼저 조사할 문제를 정하고, 자료를 모은 뒤 정리와 해석을 거쳐 결론을 냅니다.")
    ]
  }
];

const state = {
  unitId: units[0].id,
  filter: "전체",
  selectedId: units[0].problems[0].id,
  mistakeOnly: false,
  answers: loadProgress()
};

const $ = (selector) => document.querySelector(selector);

function p(id, topic, level, type, question, choices, answer, explanation, accepted = []) {
  return { id, topic, level, type, question, choices, answer, explanation, accepted };
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
}

function currentUnit() {
  return units.find((unit) => unit.id === state.unitId);
}

function allProblems() {
  return units.flatMap((unit) => unit.problems.map((problem) => ({ ...problem, unitTitle: unit.title })));
}

function normalize(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .replace(/×/g, "x")
    .replace(/\*/g, "x")
    .replace(/㎠/g, "cm^2")
    .replace(/π/g, "pi")
    .toLowerCase();
}

function isCorrect(problem, value) {
  const allowed = [problem.answer, ...(problem.accepted || [])].map(normalize);
  return allowed.includes(normalize(value));
}

function answered(problem) {
  return state.answers[problem.id];
}

function unitProgress(unit) {
  const solved = unit.problems.filter((problem) => answered(problem)?.correct).length;
  return Math.round((solved / unit.problems.length) * 100);
}

function overallProgress() {
  const problems = allProblems();
  const solved = problems.filter((problem) => answered(problem)?.correct).length;
  return Math.round((solved / problems.length) * 100);
}

function filteredProblems() {
  let problems = currentUnit().problems;
  if (state.filter !== "전체") {
    problems = problems.filter((problem) => problem.topic === state.filter || problem.type === state.filter || problem.level === state.filter);
  }
  if (state.mistakeOnly) {
    problems = problems.filter((problem) => answered(problem) && !answered(problem).correct);
  }
  return problems;
}

function render() {
  renderUnits();
  renderSummary();
  renderFilters();
  renderProblemList();
  renderProblemStage();
  renderOverall();
}

function renderOverall() {
  const percent = overallProgress();
  $("#overall-score").textContent = `${percent}%`;
  $("#overall-bar").style.width = `${percent}%`;
}

function renderUnits() {
  $("#unit-list").innerHTML = units
    .map((unit) => {
      const active = unit.id === state.unitId ? "active" : "";
      return `<button class="unit-button ${active}" type="button" data-unit="${unit.id}">
        <span class="unit-title">${unit.title}<span>${unitProgress(unit)}%</span></span>
        <span class="unit-meta">${unit.problems.length}문항 · ${unit.note}</span>
      </button>`;
    })
    .join("");

  document.querySelectorAll("[data-unit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.unitId = button.dataset.unit;
      state.filter = "전체";
      state.mistakeOnly = false;
      state.selectedId = currentUnit().problems[0].id;
      render();
    });
  });
}

function renderSummary() {
  const unit = currentUnit();
  const correct = unit.problems.filter((problem) => answered(problem)?.correct).length;
  const incorrect = unit.problems.filter((problem) => answered(problem) && !answered(problem).correct).length;
  $("#unit-summary").innerHTML = `
    <h2>${unit.title}</h2>
    <p>${unit.note}</p>
    <div class="summary-stats">
      <span class="stat-pill">정답 ${correct}문항</span>
      <span class="stat-pill">오답 ${incorrect}문항</span>
      <span class="stat-pill">남은 문항 ${unit.problems.length - correct}문항</span>
    </div>
    <div class="summary-visual">${visualFor(unit.visual)}</div>
  `;
}

function renderFilters() {
  const unit = currentUnit();
  const topics = ["전체", ...new Set(unit.problems.flatMap((problem) => [problem.topic, problem.level, problem.type]))];
  $("#filter-tabs").innerHTML = topics
    .map((topic) => `<button class="chip ${topic === state.filter ? "active" : ""}" type="button" data-filter="${topic}">${topic}</button>`)
    .join("");

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      const first = filteredProblems()[0];
      if (first) state.selectedId = first.id;
      render();
    });
  });

  $("#mistake-mode").classList.toggle("active", state.mistakeOnly);
  $("#mistake-mode").textContent = state.mistakeOnly ? "전체 문항" : "오답노트";
}

function renderProblemList() {
  const problems = filteredProblems();
  if (!problems.length) {
    $("#problem-list").innerHTML = `<div class="empty-note">조건에 맞는 문항이 없습니다. 다른 필터를 선택해 주세요.</div>`;
    return;
  }

  if (!problems.some((problem) => problem.id === state.selectedId)) {
    state.selectedId = problems[0].id;
  }

  $("#problem-list").innerHTML = problems
    .map((problem, index) => {
      const record = answered(problem);
      const status = record ? (record.correct ? "correct" : "incorrect") : "";
      const active = problem.id === state.selectedId ? "active" : "";
      return `<button class="problem-button ${status} ${active}" type="button" data-problem="${problem.id}">
        <span class="problem-top"><span>${String(index + 1).padStart(2, "0")} · ${problem.topic}</span><span>${record ? (record.correct ? "정답" : "오답") : "미풀이"}</span></span>
        <span class="problem-name">${escapeHTML(problem.question)}</span>
      </button>`;
    })
    .join("");

  document.querySelectorAll("[data-problem]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.problem;
      render();
    });
  });
}

function renderProblemStage() {
  const available = filteredProblems();
  const problem = available.find((item) => item.id === state.selectedId) || available[0];
  if (!problem) {
    $("#problem-stage").innerHTML = `<div class="empty-note">오답 문항이 생기면 이곳에서 다시 풀 수 있습니다.</div>`;
    return;
  }

  const record = answered(problem);
  $("#problem-stage").innerHTML = `
    <div class="stage-meta">
      <span class="badge">${problem.topic}</span>
      <span class="badge level-${problem.level}">${problem.level}</span>
      <span class="badge">${problem.type}</span>
    </div>
    <p class="question">${escapeHTML(problem.question)}</p>
    ${problemVisual(problem)}
    <div id="answer-area">${answerControl(problem, record)}</div>
    <div class="answer-actions">
      <button class="primary-button" id="check-answer" type="button">채점하기</button>
      <button class="secondary-button" id="show-solution" type="button">해설 보기</button>
    </div>
    <div id="feedback" class="feedback ${record ? "show " + (record.correct ? "correct" : "incorrect") : ""}">
      ${record ? feedbackHTML(problem, record.correct, record.value) : ""}
    </div>
  `;

  bindAnswerControls(problem);
}

function answerControl(problem, record) {
  if (problem.choices) {
    return `<div class="choice-grid">${problem.choices
      .map((choice) => {
        const selected = record?.value === choice ? "selected" : "";
        return `<button class="choice-button ${selected}" type="button" data-choice="${escapeHTML(choice)}">${escapeHTML(choice)}</button>`;
      })
      .join("")}</div>`;
  }
  return `<input class="input-answer" id="input-answer" value="${escapeHTML(record?.value || "")}" placeholder="답을 입력하세요" autocomplete="off" />`;
}

function bindAnswerControls(problem) {
  let selectedChoice = answered(problem)?.value || "";

  document.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedChoice = button.dataset.choice;
      document.querySelectorAll("[data-choice]").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  $("#check-answer").addEventListener("click", () => {
    const value = problem.choices ? selectedChoice : $("#input-answer").value;
    if (!String(value).trim()) {
      showFeedback(problem, false, "답을 먼저 입력해 주세요.", true);
      return;
    }
    const correct = isCorrect(problem, value);
    state.answers[problem.id] = { value, correct, checkedAt: new Date().toISOString() };
    saveProgress();
    showFeedback(problem, correct, value);
    renderUnits();
    renderProblemList();
    renderSummary();
    renderOverall();
  });

  $("#show-solution").addEventListener("click", () => {
    showFeedback(problem, true, problem.answer, false, true);
  });
}

function showFeedback(problem, correct, value, soft = false, solutionOnly = false) {
  const feedback = $("#feedback");
  feedback.className = `feedback show ${correct ? "correct" : "incorrect"}`;
  if (soft) {
    feedback.innerHTML = `<strong>입력이 필요합니다.</strong><span>${value}</span>`;
    return;
  }
  feedback.innerHTML = solutionOnly
    ? `<strong>해설</strong><span>정답은 ${escapeHTML(problem.answer)}입니다. ${escapeHTML(problem.explanation)}</span>`
    : feedbackHTML(problem, correct, value);
}

function feedbackHTML(problem, correct, value) {
  const head = correct ? "정답입니다." : "다시 점검해 보세요.";
  const answerLine = correct ? "" : `입력한 답은 ${escapeHTML(value)}이고, 정답은 ${escapeHTML(problem.answer)}입니다. `;
  return `<strong>${head}</strong><span>${answerLine}${escapeHTML(problem.explanation)}</span>`;
}

function problemVisual(problem) {
  if (problem.topic.includes("수의 대소")) return `<div class="problem-visual">${numberLine()}</div>`;
  if (problem.topic.includes("정비례") || problem.topic.includes("반비례")) return `<div class="problem-visual">${coordinateMini()}</div>`;
  if (problem.topic.includes("각") || problem.topic.includes("평행선")) return `<div class="problem-visual">${angleMini()}</div>`;
  if (problem.topic.includes("히스토그램") || problem.topic.includes("상대도수")) return `<div class="problem-visual">${histogramMini()}</div>`;
  if (problem.topic.includes("부채꼴") || problem.topic.includes("구")) return `<div class="problem-visual">${circleMini()}</div>`;
  return "";
}

function visualFor(type) {
  const visuals = {
    numbers: numberLine(),
    symbols: algebraTiles(),
    graph: coordinateMini(),
    geometry: angleMini(),
    solid: circleMini(),
    stats: histogramMini()
  };
  return visuals[type] || "";
}

function numberLine() {
  return `<svg viewBox="0 0 320 120" role="img" aria-label="수직선 그림">
    <line x1="24" y1="62" x2="296" y2="62" stroke="#172026" stroke-width="2"/>
    ${[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((n, i) => `<g><line x1="${40 + i * 30}" y1="54" x2="${40 + i * 30}" y2="70" stroke="#172026"/><text x="${40 + i * 30}" y="92" text-anchor="middle" font-size="13">${n}</text></g>`).join("")}
    <circle cx="55" cy="62" r="7" fill="#d75a3c"/><circle cx="160" cy="62" r="7" fill="#0f766e"/>
    <text x="55" y="35" text-anchor="middle" font-size="13" fill="#d75a3c">-3.5</text><text x="160" y="35" text-anchor="middle" font-size="13" fill="#0f766e">0</text>
  </svg>`;
}

function algebraTiles() {
  return `<svg viewBox="0 0 320 120" role="img" aria-label="일차식 타일 그림">
    <rect x="34" y="28" width="96" height="40" rx="6" fill="#e6f4f1" stroke="#0f766e"/><text x="82" y="54" text-anchor="middle" font-size="18" font-weight="700">x</text>
    <rect x="144" y="28" width="40" height="40" rx="6" fill="#fff1ec" stroke="#d75a3c"/><text x="164" y="54" text-anchor="middle" font-size="18" font-weight="700">1</text>
    <rect x="192" y="28" width="40" height="40" rx="6" fill="#fff1ec" stroke="#d75a3c"/><text x="212" y="54" text-anchor="middle" font-size="18" font-weight="700">1</text>
    <path d="M56 88h210" stroke="#2563eb" stroke-width="3"/><text x="160" y="108" text-anchor="middle" font-size="14">문자와 수를 같은 규칙으로 계산</text>
  </svg>`;
}

function coordinateMini() {
  return `<svg viewBox="0 0 320 150" role="img" aria-label="좌표평면 그림">
    <line x1="36" y1="76" x2="286" y2="76" stroke="#172026"/><line x1="160" y1="18" x2="160" y2="130" stroke="#172026"/>
    <path d="M50 128 L270 18" fill="none" stroke="#0f766e" stroke-width="3"/><path d="M58 34 C92 18 120 30 142 58 C174 98 220 112 270 96" fill="none" stroke="#d75a3c" stroke-width="3"/>
    <text x="292" y="80" font-size="13">x</text><text x="166" y="24" font-size="13">y</text>
  </svg>`;
}

function angleMini() {
  return `<svg viewBox="0 0 320 140" role="img" aria-label="각과 평행선 그림">
    <line x1="36" y1="44" x2="284" y2="24" stroke="#172026" stroke-width="3"/><line x1="36" y1="100" x2="284" y2="80" stroke="#172026" stroke-width="3"/>
    <line x1="120" y1="16" x2="202" y2="124" stroke="#2563eb" stroke-width="3"/>
    <path d="M145 48 A28 28 0 0 1 166 63" fill="none" stroke="#d75a3c" stroke-width="4"/><path d="M170 91 A28 28 0 0 1 190 106" fill="none" stroke="#0f766e" stroke-width="4"/>
    <text x="198" y="112" font-size="14" fill="#0f766e">엇각</text>
  </svg>`;
}

function circleMini() {
  return `<svg viewBox="0 0 320 140" role="img" aria-label="부채꼴과 입체도형 그림">
    <path d="M92 70 L92 20 A50 50 0 0 1 135 95 Z" fill="#e6f4f1" stroke="#0f766e" stroke-width="2"/><text x="80" y="116" font-size="13">부채꼴</text>
    <ellipse cx="226" cy="38" rx="44" ry="14" fill="#eef5ff" stroke="#2563eb"/><path d="M182 38v62c0 8 88 8 88 0V38" fill="#eef5ff" stroke="#2563eb"/><ellipse cx="226" cy="100" rx="44" ry="14" fill="#ffffff" stroke="#2563eb"/><text x="204" y="126" font-size="13">기둥</text>
  </svg>`;
}

function histogramMini() {
  return `<svg viewBox="0 0 320 140" role="img" aria-label="히스토그램 그림">
    <line x1="40" y1="112" x2="286" y2="112" stroke="#172026"/><line x1="40" y1="20" x2="40" y2="112" stroke="#172026"/>
    <rect x="58" y="82" width="34" height="30" fill="#e6f4f1" stroke="#0f766e"/><rect x="92" y="60" width="34" height="52" fill="#e6f4f1" stroke="#0f766e"/><rect x="126" y="34" width="34" height="78" fill="#e6f4f1" stroke="#0f766e"/><rect x="160" y="72" width="34" height="40" fill="#e6f4f1" stroke="#0f766e"/><rect x="194" y="50" width="34" height="62" fill="#e6f4f1" stroke="#0f766e"/>
    <polyline points="75,82 109,60 143,34 177,72 211,50" fill="none" stroke="#d75a3c" stroke-width="3"/>
  </svg>`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPrintSheet() {
  const unit = currentUnit();
  const selected = unit.problems.slice(0, 12);
  $("#print-sheet").innerHTML = `
    <h1>${unit.title} 평가문제</h1>
    <p>이름: ____________  날짜: ____________  점수: ____________</p>
    ${selected
      .map((problem, index) => `<div class="print-problem"><strong>${index + 1}. [${problem.topic}]</strong> ${escapeHTML(problem.question)}<br/>답: ______________________________</div>`)
      .join("")}
    <h2>정답</h2>
    <p>${selected.map((problem, index) => `${index + 1}. ${escapeHTML(problem.answer)}`).join(" / ")}</p>
  `;
}

$("#mistake-mode").addEventListener("click", () => {
  state.mistakeOnly = !state.mistakeOnly;
  const first = filteredProblems()[0];
  if (first) state.selectedId = first.id;
  render();
});

$("#reset-progress").addEventListener("click", () => {
  if (!confirm("저장된 풀이 기록을 모두 지울까요?")) return;
  state.answers = {};
  saveProgress();
  render();
});

$("#print-test").addEventListener("click", () => {
  buildPrintSheet();
  window.print();
});

render();
