// 앱 전역에서 쓰는 문제·단원 타입 정의

import type { Frac } from "./frac";

export type AnswerKind =
  | "integer"
  | "numberSet"
  | "fraction"
  | "fractionPair"
  | "compare"
  | "choice";

export type CompareSign = "<" | "=" | ">";
export type LearningLevel = "beginner" | "intermediate" | "advanced";
export type LearningArea = "basic" | "concept" | "type" | "challenge";

export type MathVisual =
  | { type: "rectangle"; width: number | string; height: number | string; unit?: string }
  | { type: "square"; side: number | string; unit?: string }
  | { type: "parallelogram"; base: number | string; height: number | string; unit?: string }
  | { type: "triangle"; base: number | string; height: number | string; unit?: string }
  | { type: "trapezoid"; top: number | string; bottom: number | string; height: number | string; unit?: string }
  | { type: "composite-rect"; width: number | string; height: number | string; cutWidth: number | string; cutHeight: number | string; unit?: string }
  | { type: "cuboid"; width: number | string; depth: number | string; height: number | string; unit?: string }
  | { type: "solid-shape"; kind: "prism" | "pyramid" | "cylinder" | "cone" | "sphere"; label?: string; height?: number | string; radius?: number | string; unit?: string }
  | { type: "net-diagram"; kind: "prism" | "pyramid" | "cylinder"; sides?: number; label?: string; unit?: string }
  | { type: "cube-stack"; cols: number; rows: number; layers: number }
  | { type: "data-table"; headers: Array<string | number>; rows: Array<Array<string | number>>; caption?: string }
  | { type: "bar-chart"; items: Array<{ label: string; value: number }>; title?: string; unit?: string; referenceValue?: number; showValues?: boolean }
  | { type: "line-chart"; points: Array<{ label: string; value: number }>; title?: string; unit?: string; referenceValue?: number }
  | { type: "clock"; hour: number; minute: number; title?: string }
  | { type: "ruler"; length: number; unit?: "cm" | "mm"; max?: number; title?: string }
  | { type: "line-type"; kind: "segment" | "ray" | "line"; title?: string }
  | { type: "right-angle"; shape: "angle" | "triangle" | "rectangle" | "square"; title?: string }
  | { type: "ten-frame"; filled: number; total?: 10 | 20; splitAt?: number; title?: string; showCountLabel?: boolean }
  | { type: "number-bond"; total: number | string; left: number | string; right: number | string; title?: string }
  | { type: "place-value-blocks"; tens: number; ones: number; title?: string; showTotal?: boolean }
  | { type: "base-ten-blocks"; hundreds: number; tens: number; ones: number; title?: string; showTotal?: boolean }
  | { type: "number-line"; values: number[]; missingIndex?: number; title?: string }
  | { type: "range-line"; start: number; end: number; leftInclusive: boolean; rightInclusive: boolean; title?: string }
  | { type: "object-array"; rows: number; cols: number; title?: string; unit?: string; showTotalLabel?: boolean }
  | { type: "shape-pattern"; items: string[]; title?: string }
  | {
      type: "pictograph";
      items: Array<{ label: string; bigCount: number; smallCount: number }>;
      bigValue: number;
      smallValue: number;
      title?: string;
      unit?: string;
    }
  | { type: "ratio-strip"; leftLabel: string; rightLabel: string; left: number; right: number; title?: string; unit?: string; total?: number }
  | { type: "circle-chart"; items: Array<{ label: string; value: number }>; title?: string; unit?: string }
  | { type: "circle-diagram"; mode: "radius" | "diameter" | "circumference" | "area" | "composite"; radius?: number; diameter?: number; squareSide?: number; unit?: string; title?: string }
  | { type: "circle-pattern"; circles: number; radius: number; unit?: string; title?: string }
  | { type: "angle-diagram"; degrees: number; title?: string }
  | { type: "parallel-lines"; mode: "parallel" | "perpendicular" | "distance"; title?: string }
  | { type: "quadrilateral-diagram"; kind: "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square"; title?: string }
  | { type: "polygon-diagram"; sides: number; regular?: boolean; showDiagonal?: boolean; title?: string }
  | { type: "fraction-strip"; numerator: number; denominator: number; divisorNumerator?: number; title?: string }
  | { type: "probability-bag"; red: number; blue: number }
  | { type: "coin-chance" }
  | { type: "coordinate-plane"; point: [number, number]; axis: "x" | "y"; reflected?: [number, number] }
  | { type: "congruent-triangles"; sides?: [number, number, number]; angles?: [number, number, number]; target: string; unit?: string }
  | { type: "symmetry-shape"; shape: "square" | "rectangle" | "equilateral-triangle" | "isosceles-triangle" | "parallelogram" }
  | { type: "rotation-180" };

export type SolutionStep = {
  label: string;   // e.g. "① 괄호 안: 25 + 27 = □"
  answer: string;  // 중간 계산 정답 문자열
  hint?: string;   // 선택: 정답을 바로 보여주기 전 사고 유도 힌트
};

export interface Problem {
  topicId: string;
  prompt: string; // 지시문 (예: "계산하세요.")
  expression: string; // 화면에 크게 보일 식 또는 문장
  hint?: string; // 입력 형식 안내 (예: "약수를 작은 수부터 쉼표로 구분")
  answer: number | number[] | Frac | [Frac, Frac] | CompareSign | string;
  kind: AnswerKind;
  solution: string; // 오답 시 보여줄 한 줄 풀이
  choices?: string[]; // 선택형 문항 보기
  answerText?: string; // 오답 시 표기 (값과 표시형이 다른 분수에서 사용)
  requireReduced?: boolean; // fraction: 기약분수만 정답
  requireDenominator?: number; // fraction: 분모를 이 값으로 강제 (크기가 같은 분수)
  commonDenominator?: number; // fractionPair: 두 분수의 분모를 이 값으로 강제 (통분)
  visual?: MathVisual; // 도형·그래프·표 문제용 경량 SVG 시각자료
  conceptNote?: string;        // 개념 영역에서만 표시되는 핵심 원리 설명
  solutionSteps?: SolutionStep[]; // 단계별 풀이 중간 계산 단계
}

export interface Topic {
  id: string;
  title: string;
  desc: string;
  learningLevel?: LearningLevel;
  learningArea?: LearningArea;
  generate: () => Problem;
}

export interface Unit {
  id: string;
  no: number;
  label?: string;
  course?: string;
  month?: string;
  title: string;
  subtitle: string;
  accent: string; // CSS 색상 변수값
  topics: Topic[];
}
