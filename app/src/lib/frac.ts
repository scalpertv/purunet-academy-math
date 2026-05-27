// 분수 파싱·약분·통분·대분수 표기 유틸 (4·5월 분수 단원 채점에 사용)

export interface Frac {
  n: number; // 분자 (가분수 허용, 음수 허용)
  d: number; // 분모 ( > 0 으로 정규화)
}

function gcd2(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : gcd2(b, a % b);
}

export function fracGcd(a: number, b: number): number {
  return gcd2(a, b);
}

export function fracLcm(a: number, b: number): number {
  return Math.abs((a / gcd2(a, b)) * b);
}

// 분모를 항상 양수로 맞춘 분수 (약분하지 않음 — 표시 형태 보존용)
export function makeFrac(n: number, d: number): Frac {
  if (d === 0) throw new Error("denominator must not be 0");
  return d < 0 ? { n: -n, d: -d } : { n, d };
}

export function reduceFrac(f: Frac): Frac {
  const g = gcd2(f.n, f.d) || 1;
  return makeFrac(f.n / g, f.d / g);
}

// 이미 기약 상태인지 (정수 포함: gcd(0,1)=1)
export function isLowestTerms(f: Frac): boolean {
  return gcd2(f.n, f.d) === 1;
}

export function fracEq(a: Frac, b: Frac): boolean {
  return a.n * b.d === b.n * a.d;
}

export function fracVal(f: Frac): number {
  return f.n / f.d;
}

export function addFrac(a: Frac, b: Frac): Frac {
  return reduceFrac(makeFrac(a.n * b.d + b.n * a.d, a.d * b.d));
}

export function subFrac(a: Frac, b: Frac): Frac {
  return reduceFrac(makeFrac(a.n * b.d - b.n * a.d, a.d * b.d));
}

// "3", "5/12", "13/8", "1 3/8" → Frac (실패 시 null)
export function parseFrac(raw: string): Frac | null {
  const s = raw.trim().replace(/\s*\/\s*/g, "/");
  if (s === "") return null;

  // 대분수: "정수 분자/분모"
  let m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (m) {
    const w = parseInt(m[1], 10);
    const n = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    if (d === 0) return null;
    const sign = m[1].startsWith("-") ? -1 : 1;
    return makeFrac(sign * (Math.abs(w) * d + n), d);
  }
  // 진분수·가분수: "분자/분모"
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) {
    const d = parseInt(m[2], 10);
    if (d === 0) return null;
    return makeFrac(parseInt(m[1], 10), d);
  }
  // 정수
  m = s.match(/^(-?\d+)$/);
  if (m) return makeFrac(parseInt(m[1], 10), 1);

  return null;
}

// 분모/분자 그대로 표기 (약분·통분 결과 보존: 12/18, 9/12 …)
export function rawFrac(f: Frac): string {
  return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
}

// 기약·대분수 우선 표기: 3, 5/12, 1 3/8
export function formatFrac(f0: Frac): string {
  const f = reduceFrac(f0);
  if (f.d === 1) return String(f.n);
  const sign = f.n < 0 ? "-" : "";
  const n = Math.abs(f.n);
  const d = f.d;
  if (n < d) return `${sign}${n}/${d}`;
  const w = Math.floor(n / d);
  const r = n % d;
  return r === 0 ? `${sign}${w}` : `${sign}${w} ${r}/${d}`;
}
