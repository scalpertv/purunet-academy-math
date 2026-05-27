// 난수·정수론 유틸 (문제 생성에 쓰는 순수 함수 모음)

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

// n의 약수를 오름차순으로 모두 반환
export function divisors(n: number): number[] {
  const small: number[] = [];
  const large: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      small.push(i);
      if (i !== n / i) large.push(n / i);
    }
  }
  return small.concat(large.reverse());
}

// n의 배수를 작은 것부터 count개
export function multiples(n: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => n * (i + 1));
}

// 거부 표본추출: 조건을 만족하는 결과가 나올 때까지 재시도, 실패 시 폴백
export function sample<T>(make: () => T | null, fallback: T, tries = 300): T {
  for (let i = 0; i < tries; i++) {
    const v = make();
    if (v !== null) return v;
  }
  return fallback;
}
