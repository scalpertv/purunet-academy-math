// 사용자 입력 채점기 (정수 / 수의 집합 / 분수 / 분수쌍 / 대소 비교)

import {
  fracEq,
  isLowestTerms,
  parseFrac,
  rawFrac,
  type Frac,
} from "./frac";
import type { CompareSign, Problem } from "./types";

function parseNumbers(raw: string): number[] | null {
  const tokens = raw.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const nums: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    nums.push(n);
  }
  return nums;
}

function sortedUnique(arr: number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

// 입력에서 대소 기호만 정규화 (전각 포함)
function normalizeSign(raw: string): string {
  return raw
    .trim()
    .replace(/＜/g, "<")
    .replace(/＞/g, ">")
    .replace(/＝/g, "=");
}

export function isCorrect(problem: Problem, input: string): boolean {
  switch (problem.kind) {
    case "integer": {
      const n = Number(input.trim());
      return Number.isInteger(n) && n === problem.answer;
    }

    case "numberSet": {
      // 순서·중복·공백 무관하게 집합으로 비교
      const got = parseNumbers(input);
      if (!got) return false;
      const want = problem.answer as number[];
      const a = sortedUnique(got);
      const b = sortedUnique(want);
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }

    case "compare":
      return normalizeSign(input) === (problem.answer as CompareSign);

    case "choice":
      return input.trim() === String(problem.answer).trim();

    case "fraction": {
      const f = parseFrac(input);
      if (!f) return false;
      if (!fracEq(f, problem.answer as Frac)) return false;
      if (problem.requireReduced && !isLowestTerms(f)) return false;
      if (problem.requireDenominator && f.d !== problem.requireDenominator)
        return false;
      return true;
    }

    case "fractionPair": {
      const parts = input.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length !== 2) return false;
      const a = parseFrac(parts[0]);
      const b = parseFrac(parts[1]);
      if (!a || !b) return false;
      const [ea, eb] = problem.answer as [Frac, Frac];
      if (!fracEq(a, ea) || !fracEq(b, eb)) return false;
      const cd = problem.commonDenominator;
      // 통분: 두 분수 모두 요구 공통분모로 표기되어야 정답
      if (cd && (a.d !== cd || b.d !== cd)) return false;
      return true;
    }

    default:
      return false;
  }
}

export function formatAnswer(problem: Problem): string {
  if (problem.answerText) return problem.answerText;
  switch (problem.kind) {
    case "numberSet":
      return (problem.answer as number[]).join(", ");
    case "fraction":
      return rawFrac(problem.answer as Frac);
    case "fractionPair": {
      const [a, b] = problem.answer as [Frac, Frac];
      return `${rawFrac(a)}, ${rawFrac(b)}`;
    }
    case "compare":
      return problem.answer as CompareSign;
    case "choice":
      return String(problem.answer);
    default:
      return String(problem.answer);
  }
}
