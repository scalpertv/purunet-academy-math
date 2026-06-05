// 1·2·3·4·5·6학년 3월~다음 해 2월 PDF 흐름을 바탕으로 한 난수형 문제 생성기.
// 원문 문항을 복제하지 않고 같은 학습 유형을 매번 새 숫자로 재구성한다.

import { choice, divisors, gcd, lcm, multiples, randInt, sample } from "./math";
import {
  addFrac,
  fracLcm,
  fracEq,
  fracVal,
  formatFrac,
  makeFrac,
  rawFrac,
  reduceFrac,
  subFrac,
  type Frac,
} from "./frac";
import type { CompareSign, Problem, SolutionStep } from "./types";

// ── 공통 헬퍼 ────────────────────────────────────────────────

// 단위 키워드 위치 기반 단위 환산 방향 판정 (isBigToSmall = ansNum > 100 보다 정밀)
const UNIT_RELATIVE_SIZE: Record<string, number> = {
  km: 1_000_000, m: 100, cm: 1, mm: 0.1,
  t: 1_000_000_000, kg: 1000, g: 1,
  kL: 1_000_000, L: 1000, dL: 100, mL: 1,
  h: 3600, min: 60, s: 1,
};

function detectUnitConversionDirection(prompt: string, expression: string): "bigToSmall" | "smallToBig" | "unknown" {
  const text = `${prompt} ${expression}`;
  // "XX로 바꾸세요" / "XX로 나타내세요" 패턴에서 목표 단위 추출
  const targetMatch = /([a-zA-Z]+)\s*(로|으로)\s*(바꾸|나타내)/.exec(text);
  if (!targetMatch) return "unknown";
  const targetUnit = targetMatch[1]!;
  const targetSize = UNIT_RELATIVE_SIZE[targetUnit];
  if (targetSize === undefined) return "unknown";
  // 목표 단위 등장 위치 이전 텍스트에서 출발 단위들 검색
  const targetPos = text.indexOf(targetMatch[0]);
  const sourcePart = text.slice(0, targetPos);
  const sourceUnits = Object.keys(UNIT_RELATIVE_SIZE).filter((u) => sourcePart.includes(u));
  if (sourceUnits.length === 0) return "unknown";
  const maxSourceSize = Math.max(...sourceUnits.map((u) => UNIT_RELATIVE_SIZE[u]!));
  if (maxSourceSize > targetSize) return "bigToSmall";
  if (maxSourceSize < targetSize) return "smallToBig";
  return "unknown";
}

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function compareSign(a: number, b: number): CompareSign {
  if (a === b) return "=";
  return a > b ? ">" : "<";
}

function fracText(f: Frac): string {
  return rawFrac(f);
}

function scaledFrac(f: Frac, denominator: number): Frac {
  const factor = denominator / f.d;
  return makeFrac(f.n * factor, denominator);
}

function properFraction(maxDenominator = 12): Frac {
  return sample<Frac>(() => {
    const d = randInt(3, maxDenominator);
    const n = randInt(1, d - 1);
    if (gcd(n, d) !== 1) return null;
    return makeFrac(n, d);
  }, makeFrac(2, 5));
}

function mixedOrProperFraction(): Frac {
  const whole = randInt(0, 2);
  const f = properFraction(10);
  return makeFrac(whole * f.d + f.n, f.d);
}

function mkInteger(
  topicId: string,
  prompt: string,
  expression: string,
  answer: number,
  solution: string,
  hint = "숫자만 입력",
): Problem {
  return { topicId, prompt, expression, hint, answer, kind: "integer", solution };
}

function mkChoice(
  topicId: string,
  prompt: string,
  expression: string,
  answer: string,
  distractors: string[],
  solution: string,
): Problem {
  const uniqueDistractors = Array.from(new Set(distractors)).filter((item) => item !== answer);
  const choices = shuffle([answer, ...shuffle(uniqueDistractors).slice(0, 3)]);
  return {
    topicId,
    prompt,
    expression,
    answer,
    choices,
    kind: "choice",
    solution,
  };
}

function mulFrac(a: Frac, b: Frac): Frac {
  return reduceFrac(makeFrac(a.n * b.n, a.d * b.d));
}

function decimalText(value: number, places = 2): string {
  return value.toFixed(places).replace(/\.?0+$/, "");
}

function retopic(topicId: string, problem: Problem): Problem {
  return { ...problem, topicId };
}

function withVisual(problem: Problem, visual: NonNullable<Problem["visual"]>): Problem {
  return { ...problem, visual };
}

type G6ParkFlow = {
  concept: string;
  prompts: string[];
  steps: (problem: Problem, answerText: string) => SolutionStep[];
};

function answerDisplay(problem: Problem): string {
  if (problem.answerText) return problem.answerText;
  if (problem.kind === "fraction" && typeof problem.answer === "object" && problem.answer && "n" in problem.answer && "d" in problem.answer) {
    return formatFrac(problem.answer);
  }
  if (Array.isArray(problem.answer)) return problem.answer.join(", ");
  const inferUnit = () => {
    const text = `${problem.solution} ${problem.expression}`;
    return ["cm³", "cm²", "m³", "m²", "kg", "L", "cm", "m", "%p", "%", "°", "원", "쪽", "명", "묶음", "자리", "층", "컵", "개"].find((item) => text.includes(item));
  };
  if (typeof problem.answer === "number") {
    const unit = inferUnit();
    return unit ? `${problem.answer} ${unit}` : String(problem.answer);
  }
  if (typeof problem.answer === "string" && /^-?\d+(?:\.\d+)?$/.test(problem.answer)) {
    const unit = inferUnit();
    return unit ? `${problem.answer} ${unit}` : problem.answer;
  }
  return String(problem.answer);
}

function uniqueOptions(options: string[], answer: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const option of [answer, ...options]) {
    const value = option.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length === 4) break;
  }
  const fallback = ["계산 과정 오류", "단위 해석 오류", "조건 부족", "비례 관계 오류", "소수점 위치 오류"];
  for (const option of fallback) {
    if (result.length === 4) break;
    if (seen.has(option) || option === answer) continue;
    seen.add(option);
    result.push(option);
  }
  return result;
}

function numericDistractors(value: number, answerText: string): string[] {
  const suffix = answerText.startsWith(String(value)) ? answerText.slice(String(value).length) : "";
  const candidates = [
    value + 1,
    Math.max(0, value - 1),
    value * 10,
    value / 10,
    Math.round(value * 1.1),
    Math.max(0, Math.round(value * 0.9)),
  ];
  return candidates
    .filter((candidate) => Number.isFinite(candidate) && candidate !== value)
    .map((candidate) => `${decimalText(candidate, Number.isInteger(candidate) ? 0 : 2)}${suffix}`);
}

function fractionDistractors(frac: Frac): string[] {
  return [
    formatFrac(reduceFrac(makeFrac(frac.n + 1, frac.d))),
    formatFrac(reduceFrac(makeFrac(frac.n, frac.d + 1))),
    formatFrac(reduceFrac(makeFrac(frac.n * 2, frac.d))),
    formatFrac(reduceFrac(makeFrac(frac.d, Math.max(1, frac.n)))),
    rawFrac(frac),
  ];
}

function stringDistractors(answer: string, existing: string[] = []): string[] {
  const ratio = answer.match(/^(\d+):(\d+)$/);
  if (ratio) {
    const a = Number(ratio[1]);
    const b = Number(ratio[2]);
    return [`${b}:${a}`, `${a + b}:${b}`, `${a}:${a + b}`, `${Math.max(1, a)}:${Math.max(1, b + 1)}`, `${Math.max(1, a + 1)}:${Math.max(1, b)}`, ...existing];
  }
  const percent = answer.match(/^(\d+(?:\.\d+)?)%$/);
  if (percent) {
    const value = Number(percent[1]);
    return [`${value / 100}`, `${value + 10}%`, `${Math.max(0, value - 10)}%`, ...existing];
  }
  const decimal = Number(answer);
  const numberWithUnit = answer.match(/^(-?\d+(?:\.\d+)?)(\s+\S+)$/);
  if (numberWithUnit) {
    return [...numericDistractors(Number(numberWithUnit[1]), answer), ...existing];
  }
  if (Number.isFinite(decimal) && answer.trim() !== "") {
    return [...numericDistractors(decimal, answer), ...existing];
  }
  return [...existing, "기준량과 비교하는 양이 바뀐 값", "소수점 위치가 다른 값", "단위가 다른 값"];
}

function toG6FourChoice(problem: Problem, answerText: string): Problem {
  const existingChoices = problem.choices ?? [];
  let distractors: string[];
  if (problem.kind === "fraction" && typeof problem.answer === "object" && problem.answer && "n" in problem.answer && "d" in problem.answer) {
    distractors = fractionDistractors(problem.answer);
  } else if (typeof problem.answer === "number") {
    distractors = numericDistractors(problem.answer, answerText);
  } else {
    distractors = stringDistractors(answerText, existingChoices);
  }
  return {
    ...problem,
    kind: "choice",
    answer: answerText,
    answerText,
    choices: shuffle(uniqueOptions(distractors, answerText)),
    hint: "정답 1개를 고르세요.",
  };
}

function numberedFlow(concept: string, steps: SolutionStep[], originalSolution: string): string {
  const flow = steps.map((step, index) => `${index + 1}. ${step.label}: ${step.answer}`).join("\n");
  return `핵심 개념: ${concept}\n정형 풀이\n${flow}\n검산 및 단위 해석: ${originalSolution}`;
}

function g6ParkFlowProfile(topicId: string): G6ParkFlow | null {
  if (topicId.includes("decimal-divide")) {
    return {
      concept: "소수의 나눗셈은 피제수와 제수의 자리값을 보존한 채 자연수 나눗셈 알고리즘을 적용하고, 몫의 소수점 위치를 검산식으로 확정합니다.",
      prompts: [
        "소수점의 자리값과 검산식을 근거로 알맞은 몫을 고르세요.",
        "피제수, 제수, 몫의 관계를 이용해 소수 나눗셈을 해결하세요.",
        "소수 나눗셈 알고리즘을 적용하여 옳은 값을 선택하세요.",
      ],
      steps: (problem, answerText) => [
        { label: "자리값 분석", answer: `${problem.expression}에서 피제수의 소수 자릿수와 제수의 크기를 확인합니다.`, hint: "0.1, 0.01 단위가 몇 개인지 해석합니다." },
        { label: "나눗셈 알고리즘", answer: "자연수 나눗셈과 같은 절차로 계산하되, 몫의 소수점은 피제수의 자리값과 대응시킵니다.", hint: "필요하면 0을 보충해 나눗셈을 계속합니다." },
        { label: "검산식 적용", answer: `몫 ${answerText}에 제수를 곱해 피제수가 되는지 확인합니다.`, hint: "몫 × 제수 = 피제수 관계를 사용합니다." },
      ],
    };
  }
  if (topicId.includes("ratio") || topicId.includes("rate") || topicId.includes("percent") || topicId.includes("quantity-from") || topicId.includes("proportion") || topicId.includes("scale")) {
    return {
      concept: "비율은 비교하는 양을 기준량으로 나눈 값이며, 비 a:b, 분수 a/b, 소수, 백분율은 같은 양적 관계를 나타내는 서로 다른 표현입니다.",
      prompts: [
        "비교하는 양과 기준량을 구분하여 알맞은 비율 표현을 고르세요.",
        "비, 분수, 소수, 백분율의 동치 관계를 이용해 해결하세요.",
        "동일 비율 관계를 식으로 모델링하여 정답을 선택하세요.",
      ],
      steps: (problem, answerText) => [
        { label: "양의 분류", answer: `${problem.expression}에서 비교하는 양과 기준량을 구분합니다.`, hint: "기준량은 비율 계산의 분모 역할을 합니다." },
        { label: "관계식 모델링", answer: "비율 = 비교하는 양 ÷ 기준량 = 비교하는 양/기준량으로 나타냅니다.", hint: "백분율은 비율 × 100%입니다." },
        { label: "표현 변환", answer: `약분, 소수 변환, 백분율 변환을 거쳐 ${answerText}로 정리합니다.`, hint: "동치인 표현인지 확인합니다." },
      ],
    };
  }
  if (topicId.includes("band-graph") || topicId.includes("circle-graph") || topicId.includes("graph-") || topicId.includes("percent-to-angle")) {
    return {
      concept: "띠그래프와 원그래프는 전체를 100%로 정규화한 통계 표현이며, 각 항목의 백분율은 전체량에 대한 상대도수로 해석합니다.",
      prompts: [
        "자료의 전체량과 상대도수를 해석하여 알맞은 값을 고르세요.",
        "백분율, 수량, 중심각의 대응 관계를 이용해 해결하세요.",
        "통계 그래프의 비율 정보를 수학식으로 변환하세요.",
      ],
      steps: (problem, answerText) => [
        { label: "전체량 설정", answer: "그래프의 전체를 100% 또는 전체 도수로 설정합니다.", hint: "띠 전체와 원 전체가 기준량입니다." },
        { label: "상대도수 해석", answer: `${problem.expression}에서 필요한 항목의 백분율, 도수, 또는 중심각 조건을 읽습니다.`, hint: "백분율은 전체에 대한 비율입니다." },
        { label: "수량 변환", answer: `전체량 × 비율 또는 360° × 비율을 적용하여 ${answerText}를 얻습니다.`, hint: "차이는 %p 단위로 해석합니다." },
      ],
    };
  }
  if (topicId.includes("cuboid")) {
    return {
      concept: "직육면체의 겉넓이는 서로 합동인 세 쌍의 직사각형 넓이의 합이고, 부피는 밑면의 넓이와 높이의 곱으로 정의됩니다.",
      prompts: [
        "직육면체의 길이 조건을 공식에 대입하여 알맞은 값을 고르세요.",
        "겉넓이와 부피의 정의를 구분하여 해결하세요.",
        "단위 차원을 고려해 직육면체의 측정값을 선택하세요.",
      ],
      steps: (problem, answerText) => [
        { label: "치수 추출", answer: `${problem.expression}에서 가로, 세로, 높이 또는 부피 조건을 추출합니다.`, hint: "서로 수직인 세 모서리가 기준 치수입니다." },
        { label: "공식 적용", answer: "겉넓이 S=2(ab+bc+ca), 부피 V=abc 중 필요한 식을 적용합니다.", hint: "미지의 길이는 V ÷ 밑면의 넓이로 구합니다." },
        { label: "단위 차원 확인", answer: `계산값 ${answerText}의 단위가 길이, 넓이, 부피 중 무엇인지 확인합니다.`, hint: "넓이는 cm², 부피는 cm³입니다." },
      ],
    };
  }
  if (topicId.includes("prism") || topicId.includes("pyramid") || topicId.includes("solid-name")) {
    return {
      concept: "각기둥은 합동이고 평행한 두 밑면과 옆면으로 이루어진 다면체이고, 각뿔은 한 밑면과 한 꼭짓점에 모이는 삼각형 옆면으로 이루어진 다면체입니다.",
      prompts: [
        "다면체의 밑면과 옆면 구조를 분석하여 알맞은 값을 고르세요.",
        "각기둥과 각뿔의 구성 요소 사이의 규칙을 적용하세요.",
        "전개도와 입체도형의 면 대응을 근거로 판단하세요.",
      ],
      steps: (problem, answerText) => [
        { label: "밑면 차수 확인", answer: `${problem.expression}에서 밑면이 n각형인지 확인합니다.`, hint: "밑면의 변의 수를 n으로 둡니다." },
        { label: "구성 요소 공식화", answer: "각기둥은 면 n+2, 모서리 3n이고 각뿔은 면 n+1, 모서리 2n입니다.", hint: "전개도에서는 밑면과 옆면의 개수를 대응시킵니다." },
        { label: "도형 규칙 적용", answer: `밑면의 차수 n을 대입하면 ${answerText}입니다.`, hint: "각기둥과 각뿔의 공식을 구분합니다." },
      ],
    };
  }
  if (topicId.includes("fraction-divide") || topicId.includes("quotient-fraction") || topicId.includes("mixed-divide") || topicId.includes("natural-divide-fraction")) {
    return {
      concept: "분수의 나눗셈은 포함제와 등분제의 의미를 분수식으로 모델링하고, 제수의 역수를 곱하는 곱셈식으로 변환하여 계산합니다.",
      prompts: [
        "분수 나눗셈의 의미를 식으로 모델링하여 알맞은 몫을 고르세요.",
        "포함제 또는 등분제 상황을 분수 연산으로 변환하세요.",
        "역수 곱셈 알고리즘을 적용하여 정답을 선택하세요.",
      ],
      steps: (problem, answerText) => [
        { label: "연산 구조 분석", answer: `${problem.expression}에서 피제수와 제수를 구분하고 나눗셈의 의미를 해석합니다.`, hint: "전체량, 한 묶음의 양, 나누는 수를 구분합니다." },
        { label: "곱셈식 변환", answer: "분수로 나누는 경우 제수의 역수를 곱하고, 자연수로 나누는 경우 1/자연수를 곱합니다.", hint: "대분수는 가분수로 먼저 변환합니다." },
        { label: "약분 및 표준형", answer: `계산 결과를 기약분수 또는 대분수의 표준형으로 정리하면 ${answerText}입니다.`, hint: "공약수로 약분해 동치분수 중 가장 간단한 형태를 찾습니다." },
      ],
    };
  }
  return {
    concept: "문제의 조건을 수학식으로 구조화하고, 연산 순서와 단위 해석을 함께 검토하여 정답을 판별합니다.",
    prompts: [
      "주어진 조건을 수학식으로 모델링하여 알맞은 답을 고르세요.",
      "연산 구조와 단위 조건을 검토하여 정답을 선택하세요.",
      "풀이 과정의 논리적 타당성을 확인하며 답을 고르세요.",
    ],
    steps: (problem, answerText) => [
      { label: "조건의 수학화", answer: `${problem.expression}의 수량, 단위, 관계를 식으로 정리합니다.`, hint: "문장의 핵심 수량을 먼저 분리합니다." },
      { label: "연산 절차 적용", answer: "정의, 공식, 연산 순서에 따라 계산 과정을 전개합니다.", hint: "괄호, 곱셈과 나눗셈, 덧셈과 뺄셈의 순서를 확인합니다." },
      { label: "정답 판별", answer: `계산 결과와 조건을 대조하면 ${answerText}입니다.`, hint: "단위와 보기의 표현 형식까지 비교합니다." },
    ],
  };
}

function enrichG6ParkProblem(topicId: string, problem: Problem): Problem {
  if (!topicId.startsWith("g6-")) return problem;
  const profile = g6ParkFlowProfile(topicId);
  if (!profile) return problem;
  const answerText = answerDisplay(problem);
  const steps = problem.solutionSteps?.length ? problem.solutionSteps : profile.steps(problem, answerText);
  const enriched = {
    ...problem,
    prompt: choice(profile.prompts),
    conceptNote: problem.conceptNote ?? profile.concept,
    solutionSteps: steps,
    solution: numberedFlow(profile.concept, steps, problem.solution),
  };
  return toG6FourChoice(enriched, answerText);
}

// ── 1단원: 자연수의 혼합 계산 ────────────────────────────────

function genAddSub(): Problem {
  return sample<Problem>(() => {
    if (Math.random() < 0.5) {
      const a = randInt(15, 80);
      const b = randInt(8, 50);
      const c = randInt(5, a + b - 1);
      const r = a + b - c;
      if (r < 1 || r > 150) return null;
      return mkInteger(
        "addsub",
        "덧셈과 뺄셈이 섞인 식을 앞에서부터 계산하세요.",
        `${a} + ${b} − ${c}`,
        r,
        `${a} + ${b} − ${c} = ${a + b} − ${c} = ${r}입니다.`,
      );
    }
    const a = randInt(25, 90);
    const b = randInt(5, a - 1);
    const c = randInt(5, 60);
    const r = a - b + c;
    if (r < 1 || r > 150) return null;
    return mkInteger(
      "addsub",
      "덧셈과 뺄셈이 섞인 식을 앞에서부터 계산하세요.",
      `${a} − ${b} + ${c}`,
      r,
      `${a} − ${b} + ${c} = ${a - b} + ${c} = ${r}입니다.`,
    );
  }, mkInteger("addsub", "덧셈과 뺄셈이 섞인 식을 앞에서부터 계산하세요.", "14 + 37 − 23", 28, "14 + 37 − 23 = 51 − 23 = 28입니다."));
}

function genAddSubParen(): Problem {
  return sample<Problem>(() => {
    if (Math.random() < 0.5) {
      const b = randInt(5, 45);
      const c = randInt(5, 45);
      const a = b + c + randInt(2, 45);
      if (a > 120) return null;
      const r = a - (b + c);
      return mkInteger(
        "addsub-paren",
        "괄호가 있는 덧셈·뺄셈 식을 계산하세요.",
        `${a} − (${b} + ${c})`,
        r,
        `괄호 안을 먼저 계산하면 ${b} + ${c} = ${b + c}, ${a} − ${b + c} = ${r}입니다.`,
      );
    }
    const c = randInt(4, 35);
    const b = c + randInt(2, 45);
    const a = randInt(10, 70);
    const r = a + (b - c);
    if (r > 150) return null;
    return mkInteger(
      "addsub-paren",
      "괄호가 있는 덧셈·뺄셈 식을 계산하세요.",
      `${a} + (${b} − ${c})`,
      r,
      `괄호 안을 먼저 계산하면 ${b} − ${c} = ${b - c}, ${a} + ${b - c} = ${r}입니다.`,
    );
  }, mkInteger("addsub-paren", "괄호가 있는 덧셈·뺄셈 식을 계산하세요.", "68 − (25 + 27)", 16, "괄호 안을 먼저 계산하면 25 + 27 = 52, 68 − 52 = 16입니다."));
}

function genMulDiv(): Problem {
  return sample<Problem>(() => {
    if (Math.random() < 0.5) {
      const b = randInt(2, 12);
      const k = randInt(2, 12);
      const a = b * k;
      const c = randInt(2, 13);
      const r = k * c;
      return mkInteger(
        "muldiv",
        "곱셈과 나눗셈이 섞인 식을 앞에서부터 계산하세요.",
        `${a} ÷ ${b} × ${c}`,
        r,
        `${a} ÷ ${b} × ${c} = ${k} × ${c} = ${r}입니다.`,
      );
    }
    const c = randInt(2, 12);
    const p = randInt(2, 12);
    const a = c * p;
    const b = randInt(2, 13);
    const r = p * b;
    return mkInteger(
      "muldiv",
      "곱셈과 나눗셈이 섞인 식을 앞에서부터 계산하세요.",
      `${a} × ${b} ÷ ${c}`,
      r,
      `${a} × ${b} ÷ ${c} = ${a * b} ÷ ${c} = ${r}입니다.`,
    );
  }, mkInteger("muldiv", "곱셈과 나눗셈이 섞인 식을 앞에서부터 계산하세요.", "36 ÷ 12 × 13", 39, "36 ÷ 12 × 13 = 3 × 13 = 39입니다."));
}

function genMulDivParen(): Problem {
  return sample<Problem>(() => {
    if (Math.random() < 0.5) {
      const b = randInt(2, 8);
      const c = randInt(2, 8);
      const k = randInt(2, 12);
      const a = b * c * k;
      return mkInteger(
        "muldiv-paren",
        "괄호가 있는 곱셈·나눗셈 식을 계산하세요.",
        `${a} ÷ (${b} × ${c})`,
        k,
        `괄호 안을 먼저 계산하면 ${b} × ${c} = ${b * c}, ${a} ÷ ${b * c} = ${k}입니다.`,
      );
    }
    const c = randInt(2, 8);
    const q = randInt(2, 12);
    const b = c * q;
    const a = randInt(2, 12);
    const r = a * q;
    return mkInteger(
      "muldiv-paren",
      "괄호가 있는 곱셈·나눗셈 식을 계산하세요.",
      `${a} × (${b} ÷ ${c})`,
      r,
      `괄호 안을 먼저 계산하면 ${b} ÷ ${c} = ${q}, ${a} × ${q} = ${r}입니다.`,
    );
  }, mkInteger("muldiv-paren", "괄호가 있는 곱셈·나눗셈 식을 계산하세요.", "60 ÷ (4 × 3)", 5, "괄호 안을 먼저 계산하면 4 × 3 = 12, 60 ÷ 12 = 5입니다."));
}

function genFourMixBasic(): Problem {
  return sample<Problem>(() => {
    const kind = randInt(1, 4);
    if (kind === 1) {
      const b = randInt(2, 9);
      const c = randInt(2, 9);
      const d = randInt(2, 35);
      const a = randInt(b * c + 5, b * c + 70);
      const r = a - b * c + d;
      return mkInteger(
        "four-mix-basic",
        "곱셈·나눗셈을 먼저 계산한 뒤 사칙연산을 완성하세요.",
        `${a} − ${b} × ${c} + ${d}`,
        r,
        `${b} × ${c} = ${b * c}이므로 ${a} − ${b * c} + ${d} = ${r}입니다.`,
      );
    }
    if (kind === 2) {
      const c = randInt(2, 9);
      const q = randInt(2, 15);
      const b = c * q;
      const a = randInt(10, 80);
      const d = randInt(2, a + q - 1);
      const r = a + q - d;
      return mkInteger(
        "four-mix-basic",
        "곱셈·나눗셈을 먼저 계산한 뒤 사칙연산을 완성하세요.",
        `${a} + ${b} ÷ ${c} − ${d}`,
        r,
        `${b} ÷ ${c} = ${q}이므로 ${a} + ${q} − ${d} = ${r}입니다.`,
      );
    }
    if (kind === 3) {
      const b = randInt(2, 9);
      const c = randInt(2, 9);
      const a = randInt(5, 80);
      const r = a + b * c;
      return mkInteger(
        "four-mix-basic",
        "곱셈·나눗셈을 먼저 계산한 뒤 사칙연산을 완성하세요.",
        `${a} + ${b} × ${c}`,
        r,
        `${b} × ${c} = ${b * c}이므로 ${a} + ${b * c} = ${r}입니다.`,
      );
    }
    const c = randInt(2, 10);
    const q = randInt(2, 15);
    const b = c * q;
    const a = randInt(q + 5, 90);
    const r = a - q;
    return mkInteger(
      "four-mix-basic",
      "곱셈·나눗셈을 먼저 계산한 뒤 사칙연산을 완성하세요.",
      `${a} − ${b} ÷ ${c}`,
      r,
      `${b} ÷ ${c} = ${q}이므로 ${a} − ${q} = ${r}입니다.`,
    );
  }, mkInteger("four-mix-basic", "곱셈·나눗셈을 먼저 계산한 뒤 사칙연산을 완성하세요.", "37 − 2 × 6 + 27", 52, "2 × 6 = 12이므로 37 − 12 + 27 = 52입니다."));
}

function genFourMixParen(): Problem {
  return sample<Problem>(() => {
    const kind = randInt(1, 4);
    if (kind === 1) {
      const a = randInt(3, 18);
      const b = randInt(3, 18);
      const c = randInt(2, 7);
      const d = randInt(2, 50);
      const r = (a + b) * c - d;
      if (r < 1) return null;
      return mkInteger(
        "four-mix-paren",
        "괄호와 사칙연산이 섞인 식을 순서대로 계산하세요.",
        `(${a} + ${b}) × ${c} − ${d}`,
        r,
        `괄호 안 ${a + b}를 먼저 계산하고 ${a + b} × ${c} − ${d} = ${r}입니다.`,
      );
    }
    if (kind === 2) {
      const b = randInt(5, 20);
      const c = randInt(2, b - 1);
      const a = randInt(2, 10);
      const d = randInt(2, 45);
      const r = a * (b - c) + d;
      return mkInteger(
        "four-mix-paren",
        "괄호와 사칙연산이 섞인 식을 순서대로 계산하세요.",
        `${a} × (${b} − ${c}) + ${d}`,
        r,
        `괄호 안 ${b - c}를 먼저 계산하고 ${a} × ${b - c} + ${d} = ${r}입니다.`,
      );
    }
    if (kind === 3) {
      const b = randInt(2, 8);
      const c = randInt(2, 8);
      const k = randInt(2, 12);
      const a = (b + c) * k;
      const d = randInt(2, 9);
      const r = k * d;
      return mkInteger(
        "four-mix-paren",
        "괄호와 사칙연산이 섞인 식을 순서대로 계산하세요.",
        `${a} ÷ (${b} + ${c}) × ${d}`,
        r,
        `괄호 안 ${b + c}를 먼저 계산하고 ${a} ÷ ${b + c} × ${d} = ${r}입니다.`,
      );
    }
    const a = randInt(20, 90);
    const b = randInt(3, 30);
    const c = randInt(2, 12);
    const d = randInt(2, 8);
    const r = a - (b + c) * d;
    if (r < 1) return null;
    return mkInteger(
      "four-mix-paren",
      "괄호와 사칙연산이 섞인 식을 순서대로 계산하세요.",
      `${a} − (${b} + ${c}) × ${d}`,
      r,
      `괄호 안 ${b + c}를 먼저 계산하고 ${a} − ${b + c} × ${d} = ${r}입니다.`,
    );
  }, mkInteger("four-mix-paren", "괄호와 사칙연산이 섞인 식을 순서대로 계산하세요.", "5 × (5 + 9) − 30", 40, "괄호 안 14를 먼저 계산하고 5 × 14 − 30 = 40입니다."));
}

function genMissingOperatorChoice(): Problem {
  const a = randInt(12, 50);
  const b = randInt(4, 18);
  const c = randInt(2, 9);
  const ops = [
    { op: "+", value: a + b + c },
    { op: "−", value: a + b - c },
    { op: "×", value: a + b * c },
  ];
  if (b % c === 0) ops.push({ op: "÷", value: a + b / c });
  const picked = choice(ops);
  return mkChoice(
    "missing-operator-choice",
    "□ 안에 들어갈 알맞은 연산 기호를 고르세요.",
    `${a} + ${b} □ ${c} = ${picked.value}`,
    picked.op,
    ops.filter((op) => op.op !== picked.op).map((op) => op.op),
    `각 기호를 넣어 계산하면 ${picked.op}일 때만 ${picked.value}가 됩니다.`,
  );
}

function genReverseMixed(): Problem {
  const x = randInt(3, 25);
  const a = randInt(2, 9);
  const b = randInt(2, 30);
  const result = x * a + b;
  return mkInteger(
    "reverse-mixed",
    "거꾸로 계산하여 □에 들어갈 수를 구하세요.",
    `□ × ${a} + ${b} = ${result}`,
    x,
    `먼저 ${b}를 빼고 ${a}로 나눕니다. (${result} − ${b}) ÷ ${a} = ${x}입니다.`,
  );
}

// ── 2단원: 약수와 배수 ───────────────────────────────────────

function genFactors(): Problem {
  const n = randInt(12, 96);
  const ds = divisors(n);
  return {
    topicId: "factors",
    prompt: "다음 수의 약수를 모두 구하세요.",
    expression: `${n}`,
    hint: "작은 수부터 쉼표로 구분해 입력",
    answer: ds,
    kind: "numberSet",
    solution: `${n}의 약수는 ${ds.join(", ")}입니다.`,
  };
}

function genMultiples(): Problem {
  const n = randInt(2, 18);
  const ms = multiples(n, 5);
  return {
    topicId: "multiples",
    prompt: "다음 수의 배수를 작은 것부터 5개 구하세요.",
    expression: `${n}`,
    hint: "작은 수부터 쉼표로 구분해 입력",
    answer: ms,
    kind: "numberSet",
    solution: `${n}의 배수는 ${ms.join(", ")}입니다.`,
  };
}

function genFactorCount(): Problem {
  const n = randInt(12, 120);
  const ds = divisors(n);
  return mkInteger(
    "factor-count",
    "다음 수의 약수가 모두 몇 개인지 구하세요.",
    `${n}`,
    ds.length,
    `${n}의 약수는 ${ds.join(", ")}이므로 모두 ${ds.length}개입니다.`,
    "개수를 숫자로 입력",
  );
}

function genFactorMultipleChoice(): Problem {
  const a = randInt(2, 12);
  const b = a * randInt(2, 12);
  const answer = `${a}은 ${b}의 약수이고, ${b}은 ${a}의 배수입니다.`;
  return mkChoice(
    "factor-multiple-choice",
    "두 수 사이의 약수와 배수 관계를 바르게 설명한 것을 고르세요.",
    `${a} , ${b}`,
    answer,
    [
      `${a}은 ${b}의 배수이고, ${b}은 ${a}의 약수입니다.`,
      `${a}과 ${b}은 서로 약수도 배수도 아닙니다.`,
      `${b}은 ${a}보다 작으므로 약수가 될 수 없습니다.`,
    ],
    `${b} = ${a} × ${b / a}이므로 ${a}은 ${b}의 약수, ${b}은 ${a}의 배수입니다.`,
  );
}

function genCommonFactors(): Problem {
  return sample<Problem>(() => {
    const a = randInt(12, 80);
    const b = randInt(12, 80);
    const g = gcd(a, b);
    if (g < 2 || a === b) return null;
    const answer = divisors(g);
    return {
      topicId: "common-factors",
      prompt: "두 수의 공약수를 모두 구하세요.",
      expression: `${a} , ${b}`,
      hint: "작은 수부터 쉼표로 구분해 입력",
      answer,
      kind: "numberSet",
      solution: `${a}와 ${b}의 공약수는 최대공약수 ${g}의 약수와 같으므로 ${answer.join(", ")}입니다.`,
    };
  }, {
    topicId: "common-factors",
    prompt: "두 수의 공약수를 모두 구하세요.",
    expression: "48 , 36",
    hint: "작은 수부터 쉼표로 구분해 입력",
    answer: [1, 2, 3, 4, 6, 12],
    kind: "numberSet",
    solution: "48와 36의 공약수는 최대공약수 12의 약수와 같으므로 1, 2, 3, 4, 6, 12입니다.",
  });
}

function genCommonMultiples(): Problem {
  return sample<Problem>(() => {
    const a = randInt(3, 15);
    const b = randInt(3, 15);
    if (a === b) return null;
    const base = lcm(a, b);
    if (base > 120) return null;
    const answer = multiples(base, 3);
    return {
      topicId: "common-multiples",
      prompt: "두 수의 공배수를 작은 것부터 3개 구하세요.",
      expression: `${a} , ${b}`,
      hint: "작은 수부터 쉼표로 구분해 입력",
      answer,
      kind: "numberSet",
      solution: `${a}와 ${b}의 최소공배수는 ${base}이므로 공배수는 ${answer.join(", ")}입니다.`,
    };
  }, {
    topicId: "common-multiples",
    prompt: "두 수의 공배수를 작은 것부터 3개 구하세요.",
    expression: "8 , 14",
    hint: "작은 수부터 쉼표로 구분해 입력",
    answer: [56, 112, 168],
    kind: "numberSet",
    solution: "8과 14의 최소공배수는 56이므로 공배수는 56, 112, 168입니다.",
  });
}

function genGcd(): Problem {
  return sample<Problem>(() => {
    const a = randInt(12, 90);
    const b = randInt(12, 90);
    const g = gcd(a, b);
    if (a === b || g < 2) return null;
    return mkInteger(
      "gcd",
      "두 수의 최대공약수를 구하세요.",
      `${a} , ${b}`,
      g,
      `${a}와 ${b}의 공약수 중 가장 큰 수는 ${g}입니다.`,
    );
  }, mkInteger("gcd", "두 수의 최대공약수를 구하세요.", "48 , 36", 12, "48와 36의 공약수 중 가장 큰 수는 12입니다."));
}

function genLcm(): Problem {
  return sample<Problem>(() => {
    const a = randInt(4, 30);
    const b = randInt(4, 30);
    const value = lcm(a, b);
    if (a === b || value > 500) return null;
    return mkInteger(
      "lcm",
      "두 수의 최소공배수를 구하세요.",
      `${a} , ${b}`,
      value,
      `${a}와 ${b}의 공배수 중 가장 작은 수는 ${value}입니다.`,
    );
  }, mkInteger("lcm", "두 수의 최소공배수를 구하세요.", "8 , 14", 56, "8과 14의 공배수 중 가장 작은 수는 56입니다."));
}

function genGcdWord(): Problem {
  return sample<Problem>(() => {
    const g = choice([3, 4, 5, 6, 8, 10, 12]);
    const a = g * randInt(4, 12);
    const b = g * randInt(4, 12);
    const answer = gcd(a, b);
    if (answer !== g || a === b) return null;
    return mkInteger(
      "gcd-word",
      "두 물건을 똑같이 나누어 담을 수 있는 가장 많은 봉지 수를 구하세요.",
      `사과 ${a}개와 배 ${b}개를 남김없이 똑같이 나누어 담기`,
      answer,
      `가장 많은 봉지 수는 ${a}와 ${b}의 최대공약수 ${answer}입니다.`,
      "봉지 수를 숫자로 입력",
    );
  }, mkInteger("gcd-word", "두 물건을 똑같이 나누어 담을 수 있는 가장 많은 봉지 수를 구하세요.", "사과 48개와 배 36개를 남김없이 똑같이 나누어 담기", 12, "가장 많은 봉지 수는 48과 36의 최대공약수 12입니다.", "봉지 수를 숫자로 입력"));
}

function genLcmWord(): Problem {
  return sample<Problem>(() => {
    const a = randInt(6, 18);
    const b = randInt(6, 18);
    const answer = lcm(a, b);
    if (a === b || answer > 180) return null;
    return mkInteger(
      "lcm-word",
      "두 일이 다시 동시에 일어나는 시간을 구하세요.",
      `${a}분마다 출발하는 버스와 ${b}분마다 출발하는 버스가 동시에 출발했습니다.\n다시 동시에 출발하는 때가 몇 분 후인지 구하세요.`,
      answer,
      `다시 동시에 일어나는 시간은 ${a}와 ${b}의 최소공배수 ${answer}분 후입니다.`,
      "분 수를 숫자로 입력",
    );
  }, mkInteger("lcm-word", "두 일이 다시 동시에 일어나는 시간을 구하세요.", "18분마다 출발하는 버스와 24분마다 출발하는 버스가 동시에 출발했습니다.\n다시 동시에 출발하는 때가 몇 분 후인지 구하세요.", 72, "다시 동시에 일어나는 시간은 18과 24의 최소공배수 72분 후입니다.", "분 수를 숫자로 입력"));
}

// ── 3단원: 대응 관계 ─────────────────────────────────────────

const rateContexts = [
  { left: "달걀판", leftUnit: "판", right: "달걀", rightUnit: "개", rate: 10, x: "○", y: "☆" },
  { left: "젤리 봉지", leftUnit: "봉지", right: "젤리", rightUnit: "개", rate: 15, x: "□", y: "△" },
  { left: "수영 시간", leftUnit: "분", right: "소모 열량", rightUnit: "kcal", rate: 9, x: "☆", y: "○" },
  { left: "걸린 시간", leftUnit: "시간", right: "이동 거리", rightUnit: "km", rate: 80, x: "△", y: "□" },
  { left: "거미", leftUnit: "마리", right: "다리", rightUnit: "개", rate: 8, x: "◇", y: "○" },
];

const offsetContexts = [
  { left: "사진", leftUnit: "장", right: "집게", rightUnit: "개", offset: 1, x: "○", y: "☆" },
  { left: "노란 사각형", leftUnit: "개", right: "파란 사각형", rightUnit: "개", offset: 2, x: "□", y: "△" },
  { left: "사각형", leftUnit: "개", right: "삼각형", rightUnit: "개", offset: 1, x: "△", y: "□" },
  { left: "동생이 모은 돈", leftUnit: "원", right: "누나가 모은 돈", rightUnit: "원", offset: 1500, x: "◇", y: "☆" },
  { left: "민서의 나이", leftUnit: "세", right: "연도", rightUnit: "년", offset: 2014, x: "♡", y: "☆" },
];

function genRateValue(): Problem {
  const c = choice(rateContexts);
  const x = randInt(2, 12);
  const y = x * c.rate;
  if (Math.random() < 0.55) {
    return mkInteger(
      "rate-value",
      `${c.left}의 수와 ${c.right}의 수 사이의 대응 관계를 이용하세요.`,
      `${c.left} 1${c.leftUnit} → ${c.right} ${c.rate}${c.rightUnit}\n${c.left} ${x}${c.leftUnit}일 때 ${c.right}의 값을 구하세요.`,
      y,
      `${c.right}은 ${c.left}의 ${c.rate}배이므로 ${x} × ${c.rate} = ${y}입니다.`,
    );
  }
  return mkInteger(
    "rate-value",
    `${c.left}의 수와 ${c.right}의 수 사이의 대응 관계를 거꾸로 이용하세요.`,
    `${c.left} 1${c.leftUnit} → ${c.right} ${c.rate}${c.rightUnit}\n${c.right} ${y}${c.rightUnit}일 때 ${c.left}의 값을 구하세요.`,
    x,
    `${c.left}은 ${c.right}을 ${c.rate}로 나눈 것과 같으므로 ${y} ÷ ${c.rate} = ${x}입니다.`,
  );
}

function genOffsetValue(): Problem {
  const c = choice(offsetContexts);
  const x = c.offset > 100 ? randInt(1, 6) * 1500 : randInt(4, 24);
  const y = x + c.offset;
  if (Math.random() < 0.6) {
    return mkInteger(
      "offset-value",
      `늘어나는 양이 일정한 대응 관계를 이용하세요.`,
      `${c.right}은 ${c.left}보다 ${c.offset}${c.rightUnit} 많습니다.\n${c.left} ${x}${c.leftUnit}일 때 ${c.right}의 값을 구하세요.`,
      y,
      `${c.right} = ${c.left} + ${c.offset}이므로 ${x} + ${c.offset} = ${y}입니다.`,
    );
  }
  return mkInteger(
    "offset-value",
    `두 양의 차가 일정한 대응 관계를 거꾸로 이용하세요.`,
    `${c.right}은 ${c.left}보다 ${c.offset}${c.rightUnit} 많습니다.\n${c.right} ${y}${c.rightUnit}일 때 ${c.left}의 값을 구하세요.`,
    x,
    `${c.left} = ${c.right} - ${c.offset}이므로 ${y} - ${c.offset} = ${x}입니다.`,
  );
}

function genTableMissing(): Problem {
  const useRate = Math.random() < 0.55;
  if (useRate) {
    const c = choice(rateContexts);
    const missingX = randInt(4, 9);
    const rowX = [1, 2, missingX, missingX + 2].join("  |  ");
    const rowY = [c.rate, c.rate * 2, "□", c.rate * (missingX + 2)].join("  |  ");
    const answer = missingX * c.rate;
    return withVisual(
      mkInteger(
        "table-missing",
        "표에서 빠진 값을 구하세요.",
        `${c.left}(${c.leftUnit})  ${rowX}\n${c.right}(${c.rightUnit})  ${rowY}`,
        answer,
        `${c.right}은 ${c.left}의 ${c.rate}배입니다. 따라서 ${missingX} × ${c.rate} = ${answer}입니다.`,
      ),
      {
        type: "data-table",
        headers: ["", "1", "2", String(missingX), String(missingX + 2)],
        rows: [[`${c.left}(${c.leftUnit})`, 1, 2, missingX, missingX + 2], [`${c.right}(${c.rightUnit})`, c.rate, c.rate * 2, "□", c.rate * (missingX + 2)]],
        caption: "대응 관계 표",
      },
    );
  }

  const c = choice(offsetContexts.filter((v) => v.offset < 20));
  const missingX = randInt(4, 12);
  const rowX = [1, 2, 3, missingX].join("  |  ");
  const rowY = [1 + c.offset, 2 + c.offset, 3 + c.offset, "□"].join("  |  ");
  const answer = missingX + c.offset;
  return withVisual(
    mkInteger(
      "table-missing",
      "표에서 빠진 값을 구하세요.",
      `${c.left}(${c.leftUnit})  ${rowX}\n${c.right}(${c.rightUnit})  ${rowY}`,
      answer,
      `${c.right}은 ${c.left}에 ${c.offset}을 더한 것과 같으므로 ${missingX} + ${c.offset} = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      headers: ["", "1", "2", "3", String(missingX)],
      rows: [[`${c.left}(${c.leftUnit})`, 1, 2, 3, missingX], [`${c.right}(${c.rightUnit})`, 1 + c.offset, 2 + c.offset, 3 + c.offset, "□"]],
      caption: "대응 관계 표",
    },
  );
}

function genFormulaChoice(): Problem {
  if (Math.random() < 0.55) {
    const c = choice(rateContexts);
    const answer = `${c.y} = ${c.x} × ${c.rate}`;
    return mkChoice(
      "formula-choice",
      "두 양 사이의 대응 관계를 식으로 나타낸 것을 고르세요.",
      `${c.x}: ${c.left}의 수, ${c.y}: ${c.right}의 수\n${c.left} 1${c.leftUnit}마다 ${c.right} ${c.rate}${c.rightUnit}`,
      answer,
      [`${c.x} = ${c.y} × ${c.rate}`, `${c.y} = ${c.x} + ${c.rate}`, `${c.y} = ${c.x} ÷ ${c.rate}`],
      `${c.right}은 ${c.left}의 ${c.rate}배이므로 ${answer}입니다.`,
    );
  }

  const c = choice(offsetContexts);
  const answer = `${c.y} = ${c.x} + ${c.offset}`;
  return mkChoice(
    "formula-choice",
    "두 양 사이의 대응 관계를 식으로 나타낸 것을 고르세요.",
    `${c.x}: ${c.left}, ${c.y}: ${c.right}\n${c.right}은 ${c.left}보다 ${c.offset}만큼 많음`,
    answer,
    [`${c.y} = ${c.x} × ${c.offset}`, `${c.x} = ${c.y} + ${c.offset}`, `${c.y} = ${c.x} - ${c.offset}`],
    `${c.right}은 ${c.left}에 ${c.offset}을 더한 것이므로 ${answer}입니다.`,
  );
}

function genPatternBridge(): Problem {
  const step = choice([2, 3, 4, 5, 6]);
  const x = randInt(6, 18);
  const y = x * step;
  return mkInteger(
    "pattern-bridge",
    "규칙적인 배열의 대응 관계를 찾아 적용하세요.",
    `도형 한 묶음을 늘릴 때마다 작은 조각이 ${step}개씩 늘어납니다.\n묶음이 ${x}개일 때 작은 조각의 개수를 구하세요.`,
    y,
    `묶음의 수와 작은 조각의 수는 ${step}배 관계입니다. ${x} × ${step} = ${y}입니다.`,
  );
}

function genRateTableReverse(): Problem {
  const c = choice(rateContexts);
  const x = randInt(4, 12);
  const y = x * c.rate;
  const rowX = [1, 2, "□", x + 2].join("  |  ");
  const rowY = [c.rate, c.rate * 2, y, (x + 2) * c.rate].join("  |  ");
  return withVisual(
    mkInteger(
      "rate-table-reverse",
      "표의 대응 관계를 이용해 빠진 왼쪽 값을 구하세요.",
      `${c.left}(${c.leftUnit})  ${rowX}\n${c.right}(${c.rightUnit})  ${rowY}`,
      x,
      `${c.right}은 ${c.left}의 ${c.rate}배입니다. 따라서 ${y} ÷ ${c.rate} = ${x}입니다.`,
    ),
    {
      type: "data-table",
      headers: ["", "1", "2", "□", String(x + 2)],
      rows: [[`${c.left}(${c.leftUnit})`, 1, 2, "□", x + 2], [`${c.right}(${c.rightUnit})`, c.rate, c.rate * 2, y, (x + 2) * c.rate]],
      caption: "거꾸로 찾는 대응 표",
    },
  );
}

function genFormulaMissingNumber(): Problem {
  if (Math.random() < 0.55) {
    const c = choice(rateContexts);
    return mkInteger(
      "formula-missing-number",
      "대응 관계식의 빈칸에 들어갈 수를 구하세요.",
      `${c.x}: ${c.left}의 수, ${c.y}: ${c.right}의 수\n${c.y} = ${c.x} × □`,
      c.rate,
      `${c.right}은 ${c.left}의 ${c.rate}배이므로 빈칸은 ${c.rate}입니다.`,
    );
  }

  const c = choice(offsetContexts);
  return mkInteger(
    "formula-missing-number",
    "대응 관계식의 빈칸에 들어갈 수를 구하세요.",
    `${c.x}: ${c.left}, ${c.y}: ${c.right}\n${c.y} = ${c.x} + □`,
    c.offset,
    `${c.right}은 ${c.left}보다 ${c.offset}만큼 많으므로 빈칸은 ${c.offset}입니다.`,
  );
}

function genRelationSentenceChoice(): Problem {
  if (Math.random() < 0.55) {
    const c = choice(rateContexts);
    const answer = `${c.right}은 ${c.left}의 ${c.rate}배입니다.`;
    return mkChoice(
      "relation-sentence-choice",
      "상황에 맞는 대응 관계 설명을 고르세요.",
      `${c.left} 3${c.leftUnit}일 때 ${c.right} ${3 * c.rate}${c.rightUnit}, ${c.left} 5${c.leftUnit}일 때 ${c.right} ${5 * c.rate}${c.rightUnit}`,
      answer,
      [
        `${c.right}은 ${c.left}보다 ${c.rate}만큼 많습니다.`,
        `${c.left}은 ${c.right}의 ${c.rate}배입니다.`,
        `${c.right}은 ${c.left}를 ${c.rate}로 나눈 것과 같습니다.`,
      ],
      `오른쪽 값이 왼쪽 값에 항상 ${c.rate}를 곱한 값입니다.`,
    );
  }

  const c = choice(offsetContexts.filter((v) => v.offset < 20));
  const answer = `${c.right}은 ${c.left}보다 ${c.offset}만큼 많습니다.`;
  return mkChoice(
    "relation-sentence-choice",
    "상황에 맞는 대응 관계 설명을 고르세요.",
    `${c.left} 3${c.leftUnit}일 때 ${c.right} ${3 + c.offset}${c.rightUnit}, ${c.left} 8${c.leftUnit}일 때 ${c.right} ${8 + c.offset}${c.rightUnit}`,
    answer,
    [
      `${c.right}은 ${c.left}의 ${c.offset}배입니다.`,
      `${c.left}은 ${c.right}보다 ${c.offset}만큼 많습니다.`,
      `${c.right}은 ${c.left}를 ${c.offset}로 나눈 것과 같습니다.`,
    ],
    `오른쪽 값에서 왼쪽 값을 빼면 항상 ${c.offset}입니다.`,
  );
}

function genTwoStepRelation(): Problem {
  const base = choice([500, 1000, 1500, 2000]);
  const rate = choice([300, 500, 700, 1200]);
  const x = randInt(3, 12);
  const y = base + rate * x;
  if (Math.random() < 0.6) {
    return mkInteger(
      "two-step-relation",
      "기본값이 있는 대응 관계를 계산하세요.",
      `체험 학습비는 기본 준비금 ${base}원에 학생 1명당 ${rate}원을 더합니다.\n학생이 ${x}명일 때 전체 금액을 구하세요.`,
      y,
      `${base} + ${rate} × ${x} = ${y}입니다.`,
    );
  }
  return mkInteger(
    "two-step-relation",
    "기본값이 있는 대응 관계를 거꾸로 계산하세요.",
    `전체 금액은 기본 준비금 ${base}원에 학생 1명당 ${rate}원을 더한 값입니다.\n전체가 ${y}원일 때 학생 수를 구하세요.`,
    x,
    `먼저 기본 준비금 ${base}원을 빼고 ${rate}로 나눕니다. (${y} - ${base}) ÷ ${rate} = ${x}입니다.`,
  );
}

function genTableRowChoice(): Problem {
  const c = choice(rateContexts);
  const xs = [1, 2, 3, 4, 5];
  const answer = xs.map((x) => x * c.rate).join(", ");
  const distractors = [
    xs.map((x) => x + c.rate).join(", "),
    xs.map((x) => x * (c.rate + 1)).join(", "),
    xs.map((x) => Math.max(1, x * c.rate - c.rate)).join(", "),
  ];
  return withVisual(
    mkChoice(
      "table-row-choice",
      "표의 아랫줄에 들어갈 값을 순서대로 고르세요.",
      `${c.left}(${c.leftUnit})  1  |  2  |  3  |  4  |  5\n${c.right}(${c.rightUnit})  □  |  □  |  □  |  □  |  □`,
      answer,
      distractors,
      `${c.right}은 ${c.left}의 ${c.rate}배이므로 ${answer} 순서입니다.`,
    ),
    {
      type: "data-table",
      headers: ["", "1", "2", "3", "4", "5"],
      rows: [[`${c.left}(${c.leftUnit})`, 1, 2, 3, 4, 5], [`${c.right}(${c.rightUnit})`, "□", "□", "□", "□", "□"]],
      caption: "아랫줄을 완성하는 표",
    },
  );
}

// ── 4단원: 약분과 통분 ───────────────────────────────────────

function genEquivalentFraction(): Problem {
  const base = properFraction(9);
  const factor = randInt(2, 8);
  const answer = makeFrac(base.n * factor, base.d * factor);
  return {
    topicId: "equivalent-fraction",
    prompt: "크기가 같은 분수가 되도록 빈칸에 알맞은 분수를 쓰세요.",
    expression: `${fracText(base)} = □/${answer.d}`,
    hint: `분모가 ${answer.d}인 분수로 입력 (예: ${answer.n}/${answer.d})`,
    answer,
    kind: "fraction",
    requireDenominator: answer.d,
    answerText: fracText(answer),
    solution: `분모 ${base.d}에 ${factor}를 곱해 ${answer.d}가 되었으므로 분자도 ${factor}를 곱합니다. ${base.n} × ${factor} = ${answer.n}`,
  };
}

function genEquivalentFractionChoice(): Problem {
  const base = properFraction(10);
  const factor = randInt(2, 8);
  const answer = fracText(makeFrac(base.n * factor, base.d * factor));
  const distractors = [
    fracText(makeFrac(base.n + factor, base.d * factor)),
    fracText(makeFrac(base.n * factor, base.d + factor)),
    fracText(makeFrac(base.n + 1, base.d + 1)),
  ];
  return mkChoice(
    "equivalent-fraction-choice",
    "크기가 같은 분수를 고르세요.",
    fracText(base),
    answer,
    distractors,
    `분모와 분자에 같은 수 ${factor}를 곱하면 ${answer}입니다.`,
  );
}

function genMissingMultiplier(): Problem {
  const base = properFraction(9);
  const factor = randInt(2, 9);
  const scaled = makeFrac(base.n * factor, base.d * factor);
  return mkInteger(
    "missing-multiplier",
    "크기가 같은 분수를 만들 때 곱한 수를 구하세요.",
    `${fracText(base)} = ${scaled.n}/${scaled.d}\n분모와 분자에 각각 □를 곱했습니다.`,
    factor,
    `${base.n} × ${factor} = ${scaled.n}, ${base.d} × ${factor} = ${scaled.d}이므로 □ = ${factor}입니다.`,
  );
}

function genReduceFraction(): Problem {
  const base = properFraction(11);
  const factor = randInt(2, 9);
  const given = makeFrac(base.n * factor, base.d * factor);
  return {
    topicId: "reduce-fraction",
    prompt: "다음 분수를 기약분수로 나타내세요.",
    expression: fracText(given),
    hint: "기약분수로 입력 (예: 3/5)",
    answer: base,
    kind: "fraction",
    requireReduced: true,
    answerText: formatFrac(base),
    solution: `분모와 분자를 공약수 ${factor}로 나누면 ${fracText(given)} = ${formatFrac(base)}입니다.`,
  };
}

function genReduceByGivenDivisor(): Problem {
  return sample<Problem>(() => {
    const base = properFraction(12);
    const factorA = randInt(2, 5);
    const factorB = randInt(2, 5);
    const given = makeFrac(base.n * factorA * factorB, base.d * factorA * factorB);
    const divisor = choice([factorA, factorB, factorA * factorB]);
    if (given.n % divisor !== 0 || given.d % divisor !== 0) return null;
    const answer = makeFrac(given.n / divisor, given.d / divisor);
    return {
      topicId: "reduce-by-given-divisor",
      prompt: `분모와 분자를 ${divisor}로 나누어 약분하세요.`,
      expression: fracText(given),
      hint: `약분한 결과를 분모 ${answer.d}로 입력`,
      answer,
      kind: "fraction",
      requireDenominator: answer.d,
      answerText: fracText(answer),
      solution: `${given.n} ÷ ${divisor} = ${answer.n}, ${given.d} ÷ ${divisor} = ${answer.d}이므로 ${fracText(answer)}입니다.`,
    };
  }, {
    topicId: "reduce-by-given-divisor",
    prompt: "분모와 분자를 3으로 나누어 약분하세요.",
    expression: "12/18",
    hint: "약분한 결과를 분모 6으로 입력",
    answer: makeFrac(4, 6),
    kind: "fraction",
    requireDenominator: 6,
    answerText: "4/6",
    solution: "12 ÷ 3 = 4, 18 ÷ 3 = 6이므로 4/6입니다.",
  });
}

function genAllReductionsChoice(): Problem {
  return sample<Problem>(() => {
    const base = properFraction(12);
    const factor = randInt(3, 9);
    const given = makeFrac(base.n * factor, base.d * factor);
    const common = divisors(gcd(given.n, given.d)).filter((d) => d > 1);
    if (common.length < 2) return null;
    const answer = common.map((d) => fracText(makeFrac(given.n / d, given.d / d))).join(", ");
    const distractors = [
      common.map((d) => fracText(makeFrac(given.n / d + 1, given.d / d))).join(", "),
      common.slice(0, -1).map((d) => fracText(makeFrac(given.n / d, given.d / d))).join(", "),
      common.map((d) => fracText(makeFrac(given.n / d, given.d / d + 1))).join(", "),
    ].filter(Boolean);
    return mkChoice(
      "all-reductions-choice",
      "약분한 분수를 모두 바르게 쓴 것을 고르세요.",
      fracText(given),
      answer,
      distractors,
      `${given.n}과 ${given.d}의 1이 아닌 공약수는 ${common.join(", ")}입니다.`,
    );
  }, mkChoice(
    "all-reductions-choice",
    "약분한 분수를 모두 바르게 쓴 것을 고르세요.",
    "12/18",
    "6/9, 4/6, 2/3",
    ["6/8, 4/6, 2/3", "6/9, 4/6", "5/9, 4/6, 2/3"],
    "12와 18의 1이 아닌 공약수는 2, 3, 6입니다.",
  ));
}

function genCommonDenominatorProduct(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(9);
    const b = properFraction(9);
    if (a.d === b.d) return null;
    const cd = a.d * b.d;
    const answer: [Frac, Frac] = [scaledFrac(a, cd), scaledFrac(b, cd)];
    return {
      topicId: "common-denominator-product",
      prompt: "두 분모의 곱을 공통분모로 하여 통분하세요.",
      expression: `{ ${fracText(a)} , ${fracText(b)} }`,
      hint: `두 분수를 쉼표로 입력 (공통분모 ${cd})`,
      answer,
      commonDenominator: cd,
      kind: "fractionPair",
      answerText: `${fracText(answer[0])}, ${fracText(answer[1])}`,
      solution: `공통분모를 ${a.d} × ${b.d} = ${cd}로 잡으면 ${fracText(a)} = ${fracText(answer[0])}, ${fracText(b)} = ${fracText(answer[1])}입니다.`,
    };
  }, {
    topicId: "common-denominator-product",
    prompt: "두 분모의 곱을 공통분모로 하여 통분하세요.",
    expression: "{ 1/3 , 3/4 }",
    hint: "두 분수를 쉼표로 입력 (공통분모 12)",
    answer: [makeFrac(4, 12), makeFrac(9, 12)],
    commonDenominator: 12,
    kind: "fractionPair",
    answerText: "4/12, 9/12",
    solution: "공통분모를 3 × 4 = 12로 잡으면 1/3 = 4/12, 3/4 = 9/12입니다.",
  });
}

function genCommonDenominatorLcm(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(15);
    const b = properFraction(15);
    if (a.d === b.d) return null;
    const cd = fracLcm(a.d, b.d);
    if (cd > 90) return null;
    const answer: [Frac, Frac] = [scaledFrac(a, cd), scaledFrac(b, cd)];
    return {
      topicId: "common-denominator-lcm",
      prompt: "두 분모의 최소공배수를 공통분모로 하여 통분하세요.",
      expression: `{ ${fracText(a)} , ${fracText(b)} }`,
      hint: `두 분수를 쉼표로 입력 (공통분모 ${cd})`,
      answer,
      commonDenominator: cd,
      kind: "fractionPair",
      answerText: `${fracText(answer[0])}, ${fracText(answer[1])}`,
      solution: `${a.d}와 ${b.d}의 최소공배수는 ${cd}입니다. 따라서 ${fracText(answer[0])}, ${fracText(answer[1])}로 통분합니다.`,
    };
  }, {
    topicId: "common-denominator-lcm",
    prompt: "두 분모의 최소공배수를 공통분모로 하여 통분하세요.",
    expression: "{ 5/6 , 3/4 }",
    hint: "두 분수를 쉼표로 입력 (공통분모 12)",
    answer: [makeFrac(10, 12), makeFrac(9, 12)],
    commonDenominator: 12,
    kind: "fractionPair",
    answerText: "10/12, 9/12",
    solution: "6과 4의 최소공배수는 12입니다. 따라서 5/6 = 10/12, 3/4 = 9/12입니다.",
  });
}

function genCommonDenominatorMissingNumerator(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(12);
    const b = properFraction(12);
    if (a.d === b.d) return null;
    const cd = Math.random() < 0.5 ? a.d * b.d : fracLcm(a.d, b.d);
    if (cd > 120) return null;
    const first = scaledFrac(a, cd);
    const second = scaledFrac(b, cd);
    const askFirst = Math.random() < 0.5;
    return mkInteger(
      "common-denominator-missing-numerator",
      "통분한 분수의 빠진 분자를 구하세요.",
      askFirst
        ? `{ ${fracText(a)} , ${fracText(b)} } → { □/${cd} , ${fracText(second)} }`
        : `{ ${fracText(a)} , ${fracText(b)} } → { ${fracText(first)} , □/${cd} }`,
      askFirst ? first.n : second.n,
      askFirst
        ? `${fracText(a)}의 분모 ${a.d}에 ${cd / a.d}를 곱해 ${cd}가 되었으므로 분자는 ${a.n} × ${cd / a.d} = ${first.n}입니다.`
        : `${fracText(b)}의 분모 ${b.d}에 ${cd / b.d}를 곱해 ${cd}가 되었으므로 분자는 ${b.n} × ${cd / b.d} = ${second.n}입니다.`,
    );
  }, mkInteger(
    "common-denominator-missing-numerator",
    "통분한 분수의 빠진 분자를 구하세요.",
    "{ 1/3 , 3/4 } → { □/12 , 9/12 }",
    4,
    "1/3의 분모 3에 4를 곱해 12가 되었으므로 분자는 1 × 4 = 4입니다.",
  ));
}

function genCompareFractions(): Problem {
  return sample<Problem>(() => {
    const a = mixedOrProperFraction();
    const b = mixedOrProperFraction();
    if (a.n === b.n && a.d === b.d) return null;
    const sign = compareSign(fracVal(a), fracVal(b));
    const cd = lcm(a.d, b.d);
    return {
      topicId: "compare-fractions",
      prompt: "두 분수의 크기를 비교하여 >, =, < 중 알맞은 기호를 입력하세요.",
      expression: `${formatFrac(a)}  □  ${formatFrac(b)}`,
      hint: ">, =, < 중 하나 입력",
      answer: sign,
      kind: "compare",
      solution: `공통분모 ${cd}로 통분하면 ${formatFrac(a)}는 ${scaledFrac(a, cd).n}/${cd}, ${formatFrac(b)}는 ${scaledFrac(b, cd).n}/${cd}입니다.`,
    };
  }, {
    topicId: "compare-fractions",
    prompt: "두 분수의 크기를 비교하여 >, =, < 중 알맞은 기호를 입력하세요.",
    expression: "4/5  □  5/6",
    hint: ">, =, < 중 하나 입력",
    answer: "<",
    kind: "compare",
    solution: "공통분모 30으로 통분하면 4/5 = 24/30, 5/6 = 25/30이므로 < 입니다.",
  });
}

function genCompareReducedFractions(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(10);
    const b = properFraction(10);
    if (fracEq(a, b)) return null;
    const fa = randInt(2, 7);
    const fb = randInt(2, 7);
    const ra = makeFrac(a.n * fa, a.d * fa);
    const rb = makeFrac(b.n * fb, b.d * fb);
    const sign = compareSign(fracVal(a), fracVal(b));
    return {
      topicId: "compare-reduced-fractions",
      prompt: "두 분수를 약분한 뒤 크기를 비교하세요.",
      expression: `${fracText(ra)}  □  ${fracText(rb)}`,
      hint: ">, =, < 중 하나 입력",
      answer: sign,
      kind: "compare",
      solution: `${fracText(ra)} = ${formatFrac(a)}, ${fracText(rb)} = ${formatFrac(b)}이므로 ${sign}입니다.`,
    };
  }, {
    topicId: "compare-reduced-fractions",
    prompt: "두 분수를 약분한 뒤 크기를 비교하세요.",
    expression: "8/20  □  15/30",
    hint: ">, =, < 중 하나 입력",
    answer: "<",
    kind: "compare",
    solution: "8/20 = 2/5, 15/30 = 1/2이므로 < 입니다.",
  });
}

function genOrderThreeFractions(): Problem {
  return sample<Problem>(() => {
    const fractions = [properFraction(12), properFraction(12), properFraction(12)];
    const labels = fractions.map(formatFrac);
    if (new Set(labels).size !== 3) return null;
    const sorted = [...fractions].sort((a, b) => fracVal(a) - fracVal(b));
    const answer = sorted.map(formatFrac).join(" < ");
    const distractors = [
      [...sorted].reverse().map(formatFrac).join(" < "),
      [sorted[1], sorted[0], sorted[2]].map(formatFrac).join(" < "),
      [sorted[0], sorted[2], sorted[1]].map(formatFrac).join(" < "),
    ];
    return mkChoice(
      "order-three-fractions",
      "세 분수를 작은 것부터 차례대로 나열한 것을 고르세요.",
      labels.join(" , "),
      answer,
      distractors,
      `값을 비교하면 ${answer} 순서입니다.`,
    );
  }, mkChoice(
    "order-three-fractions",
    "세 분수를 작은 것부터 차례대로 나열한 것을 고르세요.",
    "1/4 , 1/6 , 3/8",
    "1/6 < 1/4 < 3/8",
    ["3/8 < 1/4 < 1/6", "1/4 < 1/6 < 3/8", "1/6 < 3/8 < 1/4"],
    "공통분모 24로 보면 4/24 < 6/24 < 9/24입니다.",
  ));
}

function genFractionDecimalConvertChoice(): Problem {
  const denominators = [2, 4, 5, 10, 20, 25, 50];
  const d = choice(denominators);
  const n = randInt(1, d * 2 - 1);
  const f = reduceFrac(makeFrac(n, d));
  const value = fracVal(f);
  const answer = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0$/, "");
  const distractors = shuffle([
    (value + 0.1).toFixed(2).replace(/0$/, ""),
    Math.max(0, value - 0.1).toFixed(2).replace(/0$/, ""),
    (f.n / 10).toFixed(2).replace(/0$/, ""),
    (f.d / 10).toFixed(2).replace(/0$/, ""),
  ]).filter((v) => v !== answer);
  return mkChoice(
    "fraction-decimal-convert-choice",
    "분수를 소수로 나타낸 것을 고르세요.",
    formatFrac(f),
    answer,
    distractors,
    `${formatFrac(f)} = ${answer}입니다.`,
  );
}

function genFractionDecimalCompare(): Problem {
  const denominators = [2, 4, 5, 10, 20, 25, 50];
  return sample<Problem>(() => {
    const d = choice(denominators);
    const n = randInt(1, d * 3 - 1);
    const frac = reduceFrac(makeFrac(n, d));
    const decimal = choice([0.15, 0.25, 0.3, 0.4, 0.5, 0.6, 0.65, 0.7, 0.75, 0.9, 1.15, 1.24, 1.6, 2.3, 2.5]);
    if (Math.abs(fracVal(frac) - decimal) < 0.001) return null;
    const flip = Math.random() < 0.5;
    const left = flip ? decimal : fracVal(frac);
    const right = flip ? fracVal(frac) : decimal;
    const sign = compareSign(left, right);
    const leftText = flip ? decimal.toString() : formatFrac(frac);
    const rightText = flip ? formatFrac(frac) : decimal.toString();
    return {
      topicId: "fraction-decimal-compare",
      prompt: "분수와 소수의 크기를 비교하여 >, =, < 중 알맞은 기호를 입력하세요.",
      expression: `${leftText}  □  ${rightText}`,
      hint: ">, =, < 중 하나 입력",
      answer: sign,
      kind: "compare",
      solution: `${formatFrac(frac)} = ${fracVal(frac).toFixed(2).replace(/0$/, "").replace(/\\.0$/, "")}이므로 두 수의 크기를 비교할 수 있습니다.`,
    };
  }, {
    topicId: "fraction-decimal-compare",
    prompt: "분수와 소수의 크기를 비교하여 >, =, < 중 알맞은 기호를 입력하세요.",
    expression: "4/5  □  0.7",
    hint: ">, =, < 중 하나 입력",
    answer: ">",
    kind: "compare",
    solution: "4/5 = 0.8이고 0.8 > 0.7이므로 > 입니다.",
  });
}

// ── 5단원: 분수의 덧셈과 뺄셈 ───────────────────────────────

function fractionCalcProblem(
  topicId: string,
  prompt: string,
  expression: string,
  answer: Frac,
  solution: string,
): Problem {
  return {
    topicId,
    prompt,
    expression,
    hint: "기약분수 또는 대분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution,
  };
}

function explainAdd(a: Frac, b: Frac, answer: Frac) {
  const cd = fracLcm(a.d, b.d);
  const left = scaledFrac(a, cd);
  const right = scaledFrac(b, cd);
  return `공통분모 ${cd}로 통분하면 ${fracText(a)} = ${fracText(left)}, ${fracText(b)} = ${fracText(right)}입니다. ${left.n}/${cd} + ${right.n}/${cd} = ${left.n + right.n}/${cd} = ${formatFrac(answer)}입니다.`;
}

function explainSub(a: Frac, b: Frac, answer: Frac) {
  const cd = fracLcm(a.d, b.d);
  const left = scaledFrac(a, cd);
  const right = scaledFrac(b, cd);
  return `공통분모 ${cd}로 통분하면 ${fracText(a)} = ${fracText(left)}, ${fracText(b)} = ${fracText(right)}입니다. ${left.n}/${cd} - ${right.n}/${cd} = ${left.n - right.n}/${cd} = ${formatFrac(answer)}입니다.`;
}

function genProperFractionAddUnderOne(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(16);
    const b = properFraction(16);
    if (a.d === b.d) return null;
    const answer = addFrac(a, b);
    if (fracVal(answer) >= 1) return null;
    return fractionCalcProblem(
      "proper-fraction-add-under-one",
      "합이 1보다 작은 진분수의 덧셈을 계산하세요.",
      `${fracText(a)} + ${fracText(b)}`,
      answer,
      explainAdd(a, b, answer),
    );
  }, fractionCalcProblem(
    "proper-fraction-add-under-one",
    "합이 1보다 작은 진분수의 덧셈을 계산하세요.",
    "1/6 + 1/4",
    makeFrac(5, 12),
    "공통분모 12로 통분하면 1/6 = 2/12, 1/4 = 3/12입니다. 2/12 + 3/12 = 5/12입니다.",
  ));
}

function genProperFractionAddOverOne(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(16);
    const b = properFraction(16);
    if (a.d === b.d) return null;
    const answer = addFrac(a, b);
    if (fracVal(answer) <= 1 || fracVal(answer) >= 2) return null;
    return fractionCalcProblem(
      "proper-fraction-add-over-one",
      "합이 1보다 큰 진분수의 덧셈을 계산하세요.",
      `${fracText(a)} + ${fracText(b)}`,
      answer,
      explainAdd(a, b, answer),
    );
  }, fractionCalcProblem(
    "proper-fraction-add-over-one",
    "합이 1보다 큰 진분수의 덧셈을 계산하세요.",
    "3/4 + 7/10",
    makeFrac(29, 20),
    "공통분모 20으로 통분하면 3/4 = 15/20, 7/10 = 14/20입니다. 15/20 + 14/20 = 29/20 = 1 9/20입니다.",
  ));
}

function genMixedFractionAdd(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(14);
    const b = properFraction(14);
    if (a.d === b.d) return null;
    const aw = randInt(1, 5);
    const bw = randInt(1, 5);
    const left = makeFrac(aw * a.d + a.n, a.d);
    const right = makeFrac(bw * b.d + b.n, b.d);
    const answer = addFrac(left, right);
    return fractionCalcProblem(
      "mixed-fraction-add",
      "대분수의 덧셈을 계산하세요.",
      `${formatFrac(left)} + ${formatFrac(right)}`,
      answer,
      `자연수 부분과 분수 부분을 함께 계산하면 ${formatFrac(left)} + ${formatFrac(right)} = ${formatFrac(answer)}입니다.`,
    );
  }, fractionCalcProblem(
    "mixed-fraction-add",
    "대분수의 덧셈을 계산하세요.",
    "1 1/2 + 1 5/8",
    makeFrac(25, 8),
    "1 1/2 = 12/8, 1 5/8 = 13/8이므로 합은 25/8 = 3 1/8입니다.",
  ));
}

function genProperFractionSub(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(16);
    const b = properFraction(16);
    if (a.d === b.d || fracVal(a) <= fracVal(b)) return null;
    const answer = subFrac(a, b);
    return fractionCalcProblem(
      "proper-fraction-sub",
      "진분수의 뺄셈을 계산하세요.",
      `${fracText(a)} - ${fracText(b)}`,
      answer,
      explainSub(a, b, answer),
    );
  }, fractionCalcProblem(
    "proper-fraction-sub",
    "진분수의 뺄셈을 계산하세요.",
    "5/8 - 1/6",
    makeFrac(11, 24),
    "공통분모 24로 통분하면 5/8 = 15/24, 1/6 = 4/24입니다. 15/24 - 4/24 = 11/24입니다.",
  ));
}

function genMixedFractionSubNoBorrow(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(14);
    const b = properFraction(14);
    if (a.d === b.d || fracVal(a) < fracVal(b)) return null;
    const aw = randInt(3, 8);
    const bw = randInt(1, aw - 1);
    const left = makeFrac(aw * a.d + a.n, a.d);
    const right = makeFrac(bw * b.d + b.n, b.d);
    const answer = subFrac(left, right);
    return fractionCalcProblem(
      "mixed-fraction-sub-no-borrow",
      "분수 부분끼리 뺄 수 있는 대분수의 뺄셈을 계산하세요.",
      `${formatFrac(left)} - ${formatFrac(right)}`,
      answer,
      `분수 부분을 먼저 통분해 뺄 수 있습니다. ${formatFrac(left)} - ${formatFrac(right)} = ${formatFrac(answer)}입니다.`,
    );
  }, fractionCalcProblem(
    "mixed-fraction-sub-no-borrow",
    "분수 부분끼리 뺄 수 있는 대분수의 뺄셈을 계산하세요.",
    "2 5/8 - 1 1/2",
    makeFrac(9, 8),
    "1/2 = 4/8이므로 2 5/8 - 1 4/8 = 1 1/8입니다.",
  ));
}

function genMixedFractionSubBorrow(): Problem {
  return sample<Problem>(() => {
    const a = properFraction(14);
    const b = properFraction(14);
    if (a.d === b.d || fracVal(a) >= fracVal(b)) return null;
    const aw = randInt(3, 8);
    const bw = randInt(1, aw - 1);
    const left = makeFrac(aw * a.d + a.n, a.d);
    const right = makeFrac(bw * b.d + b.n, b.d);
    const answer = subFrac(left, right);
    return fractionCalcProblem(
      "mixed-fraction-sub-borrow",
      "분수 부분끼리 뺄 수 없는 대분수의 뺄셈을 계산하세요.",
      `${formatFrac(left)} - ${formatFrac(right)}`,
      answer,
      `분수 부분이 작으면 자연수 1을 분수로 바꾸어 받아내림합니다. ${formatFrac(left)} - ${formatFrac(right)} = ${formatFrac(answer)}입니다.`,
    );
  }, fractionCalcProblem(
    "mixed-fraction-sub-borrow",
    "분수 부분끼리 뺄 수 없는 대분수의 뺄셈을 계산하세요.",
    "3 1/2 - 1 7/8",
    makeFrac(13, 8),
    "3 1/2 = 2 12/8로 고치면 2 12/8 - 1 7/8 = 1 5/8입니다.",
  ));
}

function genMissingFractionAddend(): Problem {
  return sample<Problem>(() => {
    const missing = properFraction(14);
    const given = properFraction(14);
    if (missing.d === given.d) return null;
    const total = addFrac(missing, given);
    if (fracVal(total) >= 2) return null;
    const missingFirst = Math.random() < 0.5;
    return fractionCalcProblem(
      "missing-fraction-addend",
      "덧셈식의 빈칸에 들어갈 분수를 구하세요.",
      missingFirst
        ? `□ + ${fracText(given)} = ${formatFrac(total)}`
        : `${fracText(given)} + □ = ${formatFrac(total)}`,
      missing,
      `${formatFrac(total)}에서 ${fracText(given)}을 빼면 빈칸은 ${formatFrac(missing)}입니다.`,
    );
  }, fractionCalcProblem(
    "missing-fraction-addend",
    "덧셈식의 빈칸에 들어갈 분수를 구하세요.",
    "□ + 1/2 = 5/6",
    makeFrac(1, 3),
    "5/6 - 1/2 = 5/6 - 3/6 = 2/6 = 1/3입니다.",
  ));
}

function genMissingFractionSubtrahend(): Problem {
  return sample<Problem>(() => {
    const answer = properFraction(14);
    const result = properFraction(14);
    if (answer.d === result.d) return null;
    const start = addFrac(answer, result);
    if (fracVal(start) >= 2) return null;
    return fractionCalcProblem(
      "missing-fraction-subtrahend",
      "뺄셈식의 빈칸에 들어갈 분수를 구하세요.",
      `${formatFrac(start)} - □ = ${fracText(result)}`,
      answer,
      `${formatFrac(start)}에서 결과 ${fracText(result)}를 빼면 빈칸은 ${formatFrac(answer)}입니다.`,
    );
  }, fractionCalcProblem(
    "missing-fraction-subtrahend",
    "뺄셈식의 빈칸에 들어갈 분수를 구하세요.",
    "5/6 - □ = 1/2",
    makeFrac(1, 3),
    "5/6 - 1/2 = 5/6 - 3/6 = 2/6 = 1/3입니다.",
  ));
}

function cardMixedNumbers() {
  const cards = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).sort((a, b) => a - b);
  const [a, b, c] = cards;
  const smallest = makeFrac(a * c + b, c);
  const largest = makeFrac(c * b + a, b);
  return { cards, smallest, largest };
}

function genCardMixedSum(): Problem {
  const { cards, smallest, largest } = cardMixedNumbers();
  const answer = addFrac(largest, smallest);
  return fractionCalcProblem(
    "fraction-card-sum",
    "수 카드로 만들 수 있는 가장 큰 대분수와 가장 작은 대분수의 합을 구하세요.",
    `수 카드 ${cards.join(", ")}\n가장 큰 대분수 + 가장 작은 대분수`,
    answer,
    `가장 큰 대분수는 ${formatFrac(largest)}, 가장 작은 대분수는 ${formatFrac(smallest)}입니다. 합은 ${formatFrac(answer)}입니다.`,
  );
}

function genCardMixedDifference(): Problem {
  const { cards, smallest, largest } = cardMixedNumbers();
  const answer = subFrac(largest, smallest);
  return fractionCalcProblem(
    "fraction-card-difference",
    "수 카드로 만들 수 있는 가장 큰 대분수와 가장 작은 대분수의 차를 구하세요.",
    `수 카드 ${cards.join(", ")}\n가장 큰 대분수 - 가장 작은 대분수`,
    answer,
    `가장 큰 대분수는 ${formatFrac(largest)}, 가장 작은 대분수는 ${formatFrac(smallest)}입니다. 차는 ${formatFrac(answer)}입니다.`,
  );
}

// ── 6월: 다각형의 둘레와 넓이 ───────────────────────────────

function genRectanglePerimeter(): Problem {
  const width = randInt(4, 24);
  const height = randInt(3, 18);
  const answer = 2 * (width + height);
  return withVisual(
    mkInteger(
      "rectangle-perimeter",
      "직사각형의 둘레를 구하세요.",
      `가로 ${width} cm, 세로 ${height} cm`,
      answer,
      `직사각형의 둘레는 (가로 + 세로) × 2 = (${width} + ${height}) × 2 = ${answer} cm입니다.`,
    ),
    { type: "rectangle", width, height, unit: "cm" },
  );
}

function genRectangleArea(): Problem {
  const width = randInt(4, 24);
  const height = randInt(3, 18);
  const answer = width * height;
  return withVisual(
    mkInteger(
      "rectangle-area",
      "직사각형의 넓이를 구하세요.",
      `가로 ${width} cm, 세로 ${height} cm`,
      answer,
      `직사각형의 넓이는 가로 × 세로 = ${width} × ${height} = ${answer} cm²입니다.`,
    ),
    { type: "rectangle", width, height, unit: "cm" },
  );
}

function genSquarePerimeter(): Problem {
  const side = randInt(4, 30);
  const answer = side * 4;
  return withVisual(
    mkInteger(
      "square-perimeter",
      "정사각형의 둘레를 구하세요.",
      `한 변 ${side} cm`,
      answer,
      `정사각형의 둘레는 한 변 × 4 = ${side} × 4 = ${answer} cm입니다.`,
    ),
    { type: "square", side, unit: "cm" },
  );
}

function genParallelogramArea(): Problem {
  const base = randInt(5, 24);
  const height = randInt(3, 18);
  const answer = base * height;
  return withVisual(
    mkInteger(
      "parallelogram-area",
      "평행사변형의 넓이를 구하세요.",
      `밑변 ${base} cm, 높이 ${height} cm`,
      answer,
      `평행사변형의 넓이는 밑변 × 높이 = ${base} × ${height} = ${answer} cm²입니다.`,
    ),
    { type: "parallelogram", base, height, unit: "cm" },
  );
}

function genTriangleArea(): Problem {
  const base = choice([6, 8, 10, 12, 14, 16, 18, 20, 24]);
  const height = randInt(3, 18);
  const answer = (base * height) / 2;
  return withVisual(
    mkInteger(
      "triangle-area",
      "삼각형의 넓이를 구하세요.",
      `밑변 ${base} cm, 높이 ${height} cm`,
      answer,
      `삼각형의 넓이는 밑변 × 높이 ÷ 2 = ${base} × ${height} ÷ 2 = ${answer} cm²입니다.`,
    ),
    { type: "triangle", base, height, unit: "cm" },
  );
}

function genTrapezoidArea(): Problem {
  const top = randInt(4, 16);
  const bottom = top + randInt(2, 12);
  const height = choice([4, 6, 8, 10, 12, 14]);
  const answer = ((top + bottom) * height) / 2;
  return withVisual(
    mkInteger(
      "trapezoid-area",
      "사다리꼴의 넓이를 구하세요.",
      `윗변 ${top} cm, 아랫변 ${bottom} cm, 높이 ${height} cm`,
      answer,
      `사다리꼴의 넓이는 (윗변 + 아랫변) × 높이 ÷ 2 = (${top} + ${bottom}) × ${height} ÷ 2 = ${answer} cm²입니다.`,
    ),
    { type: "trapezoid", top, bottom, height, unit: "cm" },
  );
}

function genCompositeArea(): Problem {
  const width = randInt(10, 24);
  const height = randInt(8, 18);
  const cutW = randInt(2, Math.floor(width / 2));
  const cutH = randInt(2, Math.floor(height / 2));
  const answer = width * height - cutW * cutH;
  return withVisual(
    mkInteger(
      "composite-area",
      "직사각형에서 작은 직사각형을 잘라 낸 도형의 넓이를 구하세요.",
      `큰 직사각형 ${width} cm × ${height} cm\n잘라 낸 직사각형 ${cutW} cm × ${cutH} cm`,
      answer,
      `큰 넓이 ${width * height}에서 잘라 낸 넓이 ${cutW * cutH}를 빼면 ${answer} cm²입니다.`,
    ),
    { type: "composite-rect", width, height, cutWidth: cutW, cutHeight: cutH, unit: "cm" },
  );
}

// ── 7월: 수의 범위와 어림하기 ───────────────────────────────

function genRangeCountInclusive(): Problem {
  const start = randInt(12, 80);
  const end = start + randInt(8, 30);
  const answer = end - start + 1;
  return mkInteger(
    "range-count-inclusive",
    "범위에 들어가는 자연수의 개수를 구하세요.",
    `${start} 이상 ${end} 이하인 자연수`,
    answer,
    `${start}부터 ${end}까지 모두 포함하므로 ${end} - ${start} + 1 = ${answer}개입니다.`,
  );
}

function genRangeCountExclusive(): Problem {
  const start = randInt(12, 80);
  const end = start + randInt(8, 30);
  const answer = end - start - 1;
  return mkInteger(
    "range-count-exclusive",
    "범위에 들어가는 자연수의 개수를 구하세요.",
    `${start} 초과 ${end} 미만인 자연수`,
    answer,
    `${start + 1}부터 ${end - 1}까지이므로 ${end} - ${start} - 1 = ${answer}개입니다.`,
  );
}

function genRoundNearestTen(): Problem {
  const value = randInt(125, 987);
  const answer = Math.round(value / 10) * 10;
  return mkInteger(
    "round-nearest-ten",
    "일의 자리에서 반올림해 십의 자리까지 나타내세요.",
    `${value}`,
    answer,
    `일의 자리 숫자를 보고 반올림하면 ${value}는 ${answer}이 됩니다.`,
  );
}

function genRoundNearestHundred(): Problem {
  const value = randInt(1250, 9870);
  const answer = Math.round(value / 100) * 100;
  return mkInteger(
    "round-nearest-hundred",
    "십의 자리에서 반올림해 백의 자리까지 나타내세요.",
    `${value}`,
    answer,
    `십의 자리 숫자를 보고 반올림하면 ${value}는 ${answer}이 됩니다.`,
  );
}

function genEstimateSumRound(): Problem {
  const a = randInt(120, 890);
  const b = randInt(120, 890);
  const ra = Math.round(a / 100) * 100;
  const rb = Math.round(b / 100) * 100;
  const answer = ra + rb;
  return mkInteger(
    "estimate-sum-round",
    "두 수를 백의 자리까지 어림하여 합을 구하세요.",
    `${a} + ${b}`,
    answer,
    `${a} ≈ ${ra}, ${b} ≈ ${rb}이므로 어림한 합은 ${answer}입니다.`,
  );
}

function genRangeStatementChoice(): Problem {
  const n = randInt(20, 80);
  const answer = `${n} 이상은 ${n}을 포함합니다.`;
  return mkChoice(
    "range-statement-choice",
    "범위 표현으로 옳은 설명을 고르세요.",
    `${n} 이상, ${n} 초과, ${n} 이하, ${n} 미만`,
    answer,
    [
      `${n} 초과는 ${n}을 포함합니다.`,
      `${n} 미만은 ${n}을 포함합니다.`,
      `${n} 이하는 ${n}보다 큰 수만 뜻합니다.`,
      `${n} 이상은 ${n}을 제외합니다.`,
    ],
    `"이상"과 "이하"는 기준 수를 포함하고, "초과"와 "미만"은 기준 수를 포함하지 않습니다.`,
  );
}

// ── 8월: 분수의 곱셈 ───────────────────────────────────────

function genFractionTimesInteger(): Problem {
  const f = properFraction(12);
  const k = randInt(2, 9);
  const answer = reduceFrac(makeFrac(f.n * k, f.d));
  return {
    topicId: "fraction-times-integer",
    prompt: "분수와 자연수의 곱을 구하세요.",
    expression: `${formatFrac(f)} × ${k}`,
    hint: "예: 3/5 또는 1 2/5",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `분자는 ${f.n} × ${k}로 계산하고 분모 ${f.d}는 그대로 두면 ${formatFrac(answer)}입니다.`,
  };
}

function genIntegerTimesFraction(): Problem {
  const k = randInt(2, 9);
  const f = properFraction(12);
  const answer = reduceFrac(makeFrac(k * f.n, f.d));
  return {
    topicId: "integer-times-fraction",
    prompt: "자연수와 분수의 곱을 구하세요.",
    expression: `${k} × ${formatFrac(f)}`,
    hint: "예: 3/5 또는 1 2/5",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${k} × ${formatFrac(f)}는 ${formatFrac(f)}를 ${k}번 더한 것과 같아 ${formatFrac(answer)}입니다.`,
  };
}

function genFractionTimesFraction(): Problem {
  const a = properFraction(12);
  const b = properFraction(12);
  const answer = mulFrac(a, b);
  return {
    topicId: "fraction-times-fraction",
    prompt: "분수끼리의 곱을 구하세요.",
    expression: `${formatFrac(a)} × ${formatFrac(b)}`,
    hint: "예: 3/10",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `분자는 ${a.n} × ${b.n}, 분모는 ${a.d} × ${b.d}로 곱한 뒤 약분하면 ${formatFrac(answer)}입니다.`,
  };
}

function genMixedTimesInteger(): Problem {
  const whole = randInt(1, 4);
  const f = properFraction(10);
  const mixed = makeFrac(whole * f.d + f.n, f.d);
  const k = randInt(2, 6);
  const answer = reduceFrac(makeFrac(mixed.n * k, mixed.d));
  return {
    topicId: "mixed-times-integer",
    prompt: "대분수와 자연수의 곱을 구하세요.",
    expression: `${formatFrac(mixed)} × ${k}`,
    hint: "예: 4 1/2",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${formatFrac(mixed)}를 가분수로 보고 ${k}를 곱하면 ${formatFrac(answer)}입니다.`,
  };
}

function genFractionOfQuantity(): Problem {
  const d = choice([3, 4, 5, 6, 8, 10, 12]);
  const n = randInt(1, d - 1);
  const bundle = d * randInt(3, 15);
  const answer = (bundle / d) * n;
  return mkInteger(
    "fraction-of-quantity",
    "전체의 분수만큼은 얼마인지 구하세요.",
    `${bundle}개의 ${rawFrac(makeFrac(n, d))}`,
    answer,
    `${bundle}을 ${d}등분하면 한 몫은 ${bundle / d}이고, 그중 ${n}몫은 ${answer}입니다.`,
  );
}

// ── 9월: 합동과 대칭 ───────────────────────────────────────

function genCongruentSide(): Problem {
  const ab = randInt(4, 18);
  const bc = randInt(4, 18);
  const ca = randInt(4, 18);
  const answer = choice([ab, bc, ca]);
  const target = answer === ab ? "DE" : answer === bc ? "EF" : "FD";
  return withVisual(
    mkInteger(
      "congruent-side",
      "합동인 삼각형에서 대응변의 길이를 구하세요.",
      `△ABC와 △DEF가 합동입니다.\nAB=${ab} cm, BC=${bc} cm, CA=${ca} cm\n구할 변: ${target}`,
      answer,
      `합동인 도형의 대응변의 길이는 같습니다. ${target}의 길이는 ${answer} cm입니다.`,
    ),
    { type: "congruent-triangles", sides: [ab, bc, ca], target, unit: "cm" },
  );
}

function genCongruentAngle(): Problem {
  const a = randInt(35, 95);
  const b = randInt(35, 120 - a);
  const c = 180 - a - b;
  const answer = choice([a, b, c]);
  const target = answer === a ? "각 D" : answer === b ? "각 E" : "각 F";
  return withVisual(
    mkInteger(
      "congruent-angle",
      "합동인 삼각형에서 대응각의 크기를 구하세요.",
      `△ABC와 △DEF가 합동입니다.\n각 A=${a}°, 각 B=${b}°, 각 C=${c}°\n구할 각: ${target}`,
      answer,
      `합동인 도형의 대응각의 크기는 같습니다. ${target}의 크기는 ${answer}°입니다.`,
      "각도 숫자만 입력",
    ),
    { type: "congruent-triangles", angles: [a, b, c], target },
  );
}

function genLineSymmetryCount(): Problem {
  const item = choice([
    { name: "정사각형", count: "4개", shape: "square" as const },
    { name: "직사각형", count: "2개", shape: "rectangle" as const },
    { name: "정삼각형", count: "3개", shape: "equilateral-triangle" as const },
    { name: "이등변삼각형", count: "1개", shape: "isosceles-triangle" as const },
  ]);
  return withVisual(
    mkChoice(
      "line-symmetry-count",
      "대칭축의 개수를 고르세요.",
      item.name,
      item.count,
      ["0개", "1개", "2개", "3개", "4개"],
      `${item.name}의 대칭축은 ${item.count}입니다.`,
    ),
    { type: "symmetry-shape", shape: item.shape },
  );
}

function genPointSymmetryChoice(): Problem {
  const answer = "평행사변형";
  return withVisual(
    mkChoice(
      "point-symmetry-choice",
      "점대칭도형인 것을 고르세요.",
      "한 점을 중심으로 180° 돌렸을 때 겹치는 도형",
      answer,
      ["이등변삼각형", "정오각형", "사다리꼴", "부채꼴"],
      "평행사변형은 두 대각선의 교점을 중심으로 180° 돌리면 자기 자신과 겹칩니다.",
    ),
    { type: "angle-diagram", degrees: 180, title: "점대칭 180° 회전" },
  );
}

function genSymmetryCoordinate(): Problem {
  const x = randInt(1, 8);
  const y = randInt(1, 8);
  const axis = choice(["세로선", "가로선"]);
  const answer = axis === "세로선" ? `(-${x}, ${y})` : `(${x}, -${y})`;
  return withVisual(
    mkChoice(
      "symmetry-coordinate",
      "좌표평면에서 대칭인 점을 고르세요.",
      `점 (${x}, ${y})를 ${axis}에 대칭이동`,
      answer,
      [`(${x}, ${-y})`, `(${-x}, ${-y})`, `(${y}, ${x})`, `(${-y}, ${x})`],
      `${axis} 대칭에서는 ${axis === "세로선" ? "x좌표의 부호" : "y좌표의 부호"}만 바뀝니다.`,
    ),
    { type: "coordinate-plane", point: [x, y], axis: axis === "세로선" ? "y" : "x" },
  );
}

// ── 10월: 소수의 곱셈 ──────────────────────────────────────

function genDecimalTimesInteger(): Problem {
  const places = choice([1, 2]);
  const scaled = randInt(12, 95);
  const k = randInt(2, 9);
  const answer = decimalText((scaled * k) / 10 ** places, places);
  const value = decimalText(scaled / 10 ** places, places);
  return mkChoice(
    "decimal-times-integer",
    "소수와 자연수의 곱을 구하세요.",
    `${value} × ${k}`,
    answer,
    [
      decimalText((scaled + k) / 10 ** places, places),
      decimalText((scaled * k) / 10 ** (places + 1), places + 1),
      decimalText((scaled * (k + 1)) / 10 ** places, places),
      decimalText((scaled * Math.max(1, k - 1)) / 10 ** places, places),
    ],
    `자연수처럼 ${scaled} × ${k}를 계산한 뒤 소수점 위치를 맞추면 ${answer}입니다.`,
  );
}

function genIntegerTimesDecimal(): Problem {
  const k = randInt(3, 12);
  const places = choice([1, 2]);
  const scaled = randInt(12, 85);
  const answer = decimalText((k * scaled) / 10 ** places, places);
  const value = decimalText(scaled / 10 ** places, places);
  return mkChoice(
    "integer-times-decimal",
    "자연수와 소수의 곱을 구하세요.",
    `${k} × ${value}`,
    answer,
    [
      decimalText((k + scaled) / 10 ** places, places),
      decimalText((k * scaled) / 10 ** (places + 1), places + 1),
      decimalText(((k + 1) * scaled) / 10 ** places, places),
      decimalText((Math.max(1, k - 1) * scaled) / 10 ** places, places),
    ],
    `${k} × ${value}는 ${value}를 ${k}번 더한 값이므로 ${answer}입니다.`,
  );
}

function genDecimalTimesDecimal(): Problem {
  const a = randInt(12, 95);
  const b = randInt(12, 95);
  const answer = decimalText((a * b) / 100, 2);
  const left = decimalText(a / 10, 1);
  const right = decimalText(b / 10, 1);
  return mkChoice(
    "decimal-times-decimal",
    "소수끼리의 곱을 구하세요.",
    `${left} × ${right}`,
    answer,
    [
      decimalText((a + b) / 10, 1),
      decimalText((a * b) / 10, 1),
      decimalText((a * b) / 1000, 3),
      decimalText(((a + 1) * b) / 100, 2),
    ],
    `소수 한 자리끼리 곱했으므로 곱 ${a * b}에서 소수점 아래 두 자리가 되게 하면 ${answer}입니다.`,
  );
}

function genDecimalArea(): Problem {
  const w = randInt(12, 85);
  const h = randInt(12, 85);
  const answer = decimalText((w * h) / 100, 2);
  const width = decimalText(w / 10, 1);
  const height = decimalText(h / 10, 1);
  return withVisual(
    mkChoice(
      "decimal-area",
      "직사각형의 넓이를 소수 곱셈으로 구하세요.",
      `가로 ${width} cm, 세로 ${height} cm`,
      answer,
      [
        decimalText((w + h) / 10, 1),
        decimalText((w * h) / 10, 1),
        decimalText((w * h) / 1000, 3),
        decimalText(((w + 10) * h) / 100, 2),
      ],
      `넓이는 ${width} × ${height} = ${answer} cm²입니다.`,
    ),
    { type: "rectangle", width, height, unit: "cm" },
  );
}

function genDecimalMissingFactor(): Problem {
  const factor = randInt(2, 9);
  const scaled = randInt(12, 75);
  const value = decimalText(scaled / 10, 1);
  const product = decimalText((scaled * factor) / 10, 1);
  return mkChoice(
    "decimal-missing-factor",
    "□에 들어갈 자연수를 고르세요.",
    `${value} × □ = ${product}`,
    String(factor),
    [String(factor + 1), String(Math.max(1, factor - 1)), String(factor + 2), String(factor * 2)],
    `${product}를 ${value}로 나누면 □ = ${factor}입니다.`,
  );
}

// ── 11월: 직육면체 ────────────────────────────────────────

function genCuboidEdgeSum(): Problem {
  const a = randInt(3, 14);
  const b = randInt(3, 14);
  const c = randInt(3, 14);
  const answer = 4 * (a + b + c);
  return withVisual(
    mkInteger(
      "cuboid-edge-sum",
      "직육면체의 모든 모서리 길이의 합을 구하세요.",
      `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm`,
      answer,
      `직육면체에는 같은 길이의 모서리가 각각 4개씩 있으므로 4 × (${a} + ${b} + ${c}) = ${answer} cm입니다.`,
    ),
    { type: "cuboid", width: a, depth: b, height: c, unit: "cm" },
  );
}

function genCuboidCountsChoice(): Problem {
  const answer = "면 6개, 모서리 12개, 꼭짓점 8개";
  return withVisual(
    mkChoice(
      "cuboid-counts-choice",
      "직육면체의 구성 요소로 옳은 것을 고르세요.",
      "직육면체",
      answer,
      [
        "면 8개, 모서리 12개, 꼭짓점 6개",
        "면 6개, 모서리 8개, 꼭짓점 12개",
        "면 12개, 모서리 6개, 꼭짓점 8개",
        "면 5개, 모서리 10개, 꼭짓점 8개",
      ],
      "직육면체는 면 6개, 모서리 12개, 꼭짓점 8개로 이루어져 있습니다.",
    ),
    { type: "cuboid", width: "가로", depth: "세로", height: "높이", unit: "" },
  );
}

function genCuboidFaceArea(): Problem {
  const a = randInt(3, 14);
  const b = randInt(3, 14);
  const answer = a * b;
  return withVisual(
    mkInteger(
      "cuboid-face-area",
      "직육면체 한 면의 넓이를 구하세요.",
      `가로 ${a} cm, 세로 ${b} cm인 면`,
      answer,
      `직사각형 모양의 면 넓이는 ${a} × ${b} = ${answer} cm²입니다.`,
    ),
    { type: "rectangle", width: a, height: b, unit: "cm" },
  );
}

function genStackedCubes(): Problem {
  const a = randInt(2, 7);
  const b = randInt(2, 7);
  const c = randInt(2, 6);
  const answer = a * b * c;
  return withVisual(
    mkInteger(
      "stacked-cubes",
      "쌓기나무의 개수를 구하세요.",
      `가로 ${a}개, 세로 ${b}개, 높이 ${c}층`,
      answer,
      `한 층에 ${a} × ${b} = ${a * b}개, ${c}층이므로 모두 ${answer}개입니다.`,
    ),
    { type: "cube-stack", cols: a, rows: b, layers: c },
  );
}

function genCuboidParallelFaces(): Problem {
  const answer = "서로 마주 보는 두 면";
  return withVisual(
    mkChoice(
      "cuboid-parallel-faces",
      "직육면체에서 서로 평행한 면을 고르세요.",
      "직육면체의 면 사이 관계",
      answer,
      ["서로 만나는 두 면", "한 꼭짓점에서 만나는 세 면", "서로 수직인 두 면", "같은 모서리를 가진 두 면"],
      "직육면체에서 서로 마주 보는 두 면은 만나지 않고 평행합니다.",
    ),
    { type: "cuboid", width: "가로", depth: "세로", height: "높이", unit: "" },
  );
}

// ── 12월: 평균과 가능성 ───────────────────────────────────

function genAverageBasic(): Problem {
  const values = Array.from({ length: 4 }, () => randInt(12, 40));
  const sum = values.reduce((a, b) => a + b, 0);
  const adjusted = values.slice(0, 3);
  const last = Math.ceil(sum / 4) * 4 - adjusted.reduce((a, b) => a + b, 0);
  const nums = [...adjusted, last];
  const answer = nums.reduce((a, b) => a + b, 0) / 4;
  return withVisual(
    mkInteger(
      "average-basic",
      "평균을 구하세요.",
      nums.join(", "),
      answer,
      `합 ${nums.reduce((a, b) => a + b, 0)}를 자료 수 4로 나누면 평균은 ${answer}입니다.`,
    ),
    {
      type: "bar-chart",
      title: "자료별 값과 평균선",
      unit: "점",
      items: nums.map((value, index) => ({ label: `${index + 1}번`, value })),
      referenceValue: answer,
    },
  );
}

function genAverageMissingValue(): Problem {
  const avg = randInt(12, 30);
  const known = [randInt(8, 34), randInt(8, 34), randInt(8, 34)];
  const answer = avg * 4 - known.reduce((a, b) => a + b, 0);
  if (answer <= 0) return genAverageMissingValue();
  return withVisual(
    mkInteger(
      "average-missing-value",
      "평균이 주어졌을 때 빠진 값을 구하세요.",
      `${known.join(", ")}, □의 평균이 ${avg}`,
      answer,
      `전체 합은 ${avg} × 4 = ${avg * 4}입니다. 알고 있는 값의 합을 빼면 □ = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      headers: ["자료", "1번", "2번", "3번", "4번", "평균"],
      rows: [["값", known[0], known[1], known[2], "□", avg]],
      caption: "평균과 빠진 값",
    },
  );
}

function genAverageTotal(): Problem {
  const avg = randInt(15, 45);
  const count = randInt(3, 8);
  const answer = avg * count;
  return withVisual(
    mkInteger(
      "average-total",
      "평균과 자료 수를 보고 전체 합을 구하세요.",
      `평균 ${avg}, 자료 수 ${count}개`,
      answer,
      `전체 합은 평균 × 자료 수 = ${avg} × ${count} = ${answer}입니다.`,
    ),
    {
      type: "bar-chart",
      title: "평균값이 같은 자료",
      unit: "점",
      items: Array.from({ length: count }, (_, index) => ({ label: `${index + 1}`, value: avg })),
      referenceValue: avg,
    },
  );
}

function genChanceStatementChoice(): Problem {
  const answer = "일어날 가능성이 반반입니다.";
  return withVisual(
    mkChoice(
      "chance-statement-choice",
      "가능성을 바르게 표현한 문장을 고르세요.",
      "동전 한 개를 던져 앞면이 나올 가능성",
      answer,
      [
        "반드시 일어납니다.",
        "전혀 일어나지 않습니다.",
        "일어날 가능성이 매우 낮습니다.",
        "일어날 가능성이 없습니다.",
      ],
      "공평한 동전은 앞면과 뒷면이 나올 가능성이 같으므로 반반입니다.",
    ),
    { type: "coin-chance" },
  );
}

function genChanceCompare(): Problem {
  const red = randInt(2, 9);
  const blue = red + randInt(1, 6);
  const answer = "파란 공";
  return withVisual(
    mkChoice(
      "chance-compare",
      "꺼낼 가능성이 더 큰 공을 고르세요.",
      `주머니 안: 빨간 공 ${red}개, 파란 공 ${blue}개`,
      answer,
      ["빨간 공", "두 공이 같음", "알 수 없음", "가능성이 없음"],
      `파란 공이 ${blue}개로 빨간 공 ${red}개보다 많으므로 파란 공을 꺼낼 가능성이 더 큽니다.`,
    ),
    { type: "probability-bag", red, blue },
  );
}

// ── 1월: 5학년 총정리 ─────────────────────────────────────

function genReviewNaturalMixed(): Problem {
  return retopic("review-natural-mixed", choice([genFourMixBasic, genFourMixParen, genReverseMixed])());
}

function genReviewFactorMultiple(): Problem {
  return retopic("review-factor-multiple", choice([genGcd, genLcm, genGcdWord, genLcmWord])());
}

function genReviewFractionAddSub(): Problem {
  return retopic(
    "review-fraction-addsub",
    choice([genProperFractionAddOverOne, genMixedFractionAdd, genMixedFractionSubBorrow, genMissingFractionAddend])(),
  );
}

function genReviewArea(): Problem {
  return retopic("review-area", choice([genRectangleArea, genTriangleArea, genTrapezoidArea, genCompositeArea])());
}

function genReviewDecimalFraction(): Problem {
  return retopic("review-decimal-fraction", choice([genFractionDecimalCompare, genDecimalTimesDecimal, genFractionTimesFraction])());
}

// ── 2월: 6학년 준비 ───────────────────────────────────────

function genPrepFractionDivideInteger(): Problem {
  const f = properFraction(12);
  const k = randInt(2, 6);
  const answer = reduceFrac(makeFrac(f.n, f.d * k));
  return {
    topicId: "prep-fraction-divide-integer",
    prompt: "분수를 자연수로 나누어 보세요.",
    expression: `${formatFrac(f)} ÷ ${k}`,
    hint: "예: 1/6",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${formatFrac(f)}를 ${k}등분하면 ${formatFrac(answer)}입니다.`,
  };
}

function genPrepDecimalDivideInteger(): Problem {
  const divisor = choice([2, 4, 5, 8]);
  const answerScaled = randInt(12, 95);
  const dividend = decimalText((answerScaled * divisor) / 10, 1);
  const answer = decimalText(answerScaled / 10, 1);
  return mkChoice(
    "prep-decimal-divide-integer",
    "소수를 자연수로 나눈 몫을 고르세요.",
    `${dividend} ÷ ${divisor}`,
    answer,
    [
      decimalText(answerScaled / 100, 2),
      decimalText((answerScaled + divisor) / 10, 1),
      decimalText((answerScaled * divisor) / 10, 1),
      decimalText(Math.max(1, answerScaled - divisor) / 10, 1),
    ],
    `${dividend}를 ${divisor}로 나누면 ${answer}입니다.`,
  );
}

function genPrepRatioValue(): Problem {
  const left = randInt(2, 6);
  const right = randInt(2, 8);
  const unit = randInt(3, 12);
  const total = (left + right) * unit;
  const answer = right * unit;
  return mkInteger(
    "prep-ratio-value",
    "비를 보고 한쪽 양을 구하세요.",
    `사과와 배의 수의 비가 ${left}:${right}이고 모두 ${total}개입니다.\n배는 몇 개입니까?`,
    answer,
    `전체 비 ${left + right}몫이 ${total}개이므로 1몫은 ${unit}개, 배는 ${right}몫이라 ${answer}개입니다.`,
  );
}

function genPrepGraphRead(): Problem {
  const labels = ["월", "화", "수", "목"];
  const values = labels.map(() => randInt(12, 45));
  const max = Math.max(...values);
  const answer = labels[values.indexOf(max)];
  return withVisual(
    mkChoice(
      "prep-graph-read",
      "막대그래프를 보고 가장 큰 값을 가진 요일을 고르세요.",
      labels.map((label, index) => `${label}: ${values[index]}`).join("  |  "),
      answer,
      labels.filter((label) => label !== answer),
      `가장 큰 값은 ${max}이므로 ${answer}요일입니다.`,
    ),
    {
      type: "bar-chart",
      title: "요일별 학습량",
      unit: "개",
      items: labels.map((label, index) => ({ label, value: values[index]! })),
    },
  );
}

function genPrepVolumePreview(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const c = randInt(2, 8);
  const answer = a * b * c;
  return withVisual(
    mkInteger(
      "prep-volume-preview",
      "직육면체 부피의 기초를 연습하세요.",
      `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 상자`,
      answer,
      `부피는 가로 × 세로 × 높이 = ${a} × ${b} × ${c} = ${answer} cm³입니다.`,
    ),
    { type: "cuboid", width: a, depth: b, height: c, unit: "cm" },
  );
}

// ── 4학년 3월~다음 해 2월 추가 학습 ───────────────────────

function numberText(n: number): string {
  return n.toLocaleString("ko-KR");
}

function genG4BigNumberRead(): Problem {
  const man = randInt(12, 96);
  const rest = randInt(101, 9876);
  const number = man * 10000 + rest;
  const answer = `${man}만 ${numberText(rest)}`;
  return mkChoice(
    "g4-big-number-read",
    "큰 수를 만 단위로 읽은 것을 고르세요.",
    numberText(number),
    answer,
    [`${man + 1}만 ${numberText(rest)}`, `${man}만 ${numberText(rest + 10)}`, `${Math.max(1, man - 1)}만 ${numberText(rest)}`, `${numberText(man)}천 ${numberText(rest)}`],
    `${numberText(number)}은 ${man}만과 ${numberText(rest)}가 모인 수입니다.`,
  );
}

function genG4PlaceValue(): Problem {
  const scale = choice([10, 100, 1000, 10000]);
  const digit = randInt(2, 9);
  const tail = randInt(0, scale - 1);
  const number = digit * scale + tail + randInt(1, 8) * scale * 10;
  const placeName = scale === 10 ? "십" : scale === 100 ? "백" : scale === 1000 ? "천" : "만";
  const answer = digit * scale;
  return mkInteger(
    "g4-place-value",
    "자리의 숫자가 나타내는 값을 구하세요.",
    `${numberText(number)}에서 ${placeName}의 자리 숫자 ${digit}이 나타내는 값`,
    answer,
    `${placeName}의 자리 숫자 ${digit}은 ${numberText(answer)}을 나타냅니다.`,
  );
}

function genG4NumberCompare(): Problem {
  const a = randInt(12000, 990000);
  const b = a + choice([-1, 1]) * randInt(25, 8000);
  return {
    topicId: "g4-number-compare",
    prompt: "두 수의 크기를 비교해 □에 알맞은 기호를 쓰세요.",
    expression: `${a} □ ${b}`,
    hint: ">, <, = 중 하나",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `${numberText(a)}와 ${numberText(b)}를 높은 자리부터 비교합니다.`,
  };
}

function genG4NumberOrder(): Problem {
  const numbers = shuffle(Array.from({ length: 4 }, () => randInt(20000, 900000)));
  const sorted = [...numbers].sort((a, b) => a - b);
  const answer = sorted.map(numberText).join(" < ");
  return mkChoice(
    "g4-number-order",
    "수를 작은 것부터 차례대로 배열한 것을 고르세요.",
    numbers.map(numberText).join(", "),
    answer,
    [
      [...sorted].reverse().map(numberText).join(" < "),
      [sorted[0], sorted[2], sorted[1], sorted[3]].map(numberText).join(" < "),
      [sorted[1], sorted[0], sorted[2], sorted[3]].map(numberText).join(" < "),
      [sorted[0], sorted[1], sorted[3], sorted[2]].map(numberText).join(" < "),
    ],
    "높은 자리 숫자부터 비교해 작은 수를 먼저 놓습니다.",
  );
}

function genG4RoundingBasic(): Problem {
  const place = choice([10, 100, 1000]);
  const number = randInt(place * 12, place * 950 + 49);
  const answer = Math.round(number / place) * place;
  const placeName = place === 10 ? "십" : place === 100 ? "백" : "천";
  return mkInteger(
    "g4-rounding-basic",
    `${placeName}의 자리까지 반올림하세요.`,
    numberText(number),
    answer,
    `${placeName}의 자리까지 나타내려면 바로 아래 자리 숫자를 보고 반올림하여 ${numberText(answer)}이 됩니다.`,
  );
}

function genG4MillionUnit(): Problem {
  const unit = randInt(23, 95);
  const answer = unit * 10000;
  return mkInteger(
    "g4-million-unit",
    "만 단위 수를 숫자로 나타내세요.",
    `${unit}만`,
    answer,
    `1만은 10,000이므로 ${unit}만은 ${unit} × 10,000 = ${numberText(answer)}입니다.`,
  );
}

function genG4Mul3x2(): Problem {
  const a = randInt(112, 986);
  const b = randInt(12, 87);
  return mkInteger(
    "g4-mul-3x2",
    "세 자리 수와 두 자리 수의 곱을 계산하세요.",
    `${a} × ${b}`,
    a * b,
    `${a} × ${b} = ${numberText(a * b)}입니다.`,
  );
}

function genG4Div3By1(): Problem {
  const divisor = randInt(2, 9);
  const answer = randInt(21, 108);
  const dividend = divisor * answer;
  return mkInteger(
    "g4-div-3by1",
    "세 자리 수를 한 자리 수로 나누세요.",
    `${dividend} ÷ ${divisor}`,
    answer,
    `${dividend} ÷ ${divisor} = ${answer}입니다.`,
  );
}

function genG4DivisionRemainder(): Problem {
  const divisor = randInt(3, 9);
  const quotient = randInt(18, 92);
  const remainder = randInt(1, divisor - 1);
  const dividend = divisor * quotient + remainder;
  return mkInteger(
    "g4-division-remainder",
    "나눗셈의 나머지를 구하세요.",
    `${dividend} ÷ ${divisor}`,
    remainder,
    `${dividend} = ${divisor} × ${quotient} + ${remainder}이므로 나머지는 ${remainder}입니다.`,
  );
}

function genG4MissingFactor(): Problem {
  const a = randInt(14, 89);
  const answer = randInt(3, 9);
  return mkInteger(
    "g4-missing-factor",
    "□에 들어갈 수를 구하세요.",
    `${a} × □ = ${a * answer}`,
    answer,
    `${a * answer} ÷ ${a} = ${answer}이므로 □는 ${answer}입니다.`,
  );
}

function genG4MulWord(): Problem {
  const boxes = randInt(12, 36);
  const perBox = randInt(14, 48);
  return mkInteger(
    "g4-mul-word",
    "문장을 읽고 곱셈으로 해결하세요.",
    `색연필이 한 상자에 ${perBox}자루씩 ${boxes}상자 있습니다. 모두 몇 자루입니까?`,
    boxes * perBox,
    `${perBox}자루씩 ${boxes}상자이므로 ${perBox} × ${boxes} = ${boxes * perBox}자루입니다.`,
  );
}

function genG4DivWord(): Problem {
  const groups = randInt(4, 9);
  const each = randInt(23, 85);
  const total = groups * each;
  return mkInteger(
    "g4-div-word",
    "문장을 읽고 나눗셈으로 해결하세요.",
    `${total}개의 붙임딱지를 ${groups}명에게 똑같이 나누어 주면 한 명이 몇 개씩 가집니까?`,
    each,
    `${total} ÷ ${groups} = ${each}이므로 한 명이 ${each}개씩 가집니다.`,
  );
}

function genG4AngleMeasure(): Problem {
  const known = choice([25, 30, 35, 40, 45, 50, 60, 65]);
  const answer = 90 - known;
  return mkInteger(
    "g4-angle-measure",
    "직각을 이루는 두 각 중 나머지 각의 크기를 구하세요.",
    `한 각이 ${known}°일 때 나머지 각`,
    answer,
    `직각은 90°이므로 90 - ${known} = ${answer}°입니다.`,
    "숫자만 입력",
  );
}

function genG4AngleSum(): Problem {
  const known = choice([35, 45, 55, 70, 80, 95, 110]);
  const answer = 180 - known;
  return mkInteger(
    "g4-angle-sum",
    "일직선을 이루는 두 각 중 나머지 각의 크기를 구하세요.",
    `한 각이 ${known}°일 때 나머지 각`,
    answer,
    `일직선의 각은 180°이므로 180 - ${known} = ${answer}°입니다.`,
    "숫자만 입력",
  );
}

function genG4TriangleKind(): Problem {
  const cases = [
    { expression: "세 변의 길이가 모두 같은 삼각형", answer: "정삼각형" },
    { expression: "두 변의 길이가 같은 삼각형", answer: "이등변삼각형" },
    { expression: "한 각이 직각인 삼각형", answer: "직각삼각형" },
  ];
  const item = choice(cases);
  return withVisual(
    mkChoice(
      "g4-triangle-kind",
      "설명에 맞는 삼각형의 이름을 고르세요.",
      item.expression,
      item.answer,
      ["정삼각형", "이등변삼각형", "직각삼각형", "예각삼각형"].filter((name) => name !== item.answer),
      `${item.expression}은 ${item.answer}입니다.`,
    ),
    { type: "triangle", base: 8, height: 5, unit: "cm" },
  );
}

function genG4QuadrilateralKind(): Problem {
  const cases = [
    { expression: "마주 보는 두 쌍의 변이 서로 평행한 사각형", answer: "평행사변형" },
    { expression: "네 각이 모두 직각인 사각형", answer: "직사각형" },
    { expression: "네 변의 길이가 모두 같은 사각형", answer: "마름모" },
    { expression: "한 쌍의 대변만 서로 평행한 사각형", answer: "사다리꼴" },
  ];
  const item = choice(cases);
  return mkChoice(
    "g4-quadrilateral-kind",
    "설명에 맞는 사각형의 이름을 고르세요.",
    item.expression,
    item.answer,
    cases.map((candidate) => candidate.answer).filter((name) => name !== item.answer),
    `${item.expression}은 ${item.answer}입니다.`,
  );
}

function genG4RightAngleCount(): Problem {
  const cases = [
    { shape: "정사각형", answer: "4개" },
    { shape: "직사각형", answer: "4개" },
    { shape: "평행사변형", answer: "0개" },
    { shape: "직각삼각형", answer: "1개" },
  ];
  const item = choice(cases);
  return mkChoice(
    "g4-right-angle-count",
    "도형의 직각 개수를 고르세요.",
    item.shape,
    item.answer,
    ["0개", "1개", "2개", "4개"].filter((count) => count !== item.answer),
    `${item.shape}의 직각은 ${item.answer}입니다.`,
  );
}

function genG4ShapeSymmetryBasic(): Problem {
  return retopic("g4-shape-symmetry-basic", genLineSymmetryCount());
}

function genG4FractionBasic(): Problem {
  const total = choice([4, 5, 6, 8, 10, 12]);
  const shaded = randInt(1, total - 1);
  const answer = makeFrac(shaded, total);
  return {
    topicId: "g4-fraction-basic",
    prompt: "전체 중 색칠한 부분을 분수로 나타내세요.",
    expression: `${total}칸 중 ${shaded}칸이 색칠되어 있습니다.`,
    hint: `예: ${shaded}/${total}`,
    answer,
    kind: "fraction",
    answerText: rawFrac(answer),
    requireDenominator: total,
    solution: `전체 ${total}칸 중 ${shaded}칸이므로 ${rawFrac(answer)}입니다.`,
  };
}

function genG4FractionNumberline(): Problem {
  const denominator = choice([4, 5, 6, 8, 10]);
  const numerator = randInt(1, denominator - 1);
  const answer = makeFrac(numerator, denominator);
  return {
    topicId: "g4-fraction-numberline",
    prompt: "수직선에서 가리키는 값을 분수로 쓰세요.",
    expression: `0과 1 사이를 ${denominator}등분했을 때 ${numerator}번째 눈금`,
    hint: `예: ${numerator}/${denominator}`,
    answer,
    kind: "fraction",
    answerText: rawFrac(answer),
    requireDenominator: denominator,
    solution: `${denominator}등분 중 ${numerator}번째이므로 ${rawFrac(answer)}입니다.`,
  };
}

function genG4ImproperToMixed(): Problem {
  const denominator = randInt(3, 9);
  const whole = randInt(1, 4);
  const numerator = whole * denominator + randInt(1, denominator - 1);
  const answer = makeFrac(numerator, denominator);
  return {
    topicId: "g4-improper-to-mixed",
    prompt: "가분수를 대분수로 나타내세요.",
    expression: rawFrac(answer),
    hint: "예: 1 2/3",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${numerator} ÷ ${denominator} = ${whole} 나머지 ${numerator - whole * denominator}이므로 ${formatFrac(answer)}입니다.`,
  };
}

function genG4MixedToImproper(): Problem {
  const denominator = randInt(3, 9);
  const whole = randInt(1, 4);
  const numerator = randInt(1, denominator - 1);
  const answer = makeFrac(whole * denominator + numerator, denominator);
  return {
    topicId: "g4-mixed-to-improper",
    prompt: "대분수를 가분수로 나타내세요.",
    expression: `${whole} ${numerator}/${denominator}`,
    hint: "예: 7/3",
    answer,
    kind: "fraction",
    answerText: rawFrac(answer),
    requireDenominator: denominator,
    solution: `${whole} × ${denominator} + ${numerator} = ${answer.n}이므로 ${rawFrac(answer)}입니다.`,
  };
}

function genG4LikeDenomCompare(): Problem {
  const denominator = randInt(4, 12);
  const a = randInt(1, denominator - 1);
  const b = randInt(1, denominator - 1);
  return {
    topicId: "g4-like-denom-compare",
    prompt: "분모가 같은 두 분수의 크기를 비교하세요.",
    expression: `${a}/${denominator} □ ${b}/${denominator}`,
    hint: ">, <, = 중 하나",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `분모가 같을 때는 분자가 큰 분수가 더 큽니다.`,
  };
}

function genG4LikeDenomAdd(): Problem {
  const denominator = randInt(5, 12);
  const a = randInt(1, denominator - 2);
  const b = randInt(1, denominator - a);
  const answer = makeFrac(a + b, denominator);
  return {
    topicId: "g4-like-denom-add",
    prompt: "분모가 같은 분수의 덧셈을 계산하세요.",
    expression: `${a}/${denominator} + ${b}/${denominator}`,
    hint: `예: ${a + b}/${denominator}`,
    answer,
    kind: "fraction",
    answerText: rawFrac(answer),
    requireDenominator: denominator,
    solution: `분모는 그대로 두고 분자끼리 더하면 ${rawFrac(answer)}입니다.`,
  };
}

function genG4DecimalPlace(): Problem {
  const tenths = randInt(1, 9);
  const hundredths = randInt(1, 9);
  const value = Number(`${randInt(1, 9)}.${tenths}${hundredths}`);
  return mkInteger(
    "g4-decimal-place",
    "소수 둘째 자리 숫자가 나타내는 값을 1/100의 개수로 구하세요.",
    decimalText(value, 2),
    hundredths,
    `${decimalText(value, 2)}에서 소수 둘째 자리 숫자는 ${hundredths}이므로 1/100이 ${hundredths}개입니다.`,
  );
}

function genG4DecimalCompare(): Problem {
  const a = Number(`${randInt(1, 9)}.${randInt(0, 9)}${randInt(0, 9)}`);
  const b = Number(`${randInt(1, 9)}.${randInt(0, 9)}${randInt(0, 9)}`);
  return {
    topicId: "g4-decimal-compare",
    prompt: "두 소수의 크기를 비교해 □에 알맞은 기호를 쓰세요.",
    expression: `${decimalText(a, 2)} □ ${decimalText(b, 2)}`,
    hint: ">, <, = 중 하나",
    answer: compareSign(a, b),
    kind: "compare",
    solution: "자연수 부분부터 비교하고, 같으면 소수 첫째 자리와 둘째 자리를 차례로 비교합니다.",
  };
}

function genG4DecimalOrder(): Problem {
  const values = shuffle(Array.from({ length: 4 }, () => Number(`${randInt(1, 9)}.${randInt(0, 9)}${randInt(0, 9)}`)));
  const sorted = [...values].sort((a, b) => a - b);
  const answer = sorted.map((value) => decimalText(value, 2)).join(" < ");
  return mkChoice(
    "g4-decimal-order",
    "소수를 작은 것부터 차례대로 배열한 것을 고르세요.",
    values.map((value) => decimalText(value, 2)).join(", "),
    answer,
    [
      [...sorted].reverse().map((value) => decimalText(value, 2)).join(" < "),
      [sorted[0], sorted[2], sorted[1], sorted[3]].map((value) => decimalText(value, 2)).join(" < "),
      [sorted[1], sorted[0], sorted[2], sorted[3]].map((value) => decimalText(value, 2)).join(" < "),
    ],
    "자연수 부분과 소수 부분을 차례로 비교합니다.",
  );
}

function genG4DecimalAdd(): Problem {
  const a = randInt(12, 86);
  const b = randInt(11, 78);
  const answer = decimalText((a + b) / 10, 1);
  return mkChoice(
    "g4-decimal-add",
    "소수의 덧셈을 계산하세요.",
    `${decimalText(a / 10, 1)} + ${decimalText(b / 10, 1)}`,
    answer,
    [decimalText((a + b + 10) / 10, 1), decimalText((a + b - 1) / 10, 1), decimalText((a + b) / 100, 2), String(a + b)],
    `소수점을 맞추어 더하면 ${answer}입니다.`,
  );
}

function genG4DecimalSub(): Problem {
  const a = randInt(45, 98);
  const b = randInt(12, a - 5);
  const answer = decimalText((a - b) / 10, 1);
  return mkChoice(
    "g4-decimal-sub",
    "소수의 뺄셈을 계산하세요.",
    `${decimalText(a / 10, 1)} - ${decimalText(b / 10, 1)}`,
    answer,
    [decimalText((a - b + 10) / 10, 1), decimalText((a - b - 1) / 10, 1), decimalText((a - b) / 100, 2), String(a - b)],
    `소수점을 맞추어 빼면 ${answer}입니다.`,
  );
}

function genG4DecimalWord(): Problem {
  const a = randInt(15, 74);
  const b = randInt(12, 58);
  const answer = decimalText((a + b) / 10, 1);
  return mkChoice(
    "g4-decimal-word",
    "문장을 읽고 소수 계산으로 해결하세요.",
    `리본 ${decimalText(a / 10, 1)} m와 ${decimalText(b / 10, 1)} m를 이어 붙였습니다. 모두 몇 m입니까?`,
    answer,
    [decimalText((a + b + 5) / 10, 1), decimalText((a + b) / 100, 2), decimalText(Math.abs(a - b) / 10, 1), String(a + b)],
    `${decimalText(a / 10, 1)} + ${decimalText(b / 10, 1)} = ${answer} m입니다.`,
  );
}

function genG4PatternTable(): Problem {
  const start = randInt(2, 9);
  const step = randInt(3, 8);
  const n = randInt(4, 8);
  const answer = start + step * (n - 1);
  return withVisual(
    mkInteger(
      "g4-pattern-table",
      "표의 규칙을 찾아 빈칸의 수를 구하세요.",
      `1번째 ${start}, 2번째 ${start + step}, 3번째 ${start + step * 2}, ${n}번째 □`,
      answer,
      `매번 ${step}씩 늘어나므로 ${n}번째 수는 ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "규칙표",
      headers: ["순서", 1, 2, 3, n],
      rows: [["수", start, start + step, start + step * 2, "□"]],
    },
  );
}

function genG4TimeAdd(): Problem {
  const h = randInt(1, 2);
  const m = randInt(15, 55);
  const plus = randInt(20, 85);
  const total = h * 60 + m + plus;
  return mkInteger(
    "g4-time-add",
    "시간의 덧셈 결과를 분으로 구하세요.",
    `${h}시간 ${m}분 + ${plus}분`,
    total,
    `${h}시간은 ${h * 60}분이므로 모두 ${h * 60} + ${m} + ${plus} = ${total}분입니다.`,
  );
}

function genG4TimeSub(): Problem {
  const start = randInt(130, 240);
  const used = randInt(35, 95);
  return mkInteger(
    "g4-time-sub",
    "남은 시간을 분으로 구하세요.",
    `${start}분 중 ${used}분을 사용했습니다. 남은 시간`,
    start - used,
    `${start} - ${used} = ${start - used}분입니다.`,
  );
}

function genG4LengthConvert(): Problem {
  const prompt = "길이를 cm로 바꾸세요.";
  const meters = randInt(2, 9);
  const centimeters = randInt(1, 95);
  const answer = meters * 100 + centimeters;
  const expression = `${meters} m ${centimeters} cm`;
  const dir = detectUnitConversionDirection(prompt, expression);
  const dirHint = dir === "bigToSmall" ? "큰 단위(m)→작은 단위(cm) 변환입니다." : "";
  return mkInteger(
    "g4-length-convert",
    prompt,
    expression,
    answer,
    `${meters} m는 ${meters * 100} cm이므로 모두 ${answer} cm입니다.${dirHint ? " " + dirHint : ""}`,
  );
}

function genG4WeightConvert(): Problem {
  const prompt = "무게를 g으로 바꾸세요.";
  const kg = randInt(2, 8);
  const g = randInt(100, 950);
  const answer = kg * 1000 + g;
  const expression = `${kg} kg ${g} g`;
  const dir = detectUnitConversionDirection(prompt, expression);
  const dirHint = dir === "bigToSmall" ? "큰 단위(kg)→작은 단위(g) 변환입니다." : "";
  return mkInteger(
    "g4-weight-convert",
    prompt,
    expression,
    answer,
    `${kg} kg은 ${kg * 1000} g이므로 모두 ${answer} g입니다.${dirHint ? " " + dirHint : ""}`,
  );
}

function genG4MoneyTable(): Problem {
  const price = randInt(6, 18) * 100;
  const count = randInt(3, 9);
  const answer = price * count;
  return withVisual(
    mkInteger(
      "g4-money-table",
      "가격표를 보고 전체 금액을 구하세요.",
      `공책 한 권 ${price}원, ${count}권`,
      answer,
      `${price} × ${count} = ${numberText(answer)}원이 필요합니다.`,
    ),
    {
      type: "data-table",
      caption: "가격표",
      headers: ["물건", "한 개 가격", "개수"],
      rows: [["공책", `${price}원`, `${count}권`]],
    },
  );
}

function genG4ParallelPerpendicular(): Problem {
  const cases = [
    { expression: "만나지 않고 같은 간격을 유지하는 두 직선", answer: "평행" },
    { expression: "만나서 직각을 이루는 두 직선", answer: "수직" },
  ];
  const item = choice(cases);
  return mkChoice(
    "g4-parallel-perpendicular",
    "두 직선의 관계를 고르세요.",
    item.expression,
    item.answer,
    ["평행", "수직", "합동", "대칭"].filter((word) => word !== item.answer),
    `${item.expression}은 ${item.answer} 관계입니다.`,
  );
}

function genG4PolygonName(): Problem {
  const sides = randInt(3, 8);
  const names: Record<number, string> = { 3: "삼각형", 4: "사각형", 5: "오각형", 6: "육각형", 7: "칠각형", 8: "팔각형" };
  return mkChoice(
    "g4-polygon-name",
    "변의 수에 맞는 다각형 이름을 고르세요.",
    `변이 ${sides}개인 다각형`,
    names[sides]!,
    Object.values(names).filter((name) => name !== names[sides]),
    `변이 ${sides}개인 다각형은 ${names[sides]}입니다.`,
  );
}

function genG4RectanglePerimeter(): Problem {
  return retopic("g4-rectangle-perimeter", genRectanglePerimeter());
}

function genG4SquareAreaBasic(): Problem {
  const side = randInt(3, 15);
  return withVisual(
    mkInteger(
      "g4-square-area-basic",
      "정사각형의 넓이를 구하세요.",
      `한 변이 ${side} cm인 정사각형`,
      side * side,
      `${side} × ${side} = ${side * side} cm²입니다.`,
    ),
    { type: "square", side, unit: "cm" },
  );
}

function genG4GridArea(): Problem {
  const width = randInt(4, 14);
  const height = randInt(3, 10);
  return withVisual(
    mkInteger(
      "g4-grid-area",
      "직사각형의 넓이를 구하세요.",
      `가로 ${width} cm, 세로 ${height} cm`,
      width * height,
      `${width} × ${height} = ${width * height} cm²입니다.`,
    ),
    { type: "rectangle", width, height, unit: "cm" },
  );
}

function genG4AngleInShape(): Problem {
  return retopic("g4-angle-in-shape", genG4AngleSum());
}

function genG4BarGraphRead(): Problem {
  const labels = ["월", "화", "수", "목"];
  const values = labels.map(() => randInt(8, 35));
  const max = Math.max(...values);
  const answer = labels[values.indexOf(max)];
  return withVisual(
    mkChoice(
      "g4-bar-graph-read",
      "막대그래프에서 가장 큰 값을 가진 요일을 고르세요.",
      labels.map((label, index) => `${label}: ${values[index]}권`).join("  |  "),
      answer,
      labels.filter((label) => label !== answer),
      `가장 큰 값은 ${max}권이므로 ${answer}요일입니다.`,
    ),
    { type: "bar-chart", title: "요일별 읽은 책", unit: "권", items: labels.map((label, index) => ({ label, value: values[index]! })) },
  );
}

function genG4LineGraphRead(): Problem {
  const labels = ["1일", "2일", "3일", "4일"];
  const values = labels.map((_, index) => randInt(12, 25) + index * randInt(1, 4));
  const answer = values[values.length - 1] - values[0];
  return withVisual(
    mkInteger(
      "g4-line-graph-read",
      "꺾은선그래프를 보고 처음과 마지막 값의 차를 구하세요.",
      `${labels[0]} ${values[0]}개, ${labels[3]} ${values[3]}개`,
      answer,
      `${values[3]} - ${values[0]} = ${answer}개입니다.`,
    ),
    { type: "line-chart", title: "날짜별 기록", unit: "개", points: labels.map((label, index) => ({ label, value: values[index]! })) },
  );
}

function genG4DataTableTotal(): Problem {
  const rows = ["가", "나", "다"].map((name) => [name, randInt(12, 45)] as const);
  const answer = rows.reduce((sum, row) => sum + row[1], 0);
  return withVisual(
    mkInteger(
      "g4-data-table-total",
      "표의 자료를 모두 더하세요.",
      rows.map(([name, value]) => `${name}: ${value}`).join(", "),
      answer,
      `자료를 모두 더하면 ${answer}입니다.`,
    ),
    { type: "data-table", caption: "자료표", headers: ["항목", "수"], rows: rows.map(([name, value]) => [name, value]) },
  );
}

function genG4DataTableDifference(): Problem {
  const a = randInt(30, 80);
  const b = randInt(10, a - 5);
  return withVisual(
    mkInteger(
      "g4-data-table-difference",
      "표에서 두 값의 차를 구하세요.",
      `A반 ${a}개, B반 ${b}개`,
      a - b,
      `${a} - ${b} = ${a - b}개입니다.`,
    ),
    { type: "data-table", caption: "반별 수집 수", headers: ["반", "개수"], rows: [["A반", a], ["B반", b]] },
  );
}

function genG4GraphMaxMin(): Problem {
  const labels = ["봄", "여름", "가을", "겨울"];
  const values = labels.map(() => randInt(15, 55));
  const answer = Math.max(...values) - Math.min(...values);
  return withVisual(
    mkInteger(
      "g4-graph-max-min",
      "그래프에서 가장 큰 값과 가장 작은 값의 차를 구하세요.",
      labels.map((label, index) => `${label}: ${values[index]}`).join(", "),
      answer,
      `가장 큰 값에서 가장 작은 값을 빼면 ${answer}입니다.`,
    ),
    { type: "bar-chart", title: "계절별 기록", unit: "개", items: labels.map((label, index) => ({ label, value: values[index]! })) },
  );
}

function genG4AveragePreview(): Problem {
  return retopic("g4-average-preview", genAverageBasic());
}

function genG4EstimateSum(): Problem {
  return retopic("g4-estimate-sum", genEstimateSumRound());
}

function genG4EstimateProduct(): Problem {
  const a = randInt(24, 86);
  const b = randInt(3, 9);
  const rounded = Math.round(a / 10) * 10;
  return mkInteger(
    "g4-estimate-product",
    "어림한 곱을 구하세요.",
    `${a} × ${b}을 십의 자리로 어림`,
    rounded * b,
    `${a}를 ${rounded}으로 어림하면 ${rounded} × ${b} = ${rounded * b}입니다.`,
  );
}

function genG4MixedAddSub(): Problem {
  return retopic("g4-mixed-addsub", genAddSub());
}

function genG4MixedMulDiv(): Problem {
  return retopic("g4-mixed-muldiv", choice([genG4Mul3x2, genG4Div3By1, genG4DivisionRemainder])());
}

function genG4WordTwoStep(): Problem {
  const price = randInt(5, 18) * 100;
  const count = randInt(3, 8);
  const paid = price * count + randInt(2, 9) * 100;
  return mkInteger(
    "g4-word-two-step",
    "두 단계로 해결하는 문장제를 계산하세요.",
    `${price}원짜리 간식 ${count}개를 사고 ${paid}원을 냈습니다. 거스름돈은 얼마입니까?`,
    paid - price * count,
    `간식값은 ${price} × ${count} = ${price * count}원, 거스름돈은 ${paid - price * count}원입니다.`,
  );
}

function genG4CheckCalculation(): Problem {
  const divisor = randInt(3, 9);
  const quotient = randInt(24, 86);
  const remainder = randInt(0, divisor - 1);
  const dividend = divisor * quotient + remainder;
  return mkInteger(
    "g4-check-calculation",
    "나눗셈 검산식을 완성하세요.",
    `${dividend} ÷ ${divisor} = ${quotient} ... ${remainder}일 때 ${divisor} × ${quotient} + ${remainder}`,
    dividend,
    `나눗셈 검산은 나누는 수 × 몫 + 나머지 = 나누어지는 수입니다.`,
  );
}

function genG4SkipCounting(): Problem {
  const step = choice([1000, 10000, 100000]);
  const start = randInt(2, 8) * step;
  const blankIndex = randInt(1, 4);
  const values = Array.from({ length: 5 }, (_, index) => start + index * step);
  const answer = values[blankIndex]!;
  return mkInteger(
    "g4-skip-counting",
    "규칙에 따라 뛰어 세어 빈칸의 수를 구하세요.",
    values.map((value, index) => (index === blankIndex ? "□" : numberText(value))).join(" , "),
    answer,
    `같은 간격으로 ${numberText(step)}씩 커지므로 빈칸은 ${numberText(answer)}입니다.`,
  );
}

function genG4AngleCompareBasic(): Problem {
  const a = choice([25, 35, 45, 60, 75, 90, 105, 120]);
  const b = choice([30, 40, 55, 70, 90, 110, 130]);
  return {
    topicId: "g4-angle-compare-basic",
    prompt: "두 각의 크기를 비교해 □에 알맞은 기호를 쓰세요.",
    expression: `${a} □ ${b}`,
    hint: ">, <, = 중 하나",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `${a}°와 ${b}°를 비교하면 ${a === b ? "같습니다" : a > b ? `${a}°가 더 큽니다` : `${b}°가 더 큽니다`}.`,
  };
}

function genG4AngleEstimate(): Problem {
  const cases = [
    { expression: "직각보다 훨씬 작고, 45도보다 조금 작은 각", answer: "약 30°" },
    { expression: "직각과 거의 같은 각", answer: "약 90°" },
    { expression: "직각보다 크고, 일직선보다 작은 둔각", answer: "약 120°" },
    { expression: "일직선보다 조금 작은 큰 각", answer: "약 170°" },
  ];
  const item = choice(cases);
  return mkChoice(
    "g4-angle-estimate",
    "설명을 보고 각도를 어림한 값을 고르세요.",
    item.expression,
    item.answer,
    cases.map((candidate) => candidate.answer).filter((answer) => answer !== item.answer),
    `각의 모양을 직각 90°와 비교해 어림하면 ${item.answer}가 가장 알맞습니다.`,
  );
}

function genG4AngleDifference(): Problem {
  const big = choice([95, 110, 125, 140, 155, 170]);
  const small = choice([25, 35, 45, 55, 65, 75]);
  return mkInteger(
    "g4-angle-difference",
    "두 각의 크기의 차를 구하세요.",
    `${big}°와 ${small}°의 차`,
    big - small,
    `${big} - ${small} = ${big - small}°입니다.`,
  );
}

function genG4TriangleAngleSum(): Problem {
  const a = randInt(35, 80);
  const b = randInt(40, 85);
  const answer = 180 - a - b;
  return mkInteger(
    "g4-triangle-angle-sum",
    "삼각형의 세 각의 크기의 합을 이용해 나머지 각을 구하세요.",
    `삼각형의 두 각이 ${a}°, ${b}°일 때 나머지 각`,
    answer,
    `삼각형의 세 각의 합은 180°이므로 180 - ${a} - ${b} = ${answer}°입니다.`,
  );
}

function genG4QuadrilateralAngleSum(): Problem {
  return sample<Problem>(() => {
    const a = randInt(65, 120);
    const b = randInt(65, 120);
    const c = randInt(65, 120);
    const answer = 360 - a - b - c;
    if (answer < 40 || answer > 160) return null;
    return mkInteger(
      "g4-quadrilateral-angle-sum",
      "사각형의 네 각의 크기의 합을 이용해 나머지 각을 구하세요.",
      `사각형의 세 각이 ${a}°, ${b}°, ${c}°일 때 나머지 각`,
      answer,
      `사각형의 네 각의 합은 360°이므로 360 - ${a} - ${b} - ${c} = ${answer}°입니다.`,
    );
  }, mkInteger("g4-quadrilateral-angle-sum", "사각형의 네 각의 크기의 합을 이용해 나머지 각을 구하세요.", "사각형의 세 각이 80°, 95°, 100°일 때 나머지 각", 85, "사각형의 네 각의 합은 360°이므로 360 - 80 - 95 - 100 = 85°입니다."));
}

function genG4Div3By2(): Problem {
  return sample<Problem>(() => {
    const divisor = randInt(12, 49);
    const answer = randInt(3, 26);
    const dividend = divisor * answer;
    if (dividend < 100 || dividend > 999) return null;
    return mkInteger(
      "g4-div-3by2",
      "세 자리 수를 두 자리 수로 나누어 몫을 구하세요.",
      `${dividend} ÷ ${divisor}`,
      answer,
      `${divisor} × ${answer} = ${dividend}이므로 몫은 ${answer}입니다.`,
    );
  }, mkInteger("g4-div-3by2", "세 자리 수를 두 자리 수로 나누어 몫을 구하세요.", "312 ÷ 24", 13, "24 × 13 = 312이므로 몫은 13입니다."));
}

function genG4MotionSlide(): Problem {
  return mkChoice(
    "g4-motion-slide",
    "도형을 모양과 방향은 그대로 두고 위치만 옮기는 이동을 고르세요.",
    "오른쪽으로 3칸, 아래쪽으로 2칸 옮겼습니다.",
    "밀기",
    ["뒤집기", "돌리기", "확대하기"],
    "위치만 바뀌고 모양과 방향이 그대로이면 밀기입니다.",
  );
}

function genG4MotionFlip(): Problem {
  return mkChoice(
    "g4-motion-flip",
    "거울에 비친 것처럼 좌우 또는 상하가 바뀌는 이동을 고르세요.",
    "왼쪽과 오른쪽이 서로 바뀐 모양",
    "뒤집기",
    ["밀기", "돌리기", "줄이기"],
    "거울에 비친 것처럼 방향이 바뀌면 뒤집기입니다.",
  );
}

function genG4MotionTurn(): Problem {
  const angle = choice([90, 180, 270]);
  return mkChoice(
    "g4-motion-turn",
    "도형을 한 점을 중심으로 움직인 방법을 고르세요.",
    `도형을 시계 방향으로 ${angle}° 움직였습니다.`,
    "돌리기",
    ["밀기", "뒤집기", "평행선 긋기"],
    `한 점을 중심으로 ${angle}° 움직이는 것은 돌리기입니다.`,
  );
}

function genG4MotionCombine(): Problem {
  return mkChoice(
    "g4-motion-combine",
    "두 가지 이동을 순서대로 적용한 설명을 고르세요.",
    "도형을 오른쪽으로 옮긴 뒤, 위아래가 바뀌게 만들었습니다.",
    "밀기 후 뒤집기",
    ["뒤집기 후 돌리기", "돌리기 후 밀기", "확대 후 줄이기"],
    "처음에는 위치만 옮겼고, 다음에는 거울처럼 바뀌었으므로 밀기 후 뒤집기입니다.",
  );
}

function genG4MotionPattern(): Problem {
  return mkChoice(
    "g4-motion-pattern",
    "무늬 꾸미기에 쓰인 평면도형의 이동 방법을 고르세요.",
    "같은 도형이 오른쪽으로 일정하게 반복되어 줄무늬를 만들었습니다.",
    "밀기",
    ["뒤집기", "돌리기", "대각선"],
    "같은 방향과 모양으로 일정하게 반복되면 밀기를 이용한 무늬입니다.",
  );
}

function genG4BarGraphScale(): Problem {
  const scale = choice([2, 5, 10]);
  const bars = randInt(3, 9);
  const answer = scale * bars;
  return withVisual(
    mkInteger(
      "g4-bar-graph-scale",
      "막대그래프의 한 칸 크기를 이용해 값을 구하세요.",
      `한 칸이 ${scale}명이고 막대가 ${bars}칸입니다.`,
      answer,
      `${scale}명씩 ${bars}칸이므로 ${scale} × ${bars} = ${answer}명입니다.`,
    ),
    { type: "bar-chart", title: "동아리 신청", unit: "명", items: [{ label: "수학", value: answer }], referenceValue: scale },
  );
}

function genG4BarGraphMissing(): Problem {
  const labels = ["가", "나", "다"];
  const a = randInt(12, 28);
  const b = randInt(10, 24);
  const answer = randInt(8, 22);
  const total = a + b + answer;
  return withVisual(
    mkInteger(
      "g4-bar-graph-missing",
      "전체 합을 이용해 빠진 막대그래프 값을 구하세요.",
      `가 ${a}개, 나 ${b}개, 다 □개, 전체 ${total}개`,
      answer,
      `${total} - ${a} - ${b} = ${answer}개입니다.`,
    ),
    { type: "bar-chart", title: "반별 기록", unit: "개", items: labels.map((label, index) => ({ label, value: index === 0 ? a : index === 1 ? b : answer })) },
  );
}

function genG4PatternNumberArray(): Problem {
  const start = randInt(2, 9);
  const step = randInt(2, 7);
  const answer = start + step * 4;
  return withVisual(
    mkInteger(
      "g4-pattern-number-array",
      "수 배열의 규칙을 찾아 빈칸의 수를 구하세요.",
      `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, □`,
      answer,
      `앞 수보다 ${step}씩 커지므로 빈칸은 ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "수 배열",
      headers: ["차례", 1, 2, 3, 4, 5],
      rows: [["수", start, start + step, start + step * 2, start + step * 3, "□"]],
    },
  );
}

function genG4PatternShapeArray(): Problem {
  const start = randInt(2, 5);
  const step = randInt(2, 4);
  const n = randInt(5, 8);
  const answer = start + step * (n - 1);
  return mkInteger(
    "g4-pattern-shape-array",
    "도형 배열의 개수 규칙을 찾아 구하세요.",
    `1번째 ${start}개, 2번째 ${start + step}개, 3번째 ${start + step * 2}개일 때 ${n}번째`,
    answer,
    `매번 ${step}개씩 늘어나므로 ${n}번째는 ${answer}개입니다.`,
  );
}

function genG4PatternEquation(): Problem {
  const multiplier = randInt(2, 6);
  const offset = randInt(1, 5);
  const n = randInt(4, 9);
  const answer = n * multiplier + offset;
  return mkInteger(
    "g4-pattern-equation",
    "계산식의 규칙을 이용해 값을 구하세요.",
    `${n}번째 수 = ${n} × ${multiplier} + ${offset}`,
    answer,
    `${n} × ${multiplier} + ${offset} = ${answer}입니다.`,
  );
}

function genG4LikeDenomSub(): Problem {
  const denominator = randInt(5, 12);
  const a = randInt(2, denominator - 1);
  const b = randInt(1, a - 1);
  const answer = makeFrac(a - b, denominator);
  return {
    topicId: "g4-like-denom-sub",
    prompt: "분모가 같은 분수의 뺄셈을 계산하세요.",
    expression: `${a}/${denominator} - ${b}/${denominator}`,
    hint: `예: ${a - b}/${denominator}`,
    answer,
    kind: "fraction",
    answerText: rawFrac(answer),
    requireDenominator: denominator,
    solution: `분모는 그대로 두고 분자끼리 빼면 ${rawFrac(answer)}입니다.`,
  };
}

function genG4MixedLikeDenomAdd(): Problem {
  const denominator = randInt(4, 10);
  const wholeA = randInt(1, 4);
  const wholeB = randInt(1, 3);
  const a = randInt(1, denominator - 1);
  const b = randInt(1, denominator - 1);
  const answer = makeFrac((wholeA + wholeB) * denominator + a + b, denominator);
  return {
    topicId: "g4-mixed-like-denom-add",
    prompt: "분모가 같은 대분수의 덧셈을 계산하세요.",
    expression: `${wholeA} ${a}/${denominator} + ${wholeB} ${b}/${denominator}`,
    hint: "예: 3 2/5",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `자연수끼리, 분수끼리 더하면 ${formatFrac(answer)}입니다.`,
  };
}

function genG4MixedLikeDenomSub(): Problem {
  const denominator = randInt(4, 10);
  const wholeA = randInt(3, 7);
  const wholeB = randInt(1, wholeA - 1);
  const a = randInt(1, denominator - 1);
  const b = randInt(1, denominator - 1);
  const left = wholeA * denominator + a;
  const right = wholeB * denominator + b;
  const answer = makeFrac(left - right, denominator);
  return {
    topicId: "g4-mixed-like-denom-sub",
    prompt: "분모가 같은 대분수의 뺄셈을 계산하세요.",
    expression: `${wholeA} ${a}/${denominator} - ${wholeB} ${b}/${denominator}`,
    hint: "예: 2 1/4",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `대분수를 가분수로 생각해 빼면 ${formatFrac(answer)}입니다.`,
  };
}

function genG4IsoscelesAngle(): Problem {
  const vertex = choice([40, 50, 60, 70, 80, 100]);
  const answer = (180 - vertex) / 2;
  return mkInteger(
    "g4-isosceles-angle",
    "이등변삼각형의 두 밑각 중 한 각을 구하세요.",
    `꼭지각이 ${vertex}°인 이등변삼각형의 한 밑각`,
    answer,
    `이등변삼각형의 두 밑각은 같으므로 (180 - ${vertex}) ÷ 2 = ${answer}°입니다.`,
  );
}

function genG4EquilateralAngle(): Problem {
  return mkInteger(
    "g4-equilateral-angle",
    "정삼각형의 한 각의 크기를 구하세요.",
    "정삼각형의 한 각",
    60,
    "정삼각형은 세 각이 모두 같고 합이 180°이므로 한 각은 60°입니다.",
  );
}

function genG4DecimalRelation(): Problem {
  return mkInteger(
    "g4-decimal-relation",
    "소수의 자리 관계를 구하세요.",
    "0.1은 0.01이 몇 개인 수입니까?",
    10,
    "0.1 = 0.10이므로 0.01이 10개입니다.",
  );
}

function genG4DecimalTwoAdd(): Problem {
  const a = randInt(120, 875);
  const b = randInt(110, 690);
  const answer = decimalText((a + b) / 100, 2);
  return mkChoice(
    "g4-decimal-two-add",
    "소수 두 자리 수의 덧셈을 계산하세요.",
    `${decimalText(a / 100, 2)} + ${decimalText(b / 100, 2)}`,
    answer,
    [decimalText((a + b + 10) / 100, 2), decimalText((a + b - 1) / 100, 2), decimalText((a + b) / 10, 1), String(a + b)],
    `소수점을 맞추어 더하면 ${answer}입니다.`,
  );
}

function genG4DecimalTwoSub(): Problem {
  const a = randInt(420, 980);
  const b = randInt(110, a - 50);
  const answer = decimalText((a - b) / 100, 2);
  return mkChoice(
    "g4-decimal-two-sub",
    "소수 두 자리 수의 뺄셈을 계산하세요.",
    `${decimalText(a / 100, 2)} - ${decimalText(b / 100, 2)}`,
    answer,
    [decimalText((a - b + 10) / 100, 2), decimalText((a - b - 1) / 100, 2), decimalText((a - b) / 10, 1), String(a - b)],
    `소수점을 맞추어 빼면 ${answer}입니다.`,
  );
}

function genG4ParallelDistance(): Problem {
  return mkChoice(
    "g4-parallel-distance",
    "평행선 사이의 거리에 대한 바른 설명을 고르세요.",
    "두 평행선 사이에 수선을 여러 개 그었습니다.",
    "수선의 길이는 모두 같습니다",
    ["만나는 각이 모두 달라집니다", "두 직선은 한 점에서 만납니다", "거리는 잴 때마다 달라집니다"],
    "평행선 사이의 거리는 어느 곳에서 재도 같습니다.",
  );
}

function genG4TrapezoidProperty(): Problem {
  return mkChoice(
    "g4-trapezoid-property",
    "사다리꼴의 성질로 알맞은 것을 고르세요.",
    "사다리꼴",
    "한 쌍의 대변이 서로 평행합니다",
    ["네 변이 모두 같습니다", "두 쌍의 대변이 모두 평행합니다", "세 각이 모두 같습니다"],
    "사다리꼴은 한 쌍의 대변이 서로 평행한 사각형입니다.",
  );
}

function genG4ParallelogramProperty(): Problem {
  return mkChoice(
    "g4-parallelogram-property",
    "평행사변형의 성질로 알맞은 것을 고르세요.",
    "평행사변형",
    "마주 보는 두 쌍의 변이 서로 평행합니다",
    ["한 쌍의 대변만 평행합니다", "세 변의 길이가 같습니다", "모든 각이 60°입니다"],
    "평행사변형은 마주 보는 두 쌍의 변이 서로 평행합니다.",
  );
}

function genG4RhombusProperty(): Problem {
  return mkChoice(
    "g4-rhombus-property",
    "마름모의 성질로 알맞은 것을 고르세요.",
    "마름모",
    "네 변의 길이가 모두 같습니다",
    ["한 각만 직각입니다", "대변이 전혀 평행하지 않습니다", "변이 3개입니다"],
    "마름모는 네 변의 길이가 모두 같은 사각형입니다.",
  );
}

function genG4RectangleSquareProperty(): Problem {
  return mkChoice(
    "g4-rectangle-square-property",
    "직사각형과 정사각형에 공통으로 맞는 성질을 고르세요.",
    "직사각형과 정사각형",
    "네 각이 모두 직각입니다",
    ["네 변의 길이가 반드시 모두 같습니다", "대각선이 없습니다", "평행한 변이 없습니다"],
    "직사각형과 정사각형은 모두 네 각이 직각입니다.",
  );
}

function genG4LineGraphChange(): Problem {
  const first = randInt(12, 25);
  const second = first + randInt(3, 12);
  const third = second + randInt(2, 10);
  const labels = ["월", "화", "수"];
  const values = [first, second, third];
  return withVisual(
    mkInteger(
      "g4-line-graph-change",
      "꺾은선그래프에서 가장 나중 값과 처음 값의 차를 구하세요.",
      `월 ${first}개, 수 ${third}개`,
      third - first,
      `${third} - ${first} = ${third - first}개입니다.`,
    ),
    { type: "line-chart", title: "날짜별 기록", unit: "개", points: labels.map((label, index) => ({ label, value: values[index]! })) },
  );
}

function genG4LineGraphPredict(): Problem {
  const start = randInt(5, 14);
  const step = randInt(2, 6);
  const labels = ["1일", "2일", "3일", "4일"];
  const values = labels.map((_, index) => start + step * index);
  const answer = start + step * 4;
  return withVisual(
    mkInteger(
      "g4-line-graph-predict",
      "일정하게 변하는 꺾은선그래프의 다음 값을 구하세요.",
      `1일 ${values[0]}개, 2일 ${values[1]}개, 3일 ${values[2]}개, 4일 ${values[3]}개일 때 5일`,
      answer,
      `매일 ${step}개씩 늘어나므로 5일은 ${answer}개입니다.`,
    ),
    { type: "line-chart", title: "날짜별 기록", unit: "개", points: labels.map((label, index) => ({ label, value: values[index]! })) },
  );
}

function genG4RegularPolygonBasic(): Problem {
  return mkChoice(
    "g4-regular-polygon-basic",
    "정다각형의 뜻으로 알맞은 것을 고르세요.",
    "정다각형",
    "변의 길이가 모두 같고 각의 크기가 모두 같은 다각형",
    ["변의 수가 4개인 모든 도형", "각이 하나라도 직각인 도형", "대각선이 없는 도형"],
    "정다각형은 모든 변의 길이와 모든 각의 크기가 각각 같습니다.",
  );
}

function genG4RegularPolygonPerimeter(): Problem {
  const sides = choice([5, 6, 8]);
  const side = randInt(3, 12);
  return mkInteger(
    "g4-regular-polygon-perimeter",
    "정다각형의 둘레를 구하세요.",
    `한 변이 ${side} cm인 정${sides}각형`,
    sides * side,
    `${side} × ${sides} = ${sides * side} cm입니다.`,
  );
}

function genG4PolygonDiagonal(): Problem {
  const sides = randInt(4, 8);
  const answer = (sides * (sides - 3)) / 2;
  return mkInteger(
    "g4-polygon-diagonal",
    "다각형의 대각선 수를 구하세요.",
    `${sides}각형의 대각선 수`,
    answer,
    `${sides}각형의 대각선 수는 ${sides} × (${sides} - 3) ÷ 2 = ${answer}개입니다.`,
  );
}

function genG4PrepRelationBasic(): Problem {
  return retopic("g4-prep-relation-basic", choice([genRateValue, genTableMissing, genFormulaChoice])());
}

function genG4AreaTrianglePrep(): Problem {
  return retopic("g4-area-triangle-prep", genTriangleArea());
}

function genG4AreaTrapezoidPrep(): Problem {
  return retopic("g4-area-trapezoid-prep", genTrapezoidArea());
}

// ── 6학년 3월~다음 해 2월 추가 학습 ───────────────────────

const G6_SHARE_CONTEXTS = [
  { item: "과학 실험용 색 물", unit: "L", group: "모둠 컵", countUnit: "개", each: "한 컵에 담기는 양" },
  { item: "현수막 리본", unit: "m", group: "학생", countUnit: "명", each: "한 명이 받는 길이" },
  { item: "찰흙", unit: "kg", group: "작품", countUnit: "개", each: "한 작품에 쓰는 양" },
  { item: "텃밭 거름", unit: "kg", group: "화분", countUnit: "개", each: "한 화분에 넣는 양" },
];

const G6_DECIMAL_SHARE_CONTEXTS = [
  { item: "코딩 로봇이 이동한 거리", unit: "m", target: "한 번에 이동한 거리", particle: "는" },
  { item: "전시용 종이 끈", unit: "m", target: "한 장식에 쓰는 길이", particle: "는" },
  { item: "학급 텃밭에 뿌릴 물", unit: "L", target: "한 구역에 뿌리는 양", particle: "은" },
  { item: "관찰 기록지 묶음의 무게", unit: "kg", target: "한 묶음의 무게", particle: "는" },
];

const G6_RATIO_CONTEXTS = [
  { left: "완성한 과제", right: "남은 과제", unit: "개" },
  { left: "참여한 학생", right: "참여하지 않은 학생", unit: "명" },
  { left: "파란 타일", right: "노란 타일", unit: "개" },
  { left: "물", right: "원액", unit: "컵" },
];

const G6_PERCENT_CONTEXTS = [
  { total: "체험 활동 신청자", unit: "명", part: "참가 확정자" },
  { total: "읽기 목표 쪽수", unit: "쪽", part: "읽은 쪽수" },
  { total: "저금 목표액", unit: "원", part: "모은 금액" },
  { total: "학급 설문 응답자", unit: "명", part: "찬성한 학생" },
];

const G6_GRAPH_CONTEXTS = [
  { title: "학급 프로젝트 주제", labels: ["환경", "과학", "역사"] },
  { title: "방과 후 활동 선호도", labels: ["독서", "운동", "음악"] },
  { title: "급식 메뉴 선호도", labels: ["한식", "분식", "양식"] },
  { title: "학습 도구 사용 비율", labels: ["태블릿", "공책", "교구"] },
];

const G6_CUBOID_CONTEXTS = [
  "수학 교구 상자",
  "학급 자료 보관함",
  "입체 모형 포장 상자",
  "전시 작품 받침대",
];

function genG6QuotientFractionProper(): Problem {
  const denominator = randInt(3, 12);
  const numerator = randInt(1, denominator - 1);
  const answer = makeFrac(numerator, denominator);
  return withVisual(
    {
      topicId: "g6-quotient-fraction-proper",
      prompt: "나눗셈의 몫을 분수로 나타내세요.",
      expression: `${numerator} ÷ ${denominator}`,
      hint: `예: ${numerator}/${denominator}`,
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `${numerator} ÷ ${denominator}은 나누어지는 수를 분자, 나누는 수를 분모로 하여 ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", title: "0과 1 사이를 나눈 분수 막대", numerator, denominator },
  );
}

function genG6QuotientFractionMixed(): Problem {
  const denominator = randInt(3, 9);
  const quotient = randInt(1, 4);
  const remainder = randInt(1, denominator - 1);
  const numerator = quotient * denominator + remainder;
  const answer = makeFrac(numerator, denominator);
  return {
    topicId: "g6-quotient-fraction-mixed",
    prompt: "몫이 1보다 큰 나눗셈을 대분수로 나타내세요.",
    expression: `${numerator} ÷ ${denominator}`,
    hint: "예: 1 2/3",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${numerator} ÷ ${denominator} = ${formatFrac(answer)}입니다.`,
  };
}

function genG6FractionDivideIntegerSimple(): Problem {
  const divisor = randInt(2, 6);
  const denominator = randInt(5, 14);
  const quotientNumerator = randInt(1, 5);
  const numerator = quotientNumerator * divisor;
  const answer = reduceFrac(makeFrac(quotientNumerator, denominator));
  return {
    topicId: "g6-fraction-divide-integer-simple",
    prompt: "분자가 자연수의 배수인 분수 나눗셈을 계산하세요.",
    expression: `${numerator}/${denominator} ÷ ${divisor}`,
    hint: "분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `분자를 ${divisor}로 나누면 ${quotientNumerator}/${denominator} = ${formatFrac(answer)}입니다.`,
  };
}

function genG6FractionDivideIntegerMultiply(): Problem {
  const f = properFraction(12);
  const divisor = randInt(2, 8);
  const answer = reduceFrac(makeFrac(f.n, f.d * divisor));
  return {
    topicId: "g6-fraction-divide-integer-multiply",
    prompt: "분수 나눗셈을 곱셈으로 바꾸어 계산하세요.",
    expression: `${rawFrac(f)} ÷ ${divisor}`,
    hint: "분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${rawFrac(f)} ÷ ${divisor} = ${rawFrac(f)} × 1/${divisor} = ${formatFrac(answer)}입니다.`,
  };
}

function genG6MixedDivideInteger(): Problem {
  const denominator = randInt(3, 9);
  const whole = randInt(1, 4);
  const numerator = randInt(1, denominator - 1);
  const divisor = randInt(2, 5);
  const improper = makeFrac(whole * denominator + numerator, denominator);
  const answer = reduceFrac(makeFrac(improper.n, improper.d * divisor));
  return {
    topicId: "g6-mixed-divide-integer",
    prompt: "대분수를 가분수로 바꾸어 자연수로 나누세요.",
    expression: `${whole} ${numerator}/${denominator} ÷ ${divisor}`,
    hint: "분수 또는 대분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${whole} ${numerator}/${denominator} = ${rawFrac(improper)}이고, ${rawFrac(improper)} ÷ ${divisor} = ${formatFrac(answer)}입니다.`,
  };
}

function genG6FractionDivideIntegerWord(): Problem {
  const denominator = randInt(4, 12);
  const numerator = randInt(2, denominator - 1);
  const people = randInt(2, 5);
  const answer = reduceFrac(makeFrac(numerator, denominator * people));
  const context = choice(G6_SHARE_CONTEXTS);
  const recipient = context.countUnit === "명" ? `${people}명의 ${context.group}에게` : `${people}개의 ${context.group}에`;
  return withVisual(
    {
      topicId: "g6-fraction-divide-integer-word",
      prompt: "문장을 읽고 분수 나눗셈으로 해결하세요.",
      expression: `${context.item} ${numerator}/${denominator} ${context.unit}를 ${recipient} 똑같이 나눕니다. ${context.each}`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: `${formatFrac(answer)} ${context.unit}`,
      solution: `${numerator}/${denominator} ÷ ${people} = ${formatFrac(answer)} ${context.unit}입니다.`,
    },
    { type: "fraction-strip", title: `${context.item}를 똑같이 나누기 전`, numerator, denominator },
  );
}

function genG6DecimalDivideNaturalExact(): Problem {
  const divisor = randInt(2, 9);
  const quotient = randInt(12, 95);
  const dividend = divisor * quotient;
  const places = choice([1, 2]);
  const expression = `${decimalText(dividend / 10 ** places, places)} ÷ ${divisor}`;
  const answer = decimalText(quotient / 10 ** places, places);
  return mkChoice(
    "g6-decimal-divide-natural-exact",
    "소수를 자연수로 나누어 계산하세요.",
    expression,
    answer,
    [decimalText((quotient + 10) / 10 ** places, places), decimalText(quotient / 10 ** (places + 1), places + 1), String(quotient)],
    `자연수처럼 나누고 소수점 위치를 맞추면 ${answer}입니다.`,
  );
}

function genG6DecimalDivideNaturalNonExact(): Problem {
  const divisor = choice([3, 4, 6, 8]);
  const quotient = randInt(12, 88);
  const dividend = divisor * quotient + divisor / 2;
  const answer = decimalText((dividend / divisor) / 10, 2);
  return mkChoice(
    "g6-decimal-divide-natural-nonexact",
    "각 자리에서 바로 나누어떨어지지 않는 소수 나눗셈을 계산하세요.",
    `${decimalText(dividend / 10, 1)} ÷ ${divisor}`,
    answer,
    [decimalText((dividend / divisor) / 100, 2), decimalText((dividend / divisor + 1) / 10, 2), String(Math.round(dividend / divisor))],
    `필요하면 0을 붙여 계속 나누면 ${answer}입니다.`,
  );
}

function genG6DecimalDivideLessThanOne(): Problem {
  const divisor = randInt(4, 9);
  const quotient = randInt(2, 9);
  const dividend = divisor * quotient;
  const answer = decimalText(quotient / 100, 2);
  return mkChoice(
    "g6-decimal-divide-less-than-one",
    "몫이 1보다 작은 소수 나눗셈을 계산하세요.",
    `${decimalText(dividend / 100, 2)} ÷ ${divisor}`,
    answer,
    [decimalText(quotient / 10, 1), decimalText((quotient + 1) / 100, 2), String(quotient)],
    `나누어지는 수가 작아도 소수점 위치를 맞추면 ${answer}입니다.`,
  );
}

function genG6DecimalDivideRemainder(): Problem {
  const divisor = randInt(2, 9);
  const quotient = randInt(11, 79);
  const dividend = divisor * quotient;
  const places = 2;
  return mkInteger(
    "g6-decimal-divide-remainder",
    "소수 나눗셈의 몫을 1/100의 개수로 생각해 구하세요.",
    `${decimalText(dividend / 100, places)} ÷ ${divisor}의 몫은 0.01이 몇 개입니까?`,
    quotient,
    `${decimalText(dividend / 100, places)}는 0.01이 ${dividend}개이고, ${dividend} ÷ ${divisor} = ${quotient}입니다.`,
  );
}

function genG6DecimalDivideWord(): Problem {
  const divisor = randInt(2, 8);
  const each = randInt(12, 85);
  const context = choice(G6_DECIMAL_SHARE_CONTEXTS);
  const total = decimalText((divisor * each) / 10, 1);
  const answer = decimalText(each / 10, 1);
  return mkChoice(
    "g6-decimal-divide-word",
    "문장을 읽고 소수 나눗셈으로 해결하세요.",
    `${context.item} ${total} ${context.unit}를 ${divisor}개로 똑같이 나누면 ${context.target}${context.particle} 몇 ${context.unit}입니까?`,
    answer,
    [decimalText((each + 5) / 10, 1), decimalText(each / 100, 2), String(each)],
    `${total} ÷ ${divisor} = ${answer} ${context.unit}입니다.`,
  );
}

function genG6DecimalDivideCheck(): Problem {
  const divisor = randInt(2, 9);
  const quotient = randInt(12, 86);
  const places = 1;
  const dividend = decimalText((divisor * quotient) / 10, places);
  return mkChoice(
    "g6-decimal-divide-check",
    "소수 나눗셈의 검산식으로 알맞은 것을 고르세요.",
    `${dividend} ÷ ${divisor} = ${decimalText(quotient / 10, 1)}`,
    `${decimalText(quotient / 10, 1)} × ${divisor} = ${dividend}`,
    [`${dividend} × ${divisor} = ${decimalText(quotient / 10, 1)}`, `${decimalText(quotient / 10, 1)} + ${divisor} = ${dividend}`, `${dividend} - ${divisor} = ${decimalText(quotient / 10, 1)}`],
    `나눗셈은 몫 × 나누는 수 = 나누어지는 수로 검산합니다.`,
  );
}

function genG6RatioWrite(): Problem {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const context = choice(G6_RATIO_CONTEXTS);
  return withVisual(
    mkChoice(
      "g6-ratio-write",
      "두 양의 관계를 비로 나타내세요.",
      `${context.left} ${a}${context.unit}, ${context.right} ${b}${context.unit}`,
      `${a}:${b}`,
      [`${b}:${a}`, `${a + b}:${b}`, `${a}:${a + b}`],
      `${context.left} 수에 대한 ${context.right} 수의 비는 ${a}:${b}입니다.`,
    ),
    { type: "ratio-strip", title: `${context.left}와 ${context.right} 비교`, leftLabel: context.left, rightLabel: context.right, left: a, right: b, unit: context.unit },
  );
}

function genG6RatioRateFraction(): Problem {
  const base = randInt(4, 15);
  const compare = randInt(1, base - 1);
  const answer = reduceFrac(makeFrac(compare, base));
  return withVisual(
    {
      topicId: "g6-ratio-rate-fraction",
      prompt: "비율을 분수로 나타내세요.",
      expression: `${compare}:${base}`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `비율은 비교하는 양 ÷ 기준량이므로 ${compare}/${base} = ${formatFrac(answer)}입니다.`,
    },
    { type: "ratio-strip", title: "비교하는 양과 기준량", leftLabel: "비교하는 양", rightLabel: "남은 양", left: compare, right: base - compare, unit: "칸", total: base },
  );
}

function genG6RatioRateDecimal(): Problem {
  const base = choice([4, 5, 8, 10, 20]);
  const compare = randInt(1, base - 1);
  const answer = decimalText(compare / base, 2);
  return withVisual(
    mkChoice(
      "g6-ratio-rate-decimal",
      "비율을 소수로 나타내세요.",
      `${compare}:${base}`,
      answer,
      [decimalText(base / compare, 2), decimalText((compare + 1) / base, 2), `${compare}/${base}`],
      `${compare} ÷ ${base} = ${answer}입니다.`,
    ),
    { type: "ratio-strip", title: "전체를 기준량으로 보기", leftLabel: "비교", rightLabel: "나머지", left: compare, right: base - compare, unit: "칸", total: base },
  );
}

function genG6PercentBasic(): Problem {
  const percentValue = choice([5, 10, 12, 20, 25, 40, 50, 75]);
  const answer = reduceFrac(makeFrac(percentValue, 100));
  return withVisual(
    {
      topicId: "g6-percent-basic",
      prompt: "백분율을 분수로 나타내세요.",
      expression: `${percentValue}%`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `${percentValue}%는 ${percentValue}/100 = ${formatFrac(answer)}입니다.`,
    },
    { type: "circle-chart", title: "백분율 원그림", unit: "%", items: [{ label: "해당 부분", value: percentValue }, { label: "나머지", value: 100 - percentValue }] },
  );
}

function genG6PercentOfQuantity(): Problem {
  const total = choice([80, 120, 160, 200, 240, 300]);
  const percentValue = choice([10, 20, 25, 40, 50, 75]);
  const context = choice(G6_PERCENT_CONTEXTS);
  return withVisual(
    mkInteger(
      "g6-percent-of-quantity",
      "전체의 백분율만큼의 양을 구하세요.",
      `${context.total} ${total}${context.unit} 중 ${percentValue}%에 해당하는 ${context.part}`,
      (total * percentValue) / 100,
      `${total} × ${percentValue}/100 = ${(total * percentValue) / 100}${context.unit}입니다.`,
    ),
    { type: "circle-chart", title: `${context.part} 비율`, unit: "%", items: [{ label: context.part, value: percentValue }, { label: "나머지", value: 100 - percentValue }] },
  );
}

function genG6QuantityFromPercent(): Problem {
  const percentValue = choice([10, 20, 25, 40, 50]);
  const part = choice([12, 16, 24, 30, 40, 60]);
  const total = (part * 100) / percentValue;
  const context = choice(G6_PERCENT_CONTEXTS);
  return withVisual(
    mkInteger(
      "g6-quantity-from-percent",
      "일부와 백분율을 보고 전체를 구하세요.",
      `${context.part} ${part}${context.unit}은 전체의 ${percentValue}%입니다. 전체 ${context.total}`,
      total,
      `전체 = ${part} ÷ ${percentValue}/100 = ${total}${context.unit}입니다.`,
    ),
    { type: "circle-chart", title: `${context.part}이 차지하는 비율`, unit: "%", items: [{ label: `${context.part} ${part}${context.unit}`, value: percentValue }, { label: "나머지", value: 100 - percentValue }] },
  );
}

function genG6BandGraphRead(): Problem {
  const a = choice([20, 25, 30, 35, 40]);
  const b = choice([15, 20, 25, 30]);
  const c = 100 - a - b;
  const context = choice(G6_GRAPH_CONTEXTS);
  const items = [
    { label: context.labels[0]!, value: a },
    { label: context.labels[1]!, value: b },
    { label: context.labels[2]!, value: c },
  ];
  const max = items.reduce((best, item) => (item.value > best.value ? item : best), items[0]!);
  return withVisual(
    mkChoice(
      "g6-band-graph-read",
      "띠그래프에서 비율이 가장 큰 항목을 고르세요.",
      items.map((item) => `${item.label} ${item.value}%`).join(", "),
      max.label,
      items.map((item) => item.label).filter((label) => label !== max.label),
      `가장 큰 백분율은 ${max.value}%이므로 ${max.label}입니다.`,
    ),
    { type: "ratio-strip", title: `띠그래프: ${context.title}`, leftLabel: max.label, rightLabel: "나머지", left: max.value, right: 100 - max.value, unit: "%", total: 100 },
  );
}

function genG6CircleGraphRead(): Problem {
  const percentValue = choice([10, 20, 25, 30, 40]);
  const total = choice([100, 120, 160, 200, 240]);
  const context = choice(G6_GRAPH_CONTEXTS);
  const label = choice(context.labels);
  return withVisual(
    mkInteger(
      "g6-circle-graph-read",
      "원그래프의 백분율을 보고 인원수를 구하세요.",
      `전체 ${total}명 중 ${label}을 선택한 학생 ${percentValue}%`,
      (total * percentValue) / 100,
      `${total} × ${percentValue}/100 = ${(total * percentValue) / 100}명입니다.`,
    ),
    { type: "circle-chart", title: `${context.title} 원그래프`, unit: "%", items: [{ label, value: percentValue }, { label: "기타", value: 100 - percentValue }] },
  );
}

function genG6PercentToAngle(): Problem {
  const percentValue = choice([10, 20, 25, 30, 40, 50]);
  return withVisual(
    mkInteger(
      "g6-percent-to-angle",
      "원그래프에서 백분율에 해당하는 중심각을 구하세요.",
      `${percentValue}%에 해당하는 중심각`,
      (360 * percentValue) / 100,
      `원 전체는 360°이므로 360 × ${percentValue}/100 = ${(360 * percentValue) / 100}°입니다.`,
    ),
    { type: "circle-chart", title: "중심각으로 나누는 원그래프", unit: "%", items: [{ label: "해당 부분", value: percentValue }, { label: "나머지", value: 100 - percentValue }] },
  );
}

function genG6GraphCompare(): Problem {
  const first = randInt(20, 45);
  const second = randInt(10, first - 5);
  const context = choice(G6_GRAPH_CONTEXTS);
  const label = choice(context.labels);
  return withVisual(
    mkInteger(
      "g6-graph-compare",
      "두 항목의 백분율 차를 구하세요.",
      `1차 조사 ${label} ${first}%, 2차 조사 ${label} ${second}%`,
      first - second,
      `${first} - ${second} = ${first - second}%p입니다.`,
    ),
    { type: "bar-chart", title: `${context.title} 변화`, unit: "%", items: [{ label: "1차", value: first }, { label: "2차", value: second }] },
  );
}

function genG6GraphTotalFromPercent(): Problem {
  const part = choice([18, 24, 30, 36, 48]);
  const percentValue = choice([20, 25, 30, 40]);
  const total = (part * 100) / percentValue;
  return withVisual(
    mkInteger(
      "g6-graph-total-from-percent",
      "그래프의 일부 수와 백분율을 보고 전체를 구하세요.",
      `${part}명이 전체의 ${percentValue}%입니다. 전체 인원`,
      total,
      `${part} ÷ ${percentValue}/100 = ${total}명입니다.`,
    ),
    { type: "circle-chart", title: "일부 수로 전체 추론", unit: "%", items: [{ label: `${part}명`, value: percentValue }, { label: "나머지", value: 100 - percentValue }] },
  );
}

function genG6GraphTablePercent(): Problem {
  const a = randInt(12, 35);
  const b = randInt(15, 40);
  const total = choice([100, 120, 150, 200]);
  const c = total - a - b;
  const context = choice(G6_GRAPH_CONTEXTS);
  return withVisual(
    mkInteger(
      "g6-graph-table-percent",
      "표의 자료 중 남은 항목의 수를 구하세요.",
      `전체 ${total}명, ${context.labels[0]} ${a}명, ${context.labels[1]} ${b}명, ${context.labels[2]} □명`,
      c,
      `${total} - ${a} - ${b} = ${c}명입니다.`,
    ),
    { type: "data-table", caption: context.title, headers: ["항목", ...context.labels, "합계"], rows: [["수", a, b, "□", total]] },
  );
}

function genG6FractionDivideSameDenomUnit(): Problem {
  const denominator = randInt(4, 12);
  const numerator = randInt(2, denominator - 1);
  return withVisual(
    mkInteger(
      "g6-fraction-divide-same-denom-unit",
      "분모가 같은 분수를 단위분수로 나누세요.",
      `${numerator}/${denominator} ÷ 1/${denominator}`,
      numerator,
      `${numerator}/${denominator}에는 1/${denominator}이 ${numerator}개 들어 있습니다.`,
    ),
    { type: "fraction-strip", title: "단위분수가 몇 개 들어갈까요", numerator, denominator, divisorNumerator: 1 },
  );
}

function genG6FractionDivideSameDenom(): Problem {
  const denominator = randInt(5, 13);
  const a = randInt(2, denominator - 1);
  const b = randInt(1, a - 1);
  const answer = reduceFrac(makeFrac(a, b));
  return withVisual(
    {
      topicId: "g6-fraction-divide-same-denom",
      prompt: "분모가 같은 분수끼리의 나눗셈을 계산하세요.",
      expression: `${a}/${denominator} ÷ ${b}/${denominator}`,
      hint: "분수 또는 자연수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `분모가 같으므로 분자끼리 나누면 ${a} ÷ ${b} = ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", title: `${b}/${denominator}씩 묶어 보기`, numerator: a, denominator, divisorNumerator: b },
  );
}

function genG6FractionDivideDifferentDenom(): Problem {
  const a = properFraction(9);
  const b = properFraction(9);
  const answer = reduceFrac(makeFrac(a.n * b.d, a.d * b.n));
  return {
    topicId: "g6-fraction-divide-different-denom",
    prompt: "분모가 다른 분수끼리의 나눗셈을 계산하세요.",
    expression: `${rawFrac(a)} ÷ ${rawFrac(b)}`,
    hint: "분수 또는 대분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `나누는 분수를 뒤집어 곱하면 ${rawFrac(a)} × ${b.d}/${b.n} = ${formatFrac(answer)}입니다.`,
  };
}

function genG6NaturalDivideFraction(): Problem {
  const natural = randInt(2, 8);
  const f = properFraction(10);
  const answer = reduceFrac(makeFrac(natural * f.d, f.n));
  return {
    topicId: "g6-natural-divide-fraction",
    prompt: "자연수를 분수로 나누세요.",
    expression: `${natural} ÷ ${rawFrac(f)}`,
    hint: "분수 또는 대분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${natural} ÷ ${rawFrac(f)} = ${natural} × ${f.d}/${f.n} = ${formatFrac(answer)}입니다.`,
  };
}

function genG6MixedDivideFraction(): Problem {
  const denominator = randInt(3, 8);
  const whole = randInt(1, 3);
  const numerator = randInt(1, denominator - 1);
  const divisor = properFraction(8);
  const left = makeFrac(whole * denominator + numerator, denominator);
  const answer = reduceFrac(makeFrac(left.n * divisor.d, left.d * divisor.n));
  return {
    topicId: "g6-mixed-divide-fraction",
    prompt: "대분수를 가분수로 바꾸어 분수로 나누세요.",
    expression: `${whole} ${numerator}/${denominator} ÷ ${rawFrac(divisor)}`,
    hint: "분수 또는 대분수로 입력",
    answer,
    kind: "fraction",
    answerText: formatFrac(answer),
    solution: `${whole} ${numerator}/${denominator} = ${rawFrac(left)}이고, 나누는 분수를 뒤집어 곱하면 ${formatFrac(answer)}입니다.`,
  };
}

function genG6FractionDivideWord(): Problem {
  const piece = properFraction(10);
  const count = randInt(3, 8);
  const total = reduceFrac(makeFrac(piece.n * count, piece.d));
  return withVisual(
    mkInteger(
      "g6-fraction-divide-word",
      "문장을 읽고 분수 나눗셈으로 개수를 구하세요.",
      `전체 ${formatFrac(total)} kg을 ${rawFrac(piece)} kg씩 나누면 몇 묶음입니까?`,
      count,
      `${formatFrac(total)} ÷ ${rawFrac(piece)} = ${count}묶음입니다.`,
    ),
    { type: "fraction-strip", title: `한 묶음 ${rawFrac(piece)} kg`, numerator: piece.n, denominator: piece.d, divisorNumerator: piece.n },
  );
}

function genG6RatioEquivalent(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const scale = randInt(2, 6);
  return withVisual(
    mkChoice(
      "g6-ratio-equivalent",
      "비율이 같은 비를 고르세요.",
      `${a}:${b}`,
      `${a * scale}:${b * scale}`,
      [`${a + scale}:${b + scale}`, `${b * scale}:${a * scale}`, `${a * scale}:${b}`],
      `전항과 후항에 같은 수 ${scale}를 곱하면 ${a * scale}:${b * scale}입니다.`,
    ),
    { type: "ratio-strip", title: "같은 비율로 늘리기", leftLabel: "전항", rightLabel: "후항", left: a, right: b },
  );
}

function genG6SimplifyRatio(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const scale = randInt(2, 8);
  const g = gcd(a * scale, b * scale);
  return withVisual(
    mkChoice(
      "g6-simplify-ratio",
      "비를 가장 간단한 자연수의 비로 나타내세요.",
      `${a * scale}:${b * scale}`,
      `${(a * scale) / g}:${(b * scale) / g}`,
      [`${a * scale}:${b}`, `${a}:${b * scale}`, `${b}:${a}`],
      `전항과 후항을 공약수 ${g}로 나누면 ${(a * scale) / g}:${(b * scale) / g}입니다.`,
    ),
    { type: "ratio-strip", title: "공약수로 나누기 전", leftLabel: "전항", rightLabel: "후항", left: a * scale, right: b * scale },
  );
}

function genG6ProportionCheck(): Problem {
  const a = randInt(2, 8);
  const b = randInt(2, 9);
  const scale = randInt(2, 5);
  return withVisual(
    mkChoice(
      "g6-proportion-check",
      "옳은 비례식을 고르세요.",
      "외항의 곱과 내항의 곱이 같은 식",
      `${a}:${b} = ${a * scale}:${b * scale}`,
      [`${a}:${b} = ${a + scale}:${b + scale}`, `${a}:${b} = ${b * scale}:${a * scale}`, `${a}:${b} = ${a * scale}:${b}`],
      `외항의 곱과 내항의 곱이 모두 ${a * b * scale}입니다.`,
    ),
    { type: "data-table", caption: "비례식의 곱 비교", headers: ["외항", "내항"], rows: [[`${a} × ${b * scale}`, `${b} × ${a * scale}`], [a * b * scale, a * b * scale]] },
  );
}

function genG6ProportionMissing(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const scale = randInt(2, 7);
  return withVisual(
    mkInteger(
      "g6-proportion-missing",
      "비례식의 성질을 이용해 빈칸을 구하세요.",
      `${a}:${b} = □:${b * scale}`,
      a * scale,
      `후항이 ${scale}배 되었으므로 전항도 ${scale}배 하여 ${a * scale}입니다.`,
    ),
    { type: "ratio-strip", title: `${scale}배로 커진 비`, leftLabel: "전항", rightLabel: "후항", left: a, right: b },
  );
}

function genG6ProportionalDistribution(): Problem {
  const a = randInt(2, 5);
  const b = randInt(2, 6);
  const unit = randInt(5, 20);
  const total = (a + b) * unit;
  return withVisual(
    mkInteger(
      "g6-proportional-distribution",
      "전체를 주어진 비로 나누었을 때 한쪽의 양을 구하세요.",
      `${total}개를 ${a}:${b}로 나눌 때 앞쪽의 양`,
      a * unit,
      `전체 비 ${a + b}칸 중 앞쪽은 ${a}칸이므로 ${total} ÷ ${a + b} × ${a} = ${a * unit}개입니다.`,
    ),
    { type: "ratio-strip", title: `전체 ${total}개 비례배분`, leftLabel: "앞쪽", rightLabel: "뒤쪽", left: a, right: b, unit: "칸" },
  );
}

function genG6ScaleRecipe(): Problem {
  const a = randInt(2, 6);
  const b = randInt(3, 8);
  const scale = randInt(2, 5);
  return withVisual(
    mkInteger(
      "g6-scale-recipe",
      "같은 비율로 양을 늘렸을 때 필요한 양을 구하세요.",
      `물 ${a}컵에 가루 ${b}컵이 필요합니다. 물 ${a * scale}컵에는 가루 몇 컵이 필요합니까?`,
      b * scale,
      `물의 양이 ${scale}배 되었으므로 가루도 ${scale}배 하여 ${b * scale}컵입니다.`,
    ),
    { type: "ratio-strip", title: "물과 가루의 비", leftLabel: "물", rightLabel: "가루", left: a, right: b, unit: "컵" },
  );
}

function genG6ViewDirectionChoice(): Problem {
  return withVisual(
    mkChoice(
      "g6-view-direction-choice",
      "입체도형을 보는 방향에 대한 설명으로 알맞은 것을 고르세요.",
      "앞에서 본 모양",
      "높이와 가로 방향의 모습을 볼 수 있습니다",
      ["위에서 본 바닥 자리만 볼 수 있습니다", "항상 정사각형만 보입니다", "보이지 않는 쌓기나무 개수를 모두 알 수 없습니다"],
      "앞에서 보면 가로와 높이가 드러납니다.",
    ),
    { type: "cube-stack", cols: 3, rows: 2, layers: 2 },
  );
}

function genG6CubeCountSimple(): Problem {
  const cols = randInt(2, 5);
  const rows = randInt(2, 4);
  const layers = randInt(1, 4);
  return withVisual(
    mkInteger(
      "g6-cube-count-simple",
      "쌓기나무의 전체 개수를 구하세요.",
      `가로 ${cols}칸, 세로 ${rows}칸, 높이 ${layers}층으로 쌓았습니다.`,
      cols * rows * layers,
      `${cols} × ${rows} × ${layers} = ${cols * rows * layers}개입니다.`,
    ),
    { type: "cube-stack", cols, rows, layers },
  );
}

function genG6CubeTopNumberSum(): Problem {
  const values = Array.from({ length: 4 }, () => randInt(1, 4));
  return withVisual(
    mkInteger(
      "g6-cube-top-number-sum",
      "위에서 본 모양에 쓴 수를 더해 쌓기나무 개수를 구하세요.",
      values.map((value, index) => `${index + 1}번 자리 ${value}층`).join(", "),
      values.reduce((sum, value) => sum + value, 0),
      `각 자리의 층수를 모두 더하면 ${values.reduce((sum, value) => sum + value, 0)}개입니다.`,
    ),
    { type: "data-table", caption: "위에서 본 모양", headers: ["자리", 1, 2, 3, 4], rows: [["층수", ...values]] },
  );
}

function genG6ViewCountFromTop(): Problem {
  const front = randInt(2, 5);
  const side = randInt(2, 4);
  return withVisual(
    mkInteger(
      "g6-view-count-from-top",
      "앞과 옆에서 본 최대 높이를 이용해 최소 쌓기나무 수를 어림하세요.",
      `앞에서 보이는 기둥 ${front}개, 옆에서 보이는 줄 ${side}개일 때 최소 자리 수`,
      Math.max(front, side),
      `최소로 놓으려면 큰 쪽 개수만큼의 자리가 필요하므로 ${Math.max(front, side)}자리입니다.`,
    ),
    { type: "data-table", caption: "보는 방향별 정보", headers: ["방향", "앞", "옆", "최소 자리"], rows: [["개수", front, side, "□"]] },
  );
}

function genG6MinCubes(): Problem {
  const visible = randInt(6, 14);
  const hidden = randInt(1, 5);
  return withVisual(
    mkInteger(
      "g6-min-cubes",
      "보이는 쌓기나무와 숨은 쌓기나무를 합해 개수를 구하세요.",
      `겉으로 보이는 쌓기나무 ${visible}개, 안쪽에 숨은 쌓기나무 ${hidden}개`,
      visible + hidden,
      `${visible} + ${hidden} = ${visible + hidden}개입니다.`,
    ),
    { type: "data-table", caption: "쌓기나무 개수 정리", headers: ["구분", "보이는 나무", "숨은 나무", "전체"], rows: [["개수", visible, hidden, "□"]] },
  );
}

function genG6SpatialWord(): Problem {
  const blocks = randInt(8, 18);
  const added = randInt(2, 7);
  return withVisual(
    mkInteger(
      "g6-spatial-word",
      "쌓기나무를 더 쌓은 뒤 전체 개수를 구하세요.",
      `처음 ${blocks}개로 만든 모양에 ${added}개를 더 올렸습니다.`,
      blocks + added,
      `${blocks} + ${added} = ${blocks + added}개입니다.`,
    ),
    { type: "data-table", caption: "입체 모양 변화", headers: ["처음", "더 올린 수", "전체"], rows: [[blocks, added, "□"]] },
  );
}

function genG6PrismFaceCount(): Problem {
  const sides = randInt(3, 8);
  const answer = sides + 2;
  return withVisual(
    mkInteger(
      "g6-prism-face-count",
      "각기둥의 면의 수를 구하세요.",
      `밑면이 ${sides}각형인 각기둥의 면의 수`,
      answer,
      `각기둥은 옆면 ${sides}개와 밑면 2개가 있으므로 ${sides} + 2 = ${answer}개입니다.`,
    ),
    { type: "solid-shape", kind: "prism", label: `${sides}각기둥` },
  );
}

function genG6PrismEdgeCount(): Problem {
  const sides = randInt(3, 8);
  const answer = sides * 3;
  return withVisual(
    mkInteger(
      "g6-prism-edge-count",
      "각기둥의 모서리 수를 구하세요.",
      `밑면이 ${sides}각형인 각기둥의 모서리 수`,
      answer,
      `각기둥은 아래 밑면 ${sides}개, 위 밑면 ${sides}개, 옆 모서리 ${sides}개이므로 ${sides} × 3 = ${answer}개입니다.`,
    ),
    { type: "solid-shape", kind: "prism", label: `${sides}각기둥` },
  );
}

function genG6PyramidFaceCount(): Problem {
  const sides = randInt(3, 8);
  const answer = sides + 1;
  return withVisual(
    mkInteger(
      "g6-pyramid-face-count",
      "각뿔의 면의 수를 구하세요.",
      `밑면이 ${sides}각형인 각뿔의 면의 수`,
      answer,
      `각뿔은 옆면 ${sides}개와 밑면 1개가 있으므로 ${sides} + 1 = ${answer}개입니다.`,
    ),
    { type: "solid-shape", kind: "pyramid", label: `${sides}각뿔` },
  );
}

function genG6PyramidEdgeCount(): Problem {
  const sides = randInt(3, 8);
  const answer = sides * 2;
  return withVisual(
    mkInteger(
      "g6-pyramid-edge-count",
      "각뿔의 모서리 수를 구하세요.",
      `밑면이 ${sides}각형인 각뿔의 모서리 수`,
      answer,
      `각뿔은 밑면 모서리 ${sides}개와 꼭짓점으로 올라가는 모서리 ${sides}개가 있으므로 ${sides} × 2 = ${answer}개입니다.`,
    ),
    { type: "solid-shape", kind: "pyramid", label: `${sides}각뿔` },
  );
}

function genG6SolidNameChoice(): Problem {
  const items = [
    { kind: "prism" as const, label: "각기둥", desc: "위아래 밑면이 서로 평행하고 합동인 다각형" },
    { kind: "pyramid" as const, label: "각뿔", desc: "밑면은 다각형이고 옆면이 모두 삼각형인 입체도형" },
    { kind: "cylinder" as const, label: "원기둥", desc: "두 밑면이 서로 평행하고 합동인 원" },
    { kind: "cone" as const, label: "원뿔", desc: "밑면이 원이고 한 꼭짓점으로 모이는 입체도형" },
    { kind: "sphere" as const, label: "구", desc: "중심에서 겉면까지의 거리가 모두 같은 입체도형" },
  ];
  const item = choice(items);
  return withVisual(
    mkChoice(
      "g6-solid-name-choice",
      "설명에 맞는 입체도형 이름을 고르세요.",
      item.desc,
      item.label,
      items.map((other) => other.label).filter((label) => label !== item.label),
      `설명에 맞는 입체도형은 ${item.label}입니다.`,
    ),
    { type: "solid-shape", kind: item.kind, label: item.label },
  );
}

function genG6PrismPyramidNet(): Problem {
  const isPrism = Math.random() < 0.5;
  const sides = randInt(3, 6);
  const answer = isPrism ? `${sides}개의 직사각형 옆면과 합동인 밑면 2개` : `${sides}개의 삼각형 옆면과 밑면 1개`;
  return withVisual(
    mkChoice(
      "g6-prism-pyramid-net",
      "전개도의 구성으로 알맞은 것을 고르세요.",
      `${sides}각${isPrism ? "기둥" : "뿔"}의 전개도`,
      answer,
      [
        `${sides}개의 삼각형 옆면과 합동인 밑면 2개`,
        `${sides + 2}개의 원과 직사각형 1개`,
        `${sides}개의 직사각형 옆면만 있음`,
        `${sides + 1}개의 원 모양 밑면`,
      ],
      isPrism ? `각기둥 전개도에는 옆면 ${sides}개와 합동인 두 밑면이 있습니다.` : `각뿔 전개도에는 삼각형 옆면 ${sides}개와 밑면 1개가 있습니다.`,
    ),
    { type: "net-diagram", kind: isPrism ? "prism" : "pyramid", sides, label: `${sides}각${isPrism ? "기둥" : "뿔"} 전개도` },
  );
}

function genG6DecimalDivideDecimal(): Problem {
  const divisor = choice([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]);
  const quotient = randInt(6, 24);
  const dividend = decimalText(divisor * quotient, 1);
  const divisorText = decimalText(divisor, 1);
  return withVisual(
    mkChoice(
      "g6-decimal-divide-decimal",
      "소수를 소수로 나누어 계산하세요.",
      `${dividend} ÷ ${divisorText}`,
      String(quotient),
      [String(quotient + 1), decimalText(quotient / 10, 1), String(Math.max(1, quotient - 2)), decimalText(Number(dividend) * Number(divisorText), 2)],
      `나누는 수와 나누어지는 수에 10을 곱하면 ${Number(dividend) * 10} ÷ ${Number(divisorText) * 10} = ${quotient}입니다.`,
    ),
    decimalPlaceTable({ topicId: "g6-decimal-divide-decimal", prompt: "", expression: `${dividend} ÷ ${divisorText}`, answer: quotient, kind: "choice", solution: "" }, "소수점 이동 표"),
  );
}

function genG6CylinderHeight(): Problem {
  const height = randInt(4, 18);
  return withVisual(
    mkInteger(
      "g6-cylinder-height",
      "원기둥의 높이를 읽으세요.",
      `그림에 표시된 원기둥의 높이`,
      height,
      `원기둥의 두 밑면 사이의 거리가 높이이므로 ${height} cm입니다.`,
    ),
    { type: "solid-shape", kind: "cylinder", label: "원기둥", height, radius: randInt(2, 6), unit: "cm" },
  );
}

function genG6CylinderNetCircumference(): Problem {
  const radius = randInt(2, 8);
  const height = randInt(4, 15);
  const circumference = radius * 2 * 3;
  return withVisual(
    mkInteger(
      "g6-cylinder-net-circumference",
      "원기둥 전개도의 옆면 가로 길이를 구하세요. 원주율은 3으로 계산합니다.",
      `밑면의 반지름 ${radius} cm, 높이 ${height} cm인 원기둥`,
      circumference,
      `전개도에서 옆면의 가로는 밑면의 원주이므로 ${radius} × 2 × 3 = ${circumference} cm입니다.`,
    ),
    { type: "net-diagram", kind: "cylinder", label: "원기둥 전개도" },
  );
}

function genG6CylinderSurfaceArea(): Problem {
  const radius = randInt(2, 7);
  const height = randInt(4, 12);
  const answer = 2 * 3 * radius * radius + 2 * 3 * radius * height;
  return withVisual(
    mkInteger(
      "g6-cylinder-surface-area",
      "원기둥의 겉넓이를 구하세요. 원주율은 3으로 계산합니다.",
      `반지름 ${radius} cm, 높이 ${height} cm`,
      answer,
      `밑면 2개는 2 × 3 × ${radius} × ${radius}, 옆면은 ${radius * 2 * 3} × ${height}이므로 겉넓이는 ${answer} cm²입니다.`,
    ),
    { type: "solid-shape", kind: "cylinder", label: "원기둥 겉넓이", height, radius, unit: "cm" },
  );
}

function genG6CylinderVolume(): Problem {
  const radius = randInt(2, 7);
  const height = randInt(3, 12);
  const answer = 3 * radius * radius * height;
  return withVisual(
    mkInteger(
      "g6-cylinder-volume",
      "원기둥의 부피를 구하세요. 원주율은 3으로 계산합니다.",
      `반지름 ${radius} cm, 높이 ${height} cm`,
      answer,
      `원기둥의 부피는 밑면의 넓이 × 높이 = 3 × ${radius} × ${radius} × ${height} = ${answer} cm³입니다.`,
    ),
    { type: "solid-shape", kind: "cylinder", label: "원기둥 부피", height, radius, unit: "cm" },
  );
}

function genG6ConeSphereChoice(): Problem {
  const item = choice([
    { kind: "cone" as const, label: "원뿔", desc: "평면도형을 한 바퀴 돌렸을 때 한 꼭짓점과 원 모양 밑면이 생깁니다" },
    { kind: "sphere" as const, label: "구", desc: "어느 방향에서 보아도 둥근 모양이고 중심에서 겉면까지 거리가 같습니다" },
  ]);
  return withVisual(
    mkChoice(
      "g6-cone-sphere-choice",
      "설명에 맞는 입체도형을 고르세요.",
      item.desc,
      item.label,
      ["원기둥", "각기둥", "각뿔"].filter((label) => label !== item.label),
      `설명에 맞는 입체도형은 ${item.label}입니다.`,
    ),
    { type: "solid-shape", kind: item.kind, label: item.label, height: item.kind === "cone" ? randInt(5, 12) : undefined, radius: randInt(2, 6), unit: "cm" },
  );
}

function genG6CuboidSurfaceArea(): Problem {
  const width = randInt(3, 12);
  const depth = randInt(3, 10);
  const height = randInt(3, 9);
  const answer = 2 * (width * depth + width * height + depth * height);
  const context = choice(G6_CUBOID_CONTEXTS);
  return withVisual(
    mkInteger(
      "g6-cuboid-surface-area",
      "직육면체의 겉넓이를 구하세요.",
      `${context}의 가로 ${width} cm, 세로 ${depth} cm, 높이 ${height} cm`,
      answer,
      `서로 같은 면이 2개씩 있으므로 2 × (${width}×${depth} + ${width}×${height} + ${depth}×${height}) = ${answer} cm²입니다.`,
    ),
    { type: "cuboid", width, depth, height, unit: "cm" },
  );
}

function genG6CuboidVolume(): Problem {
  const width = randInt(3, 12);
  const depth = randInt(3, 10);
  const height = randInt(3, 9);
  const answer = width * depth * height;
  const context = choice(G6_CUBOID_CONTEXTS);
  return withVisual(
    mkInteger(
      "g6-cuboid-volume",
      "직육면체의 부피를 구하세요.",
      `${context}의 가로 ${width} cm, 세로 ${depth} cm, 높이 ${height} cm`,
      answer,
      `직육면체의 부피는 ${width} × ${depth} × ${height} = ${answer} cm³입니다.`,
    ),
    { type: "cuboid", width, depth, height, unit: "cm" },
  );
}

function genG6CuboidVolumeUnit(): Problem {
  const cubicMeters = randInt(2, 9);
  const answer = cubicMeters * 1_000_000;
  return withVisual(
    mkInteger(
      "g6-cuboid-volume-unit",
      "m³를 cm³로 바꾸세요.",
      `${cubicMeters} m³ = □ cm³`,
      answer,
      `1 m³ = 1,000,000 cm³이므로 ${cubicMeters} m³ = ${answer.toLocaleString("ko-KR")} cm³입니다.`,
    ),
    { type: "data-table", caption: "부피 단위 변환", headers: ["m³", "cm³"], rows: [[cubicMeters, "□"]] },
  );
}

function genG6CuboidMissingEdgeFromVolume(): Problem {
  const width = randInt(3, 9);
  const depth = randInt(3, 8);
  const height = randInt(3, 10);
  const volume = width * depth * height;
  const context = choice(G6_CUBOID_CONTEXTS);
  return withVisual(
    mkInteger(
      "g6-cuboid-missing-edge-volume",
      "부피를 보고 빠진 높이를 구하세요.",
      `${context}의 가로 ${width} cm, 세로 ${depth} cm, 부피 ${volume} cm³일 때 높이`,
      height,
      `높이 = 부피 ÷ (가로 × 세로) = ${volume} ÷ (${width} × ${depth}) = ${height} cm입니다.`,
    ),
    { type: "cuboid", width, depth, height: "□", unit: "cm" },
  );
}

function genG6DirectProportionTable(): Problem {
  const rate = randInt(2, 9);
  const x = randInt(4, 12);
  const answer = rate * x;
  return withVisual(
    mkInteger(
      "g6-direct-proportion-table",
      "정비례 관계의 표에서 빠진 값을 구하세요.",
      `y = ${rate} × x, x = ${x}일 때 y`,
      answer,
      `정비례식에 x = ${x}를 넣으면 y = ${rate} × ${x} = ${answer}입니다.`,
    ),
    { type: "data-table", caption: "정비례 표", headers: ["x", 1, 2, x], rows: [["y", rate, rate * 2, "□"]] },
  );
}

function genG6DirectProportionGraph(): Problem {
  const rate = randInt(2, 6);
  const x = randInt(3, 8);
  const points = Array.from({ length: 5 }, (_, index) => ({ label: String(index + 1), value: rate * (index + 1) }));
  return withVisual(
    mkInteger(
      "g6-direct-proportion-graph",
      "정비례 그래프에서 x값에 대응하는 y값을 구하세요.",
      `y = ${rate}x일 때 x = ${x}`,
      rate * x,
      `y값은 x값의 ${rate}배이므로 ${rate} × ${x} = ${rate * x}입니다.`,
    ),
    { type: "line-chart", title: `y = ${rate}x`, unit: "", points },
  );
}

function genG6InverseProportionTable(): Problem {
  const product = choice([24, 36, 48, 60, 72, 96]);
  const x = choice(divisors(product).filter((value) => value >= 3 && value <= 12));
  const answer = product / x;
  return withVisual(
    mkInteger(
      "g6-inverse-proportion-table",
      "반비례 관계의 표에서 빠진 값을 구하세요.",
      `x × y = ${product}, x = ${x}일 때 y`,
      answer,
      `반비례에서는 x × y가 일정하므로 y = ${product} ÷ ${x} = ${answer}입니다.`,
    ),
    { type: "data-table", caption: "반비례 표", headers: ["x", 1, 2, x], rows: [["y", product, product / 2, "□"]] },
  );
}

function genG6InverseProportionWord(): Problem {
  let people: number;
  let hours: number;
  let work: number;
  let candidates: number[];
  do {
    people = randInt(3, 12);
    hours = randInt(3, 10);
    work = people * hours;
    candidates = divisors(work).filter((value) => value >= 4 && value <= 18 && value !== people);
  } while (candidates.length === 0);
  const newPeople = choice(candidates);
  const answer = work / newPeople;
  return withVisual(
    mkInteger(
      "g6-inverse-proportion-word",
      "반비례 상황을 식으로 해결하세요.",
      `${people}명이 ${hours}시간에 끝내는 일을 ${newPeople}명이 하면 걸리는 시간`,
      answer,
      `일의 양은 ${people} × ${hours} = ${work}로 같으므로 ${work} ÷ ${newPeople} = ${answer}시간입니다.`,
    ),
    { type: "data-table", caption: "일의 양 일정", headers: ["사람 수", people, newPeople], rows: [["시간", hours, "□"], ["곱", work, work]] },
  );
}

function genG6SignedNumberScene(): Problem {
  const amount = randInt(2, 20);
  const isPositive = Math.random() < 0.5;
  const answer = `${isPositive ? "+" : "-"}${amount}`;
  return withVisual(
    mkChoice(
      "g6-signed-number-scene",
      "상황을 양수 또는 음수로 나타내세요.",
      isPositive ? `기온이 ${amount}도 올라갔습니다.` : `해수면보다 ${amount} m 낮은 곳입니다.`,
      answer,
      [`${isPositive ? "-" : "+"}${amount}`, "0", `${amount * 2}`, `${isPositive ? "+" : "-"}${amount + 1}`],
      isPositive ? `증가한 양은 +${amount}로 나타냅니다.` : `기준보다 낮은 양은 -${amount}로 나타냅니다.`,
    ),
    { type: "number-line", title: "양수와 음수", values: [-amount, 0, amount] },
  );
}

function genG6IntegerNumberLine(): Problem {
  const start = randInt(-6, 0); // -6~0 시작 → 범위 -6..0 ~ 0..6 사이 이동
  const values = Array.from({ length: 7 }, (_, i) => start + i);
  const missingIndex = randInt(0, values.length - 1);
  return withVisual(
    mkInteger(
      "g6-integer-number-line",
      "수직선에서 빠진 정수를 구하세요.",
      `왼쪽에서 ${missingIndex + 1}번째 점`,
      values[missingIndex]!,
      `수직선은 왼쪽부터 ${values.join(", ")} 순서이므로 해당 점은 ${values[missingIndex]}입니다.`,
    ),
    { type: "number-line", title: "정수 수직선", values, missingIndex },
  );
}

function genG6IntegerAddition(): Problem {
  const a = randInt(-12, 12);
  const b = randInt(-12, 12);
  return withVisual(
    mkInteger(
      "g6-integer-addition",
      "정수의 덧셈을 계산하세요.",
      `(${a}) + (${b})`,
      a + b,
      `${a}에 ${b}를 더하면 ${a + b}입니다.`,
    ),
    { type: "data-table", caption: "정수 덧셈", headers: ["첫째 수", "둘째 수", "합"], rows: [[a, b, "□"]] },
  );
}

function genG6IntegerSubtraction(): Problem {
  const a = randInt(-12, 12);
  const b = randInt(-12, 12);
  return withVisual(
    mkInteger(
      "g6-integer-subtraction",
      "정수의 뺄셈을 계산하세요.",
      `(${a}) - (${b})`,
      a - b,
      `${b}를 빼는 것은 ${-b}를 더하는 것과 같으므로 ${a} - (${b}) = ${a - b}입니다.`,
    ),
    { type: "data-table", caption: "정수 뺄셈", headers: ["처음", "빼는 수", "결과"], rows: [[a, b, "□"]] },
  );
}

function genG6ExpressionValue(): Problem {
  const coefficient = randInt(-5, 6) || 3;
  const constant = randInt(-9, 9);
  const x = randInt(-4, 5);
  const answer = coefficient * x + constant;
  return withVisual(
    mkInteger(
      "g6-expression-value",
      "문자의 값이 주어졌을 때 식의 값을 구하세요.",
      `x = ${x}일 때 ${coefficient}x ${constant >= 0 ? "+" : "-"} ${Math.abs(constant)}`,
      answer,
      `${coefficient} × ${x} ${constant >= 0 ? "+" : "-"} ${Math.abs(constant)} = ${answer}입니다.`,
    ),
    { type: "data-table", caption: "식의 값", headers: ["x", "계산", "값"], rows: [[x, `${coefficient}×${x}${constant >= 0 ? "+" : "-"}${Math.abs(constant)}`, "□"]] },
  );
}

function genG6SimplifyLikeTerms(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const c = randInt(1, 8);
  const answer = `${a + b}x + ${c}`;
  return withVisual(
    mkChoice(
      "g6-simplify-like-terms",
      "동류항끼리 모아 식을 간단히 하세요.",
      `${a}x + ${c} + ${b}x`,
      answer,
      [`${a + b + c}x`, `${a}x + ${b + c}`, `${a * b}x + ${c}`, `${a + b} + ${c}x`],
      `x가 붙은 항끼리 더하면 ${a}x + ${b}x = ${a + b}x이므로 ${answer}입니다.`,
    ),
    { type: "data-table", caption: "동류항 정리", headers: ["x항", "상수항"], rows: [[`${a}x + ${b}x`, c]] },
  );
}

function genG6EquationPropertyChoice(): Problem {
  return withVisual(
    mkChoice(
      "g6-equation-property-choice",
      "등식의 성질로 옳은 것을 고르세요.",
      "a = b일 때 항상 참인 식",
      "a + 3 = b + 3",
      ["a + 3 = b - 3", "3a = b", "a - 2 = b + 2", "a ÷ 0 = b ÷ 0"],
      "등식의 양변에 같은 수를 더해도 등식은 성립합니다.",
    ),
    { type: "data-table", caption: "등식의 성질", headers: ["원래 등식", "같은 연산"], rows: [["a = b", "양변에 +3"]] },
  );
}

function genG6FunctionValue(): Problem {
  const a = randInt(2, 6);
  const b = randInt(-5, 8);
  const x = randInt(-3, 6);
  const answer = a * x + b;
  return withVisual(
    mkInteger(
      "g6-function-value",
      "함수값을 구하세요.",
      `f(x) = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}, f(${x})`,
      answer,
      `x = ${x}를 대입하면 ${a} × ${x} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${answer}입니다.`,
    ),
    { type: "data-table", caption: "함수값 계산", headers: ["x", "f(x)"], rows: [[x, "□"]] },
  );
}

function genG6CoordinateQuadrant(): Problem {
  const x = choice([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
  const y = choice([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
  const answer = x > 0 && y > 0 ? "제1사분면" : x < 0 && y > 0 ? "제2사분면" : x < 0 && y < 0 ? "제3사분면" : "제4사분면";
  return withVisual(
    mkChoice(
      "g6-coordinate-quadrant",
      "좌표평면에서 점이 있는 사분면을 고르세요.",
      `점 (${x}, ${y})`,
      answer,
      ["제1사분면", "제2사분면", "제3사분면", "제4사분면"].filter((label) => label !== answer),
      `x좌표와 y좌표의 부호를 보면 ${answer}입니다.`,
    ),
    { type: "coordinate-plane", point: [x, y], axis: "x" },
  );
}

function genG6FunctionGraphTable(): Problem {
  const rate = randInt(1, 5);
  const x = randInt(3, 8);
  const points = Array.from({ length: 5 }, (_, index) => ({ label: String(index + 1), value: rate * (index + 1) }));
  return withVisual(
    mkInteger(
      "g6-function-graph-table",
      "그래프와 식의 관계를 이용해 y값을 구하세요.",
      `y = ${rate}x의 그래프에서 x = ${x}`,
      rate * x,
      `식 y = ${rate}x에 x = ${x}를 대입하면 y = ${rate * x}입니다.`,
    ),
    { type: "line-chart", title: `y = ${rate}x`, unit: "", points },
  );
}

function genG6CircumferenceFromDiameter(): Problem {
  const diameter = randInt(4, 20);
  return withVisual(
    mkChoice(
      "g6-circumference-from-diameter",
      "지름을 알 때 원주를 구하세요. 원주율은 3.14로 계산합니다.",
      `지름 ${diameter} cm인 원`,
      decimalText(diameter * 3.14, 2),
      [decimalText(diameter * 3, 2), decimalText(diameter * 2 * 3.14, 2), decimalText(diameter + 3.14, 2)],
      `원주 = 지름 × 원주율 = ${diameter} × 3.14 = ${decimalText(diameter * 3.14, 2)} cm입니다.`,
    ),
    { type: "circle-diagram", title: "지름과 원주", mode: "diameter", diameter, unit: "cm" },
  );
}

function genG6CircumferenceFromRadius(): Problem {
  const radius = randInt(2, 12);
  return withVisual(
    mkChoice(
      "g6-circumference-from-radius",
      "반지름을 알 때 원주를 구하세요. 원주율은 3.14로 계산합니다.",
      `반지름 ${radius} cm인 원`,
      decimalText(radius * 2 * 3.14, 2),
      [decimalText(radius * 3.14, 2), decimalText(radius * radius * 3.14, 2), decimalText(radius * 2 * 3, 2)],
      `원주 = 반지름 × 2 × 원주율 = ${radius} × 2 × 3.14 = ${decimalText(radius * 2 * 3.14, 2)} cm입니다.`,
    ),
    { type: "circle-diagram", title: "반지름과 원주", mode: "circumference", radius, unit: "cm" },
  );
}

function genG6PiFromCircumferenceDiameter(): Problem {
  const diameter = randInt(4, 12);
  const pi = choice([3, 3.1, 3.14]);
  const circumference = diameter * pi;
  return withVisual(
    mkChoice(
      "g6-pi-from-circumference-diameter",
      "원주와 지름을 보고 원주율을 구하세요.",
      `원주 ${decimalText(circumference, 2)} cm, 지름 ${diameter} cm`,
      decimalText(pi, 2),
      [decimalText(pi + 0.1, 2), decimalText(Math.max(1, pi - 0.1), 2), decimalText(circumference + diameter, 2)],
      `원주율 = 원주 ÷ 지름 = ${decimalText(circumference, 2)} ÷ ${diameter} = ${decimalText(pi, 2)}입니다.`,
    ),
    { type: "circle-diagram", title: `원주 ${decimalText(circumference, 2)} cm`, mode: "diameter", diameter, unit: "cm" },
  );
}

function genG6CircleAreaFromRadius(): Problem {
  const radius = randInt(2, 10);
  return withVisual(
    mkChoice(
      "g6-circle-area-from-radius",
      "반지름을 알 때 원의 넓이를 구하세요. 원주율은 3.14로 계산합니다.",
      `반지름 ${radius} cm인 원`,
      decimalText(radius * radius * 3.14, 2),
      [decimalText(radius * 2 * 3.14, 2), decimalText(radius * radius * 3, 2), decimalText(radius * 3.14, 2)],
      `원의 넓이 = 반지름 × 반지름 × 원주율 = ${decimalText(radius * radius * 3.14, 2)} cm²입니다.`,
    ),
    { type: "circle-diagram", title: "반지름으로 넓이 구하기", mode: "area", radius, unit: "cm" },
  );
}

function genG6CircleAreaFromDiameter(): Problem {
  const radius = randInt(2, 10);
  const diameter = radius * 2;
  return withVisual(
    mkChoice(
      "g6-circle-area-from-diameter",
      "지름을 알 때 원의 넓이를 구하세요. 원주율은 3.14로 계산합니다.",
      `지름 ${diameter} cm인 원`,
      decimalText(radius * radius * 3.14, 2),
      [decimalText(diameter * diameter * 3.14, 2), decimalText(diameter * 3.14, 2), decimalText(radius * 2 * 3.14, 2)],
      `반지름은 ${radius} cm이고, 넓이는 ${radius} × ${radius} × 3.14 = ${decimalText(radius * radius * 3.14, 2)} cm²입니다.`,
    ),
    { type: "circle-diagram", title: "지름을 반지름으로 바꾸기", mode: "diameter", diameter, unit: "cm" },
  );
}

function genG6CircleComposite(): Problem {
  const radius = randInt(3, 8);
  const squareArea = radius * 2 * radius * 2;
  const circleArea = radius * radius * 3;
  return withVisual(
    mkInteger(
      "g6-circle-composite",
      "정사각형 안의 원을 제외한 넓이를 어림해 구하세요. 원주율은 3으로 계산합니다.",
      `한 변 ${radius * 2} cm인 정사각형 안에 반지름 ${radius} cm인 원`,
      squareArea - circleArea,
      `정사각형 넓이 ${squareArea}에서 원의 넓이 ${circleArea}를 빼면 ${squareArea - circleArea} cm²입니다.`,
    ),
    { type: "circle-diagram", title: "정사각형과 원의 복합 도형", mode: "composite", radius, squareSide: radius * 2, unit: "cm" },
  );
}

function isPrimeNumber(n: number) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

function primeFactorMap(n: number): Map<number, number> {
  const result = new Map<number, number>();
  let rest = n;
  for (let d = 2; d * d <= rest; d++) {
    while (rest % d === 0) {
      result.set(d, (result.get(d) ?? 0) + 1);
      rest /= d;
    }
  }
  if (rest > 1) result.set(rest, (result.get(rest) ?? 0) + 1);
  return result;
}

function factorizationText(n: number): string {
  return Array.from(primeFactorMap(n).entries())
    .map(([prime, exponent]) => (exponent === 1 ? String(prime) : `${prime}^${exponent}`))
    .join(" × ");
}

function genG6PrimeCompositeChoice(): Problem {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
  const composites = [4, 6, 8, 9, 12, 15, 18, 21, 25, 27];
  const n = choice([...primes, ...composites]);
  return mkChoice(
    "g6-prime-composite-choice",
    "소수인지 합성수인지 고르세요.",
    String(n),
    isPrimeNumber(n) ? "소수" : "합성수",
    ["소수", "합성수", "1", "약수 없음"].filter((item) => item !== (isPrimeNumber(n) ? "소수" : "합성수")),
    isPrimeNumber(n) ? `${n}의 약수는 1과 ${n}뿐입니다.` : `${n}은 1과 자기 자신 외의 약수가 있습니다.`,
  );
}

function genG6PrimeFactorization(): Problem {
  const n = choice([36, 48, 60, 72, 84, 90, 96, 108, 120, 144]);
  return mkChoice(
    "g6-prime-factorization",
    "수를 소인수분해한 것을 고르세요.",
    String(n),
    factorizationText(n),
    [factorizationText(n / 2), factorizationText(n + 2), `${n}`],
    `${n} = ${factorizationText(n)}입니다.`,
  );
}

function genG6PrimeFactorsList(): Problem {
  const n = choice([36, 48, 60, 72, 84, 90, 120, 150]);
  const answer = Array.from(primeFactorMap(n).keys());
  return {
    topicId: "g6-prime-factors-list",
    prompt: "주어진 수의 소인수를 모두 쓰세요.",
    expression: String(n),
    hint: "작은 수부터 쉼표로 구분",
    answer,
    kind: "numberSet",
    solution: `${n} = ${factorizationText(n)}이므로 소인수는 ${answer.join(", ")}입니다.`,
  };
}

function genG6DivisorCountFromFactorization(): Problem {
  const n = choice([36, 48, 72, 90, 108, 120]);
  const count = Array.from(primeFactorMap(n).values()).reduce((product, exponent) => product * (exponent + 1), 1);
  return mkInteger(
    "g6-divisor-count-from-factorization",
    "소인수분해를 이용해 약수의 개수를 구하세요.",
    `${n} = ${factorizationText(n)}`,
    count,
    `각 지수에 1을 더해 곱하면 약수의 개수는 ${count}개입니다.`,
  );
}

function genG6GcdLcmPrimeFactor(): Problem {
  const a = choice([24, 36, 48, 60, 72]);
  const b = choice([30, 42, 54, 66, 84]);
  return mkInteger(
    "g6-gcd-lcm-prime-factor",
    "두 수의 최대공약수를 구하세요.",
    `${a}와 ${b}`,
    gcd(a, b),
    `${a}와 ${b}의 공약수 중 가장 큰 수는 ${gcd(a, b)}입니다.`,
  );
}

function genG6FactorizationWord(): Problem {
  const n = choice([24, 36, 48, 60, 72, 96]);
  return mkInteger(
    "g6-factorization-word",
    "약수의 개수를 활용해 직사각형 배열 방법 수를 구하세요.",
    `${n}개의 타일을 직사각형으로 배열할 때 가능한 가로 길이의 개수`,
    divisors(n).length,
    `가능한 가로 길이는 ${n}의 약수이므로 ${divisors(n).length}가지입니다.`,
  );
}

function genG6IntegerMultiplication(): Problem {
  const a = choice([-9, -8, -7, -6, 6, 7, 8, 9]);
  const b = choice([-5, -4, -3, 3, 4, 5]);
  return mkInteger(
    "g6-integer-multiplication",
    "정수의 곱셈을 계산하세요.",
    `${a} × ${b}`,
    a * b,
    `부호를 정하고 절댓값을 곱하면 ${a * b}입니다.`,
  );
}

function genG6IntegerDivision(): Problem {
  const divisor = choice([-8, -6, -4, -3, 3, 4, 6, 8]);
  const quotient = choice([-9, -7, -5, 5, 7, 9]);
  return mkInteger(
    "g6-integer-division",
    "정수의 나눗셈을 계산하세요.",
    `${divisor * quotient} ÷ ${divisor}`,
    quotient,
    `나눗셈의 부호를 정하면 몫은 ${quotient}입니다.`,
  );
}

function genG6IntegerMulLaw(): Problem {
  const a = randInt(2, 8);
  const b = -randInt(2, 8);
  const c = randInt(2, 6);
  return mkInteger(
    "g6-integer-mul-law",
    "곱셈의 결합법칙을 이용해 계산하세요.",
    `(${a} × ${b}) × ${c}`,
    a * b * c,
    `곱하는 순서를 바꾸어도 값은 같고, 결과는 ${a * b * c}입니다.`,
  );
}

function genG6MultiIntegerProduct(): Problem {
  const values = [choice([-5, -4, -3, 3, 4, 5]), choice([-3, -2, 2, 3]), choice([-4, -2, 2, 4])];
  const answer = values.reduce((product, value) => product * value, 1);
  return mkInteger(
    "g6-multi-integer-product",
    "세 수 이상의 정수 곱셈을 계산하세요.",
    values.join(" × "),
    answer,
    `음수의 개수로 부호를 정하고 절댓값을 곱하면 ${answer}입니다.`,
  );
}

function genG6RationalNumberCompare(): Problem {
  const a = choice([-5, -3, -1, 1, 3, 5]);
  const b = choice([-6, -4, -2, 2, 4, 6]);
  return mkChoice(
    "g6-rational-number-compare",
    "두 수의 크기 비교로 알맞은 기호를 고르세요.",
    `${a} □ ${b}`,
    compareSign(a, b),
    [">", "<", "="].filter((sign) => sign !== compareSign(a, b)),
    `수직선에서 오른쪽에 있는 수가 더 큽니다.`,
  );
}

function genG6RationalNumberMixed(): Problem {
  const a = choice([-8, -6, -4, 4, 6, 8]);
  const b = choice([-3, -2, 2, 3]);
  const c = choice([-5, -2, 2, 5]);
  return mkInteger(
    "g6-rational-number-mixed",
    "정수의 곱셈과 덧셈이 섞인 식을 계산하세요.",
    `${a} × ${b} + ${c}`,
    a * b + c,
    `${a} × ${b} = ${a * b}이고, ${a * b} + ${c} = ${a * b + c}입니다.`,
  );
}

function genG6LinearEquationBasic(): Problem {
  const x = randInt(2, 12);
  const a = randInt(2, 9);
  const b = randInt(1, 20);
  return mkInteger(
    "g6-linear-equation-basic",
    "일차방정식의 해를 구하세요.",
    `${a}x + ${b} = ${a * x + b}`,
    x,
    `${b}를 이항하면 ${a}x = ${a * x}, x = ${x}입니다.`,
  );
}

function genG6LinearEquationParen(): Problem {
  const x = randInt(2, 10);
  const a = randInt(2, 6);
  const b = randInt(1, 8);
  return mkInteger(
    "g6-linear-equation-paren",
    "괄호가 있는 일차방정식의 해를 구하세요.",
    `${a}(x + ${b}) = ${a * (x + b)}`,
    x,
    `양변을 ${a}로 나누면 x + ${b} = ${x + b}, x = ${x}입니다.`,
  );
}

function genG6LinearEquationDecimal(): Problem {
  const x = randInt(2, 9);
  const a = choice([0.2, 0.3, 0.4, 0.5]);
  const b = choice([0.4, 0.6, 0.8, 1.2]);
  const right = decimalText(a * x + b, 2);
  return mkInteger(
    "g6-linear-equation-decimal",
    "계수가 소수인 일차방정식의 해를 구하세요.",
    `${decimalText(a, 1)}x + ${decimalText(b, 1)} = ${right}`,
    x,
    `양변에서 ${decimalText(b, 1)}를 빼고 ${decimalText(a, 1)}로 나누면 x = ${x}입니다.`,
  );
}

function genG6LinearEquationFraction(): Problem {
  const denominator = randInt(2, 6);
  const value = randInt(2, 10);
  const answer = denominator * value;
  return mkInteger(
    "g6-linear-equation-fraction",
    "계수가 분수인 일차방정식의 해를 구하세요.",
    `x/${denominator} = ${value}`,
    answer,
    `양변에 ${denominator}를 곱하면 x = ${answer}입니다.`,
  );
}

function genG6EquationWord(): Problem {
  const x = randInt(3, 12);
  const price = randInt(2, 9) * 100;
  const extra = randInt(1, 5) * 100;
  return mkInteger(
    "g6-equation-word",
    "문장을 방정식으로 생각해 미지수를 구하세요.",
    `공책 x권을 ${price}원씩 사고 ${extra}원을 더 냈더니 ${price * x + extra}원입니다. x`,
    x,
    `${price}x + ${extra} = ${price * x + extra}이므로 x = ${x}입니다.`,
  );
}

function genG6EquationCheckChoice(): Problem {
  const x = randInt(2, 10);
  const a = randInt(2, 8);
  const b = randInt(1, 9);
  return mkChoice(
    "g6-equation-check-choice",
    "방정식의 해를 대입해 확인한 식으로 알맞은 것을 고르세요.",
    `${a}x - ${b} = ${a * x - b}, x = ${x}`,
    `${a} × ${x} - ${b} = ${a * x - b}`,
    [`${a} + ${x} - ${b} = ${a * x - b}`, `${a} × ${b} - ${x} = ${a * x - b}`, `${x} - ${a} × ${b} = ${a * x - b}`],
    `x에 ${x}를 대입하면 좌변이 ${a * x - b}가 되어 우변과 같습니다.`,
  );
}

function genG4ReviewFractionDecimal(): Problem {
  return retopic("g4-review-fraction-decimal", choice([genG4FractionBasic, genG4LikeDenomCompare, genG4DecimalAdd, genG4DecimalSub])());
}

function genG4ReviewGeometry(): Problem {
  return retopic("g4-review-geometry", choice([genG4QuadrilateralKind, genG4RectanglePerimeter, genG4GridArea, genG4RightAngleCount])());
}

function genG4ReviewDivision(): Problem {
  return retopic("g4-review-division", choice([genG4Div3By1, genG4DivisionRemainder, genG4DivWord])());
}

function genG4ReviewGraph(): Problem {
  return retopic("g4-review-graph", choice([genG4BarGraphRead, genG4DataTableTotal, genG4GraphMaxMin])());
}

function genG4ReviewMeasure(): Problem {
  return retopic("g4-review-measure", choice([genG4TimeAdd, genG4LengthConvert, genG4WeightConvert])());
}

function genG4ReviewWord(): Problem {
  return retopic("g4-review-word", choice([genG4MulWord, genG4DivWord, genG4WordTwoStep])());
}

function genG4PrepFactorBasic(): Problem {
  return retopic("g4-prep-factor-basic", genFactors());
}

function genG4PrepMultipleBasic(): Problem {
  return retopic("g4-prep-multiple-basic", genMultiples());
}

function genG4PrepCommonFactor(): Problem {
  return retopic("g4-prep-common-factor", genCommonFactors());
}

function genG4PrepCommonMultiple(): Problem {
  return retopic("g4-prep-common-multiple", genCommonMultiples());
}

function genG4PrepGcdBasic(): Problem {
  return retopic("g4-prep-gcd-basic", genGcd());
}

function genG4PrepLcmBasic(): Problem {
  return retopic("g4-prep-lcm-basic", genLcm());
}

function genG4PrepMixedOrder(): Problem {
  return retopic("g4-prep-mixed-order", genFourMixBasic());
}

function genG4PrepParentheses(): Problem {
  return retopic("g4-prep-parentheses", genFourMixParen());
}

function genG4PrepEquivalentFraction(): Problem {
  return retopic("g4-prep-equivalent-fraction", genEquivalentFraction());
}

function genG4PrepReduceFraction(): Problem {
  return retopic("g4-prep-reduce-fraction", genReduceFraction());
}

function genG4PrepCommonDenominator(): Problem {
  return retopic("g4-prep-common-denominator", genCommonDenominatorLcm());
}

function genG4PrepFractionAdd(): Problem {
  return retopic("g4-prep-fraction-add", genProperFractionAddUnderOne());
}

// ── 1학년 PDF 기반 기초력 문제: 수 세기·모으기·가르기·시계·모양 시각 자료 포함 ─────

function genG1CountObjects(): Problem {
  const rows = randInt(1, 3);
  const cols = randInt(1, 3);
  const answer = rows * cols;
  return withVisual(
    mkInteger("g1-count-objects", "그림을 보고 개수를 세어 보세요.", "점은 모두 몇 개입니까", answer, `${cols}개씩 ${rows}줄이므로 모두 ${answer}개입니다.`),
    { type: "object-array", rows, cols, unit: "개", title: "개수 세기" },
  );
}

function genG1NumberRead(): Problem {
  const answer = randInt(1, 9);
  return withVisual(
    mkInteger("g1-number-read", "수를 읽고 숫자로 쓰세요.", `${answer}개를 나타내는 수를 쓰세요.`, answer, `물건이 ${answer}개이면 수는 ${answer}입니다.`),
    { type: "object-array", rows: 1, cols: answer, unit: "개", title: "수와 양" },
  );
}

function genG1NumberOrder(): Problem {
  const start = randInt(1, 5);
  const answer = start + 3;
  return withVisual(
    mkInteger("g1-number-order", "수의 순서를 보고 빈칸의 수를 구하세요.", `${start}, ${start + 1}, ${start + 2}, □`, answer, `1씩 커지므로 빈칸은 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "수 순서",
      headers: ["순서", 1, 2, 3, 4],
      rows: [["수", start, start + 1, start + 2, "□"]],
    },
  );
}

function genG1CompareSmall(): Problem {
  const a = randInt(1, 9);
  let b = randInt(1, 9);
  if (a === b) b = b === 9 ? 8 : b + 1;
  return {
    topicId: "g1-compare-small",
    prompt: "두 수의 크기를 비교하세요.",
    expression: `${a} □ ${b}`,
    hint: ">, =, < 중 하나 입력",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `${a}와 ${b}의 크기를 비교하면 ${a} ${compareSign(a, b)} ${b}입니다.`,
  };
}

// 학년별 도형군: 낮은 학년은 기본 3종, 높은 학년은 더 세분화된 도형 이름 포함
const GRADE_SHAPE_POOL: Record<number, string[]> = {
  1: ["삼각형", "사각형", "원"],
  2: ["삼각형", "사각형", "원", "직각삼각형", "직사각형"],
  3: ["삼각형", "직각삼각형", "이등변삼각형", "사각형", "직사각형", "정사각형", "원"],
  4: ["삼각형", "직각삼각형", "사각형", "평행사변형", "사다리꼴", "마름모", "원"],
  5: ["삼각형", "사각형", "다각형", "정다각형", "오각형", "육각형", "원"],
  6: ["삼각형", "사각형", "다각형", "원", "오각형", "육각형", "평행사변형", "사다리꼴"],
};

function gradeFromTopicId(topicId: string): number {
  const match = /^g(\d)/.exec(topicId);
  return match ? Number(match[1]) : 1;
}

function pickShapeGroup(topicId: string, count = 3): string[] {
  const grade = gradeFromTopicId(topicId);
  const pool = GRADE_SHAPE_POOL[grade] ?? GRADE_SHAPE_POOL[1]!;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function genG1ShapeName(): Problem {
  const shape = choice([
    { name: "삼각형", desc: "변이 3개인 모양", visual: { type: "triangle", base: 6, height: 5, unit: "" } as const },
    { name: "사각형", desc: "변이 4개인 모양", visual: { type: "rectangle", width: 6, height: 4, unit: "" } as const },
    { name: "원", desc: "둥근 모양", visual: { type: "circle-diagram", mode: "radius", radius: 3, unit: "", title: "둥근 모양" } as const },
    { name: "정사각형", desc: "네 변의 길이가 같은 사각형", visual: { type: "square", side: 5, unit: "" } as const },
  ]);
  const pool = GRADE_SHAPE_POOL[1]!;
  const distractors = pool.filter((s) => s !== shape.name).slice(0, 3);
  return withVisual(
    mkChoice("g1-shape-name", "모양의 이름을 고르세요.", shape.desc, shape.name, distractors, `${shape.desc}은 ${shape.name}입니다.`),
    shape.visual,
  );
}

function genG1ShapeSort(): Problem {
  const triangles = randInt(1, 5);
  const rectangles = randInt(1, 5);
  const circles = randInt(1, 5);
  const target = choice([
    { label: "삼각형", value: triangles },
    { label: "사각형", value: rectangles },
    { label: "원", value: circles },
  ]);
  return withVisual(
    mkInteger("g1-shape-sort", "모양을 분류한 표를 읽으세요.", `${target.label}은 몇 개입니까`, target.value, `표에서 ${target.label}은 ${target.value}개입니다.`),
    {
      type: "data-table",
      caption: "모양 분류",
      headers: ["모양", "삼각형", "사각형", "원"],
      rows: [["개수", triangles, rectangles, circles]],
    },
  );
}

function genG1SplitNumber(): Problem {
  const total = randInt(5, 10);
  const left = randInt(1, total - 1);
  const answer = total - left;
  return withVisual(
    mkInteger("g1-split-number", "수를 가르기 하세요.", `${total}은 ${left}과 □입니다.`, answer, `${left} + ${answer} = ${total}이므로 빈칸은 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "수 가르기",
      headers: ["전체", "한쪽", "다른쪽"],
      rows: [[total, left, "□"]],
    },
  );
}

function genG1AddUnder10(): Problem {
  const a = randInt(1, 8);
  const b = randInt(1, 9 - a);
  const answer = a + b;
  return withVisual(
    mkInteger("g1-add-under-10", "10보다 작은 수의 덧셈을 하세요.", `${a} + ${b} = □`, answer, `${a}에 ${b}를 더하면 ${answer}입니다.`),
    { type: "object-array", rows: 1, cols: answer, unit: "개", title: "덧셈으로 모으기" },
  );
}

function genG1SubUnder10(): Problem {
  const a = randInt(3, 9);
  const b = randInt(1, a - 1);
  const answer = a - b;
  return withVisual(
    mkInteger("g1-sub-under-10", "10보다 작은 수의 뺄셈을 하세요.", `${a} - ${b} = □`, answer, `${a}에서 ${b}를 빼면 ${answer}입니다.`),
    { type: "object-array", rows: 1, cols: a, unit: "개", title: "뺄셈으로 남기기" },
  );
}

function genG1ZeroAddSub(): Problem {
  const a = randInt(1, 9);
  const isAdd = Math.random() < 0.5;
  return withVisual(
    mkInteger("g1-zero-add-sub", "0이 들어간 계산을 하세요.", isAdd ? `${a} + 0 = □` : `${a} - 0 = □`, a, `0을 더하거나 빼면 수는 그대로 ${a}입니다.`),
    { type: "object-array", rows: 1, cols: a, unit: "개", title: "0과 계산" },
  );
}

function genG1MakeTen(): Problem {
  const a = randInt(1, 9);
  const answer = 10 - a;
  return withVisual(
    mkInteger("g1-make-ten", "10이 되도록 빈칸의 수를 구하세요.", `${a} + □ = 10`, answer, `${a}에 ${answer}을 더하면 10이 됩니다.`),
    {
      type: "data-table",
      caption: "10 만들기",
      headers: ["첫 수", "더할 수", "합"],
      rows: [[a, "□", 10]],
    },
  );
}

function genG1NumberLineMissing(): Problem {
  const step = choice([1, 2, 5, 10]);
  const start = step === 10 ? randInt(1, 4) * 10 : randInt(1, 8) * step;
  const answer = start + step * 4;
  return withVisual(
    mkInteger("g1-number-line-missing", "규칙을 보고 빈칸의 수를 구하세요.", `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, □`, answer, `${step}씩 커지므로 빈칸은 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "수 배열",
      headers: ["차례", 1, 2, 3, 4, 5],
      rows: [["수", start, start + step, start + step * 2, start + step * 3, "□"]],
    },
  );
}

function genG1TensOnesRead(): Problem {
  const tens = randInt(1, 9);
  const ones = randInt(0, 9);
  const answer = tens * 10 + ones;
  return withVisual(
    mkInteger("g1-tens-ones-read", "십의 자리와 일의 자리를 보고 수를 쓰세요.", `10이 ${tens}개, 1이 ${ones}개인 수`, answer, `${tens}0 + ${ones} = ${answer}입니다.`),
    {
      type: "data-table",
      caption: "십과 일",
      headers: ["10", "1"],
      rows: [[tens, ones]],
    },
  );
}

function genG1CountByTens(): Problem {
  const start = randInt(1, 5) * 10;
  const answer = start + 30;
  return mkInteger("g1-count-by-tens", "10씩 뛰어 세어 보세요.", `${start}, ${start + 10}, ${start + 20}, □`, answer, `10씩 커지므로 빈칸은 ${answer}입니다.`);
}

function genG1TwoDigitCompare(): Problem {
  const a = randInt(10, 99);
  let b = randInt(10, 99);
  if (a === b) b = b === 99 ? 98 : b + 1;
  return {
    topicId: "g1-two-digit-compare",
    prompt: "두 자리 수의 크기를 비교하세요.",
    expression: `${a} □ ${b}`,
    hint: ">, =, < 중 하나 입력",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `십의 자리부터 비교하면 ${a} ${compareSign(a, b)} ${b}입니다.`,
  };
}

function genG1TwoDigitOrder(): Problem {
  const nums = shuffle([randInt(10, 30), randInt(31, 60), randInt(61, 99)]);
  const answer = Math.max(...nums);
  return mkInteger("g1-two-digit-order", "세 수 중 가장 큰 수를 쓰세요.", nums.join(", "), answer, `십의 자리부터 비교하면 가장 큰 수는 ${answer}입니다.`);
}

function genG1AddUnder20(): Problem {
  const a = randInt(6, 12);
  const b = randInt(1, Math.min(7, 18 - a));
  const answer = a + b;
  return withVisual(
    mkInteger("g1-add-under-20", "20보다 작은 수의 덧셈을 하세요.", `${a} + ${b} = □`, answer, `${a}에 ${b}를 더하면 ${answer}입니다.`),
    { type: "object-array", rows: 1, cols: answer, unit: "개", title: "20 안의 덧셈" },
  );
}

function genG1SubUnder20(): Problem {
  const a = randInt(11, 18);
  const b = randInt(1, 9);
  const answer = a - b;
  return withVisual(
    mkInteger("g1-sub-under-20", "20보다 작은 수의 뺄셈을 하세요.", `${a} - ${b} = □`, answer, `${a}에서 ${b}를 빼면 ${answer}입니다.`),
    { type: "object-array", rows: 1, cols: a, unit: "개", title: "20 안의 뺄셈" },
  );
}

function genG1AddNoCarry(): Problem {
  const tens = randInt(1, 8);
  const ones = randInt(0, 7);
  const a = tens * 10 + ones;
  const b = randInt(1, 9 - ones);
  return mkInteger("g1-add-no-carry", "받아올림 없는 덧셈을 하세요.", `${a} + ${b} = □`, a + b, `일의 자리끼리 더하면 ${a + b}입니다.`);
}

function genG1SubNoBorrow(): Problem {
  const tens = randInt(2, 9);
  const ones = randInt(1, 9);
  const a = tens * 10 + ones;
  const b = randInt(1, ones);
  return mkInteger("g1-sub-no-borrow", "받아내림 없는 뺄셈을 하세요.", `${a} - ${b} = □`, a - b, `일의 자리에서 ${b}를 빼도 받아내림이 없으므로 ${a - b}입니다.`);
}

function genG1WordAddSubSmall(): Problem {
  const start = randInt(3, 9);
  const change = randInt(1, 5);
  const isAdd = Math.random() < 0.5 || start <= change;
  const answer = isAdd ? start + change : start - change;
  return withVisual(
    mkInteger("g1-word-add-sub-small", "문장을 읽고 알맞은 수를 구하세요.", isAdd ? `사탕이 ${start}개 있습니다. ${change}개를 더 받으면 모두 몇 개입니까` : `사탕이 ${start}개 있습니다. ${change}개를 먹으면 몇 개가 남습니까`, answer, isAdd ? `${start} + ${change} = ${answer}입니다.` : `${start} - ${change} = ${answer}입니다.`),
    { type: "object-array", rows: 1, cols: isAdd ? answer : start, unit: "개", title: "문장제 그림" },
  );
}

function genG1WordAddSubTwoDigit(): Problem {
  const start = randInt(21, 60);
  const change = randInt(3, 9);
  const isAdd = Math.random() < 0.5;
  const answer = isAdd ? start + change : start - change;
  return mkInteger("g1-word-add-sub-two-digit", "두 자리 수 문장제를 풀어 보세요.", isAdd ? `색종이가 ${start}장 있습니다. ${change}장을 더 받았습니다. 모두 몇 장입니까` : `색종이가 ${start}장 있습니다. ${change}장을 사용했습니다. 남은 색종이는 몇 장입니까`, answer, isAdd ? `${start} + ${change} = ${answer}입니다.` : `${start} - ${change} = ${answer}입니다.`);
}

function genG1ClockHour(): Problem {
  const hour = randInt(1, 12);
  const answer = `${hour}시`;
  return withVisual(
    mkChoice("g1-clock-hour", "시계를 보고 시각을 고르세요.", "긴바늘이 12를 가리키는 시각입니다.", answer, [`${hour === 12 ? 1 : hour + 1}시`, `${Math.max(1, hour - 1)}시`, `${hour}시 반`], `시침이 ${hour}을 가리키고 긴바늘이 12를 가리키므로 ${answer}입니다.`),
    { type: "clock", hour, minute: 0, title: "몇 시" },
  );
}

function genG1ClockHalf(): Problem {
  const hour = randInt(1, 12);
  const answer = `${hour}시 반`;
  return withVisual(
    mkChoice("g1-clock-half", "시계를 보고 시각을 고르세요.", "긴바늘이 6을 가리키는 시각입니다.", answer, [`${hour}시`, `${hour === 12 ? 1 : hour + 1}시`, `${Math.max(1, hour - 1)}시 반`], `긴바늘이 6을 가리키면 30분, 즉 ${answer}입니다.`),
    { type: "clock", hour, minute: 30, title: "몇 시 반" },
  );
}

function genG1PatternShape(): Problem {
  const patterns = [
    { seq: ["△", "○", "△", "○"], next: "△" },
    { seq: ["□", "○", "□", "○"], next: "□" },
    { seq: ["빨강", "파랑", "빨강", "파랑"], next: "빨강" },
  ];
  const item = choice(patterns);
  return withVisual(
    mkChoice("g1-pattern-shape", "무늬의 규칙을 보고 다음 것을 고르세요.", `${item.seq.join("  ")}  □`, item.next, ["△", "○", "□", "빨강", "파랑", "노랑"].filter((value) => value !== item.next), `반복되는 규칙을 따르면 다음은 ${item.next}입니다.`),
    { type: "shape-pattern", items: [...item.seq, "?"], title: "무늬 규칙" },
  );
}

function genG1PatternNumber(): Problem {
  const step = choice([1, 2, 5, 10]);
  const start = randInt(1, 5) * step;
  const answer = start + step * 4;
  return mkInteger("g1-pattern-number", "수 규칙을 보고 빈칸의 수를 구하세요.", `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, □`, answer, `${step}씩 커지므로 빈칸은 ${answer}입니다.`);
}

function genG1DataTableRead(): Problem {
  const items = [
    { label: "사과", value: randInt(2, 9) },
    { label: "배", value: randInt(2, 9) },
    { label: "귤", value: randInt(2, 9) },
  ];
  const target = choice(items);
  return withVisual(
    mkInteger("g1-data-table-read", "표를 보고 알맞은 수를 쓰세요.", `${target.label}는 몇 개입니까`, target.value, `표에서 ${target.label}는 ${target.value}개입니다.`),
    {
      type: "data-table",
      caption: "과일 조사표",
      headers: items.map((item) => item.label),
      rows: [items.map((item) => item.value)],
    },
  );
}

function genG1PictographRead(): Problem {
  const bigCount = randInt(1, 5);
  const smallCount = randInt(0, 1);
  const answer = bigCount * 2 + smallCount;
  return withVisual(
    mkInteger("g1-pictograph-read", "그림그래프의 수를 구하세요.", "큰 그림은 2개, 작은 그림은 1개를 나타냅니다. 모두 몇 개입니까", answer, `${bigCount} × 2 + ${smallCount} = ${answer}입니다.`),
    {
      type: "pictograph",
      title: "좋아하는 간식 그림그래프",
      unit: "개",
      bigValue: 2,
      smallValue: 1,
      items: [{ label: "간식", bigCount, smallCount }],
    },
  );
}

function genG1LengthCompare(): Problem {
  const pencil = randInt(7, 18);
  let crayon = randInt(7, 18);
  if (pencil === crayon) crayon += 1;
  const answer = pencil > crayon ? "연필" : "색연필";
  return withVisual(
    mkChoice("g1-length-compare", "길이를 비교해 더 긴 것을 고르세요.", `연필 ${pencil} cm, 색연필 ${crayon} cm`, answer, ["연필", "색연필", "둘 다 같음", "알 수 없음"], `${pencil} cm와 ${crayon} cm를 비교하면 ${answer}이 더 깁니다.`),
    {
      type: "data-table",
      caption: "길이 비교",
      headers: ["물건", "연필", "색연필"],
      rows: [["길이", `${pencil} cm`, `${crayon} cm`]],
    },
  );
}

function genG1WeightCompare(): Problem {
  const book = randInt(4, 9);
  let ball = randInt(2, 8);
  if (book === ball) ball = ball === 8 ? 7 : ball + 1;
  const answer = book > ball ? "책" : "공";
  return withVisual(
    mkChoice("g1-weight-compare", "무게를 비교해 더 무거운 것을 고르세요.", `책은 ${book}칸, 공은 ${ball}칸만큼 무겁습니다.`, answer, ["책", "공", "둘 다 같음", "알 수 없음"], `${book}칸과 ${ball}칸을 비교하면 ${answer}이 더 무겁습니다.`),
    {
      type: "bar-chart",
      title: "무게 비교 막대",
      unit: "칸",
      items: [
        { label: "책", value: book },
        { label: "공", value: ball },
      ],
    },
  );
}

function genG1CapacityCompare(): Problem {
  const bottle = randInt(5, 10);
  let cup = randInt(2, 9);
  if (bottle === cup) cup = cup === 9 ? 8 : cup + 1;
  const answer = bottle > cup ? "물병" : "컵";
  return withVisual(
    mkChoice("g1-capacity-compare", "담을 수 있는 양을 비교해 더 많이 담는 것을 고르세요.", `물병은 ${bottle}칸, 컵은 ${cup}칸만큼 담을 수 있습니다.`, answer, ["물병", "컵", "둘 다 같음", "알 수 없음"], `${bottle}칸과 ${cup}칸을 비교하면 ${answer}이 더 많이 담습니다.`),
    {
      type: "bar-chart",
      title: "담을 수 있는 양 비교",
      unit: "칸",
      items: [
        { label: "물병", value: bottle },
        { label: "컵", value: cup },
      ],
    },
  );
}

function genG1OddEven(): Problem {
  const n = randInt(10, 99);
  const answer = n % 2 === 0 ? "짝수" : "홀수";
  return withVisual(
    mkChoice("g1-odd-even", "수를 보고 짝수인지 홀수인지 고르세요.", `${n}은 어떤 수입니까`, answer, answer === "짝수" ? ["홀수", "큰 수", "작은 수"] : ["짝수", "큰 수", "작은 수"], `일의 자리 숫자 ${n % 10}을 보면 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "짝수와 홀수 확인",
      headers: ["수", "십의 자리", "일의 자리"],
      rows: [[n, Math.floor(n / 10), n % 10]],
    },
  );
}

function genG1ThreeNumberAddSub(): Problem {
  if (Math.random() < 0.5) {
    const a = randInt(1, 6);
    const b = randInt(1, 6);
    const c = randInt(1, 6);
    const answer = a + b + c;
    return withVisual(
      mkInteger("g1-three-number-add", "세 수의 덧셈을 하세요.", `${a} + ${b} + ${c} = □`, answer, `앞에서부터 더하면 ${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${answer}입니다.`),
      {
        type: "data-table",
        caption: "세 수의 덧셈 순서",
        headers: ["첫째", "둘째", "셋째", "합"],
        rows: [[a, b, c, "□"]],
      },
    );
  }
  const a = randInt(12, 20);
  const b = randInt(1, 6);
  const c = randInt(1, Math.min(6, a - b - 1));
  const answer = a - b - c;
  return withVisual(
    mkInteger("g1-three-number-sub", "세 수의 뺄셈을 하세요.", `${a} - ${b} - ${c} = □`, answer, `앞에서부터 빼면 ${a} - ${b} = ${a - b}, ${a - b} - ${c} = ${answer}입니다.`),
    {
      type: "data-table",
      caption: "세 수의 뺄셈 순서",
      headers: ["처음", "뺀 수", "또 뺀 수", "남은 수"],
      rows: [[a, b, c, "□"]],
    },
  );
}

function genG1TwoDigitAddNoCarryWide(): Problem {
  const tensA = randInt(1, 7);
  const onesA = randInt(0, 8);
  const tensB = randInt(1, 9 - tensA);
  const onesB = randInt(0, 9 - onesA);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  const answer = a + b;
  return withVisual(
    mkInteger("g1-two-digit-add-wide", "받아올림이 없는 두 자리 수 덧셈을 하세요.", `${a} + ${b} = □`, answer, `십의 자리끼리, 일의 자리끼리 더하면 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "두 자리 수 덧셈",
      headers: ["", "십", "일"],
      rows: [
        ["첫째 수", tensA, onesA],
        ["둘째 수", tensB, onesB],
        ["합", Math.floor(answer / 10), answer % 10],
      ],
    },
  );
}

function genG1TwoDigitSubNoBorrowWide(): Problem {
  const tensA = randInt(3, 9);
  const onesA = randInt(1, 9);
  const tensB = randInt(1, tensA - 1);
  const onesB = randInt(0, onesA);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  const answer = a - b;
  return withVisual(
    mkInteger("g1-two-digit-sub-wide", "받아내림이 없는 두 자리 수 뺄셈을 하세요.", `${a} - ${b} = □`, answer, `십의 자리끼리, 일의 자리끼리 빼면 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "두 자리 수 뺄셈",
      headers: ["", "십", "일"],
      rows: [
        ["처음 수", tensA, onesA],
        ["빼는 수", tensB, onesB],
        ["차", Math.floor(answer / 10), answer % 10],
      ],
    },
  );
}

function genG1TwoDigitSubBorrow(): Problem {
  const tensA = randInt(2, 9);
  const onesA = randInt(0, 4);
  const onesB = randInt(onesA + 1, 9);
  const tensB = randInt(0, tensA - 1);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  const answer = a - b;
  return withVisual(
    mkInteger("g1-two-digit-sub-borrow", "받아내림이 있는 뺄셈을 하세요.", `${a} - ${b} = □`, answer, `일의 자리에서 바로 뺄 수 없으므로 십의 자리에서 1을 받아내려 계산하면 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "받아내림 뺄셈",
      headers: ["", "십", "일"],
      rows: [
        ["처음 수", tensA, onesA],
        ["빼는 수", tensB, onesB],
        ["차", Math.floor(answer / 10), answer % 10],
      ],
    },
  );
}

function genG1ClassifyTable(): Problem {
  const red = randInt(2, 8);
  const blue = randInt(2, 8);
  const yellow = randInt(2, 8);
  const target = choice([
    { label: "빨강", value: red },
    { label: "파랑", value: blue },
    { label: "노랑", value: yellow },
  ]);
  return withVisual(
    mkInteger("g1-classify-table", "분류한 표를 보고 개수를 쓰세요.", `${target.label} 물건은 몇 개입니까`, target.value, `표에서 ${target.label} 물건은 ${target.value}개입니다.`),
    {
      type: "bar-chart",
      title: "색깔별 분류 그래프",
      unit: "개",
      items: [
        { label: "빨강", value: red },
        { label: "파랑", value: blue },
        { label: "노랑", value: yellow },
      ],
    },
  );
}

function genG1MultiplicationIntro(): Problem {
  const rows = randInt(2, 5);
  const cols = randInt(2, 5);
  const answer = rows * cols;
  return withVisual(
    mkInteger("g1-multiplication-intro", "같은 수씩 몇 묶음인지 보고 모두 몇 개인지 구하세요.", `${cols}개씩 ${rows}묶음입니다. 모두 몇 개입니까`, answer, `${cols}개씩 ${rows}묶음이므로 ${cols} + ${cols} + ... = ${answer}입니다.`),
    { type: "object-array", rows, cols, unit: "개", title: "곱셈 준비 배열" },
  );
}

function genG1WeekOrder(): Problem {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const index = randInt(0, 5);
  const answer = `${days[index + 1]}요일`;
  return mkChoice("g1-week-order", "요일의 순서를 고르세요.", `${days[index]}요일 다음 날은 무슨 요일입니까`, answer, days.map((day) => `${day}요일`).filter((day) => day !== answer), `${days[index]}요일 다음은 ${answer}입니다.`);
}

function genG1ReviewAddSub(): Problem {
  return Math.random() < 0.5 ? retopic("g1-review-add-sub", genG1AddUnder20()) : retopic("g1-review-add-sub", genG1SubUnder20());
}

function genG1OperationAddWithin(maxSum = 9, bridgeTen = false): Problem {
  const a = bridgeTen ? randInt(6, 9) : randInt(1, maxSum - 1);
  const minB = bridgeTen ? Math.max(10 - a, 1) : 1;
  const maxB = bridgeTen ? Math.min(9, 18 - a) : maxSum - a;
  const b = randInt(minB, maxB);
  const answer = a + b;
  return withVisual(
    mkInteger("g1-operation-add-within", "수학연산 덧셈을 계산하세요.", `${a} + ${b} = □`, answer, `${a}에 ${b}를 더하면 ${answer}입니다.`),
    { type: "ten-frame", filled: answer, total: bridgeTen ? 20 : 10, splitAt: a, title: bridgeTen ? "10칸틀 두 줄로 받아올림 보기" : "10칸틀 덧셈" },
  );
}

function genG1OperationSubWithin(maxStart = 9, bridgeTen = false): Problem {
  const a = bridgeTen ? randInt(11, 18) : randInt(3, maxStart);
  const minB = bridgeTen ? Math.max(2, a - 9) : 1;
  const maxB = bridgeTen ? Math.min(9, a - 1) : a - 1;
  const b = randInt(minB, maxB);
  const answer = a - b;
  return withVisual(
    mkInteger("g1-operation-sub-within", "수학연산 뺄셈을 계산하세요.", `${a} - ${b} = □`, answer, `${a}에서 ${b}를 빼면 ${answer}입니다.`),
    { type: "ten-frame", filled: answer, total: bridgeTen ? 20 : 10, title: bridgeTen ? "남은 수를 10칸틀로 확인" : "10칸틀 뺄셈" },
  );
}

function genG1OperationNumberBond(maxTotal = 9): Problem {
  const total = randInt(5, maxTotal);
  const known = randInt(1, total - 1);
  const answer = total - known;
  return withVisual(
    mkInteger("g1-operation-number-bond", "가르기와 모으기 연산을 하세요.", `${total} = ${known} + □`, answer, `${known}와 ${answer}을 모으면 ${total}입니다.`),
    { type: "number-bond", total, left: known, right: "□", title: "수 가르기 모형" },
  );
}

function genG1OperationMissingAdd(maxTotal = 10): Problem {
  const total = randInt(5, maxTotal);
  const known = randInt(1, total - 1);
  const answer = total - known;
  return withVisual(
    mkInteger("g1-operation-missing-add", "빈칸에 들어갈 수를 구하세요.", `${known} + □ = ${total}`, answer, `${known}에서 ${total}이 되려면 ${answer}을 더해야 합니다.`),
    { type: "number-bond", total, left: known, right: "□", title: "빈칸 덧셈 모형" },
  );
}

function genG1OperationZero(): Problem {
  const n = randInt(1, 20);
  const isAdd = Math.random() < 0.5;
  return withVisual(
    mkInteger("g1-operation-zero", "0이 있는 수학연산을 계산하세요.", isAdd ? `${n} + 0 = □` : `${n} - 0 = □`, n, `0을 더하거나 빼도 수는 ${n}으로 그대로입니다.`),
    { type: "ten-frame", filled: n, total: n > 10 ? 20 : 10, title: "0을 더해도 그대로인 수" },
  );
}

function genG1OperationMakeTen(): Problem {
  const a = randInt(1, 9);
  const answer = 10 - a;
  return withVisual(
    mkInteger("g1-operation-make-ten", "10이 되도록 더할 수를 구하세요.", `${a} + □ = 10`, answer, `${a}에 ${answer}을 더하면 10입니다.`),
    { type: "ten-frame", filled: a, total: 10, splitAt: a, title: "10칸틀로 10 만들기" },
  );
}

function genG1OperationWord(maxValue = 10): Problem {
  const start = randInt(3, maxValue);
  const change = randInt(1, Math.min(6, maxValue));
  const isAdd = Math.random() < 0.5 || start <= change;
  const answer = isAdd ? start + change : start - change;
  return withVisual(
    mkInteger(
      "g1-operation-word",
      "문장을 식으로 바꾸어 계산하세요.",
      isAdd ? `구슬이 ${start}개 있습니다. ${change}개를 더 받으면 모두 몇 개입니까` : `구슬이 ${start}개 있습니다. ${change}개를 쓰면 몇 개가 남습니까`,
      answer,
      isAdd ? `${start} + ${change} = ${answer}입니다.` : `${start} - ${change} = ${answer}입니다.`,
    ),
    { type: "object-array", rows: 1, cols: isAdd ? Math.min(answer, 20) : start, unit: "개", title: "문장제 연산 그림" },
  );
}

function genG1OperationTensOnes(): Problem {
  const tens = randInt(1, 9);
  const ones = randInt(0, 9);
  const answer = tens * 10 + ones;
  return withVisual(
    mkInteger("g1-operation-tens-ones", "10묶음과 낱개를 보고 수를 쓰세요.", `10묶음 ${tens}개와 낱개 ${ones}개`, answer, `10묶음 ${tens}개는 ${tens * 10}, 낱개 ${ones}개를 더해 ${answer}입니다.`),
    { type: "place-value-blocks", tens, ones, title: "10묶음과 낱개 블록" },
  );
}

function genG1OperationTwoDigitAddNoCarry(): Problem {
  const tens = randInt(1, 8);
  const ones = randInt(0, 8);
  const a = tens * 10 + ones;
  const b = randInt(1, 9 - ones);
  const answer = a + b;
  return withVisual(
    mkInteger("g1-operation-two-digit-add-no-carry", "받아올림 없는 두 자리 수와 한 자리 수 덧셈을 하세요.", `${a} + ${b} = □`, answer, `일의 자리 ${ones}와 ${b}를 더해도 10이 넘지 않으므로 ${answer}입니다.`),
    { type: "place-value-blocks", tens: Math.floor(answer / 10), ones: answer % 10, title: "합을 자리값 블록으로 확인" },
  );
}

function genG1OperationTwoDigitSubNoBorrow(): Problem {
  const tens = randInt(2, 9);
  const ones = randInt(1, 9);
  const a = tens * 10 + ones;
  const b = randInt(1, ones);
  const answer = a - b;
  return withVisual(
    mkInteger("g1-operation-two-digit-sub-no-borrow", "받아내림 없는 두 자리 수와 한 자리 수 뺄셈을 하세요.", `${a} - ${b} = □`, answer, `일의 자리 ${ones}에서 ${b}를 바로 빼면 ${answer}입니다.`),
    { type: "place-value-blocks", tens: Math.floor(answer / 10), ones: answer % 10, title: "차를 자리값 블록으로 확인" },
  );
}

function genG1OperationCountByTens(): Problem {
  const start = randInt(1, 6) * 10;
  const answer = start + 30;
  const values = [start, start + 10, start + 20, answer];
  return withVisual(
    mkInteger("g1-operation-count-by-tens", "10씩 뛰어 세어 빈칸을 채우세요.", `${start}, ${start + 10}, ${start + 20}, □`, answer, `10씩 세면 ${start + 10}, ${start + 20}, ${answer}입니다.`),
    { type: "number-line", values, missingIndex: 3, title: "10씩 뛰어 세는 수직선" },
  );
}

function genG1OperationThreeNumber(mode: "add" | "sub" | "mixed" = "mixed"): Problem {
  if (mode === "add") {
    const a = randInt(2, 7);
    const b = randInt(1, 6);
    const c = randInt(1, Math.min(6, 20 - a - b));
    const answer = a + b + c;
    return withVisual(
      mkInteger("g1-operation-three-number-add", "세 수의 덧셈을 계산하세요.", `${a} + ${b} + ${c} = □`, answer, `${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${answer}입니다.`),
      {
        type: "data-table",
        caption: "세 수 덧셈 순서",
        headers: ["1단계", "2단계", "답"],
        rows: [[`${a} + ${b}`, `${a + b} + ${c}`, "□"]],
      },
    );
  }

  if (mode === "sub") {
    const a = randInt(12, 20);
    const b = randInt(1, 6);
    const c = randInt(1, Math.min(6, a - b - 1));
    const answer = a - b - c;
    return withVisual(
      mkInteger("g1-operation-three-number-sub", "세 수의 뺄셈을 계산하세요.", `${a} - ${b} - ${c} = □`, answer, `${a} - ${b} = ${a - b}, ${a - b} - ${c} = ${answer}입니다.`),
      {
        type: "data-table",
        caption: "세 수 뺄셈 순서",
        headers: ["1단계", "2단계", "답"],
        rows: [[`${a} - ${b}`, `${a - b} - ${c}`, "□"]],
      },
    );
  }

  const a = randInt(5, 12);
  const b = randInt(1, 6);
  const c = randInt(1, Math.min(6, a + b - 1));
  const answer = a + b - c;
  return withVisual(
    mkInteger("g1-operation-three-number-mixed", "덧셈과 뺄셈이 섞인 식을 차례대로 계산하세요.", `${a} + ${b} - ${c} = □`, answer, `${a} + ${b} = ${a + b}, ${a + b} - ${c} = ${answer}입니다.`),
    {
      type: "data-table",
      caption: "혼합 연산 순서",
      headers: ["1단계", "2단계", "답"],
      rows: [[`${a} + ${b}`, `${a + b} - ${c}`, "□"]],
    },
  );
}

function genG1OperationCompareFacts(): Problem {
  const leftA = randInt(1, 9);
  const leftB = randInt(1, 9);
  const rightA = randInt(11, 19);
  const rightB = randInt(1, 9);
  const left = leftA + leftB;
  const right = rightA - rightB;
  const answer = left === right ? "같음" : left > right ? "왼쪽" : "오른쪽";
  return withVisual(
    mkChoice("g1-operation-compare-facts", "두 식을 계산해 더 큰 쪽을 고르세요.", `왼쪽: ${leftA} + ${leftB}, 오른쪽: ${rightA} - ${rightB}`, answer, ["왼쪽", "오른쪽", "같음"], `왼쪽은 ${left}, 오른쪽은 ${right}이므로 ${answer}입니다.`),
    {
      type: "bar-chart",
      title: "계산 결과 비교 막대그래프",
      unit: "",
      items: [
        { label: "왼쪽", value: left },
        { label: "오른쪽", value: right },
      ],
    },
  );
}

function genG1OperationMissingOperator(): Problem {
  const isAdd = Math.random() < 0.5;
  const a = isAdd ? randInt(1, 9) : randInt(5, 18);
  const b = isAdd ? randInt(1, 9) : randInt(1, Math.min(9, a - 1));
  const result = isAdd ? a + b : a - b;
  const answer = isAdd ? "+" : "-";
  return withVisual(
    mkChoice("g1-operation-missing-operator", "□ 안에 들어갈 연산 기호를 고르세요.", `${a} □ ${b} = ${result}`, answer, ["+", "-"], `${a} ${answer} ${b} = ${result}입니다.`),
    {
      type: "data-table",
      caption: "연산 기호 찾기",
      headers: ["첫째 수", "기호", "둘째 수", "결과"],
      rows: [[a, "□", b, result]],
    },
  );
}

function genG1OperationFactFamily(maxSum = 20): Problem {
  const a = randInt(1, 9);
  const b = randInt(1, Math.min(9, maxSum - a));
  const sum = a + b;
  const askSub = Math.random() < 0.5;
  const expression = askSub ? `${sum} - ${a} = □` : `${a} + □ = ${sum}`;
  const answer = b;
  return withVisual(
    mkInteger("g1-operation-fact-family", "덧셈과 뺄셈의 관계를 이용하세요.", expression, answer, `${a} + ${b} = ${sum}이므로 빈칸은 ${answer}입니다.`),
    { type: "number-bond", total: sum, left: a, right: askSub ? "□" : "□", title: "덧셈·뺄셈 관계 모형" },
  );
}

// ── 2학년 PDF 기반 기초력 문제: 도형·표·그래프·시계 시각 자료 포함 ────────────────

function genG2ShapeName(): Problem {
  const shape = choice([
    { name: "삼각형", desc: "변이 3개인 도형", visual: { type: "triangle", base: 6, height: 5, unit: "" } as const },
    { name: "사각형", desc: "변이 4개인 도형", visual: { type: "rectangle", width: 6, height: 4, unit: "" } as const },
    { name: "원", desc: "둥근 모양의 도형", visual: { type: "circle-diagram", mode: "radius", radius: 3, unit: "", title: "둥근 도형" } as const },
  ]);
  const pool = GRADE_SHAPE_POOL[2]!;
  const distractors = pool.filter((s) => s !== shape.name).slice(0, 3);
  return withVisual(
    mkChoice("g2-shape-name", "도형의 이름을 고르세요.", shape.desc, shape.name, distractors, `${shape.desc}은 ${shape.name}입니다.`),
    shape.visual,
  );
}

function genG2ShapeSideCount(): Problem {
  const shape = choice([
    { name: "삼각형", sides: 3 },
    { name: "사각형", sides: 4 },
    { name: "오각형", sides: 5 },
  ]);
  return withVisual(
    mkInteger("g2-shape-side-count", "도형의 변의 수를 구하세요.", `${shape.name}의 변은 몇 개입니까`, shape.sides, `${shape.name}은 변이 ${shape.sides}개입니다.`),
    {
      type: "data-table",
      caption: "도형 변의 수",
      headers: ["도형", "변의 수"],
      rows: [[shape.name, "□"]],
    },
  );
}

function genG2ShapeSort(): Problem {
  const shapes = pickShapeGroup("g2-shape-sort", 3);
  const counts = shapes.map((label) => ({ label, value: randInt(2, 6) }));
  const target = choice(counts);
  return withVisual(
    mkInteger("g2-shape-sort", "도형을 기준에 따라 분류하고 세어 보세요.", `${target.label}은 몇 개입니까`, target.value, `표에서 ${target.label}의 개수는 ${target.value}개입니다.`),
    {
      type: "data-table",
      caption: "도형 분류표",
      headers: ["도형", ...shapes],
      rows: [["개수", ...counts.map((c) => c.value)]],
    },
  );
}

function genG2ThreeDigitRead(): Problem {
  const hundreds = randInt(1, 9);
  const tens = randInt(0, 9);
  const ones = randInt(0, 9);
  const answer = hundreds * 100 + tens * 10 + ones;
  return withVisual(
    mkInteger(
      "g2-three-digit-read",
      "백, 십, 일을 보고 세 자리 수를 쓰세요.",
      `100이 ${hundreds}개, 10이 ${tens}개, 1이 ${ones}개인 수`,
      answer,
      `${hundreds}00 + ${tens}0 + ${ones} = ${answer}입니다.`,
    ),
    { type: "base-ten-blocks", hundreds, tens, ones, title: "백·십·일 자리값 블록" },
  );
}

function genG2ThreeDigitPlaceValue(): Problem {
  const n = randInt(200, 999);
  const digit = choice([
    { place: "백의 자리", value: Math.floor(n / 100) * 100 },
    { place: "십의 자리", value: Math.floor((n % 100) / 10) * 10 },
    { place: "일의 자리", value: n % 10 },
  ]);
  return withVisual(
    mkInteger("g2-three-digit-place-value", "자리의 숫자가 나타내는 값을 구하세요.", `${n}에서 ${digit.place} 숫자가 나타내는 값은 얼마입니까`, digit.value, `${digit.place}의 값을 읽으면 ${digit.value}입니다.`),
    { type: "base-ten-blocks", hundreds: Math.floor(n / 100), tens: Math.floor((n % 100) / 10), ones: n % 10, title: `${n}의 자리값 블록` },
  );
}

function genG2NumberCompare(): Problem {
  const a = randInt(120, 999);
  let b = randInt(120, 999);
  if (a === b) b += 1;
  return {
    topicId: "g2-number-compare",
    prompt: "두 수의 크기를 비교하세요.",
    expression: `${a} □ ${b}`,
    hint: ">, =, < 중 하나를 입력",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `큰 자리부터 비교하면 ${a} ${compareSign(a, b)} ${b}입니다.`,
  };
}

function genG2SkipCount(): Problem {
  const step = choice([2, 5, 10, 100]);
  const start = step === 100 ? randInt(1, 5) * 100 : randInt(2, 20) * step;
  const answer = start + step * 4;
  const values = [start, start + step, start + step * 2, start + step * 3, answer];
  return withVisual(
    mkInteger("g2-skip-count", "뛰어 세기 규칙을 보고 빈칸의 수를 구하세요.", `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, □`, answer, `${step}씩 커지므로 빈칸은 ${answer}입니다.`),
    { type: "number-line", values, missingIndex: 4, title: `${step}씩 뛰어 세는 수직선` },
  );
}

function genG2TwoDigitAdd(): Problem {
  const a = randInt(21, 78);
  const b = randInt(11, 19);
  return withVisual(
    mkInteger("g2-two-digit-add", "두 자리 수의 덧셈을 계산하세요.", `${a} + ${b} = □`, a + b, `일의 자리와 십의 자리를 차례대로 더하면 ${a + b}입니다.`),
    {
      type: "data-table",
      caption: "덧셈 자리값 표",
      headers: ["수", "십", "일"],
      rows: [
        [a, Math.floor(a / 10), a % 10],
        [b, Math.floor(b / 10), b % 10],
      ],
    },
  );
}

function genG2TwoDigitSub(): Problem {
  const b = randInt(12, 48);
  const a = b + randInt(15, 49);
  return withVisual(
    mkInteger("g2-two-digit-sub", "두 자리 수의 뺄셈을 계산하세요.", `${a} - ${b} = □`, a - b, `${a}에서 ${b}를 빼면 ${a - b}입니다.`),
    {
      type: "data-table",
      caption: "뺄셈 검산",
      headers: ["처음 수", "빼는 수", "차"],
      rows: [[a, b, "□"]],
    },
  );
}

function genG2ThreeDigitAddSub(): Problem {
  const a = randInt(120, 560);
  const b = randInt(100, 320);
  const mode = choice(["add", "sub"]);
  const left = mode === "add" ? a : a + b;
  const answer = mode === "add" ? a + b : left - b;
  const expression = mode === "add" ? `${a} + ${b} = □` : `${left} - ${b} = □`;
  return mkInteger("g2-three-digit-add-sub", "세 자리 수 계산을 하세요.", expression, answer, `자리값을 맞추어 계산하면 ${answer}입니다.`);
}

function genG2AddSubWord(): Problem {
  const start = randInt(32, 80);
  const add = randInt(8, 35);
  const sub = randInt(5, Math.min(30, start + add - 1));
  const answer = start + add - sub;
  return withVisual(
    mkInteger("g2-add-sub-word", "표를 보고 남은 수를 구하세요.", `스티커가 ${start}장 있었습니다. ${add}장을 더 받고 ${sub}장을 사용했습니다. 남은 스티커는 몇 장입니까`, answer, `${start} + ${add} - ${sub} = ${answer}입니다.`),
    {
      type: "data-table",
      caption: "스티커 수 변화",
      headers: ["처음", "받은 수", "쓴 수", "남은 수"],
      rows: [[start, add, sub, "□"]],
    },
  );
}

function genG2CmRead(): Problem {
  const length = randInt(3, 30);
  return withVisual(
    mkInteger("g2-cm-read", "자로 잰 길이를 cm로 쓰세요.", `연필의 길이가 ${length} cm입니다. 숫자만 쓰세요.`, length, `자로 읽은 길이는 ${length} cm입니다.`),
    { type: "ruler", length, unit: "cm", max: 30, title: "자에서 길이 읽기" },
  );
}

function genG2CmAddSub(): Problem {
  const a = randInt(12, 60);
  const b = randInt(3, 20);
  const isAdd = Math.random() < 0.5;
  const answer = isAdd ? a + b : a - b;
  return withVisual(
    mkInteger("g2-cm-add-sub", "길이의 덧셈과 뺄셈을 하세요.", isAdd ? `${a} cm + ${b} cm = □ cm` : `${a} cm - ${b} cm = □ cm`, answer, `cm끼리 계산하면 ${answer} cm입니다.`),
    { type: "ruler", length: isAdd ? answer : a, unit: "cm", max: Math.max(60, isAdd ? answer : a), title: "cm 자 그림" },
  );
}

function genG2MeterCmConvert(): Problem {
  const m = randInt(1, 4);
  const cm = choice([5, 10, 20, 35, 50, 75]);
  const answer = m * 100 + cm;
  return withVisual(
    mkInteger("g2-meter-cm-convert", "m와 cm를 cm로 나타내세요.", `${m} m ${cm} cm = □ cm`, answer, `1 m = 100 cm이므로 ${m} m ${cm} cm = ${answer} cm입니다.`),
    {
      type: "data-table",
      caption: "m와 cm 단위 바꾸기",
      headers: ["m", "cm", "전체 cm"],
      rows: [[m, cm, "□"]],
    },
  );
}

function genG2ClassifyTable(): Problem {
  const red = randInt(3, 9);
  const blue = randInt(3, 9);
  const yellow = randInt(3, 9);
  const target = choice([
    { label: "빨간색", value: red },
    { label: "파란색", value: blue },
    { label: "노란색", value: yellow },
  ]);
  return withVisual(
    mkInteger("g2-classify-table", "기준에 따라 분류한 표를 읽으세요.", `${target.label} 구슬은 몇 개입니까`, target.value, `표에서 ${target.label}은 ${target.value}개입니다.`),
    {
      type: "data-table",
      caption: "색깔별 구슬 분류",
      headers: ["색깔", "빨간색", "파란색", "노란색"],
      rows: [["개수", red, blue, yellow]],
    },
  );
}

function genG2ClassifyTotal(): Problem {
  const items = [
    { label: "자동차", value: randInt(3, 8) },
    { label: "인형", value: randInt(3, 8) },
    { label: "블록", value: randInt(3, 8) },
  ];
  const answer = items.reduce((sum, item) => sum + item.value, 0);
  return withVisual(
    mkInteger("g2-classify-total", "분류표를 보고 전체 수를 구하세요.", "장난감은 모두 몇 개입니까", answer, `각 장난감 수를 모두 더하면 ${answer}개입니다.`),
    { type: "bar-chart", title: "장난감 분류", unit: "개", items },
  );
}

function genG2RepeatedAddition(): Problem {
  const addend = randInt(2, 9);
  const count = randInt(2, 6);
  return withVisual(
    mkInteger("g2-repeated-addition", "같은 수를 여러 번 더한 값을 구하세요.", Array.from({ length: count }, () => addend).join(" + ") + " = □", addend * count, `${addend}을 ${count}번 더하면 ${addend * count}입니다.`),
    { type: "object-array", rows: count, cols: addend, unit: "개", title: "같은 수 더하기 배열" },
  );
}

function genG2MultiplicationBasic(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return withVisual(
    mkInteger("g2-multiplication-basic", "곱셈구구를 계산하세요.", `${a} × ${b} = □`, a * b, `${a}씩 ${b}묶음이므로 ${a * b}입니다.`),
    {
      type: "data-table",
      caption: `${a}단`,
      headers: ["곱하는 수", 1, 2, b],
      rows: [["곱", a, a * 2, a * b]],
    },
  );
}

function genG2MultiplicationArray(): Problem {
  const rows = randInt(2, 6);
  const cols = randInt(2, 6);
  return withVisual(
    mkInteger("g2-multiplication-array", "줄과 칸을 보고 곱셈식의 값을 구하세요.", `${rows}줄에 ${cols}개씩 있습니다. 모두 몇 개입니까`, rows * cols, `${cols}개씩 ${rows}줄이므로 ${cols} × ${rows} = ${rows * cols}입니다.`),
    { type: "object-array", rows, cols, unit: "개", title: "배열 곱셈" },
  );
}

function genG2TimesTableMissing(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return mkInteger("g2-times-table-missing", "곱셈식의 빈칸을 구하세요.", `${a} × □ = ${a * b}`, b, `${a} × ${b} = ${a * b}입니다.`);
}

function genG2FourDigitRead(): Problem {
  const thousands = randInt(1, 9);
  const hundreds = randInt(0, 9);
  const tens = randInt(0, 9);
  const ones = randInt(0, 9);
  const answer = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
  return withVisual(
    mkInteger("g2-four-digit-read", "천, 백, 십, 일을 보고 네 자리 수를 쓰세요.", `1000이 ${thousands}개, 100이 ${hundreds}개, 10이 ${tens}개, 1이 ${ones}개인 수`, answer, `각 자리값을 더하면 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "네 자리 수 자리값",
      headers: ["천", "백", "십", "일"],
      rows: [[thousands, hundreds, tens, ones]],
    },
  );
}

function genG2FourDigitPlaceValue(): Problem {
  const n = randInt(1000, 9999);
  const digits = [
    { place: "천의 자리", value: Math.floor(n / 1000) * 1000 },
    { place: "백의 자리", value: Math.floor((n % 1000) / 100) * 100 },
    { place: "십의 자리", value: Math.floor((n % 100) / 10) * 10 },
    { place: "일의 자리", value: n % 10 },
  ];
  const target = choice(digits);
  return withVisual(
    mkInteger("g2-four-digit-place-value", "네 자리 수의 자리값을 구하세요.", `${n}에서 ${target.place} 숫자가 나타내는 값은 얼마입니까`, target.value, `${target.place}의 값을 읽으면 ${target.value}입니다.`),
    {
      type: "data-table",
      caption: `${n}의 자리값`,
      headers: ["천", "백", "십", "일"],
      rows: [[Math.floor(n / 1000), Math.floor((n % 1000) / 100), Math.floor((n % 100) / 10), n % 10]],
    },
  );
}

function genG2FourDigitCompare(): Problem {
  const a = randInt(1000, 9999);
  let b = randInt(1000, 9999);
  if (a === b) b += 1;
  return {
    topicId: "g2-four-digit-compare",
    prompt: "네 자리 수의 크기를 비교하세요.",
    expression: `${a} □ ${b}`,
    hint: ">, =, < 중 하나를 입력",
    answer: compareSign(a, b),
    kind: "compare",
    solution: `천의 자리부터 차례대로 비교하면 ${a} ${compareSign(a, b)} ${b}입니다.`,
  };
}

function genG2FourDigitOrder(): Problem {
  const nums = shuffle([randInt(1000, 3999), randInt(4000, 6999), randInt(7000, 9999)]);
  const answer = Math.max(...nums);
  return mkInteger("g2-four-digit-order", "세 수 중 가장 큰 수를 쓰세요.", nums.join(", "), answer, `천의 자리부터 비교하면 가장 큰 수는 ${answer}입니다.`);
}

function genG2ClockRead(): Problem {
  const hour = randInt(1, 12);
  const minute = choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const answer = minute;
  return withVisual(
    mkInteger("g2-clock-read", "시계를 읽고 분을 쓰세요.", `${hour}시 ${minute}분에서 분은 얼마입니까`, answer, `시각은 ${hour}시 ${minute}분입니다.`),
    { type: "clock", hour, minute, title: "시계 읽기" },
  );
}

function genG2MinutesBefore(): Problem {
  const hour = randInt(2, 12);
  const before = choice([5, 10, 15, 20, 25, 30]);
  const answer = 60 - before;
  return withVisual(
    mkInteger("g2-minutes-before", "몇 시 몇 분 전을 분으로 나타내세요.", `${hour}시 ${before}분 전은 ${hour - 1}시 몇 분입니까`, answer, `${hour}시에서 ${before}분 전은 ${hour - 1}시 ${answer}분입니다.`),
    { type: "clock", hour: hour - 1, minute: answer, title: "몇 분 전 시계" },
  );
}

function genG2ElapsedTime(): Problem {
  const start = randInt(1, 8);
  const elapsed = choice([1, 2, 3, 4]);
  return withVisual(
    mkInteger("g2-elapsed-time", "걸린 시간을 구하세요.", `${start}시에 시작해서 ${start + elapsed}시에 끝났습니다. 몇 시간이 걸렸습니까`, elapsed, `${start + elapsed} - ${start} = ${elapsed}시간입니다.`),
    {
      type: "data-table",
      caption: "시작과 끝 시각",
      headers: ["시작", "끝", "걸린 시간"],
      rows: [[`${start}시`, `${start + elapsed}시`, "□시간"]],
    },
  );
}

function genG2CalendarWeek(): Problem {
  const startDay = randInt(1, 20);
  const answer = startDay + 7;
  return withVisual(
    mkInteger("g2-calendar-week", "달력에서 같은 요일의 날짜를 구하세요.", `${startDay}일과 같은 요일인 다음 날짜는 며칠입니까`, answer, `같은 요일은 7일 뒤이므로 ${startDay} + 7 = ${answer}일입니다.`),
    {
      type: "data-table",
      caption: "요일 규칙",
      headers: ["이번 주", "다음 주"],
      rows: [[`${startDay}일`, "□"]],
    },
  );
}

function genG2TableRead(): Problem {
  const items = [
    { label: "딸기", value: randInt(4, 12) },
    { label: "포도", value: randInt(4, 12) },
    { label: "복숭아", value: randInt(4, 12) },
  ];
  const target = choice(items);
  return withVisual(
    mkInteger("g2-table-read", "표를 보고 수를 읽으세요.", `${target.label}는 몇 개입니까`, target.value, `표에서 ${target.label}는 ${target.value}개입니다.`),
    {
      type: "data-table",
      caption: "과일 조사표",
      headers: items.map((item) => item.label),
      rows: [items.map((item) => item.value)],
    },
  );
}

function genG2PictographRead(): Problem {
  const bigCount = randInt(2, 6);
  const smallCount = randInt(0, 4);
  const answer = bigCount * 5 + smallCount;
  return withVisual(
    mkInteger("g2-pictograph-read", "그림그래프의 수를 구하세요.", "큰 그림은 5개, 작은 그림은 1개를 나타냅니다. 모두 몇 개입니까", answer, `${bigCount} × 5 + ${smallCount} = ${answer}입니다.`),
    {
      type: "pictograph",
      title: "좋아하는 간식 그림그래프",
      unit: "개",
      bigValue: 5,
      smallValue: 1,
      items: [{ label: "간식", bigCount, smallCount }],
    },
  );
}

function genG2PatternShape(): Problem {
  const patterns = [
    { seq: ["△", "○", "△", "○"], next: "△" },
    { seq: ["□", "□", "○", "□", "□", "○"], next: "□" },
    { seq: ["빨강", "파랑", "노랑", "빨강", "파랑"], next: "노랑" },
  ];
  const item = choice(patterns);
  return withVisual(
    mkChoice("g2-pattern-shape", "무늬의 규칙을 보고 다음 것을 고르세요.", `${item.seq.join("  ")}  □`, item.next, ["△", "○", "□", "노랑", "빨강", "파랑"].filter((value) => value !== item.next), `반복되는 규칙을 따르면 다음은 ${item.next}입니다.`),
    { type: "shape-pattern", items: [...item.seq, "?"], title: "무늬 규칙" },
  );
}

function genG2PatternNumber(): Problem {
  const step = choice([2, 3, 5, 10]);
  const start = randInt(1, 9) * step;
  const answer = start + step * 5;
  const values = [start, start + step, start + step * 2, start + step * 3, start + step * 4, answer];
  return withVisual(
    mkInteger("g2-pattern-number", "수 배열의 규칙을 찾으세요.", `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ${start + step * 4}, □`, answer, `${step}씩 커지므로 다음 수는 ${answer}입니다.`),
    { type: "number-line", values, missingIndex: 5, title: `${step}씩 커지는 수 규칙` },
  );
}

function genG2AdditionTable(): Problem {
  const row = randInt(2, 9);
  const col = randInt(2, 9);
  return withVisual(
    mkInteger("g2-addition-table", "덧셈표의 빈칸을 구하세요.", `${row} + ${col} = □`, row + col, `덧셈표에서 ${row}와 ${col}가 만나는 곳은 ${row + col}입니다.`),
    {
      type: "data-table",
      caption: "덧셈표 일부",
      headers: ["+", col],
      rows: [[row, "□"]],
    },
  );
}

function genG2LineTypeChoice(): Problem {
  const answer = choice(["선분", "반직선", "직선"]);
  const expression =
    answer === "선분"
      ? "두 점을 곧게 이은 선입니다."
      : answer === "반직선"
        ? "한 점에서 시작하여 한쪽으로 끝없이 늘인 선입니다."
        : "양쪽으로 끝없이 늘인 곧은 선입니다.";
  return withVisual(
    mkChoice("g2-line-type-choice", "선의 종류를 고르세요.", expression, answer, ["선분", "반직선", "직선", "곡선"], `${expression} 이것은 ${answer}입니다.`),
    { type: "line-type", kind: answer === "선분" ? "segment" : answer === "반직선" ? "ray" : "line", title: "선의 종류" },
  );
}

function genG2RightAngleChoice(): Problem {
  const answer = choice(["직각", "직각삼각형", "직사각형", "정사각형"]);
  const expression =
    answer === "직각"
      ? "종이를 반듯하게 두 번 접었을 때 생기는 각입니다."
      : answer === "직각삼각형"
        ? "한 각이 직각인 삼각형입니다."
        : answer === "직사각형"
          ? "네 각이 모두 직각인 사각형입니다."
          : "네 각이 모두 직각이고 네 변의 길이가 같은 사각형입니다.";
  return withVisual(
    mkChoice("g2-right-angle-choice", "도형의 뜻에 맞는 이름을 고르세요.", expression, answer, ["직각", "직각삼각형", "직사각형", "정사각형"], `뜻에 맞는 도형 이름은 ${answer}입니다.`),
    { type: "right-angle", shape: answer === "직각" ? "angle" : answer === "직각삼각형" ? "triangle" : answer === "직사각형" ? "rectangle" : "square", title: "직각 도형" },
  );
}

function genG2MmConvert(): Problem {
  const cm = randInt(1, 9);
  const mm = randInt(1, 9);
  const answer = cm * 10 + mm;
  return withVisual(
    mkInteger("g2-mm-convert", "cm와 mm를 mm로 나타내세요.", `${cm} cm ${mm} mm = □ mm`, answer, `1 cm = 10 mm이므로 ${answer} mm입니다.`),
    { type: "ruler", length: answer, unit: "mm", max: 100, title: "mm 자 그림" },
  );
}

function genG2SecondConvert(): Problem {
  const minute = randInt(1, 5);
  const second = choice([5, 10, 15, 20, 30, 45]);
  const answer = minute * 60 + second;
  return mkInteger("g2-second-convert", "분과 초를 초로 나타내세요.", `${minute}분 ${second}초 = □초`, answer, `1분은 60초이므로 ${minute}분 ${second}초는 ${answer}초입니다.`);
}

function genG2TimeAddSub(): Problem {
  const minute = choice([10, 15, 20, 25, 30, 35, 40]);
  const change = choice([5, 10, 15, 20]);
  const isAdd = Math.random() < 0.5 || minute <= change;
  const answer = isAdd ? minute + change : minute - change;
  return withVisual(
    mkInteger("g2-time-add-sub", "시간의 덧셈과 뺄셈을 하세요.", isAdd ? `${minute}분 + ${change}분 = □분` : `${minute}분 - ${change}분 = □분`, answer, `분끼리 계산하면 ${answer}분입니다.`),
    { type: "clock", hour: 1, minute: answer % 60, title: "분 계산 시계" },
  );
}

// ── 2학년 수학연산 PDF 기반 추가 문제: 자리값·덧셈·뺄셈·곱셈·단위 계산 ────────────

function genG2OpTwoDigitAddCarry(): Problem {
  const tensA = randInt(2, 7);
  const onesA = randInt(5, 9);
  const tensB = randInt(1, 2);
  const onesB = randInt(10 - onesA, 9);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  const answer = a + b;
  return withVisual(
    mkInteger("g2-op-two-digit-add-carry", "받아올림이 있는 두 자리 수 덧셈을 계산하세요.", `${a} + ${b} = □`, answer, `일의 자리 ${onesA} + ${onesB}에서 받아올림 1이 생깁니다. 답은 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "받아올림 덧셈 자리값",
      headers: ["수", "십", "일"],
      rows: [
        [a, tensA, onesA],
        [b, tensB, onesB],
        ["받아올림", "+1", `${onesA + onesB}`],
      ],
    },
  );
}

function genG2OpTwoDigitSubBorrow(): Problem {
  const tensA = randInt(4, 9);
  const onesA = randInt(0, 4);
  const tensB = randInt(1, tensA - 1);
  const onesB = randInt(onesA + 1, 9);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  const answer = a - b;
  return withVisual(
    mkInteger("g2-op-two-digit-sub-borrow", "받아내림이 있는 두 자리 수 뺄셈을 계산하세요.", `${a} - ${b} = □`, answer, `일의 자리에서 바로 뺄 수 없어 십의 자리에서 1을 받아내리면 ${answer}입니다.`),
    {
      type: "data-table",
      caption: "받아내림 뺄셈 자리값",
      headers: ["수", "십", "일"],
      rows: [
        [a, tensA, onesA],
        [b, tensB, onesB],
        ["받아내림 뒤", tensA - 1, onesA + 10],
      ],
    },
  );
}

function genG2OpTwoDigitReview(): Problem {
  return Math.random() < 0.5 ? retopic("g2-op-two-digit-review", genG2TwoDigitAdd()) : retopic("g2-op-two-digit-review", genG2TwoDigitSub());
}

function genG2OpMixedChange(): Problem {
  const start = randInt(45, 120);
  const add = randInt(12, 48);
  const sub = randInt(8, Math.min(55, start + add - 1));
  const answer = start + add - sub;
  return withVisual(
    mkInteger("g2-op-mixed-change", "표의 변화량을 보고 남은 수를 구하세요.", `처음 ${start}개에서 ${add}개를 더하고 ${sub}개를 빼면 몇 개입니까`, answer, `${start} + ${add} - ${sub} = ${answer}입니다.`),
    {
      type: "data-table",
      caption: "더하고 빼는 변화량",
      headers: ["처음", "더함", "뺌", "남음"],
      rows: [[start, add, sub, "□"]],
    },
  );
}

function genG2OpThreeDigitAddNoCarry(): Problem {
  const h1 = randInt(1, 4);
  const t1 = randInt(1, 5);
  const o1 = randInt(1, 5);
  const h2 = randInt(1, 4);
  const t2 = randInt(1, 4);
  const o2 = randInt(1, 4);
  const a = h1 * 100 + t1 * 10 + o1;
  const b = h2 * 100 + t2 * 10 + o2;
  const answer = a + b;
  return withVisual(
    mkInteger("g2-op-three-digit-add-no-carry", "받아올림 없는 세 자리 수 덧셈을 계산하세요.", `${a} + ${b} = □`, answer, `백, 십, 일의 자리끼리 더하면 ${answer}입니다.`),
    { type: "base-ten-blocks", hundreds: Math.floor(answer / 100), tens: Math.floor((answer % 100) / 10), ones: answer % 10, title: "합을 백·십·일 블록으로 확인" },
  );
}

function genG2OpThreeDigitSubNoBorrow(): Problem {
  const h1 = randInt(4, 8);
  const t1 = randInt(4, 9);
  const o1 = randInt(4, 9);
  const h2 = randInt(1, h1 - 1);
  const t2 = randInt(1, t1);
  const o2 = randInt(1, o1);
  const a = h1 * 100 + t1 * 10 + o1;
  const b = h2 * 100 + t2 * 10 + o2;
  const answer = a - b;
  return withVisual(
    mkInteger("g2-op-three-digit-sub-no-borrow", "받아내림 없는 세 자리 수 뺄셈을 계산하세요.", `${a} - ${b} = □`, answer, `같은 자리 수끼리 빼면 ${answer}입니다.`),
    { type: "base-ten-blocks", hundreds: Math.floor(answer / 100), tens: Math.floor((answer % 100) / 10), ones: answer % 10, title: "차를 백·십·일 블록으로 확인" },
  );
}

function genG2OpThreeDigitAddCarry(): Problem {
  const a = randInt(246, 578);
  const b = randInt(168, 389);
  const answer = a + b;
  return withVisual(
    mkInteger("g2-op-three-digit-add-carry", "받아올림이 있는 세 자리 수 덧셈을 계산하세요.", `${a} + ${b} = □`, answer, `일의 자리부터 차례대로 더하고 받아올림을 처리하면 ${answer}입니다.`),
    { type: "base-ten-blocks", hundreds: Math.floor(answer / 100), tens: Math.floor((answer % 100) / 10), ones: answer % 10, title: "받아올림 뒤 합의 자리값 블록" },
  );
}

function genG2OpThreeDigitSubBorrow(): Problem {
  const b = randInt(158, 426);
  const answer = randInt(145, 368);
  const a = b + answer;
  return withVisual(
    mkInteger("g2-op-three-digit-sub-borrow", "받아내림이 있는 세 자리 수 뺄셈을 계산하세요.", `${a} - ${b} = □`, answer, `일의 자리부터 차례대로 빼고 받아내림을 처리하면 ${answer}입니다.`),
    { type: "base-ten-blocks", hundreds: Math.floor(answer / 100), tens: Math.floor((answer % 100) / 10), ones: answer % 10, title: "받아내림 뒤 차의 자리값 블록" },
  );
}

function genG2OpThreeDigitMixedWord(): Problem {
  const start = randInt(220, 520);
  const add = randInt(80, 260);
  const sub = randInt(40, Math.min(260, start + add - 1));
  const answer = start + add - sub;
  return withVisual(
    mkInteger("g2-op-three-digit-mixed-word", "세 자리 수를 더하고 빼는 문장제를 해결하세요.", `책이 ${start}권 있었습니다. ${add}권을 더 사고 ${sub}권을 빌려 주었습니다. 남은 책은 몇 권입니까`, answer, `${start} + ${add} - ${sub} = ${answer}입니다.`),
    {
      type: "data-table",
      caption: "책 수 변화표",
      headers: ["처음", "더 산 책", "빌려 준 책", "남은 책"],
      rows: [[start, add, sub, "□"]],
    },
  );
}

function genG2OpMultiplicationTable(): Problem {
  const dan = randInt(2, 9);
  const factor = randInt(2, 9);
  const answer = dan * factor;
  return withVisual(
    mkInteger("g2-op-multiplication-table", "곱셈표를 보고 빈칸의 수를 구하세요.", `${dan} × ${factor} = □`, answer, `${dan}단에서 ${factor}와 만나는 값은 ${answer}입니다.`),
    {
      type: "data-table",
      caption: `${dan}단 곱셈표`,
      headers: ["×", 1, 2, factor],
      rows: [[dan, dan, dan * 2, "□"]],
    },
  );
}

function genG2OpMissingFactorVisual(): Problem {
  const dan = randInt(2, 9);
  const factor = randInt(2, 9);
  const product = dan * factor;
  return withVisual(
    mkInteger("g2-op-missing-factor-visual", "곱셈식의 빈칸에 들어갈 수를 구하세요.", `${dan} × □ = ${product}`, factor, `${dan} × ${factor} = ${product}이므로 빈칸은 ${factor}입니다.`),
    {
      type: "data-table",
      caption: `${dan}단 빈칸 찾기`,
      headers: ["곱하는 수", 1, 2, "□"],
      rows: [["곱", dan, dan * 2, product]],
    },
  );
}

function genG2OpSecondConvertVisual(): Problem {
  const minute = randInt(1, 5);
  const second = choice([5, 10, 15, 20, 30, 45]);
  const answer = minute * 60 + second;
  return withVisual(
    mkInteger("g2-op-second-convert-visual", "분과 초를 초로 나타내세요.", `${minute}분 ${second}초 = □초`, answer, `1분은 60초이므로 ${minute}분 ${second}초는 ${answer}초입니다.`),
    {
      type: "data-table",
      caption: "분과 초 단위 바꾸기",
      headers: ["분", "초", "전체 초"],
      rows: [[minute, second, "□"]],
    },
  );
}

function genG2OpTableTotal(): Problem {
  const a = randInt(12, 36);
  const b = randInt(10, 32);
  const c = randInt(8, 28);
  const target = choice(["합", "차"]);
  const answer = target === "합" ? a + b + c : Math.max(a, b, c) - Math.min(a, b, c);
  return withVisual(
    mkInteger("g2-op-table-total", "자료표를 보고 알맞은 값을 계산하세요.", target === "합" ? "세 반의 구슬은 모두 몇 개입니까" : "가장 많은 반과 가장 적은 반의 차는 몇 개입니까", answer, target === "합" ? `${a} + ${b} + ${c} = ${answer}입니다.` : `가장 큰 수에서 가장 작은 수를 빼면 ${answer}입니다.`),
    {
      type: "bar-chart",
      title: "반별 구슬 수",
      unit: "개",
      items: [
        { label: "1반", value: a },
        { label: "2반", value: b },
        { label: "3반", value: c },
      ],
    },
  );
}

function genG2OpMixedReview(): Problem {
  return choice([
    () => retopic("g2-op-mixed-review", genG2TwoDigitAdd()),
    () => retopic("g2-op-mixed-review", genG2TwoDigitSub()),
    () => retopic("g2-op-mixed-review", genG2MultiplicationBasic()),
    () => retopic("g2-op-mixed-review", genG2AdditionTable()),
  ])();
}

function genG2OpDivisionPrep(): Problem {
  const groups = randInt(2, 6);
  const each = randInt(2, 5);
  const total = groups * each;
  return withVisual(
    mkInteger("g2-op-division-prep", "똑같이 나누어 한 묶음의 수를 구하세요.", `${total}개를 ${groups}묶음으로 똑같이 나누면 한 묶음은 몇 개입니까`, each, `${total}을 ${groups}묶음으로 나누면 한 묶음은 ${each}개입니다.`),
    { type: "object-array", rows: groups, cols: each, unit: "개", title: "똑같이 나누기 배열" },
  );
}

// ── 3학년 PDF 기반 기초력 문제: 표·그래프·도형 시각 자료 포함 ─────────────────────

function genG3Add3DigitNoCarry(): Problem {
  const a = randInt(120, 430);
  const b = randInt(110, 420);
  const answer = a + b;
  return withVisual(
    mkInteger(
      "g3-add-3digit-no-carry",
      "받아올림이 없는 세 자리 수의 덧셈을 계산하세요.",
      `${a} + ${b} = □`,
      answer,
      `같은 자리 수끼리 더하면 ${a} + ${b} = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "자리별 덧셈 표",
      headers: ["수", "백", "십", "일"],
      rows: [
        [a, Math.floor(a / 100), Math.floor((a % 100) / 10), a % 10],
        [b, Math.floor(b / 100), Math.floor((b % 100) / 10), b % 10],
      ],
    },
  );
}

function genG3Add3DigitCarry(): Problem {
  const a = randInt(126, 679);
  const b = randInt(145, 298);
  const answer = a + b;
  return withVisual(
    mkInteger(
      "g3-add-3digit-carry",
      "받아올림이 있는 세 자리 수의 덧셈을 계산하세요.",
      `${a} + ${b} = □`,
      answer,
      `일의 자리부터 차례대로 더하면 ${answer}입니다. 받아올림이 생기는 자리를 확인하세요.`,
    ),
    {
      type: "data-table",
      caption: "받아올림 자리값 표",
      headers: ["수", "백", "십", "일"],
      rows: [
        [a, Math.floor(a / 100), Math.floor((a % 100) / 10), a % 10],
        [b, Math.floor(b / 100), Math.floor((b % 100) / 10), b % 10],
        ["합", Math.floor(answer / 100), Math.floor((answer % 100) / 10), answer % 10],
      ],
    },
  );
}

function genG3Sub3DigitNoBorrow(): Problem {
  const b = randInt(112, 386);
  const a = b + randInt(121, 350);
  const answer = a - b;
  return withVisual(
    mkInteger(
      "g3-sub-3digit-no-borrow",
      "받아내림이 없는 세 자리 수의 뺄셈을 계산하세요.",
      `${a} - ${b} = □`,
      answer,
      `같은 자리 수끼리 빼면 ${a} - ${b} = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "자리별 뺄셈 표",
      headers: ["수", "백", "십", "일"],
      rows: [
        [a, Math.floor(a / 100), Math.floor((a % 100) / 10), a % 10],
        [b, Math.floor(b / 100), Math.floor((b % 100) / 10), b % 10],
        ["차", Math.floor(answer / 100), Math.floor((answer % 100) / 10), answer % 10],
      ],
    },
  );
}

function genG3Sub3DigitBorrow(): Problem {
  const b = randInt(168, 489);
  const a = b + randInt(157, 399);
  const answer = a - b;
  return withVisual(
    mkInteger(
      "g3-sub-3digit-borrow",
      "받아내림이 있는 세 자리 수의 뺄셈을 계산하세요.",
      `${a} - ${b} = □`,
      answer,
      `일의 자리부터 빼고 부족하면 윗자리에서 받아내림합니다. 답은 ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "뺄셈 검산 표",
      headers: ["계산", "값"],
      rows: [
        ["처음 수", a],
        ["빼는 수", b],
        ["차", answer],
      ],
    },
  );
}

function genG3AddSubWordTable(): Problem {
  const start = randInt(240, 520);
  const add = randInt(80, 230);
  const sub = randInt(40, 160);
  const answer = start + add - sub;
  return withVisual(
    mkInteger(
      "g3-add-sub-word-table",
      "표를 보고 남은 수를 구하세요.",
      `도서관에 책이 ${start}권 있었습니다. ${add}권이 들어오고 ${sub}권을 빌려 갔습니다. 지금은 몇 권입니까?`,
      answer,
      `${start} + ${add} - ${sub} = ${answer}이므로 ${answer}권입니다.`,
    ),
    {
      type: "data-table",
      caption: "책 수 변화",
      headers: ["처음", "들어온 책", "빌려 간 책", "남은 책"],
      rows: [[start, add, sub, "□"]],
    },
  );
}

function genG3ShapeSideCount(): Problem {
  const shape = choice([
    { name: "삼각형", sides: 3 },
    { name: "사각형", sides: 4 },
    { name: "오각형", sides: 5 },
    { name: "육각형", sides: 6 },
  ]);
  return mkChoice(
    "g3-shape-side-count",
    "도형의 변의 수를 고르세요.",
    `${shape.name}의 변은 몇 개입니까?`,
    `${shape.sides}개`,
    ["3개", "4개", "5개", "6개"],
    `${shape.name}은 변이 ${shape.sides}개인 도형입니다.`,
  );
}

function genG3DivisionBasic(): Problem {
  const divisor = randInt(2, 9);
  const quotient = randInt(2, 9);
  const total = divisor * quotient;
  return withVisual(
    mkInteger(
      "g3-division-basic",
      "똑같이 나누는 나눗셈을 계산하세요.",
      `${total} ÷ ${divisor} = □`,
      quotient,
      `${total}개를 ${divisor}묶음으로 똑같이 나누면 한 묶음은 ${quotient}개입니다.`,
    ),
    {
      type: "data-table",
      caption: "똑같이 나누기",
      headers: ["전체", "묶음 수", "한 묶음"],
      rows: [[total, divisor, "□"]],
    },
  );
}

function genG3DivisionRemainderBasic(): Problem {
  const divisor = randInt(3, 8);
  const quotient = randInt(3, 9);
  const remainder = randInt(1, divisor - 1);
  const total = divisor * quotient + remainder;
  return withVisual(
    mkChoice(
      "g3-division-remainder-basic",
      "나눗셈의 몫과 나머지를 고르세요.",
      `${total} ÷ ${divisor}`,
      `몫 ${quotient}, 나머지 ${remainder}`,
      [
        `몫 ${quotient + 1}, 나머지 ${remainder}`,
        `몫 ${quotient}, 나머지 ${remainder + 1}`,
        `몫 ${Math.max(1, quotient - 1)}, 나머지 ${remainder}`,
        `몫 ${quotient}, 나머지 0`,
      ],
      `${divisor} × ${quotient} = ${divisor * quotient}이고 ${total} - ${divisor * quotient} = ${remainder}입니다.`,
    ),
    {
      type: "data-table",
      caption: "나눗셈 검산 표",
      headers: ["전체", "나누는 수", "몫", "나머지"],
      rows: [[total, divisor, "□", remainder]],
    },
  );
}

function genG3MulBasic(): Problem {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return mkInteger(
    "g3-multiply-basic",
    "곱셈구구를 이용해 계산하세요.",
    `${a} × ${b} = □`,
    a * b,
    `${a}씩 ${b}묶음이므로 ${a} × ${b} = ${a * b}입니다.`,
  );
}

function genG3TimesTableMissing(): Problem {
  const factor = randInt(2, 9);
  const missing = randInt(2, 9);
  const product = factor * missing;
  return withVisual(
    mkInteger(
      "g3-times-table-missing",
      "곱셈식의 빈칸에 들어갈 수를 구하세요.",
      `${factor} × □ = ${product}`,
      missing,
      `${product}는 ${factor}가 ${missing}번 더해진 수입니다.`,
    ),
    {
      type: "data-table",
      caption: `${factor}단 일부`,
      headers: ["곱하는 수", 1, 2, 3, missing],
      rows: [["곱", factor, factor * 2, factor * 3, product]],
    },
  );
}

function genG3TensTimesOneDigit(): Problem {
  const tens = randInt(1, 8) * 10;
  const b = randInt(2, 9);
  return withVisual(
    mkInteger(
      "g3-tens-times-one-digit",
      "몇십과 몇의 곱셈을 계산하세요.",
      `${tens} × ${b} = □`,
      tens * b,
      `${tens}은 ${tens / 10}개의 십입니다. ${tens / 10} × ${b} = ${(tens / 10) * b}이므로 답은 ${tens * b}입니다.`,
    ),
    {
      type: "data-table",
      caption: "십 묶음 곱셈",
      headers: ["십 묶음", "몇 배", "전체"],
      rows: [[tens / 10, b, "□"]],
    },
  );
}

function genG3TwoDigitTimesOneDigit(): Problem {
  const a = randInt(12, 49);
  const b = randInt(2, 8);
  return withVisual(
    mkInteger(
      "g3-two-digit-times-one-digit",
      "두 자리 수와 한 자리 수의 곱셈을 계산하세요.",
      `${a} × ${b} = □`,
      a * b,
      `${a}를 십의 자리와 일의 자리로 나누어 곱하면 ${a * b}입니다.`,
    ),
    {
      type: "data-table",
      caption: "자리별 곱셈",
      headers: ["부분", "값", "곱"],
      rows: [
        ["십의 자리", Math.floor(a / 10) * 10, Math.floor(a / 10) * 10 * b],
        ["일의 자리", a % 10, (a % 10) * b],
      ],
    },
  );
}

function genG3OneDigitTimesTwoDigit(): Problem {
  const a = randInt(2, 9);
  const b = randInt(12, 89);
  const tens = Math.floor(b / 10) * 10;
  const ones = b % 10;
  return withVisual(
    mkInteger(
      "g3-one-digit-times-two-digit",
      "한 자리 수와 몇십몇의 곱셈을 계산하세요.",
      `${a} × ${b} = □`,
      a * b,
      `${b}를 ${tens}와 ${ones}로 나누어 ${a} × ${tens} + ${a} × ${ones}를 계산하면 ${a * b}입니다.`,
    ),
    {
      type: "data-table",
      caption: "몇십몇을 나누어 곱하기",
      headers: ["부분", "계산", "값"],
      rows: [
        ["십의 자리", `${a} × ${tens}`, a * tens],
        ["일의 자리", `${a} × ${ones}`, a * ones],
      ],
    },
  );
}

function genG3TwoDigitTimesTwoDigit(): Problem {
  const a = randInt(12, 49);
  const b = randInt(12, 39);
  const tens = Math.floor(b / 10) * 10;
  const ones = b % 10;
  return withVisual(
    mkInteger(
      "g3-two-digit-times-two-digit",
      "두 자리 수와 두 자리 수의 곱셈을 계산하세요.",
      `${a} × ${b} = □`,
      a * b,
      `${a} × ${tens} = ${a * tens}, ${a} × ${ones} = ${a * ones}이므로 합은 ${a * b}입니다.`,
    ),
    {
      type: "data-table",
      caption: "두 자리 수 × 두 자리 수",
      headers: ["나누어 곱하기", "부분곱"],
      rows: [
        [`${a} × ${tens}`, a * tens],
        [`${a} × ${ones}`, a * ones],
        ["합", "□"],
      ],
    },
  );
}

function genG3ThreeDigitTimesOneDigit(): Problem {
  const a = randInt(112, 678);
  const b = randInt(2, 6);
  const hundreds = Math.floor(a / 100) * 100;
  const tens = Math.floor((a % 100) / 10) * 10;
  const ones = a % 10;
  return withVisual(
    mkInteger(
      "g3-three-digit-times-one-digit",
      "세 자리 수와 한 자리 수의 곱셈을 계산하세요.",
      `${a} × ${b} = □`,
      a * b,
      `일의 자리부터 차례대로 곱하고 올림을 처리하면 ${a * b}입니다.`,
    ),
    {
      type: "data-table",
      caption: "세 자리 수 부분곱",
      headers: ["부분", "계산", "값"],
      rows: [
        ["백의 자리", `${hundreds} × ${b}`, hundreds * b],
        ["십의 자리", `${tens} × ${b}`, tens * b],
        ["일의 자리", `${ones} × ${b}`, ones * b],
        ["합", "", "□"],
      ],
    },
  );
}

function genG3MulDivWord(): Problem {
  const box = randInt(4, 9);
  const count = randInt(3, 8);
  const total = box * count;
  return withVisual(
    mkInteger(
      "g3-mul-div-word",
      "문장에 맞는 곱셈 또는 나눗셈을 해결하세요.",
      `한 상자에 연필이 ${box}자루씩 있습니다. ${count}상자에는 모두 몇 자루가 있습니까?`,
      total,
      `${box} × ${count} = ${total}이므로 모두 ${total}자루입니다.`,
    ),
    {
      type: "bar-chart",
      title: "상자별 연필 수",
      unit: "자루",
      items: Array.from({ length: count }, (_, index) => ({ label: `${index + 1}상자`, value: box })),
    },
  );
}

function genG3FractionUnitRead(): Problem {
  const denominator = randInt(3, 9);
  const numerator = randInt(1, denominator - 1);
  const answer = makeFrac(numerator, denominator);
  return withVisual(
    {
      topicId: "g3-fraction-unit-read",
      prompt: "색칠한 부분을 분수로 쓰세요.",
      expression: `전체를 똑같이 ${denominator}부분으로 나눈 것 중 ${numerator}부분입니다.`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `분모는 ${denominator}, 분자는 ${numerator}이므로 ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", numerator, denominator, title: "분수 막대" },
  );
}

function genG3FractionOfQuantity(): Problem {
  const denominator = randInt(3, 8);
  const unit = randInt(2, 6);
  const total = denominator * unit;
  const numerator = randInt(1, denominator - 1);
  const answer = unit * numerator;
  return withVisual(
    mkInteger(
      "g3-fraction-of-quantity",
      "전체의 분수만큼이 얼마인지 구하세요.",
      `${total}의 ${numerator}/${denominator}은 얼마입니까?`,
      answer,
      `${total}을 ${denominator}묶음으로 나누면 한 묶음은 ${unit}입니다. ${numerator}묶음은 ${answer}입니다.`,
    ),
    { type: "fraction-strip", numerator, denominator, title: `${total}을 ${denominator}부분으로 나누기` },
  );
}

function genG3FractionCompareSameDenom(): Problem {
  const denominator = randInt(4, 10);
  const a = randInt(1, denominator - 1);
  const b = randInt(1, denominator - 1);
  const sign = compareSign(a, b);
  return withVisual(
    {
      topicId: "g3-fraction-compare-same-denom",
      prompt: "분모가 같은 분수의 크기를 비교하세요.",
      expression: `${a}/${denominator} □ ${b}/${denominator}`,
      hint: ">, =, < 중 하나를 입력",
      answer: sign,
      kind: "compare",
      solution: `분모가 같으므로 분자 ${a}와 ${b}를 비교하면 ${a}/${denominator} ${sign} ${b}/${denominator}입니다.`,
    },
    {
      type: "data-table",
      caption: "같은 분모 분수 비교",
      headers: ["분수", "전체 조각", "색칠 조각"],
      rows: [
        [`${a}/${denominator}`, denominator, a],
        [`${b}/${denominator}`, denominator, b],
      ],
    },
  );
}

function genG3UnitFractionRead(): Problem {
  const denominator = randInt(3, 10);
  const answer = makeFrac(1, denominator);
  return withVisual(
    {
      topicId: "g3-unit-fraction-read",
      prompt: "단위분수를 분수로 쓰세요.",
      expression: `전체를 똑같이 ${denominator}부분으로 나눈 것 중 한 부분입니다.`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `분자가 1인 분수를 단위분수라고 합니다. 한 부분은 ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", numerator: 1, denominator, divisorNumerator: 1, title: "단위분수 막대" },
  );
}

function genG3UnitFractionCompare(): Problem {
  const a = randInt(2, 10);
  let b = randInt(2, 10);
  if (a === b) b = a === 10 ? 9 : a + 1;
  const sign = compareSign(1 / a, 1 / b);
  return withVisual(
    {
      topicId: "g3-unit-fraction-compare",
      prompt: "단위분수의 크기를 비교하세요.",
      expression: `1/${a} □ 1/${b}`,
      hint: ">, =, < 중 하나를 입력",
      answer: sign,
      kind: "compare",
      solution: `단위분수는 똑같이 나눈 수가 적을수록 한 조각이 큽니다. 그래서 1/${a} ${sign} 1/${b}입니다.`,
    },
    {
      type: "data-table",
      caption: "단위분수 비교",
      headers: ["분수", "나눈 부분 수", "한 조각"],
      rows: [
        [`1/${a}`, a, "□"],
        [`1/${b}`, b, "□"],
      ],
    },
  );
}

function genG3ProperImproperChoice(): Problem {
  const denominator = randInt(3, 9);
  const type = choice(["진분수", "가분수"]);
  const numerator = type === "진분수" ? randInt(1, denominator - 1) : randInt(denominator, denominator * 2 + 2);
  return withVisual(
    mkChoice(
      "g3-proper-improper-choice",
      "분수의 종류를 고르세요.",
      `${numerator}/${denominator}은 어떤 분수입니까?`,
      type,
      ["진분수", "가분수", "대분수", "단위분수"],
      type === "진분수"
        ? `분자가 분모보다 작으므로 ${numerator}/${denominator}은 진분수입니다.`
        : `분자가 분모와 같거나 더 크므로 ${numerator}/${denominator}은 가분수입니다.`,
    ),
    {
      type: "data-table",
      caption: "분자와 분모 비교",
      headers: ["분자", "분모", "판단"],
      rows: [[numerator, denominator, "분자와 분모 비교"]],
    },
  );
}

function genG3MixedFractionConvert(): Problem {
  const denominator = randInt(3, 8);
  const whole = randInt(1, 3);
  const numerator = randInt(1, denominator - 1);
  const improper = whole * denominator + numerator;
  const answer = `${whole} ${numerator}/${denominator}`;
  return withVisual(
    mkChoice(
      "g3-mixed-fraction-convert",
      "가분수를 대분수로 바꾸세요.",
      `${improper}/${denominator} = □`,
      answer,
      [`${whole + 1} ${numerator}/${denominator}`, `${whole} ${denominator - numerator}/${denominator}`, `${improper - denominator}/${denominator}`, `${whole}/${denominator}`],
      `${improper} ÷ ${denominator} = ${whole} 나머지 ${numerator}이므로 ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "가분수에서 대분수로",
      headers: ["가분수", "몫", "나머지", "대분수"],
      rows: [[`${improper}/${denominator}`, whole, numerator, "□"]],
    },
  );
}

function genG3FractionAddSameDenom(): Problem {
  const denominator = randInt(5, 12);
  const a = randInt(1, denominator - 3);
  const b = randInt(1, denominator - a - 1);
  const answer = makeFrac(a + b, denominator);
  return withVisual(
    {
      topicId: "g3-fraction-add-same-denom",
      prompt: "분모가 같은 분수의 덧셈을 계산하세요.",
      expression: `${a}/${denominator} + ${b}/${denominator} = □`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `분모는 그대로 두고 분자만 더하면 ${a + b}/${denominator} = ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", numerator: a + b, denominator, title: "분수 덧셈 결과" },
  );
}

function genG3FractionSubSameDenom(): Problem {
  const denominator = randInt(5, 12);
  const a = randInt(3, denominator - 1);
  const b = randInt(1, a - 1);
  const answer = makeFrac(a - b, denominator);
  return withVisual(
    {
      topicId: "g3-fraction-sub-same-denom",
      prompt: "분모가 같은 분수의 뺄셈을 계산하세요.",
      expression: `${a}/${denominator} - ${b}/${denominator} = □`,
      hint: "분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `분모는 그대로 두고 분자만 빼면 ${a - b}/${denominator} = ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", numerator: a - b, denominator, title: "분수 뺄셈 결과" },
  );
}

function genG3DecimalTenthsRead(): Problem {
  const tenths = randInt(1, 9);
  const answer = `0.${tenths}`;
  return withVisual(
    mkChoice(
      "g3-decimal-tenths-read",
      "소수 첫째 자리 수를 읽고 알맞은 소수를 고르세요.",
      `10분의 ${tenths}은 어떤 소수입니까?`,
      answer,
      [`${tenths}`, `0.0${tenths}`, `1.${tenths}`, `${tenths}.0`],
      `10분의 ${tenths}은 0.${tenths}입니다.`,
    ),
    {
      type: "data-table",
      caption: "분수와 소수 연결",
      headers: ["분수", "소수"],
      rows: [[`${tenths}/10`, "□"]],
    },
  );
}

function genG3DecimalCompareTenths(): Problem {
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  const sign = compareSign(a, b);
  return withVisual(
    {
      topicId: "g3-decimal-compare-tenths",
      prompt: "소수 첫째 자리 수의 크기를 비교하세요.",
      expression: `0.${a} □ 0.${b}`,
      hint: ">, =, < 중 하나를 입력",
      answer: sign,
      kind: "compare",
      solution: `소수 첫째 자리 ${a}와 ${b}를 비교하면 0.${a} ${sign} 0.${b}입니다.`,
    },
    {
      type: "data-table",
      caption: "소수 첫째 자리 비교",
      headers: ["소수", "10분의 몇"],
      rows: [
        [`0.${a}`, a],
        [`0.${b}`, b],
      ],
    },
  );
}

function genG3DecimalAddTenths(): Problem {
  const a = randInt(1, 8);
  const b = randInt(1, 9 - a);
  const answer = decimalText((a + b) / 10, 1);
  return mkChoice(
    "g3-decimal-add-tenths",
    "소수 첫째 자리의 덧셈을 계산하세요.",
    `0.${a} + 0.${b} = □`,
    answer,
    [`0.${a}`, `0.${b}`, decimalText((a + b + 1) / 10, 1), decimalText(Math.abs(a - b) / 10, 1)],
    `0.${a} + 0.${b} = 0.${a + b}입니다.`,
  );
}

function genG3DecimalSubTenths(): Problem {
  const a = randInt(4, 9);
  const b = randInt(1, a - 1);
  const answer = decimalText((a - b) / 10, 1);
  return mkChoice(
    "g3-decimal-sub-tenths",
    "소수 첫째 자리의 뺄셈을 계산하세요.",
    `0.${a} - 0.${b} = □`,
    answer,
    [`0.${a}`, `0.${b}`, decimalText((a - b + 1) / 10, 1), decimalText((a + b) / 10, 1)],
    `10분의 ${a}에서 10분의 ${b}를 빼면 10분의 ${a - b}, 즉 ${answer}입니다.`,
  );
}

function genG3LengthConvertCmMm(): Problem {
  const cm = randInt(2, 9);
  const mm = randInt(1, 9);
  const answer = cm * 10 + mm;
  return mkInteger(
    "g3-length-convert-cm-mm",
    "센티미터와 밀리미터를 밀리미터로 나타내세요.",
    `${cm} cm ${mm} mm = □ mm`,
    answer,
    `1 cm = 10 mm이므로 ${cm} cm ${mm} mm = ${answer} mm입니다.`,
  );
}

function genG3TimeAddMinute(): Problem {
  const hour = randInt(1, 9);
  const minute = choice([10, 15, 20, 25, 30, 35, 40]);
  const add = choice([10, 15, 20, 30]);
  const total = hour * 60 + minute + add;
  const answer = total % 60;
  return withVisual(
    mkInteger(
      "g3-time-add-minute",
      "시간을 더한 뒤 분을 구하세요.",
      `${hour}시 ${minute}분에서 ${add}분 뒤의 '분'은 얼마입니까?`,
      answer,
      `${minute} + ${add} = ${minute + add}분입니다. 60분이 넘으면 1시간을 올리고 남은 분은 ${answer}분입니다.`,
    ),
    {
      type: "data-table",
      caption: "시간 변화",
      headers: ["처음", "더한 시간", "도착"],
      rows: [[`${hour}시 ${minute}분`, `${add}분`, `${Math.floor(total / 60)}시 ${answer}분`]],
    },
  );
}

function genG3CircleRadiusDiameter(): Problem {
  const radius = randInt(2, 9);
  const answer = radius * 2;
  return withVisual(
    mkInteger(
      "g3-circle-radius-diameter",
      "반지름을 보고 지름을 구하세요.",
      `반지름이 ${radius} cm인 원의 지름은 몇 cm입니까?`,
      answer,
      `지름은 반지름의 2배이므로 ${radius} × 2 = ${answer} cm입니다.`,
    ),
    { type: "circle-diagram", mode: "radius", radius, unit: "cm", title: "원의 반지름과 지름" },
  );
}

function genG3CirclePropertyChoice(): Problem {
  const answer = choice(["원의 중심", "반지름", "지름"]);
  const expression =
    answer === "원의 중심"
      ? "원을 그릴 때 누름 못이 꽂혀 있던 점을 무엇이라고 합니까?"
      : answer === "반지름"
        ? "원의 중심과 원 위의 한 점을 이은 선분을 무엇이라고 합니까?"
        : "원 위의 두 점을 이은 선분이 원의 중심을 지날 때 이 선분을 무엇이라고 합니까?";
  return withVisual(
    mkChoice(
      "g3-circle-property-choice",
      "원의 중심, 반지름, 지름의 뜻을 고르세요.",
      expression,
      answer,
      ["원의 중심", "반지름", "지름", "변"],
      `알맞은 용어는 ${answer}입니다.`,
    ),
    { type: "circle-diagram", mode: answer === "지름" ? "diameter" : "radius", radius: 4, diameter: 8, unit: "cm", title: "원 용어" },
  );
}

function genG3CircleCompass(): Problem {
  const radius = randInt(3, 9);
  return withVisual(
    mkInteger(
      "g3-circle-compass",
      "컴퍼스를 벌린 길이와 반지름의 관계를 구하세요.",
      `컴퍼스를 ${radius} cm 벌려 원을 그렸습니다. 그 원의 반지름은 몇 cm입니까?`,
      radius,
      `컴퍼스를 벌린 길이가 원의 중심에서 원 위까지의 거리이므로 반지름은 ${radius} cm입니다.`,
    ),
    { type: "circle-diagram", mode: "radius", radius, unit: "cm", title: "컴퍼스로 원 그리기" },
  );
}

function genG3CirclePattern(): Problem {
  const petals = randInt(4, 8);
  const total = petals + 1;
  const radius = randInt(2, 5);
  return withVisual(
    mkInteger(
      "g3-circle-pattern",
      "원을 이용한 무늬에서 원의 개수를 구하세요.",
      `가운데 원 1개와 둘레의 원 ${petals}개로 꽃 모양을 만들었습니다. 원은 모두 몇 개입니까?`,
      total,
      `가운데 원 1개에 둘레의 원 ${petals}개를 더하면 ${total}개입니다.`,
    ),
    { type: "circle-pattern", circles: total, radius, unit: "cm", title: "원을 이용한 무늬" },
  );
}

function genG3AngleEstimate(): Problem {
  const degrees = choice([30, 45, 60, 90, 120, 150]);
  return withVisual(
    mkChoice(
      "g3-angle-estimate",
      "그림의 각도에 가장 가까운 값을 고르세요.",
      "표시된 각은 몇 도입니까?",
      `${degrees}°`,
      ["30°", "45°", "60°", "90°", "120°", "150°"].filter((item) => item !== `${degrees}°`),
      `각도 그림에 표시된 크기는 ${degrees}°입니다.`,
    ),
    { type: "angle-diagram", degrees, title: "각도 어림" },
  );
}

function genG3AngleSum(): Problem {
  const a = choice([20, 30, 40, 45, 60]);
  const b = choice([20, 30, 40, 45, 60]);
  const answer = a + b;
  return withVisual(
    mkInteger(
      "g3-angle-sum",
      "두 각의 합을 구하세요.",
      `${a}°와 ${b}°를 이어 붙이면 모두 몇 도입니까?`,
      answer,
      `${a} + ${b} = ${answer}이므로 두 각의 합은 ${answer}°입니다.`,
    ),
    { type: "angle-diagram", degrees: answer, title: "각도의 합" },
  );
}

function genG3VolumeConvert(): Problem {
  const l = randInt(1, 8);
  const ml = choice([50, 100, 250, 300, 500, 750]);
  const answer = l * 1000 + ml;
  return withVisual(
    mkInteger(
      "g3-liter-milliliter-convert",
      "L와 mL를 mL로 나타내세요.",
      `${l} L ${ml} mL = □ mL`,
      answer,
      `1 L = 1000 mL이므로 ${l} L ${ml} mL = ${answer} mL입니다.`,
    ),
    {
      type: "data-table",
      caption: "들이 단위 변환",
      headers: ["L", "mL", "전체 mL"],
      rows: [[l, ml, "□"]],
    },
  );
}

function genG3WeightConvert(): Problem {
  const kg = randInt(1, 8);
  const g = choice([50, 100, 250, 400, 500, 750]);
  const answer = kg * 1000 + g;
  return withVisual(
    mkInteger(
      "g3-kg-g-convert",
      "kg와 g을 g으로 나타내세요.",
      `${kg} kg ${g} g = □ g`,
      answer,
      `1 kg = 1000 g이므로 ${kg} kg ${g} g = ${answer} g입니다.`,
    ),
    {
      type: "data-table",
      caption: "무게 단위 변환",
      headers: ["kg", "g", "전체 g"],
      rows: [[kg, g, "□"]],
    },
  );
}

function volumeText(totalMl: number): string {
  const l = Math.floor(totalMl / 1000);
  const ml = totalMl % 1000;
  return `${l} L ${ml} mL`;
}

function weightText(totalG: number): string {
  const kg = Math.floor(totalG / 1000);
  const g = totalG % 1000;
  return `${kg} kg ${g} g`;
}

function genG3VolumeAdd(): Problem {
  const first = randInt(1, 4) * 1000 + choice([100, 200, 350, 500, 750]);
  const second = randInt(0, 2) * 1000 + choice([100, 250, 400, 500]);
  const answer = first + second;
  return withVisual(
    mkInteger(
      "g3-volume-add",
      "들이의 덧셈을 mL로 계산하세요.",
      `${volumeText(first)}와 ${volumeText(second)}를 합하면 모두 몇 mL입니까?`,
      answer,
      `${first} mL + ${second} mL = ${answer} mL입니다.`,
    ),
    {
      type: "data-table",
      caption: "들이의 덧셈",
      headers: ["양", "mL로 나타내기"],
      rows: [
        [volumeText(first), first],
        [volumeText(second), second],
        ["합", "□"],
      ],
    },
  );
}

function genG3VolumeSub(): Problem {
  const second = randInt(0, 2) * 1000 + choice([100, 250, 400, 500]);
  const first = second + randInt(1, 4) * 1000 + choice([100, 200, 350, 500]);
  const answer = first - second;
  return withVisual(
    mkInteger(
      "g3-volume-sub",
      "들이의 뺄셈을 mL로 계산하세요.",
      `${volumeText(first)}에서 ${volumeText(second)}를 덜어 냈습니다. 남은 양은 몇 mL입니까?`,
      answer,
      `${first} mL - ${second} mL = ${answer} mL입니다.`,
    ),
    {
      type: "data-table",
      caption: "들이의 뺄셈",
      headers: ["처음", "덜어 낸 양", "남은 양"],
      rows: [[first, second, "□"]],
    },
  );
}

function genG3WeightAdd(): Problem {
  const first = randInt(1, 4) * 1000 + choice([100, 200, 350, 500, 750]);
  const second = randInt(0, 2) * 1000 + choice([100, 250, 400, 500]);
  const answer = first + second;
  return withVisual(
    mkInteger(
      "g3-weight-add",
      "무게의 덧셈을 g으로 계산하세요.",
      `${weightText(first)}와 ${weightText(second)}를 합하면 모두 몇 g입니까?`,
      answer,
      `${first} g + ${second} g = ${answer} g입니다.`,
    ),
    {
      type: "data-table",
      caption: "무게의 덧셈",
      headers: ["물건", "g으로 나타내기"],
      rows: [
        ["첫째", first],
        ["둘째", second],
        ["합", "□"],
      ],
    },
  );
}

function genG3WeightSub(): Problem {
  const second = randInt(0, 2) * 1000 + choice([100, 250, 400, 500]);
  const first = second + randInt(1, 4) * 1000 + choice([100, 200, 350, 500]);
  const answer = first - second;
  return withVisual(
    mkInteger(
      "g3-weight-sub",
      "무게의 뺄셈을 g으로 계산하세요.",
      `${weightText(first)}에서 ${weightText(second)}를 덜면 몇 g이 남습니까?`,
      answer,
      `${first} g - ${second} g = ${answer} g입니다.`,
    ),
    {
      type: "data-table",
      caption: "무게의 뺄셈",
      headers: ["처음", "덜어 낸 무게", "남은 무게"],
      rows: [[first, second, "□"]],
    },
  );
}

function genG3BarGraphRead(): Problem {
  const items = [
    { label: "축구", value: randInt(12, 28) },
    { label: "피구", value: randInt(12, 28) },
    { label: "줄넘기", value: randInt(12, 28) },
    { label: "달리기", value: randInt(12, 28) },
  ];
  const target = choice(items);
  return withVisual(
    mkInteger(
      "g3-bar-graph-read",
      "막대그래프를 보고 수를 읽으세요.",
      `${target.label}를 좋아하는 학생은 몇 명입니까?`,
      target.value,
      `그래프에서 ${target.label} 막대의 높이는 ${target.value}명입니다.`,
    ),
    { type: "bar-chart", title: "좋아하는 체육 활동", unit: "명", items },
  );
}

function genG3BarGraphDifference(): Problem {
  const a = randInt(18, 35);
  const b = randInt(8, 17);
  return withVisual(
    mkInteger(
      "g3-bar-graph-difference",
      "그래프에서 두 수의 차를 구하세요.",
      `사과 상자는 배 상자보다 몇 상자 더 많습니까?`,
      a - b,
      `${a} - ${b} = ${a - b}상자입니다.`,
    ),
    {
      type: "bar-chart",
      title: "과일 상자 수",
      unit: "상자",
      items: [
        { label: "사과", value: a },
        { label: "배", value: b },
        { label: "감", value: randInt(10, 25) },
      ],
    },
  );
}

function genG3BarGraphScale(): Problem {
  const unit = choice([5, 10]);
  const items = [
    { label: "월", value: randInt(2, 6) * unit },
    { label: "화", value: randInt(2, 6) * unit },
    { label: "수", value: randInt(2, 6) * unit },
    { label: "목", value: randInt(2, 6) * unit },
  ];
  const target = choice(items);
  return withVisual(
    mkInteger(
      "g3-bar-graph-scale",
      "막대그래프의 눈금 간격을 생각해 값을 읽으세요.",
      `한 눈금이 ${unit}개일 때 ${target.label}요일의 수는 몇 개입니까?`,
      target.value,
      `한 눈금이 ${unit}개이고 ${target.label}요일 막대는 ${target.value}개를 나타냅니다.`,
    ),
    { type: "bar-chart", title: `한 눈금 ${unit}개인 막대그래프`, unit: "개", items },
  );
}

function genG3PictureGraphTotal(): Problem {
  const big = randInt(2, 7);
  const small = randInt(1, 9);
  const answer = big * 10 + small;
  return withVisual(
    mkInteger(
      "g3-picture-graph-total",
      "그림그래프의 큰 그림과 작은 그림을 합해 수를 구하세요.",
      `큰 그림 ${big}개는 각각 10개, 작은 그림 ${small}개는 각각 1개를 나타냅니다. 모두 몇 개입니까?`,
      answer,
      `${big} × 10 + ${small} = ${answer}입니다.`,
    ),
    {
      type: "pictograph",
      title: "그림그래프 읽기",
      unit: "개",
      bigValue: 10,
      smallValue: 1,
      items: [{ label: "전체", bigCount: big, smallCount: small }],
    },
  );
}

function genG3PictureGraphCompare(): Problem {
  const items = [
    { label: "사과", bigCount: randInt(2, 6), smallCount: randInt(0, 8) },
    { label: "배", bigCount: randInt(1, 5), smallCount: randInt(0, 8) },
    { label: "감", bigCount: randInt(1, 5), smallCount: randInt(0, 8) },
  ];
  const values = items.map((item) => ({ ...item, value: item.bigCount * 10 + item.smallCount }));
  const sorted = [...values].sort((a, b) => b.value - a.value);
  const answer = sorted[0].value - sorted[1].value;
  return withVisual(
    mkInteger(
      "g3-picture-graph-compare",
      "그림그래프에서 가장 많은 항목과 두 번째 항목의 차를 구하세요.",
      `${sorted[0].label}와 ${sorted[1].label}의 수 차이는 몇 개입니까?`,
      answer,
      `${sorted[0].value} - ${sorted[1].value} = ${answer}이므로 차이는 ${answer}개입니다.`,
    ),
    { type: "pictograph", title: "과일 수 그림그래프", unit: "개", bigValue: 10, smallValue: 1, items },
  );
}

function genG3PictureGraphBuild(): Problem {
  const count = randInt(24, 87);
  const big = Math.floor(count / 10);
  const small = count % 10;
  const answer = `큰 그림 ${big}개, 작은 그림 ${small}개`;
  return withVisual(
    mkChoice(
      "g3-picture-graph-build",
      "수를 그림그래프로 나타내는 방법을 고르세요.",
      `${count}개를 큰 그림 1개=10개, 작은 그림 1개=1개인 그림그래프로 나타내려고 합니다.`,
      answer,
      [`큰 그림 ${big + 1}개, 작은 그림 ${small}개`, `큰 그림 ${Math.max(0, big - 1)}개, 작은 그림 ${small + 10}개`, `큰 그림 ${small}개, 작은 그림 ${big}개`, `큰 그림 ${big}개, 작은 그림 ${Math.max(0, small - 1)}개`],
      `${count} = ${big} × 10 + ${small}이므로 ${answer}가 알맞습니다.`,
    ),
    {
      type: "data-table",
      caption: "그림그래프 나타내기",
      headers: ["전체", "큰 그림", "작은 그림"],
      rows: [[count, big, small]],
    },
  );
}

function genG3LineChartRead(): Problem {
  const points = [
    { label: "월", value: randInt(12, 20) },
    { label: "화", value: randInt(14, 24) },
    { label: "수", value: randInt(16, 28) },
    { label: "목", value: randInt(14, 26) },
    { label: "금", value: randInt(18, 30) },
  ];
  const target = choice(points);
  return withVisual(
    mkInteger(
      "g3-line-chart-read",
      "꺾은선그래프를 보고 값을 읽으세요.",
      `${target.label}요일의 온도는 몇 도입니까?`,
      target.value,
      `그래프에서 ${target.label}요일 점은 ${target.value}도에 있습니다.`,
    ),
    { type: "line-chart", title: "요일별 온도", unit: "도", points },
  );
}

function genG3PlaneMoveGrid(): Problem {
  const right = randInt(2, 7);
  const up = randInt(1, 5);
  return withVisual(
    mkChoice(
      "g3-plane-move-grid",
      "점의 이동을 순서대로 표현하세요.",
      `점 ㄱ을 오른쪽으로 ${right}칸, 위쪽으로 ${up}칸 옮겼습니다. 알맞은 설명은 무엇입니까?`,
      `오른쪽 ${right}칸, 위쪽 ${up}칸`,
      [`왼쪽 ${right}칸, 위쪽 ${up}칸`, `오른쪽 ${up}칸, 위쪽 ${right}칸`, `오른쪽 ${right}칸, 아래쪽 ${up}칸`, `왼쪽 ${up}칸, 아래쪽 ${right}칸`],
      `가로 방향을 먼저 보면 오른쪽 ${right}칸, 세로 방향은 위쪽 ${up}칸입니다.`,
    ),
    {
      type: "data-table",
      caption: "점의 이동",
      headers: ["방향", "칸 수"],
      rows: [
        ["오른쪽", right],
        ["위쪽", up],
      ],
    },
  );
}

function genG3PlaneFlipChoice(): Problem {
  const direction = choice(["왼쪽", "오른쪽", "위쪽", "아래쪽"]);
  return withVisual(
    mkChoice(
      "g3-plane-flip-choice",
      "평면도형을 뒤집을 때 바뀌는 방향을 고르세요.",
      `도형을 ${direction}으로 뒤집었습니다. 어떤 방향이 서로 바뀝니까?`,
      direction === "왼쪽" || direction === "오른쪽" ? "왼쪽과 오른쪽" : "위쪽과 아래쪽",
      ["왼쪽과 오른쪽", "위쪽과 아래쪽", "크기", "변의 개수"],
      `도형을 ${direction}으로 뒤집으면 ${
        direction === "왼쪽" || direction === "오른쪽" ? "왼쪽과 오른쪽" : "위쪽과 아래쪽"
      }이 서로 바뀝니다.`,
    ),
    { type: "symmetry-shape", shape: "rectangle" },
  );
}

function genG3PlaneTurnChoice(): Problem {
  const angle = choice([90, 180, 270, 360]);
  return withVisual(
    mkChoice(
      "g3-plane-turn-choice",
      "평면도형을 돌렸을 때의 각도를 고르세요.",
      `도형을 시계 방향으로 ${angle}° 돌렸습니다. 알맞은 회전 각도는 무엇입니까?`,
      `${angle}°`,
      ["90°", "180°", "270°", "360°"],
      `시계 방향으로 ${angle}° 돌린 것이므로 답은 ${angle}°입니다.`,
    ),
    { type: "angle-diagram", degrees: angle, title: "회전 각도" },
  );
}

function genG3OpPlaneFlipTurn(): Problem {
  return Math.random() < 0.5 ? genG3PlaneFlipChoice() : genG3PlaneTurnChoice();
}

function genG3OpShapePattern(): Problem {
  const patterns = [
    { seq: ["△", "□", "△", "□"], answer: "△" },
    { seq: ["○", "○", "□", "○", "○", "□"], answer: "○" },
    { seq: ["△", "□", "○", "△", "□", "○"], answer: "△" },
    { seq: ["◇", "△", "△", "◇", "△", "△"], answer: "◇" },
  ];
  const item = choice(patterns);
  return withVisual(
    mkChoice(
      "g3-op-shape-pattern",
      "도형 무늬의 규칙을 보고 다음 도형을 고르세요.",
      `${item.seq.join(" ")} ?`,
      item.answer,
      ["△", "□", "○", "◇"].filter((option) => option !== item.answer),
      `반복되는 묶음을 찾으면 다음 도형은 ${item.answer}입니다.`,
    ),
    { type: "shape-pattern", items: [...item.seq, "?"], title: "도형 무늬 규칙" },
  );
}

function genG3OpCalendarPattern(): Problem {
  const first = randInt(1, 7);
  const second = first + 7;
  const third = second + 7;
  const answer = third + 7;
  return withVisual(
    mkInteger(
      "g3-op-calendar-pattern",
      "달력에서 같은 요일의 날짜 규칙을 찾으세요.",
      `${first}일, ${second}일, ${third}일은 같은 요일입니다. 다음 같은 요일의 날짜는 며칠입니까?`,
      answer,
      `달력에서 같은 요일은 7일씩 커지므로 ${third} + 7 = ${answer}일입니다.`,
    ),
    {
      type: "data-table",
      caption: "달력 날짜 규칙",
      headers: ["차례", 1, 2, 3, 4],
      rows: [["날짜", first, second, third, "□"]],
    },
  );
}

function genG3OpShapeAngleTable(): Problem {
  const triangle = Math.random() < 0.55;
  if (triangle) {
    const a = choice([40, 50, 60, 70]);
    const b = choice([40, 50, 60, 70]);
    const answer = 180 - a - b;
    return withVisual(
      mkInteger(
        "g3-op-shape-angle-table",
        "삼각형의 세 각의 합을 이용해 빈 각을 구하세요.",
        `삼각형의 두 각이 ${a}°, ${b}°입니다. 나머지 한 각은 몇 도입니까?`,
        answer,
        `삼각형의 세 각의 합은 180°이므로 180 - ${a} - ${b} = ${answer}°입니다.`,
      ),
      {
        type: "data-table",
        caption: "삼각형 각도 표",
        headers: ["첫째 각", "둘째 각", "셋째 각", "합"],
        rows: [[`${a}°`, `${b}°`, "□", "180°"]],
      },
    );
  }
  const a = choice([70, 80, 90, 100]);
  const b = choice([70, 80, 90, 100]);
  const c = choice([70, 80, 90, 100]);
  const answer = 360 - a - b - c;
  return withVisual(
    mkInteger(
      "g3-op-shape-angle-table",
      "사각형의 네 각의 합을 이용해 빈 각을 구하세요.",
      `사각형의 세 각이 ${a}°, ${b}°, ${c}°입니다. 나머지 한 각은 몇 도입니까?`,
      answer,
      `사각형의 네 각의 합은 360°이므로 360 - ${a} - ${b} - ${c} = ${answer}°입니다.`,
    ),
    {
      type: "data-table",
      caption: "사각형 각도 표",
      headers: ["첫째 각", "둘째 각", "셋째 각", "넷째 각", "합"],
      rows: [[`${a}°`, `${b}°`, `${c}°`, "□", "360°"]],
    },
  );
}

function genG3OpCircleDraw(): Problem {
  return choice([genG3CircleCompass, genG3CircleRadiusDiameter, genG3CirclePattern])();
}

function genG3PrepBigNumber(): Problem {
  const tenThousands = randInt(2, 9);
  const thousands = randInt(0, 9);
  const hundreds = randInt(0, 9);
  const tens = randInt(0, 9);
  const ones = randInt(0, 9);
  const answer = tenThousands * 10000 + thousands * 1000 + hundreds * 100 + tens * 10 + ones;
  return withVisual(
    mkInteger(
      "g3-prep-big-number-read",
      "각 자리의 수를 모아 다섯 자리 수를 쓰세요.",
      `10000이 ${tenThousands}개, 1000이 ${thousands}개, 100이 ${hundreds}개, 10이 ${tens}개, 1이 ${ones}개인 수`,
      answer,
      `각 자리값을 더하면 ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "자리값 표",
      headers: ["만", "천", "백", "십", "일"],
      rows: [[tenThousands, thousands, hundreds, tens, ones]],
    },
  );
}

function genG3PrepPatternTable(): Problem {
  const start = randInt(3, 12);
  const step = randInt(3, 9);
  const answer = start + step * 4;
  return withVisual(
    mkInteger(
      "g3-prep-pattern-table",
      "표의 규칙을 보고 빈칸의 수를 구하세요.",
      `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, □`,
      answer,
      `${step}씩 커지는 규칙이므로 빈칸은 ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "규칙 표",
      headers: ["차례", 1, 2, 3, 4, 5],
      rows: [["수", start, start + step, start + step * 2, start + step * 3, "□"]],
    },
  );
}

function genG3KmMAddSub(): Problem {
  const first = randInt(2, 8) * 1000 + choice([100, 200, 300, 500, 700, 800]);
  const second = randInt(1, 5) * 1000 + choice([100, 200, 400, 600, 800]);
  const isAdd = Math.random() < 0.55;
  const bigger = Math.max(first, second);
  const smaller = Math.min(first, second);
  const answer = isAdd ? first + second : bigger - smaller;
  const kmM = (value: number) => `${Math.floor(value / 1000)} km ${value % 1000} m`;
  return withVisual(
    mkInteger(
      "g3-op-km-m-add-sub",
      "km와 m 단위 길이를 m로 바꾸어 계산하세요.",
      isAdd ? `${kmM(first)} + ${kmM(second)} = □ m` : `${kmM(bigger)} - ${kmM(smaller)} = □ m`,
      answer,
      `m 단위로 바꾸면 ${isAdd ? `${first} + ${second}` : `${bigger} - ${smaller}`} = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "길이 단위 변환",
      headers: ["길이", "m로 나타내기"],
      rows: isAdd
        ? [[kmM(first), first], [kmM(second), second], ["계산 결과", "□"]]
        : [[kmM(bigger), bigger], [kmM(smaller), smaller], ["계산 결과", "□"]],
    },
  );
}

function genG3LongDivisionTwoDigit(): Problem {
  const divisor = randInt(12, 39);
  const quotient = randInt(5, 24);
  const remainder = randInt(0, divisor - 1);
  const total = divisor * quotient + remainder;
  return withVisual(
    mkInteger(
      "g3-op-long-division-two-digit",
      "세 자리 수를 두 자리 수로 나눌 때 몫을 구하세요.",
      `${total} ÷ ${divisor} = 몫 □, 나머지 ${remainder}`,
      quotient,
      `${divisor} × ${quotient} = ${divisor * quotient}이고 ${total} - ${divisor * quotient} = ${remainder}입니다.`,
    ),
    {
      type: "data-table",
      caption: "나눗셈 검산",
      headers: ["나누는 수", "몫", "나머지", "검산"],
      rows: [[divisor, "□", remainder, `${divisor} × □ + ${remainder}`]],
    },
  );
}

function genG3MixedAddSub(): Problem {
  const a = randInt(24, 85);
  const b = randInt(12, 48);
  const c = randInt(8, 39);
  const addFirst = Math.random() < 0.5;
  const answer = addFirst ? a + b - c : a - b + c;
  return withVisual(
    mkInteger(
      "g3-op-mixed-add-sub",
      "덧셈과 뺄셈이 섞인 식을 앞에서부터 계산하세요.",
      addFirst ? `${a} + ${b} - ${c} = □` : `${a} - ${b} + ${c} = □`,
      answer,
      addFirst ? `${a} + ${b} = ${a + b}, ${a + b} - ${c} = ${answer}입니다.` : `${a} - ${b} = ${a - b}, ${a - b} + ${c} = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "계산 순서",
      headers: ["1단계", "2단계"],
      rows: addFirst ? [[`${a} + ${b}`, a + b], [`${a + b} - ${c}`, "□"]] : [[`${a} - ${b}`, a - b], [`${a - b} + ${c}`, "□"]],
    },
  );
}

function genG3MixedMulDiv(): Problem {
  const a = randInt(2, 9);
  const b = randInt(3, 9);
  const c = choice([2, 3, 4, 5, 6]);
  const product = a * b * c;
  const answer = product / c;
  return withVisual(
    mkInteger(
      "g3-op-mixed-mul-div",
      "곱셈과 나눗셈이 섞인 식을 앞에서부터 계산하세요.",
      `${a} × ${b} × ${c} ÷ ${c} = □`,
      answer,
      `앞에서부터 계산하면 ${a} × ${b} = ${a * b}, ${a * b} × ${c} = ${product}, ${product} ÷ ${c} = ${answer}입니다.`,
    ),
    {
      type: "data-table",
      caption: "곱셈·나눗셈 순서",
      headers: ["식", "값"],
      rows: [[`${a} × ${b}`, a * b], [`${a * b} × ${c}`, product], [`${product} ÷ ${c}`, "□"]],
    },
  );
}

function genG3NaturalMinusFraction(): Problem {
  const whole = randInt(2, 7);
  const denominator = randInt(3, 9);
  const numerator = randInt(1, denominator - 1);
  const answer = makeFrac(whole * denominator - numerator, denominator);
  return withVisual(
    {
      topicId: "g3-op-natural-minus-fraction",
      prompt: "자연수에서 분수를 빼세요.",
      expression: `${whole} - ${numerator}/${denominator}`,
      hint: "분수 또는 대분수로 입력",
      answer,
      kind: "fraction",
      answerText: formatFrac(answer),
      solution: `${whole} = ${whole * denominator}/${denominator}이므로 ${whole * denominator}/${denominator} - ${numerator}/${denominator} = ${formatFrac(answer)}입니다.`,
    },
    { type: "fraction-strip", numerator: denominator - numerator, denominator, title: "1에서 남는 분수 조각" },
  );
}

function genG3OpFractionAddSub(): Problem {
  return Math.random() < 0.5 ? genG3FractionAddSameDenom() : genG3FractionSubSameDenom();
}

function genG3OpVolumeAddSub(): Problem {
  return Math.random() < 0.5 ? genG3VolumeAdd() : genG3VolumeSub();
}

function genG3OpWeightAddSub(): Problem {
  return Math.random() < 0.5 ? genG3WeightAdd() : genG3WeightSub();
}

function genG3OpMultiplyReview(): Problem {
  return choice([genG3ThreeDigitTimesOneDigit, genG3TwoDigitTimesTwoDigit, genG3OneDigitTimesTwoDigit])();
}

function genG3OpFractionDecimalReview(): Problem {
  return choice([genG3FractionAddSameDenom, genG3FractionSubSameDenom, genG3DecimalCompareTenths])();
}

function genG3OpBigMultiply(): Problem {
  return Math.random() < 0.45 ? genG3TensTimesOneDigit() : genG3ThreeDigitTimesOneDigit();
}

function genG3OpAngleReview(): Problem {
  return Math.random() < 0.5 ? genG3AngleEstimate() : genG3AngleSum();
}

function guideTable(caption: string, rows: Array<[string, string | number]>): NonNullable<Problem["visual"]> {
  return {
    type: "data-table",
    caption,
    headers: ["구분", "내용"],
    rows,
  };
}

function angleFromProblem(problem: Problem, fallback = 60) {
  const degrees = problem.expression.match(/(\d+)°/)?.[1];
  if (degrees) return Number(degrees);
  return typeof problem.answer === "number" ? problem.answer : fallback;
}

function fractionStripFromProblem(problem: Problem, title: string): NonNullable<Problem["visual"]> | undefined {
  const match = problem.expression.match(/(?:\d+\s+)?(\d+)\/(\d+)/);
  if (!match) return undefined;
  const denominator = Math.max(2, Number(match[2]));
  const numerator = Math.max(1, Math.min(denominator, Number(match[1]) || 1));
  return { type: "fraction-strip", numerator, denominator, title };
}

function decimalPlaceTable(problem: Problem, caption: string): NonNullable<Problem["visual"]> {
  const values = problem.expression.match(/\d+(?:\.\d+)?/g)?.slice(0, 2) ?? [];
  const rows = values.length
    ? values.map((value) => {
        const [whole, decimal = ""] = value.split(".");
        return [value, whole.slice(-1), decimal[0] ?? "-", decimal[1] ?? "-", decimal[2] ?? "-"];
      })
    : [[problem.expression, "-", "-", "-", "-"]];
  return {
    type: "data-table",
    caption,
    headers: ["수", "일의 자리", "소수 첫째", "소수 둘째", "소수 셋째"],
    rows,
  };
}

function rangeLineFromProblem(topicId: string, problem: Problem): NonNullable<Problem["visual"]> {
  const numbers = (problem.expression.match(/\d+/g) ?? []).map(Number);
  const start = numbers[0] ?? 20;
  const rawEnd = numbers[1] ?? start + 10;
  const end = rawEnd === start ? start + 10 : rawEnd;
  return {
    type: "range-line",
    start,
    end,
    leftInclusive: topicId.includes("statement") || problem.expression.includes("이상") || !problem.expression.includes("초과"),
    rightInclusive: problem.expression.includes("이하") && !problem.expression.includes("미만"),
    title: "수의 범위",
  };
}

function polygonSidesFromProblem(problem: Problem, fallback = 6) {
  const explicit = problem.expression.match(/(\d+)각형/)?.[1] ?? problem.expression.match(/변이\s*(\d+)개/)?.[1];
  return explicit ? Number(explicit) : fallback;
}

function quadrilateralKindFromProblem(problem: Problem): "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square" {
  const text = `${problem.expression} ${problem.answerText ?? ""} ${String(problem.answer)}`;
  if (text.includes("사다리꼴")) return "trapezoid";
  if (text.includes("평행사변형")) return "parallelogram";
  if (text.includes("마름모")) return "rhombus";
  if (text.includes("정사각형")) return "square";
  return "rectangle";
}

function operationCourseVisual(topicId: string, problem: Problem): NonNullable<Problem["visual"]> | undefined {
  if ((!topicId.startsWith("g4-op-") && !topicId.startsWith("g5-op-") && !topicId.startsWith("g6-op-")) || problem.visual) return problem.visual;

  if (topicId.includes("angle")) {
    return { type: "angle-diagram", degrees: angleFromProblem(problem), title: "각도 그림" };
  }
  if (topicId.includes("parallel-distance")) {
    return { type: "parallel-lines", mode: "distance", title: "평행선 사이 거리" };
  }
  if (topicId.includes("parallel-perpendicular")) {
    const mode = problem.expression.includes("직각") || String(problem.answer).includes("수직") ? "perpendicular" : "parallel";
    return { type: "parallel-lines", mode, title: "수직과 평행" };
  }
  if (topicId.includes("trapezoid")) {
    return { type: "quadrilateral-diagram", kind: "trapezoid", title: "사다리꼴" };
  }
  if (topicId.includes("parallelogram")) {
    return { type: "quadrilateral-diagram", kind: "parallelogram", title: "평행사변형" };
  }
  if (topicId.includes("rhombus")) {
    return { type: "quadrilateral-diagram", kind: "rhombus", title: "마름모" };
  }
  if (topicId.includes("rectangle-square")) {
    return { type: "quadrilateral-diagram", kind: "rectangle", title: "직사각형과 정사각형" };
  }
  if (topicId.includes("quadrilateral-kind")) {
    return { type: "quadrilateral-diagram", kind: quadrilateralKindFromProblem(problem), title: "사각형 분류" };
  }
  if (topicId.includes("polygon-diagonal")) {
    return { type: "polygon-diagram", sides: polygonSidesFromProblem(problem), showDiagonal: true, title: "다각형의 대각선" };
  }
  if (topicId.includes("regular-polygon")) {
    return { type: "polygon-diagram", sides: polygonSidesFromProblem(problem), regular: true, title: "정다각형" };
  }
  if (topicId.includes("polygon-name")) {
    return { type: "polygon-diagram", sides: polygonSidesFromProblem(problem), title: "다각형 이름" };
  }
  if (topicId.includes("congruent")) {
    return { type: "congruent-triangles", target: topicId.includes("angle") ? "대응각" : "대응변" };
  }
  if (topicId.includes("symmetry-coordinate")) {
    return { type: "coordinate-plane", point: [2, 3], axis: "y", reflected: [-2, 3] };
  }
  if (topicId.includes("line-symmetry")) {
    return { type: "symmetry-shape", shape: "rectangle" };
  }
  if (topicId.includes("point-symmetry")) {
    return { type: "rotation-180" };
  }
  if (topicId.includes("cuboid")) {
    return { type: "cuboid", width: 6, depth: 4, height: 3, unit: "cm" };
  }
  if (topicId.includes("stacked-cubes")) {
    return { type: "cube-stack", cols: 3, rows: 2, layers: 2 };
  }
  if (topicId.includes("average")) {
    return guideTable("평균 계산 표", [["합계", "자료의 값을 모두 더하기"], ["평균", "합계 ÷ 자료 수"]]);
  }
  if (topicId.includes("chance")) {
    return { type: "probability-bag", red: 3, blue: 2 };
  }
  if (topicId.includes("rate") || topicId.includes("offset") || topicId.includes("table") || topicId.includes("formula")) {
    return guideTable("대응 관계 표", [["문제", problem.expression], ["확인", "표의 규칙을 식으로 바꾸어 계산"]]);
  }
  if (topicId.includes("pattern")) {
    return { type: "shape-pattern", items: ["triangle", "square", "triangle", "square", "?"] };
  }
  if (topicId.includes("graph")) {
    return { type: "bar-chart", title: "자료 비교 그래프", unit: "개", items: [{ label: "가", value: 4 }, { label: "나", value: 7 }, { label: "다", value: 5 }] };
  }
  if (topicId.includes("range")) {
    return rangeLineFromProblem(topicId, problem);
  }
  if (topicId.includes("decimal")) {
    return decimalPlaceTable(problem, "소수 자리값 표");
  }
  if (topicId.includes("fraction") || topicId.includes("denom") || topicId.includes("reduce") || topicId.includes("common-denominator")) {
    return fractionStripFromProblem(problem, "분수 막대") ?? guideTable("분수 계산 표", [["문제", problem.expression], ["풀이", "분모와 분자를 맞추어 계산"]]);
  }
  if (topicId.includes("factor") || topicId.includes("multiple")) {
    return guideTable("약수와 배수 점검표", [["문제", problem.expression], ["확인", "곱셈식과 나눗셈식으로 관계 확인"]]);
  }
  if (topicId.includes("place-value") || topicId.includes("big-number") || topicId.includes("million") || topicId.includes("number-compare")) {
    return guideTable("큰 수 자리값 표", [["문제", problem.expression], ["확인", "높은 자리부터 차례대로 비교"]]);
  }
  if (topicId.includes("skip-counting")) {
    return { type: "number-line", values: [0, 1, 2, 3, 4].map((index) => index + 1), missingIndex: 2, title: "뛰어 세기 흐름" };
  }
  if (topicId.includes("rounding") || topicId.includes("round") || topicId.includes("estimate")) {
    return guideTable("어림 계산 표", [["문제", problem.expression], ["확인", "기준 자리 아래 숫자를 보고 어림"]]);
  }

  return guideTable("연산 풀이 표", [["문제", problem.expression], ["입력", problem.hint ?? "정답 입력"]]);
}

const aliasTopic = (topicId: string, generate: () => Problem) => () => {
  const problem = retopic(topicId, generate());
  const visual = operationCourseVisual(topicId, problem);
  return visual ? withVisual(problem, visual) : problem;
};

function hideFirstGradeAnswerVisual(problem: Problem): Problem {
  const visual = problem.visual;
  if (!problem.topicId.startsWith("g1-") || !visual) return problem;

  if (visual.type === "object-array") {
    return { ...problem, visual: { ...visual, showTotalLabel: false } };
  }
  if (visual.type === "ten-frame") {
    return { ...problem, visual: { ...visual, showCountLabel: false } };
  }
  if (visual.type === "place-value-blocks" || visual.type === "base-ten-blocks") {
    return { ...problem, visual: { ...visual, showTotal: false } };
  }
  if (visual.type === "bar-chart" && problem.topicId.includes("compare-facts")) {
    return { ...problem, visual: { ...visual, showValues: false } };
  }

  return problem;
}

const RAW_GENERATORS: Record<string, () => Problem> = {
  "g1-m03-split-number": () => retopic("g1-m03-split-number", genG1SplitNumber()),
  "g1-m03-number-line-missing": () => retopic("g1-m03-number-line-missing", genG1NumberLineMissing()),
  "g1-m04-shape-name": () => retopic("g1-m04-shape-name", genG1ShapeName()),
  "g1-m04-shape-sort": () => retopic("g1-m04-shape-sort", genG1ShapeSort()),
  "g1-m04-shape-count": () => retopic("g1-m04-shape-count", genG1ShapeSort()),
  "g1-m04-pattern-shape": () => retopic("g1-m04-pattern-shape", genG1PatternShape()),
  "g1-m04-count-objects": () => retopic("g1-m04-count-objects", genG1CountObjects()),
  "g1-m04-shape-review": () => retopic("g1-m04-shape-review", genG1ShapeName()),
  "g1-m05-zero-add-sub": () => retopic("g1-m05-zero-add-sub", genG1ZeroAddSub()),
  "g1-m05-length-compare": () => retopic("g1-m05-length-compare", genG1LengthCompare()),
  "g1-m05-weight-compare": () => retopic("g1-m05-weight-compare", genG1WeightCompare()),
  "g1-m05-capacity-compare": () => retopic("g1-m05-capacity-compare", genG1CapacityCompare()),
  "g1-m05-split-number": () => retopic("g1-m05-split-number", genG1SplitNumber()),
  "g1-m05-make-ten": () => retopic("g1-m05-make-ten", genG1MakeTen()),
  "g1-m05-word-add-sub": () => retopic("g1-m05-word-add-sub", genG1WordAddSubSmall()),
  "g1-m06-tens-ones-read": () => retopic("g1-m06-tens-ones-read", genG1TensOnesRead()),
  "g1-m06-count-by-tens": () => retopic("g1-m06-count-by-tens", genG1CountByTens()),
  "g1-m06-two-digit-compare": () => retopic("g1-m06-two-digit-compare", genG1TwoDigitCompare()),
  "g1-m06-number-line-missing": () => retopic("g1-m06-number-line-missing", genG1NumberLineMissing()),
  "g1-m06-number-read": () => retopic("g1-m06-number-read", genG1TensOnesRead()),
  "g1-m06-review-add-sub": () => retopic("g1-m06-review-add-sub", genG1ReviewAddSub()),
  "g1-m07-count-by-tens": () => retopic("g1-m07-count-by-tens", genG1CountByTens()),
  "g1-m07-two-digit-compare": () => retopic("g1-m07-two-digit-compare", genG1TwoDigitCompare()),
  "g1-m07-number-line-missing": () => retopic("g1-m07-number-line-missing", genG1NumberLineMissing()),
  "g1-m07-place-review": () => retopic("g1-m07-place-review", genG1TensOnesRead()),
  "g1-m07-shape-name": () => retopic("g1-m07-shape-name", genG1ShapeName()),
  "g1-m08-add-under-20": () => retopic("g1-m08-add-under-20", genG1AddUnder20()),
  "g1-m08-sub-under-20": () => retopic("g1-m08-sub-under-20", genG1SubUnder20()),
  "g1-m08-make-ten": () => retopic("g1-m08-make-ten", genG1MakeTen()),
  "g1-m08-number-line-missing": () => retopic("g1-m08-number-line-missing", genG1NumberLineMissing()),
  "g1-m08-word-add-sub": () => retopic("g1-m08-word-add-sub", genG1WordAddSubSmall()),
  "g1-m09-number-line-missing": () => retopic("g1-m09-number-line-missing", genG1NumberLineMissing()),
  "g1-m09-odd-even": () => retopic("g1-m09-odd-even", genG1OddEven()),
  "g1-m09-three-number-add-sub": () => retopic("g1-m09-three-number-add-sub", genG1ThreeNumberAddSub()),
  "g1-m10-make-ten": () => retopic("g1-m10-make-ten", genG1MakeTen()),
  "g1-m10-add-under-10": () => retopic("g1-m10-add-under-10", genG1AddUnder10()),
  "g1-m10-sub-under-10": () => retopic("g1-m10-sub-under-10", genG1SubUnder10()),
  "g1-m10-split-number": () => retopic("g1-m10-split-number", genG1SplitNumber()),
  "g1-m10-zero-add-sub": () => retopic("g1-m10-zero-add-sub", genG1ZeroAddSub()),
  "g1-m10-shape-name": () => retopic("g1-m10-shape-name", genG1ShapeName()),
  "g1-m10-clock-hour": () => retopic("g1-m10-clock-hour", genG1ClockHour()),
  "g1-m10-clock-half": () => retopic("g1-m10-clock-half", genG1ClockHalf()),
  "g1-m11-add-under-20": () => retopic("g1-m11-add-under-20", genG1AddUnder20()),
  "g1-m11-make-ten": () => retopic("g1-m11-make-ten", genG1MakeTen()),
  "g1-m11-sub-under-20": () => retopic("g1-m11-sub-under-20", genG1SubUnder20()),
  "g1-m11-number-line-missing": () => retopic("g1-m11-number-line-missing", genG1NumberLineMissing()),
  "g1-m11-word-add-sub": () => retopic("g1-m11-word-add-sub", genG1WordAddSubSmall()),
  "g1-m11-pattern-shape": () => retopic("g1-m11-pattern-shape", genG1PatternShape()),
  "g1-m11-three-number-add-sub": () => retopic("g1-m11-three-number-add-sub", genG1ThreeNumberAddSub()),
  "g1-op-m03-picture-add": () => retopic("g1-op-m03-picture-add", genG1OperationAddWithin(9)),
  "g1-op-m03-number-bond": () => retopic("g1-op-m03-number-bond", genG1OperationNumberBond(9)),
  "g1-op-m03-missing-number": () => retopic("g1-op-m03-missing-number", genG1OperationMissingAdd(9)),
  "g1-op-m04-add-under-10": () => retopic("g1-op-m04-add-under-10", genG1OperationAddWithin(10)),
  "g1-op-m04-sub-under-10": () => retopic("g1-op-m04-sub-under-10", genG1OperationSubWithin(10)),
  "g1-op-m04-word-under-10": () => retopic("g1-op-m04-word-under-10", genG1OperationWord(9)),
  "g1-op-m05-zero": () => retopic("g1-op-m05-zero", genG1OperationZero()),
  "g1-op-m05-make-ten": () => retopic("g1-op-m05-make-ten", genG1OperationMakeTen()),
  "g1-op-m05-fact-family-10": () => retopic("g1-op-m05-fact-family-10", genG1OperationFactFamily(10)),
  "g1-op-m06-tens-ones": () => retopic("g1-op-m06-tens-ones", genG1OperationTensOnes()),
  "g1-op-m06-add-no-carry": () => retopic("g1-op-m06-add-no-carry", genG1OperationTwoDigitAddNoCarry()),
  "g1-op-m06-sub-no-borrow": () => retopic("g1-op-m06-sub-no-borrow", genG1OperationTwoDigitSubNoBorrow()),
  "g1-op-m07-count-by-tens": () => retopic("g1-op-m07-count-by-tens", genG1OperationCountByTens()),
  "g1-op-m07-add-no-carry": () => retopic("g1-op-m07-add-no-carry", genG1OperationTwoDigitAddNoCarry()),
  "g1-op-m07-sub-no-borrow": () => retopic("g1-op-m07-sub-no-borrow", genG1OperationTwoDigitSubNoBorrow()),
  "g1-op-m08-add-carry": () => retopic("g1-op-m08-add-carry", genG1OperationAddWithin(18, true)),
  "g1-op-m08-make-ten-bridge": () => retopic("g1-op-m08-make-ten-bridge", genG1OperationMakeTen()),
  "g1-op-m08-sub-bridge": () => retopic("g1-op-m08-sub-bridge", genG1OperationSubWithin(18, true)),
  "g1-op-m09-three-number-add": () => retopic("g1-op-m09-three-number-add", genG1OperationThreeNumber("add")),
  "g1-op-m09-mixed-add-sub": () => retopic("g1-op-m09-mixed-add-sub", genG1OperationThreeNumber("mixed")),
  "g1-op-m09-compare-facts": () => retopic("g1-op-m09-compare-facts", genG1OperationCompareFacts()),
  "g1-op-m10-ten-pairs": () => retopic("g1-op-m10-ten-pairs", genG1OperationMakeTen()),
  "g1-op-m10-missing-operator": () => retopic("g1-op-m10-missing-operator", genG1OperationMissingOperator()),
  "g1-op-m10-fact-family": () => retopic("g1-op-m10-fact-family", genG1OperationFactFamily(18)),
  "g1-op-m11-add-carry": () => retopic("g1-op-m11-add-carry", genG1OperationAddWithin(18, true)),
  "g1-op-m11-sub-bridge": () => retopic("g1-op-m11-sub-bridge", genG1OperationSubWithin(18, true)),
  "g1-op-m11-mixed-review": () => retopic("g1-op-m11-mixed-review", genG1OperationThreeNumber("mixed")),
  "g1-m12-add-no-carry": () => retopic("g1-m12-add-no-carry", genG1TwoDigitAddNoCarryWide()),
  "g1-m12-sub-no-borrow": () => retopic("g1-m12-sub-no-borrow", genG1TwoDigitSubNoBorrowWide()),
  "g1-m12-two-digit-read": () => retopic("g1-m12-two-digit-read", genG1TensOnesRead()),
  "g1-m12-two-digit-order": () => retopic("g1-m12-two-digit-order", genG1TwoDigitOrder()),
  "g1-m12-word-add-sub": () => retopic("g1-m12-word-add-sub", genG1WordAddSubTwoDigit()),
  "g1-m12-data-table": () => retopic("g1-m12-data-table", genG1DataTableRead()),
  "g1-m01-three-digit-read": () => retopic("g1-m01-three-digit-read", genG2ThreeDigitRead()),
  "g1-m01-three-digit-place": () => retopic("g1-m01-three-digit-place", genG2ThreeDigitPlaceValue()),
  "g1-m01-three-digit-compare": () => retopic("g1-m01-three-digit-compare", genG2NumberCompare()),
  "g1-m01-skip-count-100": () => retopic("g1-m01-skip-count-100", genG2SkipCount()),
  "g1-m01-shape-name": () => retopic("g1-m01-shape-name", genG1ShapeName()),
  "g1-m01-sub-borrow": () => retopic("g1-m01-sub-borrow", genG1TwoDigitSubBorrow()),
  "g1-m01-three-number-add-sub": () => retopic("g1-m01-three-number-add-sub", genG1ThreeNumberAddSub()),
  "g1-m02-length-read": () => retopic("g1-m02-length-read", genG2CmRead()),
  "g1-m02-length-add-sub": () => retopic("g1-m02-length-add-sub", genG2CmAddSub()),
  "g1-m02-classify-table": () => retopic("g1-m02-classify-table", genG1ClassifyTable()),
  "g1-m02-multiplication-intro": () => retopic("g1-m02-multiplication-intro", genG1MultiplicationIntro()),
  "g1-m03-count-objects": () => retopic("g1-m03-count-objects", genG1CountObjects()),
  "g1-m03-number-read": () => retopic("g1-m03-number-read", genG1NumberRead()),
  "g1-m03-number-order": () => retopic("g1-m03-number-order", genG1NumberOrder()),
  "g1-m03-compare-small": () => retopic("g1-m03-compare-small", genG1CompareSmall()),
  "g1-m03-shape-name": () => retopic("g1-m03-shape-name", genG1ShapeName()),
  "g1-m03-shape-sort": () => retopic("g1-m03-shape-sort", genG1ShapeSort()),
  "g1-m04-split-number": () => retopic("g1-m04-split-number", genG1SplitNumber()),
  "g1-m04-add-under-10": () => retopic("g1-m04-add-under-10", genG1AddUnder10()),
  "g1-m04-sub-under-10": () => retopic("g1-m04-sub-under-10", genG1SubUnder10()),
  "g1-m04-make-ten": () => retopic("g1-m04-make-ten", genG1MakeTen()),
  "g1-m04-zero-add-sub": () => retopic("g1-m04-zero-add-sub", genG1ZeroAddSub()),
  "g1-m04-word-add-sub": () => retopic("g1-m04-word-add-sub", genG1WordAddSubSmall()),
  "g1-m05-tens-ones-read": () => retopic("g1-m05-tens-ones-read", genG1TensOnesRead()),
  "g1-m05-count-by-tens": () => retopic("g1-m05-count-by-tens", genG1CountByTens()),
  "g1-m05-two-digit-compare": () => retopic("g1-m05-two-digit-compare", genG1TwoDigitCompare()),
  "g1-m05-number-line-missing": () => retopic("g1-m05-number-line-missing", genG1NumberLineMissing()),
  "g1-m05-add-under-10": () => retopic("g1-m05-add-under-10", genG1AddUnder10()),
  "g1-m05-sub-under-10": () => retopic("g1-m05-sub-under-10", genG1SubUnder10()),
  "g1-m06-add-under-20": () => retopic("g1-m06-add-under-20", genG1AddUnder20()),
  "g1-m06-sub-under-20": () => retopic("g1-m06-sub-under-20", genG1SubUnder20()),
  "g1-m06-make-ten": () => retopic("g1-m06-make-ten", genG1MakeTen()),
  "g1-m06-shape-name": () => retopic("g1-m06-shape-name", genG1ShapeName()),
  "g1-m06-shape-sort": () => retopic("g1-m06-shape-sort", genG1ShapeSort()),
  "g1-m06-word-add-sub": () => retopic("g1-m06-word-add-sub", genG1WordAddSubSmall()),
  "g1-m07-two-digit-read": () => retopic("g1-m07-two-digit-read", genG1TensOnesRead()),
  "g1-m07-two-digit-order": () => retopic("g1-m07-two-digit-order", genG1TwoDigitOrder()),
  "g1-m07-add-no-carry": () => retopic("g1-m07-add-no-carry", genG1AddNoCarry()),
  "g1-m07-sub-no-borrow": () => retopic("g1-m07-sub-no-borrow", genG1SubNoBorrow()),
  "g1-m07-clock-hour": () => retopic("g1-m07-clock-hour", genG1ClockHour()),
  "g1-m07-pattern-shape": () => retopic("g1-m07-pattern-shape", genG1PatternShape()),
  "g1-m08-clock-half": () => retopic("g1-m08-clock-half", genG1ClockHalf()),
  "g1-m08-data-table": () => retopic("g1-m08-data-table", genG1DataTableRead()),
  "g1-m08-pictograph": () => retopic("g1-m08-pictograph", genG1PictographRead()),
  "g1-m08-pattern-number": () => retopic("g1-m08-pattern-number", genG1PatternNumber()),
  "g1-m08-pattern-shape": () => retopic("g1-m08-pattern-shape", genG1PatternShape()),
  "g1-m08-review-add-sub": () => retopic("g1-m08-review-add-sub", genG1ReviewAddSub()),
  "g1-m09-count-by-tens": () => retopic("g1-m09-count-by-tens", genG1CountByTens()),
  "g1-m09-tens-ones-read": () => retopic("g1-m09-tens-ones-read", genG1TensOnesRead()),
  "g1-m09-two-digit-compare": () => retopic("g1-m09-two-digit-compare", genG1TwoDigitCompare()),
  "g1-m09-add-no-carry": () => retopic("g1-m09-add-no-carry", genG1AddNoCarry()),
  "g1-m09-sub-no-borrow": () => retopic("g1-m09-sub-no-borrow", genG1SubNoBorrow()),
  "g1-m09-length-compare": () => retopic("g1-m09-length-compare", genG1LengthCompare()),
  "g1-m10-add-no-carry": () => retopic("g1-m10-add-no-carry", genG1AddNoCarry()),
  "g1-m10-sub-no-borrow": () => retopic("g1-m10-sub-no-borrow", genG1SubNoBorrow()),
  "g1-m10-word-add-sub": () => retopic("g1-m10-word-add-sub", genG1WordAddSubSmall()),
  "g1-m10-shape-sort": () => retopic("g1-m10-shape-sort", genG1ShapeSort()),
  "g1-m10-pattern-shape": () => retopic("g1-m10-pattern-shape", genG1PatternShape()),
  "g1-m10-data-table": () => retopic("g1-m10-data-table", genG1DataTableRead()),
  "g1-m11-clock-hour": () => retopic("g1-m11-clock-hour", genG1ClockHour()),
  "g1-m11-clock-half": () => retopic("g1-m11-clock-half", genG1ClockHalf()),
  "g1-m11-week-order": () => retopic("g1-m11-week-order", genG1WeekOrder()),
  "g1-m11-data-table": () => retopic("g1-m11-data-table", genG1DataTableRead()),
  "g1-m11-pictograph": () => retopic("g1-m11-pictograph", genG1PictographRead()),
  "g1-m11-pattern-number": () => retopic("g1-m11-pattern-number", genG1PatternNumber()),
  "g1-m12-review-count": () => retopic("g1-m12-review-count", genG1CountObjects()),
  "g1-m12-review-compare": () => retopic("g1-m12-review-compare", genG1TwoDigitCompare()),
  "g1-m12-review-add-sub": () => retopic("g1-m12-review-add-sub", genG1ReviewAddSub()),
  "g1-m12-review-shape": () => retopic("g1-m12-review-shape", genG1ShapeName()),
  "g1-m12-review-clock": () => retopic("g1-m12-review-clock", Math.random() < 0.5 ? genG1ClockHour() : genG1ClockHalf()),
  "g1-m12-review-pattern": () => retopic("g1-m12-review-pattern", genG1PatternShape()),
  "g1-m01-two-digit-read": () => retopic("g1-m01-two-digit-read", genG1TensOnesRead()),
  "g1-m01-two-digit-order": () => retopic("g1-m01-two-digit-order", genG1TwoDigitOrder()),
  "g1-m01-add-no-carry": () => retopic("g1-m01-add-no-carry", genG1AddNoCarry()),
  "g1-m01-sub-no-borrow": () => retopic("g1-m01-sub-no-borrow", genG1SubNoBorrow()),
  "g1-m01-word-add-sub": () => retopic("g1-m01-word-add-sub", genG1WordAddSubTwoDigit()),
  "g1-m01-data-table": () => retopic("g1-m01-data-table", genG1DataTableRead()),
  "g1-m02-make-ten": () => retopic("g1-m02-make-ten", genG1MakeTen()),
  "g1-m02-add-under-20": () => retopic("g1-m02-add-under-20", genG1AddUnder20()),
  "g1-m02-sub-under-20": () => retopic("g1-m02-sub-under-20", genG1SubUnder20()),
  "g1-m02-clock-review": () => retopic("g1-m02-clock-review", Math.random() < 0.5 ? genG1ClockHour() : genG1ClockHalf()),
  "g1-m02-length-compare": () => retopic("g1-m02-length-compare", genG1LengthCompare()),
  "g1-m02-prep-place-value": () => retopic("g1-m02-prep-place-value", genG2ThreeDigitPlaceValue()),
  "g2-m03-shape-name": () => retopic("g2-m03-shape-name", genG2ShapeName()),
  "g2-m03-shape-sides": () => retopic("g2-m03-shape-sides", genG2ShapeSideCount()),
  "g2-m03-shape-sort": () => retopic("g2-m03-shape-sort", genG2ShapeSort()),
  "g2-m03-three-digit-read": () => retopic("g2-m03-three-digit-read", genG2ThreeDigitRead()),
  "g2-m03-place-value": () => retopic("g2-m03-place-value", genG2ThreeDigitPlaceValue()),
  "g2-m03-skip-count": () => retopic("g2-m03-skip-count", genG2SkipCount()),
  "g2-m04-two-digit-add": () => retopic("g2-m04-two-digit-add", genG2TwoDigitAdd()),
  "g2-m04-two-digit-sub": () => retopic("g2-m04-two-digit-sub", genG2TwoDigitSub()),
  "g2-m04-three-digit-add-sub": () => retopic("g2-m04-three-digit-add-sub", genG2ThreeDigitAddSub()),
  "g2-m04-add-sub-word": () => retopic("g2-m04-add-sub-word", genG2AddSubWord()),
  "g2-m04-number-compare": () => retopic("g2-m04-number-compare", genG2NumberCompare()),
  "g2-m04-skip-count": () => retopic("g2-m04-skip-count", genG2SkipCount()),
  "g2-m05-cm-read": () => retopic("g2-m05-cm-read", genG2CmRead()),
  "g2-m05-cm-add-sub": () => retopic("g2-m05-cm-add-sub", genG2CmAddSub()),
  "g2-m05-classify-table": () => retopic("g2-m05-classify-table", genG2ClassifyTable()),
  "g2-m05-classify-total": () => retopic("g2-m05-classify-total", genG2ClassifyTotal()),
  "g2-m05-shape-sort": () => retopic("g2-m05-shape-sort", genG2ShapeSort()),
  "g2-m05-add-sub-word": () => retopic("g2-m05-add-sub-word", genG2AddSubWord()),
  "g2-m06-three-digit-read": () => retopic("g2-m06-three-digit-read", genG2ThreeDigitRead()),
  "g2-m06-place-value": () => retopic("g2-m06-place-value", genG2ThreeDigitPlaceValue()),
  "g2-m06-number-compare": () => retopic("g2-m06-number-compare", genG2NumberCompare()),
  "g2-m06-repeated-addition": () => retopic("g2-m06-repeated-addition", genG2RepeatedAddition()),
  "g2-m06-multiplication-array": () => retopic("g2-m06-multiplication-array", genG2MultiplicationArray()),
  "g2-m06-skip-count": () => retopic("g2-m06-skip-count", genG2SkipCount()),
  "g2-m07-four-digit-read": () => retopic("g2-m07-four-digit-read", genG2FourDigitRead()),
  "g2-m07-four-digit-compare": () => retopic("g2-m07-four-digit-compare", genG2FourDigitCompare()),
  "g2-m07-four-digit-order": () => retopic("g2-m07-four-digit-order", genG2FourDigitOrder()),
  "g2-m07-multiplication-basic": () => retopic("g2-m07-multiplication-basic", genG2MultiplicationBasic()),
  "g2-m07-times-table-missing": () => retopic("g2-m07-times-table-missing", genG2TimesTableMissing()),
  "g2-m07-multiplication-array": () => retopic("g2-m07-multiplication-array", genG2MultiplicationArray()),
  "g2-m08-clock-read": () => retopic("g2-m08-clock-read", genG2ClockRead()),
  "g2-m08-minutes-before": () => retopic("g2-m08-minutes-before", genG2MinutesBefore()),
  "g2-m08-elapsed-time": () => retopic("g2-m08-elapsed-time", genG2ElapsedTime()),
  "g2-m08-table-read": () => retopic("g2-m08-table-read", genG2TableRead()),
  "g2-m08-pictograph-read": () => retopic("g2-m08-pictograph-read", genG2PictographRead()),
  "g2-m08-pattern-shape": () => retopic("g2-m08-pattern-shape", genG2PatternShape()),
  "g2-m09-four-digit-read": () => retopic("g2-m09-four-digit-read", genG2FourDigitRead()),
  "g2-m09-place-value": () => retopic("g2-m09-place-value", genG2FourDigitPlaceValue()),
  "g2-m09-four-digit-compare": () => retopic("g2-m09-four-digit-compare", genG2FourDigitCompare()),
  "g2-m09-four-digit-order": () => retopic("g2-m09-four-digit-order", genG2FourDigitOrder()),
  "g2-m09-skip-count": () => retopic("g2-m09-skip-count", genG2SkipCount()),
  "g2-m09-multiplication-basic": () => retopic("g2-m09-multiplication-basic", genG2MultiplicationBasic()),
  "g2-m10-multiplication-basic": () => retopic("g2-m10-multiplication-basic", genG2MultiplicationBasic()),
  "g2-m10-times-table-missing": () => retopic("g2-m10-times-table-missing", genG2TimesTableMissing()),
  "g2-m10-repeated-addition": () => retopic("g2-m10-repeated-addition", genG2RepeatedAddition()),
  "g2-m10-multiplication-array": () => retopic("g2-m10-multiplication-array", genG2MultiplicationArray()),
  "g2-m10-cm-add-sub": () => retopic("g2-m10-cm-add-sub", genG2CmAddSub()),
  "g2-m10-meter-cm": () => retopic("g2-m10-meter-cm", genG2MeterCmConvert()),
  "g2-m11-clock-read": () => retopic("g2-m11-clock-read", genG2ClockRead()),
  "g2-m11-minutes-before": () => retopic("g2-m11-minutes-before", genG2MinutesBefore()),
  "g2-m11-elapsed-time": () => retopic("g2-m11-elapsed-time", genG2ElapsedTime()),
  "g2-m11-calendar-week": () => retopic("g2-m11-calendar-week", genG2CalendarWeek()),
  "g2-m11-table-read": () => retopic("g2-m11-table-read", genG2TableRead()),
  "g2-m11-pictograph-read": () => retopic("g2-m11-pictograph-read", genG2PictographRead()),
  "g2-m12-pattern-shape": () => retopic("g2-m12-pattern-shape", genG2PatternShape()),
  "g2-m12-pattern-number": () => retopic("g2-m12-pattern-number", genG2PatternNumber()),
  "g2-m12-addition-table": () => retopic("g2-m12-addition-table", genG2AdditionTable()),
  "g2-m12-times-table-missing": () => retopic("g2-m12-times-table-missing", genG2TimesTableMissing()),
  "g2-m12-calendar-week": () => retopic("g2-m12-calendar-week", genG2CalendarWeek()),
  "g2-m12-review-add-sub": () => retopic("g2-m12-review-add-sub", genG2AddSubWord()),
  "g2-m01-line-type": () => retopic("g2-m01-line-type", genG2LineTypeChoice()),
  "g2-m01-right-angle": () => retopic("g2-m01-right-angle", genG2RightAngleChoice()),
  "g2-m01-shape-name": () => retopic("g2-m01-shape-name", genG2ShapeName()),
  "g2-m01-shape-sides": () => retopic("g2-m01-shape-sides", genG2ShapeSideCount()),
  "g2-m01-three-digit-review": () => retopic("g2-m01-three-digit-review", genG2ThreeDigitRead()),
  "g2-m01-add-sub-review": () => retopic("g2-m01-add-sub-review", genG2ThreeDigitAddSub()),
  "g2-m02-mm-convert": () => retopic("g2-m02-mm-convert", genG2MmConvert()),
  "g2-m02-meter-cm": () => retopic("g2-m02-meter-cm", genG2MeterCmConvert()),
  "g2-m02-cm-add-sub": () => retopic("g2-m02-cm-add-sub", genG2CmAddSub()),
  "g2-m02-second-convert": () => retopic("g2-m02-second-convert", genG2SecondConvert()),
  "g2-m02-time-add-sub": () => retopic("g2-m02-time-add-sub", genG2TimeAddSub()),
  "g2-m02-clock-review": () => retopic("g2-m02-clock-review", genG2ClockRead()),
  "g2-op-m03-place-value": () => retopic("g2-op-m03-place-value", genG2ThreeDigitPlaceValue()),
  "g2-op-m03-skip-count": () => retopic("g2-op-m03-skip-count", genG2SkipCount()),
  "g2-op-m03-two-digit-review": () => retopic("g2-op-m03-two-digit-review", genG2OpTwoDigitReview()),
  "g2-op-m04-add-carry": () => retopic("g2-op-m04-add-carry", genG2OpTwoDigitAddCarry()),
  "g2-op-m04-sub-borrow": () => retopic("g2-op-m04-sub-borrow", genG2OpTwoDigitSubBorrow()),
  "g2-op-m04-mixed-change": () => retopic("g2-op-m04-mixed-change", genG2OpMixedChange()),
  "g2-op-m05-length-add-sub": () => retopic("g2-op-m05-length-add-sub", genG2CmAddSub()),
  "g2-op-m05-two-digit-add": () => retopic("g2-op-m05-two-digit-add", genG2TwoDigitAdd()),
  "g2-op-m05-two-digit-sub": () => retopic("g2-op-m05-two-digit-sub", genG2TwoDigitSub()),
  "g2-op-m06-three-digit-compose": () => retopic("g2-op-m06-three-digit-compose", genG2ThreeDigitRead()),
  "g2-op-m06-add-no-carry": () => retopic("g2-op-m06-add-no-carry", genG2OpThreeDigitAddNoCarry()),
  "g2-op-m06-sub-no-borrow": () => retopic("g2-op-m06-sub-no-borrow", genG2OpThreeDigitSubNoBorrow()),
  "g2-op-m07-add-carry": () => retopic("g2-op-m07-add-carry", genG2OpThreeDigitAddCarry()),
  "g2-op-m07-sub-borrow": () => retopic("g2-op-m07-sub-borrow", genG2OpThreeDigitSubBorrow()),
  "g2-op-m07-mixed-word": () => retopic("g2-op-m07-mixed-word", genG2OpThreeDigitMixedWord()),
  "g2-op-m08-repeated-addition": () => retopic("g2-op-m08-repeated-addition", genG2RepeatedAddition()),
  "g2-op-m08-array": () => retopic("g2-op-m08-array", genG2MultiplicationArray()),
  "g2-op-m08-skip-count": () => retopic("g2-op-m08-skip-count", genG2SkipCount()),
  "g2-op-m09-times-basic": () => retopic("g2-op-m09-times-basic", genG2MultiplicationBasic()),
  "g2-op-m09-missing-factor": () => retopic("g2-op-m09-missing-factor", genG2OpMissingFactorVisual()),
  "g2-op-m09-multiplication-table": () => retopic("g2-op-m09-multiplication-table", genG2OpMultiplicationTable()),
  "g2-op-m10-times-review": () => retopic("g2-op-m10-times-review", genG2MultiplicationBasic()),
  "g2-op-m10-length-convert": () => retopic("g2-op-m10-length-convert", genG2MeterCmConvert()),
  "g2-op-m10-length-add-sub": () => retopic("g2-op-m10-length-add-sub", genG2CmAddSub()),
  "g2-op-m11-clock-add-sub": () => retopic("g2-op-m11-clock-add-sub", genG2TimeAddSub()),
  "g2-op-m11-calendar-count": () => retopic("g2-op-m11-calendar-count", genG2CalendarWeek()),
  "g2-op-m11-table-total": () => retopic("g2-op-m11-table-total", genG2OpTableTotal()),
  "g2-op-m12-addition-table": () => retopic("g2-op-m12-addition-table", genG2AdditionTable()),
  "g2-op-m12-times-table": () => retopic("g2-op-m12-times-table", genG2OpMissingFactorVisual()),
  "g2-op-m12-mixed-review": () => retopic("g2-op-m12-mixed-review", genG2OpMixedReview()),
  "g2-op-m01-three-digit-review": () => retopic("g2-op-m01-three-digit-review", Math.random() < 0.5 ? genG2OpThreeDigitAddCarry() : genG2OpThreeDigitSubBorrow()),
  "g2-op-m01-multiplication-review": () => retopic("g2-op-m01-multiplication-review", genG2MultiplicationBasic()),
  "g2-op-m01-division-prep": () => retopic("g2-op-m01-division-prep", genG2OpDivisionPrep()),
  "g2-op-m02-mm-cm": () => retopic("g2-op-m02-mm-cm", genG2MmConvert()),
  "g2-op-m02-seconds": () => retopic("g2-op-m02-seconds", genG2OpSecondConvertVisual()),
  "g2-op-m02-time-add-sub": () => retopic("g2-op-m02-time-add-sub", genG2TimeAddSub()),
  "g3-op-m03-add-methods": () => retopic("g3-op-m03-add-methods", genG3Add3DigitNoCarry()),
  "g3-op-m03-add-carry": () => retopic("g3-op-m03-add-carry", genG3Add3DigitCarry()),
  "g3-op-m03-sub-borrow": () => retopic("g3-op-m03-sub-borrow", genG3Sub3DigitBorrow()),
  "g3-op-m04-equal-share": () => retopic("g3-op-m04-equal-share", genG3DivisionBasic()),
  "g3-op-m04-division-table": () => retopic("g3-op-m04-division-table", genG3DivisionBasic()),
  "g3-op-m04-missing-division": () => retopic("g3-op-m04-missing-division", genG3DivisionRemainderBasic()),
  "g3-op-m04-plane-flip-turn": () => retopic("g3-op-m04-plane-flip-turn", genG3OpPlaneFlipTurn()),
  "g3-op-m04-shape-pattern": () => retopic("g3-op-m04-shape-pattern", genG3OpShapePattern()),
  "g3-op-m05-tens-times": () => retopic("g3-op-m05-tens-times", genG3TensTimesOneDigit()),
  "g3-op-m05-two-digit-times": () => retopic("g3-op-m05-two-digit-times", genG3TwoDigitTimesOneDigit()),
  "g3-op-m05-time-add-sub": () => retopic("g3-op-m05-time-add-sub", genG3TimeAddMinute()),
  "g3-op-m06-length-km-m": () => retopic("g3-op-m06-length-km-m", genG3KmMAddSub()),
  "g3-op-m06-fraction-compare": () => retopic("g3-op-m06-fraction-compare", genG3FractionCompareSameDenom()),
  "g3-op-m06-decimal-read": () => retopic("g3-op-m06-decimal-read", genG3DecimalTenthsRead()),
  "g3-op-m07-three-digit-times": () => retopic("g3-op-m07-three-digit-times", genG3ThreeDigitTimesOneDigit()),
  "g3-op-m07-two-digit-two-digit": () => retopic("g3-op-m07-two-digit-two-digit", genG3TwoDigitTimesTwoDigit()),
  "g3-op-m07-division-remainder": () => retopic("g3-op-m07-division-remainder", genG3DivisionRemainderBasic()),
  "g3-op-m07-circle-draw": () => retopic("g3-op-m07-circle-draw", genG3OpCircleDraw()),
  "g3-op-m08-fraction-add-sub": () => retopic("g3-op-m08-fraction-add-sub", genG3OpFractionAddSub()),
  "g3-op-m08-volume-add-sub": () => retopic("g3-op-m08-volume-add-sub", genG3OpVolumeAddSub()),
  "g3-op-m08-weight-add-sub": () => retopic("g3-op-m08-weight-add-sub", genG3OpWeightAddSub()),
  "g3-op-m08-calendar-pattern": () => retopic("g3-op-m08-calendar-pattern", genG3OpCalendarPattern()),
  "g3-op-m09-multiply-review": () => retopic("g3-op-m09-multiply-review", genG3OpMultiplyReview()),
  "g3-op-m09-division-review": () => retopic("g3-op-m09-division-review", genG3DivisionRemainderBasic()),
  "g3-op-m09-fraction-decimal": () => retopic("g3-op-m09-fraction-decimal", genG3OpFractionDecimalReview()),
  "g3-op-m10-circle-basic": () => retopic("g3-op-m10-circle-basic", genG3CircleRadiusDiameter()),
  "g3-op-m10-fraction-numberline": () => retopic("g3-op-m10-fraction-numberline", genG3FractionUnitRead()),
  "g3-op-m10-mixed-fraction": () => retopic("g3-op-m10-mixed-fraction", genG3MixedFractionConvert()),
  "g3-op-m11-volume": () => retopic("g3-op-m11-volume", genG3OpVolumeAddSub()),
  "g3-op-m11-weight": () => retopic("g3-op-m11-weight", genG3OpWeightAddSub()),
  "g3-op-m11-pattern": () => retopic("g3-op-m11-pattern", genG3OpCalendarPattern()),
  "g3-op-m12-big-number": () => retopic("g3-op-m12-big-number", genG3PrepBigNumber()),
  "g3-op-m12-big-multiply": () => retopic("g3-op-m12-big-multiply", genG3OpBigMultiply()),
  "g3-op-m12-big-division": () => retopic("g3-op-m12-big-division", genG3LongDivisionTwoDigit()),
  "g3-op-m01-long-division": () => retopic("g3-op-m01-long-division", genG3LongDivisionTwoDigit()),
  "g3-op-m01-angle": () => retopic("g3-op-m01-angle", genG3OpAngleReview()),
  "g3-op-m01-shape-angle": () => retopic("g3-op-m01-shape-angle", genG3OpShapeAngleTable()),
  "g3-op-m01-fraction-sub": () => retopic("g3-op-m01-fraction-sub", genG3NaturalMinusFraction()),
  "g3-op-m02-mixed-add-sub": () => retopic("g3-op-m02-mixed-add-sub", genG3MixedAddSub()),
  "g3-op-m02-mixed-mul-div": () => retopic("g3-op-m02-mixed-mul-div", genG3MixedMulDiv()),
  "g3-op-m02-bar-graph": () => retopic("g3-op-m02-bar-graph", genG3BarGraphDifference()),
  "g3-m03-add-no-carry": () => retopic("g3-m03-add-no-carry", genG3Add3DigitNoCarry()),
  "g3-m03-add-carry": () => retopic("g3-m03-add-carry", genG3Add3DigitCarry()),
  "g3-m03-sub-no-borrow": () => retopic("g3-m03-sub-no-borrow", genG3Sub3DigitNoBorrow()),
  "g3-m03-sub-borrow": () => retopic("g3-m03-sub-borrow", genG3Sub3DigitBorrow()),
  "g3-m03-add-sub-table": () => retopic("g3-m03-add-sub-table", genG3AddSubWordTable()),
  "g3-m03-shape-sides": () => retopic("g3-m03-shape-sides", genG3ShapeSideCount()),
  "g3-m04-division-basic": () => retopic("g3-m04-division-basic", genG3DivisionBasic()),
  "g3-m04-division-remainder": () => retopic("g3-m04-division-remainder", genG3DivisionRemainderBasic()),
  "g3-m04-times-missing": () => retopic("g3-m04-times-missing", genG3TimesTableMissing()),
  "g3-m04-mul-div-word": () => retopic("g3-m04-mul-div-word", genG3MulDivWord()),
  "g3-m04-shape-sides": () => retopic("g3-m04-shape-sides", genG3ShapeSideCount()),
  "g3-m04-table-reading": () => retopic("g3-m04-table-reading", genG3AddSubWordTable()),
  "g3-m05-tens-times": () => retopic("g3-m05-tens-times", genG3TensTimesOneDigit()),
  "g3-m05-two-digit-times": () => retopic("g3-m05-two-digit-times", genG3TwoDigitTimesOneDigit()),
  "g3-m05-times-missing": () => retopic("g3-m05-times-missing", genG3TimesTableMissing()),
  "g3-m05-multiply-basic": () => retopic("g3-m05-multiply-basic", genG3MulBasic()),
  "g3-m05-mul-word-chart": () => retopic("g3-m05-mul-word-chart", genG3MulDivWord()),
  "g3-m05-review-add-sub": () => retopic("g3-m05-review-add-sub", genG3AddSubWordTable()),
  "g3-m06-fraction-read": () => retopic("g3-m06-fraction-read", genG3FractionUnitRead()),
  "g3-m06-fraction-quantity": () => retopic("g3-m06-fraction-quantity", genG3FractionOfQuantity()),
  "g3-m06-fraction-compare": () => retopic("g3-m06-fraction-compare", genG3FractionCompareSameDenom()),
  "g3-m06-equal-share": () => retopic("g3-m06-equal-share", genG3DivisionBasic()),
  "g3-m06-unit-fraction-read": () => retopic("g3-m06-unit-fraction-read", genG3UnitFractionRead()),
  "g3-m06-unit-fraction-compare": () => retopic("g3-m06-unit-fraction-compare", genG3UnitFractionCompare()),
  "g3-m06-decimal-read": () => retopic("g3-m06-decimal-read", genG3DecimalTenthsRead()),
  "g3-m06-length-convert": () => retopic("g3-m06-length-convert", genG3LengthConvertCmMm()),
  "g3-m06-time-add": () => retopic("g3-m06-time-add", genG3TimeAddMinute()),
  "g3-m07-three-digit-times": () => retopic("g3-m07-three-digit-times", genG3ThreeDigitTimesOneDigit()),
  "g3-m07-two-digit-times": () => retopic("g3-m07-two-digit-times", genG3TwoDigitTimesOneDigit()),
  "g3-m07-one-digit-two-digit": () => retopic("g3-m07-one-digit-two-digit", genG3OneDigitTimesTwoDigit()),
  "g3-m07-two-digit-two-digit": () => retopic("g3-m07-two-digit-two-digit", genG3TwoDigitTimesTwoDigit()),
  "g3-m07-tens-times": () => retopic("g3-m07-tens-times", genG3TensTimesOneDigit()),
  "g3-m07-division-basic": () => retopic("g3-m07-division-basic", genG3DivisionBasic()),
  "g3-m07-division-remainder": () => retopic("g3-m07-division-remainder", genG3DivisionRemainderBasic()),
  "g3-m07-mul-div-word": () => retopic("g3-m07-mul-div-word", genG3MulDivWord()),
  "g3-m08-fraction-read": () => retopic("g3-m08-fraction-read", genG3FractionUnitRead()),
  "g3-m08-fraction-quantity": () => retopic("g3-m08-fraction-quantity", genG3FractionOfQuantity()),
  "g3-m08-fraction-compare": () => retopic("g3-m08-fraction-compare", genG3FractionCompareSameDenom()),
  "g3-m08-unit-fraction-compare": () => retopic("g3-m08-unit-fraction-compare", genG3UnitFractionCompare()),
  "g3-m08-proper-improper": () => retopic("g3-m08-proper-improper", genG3ProperImproperChoice()),
  "g3-m08-mixed-convert": () => retopic("g3-m08-mixed-convert", genG3MixedFractionConvert()),
  "g3-m08-fraction-add": () => retopic("g3-m08-fraction-add", genG3FractionAddSameDenom()),
  "g3-m08-fraction-sub": () => retopic("g3-m08-fraction-sub", genG3FractionSubSameDenom()),
  "g3-m08-decimal-add": () => retopic("g3-m08-decimal-add", genG3DecimalAddTenths()),
  "g3-m09-three-digit-times": () => retopic("g3-m09-three-digit-times", genG3ThreeDigitTimesOneDigit()),
  "g3-m09-tens-times": () => retopic("g3-m09-tens-times", genG3TensTimesOneDigit()),
  "g3-m09-two-digit-times": () => retopic("g3-m09-two-digit-times", genG3TwoDigitTimesOneDigit()),
  "g3-m09-one-digit-two-digit": () => retopic("g3-m09-one-digit-two-digit", genG3OneDigitTimesTwoDigit()),
  "g3-m09-two-digit-two-digit": () => retopic("g3-m09-two-digit-two-digit", genG3TwoDigitTimesTwoDigit()),
  "g3-m09-times-missing": () => retopic("g3-m09-times-missing", genG3TimesTableMissing()),
  "g3-m09-multiply-basic": () => retopic("g3-m09-multiply-basic", genG3MulBasic()),
  "g3-m09-fraction-add": () => retopic("g3-m09-fraction-add", genG3FractionAddSameDenom()),
  "g3-m09-decimal-compare": () => retopic("g3-m09-decimal-compare", genG3DecimalCompareTenths()),
  "g3-m10-circle-radius": () => retopic("g3-m10-circle-radius", genG3CircleRadiusDiameter()),
  "g3-m10-circle-property": () => retopic("g3-m10-circle-property", genG3CirclePropertyChoice()),
  "g3-m10-circle-diameter": () => retopic("g3-m10-circle-diameter", genG3CircleRadiusDiameter()),
  "g3-m10-circle-compass": () => retopic("g3-m10-circle-compass", genG3CircleCompass()),
  "g3-m10-circle-pattern": () => retopic("g3-m10-circle-pattern", genG3CirclePattern()),
  "g3-m10-shape-sides": () => retopic("g3-m10-shape-sides", genG3ShapeSideCount()),
  "g3-m10-fraction-read": () => retopic("g3-m10-fraction-read", genG3FractionUnitRead()),
  "g3-m10-plane-move": () => retopic("g3-m10-plane-move", genG3PlaneMoveGrid()),
  "g3-m11-volume-convert": () => retopic("g3-m11-volume-convert", genG3VolumeConvert()),
  "g3-m11-weight-convert": () => retopic("g3-m11-weight-convert", genG3WeightConvert()),
  "g3-m11-volume-table": () => retopic("g3-m11-volume-table", genG3VolumeConvert()),
  "g3-m11-weight-table": () => retopic("g3-m11-weight-table", genG3WeightConvert()),
  "g3-m11-volume-add": () => retopic("g3-m11-volume-add", genG3VolumeAdd()),
  "g3-m11-volume-sub": () => retopic("g3-m11-volume-sub", genG3VolumeSub()),
  "g3-m11-weight-add": () => retopic("g3-m11-weight-add", genG3WeightAdd()),
  "g3-m11-weight-sub": () => retopic("g3-m11-weight-sub", genG3WeightSub()),
  "g3-m11-line-chart": () => retopic("g3-m11-line-chart", genG3LineChartRead()),
  "g3-m11-add-sub-table": () => retopic("g3-m11-add-sub-table", genG3AddSubWordTable()),
  "g3-m12-picture-graph": () => retopic("g3-m12-picture-graph", genG3PictureGraphTotal()),
  "g3-m12-picture-graph-compare": () => retopic("g3-m12-picture-graph-compare", genG3PictureGraphCompare()),
  "g3-m12-picture-graph-build": () => retopic("g3-m12-picture-graph-build", genG3PictureGraphBuild()),
  "g3-m12-bar-graph-read": () => retopic("g3-m12-bar-graph-read", genG3BarGraphRead()),
  "g3-m12-bar-graph-difference": () => retopic("g3-m12-bar-graph-difference", genG3BarGraphDifference()),
  "g3-m12-bar-graph-scale": () => retopic("g3-m12-bar-graph-scale", genG3BarGraphScale()),
  "g3-m12-line-chart": () => retopic("g3-m12-line-chart", genG3LineChartRead()),
  "g3-m12-data-table": () => retopic("g3-m12-data-table", genG3PictureGraphTotal()),
  "g3-m12-graph-review": () => retopic("g3-m12-graph-review", genG3BarGraphRead()),
  "g3-m01-prep-big-number": () => retopic("g3-m01-prep-big-number", genG3PrepBigNumber()),
  "g3-m01-place-value": () => retopic("g3-m01-place-value", genG3PrepBigNumber()),
  "g3-m01-pattern-table": () => retopic("g3-m01-pattern-table", genG3PrepPatternTable()),
  "g3-m01-angle-estimate": () => retopic("g3-m01-angle-estimate", genG3AngleEstimate()),
  "g3-m01-angle-sum": () => retopic("g3-m01-angle-sum", genG3AngleSum()),
  "g3-m01-add-sub-review": () => retopic("g3-m01-add-sub-review", genG3Add3DigitCarry()),
  "g3-m01-mul-review": () => retopic("g3-m01-mul-review", genG3TwoDigitTimesOneDigit()),
  "g3-m01-graph-review": () => retopic("g3-m01-graph-review", genG3BarGraphRead()),
  "g3-m02-plane-move": () => retopic("g3-m02-plane-move", genG3PlaneMoveGrid()),
  "g3-m02-plane-flip": () => retopic("g3-m02-plane-flip", genG3PlaneFlipChoice()),
  "g3-m02-plane-turn": () => retopic("g3-m02-plane-turn", genG3PlaneTurnChoice()),
  "g3-m02-bar-graph-read": () => retopic("g3-m02-bar-graph-read", genG3BarGraphRead()),
  "g3-m02-bar-graph-difference": () => retopic("g3-m02-bar-graph-difference", genG3BarGraphDifference()),
  "g3-m02-bar-graph-scale": () => retopic("g3-m02-bar-graph-scale", genG3BarGraphScale()),
  "g3-m02-fraction-review": () => retopic("g3-m02-fraction-review", genG3FractionOfQuantity()),
  "g3-m02-decimal-review": () => retopic("g3-m02-decimal-review", genG3DecimalSubTenths()),
  "g3-m02-prep-pattern": () => retopic("g3-m02-prep-pattern", genG3PrepPatternTable()),
  addsub: genAddSub,
  "addsub-paren": genAddSubParen,
  muldiv: genMulDiv,
  "muldiv-paren": genMulDivParen,
  "four-mix-basic": genFourMixBasic,
  "four-mix-paren": genFourMixParen,
  "missing-operator-choice": genMissingOperatorChoice,
  "reverse-mixed": genReverseMixed,
  factors: genFactors,
  multiples: genMultiples,
  "factor-count": genFactorCount,
  "factor-multiple-choice": genFactorMultipleChoice,
  "common-factors": genCommonFactors,
  "common-multiples": genCommonMultiples,
  gcd: genGcd,
  lcm: genLcm,
  "gcd-word": genGcdWord,
  "lcm-word": genLcmWord,
  "rate-value": genRateValue,
  "offset-value": genOffsetValue,
  "table-missing": genTableMissing,
  "formula-choice": genFormulaChoice,
  "pattern-bridge": genPatternBridge,
  "rate-table-reverse": genRateTableReverse,
  "formula-missing-number": genFormulaMissingNumber,
  "relation-sentence-choice": genRelationSentenceChoice,
  "two-step-relation": genTwoStepRelation,
  "table-row-choice": genTableRowChoice,
  "equivalent-fraction": genEquivalentFraction,
  "equivalent-fraction-choice": genEquivalentFractionChoice,
  "missing-multiplier": genMissingMultiplier,
  "reduce-fraction": genReduceFraction,
  "reduce-by-given-divisor": genReduceByGivenDivisor,
  "all-reductions-choice": genAllReductionsChoice,
  "common-denominator-product": genCommonDenominatorProduct,
  "common-denominator-lcm": genCommonDenominatorLcm,
  "common-denominator-missing-numerator": genCommonDenominatorMissingNumerator,
  "compare-fractions": genCompareFractions,
  "compare-reduced-fractions": genCompareReducedFractions,
  "order-three-fractions": genOrderThreeFractions,
  "fraction-decimal-convert-choice": genFractionDecimalConvertChoice,
  "fraction-decimal-compare": genFractionDecimalCompare,
  "proper-fraction-add-under-one": genProperFractionAddUnderOne,
  "proper-fraction-add-over-one": genProperFractionAddOverOne,
  "mixed-fraction-add": genMixedFractionAdd,
  "proper-fraction-sub": genProperFractionSub,
  "mixed-fraction-sub-no-borrow": genMixedFractionSubNoBorrow,
  "mixed-fraction-sub-borrow": genMixedFractionSubBorrow,
  "missing-fraction-addend": genMissingFractionAddend,
  "missing-fraction-subtrahend": genMissingFractionSubtrahend,
  "fraction-card-sum": genCardMixedSum,
  "fraction-card-difference": genCardMixedDifference,
  "rectangle-perimeter": genRectanglePerimeter,
  "rectangle-area": genRectangleArea,
  "square-perimeter": genSquarePerimeter,
  "parallelogram-area": genParallelogramArea,
  "triangle-area": genTriangleArea,
  "trapezoid-area": genTrapezoidArea,
  "composite-area": genCompositeArea,
  "range-count-inclusive": genRangeCountInclusive,
  "range-count-exclusive": genRangeCountExclusive,
  "round-nearest-ten": genRoundNearestTen,
  "round-nearest-hundred": genRoundNearestHundred,
  "estimate-sum-round": genEstimateSumRound,
  "range-statement-choice": genRangeStatementChoice,
  "fraction-times-integer": genFractionTimesInteger,
  "integer-times-fraction": genIntegerTimesFraction,
  "fraction-times-fraction": genFractionTimesFraction,
  "mixed-times-integer": genMixedTimesInteger,
  "fraction-of-quantity": genFractionOfQuantity,
  "congruent-side": genCongruentSide,
  "congruent-angle": genCongruentAngle,
  "line-symmetry-count": genLineSymmetryCount,
  "point-symmetry-choice": genPointSymmetryChoice,
  "symmetry-coordinate": genSymmetryCoordinate,
  "decimal-times-integer": genDecimalTimesInteger,
  "integer-times-decimal": genIntegerTimesDecimal,
  "decimal-times-decimal": genDecimalTimesDecimal,
  "decimal-area": genDecimalArea,
  "decimal-missing-factor": genDecimalMissingFactor,
  "cuboid-edge-sum": genCuboidEdgeSum,
  "cuboid-counts-choice": genCuboidCountsChoice,
  "cuboid-face-area": genCuboidFaceArea,
  "stacked-cubes": genStackedCubes,
  "cuboid-parallel-faces": genCuboidParallelFaces,
  "average-basic": genAverageBasic,
  "average-missing-value": genAverageMissingValue,
  "average-total": genAverageTotal,
  "chance-statement-choice": genChanceStatementChoice,
  "chance-compare": genChanceCompare,
  "review-natural-mixed": genReviewNaturalMixed,
  "review-factor-multiple": genReviewFactorMultiple,
  "review-fraction-addsub": genReviewFractionAddSub,
  "review-area": genReviewArea,
  "review-decimal-fraction": genReviewDecimalFraction,
  "prep-fraction-divide-integer": genPrepFractionDivideInteger,
  "prep-decimal-divide-integer": genPrepDecimalDivideInteger,
  "prep-ratio-value": genPrepRatioValue,
  "prep-graph-read": genPrepGraphRead,
  "prep-volume-preview": genPrepVolumePreview,
  "g5-op-m03-four-mix-basic": aliasTopic("g5-op-m03-four-mix-basic", genFourMixBasic),
  "g5-op-m03-four-mix-paren": aliasTopic("g5-op-m03-four-mix-paren", genFourMixParen),
  "g5-op-m03-missing-operator": aliasTopic("g5-op-m03-missing-operator", genMissingOperatorChoice),
  "g5-op-m03-reverse-mixed": aliasTopic("g5-op-m03-reverse-mixed", genReverseMixed),
  "g5-op-m03-factors": aliasTopic("g5-op-m03-factors", genFactors),
  "g5-op-m03-multiples": aliasTopic("g5-op-m03-multiples", genMultiples),
  "g5-op-m03-factor-count": aliasTopic("g5-op-m03-factor-count", genFactorCount),
  "g5-op-m03-factor-multiple": aliasTopic("g5-op-m03-factor-multiple", genFactorMultipleChoice),
  "g5-op-m03-common-factors": aliasTopic("g5-op-m03-common-factors", genCommonFactors),
  "g5-op-m03-common-multiples": aliasTopic("g5-op-m03-common-multiples", genCommonMultiples),
  "g5-op-m03-gcd": aliasTopic("g5-op-m03-gcd", genGcd),
  "g5-op-m03-lcm": aliasTopic("g5-op-m03-lcm", genLcm),
  "g5-op-m04-rate-value": aliasTopic("g5-op-m04-rate-value", genRateValue),
  "g5-op-m04-offset-value": aliasTopic("g5-op-m04-offset-value", genOffsetValue),
  "g5-op-m04-table-missing": aliasTopic("g5-op-m04-table-missing", genTableMissing),
  "g5-op-m04-rate-table-reverse": aliasTopic("g5-op-m04-rate-table-reverse", genRateTableReverse),
  "g5-op-m04-formula-choice": aliasTopic("g5-op-m04-formula-choice", genFormulaChoice),
  "g5-op-m04-pattern-bridge": aliasTopic("g5-op-m04-pattern-bridge", genPatternBridge),
  "g5-op-m04-equivalent-fraction": aliasTopic("g5-op-m04-equivalent-fraction", genEquivalentFraction),
  "g5-op-m04-equivalent-choice": aliasTopic("g5-op-m04-equivalent-choice", genEquivalentFractionChoice),
  "g5-op-m04-missing-multiplier": aliasTopic("g5-op-m04-missing-multiplier", genMissingMultiplier),
  "g5-op-m04-reduce-fraction": aliasTopic("g5-op-m04-reduce-fraction", genReduceFraction),
  "g5-op-m04-common-denominator": aliasTopic("g5-op-m04-common-denominator", genCommonDenominatorLcm),
  "g5-op-m04-compare-fractions": aliasTopic("g5-op-m04-compare-fractions", genCompareFractions),
  "g5-op-m04-order-fractions": aliasTopic("g5-op-m04-order-fractions", genOrderThreeFractions),
  "g5-op-m05-fraction-add-under-one": aliasTopic("g5-op-m05-fraction-add-under-one", genProperFractionAddUnderOne),
  "g5-op-m05-fraction-add-over-one": aliasTopic("g5-op-m05-fraction-add-over-one", genProperFractionAddOverOne),
  "g5-op-m05-mixed-fraction-add": aliasTopic("g5-op-m05-mixed-fraction-add", genMixedFractionAdd),
  "g5-op-m05-proper-fraction-sub": aliasTopic("g5-op-m05-proper-fraction-sub", genProperFractionSub),
  "g5-op-m05-mixed-fraction-sub": aliasTopic("g5-op-m05-mixed-fraction-sub", genMixedFractionSubNoBorrow),
  "g5-op-m05-mixed-fraction-borrow": aliasTopic("g5-op-m05-mixed-fraction-borrow", genMixedFractionSubBorrow),
  "g5-op-m05-missing-addend": aliasTopic("g5-op-m05-missing-addend", genMissingFractionAddend),
  "g5-op-m05-missing-subtrahend": aliasTopic("g5-op-m05-missing-subtrahend", genMissingFractionSubtrahend),
  "g5-op-m06-rectangle-perimeter": aliasTopic("g5-op-m06-rectangle-perimeter", genRectanglePerimeter),
  "g5-op-m06-rectangle-area": aliasTopic("g5-op-m06-rectangle-area", genRectangleArea),
  "g5-op-m06-square-perimeter": aliasTopic("g5-op-m06-square-perimeter", genSquarePerimeter),
  "g5-op-m06-parallelogram-area": aliasTopic("g5-op-m06-parallelogram-area", genParallelogramArea),
  "g5-op-m06-triangle-area": aliasTopic("g5-op-m06-triangle-area", genTriangleArea),
  "g5-op-m06-trapezoid-area": aliasTopic("g5-op-m06-trapezoid-area", genTrapezoidArea),
  "g5-op-m06-composite-area": aliasTopic("g5-op-m06-composite-area", genCompositeArea),
  "g5-op-m07-range-inclusive": aliasTopic("g5-op-m07-range-inclusive", genRangeCountInclusive),
  "g5-op-m07-range-exclusive": aliasTopic("g5-op-m07-range-exclusive", genRangeCountExclusive),
  "g5-op-m07-round-ten": aliasTopic("g5-op-m07-round-ten", genRoundNearestTen),
  "g5-op-m07-round-hundred": aliasTopic("g5-op-m07-round-hundred", genRoundNearestHundred),
  "g5-op-m07-estimate-sum": aliasTopic("g5-op-m07-estimate-sum", genEstimateSumRound),
  "g5-op-m07-range-statement": aliasTopic("g5-op-m07-range-statement", genRangeStatementChoice),
  "g5-op-m08-fraction-times-integer": aliasTopic("g5-op-m08-fraction-times-integer", genFractionTimesInteger),
  "g5-op-m08-integer-times-fraction": aliasTopic("g5-op-m08-integer-times-fraction", genIntegerTimesFraction),
  "g5-op-m08-fraction-times-fraction": aliasTopic("g5-op-m08-fraction-times-fraction", genFractionTimesFraction),
  "g5-op-m08-mixed-times-integer": aliasTopic("g5-op-m08-mixed-times-integer", genMixedTimesInteger),
  "g5-op-m08-fraction-of-quantity": aliasTopic("g5-op-m08-fraction-of-quantity", genFractionOfQuantity),
  "g5-op-m09-congruent-side": aliasTopic("g5-op-m09-congruent-side", genCongruentSide),
  "g5-op-m09-congruent-angle": aliasTopic("g5-op-m09-congruent-angle", genCongruentAngle),
  "g5-op-m09-line-symmetry": aliasTopic("g5-op-m09-line-symmetry", genLineSymmetryCount),
  "g5-op-m09-point-symmetry": aliasTopic("g5-op-m09-point-symmetry", genPointSymmetryChoice),
  "g5-op-m09-symmetry-coordinate": aliasTopic("g5-op-m09-symmetry-coordinate", genSymmetryCoordinate),
  "g5-op-m10-decimal-times-integer": aliasTopic("g5-op-m10-decimal-times-integer", genDecimalTimesInteger),
  "g5-op-m10-integer-times-decimal": aliasTopic("g5-op-m10-integer-times-decimal", genIntegerTimesDecimal),
  "g5-op-m10-decimal-times-decimal": aliasTopic("g5-op-m10-decimal-times-decimal", genDecimalTimesDecimal),
  "g5-op-m10-decimal-area": aliasTopic("g5-op-m10-decimal-area", genDecimalArea),
  "g5-op-m10-decimal-missing-factor": aliasTopic("g5-op-m10-decimal-missing-factor", genDecimalMissingFactor),
  "g5-op-m11-cuboid-edge-sum": aliasTopic("g5-op-m11-cuboid-edge-sum", genCuboidEdgeSum),
  "g5-op-m11-cuboid-counts": aliasTopic("g5-op-m11-cuboid-counts", genCuboidCountsChoice),
  "g5-op-m11-cuboid-face-area": aliasTopic("g5-op-m11-cuboid-face-area", genCuboidFaceArea),
  "g5-op-m11-stacked-cubes": aliasTopic("g5-op-m11-stacked-cubes", genStackedCubes),
  "g5-op-m11-cuboid-parallel": aliasTopic("g5-op-m11-cuboid-parallel", genCuboidParallelFaces),
  "g5-op-m12-average-basic": aliasTopic("g5-op-m12-average-basic", genAverageBasic),
  "g5-op-m12-average-missing": aliasTopic("g5-op-m12-average-missing", genAverageMissingValue),
  "g5-op-m12-average-total": aliasTopic("g5-op-m12-average-total", genAverageTotal),
  "g5-op-m12-chance-statement": aliasTopic("g5-op-m12-chance-statement", genChanceStatementChoice),
  "g5-op-m12-chance-compare": aliasTopic("g5-op-m12-chance-compare", genChanceCompare),
  "g5-op-m01-review-natural": aliasTopic("g5-op-m01-review-natural", genReviewNaturalMixed),
  "g5-op-m01-review-factor": aliasTopic("g5-op-m01-review-factor", genReviewFactorMultiple),
  "g5-op-m01-review-fraction": aliasTopic("g5-op-m01-review-fraction", genReviewFractionAddSub),
  "g5-op-m01-review-area": aliasTopic("g5-op-m01-review-area", genReviewArea),
  "g5-op-m01-review-decimal": aliasTopic("g5-op-m01-review-decimal", genReviewDecimalFraction),
  "g5-op-m02-prep-fraction-divide": aliasTopic("g5-op-m02-prep-fraction-divide", genPrepFractionDivideInteger),
  "g5-op-m02-prep-decimal-divide": aliasTopic("g5-op-m02-prep-decimal-divide", genPrepDecimalDivideInteger),
  "g5-op-m02-prep-ratio-value": aliasTopic("g5-op-m02-prep-ratio-value", genPrepRatioValue),
  "g5-op-m02-prep-graph-read": aliasTopic("g5-op-m02-prep-graph-read", genPrepGraphRead),
  "g5-op-m02-prep-volume": aliasTopic("g5-op-m02-prep-volume", genPrepVolumePreview),
  "g4-op-m03-big-number-read": aliasTopic("g4-op-m03-big-number-read", genG4BigNumberRead),
  "g4-op-m03-place-value": aliasTopic("g4-op-m03-place-value", genG4PlaceValue),
  "g4-op-m03-million-unit": aliasTopic("g4-op-m03-million-unit", genG4MillionUnit),
  "g4-op-m03-number-compare": aliasTopic("g4-op-m03-number-compare", genG4NumberCompare),
  "g4-op-m03-skip-counting": aliasTopic("g4-op-m03-skip-counting", genG4SkipCounting),
  "g4-op-m03-mul-3x2": aliasTopic("g4-op-m03-mul-3x2", genG4Mul3x2),
  "g4-op-m03-div-3by2": aliasTopic("g4-op-m03-div-3by2", genG4Div3By2),
  "g4-op-m03-division-remainder": aliasTopic("g4-op-m03-division-remainder", genG4DivisionRemainder),
  "g4-op-m04-div-3by2": aliasTopic("g4-op-m04-div-3by2", genG4Div3By2),
  "g4-op-m04-division-word": aliasTopic("g4-op-m04-division-word", genG4DivWord),
  "g4-op-m04-angle-measure": aliasTopic("g4-op-m04-angle-measure", genG4AngleMeasure),
  "g4-op-m04-angle-sum": aliasTopic("g4-op-m04-angle-sum", genG4AngleSum),
  "g4-op-m04-angle-difference": aliasTopic("g4-op-m04-angle-difference", genG4AngleDifference),
  "g4-op-m04-triangle-angle": aliasTopic("g4-op-m04-triangle-angle", genG4TriangleAngleSum),
  "g4-op-m04-quadrilateral-angle": aliasTopic("g4-op-m04-quadrilateral-angle", genG4QuadrilateralAngleSum),
  "g4-op-m04-triangle-kind": aliasTopic("g4-op-m04-triangle-kind", genG4TriangleKind),
  "g4-op-m04-isosceles-angle": aliasTopic("g4-op-m04-isosceles-angle", genG4IsoscelesAngle),
  "g4-op-m04-equilateral-angle": aliasTopic("g4-op-m04-equilateral-angle", genG4EquilateralAngle),
  "g4-op-m05-like-denom-add": aliasTopic("g4-op-m05-like-denom-add", genG4LikeDenomAdd),
  "g4-op-m05-mixed-like-add": aliasTopic("g4-op-m05-mixed-like-add", genG4MixedLikeDenomAdd),
  "g4-op-m05-like-denom-sub": aliasTopic("g4-op-m05-like-denom-sub", genG4LikeDenomSub),
  "g4-op-m05-mixed-like-sub": aliasTopic("g4-op-m05-mixed-like-sub", genG4MixedLikeDenomSub),
  "g4-op-m05-fraction-word": aliasTopic("g4-op-m05-fraction-word", genG4ReviewFractionDecimal),
  "g4-op-m05-mixed-addsub": aliasTopic("g4-op-m05-mixed-addsub", genG4MixedAddSub),
  "g4-op-m05-mixed-muldiv": aliasTopic("g4-op-m05-mixed-muldiv", genG4MixedMulDiv),
  "g4-op-m06-mixed-order": aliasTopic("g4-op-m06-mixed-order", genG4PrepMixedOrder),
  "g4-op-m06-parentheses": aliasTopic("g4-op-m06-parentheses", genG4PrepParentheses),
  "g4-op-m06-pattern-table": aliasTopic("g4-op-m06-pattern-table", genG4PatternTable),
  "g4-op-m06-pattern-equation": aliasTopic("g4-op-m06-pattern-equation", genG4PatternEquation),
  "g4-op-m06-bar-graph-read": aliasTopic("g4-op-m06-bar-graph-read", genG4BarGraphRead),
  "g4-op-m06-bar-graph-scale": aliasTopic("g4-op-m06-bar-graph-scale", genG4BarGraphScale),
  "g4-op-m06-bar-graph-missing": aliasTopic("g4-op-m06-bar-graph-missing", genG4BarGraphMissing),
  "g4-op-m07-decimal-place": aliasTopic("g4-op-m07-decimal-place", genG4DecimalPlace),
  "g4-op-m07-decimal-relation": aliasTopic("g4-op-m07-decimal-relation", genG4DecimalRelation),
  "g4-op-m07-decimal-compare": aliasTopic("g4-op-m07-decimal-compare", genG4DecimalCompare),
  "g4-op-m07-decimal-add": aliasTopic("g4-op-m07-decimal-add", genG4DecimalAdd),
  "g4-op-m07-decimal-sub": aliasTopic("g4-op-m07-decimal-sub", genG4DecimalSub),
  "g4-op-m07-decimal-word": aliasTopic("g4-op-m07-decimal-word", genG4DecimalWord),
  "g4-op-m07-parallel-perpendicular": aliasTopic("g4-op-m07-parallel-perpendicular", genG4ParallelPerpendicular),
  "g4-op-m07-quadrilateral-kind": aliasTopic("g4-op-m07-quadrilateral-kind", genG4QuadrilateralKind),
  "g4-op-m08-rectangle-square": aliasTopic("g4-op-m08-rectangle-square", genG4RectangleSquareProperty),
  "g4-op-m08-polygon-name": aliasTopic("g4-op-m08-polygon-name", genG4PolygonName),
  "g4-op-m08-regular-polygon": aliasTopic("g4-op-m08-regular-polygon", genG4RegularPolygonBasic),
  "g4-op-m08-polygon-diagonal": aliasTopic("g4-op-m08-polygon-diagonal", genG4PolygonDiagonal),
  "g4-op-m08-range-count": aliasTopic("g4-op-m08-range-count", genRangeCountInclusive),
  "g4-op-m08-rounding": aliasTopic("g4-op-m08-rounding", genRoundNearestTen),
  "g4-op-m08-line-graph-read": aliasTopic("g4-op-m08-line-graph-read", genG4LineGraphRead),
  "g4-op-m08-line-graph-change": aliasTopic("g4-op-m08-line-graph-change", genG4LineGraphChange),
  "g4-op-m08-relation-basic": aliasTopic("g4-op-m08-relation-basic", genG4PrepRelationBasic),
  "g4-op-m09-decimal-place": aliasTopic("g4-op-m09-decimal-place", genG4DecimalPlace),
  "g4-op-m09-decimal-relation": aliasTopic("g4-op-m09-decimal-relation", genG4DecimalRelation),
  "g4-op-m09-decimal-compare": aliasTopic("g4-op-m09-decimal-compare", genG4DecimalCompare),
  "g4-op-m09-decimal-two-add": aliasTopic("g4-op-m09-decimal-two-add", genG4DecimalTwoAdd),
  "g4-op-m09-decimal-two-sub": aliasTopic("g4-op-m09-decimal-two-sub", genG4DecimalTwoSub),
  "g4-op-m09-parallel-perpendicular": aliasTopic("g4-op-m09-parallel-perpendicular", genG4ParallelPerpendicular),
  "g4-op-m09-parallel-distance": aliasTopic("g4-op-m09-parallel-distance", genG4ParallelDistance),
  "g4-op-m10-parallel-distance": aliasTopic("g4-op-m10-parallel-distance", genG4ParallelDistance),
  "g4-op-m10-trapezoid": aliasTopic("g4-op-m10-trapezoid", genG4TrapezoidProperty),
  "g4-op-m10-parallelogram": aliasTopic("g4-op-m10-parallelogram", genG4ParallelogramProperty),
  "g4-op-m10-rhombus": aliasTopic("g4-op-m10-rhombus", genG4RhombusProperty),
  "g4-op-m10-polygon-name": aliasTopic("g4-op-m10-polygon-name", genG4PolygonName),
  "g4-op-m10-range-statement": aliasTopic("g4-op-m10-range-statement", genRangeStatementChoice),
  "g4-op-m10-estimate-product": aliasTopic("g4-op-m10-estimate-product", genG4EstimateProduct),
  "g4-op-m11-range-count": aliasTopic("g4-op-m11-range-count", genRangeCountExclusive),
  "g4-op-m11-rounding": aliasTopic("g4-op-m11-rounding", genRoundNearestHundred),
  "g4-op-m11-line-graph-read": aliasTopic("g4-op-m11-line-graph-read", genG4LineGraphRead),
  "g4-op-m11-line-graph-change": aliasTopic("g4-op-m11-line-graph-change", genG4LineGraphChange),
  "g4-op-m11-line-graph-predict": aliasTopic("g4-op-m11-line-graph-predict", genG4LineGraphPredict),
  "g4-op-m11-relation-table": aliasTopic("g4-op-m11-relation-table", genTableMissing),
  "g4-op-m11-relation-equation": aliasTopic("g4-op-m11-relation-equation", genFormulaChoice),
  "g4-op-m12-factor-basic": aliasTopic("g4-op-m12-factor-basic", genG4PrepFactorBasic),
  "g4-op-m12-multiple-basic": aliasTopic("g4-op-m12-multiple-basic", genG4PrepMultipleBasic),
  "g4-op-m12-factor-multiple": aliasTopic("g4-op-m12-factor-multiple", genFactorMultipleChoice),
  "g4-op-m12-common-factor": aliasTopic("g4-op-m12-common-factor", genG4PrepCommonFactor),
  "g4-op-m12-common-multiple": aliasTopic("g4-op-m12-common-multiple", genG4PrepCommonMultiple),
  "g4-op-m12-cuboid-edge": aliasTopic("g4-op-m12-cuboid-edge", genCuboidEdgeSum),
  "g4-op-m12-cuboid-face": aliasTopic("g4-op-m12-cuboid-face", genCuboidFaceArea),
  "g4-op-m12-cuboid-parallel": aliasTopic("g4-op-m12-cuboid-parallel", genCuboidParallelFaces),
  "g4-op-m01-equivalent-fraction": aliasTopic("g4-op-m01-equivalent-fraction", genG4PrepEquivalentFraction),
  "g4-op-m01-reduce-fraction": aliasTopic("g4-op-m01-reduce-fraction", genG4PrepReduceFraction),
  "g4-op-m01-common-denominator": aliasTopic("g4-op-m01-common-denominator", genG4PrepCommonDenominator),
  "g4-op-m01-compare-fractions": aliasTopic("g4-op-m01-compare-fractions", genCompareFractions),
  "g4-op-m01-order-fractions": aliasTopic("g4-op-m01-order-fractions", genOrderThreeFractions),
  "g4-op-m01-fraction-add": aliasTopic("g4-op-m01-fraction-add", genMixedFractionAdd),
  "g4-op-m01-fraction-sub": aliasTopic("g4-op-m01-fraction-sub", genProperFractionSub),
  "g4-op-m01-mixed-fraction-sub": aliasTopic("g4-op-m01-mixed-fraction-sub", genMixedFractionSubBorrow),
  "g4-op-m02-rectangle-perimeter": aliasTopic("g4-op-m02-rectangle-perimeter", genRectanglePerimeter),
  "g4-op-m02-area-unit": aliasTopic("g4-op-m02-area-unit", genG4GridArea),
  "g4-op-m02-rectangle-area": aliasTopic("g4-op-m02-rectangle-area", genRectangleArea),
  "g4-op-m02-parallelogram-area": aliasTopic("g4-op-m02-parallelogram-area", genParallelogramArea),
  "g4-op-m02-triangle-area": aliasTopic("g4-op-m02-triangle-area", genTriangleArea),
  "g4-op-m02-trapezoid-area": aliasTopic("g4-op-m02-trapezoid-area", genTrapezoidArea),
  "g4-op-m02-fraction-times-integer": aliasTopic("g4-op-m02-fraction-times-integer", genFractionTimesInteger),
  "g4-op-m02-fraction-times-fraction": aliasTopic("g4-op-m02-fraction-times-fraction", genFractionTimesFraction),
  "g4-big-number-read": genG4BigNumberRead,
  "g4-place-value": genG4PlaceValue,
  "g4-number-compare": genG4NumberCompare,
  "g4-number-order": genG4NumberOrder,
  "g4-rounding-basic": genG4RoundingBasic,
  "g4-million-unit": genG4MillionUnit,
  "g4-skip-counting": genG4SkipCounting,
  "g4-mul-3x2": genG4Mul3x2,
  "g4-div-3by1": genG4Div3By1,
  "g4-div-3by2": genG4Div3By2,
  "g4-division-remainder": genG4DivisionRemainder,
  "g4-missing-factor": genG4MissingFactor,
  "g4-mul-word": genG4MulWord,
  "g4-div-word": genG4DivWord,
  "g4-angle-measure": genG4AngleMeasure,
  "g4-angle-compare-basic": genG4AngleCompareBasic,
  "g4-angle-estimate": genG4AngleEstimate,
  "g4-angle-sum": genG4AngleSum,
  "g4-angle-difference": genG4AngleDifference,
  "g4-triangle-angle-sum": genG4TriangleAngleSum,
  "g4-quadrilateral-angle-sum": genG4QuadrilateralAngleSum,
  "g4-triangle-kind": genG4TriangleKind,
  "g4-quadrilateral-kind": genG4QuadrilateralKind,
  "g4-right-angle-count": genG4RightAngleCount,
  "g4-shape-symmetry-basic": genG4ShapeSymmetryBasic,
  "g4-motion-slide": genG4MotionSlide,
  "g4-motion-flip": genG4MotionFlip,
  "g4-motion-turn": genG4MotionTurn,
  "g4-motion-combine": genG4MotionCombine,
  "g4-motion-pattern": genG4MotionPattern,
  "g4-fraction-basic": genG4FractionBasic,
  "g4-fraction-numberline": genG4FractionNumberline,
  "g4-improper-to-mixed": genG4ImproperToMixed,
  "g4-mixed-to-improper": genG4MixedToImproper,
  "g4-like-denom-compare": genG4LikeDenomCompare,
  "g4-like-denom-add": genG4LikeDenomAdd,
  "g4-like-denom-sub": genG4LikeDenomSub,
  "g4-mixed-like-denom-add": genG4MixedLikeDenomAdd,
  "g4-mixed-like-denom-sub": genG4MixedLikeDenomSub,
  "g4-isosceles-angle": genG4IsoscelesAngle,
  "g4-equilateral-angle": genG4EquilateralAngle,
  "g4-decimal-place": genG4DecimalPlace,
  "g4-decimal-relation": genG4DecimalRelation,
  "g4-decimal-compare": genG4DecimalCompare,
  "g4-decimal-order": genG4DecimalOrder,
  "g4-decimal-add": genG4DecimalAdd,
  "g4-decimal-sub": genG4DecimalSub,
  "g4-decimal-two-add": genG4DecimalTwoAdd,
  "g4-decimal-two-sub": genG4DecimalTwoSub,
  "g4-decimal-word": genG4DecimalWord,
  "g4-pattern-table": genG4PatternTable,
  "g4-pattern-number-array": genG4PatternNumberArray,
  "g4-pattern-shape-array": genG4PatternShapeArray,
  "g4-pattern-equation": genG4PatternEquation,
  "g4-time-add": genG4TimeAdd,
  "g4-time-sub": genG4TimeSub,
  "g4-length-convert": genG4LengthConvert,
  "g4-weight-convert": genG4WeightConvert,
  "g4-money-table": genG4MoneyTable,
  "g4-parallel-perpendicular": genG4ParallelPerpendicular,
  "g4-parallel-distance": genG4ParallelDistance,
  "g4-trapezoid-property": genG4TrapezoidProperty,
  "g4-parallelogram-property": genG4ParallelogramProperty,
  "g4-rhombus-property": genG4RhombusProperty,
  "g4-rectangle-square-property": genG4RectangleSquareProperty,
  "g4-polygon-name": genG4PolygonName,
  "g4-regular-polygon-basic": genG4RegularPolygonBasic,
  "g4-regular-polygon-perimeter": genG4RegularPolygonPerimeter,
  "g4-polygon-diagonal": genG4PolygonDiagonal,
  "g4-rectangle-perimeter": genG4RectanglePerimeter,
  "g4-square-area-basic": genG4SquareAreaBasic,
  "g4-grid-area": genG4GridArea,
  "g4-angle-in-shape": genG4AngleInShape,
  "g4-bar-graph-read": genG4BarGraphRead,
  "g4-bar-graph-scale": genG4BarGraphScale,
  "g4-bar-graph-missing": genG4BarGraphMissing,
  "g4-line-graph-read": genG4LineGraphRead,
  "g4-line-graph-change": genG4LineGraphChange,
  "g4-line-graph-predict": genG4LineGraphPredict,
  "g4-data-table-total": genG4DataTableTotal,
  "g4-data-table-difference": genG4DataTableDifference,
  "g4-graph-max-min": genG4GraphMaxMin,
  "g4-average-preview": genG4AveragePreview,
  "g4-estimate-sum": genG4EstimateSum,
  "g4-estimate-product": genG4EstimateProduct,
  "g4-mixed-addsub": genG4MixedAddSub,
  "g4-mixed-muldiv": genG4MixedMulDiv,
  "g4-word-two-step": genG4WordTwoStep,
  "g4-check-calculation": genG4CheckCalculation,
  "g4-review-fraction-decimal": genG4ReviewFractionDecimal,
  "g4-review-geometry": genG4ReviewGeometry,
  "g4-review-division": genG4ReviewDivision,
  "g4-review-graph": genG4ReviewGraph,
  "g4-review-measure": genG4ReviewMeasure,
  "g4-review-word": genG4ReviewWord,
  "g4-prep-factor-basic": genG4PrepFactorBasic,
  "g4-prep-multiple-basic": genG4PrepMultipleBasic,
  "g4-prep-common-factor": genG4PrepCommonFactor,
  "g4-prep-common-multiple": genG4PrepCommonMultiple,
  "g4-prep-gcd-basic": genG4PrepGcdBasic,
  "g4-prep-lcm-basic": genG4PrepLcmBasic,
  "g4-prep-relation-basic": genG4PrepRelationBasic,
  "g4-prep-mixed-order": genG4PrepMixedOrder,
  "g4-prep-parentheses": genG4PrepParentheses,
  "g4-prep-equivalent-fraction": genG4PrepEquivalentFraction,
  "g4-prep-reduce-fraction": genG4PrepReduceFraction,
  "g4-prep-common-denominator": genG4PrepCommonDenominator,
  "g4-prep-fraction-add": genG4PrepFractionAdd,
  "g4-area-triangle-prep": genG4AreaTrianglePrep,
  "g4-area-trapezoid-prep": genG4AreaTrapezoidPrep,
  "g6-quotient-fraction-proper": genG6QuotientFractionProper,
  "g6-quotient-fraction-mixed": genG6QuotientFractionMixed,
  "g6-fraction-divide-integer-simple": genG6FractionDivideIntegerSimple,
  "g6-fraction-divide-integer-multiply": genG6FractionDivideIntegerMultiply,
  "g6-mixed-divide-integer": genG6MixedDivideInteger,
  "g6-fraction-divide-integer-word": genG6FractionDivideIntegerWord,
  "g6-decimal-divide-natural-exact": genG6DecimalDivideNaturalExact,
  "g6-decimal-divide-natural-nonexact": genG6DecimalDivideNaturalNonExact,
  "g6-decimal-divide-less-than-one": genG6DecimalDivideLessThanOne,
  "g6-decimal-divide-remainder": genG6DecimalDivideRemainder,
  "g6-decimal-divide-word": genG6DecimalDivideWord,
  "g6-decimal-divide-check": genG6DecimalDivideCheck,
  "g6-ratio-write": genG6RatioWrite,
  "g6-ratio-rate-fraction": genG6RatioRateFraction,
  "g6-ratio-rate-decimal": genG6RatioRateDecimal,
  "g6-percent-basic": genG6PercentBasic,
  "g6-percent-of-quantity": genG6PercentOfQuantity,
  "g6-quantity-from-percent": genG6QuantityFromPercent,
  "g6-band-graph-read": genG6BandGraphRead,
  "g6-circle-graph-read": genG6CircleGraphRead,
  "g6-percent-to-angle": genG6PercentToAngle,
  "g6-graph-compare": genG6GraphCompare,
  "g6-graph-total-from-percent": genG6GraphTotalFromPercent,
  "g6-graph-table-percent": genG6GraphTablePercent,
  "g6-fraction-divide-same-denom-unit": genG6FractionDivideSameDenomUnit,
  "g6-fraction-divide-same-denom": genG6FractionDivideSameDenom,
  "g6-fraction-divide-different-denom": genG6FractionDivideDifferentDenom,
  "g6-natural-divide-fraction": genG6NaturalDivideFraction,
  "g6-mixed-divide-fraction": genG6MixedDivideFraction,
  "g6-fraction-divide-word": genG6FractionDivideWord,
  "g6-ratio-equivalent": genG6RatioEquivalent,
  "g6-simplify-ratio": genG6SimplifyRatio,
  "g6-proportion-check": genG6ProportionCheck,
  "g6-proportion-missing": genG6ProportionMissing,
  "g6-proportional-distribution": genG6ProportionalDistribution,
  "g6-scale-recipe": genG6ScaleRecipe,
  "g6-view-direction-choice": genG6ViewDirectionChoice,
  "g6-cube-count-simple": genG6CubeCountSimple,
  "g6-cube-top-number-sum": genG6CubeTopNumberSum,
  "g6-view-count-from-top": genG6ViewCountFromTop,
  "g6-min-cubes": genG6MinCubes,
  "g6-spatial-word": genG6SpatialWord,
  "g6-circumference-from-diameter": genG6CircumferenceFromDiameter,
  "g6-circumference-from-radius": genG6CircumferenceFromRadius,
  "g6-pi-from-circumference-diameter": genG6PiFromCircumferenceDiameter,
  "g6-circle-area-from-radius": genG6CircleAreaFromRadius,
  "g6-circle-area-from-diameter": genG6CircleAreaFromDiameter,
  "g6-circle-composite": genG6CircleComposite,
  "g6-prime-composite-choice": genG6PrimeCompositeChoice,
  "g6-prime-factorization": genG6PrimeFactorization,
  "g6-prime-factors-list": genG6PrimeFactorsList,
  "g6-divisor-count-from-factorization": genG6DivisorCountFromFactorization,
  "g6-gcd-lcm-prime-factor": genG6GcdLcmPrimeFactor,
  "g6-factorization-word": genG6FactorizationWord,
  "g6-integer-multiplication": genG6IntegerMultiplication,
  "g6-integer-division": genG6IntegerDivision,
  "g6-integer-mul-law": genG6IntegerMulLaw,
  "g6-multi-integer-product": genG6MultiIntegerProduct,
  "g6-rational-number-compare": genG6RationalNumberCompare,
  "g6-rational-number-mixed": genG6RationalNumberMixed,
  "g6-linear-equation-basic": genG6LinearEquationBasic,
  "g6-linear-equation-paren": genG6LinearEquationParen,
  "g6-linear-equation-decimal": genG6LinearEquationDecimal,
  "g6-linear-equation-fraction": genG6LinearEquationFraction,
  "g6-equation-word": genG6EquationWord,
  "g6-equation-check-choice": genG6EquationCheckChoice,
  "g6-prism-face-count": genG6PrismFaceCount,
  "g6-prism-edge-count": genG6PrismEdgeCount,
  "g6-pyramid-face-count": genG6PyramidFaceCount,
  "g6-pyramid-edge-count": genG6PyramidEdgeCount,
  "g6-solid-name-choice": genG6SolidNameChoice,
  "g6-prism-pyramid-net": genG6PrismPyramidNet,
  "g6-decimal-divide-decimal": genG6DecimalDivideDecimal,
  "g6-cylinder-height": genG6CylinderHeight,
  "g6-cylinder-net-circumference": genG6CylinderNetCircumference,
  "g6-cylinder-surface-area": genG6CylinderSurfaceArea,
  "g6-cylinder-volume": genG6CylinderVolume,
  "g6-cone-sphere-choice": genG6ConeSphereChoice,
  "g6-cuboid-surface-area": genG6CuboidSurfaceArea,
  "g6-cuboid-volume": genG6CuboidVolume,
  "g6-cuboid-volume-unit": genG6CuboidVolumeUnit,
  "g6-cuboid-missing-edge-volume": genG6CuboidMissingEdgeFromVolume,
  "g6-direct-proportion-table": genG6DirectProportionTable,
  "g6-direct-proportion-graph": genG6DirectProportionGraph,
  "g6-inverse-proportion-table": genG6InverseProportionTable,
  "g6-inverse-proportion-word": genG6InverseProportionWord,
  "g6-signed-number-scene": genG6SignedNumberScene,
  "g6-integer-number-line": genG6IntegerNumberLine,
  "g6-integer-addition": genG6IntegerAddition,
  "g6-integer-subtraction": genG6IntegerSubtraction,
  "g6-expression-value": genG6ExpressionValue,
  "g6-simplify-like-terms": genG6SimplifyLikeTerms,
  "g6-equation-property-choice": genG6EquationPropertyChoice,
  "g6-function-value": genG6FunctionValue,
  "g6-coordinate-quadrant": genG6CoordinateQuadrant,
  "g6-function-graph-table": genG6FunctionGraphTable,
  "g6-op-m03-prism-face-count": aliasTopic("g6-op-m03-prism-face-count", genG6PrismFaceCount),
  "g6-op-m03-prism-edge-count": aliasTopic("g6-op-m03-prism-edge-count", genG6PrismEdgeCount),
  "g6-op-m03-pyramid-face-count": aliasTopic("g6-op-m03-pyramid-face-count", genG6PyramidFaceCount),
  "g6-op-m03-pyramid-edge-count": aliasTopic("g6-op-m03-pyramid-edge-count", genG6PyramidEdgeCount),
  "g6-op-m03-prism-pyramid-net": aliasTopic("g6-op-m03-prism-pyramid-net", genG6PrismPyramidNet),
  "g6-op-m03-fraction-divide-same-denom-unit": aliasTopic("g6-op-m03-fraction-divide-same-denom-unit", genG6FractionDivideSameDenomUnit),
  "g6-op-m03-quotient-fraction-proper": aliasTopic("g6-op-m03-quotient-fraction-proper", genG6QuotientFractionProper),
  "g6-op-m03-quotient-fraction-mixed": aliasTopic("g6-op-m03-quotient-fraction-mixed", genG6QuotientFractionMixed),
  "g6-op-m03-fraction-divide-integer-simple": aliasTopic("g6-op-m03-fraction-divide-integer-simple", genG6FractionDivideIntegerSimple),
  "g6-op-m03-fraction-divide-integer-multiply": aliasTopic("g6-op-m03-fraction-divide-integer-multiply", genG6FractionDivideIntegerMultiply),
  "g6-op-m03-mixed-divide-integer": aliasTopic("g6-op-m03-mixed-divide-integer", genG6MixedDivideInteger),
  "g6-op-m03-fraction-divide-integer-word": aliasTopic("g6-op-m03-fraction-divide-integer-word", genG6FractionDivideIntegerWord),
  "g6-op-m04-fraction-divide-different-denom": aliasTopic("g6-op-m04-fraction-divide-different-denom", genG6FractionDivideDifferentDenom),
  "g6-op-m04-natural-divide-fraction": aliasTopic("g6-op-m04-natural-divide-fraction", genG6NaturalDivideFraction),
  "g6-op-m04-mixed-divide-fraction": aliasTopic("g6-op-m04-mixed-divide-fraction", genG6MixedDivideFraction),
  "g6-op-m04-decimal-divide-decimal": aliasTopic("g6-op-m04-decimal-divide-decimal", genG6DecimalDivideDecimal),
  "g6-op-m04-decimal-divide-natural-exact": aliasTopic("g6-op-m04-decimal-divide-natural-exact", genG6DecimalDivideNaturalExact),
  "g6-op-m04-decimal-divide-natural-nonexact": aliasTopic("g6-op-m04-decimal-divide-natural-nonexact", genG6DecimalDivideNaturalNonExact),
  "g6-op-m04-decimal-divide-less-than-one": aliasTopic("g6-op-m04-decimal-divide-less-than-one", genG6DecimalDivideLessThanOne),
  "g6-op-m04-decimal-divide-remainder": aliasTopic("g6-op-m04-decimal-divide-remainder", genG6DecimalDivideRemainder),
  "g6-op-m04-decimal-divide-word": aliasTopic("g6-op-m04-decimal-divide-word", genG6DecimalDivideWord),
  "g6-op-m04-decimal-divide-check": aliasTopic("g6-op-m04-decimal-divide-check", genG6DecimalDivideCheck),
  "g6-op-m05-ratio-write": aliasTopic("g6-op-m05-ratio-write", genG6RatioWrite),
  "g6-op-m05-ratio-rate-fraction": aliasTopic("g6-op-m05-ratio-rate-fraction", genG6RatioRateFraction),
  "g6-op-m05-ratio-rate-decimal": aliasTopic("g6-op-m05-ratio-rate-decimal", genG6RatioRateDecimal),
  "g6-op-m05-percent-basic": aliasTopic("g6-op-m05-percent-basic", genG6PercentBasic),
  "g6-op-m05-percent-of-quantity": aliasTopic("g6-op-m05-percent-of-quantity", genG6PercentOfQuantity),
  "g6-op-m05-quantity-from-percent": aliasTopic("g6-op-m05-quantity-from-percent", genG6QuantityFromPercent),
  "g6-op-m05-circumference-from-diameter": aliasTopic("g6-op-m05-circumference-from-diameter", genG6CircumferenceFromDiameter),
  "g6-op-m05-pi-from-circumference-diameter": aliasTopic("g6-op-m05-pi-from-circumference-diameter", genG6PiFromCircumferenceDiameter),
  "g6-op-m06-circle-area-from-radius": aliasTopic("g6-op-m06-circle-area-from-radius", genG6CircleAreaFromRadius),
  "g6-op-m06-circle-area-from-diameter": aliasTopic("g6-op-m06-circle-area-from-diameter", genG6CircleAreaFromDiameter),
  "g6-op-m06-circle-composite": aliasTopic("g6-op-m06-circle-composite", genG6CircleComposite),
  "g6-op-m06-cuboid-surface-area": aliasTopic("g6-op-m06-cuboid-surface-area", genG6CuboidSurfaceArea),
  "g6-op-m06-cuboid-volume": aliasTopic("g6-op-m06-cuboid-volume", genG6CuboidVolume),
  "g6-op-m06-cuboid-volume-unit": aliasTopic("g6-op-m06-cuboid-volume-unit", genG6CuboidVolumeUnit),
  "g6-op-m06-band-graph-read": aliasTopic("g6-op-m06-band-graph-read", genG6BandGraphRead),
  "g6-op-m06-circle-graph-read": aliasTopic("g6-op-m06-circle-graph-read", genG6CircleGraphRead),
  "g6-op-m06-percent-to-angle": aliasTopic("g6-op-m06-percent-to-angle", genG6PercentToAngle),
  "g6-op-m06-graph-compare": aliasTopic("g6-op-m06-graph-compare", genG6GraphCompare),
  "g6-op-m06-graph-total-from-percent": aliasTopic("g6-op-m06-graph-total-from-percent", genG6GraphTotalFromPercent),
  "g6-op-m06-graph-table-percent": aliasTopic("g6-op-m06-graph-table-percent", genG6GraphTablePercent),
  "g6-op-m07-fraction-divide-same-denom-unit": aliasTopic("g6-op-m07-fraction-divide-same-denom-unit", genG6FractionDivideSameDenomUnit),
  "g6-op-m07-fraction-divide-same-denom": aliasTopic("g6-op-m07-fraction-divide-same-denom", genG6FractionDivideSameDenom),
  "g6-op-m07-fraction-divide-different-denom": aliasTopic("g6-op-m07-fraction-divide-different-denom", genG6FractionDivideDifferentDenom),
  "g6-op-m07-natural-divide-fraction": aliasTopic("g6-op-m07-natural-divide-fraction", genG6NaturalDivideFraction),
  "g6-op-m07-mixed-divide-fraction": aliasTopic("g6-op-m07-mixed-divide-fraction", genG6MixedDivideFraction),
  "g6-op-m07-fraction-divide-word": aliasTopic("g6-op-m07-fraction-divide-word", genG6FractionDivideWord),
  "g6-op-m08-ratio-equivalent": aliasTopic("g6-op-m08-ratio-equivalent", genG6RatioEquivalent),
  "g6-op-m08-simplify-ratio": aliasTopic("g6-op-m08-simplify-ratio", genG6SimplifyRatio),
  "g6-op-m08-band-graph-read": aliasTopic("g6-op-m08-band-graph-read", genG6BandGraphRead),
  "g6-op-m08-circle-graph-read": aliasTopic("g6-op-m08-circle-graph-read", genG6CircleGraphRead),
  "g6-op-m08-graph-table-percent": aliasTopic("g6-op-m08-graph-table-percent", genG6GraphTablePercent),
  "g6-op-m08-direct-proportion-table": aliasTopic("g6-op-m08-direct-proportion-table", genG6DirectProportionTable),
  "g6-op-m08-direct-proportion-graph": aliasTopic("g6-op-m08-direct-proportion-graph", genG6DirectProportionGraph),
  "g6-op-m08-inverse-proportion-table": aliasTopic("g6-op-m08-inverse-proportion-table", genG6InverseProportionTable),
  "g6-op-m08-inverse-proportion-word": aliasTopic("g6-op-m08-inverse-proportion-word", genG6InverseProportionWord),
  "g6-op-m08-proportion-check": aliasTopic("g6-op-m08-proportion-check", genG6ProportionCheck),
  "g6-op-m08-proportion-missing": aliasTopic("g6-op-m08-proportion-missing", genG6ProportionMissing),
  "g6-op-m08-proportional-distribution": aliasTopic("g6-op-m08-proportional-distribution", genG6ProportionalDistribution),
  "g6-op-m08-scale-recipe": aliasTopic("g6-op-m08-scale-recipe", genG6ScaleRecipe),
  "g6-op-m09-fraction-divide-same-denom-unit": aliasTopic("g6-op-m09-fraction-divide-same-denom-unit", genG6FractionDivideSameDenomUnit),
  "g6-op-m09-fraction-divide-same-denom": aliasTopic("g6-op-m09-fraction-divide-same-denom", genG6FractionDivideSameDenom),
  "g6-op-m09-fraction-divide-different-denom": aliasTopic("g6-op-m09-fraction-divide-different-denom", genG6FractionDivideDifferentDenom),
  "g6-op-m09-natural-divide-fraction": aliasTopic("g6-op-m09-natural-divide-fraction", genG6NaturalDivideFraction),
  "g6-op-m09-mixed-divide-fraction": aliasTopic("g6-op-m09-mixed-divide-fraction", genG6MixedDivideFraction),
  "g6-op-m09-fraction-divide-word": aliasTopic("g6-op-m09-fraction-divide-word", genG6FractionDivideWord),
  "g6-op-m09-cube-count-simple": aliasTopic("g6-op-m09-cube-count-simple", genG6CubeCountSimple),
  "g6-op-m09-cube-top-number-sum": aliasTopic("g6-op-m09-cube-top-number-sum", genG6CubeTopNumberSum),
  "g6-op-m09-view-count-from-top": aliasTopic("g6-op-m09-view-count-from-top", genG6ViewCountFromTop),
  "g6-op-m09-ratio-equivalent": aliasTopic("g6-op-m09-ratio-equivalent", genG6RatioEquivalent),
  "g6-op-m09-simplify-ratio": aliasTopic("g6-op-m09-simplify-ratio", genG6SimplifyRatio),
  "g6-op-m09-proportional-distribution": aliasTopic("g6-op-m09-proportional-distribution", genG6ProportionalDistribution),
  "g6-op-m10-cylinder-height": aliasTopic("g6-op-m10-cylinder-height", genG6CylinderHeight),
  "g6-op-m10-cylinder-net-circumference": aliasTopic("g6-op-m10-cylinder-net-circumference", genG6CylinderNetCircumference),
  "g6-op-m10-cylinder-surface-area": aliasTopic("g6-op-m10-cylinder-surface-area", genG6CylinderSurfaceArea),
  "g6-op-m10-cylinder-volume": aliasTopic("g6-op-m10-cylinder-volume", genG6CylinderVolume),
  "g6-op-m10-cone-sphere-choice": aliasTopic("g6-op-m10-cone-sphere-choice", genG6ConeSphereChoice),
  "g6-op-m10-circle-graph-read": aliasTopic("g6-op-m10-circle-graph-read", genG6CircleGraphRead),
  "g6-op-m10-view-direction-choice": aliasTopic("g6-op-m10-view-direction-choice", genG6ViewDirectionChoice),
  "g6-op-m10-cube-count-simple": aliasTopic("g6-op-m10-cube-count-simple", genG6CubeCountSimple),
  "g6-op-m10-cube-top-number-sum": aliasTopic("g6-op-m10-cube-top-number-sum", genG6CubeTopNumberSum),
  "g6-op-m10-view-count-from-top": aliasTopic("g6-op-m10-view-count-from-top", genG6ViewCountFromTop),
  "g6-op-m10-min-cubes": aliasTopic("g6-op-m10-min-cubes", genG6MinCubes),
  "g6-op-m10-spatial-word": aliasTopic("g6-op-m10-spatial-word", genG6SpatialWord),
  "g6-op-m11-circumference-from-diameter": aliasTopic("g6-op-m11-circumference-from-diameter", genG6CircumferenceFromDiameter),
  "g6-op-m11-circumference-from-radius": aliasTopic("g6-op-m11-circumference-from-radius", genG6CircumferenceFromRadius),
  "g6-op-m11-pi-from-circumference-diameter": aliasTopic("g6-op-m11-pi-from-circumference-diameter", genG6PiFromCircumferenceDiameter),
  "g6-op-m11-circle-area-from-radius": aliasTopic("g6-op-m11-circle-area-from-radius", genG6CircleAreaFromRadius),
  "g6-op-m11-circle-area-from-diameter": aliasTopic("g6-op-m11-circle-area-from-diameter", genG6CircleAreaFromDiameter),
  "g6-op-m11-circle-composite": aliasTopic("g6-op-m11-circle-composite", genG6CircleComposite),
  "g6-op-m12-prime-composite-choice": aliasTopic("g6-op-m12-prime-composite-choice", genG6PrimeCompositeChoice),
  "g6-op-m12-prime-factorization": aliasTopic("g6-op-m12-prime-factorization", genG6PrimeFactorization),
  "g6-op-m12-prime-factors-list": aliasTopic("g6-op-m12-prime-factors-list", genG6PrimeFactorsList),
  "g6-op-m12-divisor-count-from-factorization": aliasTopic("g6-op-m12-divisor-count-from-factorization", genG6DivisorCountFromFactorization),
  "g6-op-m12-gcd-lcm-prime-factor": aliasTopic("g6-op-m12-gcd-lcm-prime-factor", genG6GcdLcmPrimeFactor),
  "g6-op-m12-factorization-word": aliasTopic("g6-op-m12-factorization-word", genG6FactorizationWord),
  "g6-op-m12-signed-number-scene": aliasTopic("g6-op-m12-signed-number-scene", genG6SignedNumberScene),
  "g6-op-m12-integer-number-line": aliasTopic("g6-op-m12-integer-number-line", genG6IntegerNumberLine),
  "g6-op-m12-integer-addition": aliasTopic("g6-op-m12-integer-addition", genG6IntegerAddition),
  "g6-op-m12-integer-subtraction": aliasTopic("g6-op-m12-integer-subtraction", genG6IntegerSubtraction),
  "g6-op-m01-integer-multiplication": aliasTopic("g6-op-m01-integer-multiplication", genG6IntegerMultiplication),
  "g6-op-m01-integer-division": aliasTopic("g6-op-m01-integer-division", genG6IntegerDivision),
  "g6-op-m01-integer-mul-law": aliasTopic("g6-op-m01-integer-mul-law", genG6IntegerMulLaw),
  "g6-op-m01-multi-integer-product": aliasTopic("g6-op-m01-multi-integer-product", genG6MultiIntegerProduct),
  "g6-op-m01-rational-number-compare": aliasTopic("g6-op-m01-rational-number-compare", genG6RationalNumberCompare),
  "g6-op-m01-rational-number-mixed": aliasTopic("g6-op-m01-rational-number-mixed", genG6RationalNumberMixed),
  "g6-op-m01-expression-value": aliasTopic("g6-op-m01-expression-value", genG6ExpressionValue),
  "g6-op-m01-simplify-like-terms": aliasTopic("g6-op-m01-simplify-like-terms", genG6SimplifyLikeTerms),
  "g6-op-m01-equation-property-choice": aliasTopic("g6-op-m01-equation-property-choice", genG6EquationPropertyChoice),
  "g6-op-m02-linear-equation-basic": aliasTopic("g6-op-m02-linear-equation-basic", genG6LinearEquationBasic),
  "g6-op-m02-linear-equation-paren": aliasTopic("g6-op-m02-linear-equation-paren", genG6LinearEquationParen),
  "g6-op-m02-linear-equation-decimal": aliasTopic("g6-op-m02-linear-equation-decimal", genG6LinearEquationDecimal),
  "g6-op-m02-linear-equation-fraction": aliasTopic("g6-op-m02-linear-equation-fraction", genG6LinearEquationFraction),
  "g6-op-m02-equation-word": aliasTopic("g6-op-m02-equation-word", genG6EquationWord),
  "g6-op-m02-equation-check-choice": aliasTopic("g6-op-m02-equation-check-choice", genG6EquationCheckChoice),
  "g6-op-m02-function-value": aliasTopic("g6-op-m02-function-value", genG6FunctionValue),
  "g6-op-m02-coordinate-quadrant": aliasTopic("g6-op-m02-coordinate-quadrant", genG6CoordinateQuadrant),
  "g6-op-m02-function-graph-table": aliasTopic("g6-op-m02-function-graph-table", genG6FunctionGraphTable),
};

export const GENERATORS: Record<string, () => Problem> = Object.fromEntries(
  Object.entries(RAW_GENERATORS).map(([topicId, generate]) => [topicId, () => hideFirstGradeAnswerVisual(enrichG6ParkProblem(topicId, generate()))]),
) as Record<string, () => Problem>;
