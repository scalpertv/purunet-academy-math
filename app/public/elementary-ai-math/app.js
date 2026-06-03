// 초등 AI 수학 코치 - 집중 연산 4지선다 AI 코치 메인 로직

// ============================================================
// 상수 및 앱 상태
// ============================================================
const AI_MODULE_ID = "ai-elementary-math:purunet-math-ebook-elementary-ai-math";
const AI_SUBJECT_ID = "ai-elementary-math";

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

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function reduceFrac(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d));
  return [n / g, d / g];
}

function fracStr(n, d) {
  if (d === 1) return String(n);
  const [rn, rd] = reduceFrac(n, d);
  if (rd === 1) return String(rn);
  return `${rn}/${rd}`;
}

function escapeHTML(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function makeChoices4(answer, distractors) {
  const pool = [answer, ...distractors.filter(d => d !== answer && d !== "" && d !== "NaN")];
  const unique = [...new Set(pool)].slice(0, 4);
  // 4개가 안 되면 숫자 기반으로 보충
  let i = 1;
  while (unique.length < 4) {
    const extra = String(Number(answer) + i * (i % 2 === 0 ? 1 : -1));
    if (!unique.includes(extra) && extra !== "NaN") unique.push(extra);
    i++;
    if (i > 20) break;
  }
  return shuffle(unique.slice(0, 4));
}

function mkProblem(skillId, skillTitle, question, expression, answer, solution, hint, distractors) {
  const choices = makeChoices4(answer, distractors);
  return { skillId, skillTitle, question, expression, answer, solution, hint, choices };
}

// ============================================================
// 초등 수학 문제 생성기
// ============================================================

// ── 1학년 ──────────────────────────────────────────────────

function genG1Add9() {
  const a = randInt(1, 4), b = randInt(1, 9 - a);
  const ans = a + b;
  return mkProblem("g1-add9", "9까지 덧셈",
    "계산하세요.", `${a} + ${b}`, String(ans),
    `${a} + ${b} = ${ans}입니다.`,
    `${a}에서 시작해서 ${b}칸 더 가세요.`,
    [String(ans-1), String(ans+1), String(ans+2)]
  );
}

function genG1Sub9() {
  const b = randInt(1, 5), a = b + randInt(1, 4);
  const ans = a - b;
  return mkProblem("g1-sub9", "9까지 뺄셈",
    "계산하세요.", `${a} - ${b}`, String(ans),
    `${a} - ${b} = ${ans}입니다.`,
    `${a}에서 ${b}칸 뒤로 가세요.`,
    [String(ans-1), String(ans+1), String(a+b)]
  );
}

function genG1Make10() {
  const a = randInt(1, 9);
  const ans = 10 - a;
  return mkProblem("g1-make10", "10 만들기",
    "□에 알맞은 수를 고르세요.", `${a} + □ = 10`, String(ans),
    `${a} + ${ans} = 10입니다.`,
    `10에서 ${a}을(를) 빼면 됩니다.`,
    [String(ans-1), String(ans+1), String(ans+2)]
  );
}

function genG1Add2d() {
  const a1 = randInt(1,4), a0 = randInt(1,4);
  const b1 = randInt(1,4), b0 = randInt(1,4);
  const a = a1*10+a0, b = b1*10+b0, ans = a+b;
  return mkProblem("g1-add2d", "두 자리 덧셈(받아올림 없음)",
    "계산하세요.", `${a} + ${b}`, String(ans),
    `${a} + ${b} = ${ans}입니다.`,
    `일의 자리끼리, 십의 자리끼리 더하세요.`,
    [String(ans-1), String(ans+1), String(ans+10)]
  );
}

function genG1Sub2d() {
  const a1 = randInt(3,9), a0 = randInt(1,9);
  const b1 = randInt(1, a1-1), b0 = randInt(0, Math.min(a0, 4));
  const a = a1*10+a0, b = b1*10+b0, ans = a-b;
  return mkProblem("g1-sub2d", "두 자리 뺄셈(받아내림 없음)",
    "계산하세요.", `${a} - ${b}`, String(ans),
    `${a} - ${b} = ${ans}입니다.`,
    `일의 자리끼리, 십의 자리끼리 빼세요.`,
    [String(ans-1), String(ans+1), String(ans+10)]
  );
}

// ── 2학년 ──────────────────────────────────────────────────

function genG2AddCarry() {
  const a = randInt(15, 89), b = randInt(15, 99-a);
  const ans = a + b;
  return mkProblem("g2-add-carry", "두 자리 덧셈(받아올림)",
    "계산하세요.", `${a} + ${b}`, String(ans),
    `${a} + ${b} = ${ans}입니다.`,
    `일의 자리 합이 10 이상이면 받아올림합니다.`,
    [String(ans-1), String(ans+1), String(ans+10)]
  );
}

function genG2SubBorrow() {
  const b = randInt(16, 49), a = b + randInt(10, 50);
  const ans = a - b;
  return mkProblem("g2-sub-borrow", "두 자리 뺄셈(받아내림)",
    "계산하세요.", `${a} - ${b}`, String(ans),
    `${a} - ${b} = ${ans}입니다.`,
    `일의 자리를 뺄 수 없으면 십의 자리에서 받아냅니다.`,
    [String(ans-1), String(ans+1), String(ans+10)]
  );
}

function genG2Times2to5() {
  const t = randInt(2, 5), n = randInt(2, 9);
  const ans = t * n;
  return mkProblem("g2-times2to5", "구구단 2-5단",
    "계산하세요.", `${t} × ${n}`, String(ans),
    `${t} × ${n} = ${ans}입니다.`,
    `${t}을(를) ${n}번 더하면 됩니다.`,
    [String(ans-t), String(ans+t), String(t*(n+1))]
  );
}

function genG2Times6to9() {
  const t = randInt(6, 9), n = randInt(2, 9);
  const ans = t * n;
  return mkProblem("g2-times6to9", "구구단 6-9단",
    "계산하세요.", `${t} × ${n}`, String(ans),
    `${t} × ${n} = ${ans}입니다.`,
    `구구단 ${t}단을 활용하세요.`,
    [String(ans-t), String(ans+t), String(ans-2*t)]
  );
}

// ── 3학년 ──────────────────────────────────────────────────

function genG3Add3d() {
  const a = randInt(100, 699), b = randInt(100, 999-a);
  const ans = a + b;
  return mkProblem("g3-add3d", "세 자리 덧셈",
    "계산하세요.", `${a} + ${b}`, String(ans),
    `${a} + ${b} = ${ans}입니다.`,
    `자리를 맞춰 일, 십, 백의 자리 순서로 더하세요.`,
    [String(ans-1), String(ans+1), String(ans+10)]
  );
}

function genG3Sub3d() {
  const b = randInt(101, 500), a = b + randInt(100, 400);
  const ans = a - b;
  return mkProblem("g3-sub3d", "세 자리 뺄셈",
    "계산하세요.", `${a} - ${b}`, String(ans),
    `${a} - ${b} = ${ans}입니다.`,
    `받아내림에 주의해서 일, 십, 백의 자리 순서로 빼세요.`,
    [String(ans-1), String(ans+1), String(ans+10)]
  );
}

function genG3DivBasic() {
  const b = randInt(2, 9), ans = randInt(2, 9), a = b * ans;
  return mkProblem("g3-div-basic", "나눗셈 기초",
    "계산하세요.", `${a} ÷ ${b}`, String(ans),
    `${a} ÷ ${b} = ${ans}입니다.`,
    `${b}의 단 구구단을 떠올려 보세요.`,
    [String(ans-1), String(ans+1), String(ans+2)]
  );
}

function genG3Mul2x1() {
  const a = randInt(12, 49), b = randInt(3, 9);
  const ans = a * b;
  return mkProblem("g3-mul2x1", "두 자리×한 자리 곱셈",
    "계산하세요.", `${a} × ${b}`, String(ans),
    `${a} × ${b} = ${ans}입니다.`,
    `일의 자리와 십의 자리를 따로 곱하고 더하세요.`,
    [String(ans-b), String(ans+b), String(ans+a)]
  );
}

function genG3Div2x1() {
  const b = randInt(3, 9), ans = randInt(11, 19), a = b * ans;
  return mkProblem("g3-div2x1", "두 자리÷한 자리 나눗셈",
    "계산하세요.", `${a} ÷ ${b}`, String(ans),
    `${a} ÷ ${b} = ${ans}입니다.`,
    `${b}의 몇 배인지 구구단으로 찾아보세요.`,
    [String(ans-1), String(ans+1), String(ans-2)]
  );
}

// ── 4학년 ──────────────────────────────────────────────────

function genG4AddBig() {
  const a = randInt(1000, 4999), b = randInt(1000, 9999-a);
  const ans = a + b;
  return mkProblem("g4-add-big", "큰 수 덧셈",
    "계산하세요.", `${a} + ${b}`, String(ans),
    `${a} + ${b} = ${ans}입니다.`,
    `자리를 맞춰 일의 자리부터 차례로 더하세요.`,
    [String(ans-1), String(ans+1), String(ans-100)]
  );
}

function genG4Mul2x2() {
  const a = randInt(12, 49), b = randInt(12, 49);
  const ans = a * b;
  return mkProblem("g4-mul2x2", "두 자리×두 자리 곱셈",
    "계산하세요.", `${a} × ${b}`, String(ans),
    `${a} × ${b} = ${ans}입니다.`,
    `(십의 자리)×b와 (일의 자리)×b를 각각 계산하세요.`,
    [String(ans-b), String(ans+b), String(ans-a)]
  );
}

function genG4FracCompare() {
  // 단순 분수 크기 비교: 어느 쪽이 더 큰지
  const dArr = [2,3,4,5,6,8];
  const d1 = dArr[randInt(0, dArr.length-1)];
  const d2 = dArr.filter(d => d !== d1)[randInt(0, dArr.length-2)];
  const n1 = randInt(1, d1-1), n2 = randInt(1, d2-1);
  const val1 = n1/d1, val2 = n2/d2;
  const ans = val1 > val2 ? `${n1}/${d1}` : `${n2}/${d2}`;
  const wrong = val1 > val2 ? `${n2}/${d2}` : `${n1}/${d1}`;
  const choices = makeChoices4(ans, [wrong, `${n1+1}/${d1}`, `${n2+1}/${d2}`]);
  return { skillId: "g4-frac-compare", skillTitle: "분수 크기 비교",
    question: "두 분수 중 더 큰 분수는 무엇인가요?",
    expression: `${n1}/${d1} 과 ${n2}/${d2}`,
    answer: ans, solution: `${n1}/${d1} = ${(val1).toFixed(2)}, ${n2}/${d2} = ${(val2).toFixed(2)}이므로 ${ans}이 더 큽니다.`,
    hint: "분수를 소수로 바꿔 비교하거나 통분해 보세요.",
    choices };
}

function genG4DecimalAdd() {
  const a = randInt(1, 9) * 0.1 + randInt(1, 9), b = randInt(1, 9) * 0.1 + randInt(1, 9);
  const ans = Math.round((a + b) * 10) / 10;
  const ansStr = ans.toString();
  return mkProblem("g4-decimal-add", "소수 덧셈",
    "계산하세요.", `${a.toFixed(1)} + ${b.toFixed(1)}`, ansStr,
    `${a.toFixed(1)} + ${b.toFixed(1)} = ${ansStr}입니다.`,
    `소수점 위치를 맞춰 더하세요.`,
    [String(ans-0.1), String(ans+0.1), String(ans+1)]
  );
}

function genG4DecimalSub() {
  const b = randInt(1, 5) + randInt(1,9)*0.1;
  const a = b + randInt(1, 4) + randInt(0,9)*0.1;
  const ans = Math.round((a - b) * 10) / 10;
  const ansStr = ans.toString();
  return mkProblem("g4-decimal-sub", "소수 뺄셈",
    "계산하세요.", `${a.toFixed(1)} - ${b.toFixed(1)}`, ansStr,
    `${a.toFixed(1)} - ${b.toFixed(1)} = ${ansStr}입니다.`,
    `소수점 위치를 맞춰 빼세요.`,
    [String(ans-0.1), String(ans+0.1), String(ans-1)]
  );
}

// ── 5학년 ──────────────────────────────────────────────────

function genG5Reduce() {
  const denoms = [4,6,8,9,10,12,15];
  const d = denoms[randInt(0, denoms.length-1)];
  const g = [2,3,4,5].find(v => d % v === 0 && v > 1) || 2;
  const n = g * randInt(1, Math.floor(d/g)-1);
  const [rn, rd] = reduceFrac(n, d);
  const ansStr = rd === 1 ? String(rn) : `${rn}/${rd}`;
  const wrong1 = `${n}/${d}`;
  const wrong2 = `${n-1}/${d}`;
  const wrong3 = `${rn+1}/${rd}`;
  const choices = makeChoices4(ansStr, [wrong1, wrong2, wrong3]);
  return { skillId: "g5-reduce", skillTitle: "약분",
    question: "기약분수로 나타내세요.", expression: `${n}/${d}`,
    answer: ansStr, solution: `${n}/${d}를 GCD(${n},${d})=${g}으로 나누면 ${ansStr}입니다.`,
    hint: `${n}과 ${d}의 최대공약수로 분자와 분모를 나누세요.`, choices };
}

function genG5FracAdd() {
  const denoms = [2,3,4,5,6,8];
  let d1 = denoms[randInt(0, denoms.length-1)];
  let d2 = denoms.filter(d => d !== d1)[randInt(0, denoms.length-2)];
  const n1 = randInt(1, d1-1), n2 = randInt(1, d2-1);
  const dLcm = lcm(d1, d2);
  const numAns = n1*(dLcm/d1) + n2*(dLcm/d2);
  const ansStr = fracStr(numAns, dLcm);
  const wrong1 = fracStr(numAns-1, dLcm);
  const wrong2 = fracStr(numAns+1, dLcm);
  const wrong3 = fracStr(n1+n2, d1+d2);
  const choices = makeChoices4(ansStr, [wrong1, wrong2, wrong3]);
  return { skillId: "g5-frac-add", skillTitle: "분수 덧셈(이분모)",
    question: "계산하세요.", expression: `${n1}/${d1} + ${n2}/${d2}`,
    answer: ansStr,
    solution: `통분: ${n1*(dLcm/d1)}/${dLcm} + ${n2*(dLcm/d2)}/${dLcm} = ${numAns}/${dLcm} = ${ansStr}`,
    hint: "두 분모의 최소공배수로 통분한 뒤 분자를 더하세요.",
    choices };
}

function genG5FracSub() {
  const denoms = [2,3,4,5,6,8];
  let d1 = denoms[randInt(0, denoms.length-1)];
  let d2 = denoms.filter(d => d !== d1)[randInt(0, denoms.length-2)];
  const n2 = randInt(1, d2-1);
  const dLcm = lcm(d1, d2);
  const scaled2 = n2*(dLcm/d2);
  const scaled1Min = scaled2 + 1;
  if (scaled1Min >= dLcm) return genG5FracAdd();
  const n1Scaled = randInt(scaled1Min, dLcm-1);
  const n1 = n1Scaled / (dLcm/d1);
  if (!Number.isInteger(n1)) return genG5FracSub();
  const numAns = n1Scaled - scaled2;
  const ansStr = fracStr(numAns, dLcm);
  const wrong1 = fracStr(numAns+1, dLcm);
  const wrong2 = fracStr(numAns-1, dLcm);
  const wrong3 = fracStr(n1-n2, Math.max(d1,d2));
  const choices = makeChoices4(ansStr, [wrong1, wrong2, wrong3]);
  return { skillId: "g5-frac-sub", skillTitle: "분수 뺄셈(이분모)",
    question: "계산하세요.", expression: `${n1}/${d1} - ${n2}/${d2}`,
    answer: ansStr,
    solution: `통분: ${n1Scaled}/${dLcm} - ${scaled2}/${dLcm} = ${numAns}/${dLcm} = ${ansStr}`,
    hint: "두 분모의 최소공배수로 통분한 뒤 분자를 빼세요.",
    choices };
}

function genG5FracMul() {
  const denoms = [2,3,4,5,6];
  const d1 = denoms[randInt(0,denoms.length-1)];
  const d2 = denoms[randInt(0,denoms.length-1)];
  const n1 = randInt(1,d1-1), n2 = randInt(1,d2-1);
  const ansN = n1*n2, ansD = d1*d2;
  const ansStr = fracStr(ansN, ansD);
  const wrong1 = fracStr(ansN+1, ansD);
  const wrong2 = fracStr(ansN-1, ansD);
  const wrong3 = fracStr(n1+n2, ansD);
  const choices = makeChoices4(ansStr, [wrong1, wrong2, wrong3]);
  return { skillId: "g5-frac-mul", skillTitle: "분수 곱셈",
    question: "계산하세요.", expression: `${n1}/${d1} × ${n2}/${d2}`,
    answer: ansStr,
    solution: `분자끼리 곱: ${n1}×${n2}=${ansN}, 분모끼리 곱: ${d1}×${d2}=${ansD} → ${ansStr}`,
    hint: "분자끼리, 분모끼리 각각 곱한 뒤 약분하세요.",
    choices };
}

function genG5Mean() {
  const count = randInt(3, 5);
  const nums = Array.from({length: count}, () => randInt(10, 30));
  const sum = nums.reduce((a,b) => a+b, 0);
  const mean = sum / count;
  const ans = Number.isInteger(mean) ? String(mean) : mean.toFixed(1);
  return mkProblem("g5-mean", "평균",
    "다음 자료의 평균을 구하세요.", nums.join(", "), ans,
    `합계 ${sum} ÷ 자료 수 ${count} = ${ans}`,
    `모든 수를 더한 뒤 자료의 수로 나누세요.`,
    [String(Number(ans)-1), String(Number(ans)+1), String(sum)]
  );
}

// ── 6학년 ──────────────────────────────────────────────────

function genG6FracDiv() {
  const denoms = [2,3,4,5,6];
  const d1 = denoms[randInt(0,denoms.length-1)];
  const d2 = denoms.filter(d => d !== d1)[randInt(0,denoms.length-2)];
  const n1 = randInt(1,d1-1), n2 = randInt(1,d2-1);
  // a/b ÷ c/d = (a*d)/(b*c)
  const ansN = n1*d2, ansD = d1*n2;
  const ansStr = fracStr(ansN, ansD);
  const wrong1 = fracStr(n1*n2, d1*d2);
  const wrong2 = fracStr(ansN+1, ansD);
  const wrong3 = fracStr(ansN-1, ansD);
  const choices = makeChoices4(ansStr, [wrong1, wrong2, wrong3]);
  return { skillId: "g6-frac-div", skillTitle: "분수 나눗셈",
    question: "계산하세요.", expression: `${n1}/${d1} ÷ ${n2}/${d2}`,
    answer: ansStr,
    solution: `나누는 분수를 뒤집어 곱합니다: ${n1}/${d1} × ${d2}/${n2} = ${ansStr}`,
    hint: "나누는 분수의 분자와 분모를 뒤집어 곱하세요.",
    choices };
}

function genG6Ratio() {
  const a = randInt(2, 6), b = randInt(a+1, a+6);
  const total = a + b;
  // a:b 에서 a의 비율(소수)
  const rat = (a/total);
  const ansStr = fracStr(a, total);
  const wrong1 = fracStr(b, total);
  const wrong2 = fracStr(a, b);
  const wrong3 = fracStr(a+1, total);
  const choices = makeChoices4(ansStr, [wrong1, wrong2, wrong3]);
  return { skillId: "g6-ratio", skillTitle: "비와 비율",
    question: `${a}:${b}에서 전체에 대한 ${a}의 비율을 분수로 나타내세요.`,
    expression: `${a} : ${b}`,
    answer: ansStr,
    solution: `비율 = ${a} ÷ (${a}+${b}) = ${a}/${total} = ${ansStr}`,
    hint: "비율 = (기준량) ÷ (전체량)입니다.",
    choices };
}

function genG6Proportion() {
  // 비례식: a:b = c:x → x = b*c/a
  const a = randInt(2, 6), b = randInt(2, 6);
  const c = a * randInt(2, 4);
  const ans = b * c / a;
  if (!Number.isInteger(ans)) return genG6Proportion();
  const ansStr = String(ans);
  return mkProblem("g6-proportion", "비례식",
    `□에 알맞은 수를 구하세요.`, `${a}:${b} = ${c}:□`,
    ansStr,
    `외항의 곱 = 내항의 곱: ${a}×□ = ${b}×${c}, □ = ${ans}`,
    `외항의 곱과 내항의 곱이 같습니다.`,
    [String(ans-1), String(ans+1), String(ans*2)]
  );
}

function genG6Percent() {
  const whole = [100, 200, 500, 1000][randInt(0,3)];
  const pct = [10, 20, 25, 50, 75][randInt(0,4)];
  const ans = whole * pct / 100;
  return mkProblem("g6-percent", "백분율",
    `${whole}의 ${pct}%를 구하세요.`, `${whole} × ${pct}%`, String(ans),
    `${whole} × ${pct}/100 = ${ans}`,
    `% 기호는 100분의 1을 뜻합니다.`,
    [String(ans-10), String(ans+10), String(ans*2)]
  );
}

function genG6CircleArea() {
  const r = randInt(2, 8);
  const ans = r * r * 3; // π≈3 (초등 근사)
  return mkProblem("g6-circle-area", "원의 넓이",
    `반지름이 ${r}cm인 원의 넓이를 구하세요. (원주율=3)`,
    `반지름 ${r}cm`, String(ans),
    `원의 넓이 = 반지름 × 반지름 × 원주율 = ${r}×${r}×3 = ${ans}(cm²)`,
    `원의 넓이 공식: 반지름 × 반지름 × 원주율(3.14≈3)`,
    [String(r*2*3), String(ans+r), String(ans-r)]
  );
}

// ============================================================
// 커리큘럼 구조
// ============================================================
const CURRICULUM = {
  1: {
    label: "1학년", emoji: "🌱",
    1: [
      { id: "g1-add9",  label: "9까지 덧셈",       gen: genG1Add9 },
      { id: "g1-sub9",  label: "9까지 뺄셈",       gen: genG1Sub9 },
      { id: "g1-make10",label: "10 만들기",         gen: genG1Make10 }
    ],
    2: [
      { id: "g1-add2d", label: "두 자리 덧셈(받아올림 없음)", gen: genG1Add2d },
      { id: "g1-sub2d", label: "두 자리 뺄셈(받아내림 없음)", gen: genG1Sub2d }
    ]
  },
  2: {
    label: "2학년", emoji: "🌿",
    1: [
      { id: "g2-add-carry",  label: "두 자리 덧셈(받아올림)",  gen: genG2AddCarry },
      { id: "g2-sub-borrow", label: "두 자리 뺄셈(받아내림)",  gen: genG2SubBorrow }
    ],
    2: [
      { id: "g2-times2to5", label: "구구단 2-5단", gen: genG2Times2to5 },
      { id: "g2-times6to9", label: "구구단 6-9단", gen: genG2Times6to9 }
    ]
  },
  3: {
    label: "3학년", emoji: "🍀",
    1: [
      { id: "g3-add3d",    label: "세 자리 덧셈",         gen: genG3Add3d },
      { id: "g3-sub3d",    label: "세 자리 뺄셈",         gen: genG3Sub3d },
      { id: "g3-div-basic",label: "나눗셈 기초",          gen: genG3DivBasic }
    ],
    2: [
      { id: "g3-mul2x1", label: "두 자리×한 자리 곱셈", gen: genG3Mul2x1 },
      { id: "g3-div2x1", label: "두 자리÷한 자리 나눗셈", gen: genG3Div2x1 }
    ]
  },
  4: {
    label: "4학년", emoji: "⭐",
    1: [
      { id: "g4-add-big",  label: "큰 수 덧셈",           gen: genG4AddBig },
      { id: "g4-mul2x2",   label: "두 자리×두 자리 곱셈", gen: genG4Mul2x2 }
    ],
    2: [
      { id: "g4-frac-compare", label: "분수 크기 비교", gen: genG4FracCompare },
      { id: "g4-decimal-add",  label: "소수 덧셈",      gen: genG4DecimalAdd },
      { id: "g4-decimal-sub",  label: "소수 뺄셈",      gen: genG4DecimalSub }
    ]
  },
  5: {
    label: "5학년", emoji: "🔷",
    1: [
      { id: "g5-reduce",   label: "약분",              gen: genG5Reduce },
      { id: "g5-frac-add", label: "분수 덧셈(이분모)", gen: genG5FracAdd },
      { id: "g5-frac-sub", label: "분수 뺄셈(이분모)", gen: genG5FracSub }
    ],
    2: [
      { id: "g5-frac-mul", label: "분수 곱셈",  gen: genG5FracMul },
      { id: "g5-mean",     label: "평균",        gen: genG5Mean }
    ]
  },
  6: {
    label: "6학년", emoji: "🏆",
    1: [
      { id: "g6-frac-div",    label: "분수 나눗셈", gen: genG6FracDiv },
      { id: "g6-ratio",       label: "비와 비율",   gen: genG6Ratio },
      { id: "g6-proportion",  label: "비례식",      gen: genG6Proportion }
    ],
    2: [
      { id: "g6-percent",     label: "백분율",      gen: genG6Percent },
      { id: "g6-circle-area", label: "원의 넓이",   gen: genG6CircleArea }
    ]
  }
};

function currentTopics() {
  return (CURRICULUM[app.grade] && CURRICULUM[app.grade][app.semester]) || [];
}

function currentGenerator() {
  const topics = currentTopics();
  const topic = topics.find(t => t.id === app.topicId) || topics[0];
  return topic ? topic.gen : null;
}

// ============================================================
// UI 렌더링: 학년/학기/주제 선택
// ============================================================
function renderTopicSelect() {
  const topics = currentTopics();
  const sel = $("topic-select");
  if (!sel) return;
  sel.innerHTML = topics.map(t => `<option value="${t.id}">${t.label}</option>`).join("");
  if (topics.length > 0) {
    app.topicId = topics[0].id;
    sel.value = app.topicId;
  }
  $("course-state").textContent = `${topics.length}개 연산 주제`;
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
  if (topicSel) {
    topicSel.addEventListener("change", e => { app.topicId = e.target.value; });
  }
}

// ============================================================
// 문제 시각화 (간결한 expression 표시)
// ============================================================
function renderProblemVisual(problem) {
  return `<div style="text-align:center">
    <div class="expr-question">${escapeHTML(problem.question)}</div>
    <div class="expr-display">${escapeHTML(problem.expression)}</div>
  </div>`;
}

// ============================================================
// 미션 생성 및 렌더링
// ============================================================
function makeMission() {
  if (app.sessionProblems > 0 && app.sessionProblems >= app.setLimit) {
    const accuracy = app.total ? Math.round((app.correct / app.total) * 100) : 0;
    setCoach("good", `${app.setLimit}세트 완료!`,
      `${app.sessionProblems}문제 중 ${app.correct}개 정답, 정확도 ${accuracy}%. 새 세션을 시작하려면 'AI 코치 미션 시작'을 눌러 주세요.`,
      [["🎉", "미션 완료", `정확도 ${accuracy}%`],
       ["⭐", "XP 획득", `총 ${app.xp} XP`],
       ["🔄", "다시 도전", "미션 시작 버튼을 눌러주세요."],
       ["📊", "리포트", "오른쪽 AI 코치 리포트를 확인하세요."]]
    );
    setMascot("win", `${app.setLimit}세트를 모두 풀었습니다. 수고했어요!`);
    return;
  }
  const gen = currentGenerator();
  if (!gen) {
    $("problem-title").textContent = "주제를 선택해주세요.";
    return;
  }
  let problem;
  try { problem = gen(); } catch(e) { problem = gen(); }
  app.problem = problem;
  app.choices = problem.choices.map(v => ({ value: v, correct: v === problem.answer }));
  app.answered = false;
  app.questCoachAnswers = 0;
  app.questHinted = false;
  app.questExplained = false;
  renderMission();

  const gradeInfo = CURRICULUM[app.grade];
  const missionTip = coachStartTip(problem.skillId);
  setCoach("thinking", "새 미션 준비",
    `${problem.skillTitle} 문제입니다. ${missionTip}`,
    [["🎯", "바로 풀기", "선택지를 누르면 즉시 정답 여부와 보상이 표시됩니다."],
     ["🧠", "AI 질문", "정답이나 오답 뒤에 이유를 묻는 짧은 질문이 이어집니다."]]
  );
  renderCoachQuestion("start");
  setMascot("ready", "새 미션이 열렸습니다. 바로 답을 골라 AI 피드백을 받아보세요.");
}

function renderMission() {
  const p = app.problem;
  $("mission-kicker").textContent = `${CURRICULUM[app.grade].label} · ${p.skillTitle}`;
  $("problem-title").textContent = p.question;
  $("problem-visual").innerHTML = renderProblemVisual(p);
  renderChoices(true);
  renderRoad();
  updateStats();
  renderGameProgress();
  updateBoss("idle");
  $("choice-lock").textContent = "즉시 선택 가능";
  $("ai-judgement").textContent = "대기";
  $("mission-note").innerHTML = `<span class="live-dot" style="display:inline-block;margin-right:6px;vertical-align:middle" aria-hidden="true"></span><b>${escapeHTML(p.skillTitle)}</b> 문제입니다. 보기를 선택하면 AI 코치가 즉시 피드백합니다.`;
  const meterFill = $("meter-fill"), meterText = $("meter-text");
  if (meterFill) meterFill.className = "meter-fill low";
  if (meterText) meterText.textContent = "선택 전 · 0%";
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
// 선택지 처리 (정답/오답 판정 + 코칭)
// ============================================================
function selectChoice(value, button) {
  if (app.answered) return;
  app.answered = true;
  const correct = value === app.problem.answer;
  app.total += 1;
  app.sessionProblems += 1;
  const xpReward = correct ? 40 + Math.min(app.streak + 1, 5) * 5 : 8;
  if (correct) {
    app.correct += 1; app.streak += 1; app.xp += xpReward; app.gems += 2;
    if (app.streak > 0 && app.streak % 3 === 0) app.badges += 1;
  } else {
    app.wrong += 1; app.streak = 0; app.xp += 8;
    app.weakMap[app.problem.skillTitle] = (app.weakMap[app.problem.skillTitle] || 0) + 1;
  }
  // 모든 보기 비활성화 + 정답 표시
  document.querySelectorAll("[data-choice]").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.choice === app.problem.answer) btn.classList.add("is-correct");
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
// AI 코치 시작 팁 (skillId별)
// ============================================================
function coachStartTip(skillId) {
  const tips = {
    "g1-add9":       "손가락을 펴서 두 수를 합쳐 보세요.",
    "g1-sub9":       "큰 수에서 작은 수만큼 지워 보세요.",
    "g1-make10":     "두 수를 더해 10이 되는 쌍을 찾으세요.",
    "g1-add2d":      "일의 자리끼리, 십의 자리끼리 따로 더하세요.",
    "g1-sub2d":      "일의 자리끼리, 십의 자리끼리 따로 빼세요.",
    "g2-add-carry":  "일의 자리 합이 10 이상이면 받아올림합니다.",
    "g2-sub-borrow": "일의 자리를 못 빼면 십의 자리에서 받아냅니다.",
    "g2-times2to5":  "같은 수를 여러 번 더하는 것과 같습니다.",
    "g2-times6to9":  "구구단 6-9단을 소리 내어 외워 보세요.",
    "g3-add3d":      "백의 자리, 십의 자리, 일의 자리 순서로 계산하세요.",
    "g3-sub3d":      "받아내림에 주의해 자리별로 빼세요.",
    "g3-div-basic":  "나누는 수의 구구단을 떠올려 보세요.",
    "g3-mul2x1":     "일의 자리와 십의 자리를 따로 곱하고 더하세요.",
    "g3-div2x1":     "나누는 수를 몇 배 해야 피제수가 되는지 구하세요.",
    "g4-add-big":    "자리를 맞춰 일의 자리부터 차례로 더하세요.",
    "g4-mul2x2":     "두 번 나누어 곱한 뒤 합산하세요.",
    "g4-frac-compare":"분모를 같게 통분하거나 소수로 바꿔 비교하세요.",
    "g4-decimal-add":"소수점 위치를 맞춰 더하세요.",
    "g4-decimal-sub":"소수점 위치를 맞춰 빼세요.",
    "g5-reduce":     "최대공약수로 분자와 분모를 나누세요.",
    "g5-frac-add":   "최소공배수로 통분한 뒤 분자를 더하세요.",
    "g5-frac-sub":   "최소공배수로 통분한 뒤 분자를 빼세요.",
    "g5-frac-mul":   "분자끼리 곱하고 분모끼리 곱한 뒤 약분하세요.",
    "g5-mean":       "모든 수를 더한 뒤 자료 수로 나누세요.",
    "g6-frac-div":   "나누는 분수의 분자와 분모를 뒤집어 곱하세요.",
    "g6-ratio":      "비율 = 비교하는 양 ÷ 전체입니다.",
    "g6-proportion": "외항의 곱 = 내항의 곱을 이용하세요.",
    "g6-percent":    "% = 100분의 1입니다. 전체에 백분율을 곱하세요.",
    "g6-circle-area":"원의 넓이 = 반지름 × 반지름 × 원주율(3.14)입니다."
  };
  return tips[skillId] || "조건을 확인하고 알맞은 계산 방법을 생각해 보세요.";
}

// ============================================================
// 정답 코칭
// ============================================================
function correctCoach() {
  const conceptMap = {
    "g1-add9":       "작은 수 덧셈을 손가락 없이 계산했습니다.",
    "g1-sub9":       "작은 수 뺄셈 개념이 확실합니다.",
    "g1-make10":     "10 보수를 빠르게 찾았습니다.",
    "g1-add2d":      "받아올림 없는 두 자리 덧셈이 정확합니다.",
    "g1-sub2d":      "받아내림 없는 두 자리 뺄셈이 정확합니다.",
    "g2-add-carry":  "받아올림을 빠뜨리지 않고 계산했습니다.",
    "g2-sub-borrow": "받아내림을 정확히 처리했습니다.",
    "g2-times2to5":  "구구단 2-5단이 자동화됐습니다.",
    "g2-times6to9":  "구구단 6-9단이 자동화됐습니다.",
    "g3-add3d":      "세 자리 덧셈의 자리 계산이 정확합니다.",
    "g3-sub3d":      "세 자리 뺄셈의 받아내림이 정확합니다.",
    "g3-div-basic":  "나눗셈과 구구단의 관계를 이해했습니다.",
    "g3-mul2x1":     "두 자리×한 자리 곱셈 흐름이 정확합니다.",
    "g3-div2x1":     "두 자리 나눗셈을 정확히 계산했습니다.",
    "g4-add-big":    "큰 수 덧셈에서 자리 계산이 완성됐습니다.",
    "g4-mul2x2":     "두 자리×두 자리 곱셈 절차가 정확합니다.",
    "g4-frac-compare":"분수 크기 비교 방법이 확실합니다.",
    "g4-decimal-add":"소수점 자리 맞추기가 정확합니다.",
    "g4-decimal-sub":"소수 뺄셈에서 자리가 정확하게 맞았습니다.",
    "g5-reduce":     "최대공약수로 약분하는 방법이 완성됐습니다.",
    "g5-frac-add":   "통분 후 분수 덧셈이 정확합니다.",
    "g5-frac-sub":   "통분 후 분수 뺄셈이 정확합니다.",
    "g5-frac-mul":   "분수 곱셈 흐름이 완성됐습니다.",
    "g5-mean":       "평균 = 합 ÷ 개수 공식이 정확히 적용됐습니다.",
    "g6-frac-div":   "나누는 분수를 뒤집어 곱하는 흐름이 완성됐습니다.",
    "g6-ratio":      "비와 비율 계산이 정확합니다.",
    "g6-proportion": "외항의 곱 = 내항의 곱 성질이 정확히 적용됐습니다.",
    "g6-percent":    "백분율 계산이 정확합니다.",
    "g6-circle-area":"원의 넓이 공식이 정확히 적용됐습니다."
  };
  const skillId = app.problem.skillId || "";
  const conceptMsg = conceptMap[skillId] || "개념과 풀이 흐름이 정확히 일치했습니다.";
  return {
    title: "정답 반응",
    speech: `정답입니다. ${conceptMsg}`,
    cards: [
      ["✅", "정답 확인", `정답은 ${app.problem.answer}입니다.`],
      ["⭐", "미션 보상",  `연속 ${app.streak}회 정답입니다.`],
      ["💡", "다음 팁",    coachStartTip(skillId)],
      ["➡️", "다음 미션",  "같은 유형을 한 문항 더 풀어 자동화를 높여 보세요."]
    ]
  };
}

// ============================================================
// 오답 코칭
// ============================================================
function wrongCoach(value) {
  const skillId = app.problem.skillId || "";
  const hint = app.problem.hint || "풀이 첫 단계를 다시 확인하세요.";

  const templates = {
    "g1-add9": {
      title: "덧셈 오답",
      speech: "손가락이나 수 막대를 사용해서 두 수를 합쳐 보세요.",
      cards: [["⚠️","두 수 합치기","첫 번째 수에서 시작해 두 번째 수만큼 더해요."], ["💡","손가락 활용","두 수를 손가락으로 세어 합쳐 보세요."], ["📝","힌트",hint], ["🔄","재도전","천천히 하나씩 세어봅시다."]]
    },
    "g1-sub9": {
      title: "뺄셈 오답",
      speech: "큰 수에서 시작해서 작은 수만큼 뒤로 세어 보세요.",
      cards: [["⚠️","방향 확인","뺄셈은 앞 수에서 시작해 뒤로 가요."], ["💡","수직선 활용","수직선에 시작점을 표시하고 뒤로 세어보세요."], ["📝","힌트",hint], ["🔄","재도전","손가락으로 하나씩 빼봅시다."]]
    },
    "g1-make10": {
      title: "10 만들기 오답",
      speech: "10에서 주어진 수를 빼면 나머지 수를 구할 수 있습니다.",
      cards: [["⚠️","10 보수","10을 두 수의 합으로 나타내요."], ["💡","규칙 확인","1+9, 2+8, 3+7, 4+6, 5+5를 외워두면 빨라요."], ["📝","힌트",hint], ["🔄","재도전","10에서 주어진 수를 빼봅시다."]]
    },
    "g2-add-carry": {
      title: "받아올림 오답",
      speech: "일의 자리 합이 10 이상이면 십의 자리로 1을 올립니다.",
      cards: [["⚠️","받아올림 확인","일의 자리 합≥10이면 십의 자리에 1을 더하세요."], ["💡","단계별","일의 자리 → 십의 자리 순서로 계산하세요."], ["📝","힌트",hint], ["🔄","재도전","일의 자리부터 다시 계산해봅시다."]]
    },
    "g2-sub-borrow": {
      title: "받아내림 오답",
      speech: "일의 자리를 못 빼면 십의 자리에서 10을 빌려옵니다.",
      cards: [["⚠️","받아내림 확인","위 수의 일의 자리 < 아래 수 일의 자리이면 받아내림!"], ["💡","단계별","십의 자리에서 1을 빌리면 일의 자리에 10이 생겨요."], ["📝","힌트",hint], ["🔄","재도전","일의 자리부터 다시 확인해봅시다."]]
    },
    "g2-times2to5": {
      title: "구구단 오답",
      speech: "구구단 2-5단을 소리 내어 외워 두면 자동화됩니다.",
      cards: [["⚠️","구구단 확인","같은 수를 여러 번 더하는 것과 같습니다."], ["💡","덧셈 확인",`${app.problem.expression}: 하나씩 더해서 확인해보세요.`], ["📝","힌트",hint], ["🔄","재도전","구구단 단을 처음부터 세어봅시다."]]
    },
    "g2-times6to9": {
      title: "구구단 6-9단 오답",
      speech: "구구단 6-9단은 반복 연습으로 자동화됩니다.",
      cards: [["⚠️","구구단 확인","큰 단은 작은 단으로 쪼개어 계산할 수도 있어요."], ["💡","분해 전략","예: 7×8 = 7×4×2 = 28×2 = 56"], ["📝","힌트",hint], ["🔄","재도전","단을 처음부터 다시 세어봅시다."]]
    },
    "g3-div-basic": {
      title: "나눗셈 오답",
      speech: "나누는 수의 구구단을 이용하면 나눗셈을 빠르게 계산할 수 있습니다.",
      cards: [["⚠️","구구단 역이용","나눗셈은 곱셈의 반대입니다."], ["💡","곱셈 확인",`${app.problem.expression}: □×나누는 수=나뉘는 수를 찾으세요.`], ["📝","힌트",hint], ["🔄","재도전","나누는 수의 단을 차례로 세어봅시다."]]
    },
    "g4-frac-compare": {
      title: "분수 크기 비교 오답",
      speech: "분모가 다른 분수는 통분하거나 소수로 바꿔서 비교합니다.",
      cards: [["⚠️","통분 필요","분모를 같게 만들어야 분자로 크기를 비교할 수 있어요."], ["💡","소수 변환","분자÷분모 = 소수로 바꿔서 비교할 수도 있어요."], ["📝","힌트",hint], ["🔄","재도전","두 분수를 통분한 뒤 분자를 비교해봅시다."]]
    },
    "g4-decimal-add": {
      title: "소수 덧셈 오답",
      speech: "소수점 위치를 반드시 맞추고 더해야 합니다.",
      cards: [["⚠️","소수점 자리","소수점을 맞추지 않으면 자릿값 오류가 생겨요."], ["💡","자리맞춤","소수점 아래와 위를 각각 자리별로 더하세요."], ["📝","힌트",hint], ["🔄","재도전","소수점을 맞춰 세로로 써보고 더해봅시다."]]
    },
    "g5-reduce": {
      title: "약분 오답",
      speech: "분자와 분모의 최대공약수를 찾아 나눠야 기약분수가 됩니다.",
      cards: [["⚠️","최대공약수 확인","분자와 분모를 나누는 가장 큰 수를 찾으세요."], ["💡","GCD 방법","두 수를 공통으로 나눠지는 수 중 가장 큰 것이 GCD입니다."], ["📝","힌트",hint], ["🔄","재도전","분자와 분모의 공약수를 모두 찾아봅시다."]]
    },
    "g5-frac-add": {
      title: "분수 덧셈 오답",
      speech: "분모가 다른 분수는 통분(최소공배수로 분모 통일) 후 분자를 더합니다.",
      cards: [["⚠️","통분 먼저","분모가 다르면 바로 분자끼리 더하면 안 됩니다."], ["💡","LCM 통분","두 분모의 최소공배수로 통분하세요."], ["📝","힌트",hint], ["🔄","재도전","두 분모의 최소공배수를 먼저 구해봅시다."]]
    },
    "g5-frac-sub": {
      title: "분수 뺄셈 오답",
      speech: "분모가 다른 분수는 통분 후 분자를 빼야 합니다.",
      cards: [["⚠️","통분 먼저","통분 없이 분자끼리 바로 빼면 오답입니다."], ["💡","LCM 통분","두 분모의 최소공배수를 찾아 통분하세요."], ["📝","힌트",hint], ["🔄","재도전","통분부터 다시 시작해봅시다."]]
    },
    "g5-frac-mul": {
      title: "분수 곱셈 오답",
      speech: "분수 곱셈은 분자끼리, 분모끼리 각각 곱한 뒤 약분합니다.",
      cards: [["⚠️","곱셈 방향","분자×분자, 분모×분모 순서를 지키세요."], ["💡","통분 불필요","곱셈은 통분이 필요 없습니다. 바로 곱하세요."], ["📝","힌트",hint], ["🔄","재도전","분자끼리 먼저 곱하고 분모끼리 곱해봅시다."]]
    },
    "g5-mean": {
      title: "평균 오답",
      speech: "평균 = 전체 합 ÷ 자료의 수입니다. 자료를 빠짐없이 더했는지 확인하세요.",
      cards: [["⚠️","합산 확인","모든 자료를 빠짐없이 더했는지 확인하세요."], ["💡","자료 수 확인","자료의 수를 다시 세어보세요."], ["📝","힌트",hint], ["🔄","재도전","합계를 먼저 계산하고 자료 수로 나눠봅시다."]]
    },
    "g6-frac-div": {
      title: "분수 나눗셈 오답",
      speech: "÷(나누기)를 ×(곱하기)로 바꾸고 나누는 분수를 뒤집어(역수) 곱합니다.",
      cards: [["⚠️","역수 곱하기","나누는 분수의 분자·분모를 뒤집어 곱하세요."], ["💡","공식","a/b ÷ c/d = a/b × d/c"], ["📝","힌트",hint], ["🔄","재도전","나누는 분수를 뒤집어 ×로 바꿔봅시다."]]
    },
    "g6-ratio": {
      title: "비율 오답",
      speech: "비율 = 비교하는 양 ÷ 기준량입니다. a:b에서 a의 비율은 a/(a+b)입니다.",
      cards: [["⚠️","전체 확인","비율을 구할 때 '전체'가 무엇인지 먼저 확인하세요."], ["💡","분수 형태","비율 = 부분 ÷ 전체로 분수를 만드세요."], ["📝","힌트",hint], ["🔄","재도전","전체를 먼저 구하고 나눗셈을 해봅시다."]]
    },
    "g6-proportion": {
      title: "비례식 오답",
      speech: "a:b=c:d에서 바깥쪽 두 수(a, d)의 곱 = 안쪽 두 수(b, c)의 곱입니다.",
      cards: [["⚠️","외항·내항","a:b=c:d → a×d = b×c"], ["💡","x 위치 확인","x가 외항인지 내항인지 먼저 확인하세요."], ["📝","힌트",hint], ["🔄","재도전","외항끼리, 내항끼리 곱해서 방정식을 세워봅시다."]]
    },
    "g6-percent": {
      title: "백분율 오답",
      speech: "% = 100분의 1입니다. 전체 × (백분율÷100) = 구하는 양입니다.",
      cards: [["⚠️","변환 방법","50% → 50/100 = 0.5로 바꾸어 계산하세요."], ["💡","기준 확인","'전체'가 무엇인지 먼저 확인하세요."], ["📝","힌트",hint], ["🔄","재도전","%를 분수로 바꾸어 전체에 곱해봅시다."]]
    },
    "g6-circle-area": {
      title: "원의 넓이 오답",
      speech: "원의 넓이 = 반지름 × 반지름 × 원주율(3.14)입니다.",
      cards: [["⚠️","공식 확인","원의 넓이는 반지름²×π입니다. 지름을 사용하지 않도록 주의!"], ["💡","반지름 확인","지름이 주어졌다면 반지름 = 지름÷2입니다."], ["📝","힌트",hint], ["🔄","재도전","반지름을 확인하고 공식에 대입해봅시다."]]
    }
  };

  // 기본 폴백
  const fallback = {
    title: "개념 점검 오답",
    speech: `선택한 보기는 풀이 흐름과 다릅니다. ${hint}`,
    errorType: "concept",
    cards: [
      ["⚠️","선택 확인",`${value}를 골랐습니다.`],
      ["💡","핵심 힌트", hint],
      ["📝","단계별 풀이", app.problem.solution || "다시 한 번 풀이를 확인하세요."],
      ["🔄","재도전", "조건을 다시 확인하고 첫 단계부터 시작하세요."]
    ]
  };

  const t = templates[skillId] || fallback;
  return { title: t.title, speech: t.speech, errorType: skillId, cards: t.cards };
}

// ============================================================
// 풀이 흐름 확인 (단계별)
// ============================================================
function showSolutionFlow() {
  if (!app.problem) return;
  app.questExplained = true;
  renderRoad();
  const steps = [
    ["1", "문제 확인", app.problem.question],
    ["2", "풀이", app.problem.solution],
    ["3", "힌트", app.problem.hint],
    ["4", "정답", `정답: ${app.problem.answer}`]
  ];
  setMascot("thinking", "풀이 흐름을 보고 각 단계를 내 말로 따라 말해봅시다.");
  setCoach("thinking", "단계별 풀이법", "정답을 외우기보다 풀이 단계의 이유를 이해해봅시다.", steps);
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
  setMascot("thinking", "힌트를 봐도 괜찮아요. 답은 직접 고르는 게 핵심입니다.");
  showToast("AI 힌트를 열었습니다. 정답은 아직 숨겨져 있습니다.");
  const stageEl = $("ai-stage"), orbEl = $("ai-orb");
  if (stageEl) { stageEl.classList.remove("correct-glow","wrong-glow"); stageEl.classList.add("hint-glow"); }
  if (orbEl)   { orbEl.classList.remove("react-correct","react-wrong"); orbEl.classList.add("react-hint"); }
  setCoach("thinking", "힌트 제공", app.problem.hint || "문제 조건을 한 단계씩 정리해 보세요.", [
    ["1", "힌트", app.problem.hint || "핵심 조건을 확인하세요."],
    ["2", "주의", "정답은 아직 공개하지 않습니다."]
  ]);
  renderCoachQuestion("hint");
}

// ============================================================
// renderCoachQuestion: 정답/오답 후속 질문 렌더링
// ============================================================
function renderCoachQuestion(type, selectedValue) {
  const skillId = app.problem ? (app.problem.skillId || "") : "";

  const correctQMap = {
    "g1-add9":       ["덧셈에서 '합'이란 무엇인가요?", [["두 수를 더한 결과", true, "맞아요. 덧셈의 결과를 합이라고 합니다."], ["두 수의 차이", false, "차이는 뺄셈의 결과입니다."], ["두 수 중 큰 수", false, "합은 두 수를 더한 값입니다."]]],
    "g1-sub9":       ["뺄셈에서 '차'란 무엇인가요?", [["두 수를 뺀 결과", true, "맞아요. 뺄셈의 결과를 차라고 합니다."], ["두 수를 더한 결과", false, "더한 결과는 합입니다."], ["두 수 중 작은 수", false, "차는 두 수를 뺀 값입니다."]]],
    "g1-make10":     ["10을 두 수로 나누는 방법이 몇 가지인가요?", [["1+9, 2+8, 3+7, 4+6, 5+5로 5가지", true, "맞아요. 10의 보수는 5쌍입니다."], ["3가지", false, "1+9부터 5+5까지 5가지 방법이 있습니다."], ["10가지", false, "순서를 고려하지 않으면 5가지입니다."]]],
    "g2-add-carry":  ["받아올림이란 무엇인가요?", [["일의 자리 합이 10 이상일 때 십의 자리로 1을 올리는 것", true, "맞아요. 받아올림의 핵심입니다."], ["십의 자리에서 1을 빌려오는 것", false, "그것은 받아내림입니다."], ["자릿수가 늘어나는 것", false, "받아올림은 1을 올리는 과정입니다."]]],
    "g2-sub-borrow": ["받아내림이란 무엇인가요?", [["윗 자리에서 10을 빌려 아래 자리에서 빼는 것", true, "맞아요. 받아내림의 핵심입니다."], ["아래 자리에서 올려주는 것", false, "그것은 받아올림입니다."], ["자릿수가 줄어드는 것", false, "받아내림은 빌려오는 과정입니다."]]],
    "g2-times2to5":  ["곱셈과 덧셈의 관계는?", [["같은 수를 여러 번 더하면 곱셈과 같다", true, "맞아요. 3×4 = 3+3+3+3입니다."], ["곱셈은 덧셈보다 항상 크다", false, "그렇지 않습니다. 1×1=1입니다."], ["곱셈은 덧셈의 반대이다", false, "곱셈의 반대는 나눗셈입니다."]]],
    "g3-div-basic":  ["나눗셈과 곱셈의 관계는?", [["나눗셈은 곱셈의 역연산이다", true, "맞아요. 6÷2=3이면 2×3=6입니다."], ["나눗셈은 뺄셈의 역연산이다", false, "뺄셈의 역연산은 덧셈입니다."], ["나눗셈은 항상 소수가 나온다", false, "나머지가 0이면 자연수로 떨어집니다."]]],
    "g5-reduce":     ["기약분수란 무엇인가요?", [["분자와 분모의 공약수가 1뿐인 분수", true, "맞아요. 더 이상 약분할 수 없는 분수입니다."], ["분자가 분모보다 작은 분수", false, "그것은 진분수입니다."], ["분자와 분모가 같은 분수", false, "그것은 1과 같은 분수입니다."]]],
    "g5-frac-add":   ["분모가 다른 분수를 더하기 전에 해야 할 일은?", [["두 분모의 최소공배수로 통분하기", true, "맞아요. 분모를 같게 만들어야 합니다."], ["분자끼리 바로 더하기", false, "분모가 다르면 바로 더할 수 없습니다."], ["분모끼리 더하기", false, "분모는 더하는 것이 아니라 통분합니다."]]],
    "g6-frac-div":   ["분수 나눗셈을 곱셈으로 바꾸려면?", [["나누는 분수의 분자·분모를 뒤집어 곱한다(역수 곱하기)", true, "맞아요. a/b ÷ c/d = a/b × d/c입니다."], ["나누는 분수를 그대로 곱한다", false, "뒤집어서(역수로) 곱해야 합니다."], ["분자끼리 나누고 분모끼리 나눈다", false, "나눗셈은 역수로 바꾸어 곱합니다."]]],
    "g6-proportion": ["비례식 a:b=c:d에서 반드시 성립하는 관계는?", [["a×d = b×c (외항의 곱 = 내항의 곱)", true, "맞아요. 비례식의 핵심 성질입니다."], ["a+d = b+c", false, "비례식은 곱이 같은 것이지 합이 같은 것이 아닙니다."], ["a-b = c-d", false, "비례식은 차가 아닌 곱이 같습니다."]]],
  };

  const wrongQMap = {
    "g1-add9":       ["3 + 4를 바르게 계산하면?", [["7", true, "맞아요. 3에서 4칸 더 가면 7입니다."], ["6", false, "3+4=7입니다. 4를 한 번 더 세어보세요."], ["8", false, "3+4=7입니다. 너무 많이 세었습니다."]]],
    "g1-sub9":       ["8 - 3을 바르게 계산하면?", [["5", true, "맞아요. 8에서 3칸 뒤로 가면 5입니다."], ["4", false, "8-3=5입니다. 하나 더 빼야 합니다."], ["6", false, "8-3=5입니다. 하나 덜 뺐습니다."]]],
    "g2-add-carry":  ["47 + 36을 계산할 때 일의 자리 합은?", [["13 → 일의 자리에 3, 십의 자리에 1 받아올림", true, "맞아요. 7+6=13이므로 받아올림이 발생합니다."], ["3만 남긴다", false, "일의 자리 합 13에서 받아올림 1을 십의 자리로 올려야 합니다."], ["13을 그대로 쓴다", false, "13을 한 자리(3)와 받아올림(1)으로 분리해야 합니다."]]],
    "g5-frac-add":   ["1/2 + 1/3을 계산하면?", [["5/6", true, "맞아요. LCM(2,3)=6으로 통분하면 3/6+2/6=5/6입니다."], ["2/5", false, "분모끼리 더하면 안 됩니다. 통분 먼저 해야 합니다."], ["1/6", false, "통분 후 분자를 더하면 5/6입니다."]]],
    "g6-frac-div":   ["1/2 ÷ 1/4를 계산하면?", [["2", true, "맞아요. 1/2 × 4/1 = 4/2 = 2입니다."], ["1/8", false, "나누기는 역수 곱하기입니다. 1/4를 뒤집어 1/2에 곱하세요."], ["1/2", false, "나누는 분수를 역수로 바꾸어 곱해야 합니다."]]],
  };

  const questionBank = {
    start: ["AI 코치와 이 미션을 시작하는 가장 좋은 방법은?", [
      ["보기 하나를 고르고 즉시 피드백 받기", true, "맞아요. 짧게 풀고 바로 반응을 받는 흐름이 핵심입니다."],
      ["정답을 먼저 찾은 뒤 보기를 고르기", false, "선택 이유를 생각하며 고르는 것이 실력으로 남습니다."],
      ["아무 보기나 눌러보기", false, "이유를 생각하며 고르는 습관이 중요합니다."]
    ]],
    hint: ["힌트를 본 뒤 해야 할 행동은?", [
      ["내 말로 한 줄 풀이를 정리하기", true, "맞아요. 힌트를 내 풀이로 바꾸면 기억에 남습니다."],
      ["정답을 기다리기", false, "정답 대기보다 직접 선택이 중요합니다."],
      ["다음 문제로 넘어가기", false, "힌트를 활용해 이 문제를 먼저 풀어봅시다."]
    ]],
    solution: ["풀이 흐름을 볼 때 가장 중요한 태도는?", [
      ["각 단계를 내 말로 따라 말하기", true, "맞아요. 내 말로 설명해야 다음 문제에서 살아납니다."],
      ["정답 숫자만 외우기", false, "숫자만 외우면 새 문제에서 흔들립니다."],
      ["빠르게 넘어가기", false, "각 단계의 이유를 이해하는 것이 중요합니다."]
    ]],
    correct: ["다음 유사 문제를 연습하는 좋은 방법은?", [
      ["같은 유형의 문제를 반복해서 속도를 올리기", true, "맞아요. 반복으로 자동화가 이루어집니다."],
      ["이 문제를 외워두기", false, "원리를 이해해야 새 숫자에서도 풀 수 있습니다."],
      ["더 어려운 단원으로 넘어가기", false, "기초를 탄탄히 한 뒤 심화로 가는 것이 좋습니다."]
    ]]
  };

  let questionData = null;
  if (type === "correct" && correctQMap[skillId]) {
    questionData = correctQMap[skillId];
  } else if ((type === "wrong" || type.startsWith("wrong_")) && wrongQMap[skillId]) {
    questionData = wrongQMap[skillId];
  }

  if (!questionData) {
    const key = type.startsWith("wrong_") ? "wrong" : (type in questionBank ? type : "hint");
    questionData = questionBank[key] || questionBank.hint;
  }

  const [question, options] = questionData;
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
  setCoach(good ? "good" : "thinking", good ? "AI 질문 성공" : "AI 질문 다시 생각", button.dataset.feedback, [
    ["Q", "질문 반응", good ? "핵심 사고를 잘 골랐습니다." : "틀린 답도 괜찮습니다. 근거를 다시 세우면 됩니다."],
    ["XP","질문 보상", good ? "XP +3이 추가됐습니다." : "다음 질문에서 다시 보상을 받을 수 있습니다."]
  ]);
  app.questCoachAnswers += 1;
  renderRoad();
}

// ============================================================
// AI 코치 스테이지 / 마스코트 / 러너 업데이트
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
// 보스 배틀 업데이트
// ============================================================
function updateBoss(event) {
  if (event === "hit")    app.bossHp = Math.max(0, app.bossHp - 26);
  if (event === "danger") app.bossHp = Math.min(100, app.bossHp + 10);
  if (app.bossHp <= 0) {
    app.badges += 1; app.gems += 3;
    showToast("오답 보스를 클리어했습니다. 배지 +1, 젬 +3");
    app.bossHp = 100;
  }
  $("boss-hp-bar").style.width = `${app.bossHp}%`;
  $("boss-hp-text").textContent = `${app.bossHp}%`;
  $("boss-face").textContent = event === "hit" ? "💥" : event === "danger" ? "🔥" : "👾";
}

// ============================================================
// 게임화: 통계 및 리포트 업데이트
// ============================================================
function renderGameProgress() {
  const level = Math.floor(app.xp / 120) + 1;
  const levelProgress = app.xp % 120;
  $("xp-count").textContent = app.xp;
  $("level-badge").textContent = `Lv.${level}`;
  const xpBar = $("xp-bar");
  if (xpBar) xpBar.style.width = `${Math.round((levelProgress / 120) * 100)}%`;
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
  const rows = [
    ["정확도", accuracy], ["미션 몰입도", manipulation],
    ["힌트 독립성", independence], ["오답 수정력", correction]
  ];
  $("report-bars").innerHTML = rows.map(([label, value]) =>
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
  const items = [
    ["💬", "AI 질문 3개 답하기", `${skillTitle} 학습 확인`, q1Done],
    ["📋", "단계별 풀이 확인",  "AI 코치 단계 설명 보기", q2Done],
    ["🧠", "힌트 없이 도전",    "힌트 미터가 보상에 반영", q3Done]
  ];
  $("mission-road").innerHTML = items.map(([icon, title, body, done]) =>
    `<div class="qitem${done ? " is-done" : ""}">
      <div class="qbadge">${icon}</div>
      <div><b>${done ? "✅ " : ""}${escapeHTML(title)}</b><small>${escapeHTML(body)}</small></div>
    </div>`
  ).join("");
}

function showToast(message) {
  const toast = $("game-toast");
  app.toastId += 1;
  const id = app.toastId;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => { if (id === app.toastId) toast.classList.remove("show"); }, 2200);
}

// ============================================================
// 프린트 기능
// ============================================================
function printProblemSet() {
  const gen = currentGenerator();
  if (!gen) return;
  const count = app.setLimit;
  const topics = currentTopics();
  const topic = topics.find(t => t.id === app.topicId) || topics[0];
  const label = topic ? topic.label : "연산";
  const gradeLabel = CURRICULUM[app.grade].label;

  let problems = [];
  for (let i = 0; i < count; i++) {
    try { problems.push(gen()); } catch(e) { problems.push(gen()); }
  }

  const rows = problems.map((p, i) => `<div class="pp">
    <div class="ph"><span class="pn">${i+1}</span><span class="pq">${escapeHTML(p.question)} &nbsp; <b>${escapeHTML(p.expression)}</b></span></div>
    <div class="pa">답: ______________________</div>
  </div>`).join("");

  const answers = problems.map((p, i) =>
    `<span class="ak"><b>${i+1}.</b> ${escapeHTML(String(p.answer))}</span>`
  ).join("");

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>${gradeLabel} ${label} 학습지</title>
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
<h1>${gradeLabel} ${label} 학습지 <small style="font-weight:400;font-size:11pt">(${count}문제)</small></h1>
<div class="meta"><span>이름</span><span>날짜</span><span>점수</span></div>
<div class="grid">${rows}</div>
<div class="spacer"></div>
<hr class="cut-line">
<div class="ak-grid">${answers}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const win = window.open("", "_blank", "width=794,height=1123");
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
// 이벤트 리스너 등록
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
  initGradeTabs();
  renderTopicSelect();
  renderReport();
  renderGameProgress();
  makeMission();
}

boot();
