// 초등 AI 수학 코치 - 집중 연산 4지선다 AI 코치 메인 로직
// generators.js(번들)가 먼저 로드되어야 합니다.

// ============================================================
// 상태
// ============================================================
const app = {
  grade: 1, semester: 1,
  unitIdx: 0,           // 현재 선택 단원 인덱스
  typeFilter: "",       // "" | "basic" | "concept" | "type" | "challenge"
  difficulty: "standard", // "basic" | "standard" | "challenge"
  problem: null, choices: [], answered: false,
  total: 0, correct: 0, wrong: 0, streak: 0,
  xp: 0, gems: 0, badges: 0, bossHp: 100,
  toastId: 0, coachTypingTimer: null, weakMap: {},
  questCoachAnswers: 0, questHinted: false, questExplained: false,
  setLimit: 10, sessionProblems: 0
};

const $ = id => document.getElementById(id);

// ============================================================
// 헬퍼
// ============================================================
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function gcdNum(a, b) { a = Math.abs(a); b = Math.abs(b); return b === 0 ? a : gcdNum(b, a % b); }
function escapeHTML(v) {
  return String(v ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function buildChoices4(answer, kind) {
  const ansStr = String(answer);
  const pool = new Set([ansStr]);
  if (kind === "compare") { ["<",">","="].forEach(s => pool.add(s)); }
  else if (/^-?\d+\/-?\d+$/.test(ansStr)) {
    const [n, d] = ansStr.split("/").map(Number);
    [n+1,Math.max(1,n-1),n,n].forEach((nn,i) => pool.add(`${nn}/${[d,d,d+1,Math.max(1,d-1)][i]}`));
    const g = gcdNum(Math.abs(n), d); if (g > 1) pool.add(`${n/g}/${d/g}`);
  } else {
    const num = Number(ansStr);
    if (Number.isFinite(num)) {
      [num+1,num-1,num+2,num-2,num+3,num-3,num+10,num-10,num*2,Math.round(num/2)]
        .forEach(v => pool.add(String(v)));
    } else { ["1","2","3","4","5"].forEach(v => pool.add(v)); }
  }
  const distractors = [...pool].filter(v => v !== ansStr);
  return shuffle([ansStr, ...shuffle(distractors).slice(0, 3)]);
}

// ============================================================
// SVG 애니메이션 시스템
// ============================================================
const IV_CSS = `
@keyframes iv-draw{to{stroke-dashoffset:0}}
@keyframes iv-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes iv-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.7}}
@keyframes iv-rise{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes iv-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes iv-spin{to{transform:rotate(360deg)}}
.iv-pop{transform-box:fill-box;transform-origin:center;animation:iv-pop .45s cubic-bezier(.34,1.56,.64,1) forwards both}
.iv-pulse{transform-box:fill-box;transform-origin:center;animation:iv-pulse 1.8s ease-in-out infinite}
.iv-rise{transform-box:fill-box;transform-origin:50% 100%;animation:iv-rise .5s ease forwards both}
`;

function svgWrap(W, H, lbl, inner) {
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHTML(lbl)}" style="width:100%;height:auto;display:block;max-height:240px"><defs><style>${IV_CSS}</style></defs>${inner}</svg>`;
}

// ── 수직선 애니메이션 (덧셈/뺄셈) ─────────────────────────────
function ivNumberLineAnim(problem) {
  const expr = problem.expression || "";
  const m = expr.match(/(-?\d+)\s*([+\-×÷])\s*(-?\d+)/);
  const start = m ? parseInt(m[1]) : 0;
  const op = m ? m[2] : "+";
  const delta = m ? parseInt(m[3]) : 0;
  const end = op === "+" ? start + delta : start - delta;
  const lo = Math.min(-2, start - 1, end - 1);
  const hi = Math.max(10, start + 1, end + 1);
  const W = 400, H = 130;
  const X = v => 20 + (v - lo) / (hi - lo) * (W - 40);
  const ticks = [];
  for (let i = lo; i <= hi; i++) {
    const x = X(i).toFixed(1), isZ = i===0, isSt = i===start, isEnd = i===end;
    const col = isSt ? "#38bdf8" : isEnd ? "#22c55e" : isZ ? "#e2e8f0" : "#475569";
    ticks.push(`<line x1="${x}" y1="${58-(isZ?10:6)}" x2="${x}" y2="${58+(isZ?10:6)}" stroke="${col}" stroke-width="${isZ?2:1}"/><text x="${x}" y="82" text-anchor="middle" fill="${col}" font-size="10" font-weight="${(isSt||isEnd)?700:400}">${i}</text>`);
  }
  const sx = X(start).toFixed(1), ex = X(end).toFixed(1);
  const dir = end > start ? 1 : -1;
  const arrowY = 42;
  const arrowPath = `M ${sx} ${arrowY} Q ${((+sx+Number(ex))/2).toFixed(1)} ${arrowY - 22} ${ex} ${arrowY}`;
  const arcLen = Math.abs(end - start) * (W - 40) / (hi - lo);
  return svgWrap(W, H, "수직선",
    `<line x1="16" y1="58" x2="${W-16}" y2="58" stroke="#334155" stroke-width="2" style="stroke-dasharray:${W-32};stroke-dashoffset:${W-32};animation:iv-draw .6s ease forwards"/>
<polygon points="${W-16},58 ${W-23},54 ${W-23},62" fill="#334155" opacity="0" style="animation:iv-fade .3s ease forwards .7s both"/>
${ticks.join("")}
<path d="${arrowPath}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" style="stroke-dasharray:${(arcLen*1.4).toFixed(0)};stroke-dashoffset:${(arcLen*1.4).toFixed(0)};animation:iv-draw .5s ease forwards .5s"/>
<polygon points="${ex},${arrowY} ${(+ex-dir*8).toFixed(1)},${arrowY-5} ${(+ex-dir*8).toFixed(1)},${arrowY+5}" fill="#f59e0b" opacity="0" style="animation:iv-fade .3s ease forwards .9s both"/>
<circle cx="${sx}" cy="58" r="9" fill="rgba(56,189,248,.15)" stroke="#38bdf8" stroke-width="1.5" class="iv-pulse" style="animation-delay:.5s"/>
<circle cx="${sx}" cy="58" r="5" fill="#38bdf8" class="iv-pop" style="animation-delay:.4s"/>
<circle cx="${ex}" cy="58" r="9" fill="rgba(34,197,94,.15)" stroke="#22c55e" stroke-width="1.5" class="iv-pop" style="animation-delay:1s"/>
<circle cx="${ex}" cy="58" r="5" fill="#22c55e" class="iv-pop" style="animation-delay:1.05s"/>
<text x="${sx}" y="112" text-anchor="middle" fill="#38bdf8" font-size="9" opacity="0" style="animation:iv-fade .3s ease forwards .6s both">출발</text>
<text x="${ex}" y="112" text-anchor="middle" fill="#22c55e" font-size="9" opacity="0" style="animation:iv-fade .3s ease forwards 1.1s both">도착</text>
<text x="${W/2}" y="16" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(expr)} 를 수직선으로 확인해 보세요</text>`
  );
}

// ── 곱셈 격자 ───────────────────────────────────────────────
function ivMulGrid(problem) {
  const expr = problem.expression || "";
  const m = expr.match(/(\d+)\s*[×x]\s*(\d+)/);
  const rows = m ? Math.min(parseInt(m[1]), 9) : 3;
  const cols = m ? Math.min(parseInt(m[2]), 9) : 4;
  const W = 400, H = 130;
  const cw = Math.min(28, (W - 60) / (cols + 1));
  const ch = Math.min(26, (H - 40) / (rows + 1));
  const ox = (W - cols * cw) / 2, oy = 22;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (ox + c * cw).toFixed(1), y = (oy + r * ch).toFixed(1);
    const delay = (0.1 + (r * cols + c) * 0.04).toFixed(2);
    cells.push(`<rect x="${x}" y="${y}" width="${(cw-2).toFixed(1)}" height="${(ch-2).toFixed(1)}" rx="4" fill="rgba(56,189,248,.14)" stroke="#38bdf8" stroke-width="1" class="iv-pop" style="animation-delay:${delay}s;transform-origin:${(+x+cw/2).toFixed(1)}px ${(+y+ch/2).toFixed(1)}px"/>`);
  }
  return svgWrap(W, H, "곱셈 격자",
    `${cells.join("")}
<text x="${W/2}" y="118" text-anchor="middle" fill="#64748b" font-size="9">${rows}행 × ${cols}열 = ${rows*cols}칸</text>
<text x="${W/2}" y="14" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(expr)} 격자로 확인</text>`
  );
}

// ── 나눗셈 원 배분 ──────────────────────────────────────────
function ivDivCircles(problem) {
  const expr = problem.expression || "";
  const m = expr.match(/(\d+)\s*[÷/]\s*(\d+)/);
  const total = m ? Math.min(parseInt(m[1]), 24) : 12;
  const groups = m ? Math.min(parseInt(m[2]), 8) : 3;
  const perGroup = Math.floor(total / groups);
  const W = 400, H = 120;
  const gw = Math.min(60, (W - 40) / groups);
  const dots = [];
  for (let g = 0; g < groups; g++) {
    const gx = 20 + g * gw + gw / 2;
    const gy = 65;
    const cr = Math.min(22, gw * 0.45);
    const delay = (g * 0.1).toFixed(2);
    dots.push(`<circle cx="${gx.toFixed(1)}" cy="${gy}" r="${cr.toFixed(1)}" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="1.5" class="iv-pop" style="animation-delay:${delay}s;transform-origin:${gx.toFixed(1)}px ${gy}px"/>`);
    for (let d = 0; d < perGroup; d++) {
      const angle = (d / perGroup) * 2 * Math.PI - Math.PI/2;
      const dotR = cr * 0.55;
      const dx = (gx + dotR * Math.cos(angle)).toFixed(1);
      const dy = (gy + dotR * Math.sin(angle)).toFixed(1);
      const dDelay = (delay*1 + 0.3 + d * 0.06).toFixed(2);
      dots.push(`<circle cx="${dx}" cy="${dy}" r="4" fill="#a78bfa" class="iv-pop" style="animation-delay:${dDelay}s;transform-origin:${dx}px ${dy}px"/>`);
    }
    dots.push(`<text x="${gx.toFixed(1)}" y="100" text-anchor="middle" fill="#a78bfa" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards ${(+delay+0.5).toFixed(2)}s both">${perGroup}</text>`);
  }
  return svgWrap(W, H, "나눗셈",
    `${dots.join("")}
<text x="${W/2}" y="116" text-anchor="middle" fill="#64748b" font-size="9">${total} ÷ ${groups} = 각 그룹에 ${perGroup}개</text>
<text x="${W/2}" y="14" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(expr)} 배분으로 확인</text>`
  );
}

// ── 분수 막대 ───────────────────────────────────────────────
function ivFractionBars(v, problem) {
  const n1 = v ? (v.numerator || 1) : 1;
  const d1 = v ? (v.denominator || 2) : 2;
  let n2 = 0, d2 = 1;
  if (v && v.type === "fraction-strip" && v.divisorNumerator !== undefined) {
    n2 = v.divisorNumerator; d2 = d1;
  } else {
    // 분수 답에서 추출
    const ans = String(problem.answer || "");
    const mf = ans.match(/^(-?\d+)\/(-?\d+)$/);
    if (mf) { n2 = parseInt(mf[1]); d2 = parseInt(mf[2]); }
    else { n2 = n1; d2 = d1; }
  }
  const lc = d1 * d2 / gcdNum(d1, d2);
  const seg = Math.min(lc, 12);
  const f1 = Math.round(n1 * seg / d1), f2 = Math.round(n2 * seg / d2);
  const W = 400, H = 140;
  const bw = Math.min(28, (W - 50) / seg - 3);
  const sx = (W - seg * (bw + 3) + 3) / 2;
  const bar = (y, fillC, col, lbl, base) =>
    `<text x="${W/2}" y="${y-8}" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="700">${lbl}</text>` +
    Array.from({length: seg}, (_, i) => {
      const rx = (sx + i * (bw + 3)).toFixed(1);
      return `<rect x="${rx}" y="${y}" width="${bw}" height="24" rx="4" fill="${i<fillC?col+"33":"rgba(255,255,255,.04)"}" stroke="${i<fillC?col:"rgba(148,163,184,.15)"}" stroke-width="1" class="iv-pop" style="animation-delay:${(base+i*.04).toFixed(2)}s;transform-origin:${(+rx+bw/2).toFixed(1)}px ${y+12}px"/>`;
    }).join("");
  return svgWrap(W, H, "분수 막대",
    `${bar(30, f1, "#38bdf8", `${n1}/${d1}`, 0.1)}
${bar(75, f2, "#22c55e", `${n2}/${d2}`, 0.4)}
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">공통분모 ${lc}로 비교해 보세요</text>`
  );
}

// ── 사각형/도형 시각화 ────────────────────────────────────
function ivRectShape(v, problem) {
  if (!v) return ivExpressionBox(problem);
  const W = 400, H = 140;
  const cx = W / 2, cy = H / 2;
  const unit = v.unit || "cm";
  if (v.type === "rectangle" || v.type === "square") {
    const w = v.width || v.side || 4, h = v.height || v.side || 3;
    const scale = Math.min(100 / Math.max(w, h), 18);
    const rw = w * scale, rh = h * scale;
    const rx = cx - rw / 2, ry = cy - rh / 2;
    return svgWrap(W, H, "직사각형",
      `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" rx="4" fill="rgba(56,189,248,.12)" stroke="#38bdf8" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease forwards both"/>
<text x="${cx}" y="${ry-6}" text-anchor="middle" fill="#bae6fd" font-size="12" font-weight="700" opacity="0" style="animation:iv-fade .4s ease forwards .4s both">${w}${unit}</text>
<text x="${rx-8}" y="${cy+4}" text-anchor="middle" fill="#bae6fd" font-size="12" font-weight="700" opacity="0" style="animation:iv-fade .4s ease forwards .5s both">${h}${unit}</text>
<text x="${W/2}" y="${H-6}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(problem.question || "")}</text>`);
  }
  if (v.type === "triangle") {
    const base = v.base || 5, height = v.height || 4;
    const scale = Math.min(90 / Math.max(base, height), 14);
    const bw = base * scale, bh = height * scale;
    const bx = cx - bw/2, by = cy + bh/2;
    const pts = `${bx.toFixed(1)},${by.toFixed(1)} ${cx.toFixed(1)},${(by-bh).toFixed(1)} ${(bx+bw).toFixed(1)},${by.toFixed(1)}`;
    const len = bw + bw + bh * 2;
    return svgWrap(W, H, "삼각형",
      `<polygon points="${pts}" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="2" style="stroke-dasharray:${len.toFixed(0)};stroke-dashoffset:${len.toFixed(0)};animation:iv-draw .6s ease forwards"/>
<text x="${cx}" y="${by+14}" text-anchor="middle" fill="#c4b5fd" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards .7s both">${base}${unit}</text>
<text x="${cx+14}" y="${(by-bh/2+4).toFixed(1)}" fill="#c4b5fd" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards .8s both">h=${height}${unit}</text>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">밑변×높이÷2</text>`);
  }
  if (v.type === "parallelogram") {
    const base = v.base || 5, height = v.height || 3;
    const scale = Math.min(90 / Math.max(base, height), 14);
    const bw = base * scale, bh = height * scale;
    const offset = bh * 0.5;
    const pts = `${(cx-bw/2+offset).toFixed(1)},${(cy-bh/2).toFixed(1)} ${(cx+bw/2+offset).toFixed(1)},${(cy-bh/2).toFixed(1)} ${(cx+bw/2-offset).toFixed(1)},${(cy+bh/2).toFixed(1)} ${(cx-bw/2-offset).toFixed(1)},${(cy+bh/2).toFixed(1)}`;
    return svgWrap(W, H, "평행사변형",
      `<polygon points="${pts}" fill="rgba(34,197,94,.12)" stroke="#22c55e" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease forwards both"/>
<text x="${cx}" y="${cy+bh/2+14}" text-anchor="middle" fill="#bbf7d0" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards .5s both">${base}${unit}</text>
<text x="${cx+bw/2+8}" y="${cy+4}" fill="#bbf7d0" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards .6s both">h=${height}</text>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">밑변×높이</text>`);
  }
  if (v.type === "trapezoid") {
    const top = v.top || 3, bottom = v.bottom || 5, height = v.height || 3;
    const scale = Math.min(90 / bottom, 14);
    const bw = bottom * scale, tw = top * scale, bh = height * scale;
    const pts = `${(cx-bw/2).toFixed(1)},${(cy+bh/2).toFixed(1)} ${(cx+bw/2).toFixed(1)},${(cy+bh/2).toFixed(1)} ${(cx+tw/2).toFixed(1)},${(cy-bh/2).toFixed(1)} ${(cx-tw/2).toFixed(1)},${(cy-bh/2).toFixed(1)}`;
    return svgWrap(W, H, "사다리꼴",
      `<polygon points="${pts}" fill="rgba(245,158,11,.12)" stroke="#f59e0b" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease forwards both"/>
<text x="${cx}" y="${cy-bh/2-7}" text-anchor="middle" fill="#fde68a" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards .5s both">${top}${unit}</text>
<text x="${cx}" y="${cy+bh/2+14}" text-anchor="middle" fill="#fde68a" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease forwards .6s both">${bottom}${unit}</text>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">(위+아래)×높이÷2</text>`);
  }
  return ivExpressionBox(problem);
}

// ── 데이터 표 ───────────────────────────────────────────────
function ivDataTable(v, problem) {
  if (!v || !v.rows) return ivExpressionBox(problem);
  const headers = v.headers || [];
  const rows = v.rows || [];
  const W = 400, H = 120;
  const colCount = Math.max(headers.length, ...(rows.map(r => r.length)));
  const cw = Math.min(52, (W - 40) / colCount);
  const sx = (W - colCount * cw) / 2;
  const cells = [];
  const allRows = [headers, ...rows];
  allRows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const rx = (sx + ci * cw).toFixed(1);
      const ry = (18 + ri * 28).toFixed(1);
      const isQ = String(cell) === "□" || String(cell) === "?";
      const isHeader = ri === 0;
      const delay = (0.05 + ri * 0.1 + ci * 0.05).toFixed(2);
      const fill = isQ ? "rgba(56,189,248,.14)" : isHeader ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.04)";
      const tc = isQ ? "#38bdf8" : isHeader ? "#94a3b8" : "#dbeafe";
      cells.push(`<rect x="${rx}" y="${ry}" width="${(cw-2).toFixed(1)}" height="25" fill="${fill}" stroke="rgba(148,163,184,.2)" stroke-width="1" opacity="0" style="animation:iv-fade .3s ease forwards ${delay}s both"/>
<text x="${(+rx+cw/2).toFixed(1)}" y="${(+ry+17).toFixed(1)}" text-anchor="middle" fill="${tc}" font-size="${isQ?14:11}" font-weight="${isQ?700:isHeader?700:400}" opacity="0" style="animation:iv-fade .3s ease forwards ${delay}s both">${escapeHTML(String(cell ?? ""))}</text>`);
    });
  });
  return svgWrap(W, H, "대응표",
    `${cells.join("")}
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.caption || "대응 관계 표")}</text>`);
}

// ── 자리값 블록 ─────────────────────────────────────────────
function ivPlaceValue(v, problem) {
  if (!v) return ivExpressionBox(problem);
  const W = 400, H = 120;
  const hundreds = v.hundreds || 0, tens = v.tens || 0, ones = v.ones || 0;
  const items = [
    { label:"백", count: Math.min(hundreds, 5), color:"#f59e0b", size:22 },
    { label:"십", count: Math.min(tens, 9), color:"#38bdf8", size:16 },
    { label:"일", count: Math.min(ones, 9), color:"#22c55e", size:11 },
  ];
  let xOff = 30;
  const shapes = [];
  items.forEach(({ label, count, color, size }) => {
    if (count === 0) return;
    shapes.push(`<text x="${xOff}" y="18" fill="#94a3b8" font-size="9" font-weight="700">${label}</text>`);
    for (let i = 0; i < count; i++) {
      const x = xOff + (i % 5) * (size + 3), y = 24 + Math.floor(i / 5) * (size + 3);
      shapes.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="${color}33" stroke="${color}" stroke-width="1.5" class="iv-pop" style="animation-delay:${(0.1+i*0.06).toFixed(2)}s;transform-origin:${(x+size/2).toFixed(1)}px ${(y+size/2).toFixed(1)}px"/>`);
    }
    xOff += count > 5 ? 6*(size+3)+10 : count*(size+3)+12;
  });
  return svgWrap(W, H, "자리값 블록",
    `${shapes.join("")}
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(String(v.value || ""))}</text>`);
}

// ── 막대 그래프 ──────────────────────────────────────────────
function ivBarChart(v, problem) {
  if (!v || !v.items) return ivExpressionBox(problem);
  const items = v.items.slice(0, 6);
  const maxVal = Math.max(...items.map(i => i.value || 0), 1);
  const W = 400, H = 140;
  const barW = Math.min(48, (W - 60) / items.length - 6);
  const sx = (W - items.length * (barW + 6)) / 2 + barW/2;
  const pal = ["#38bdf8","#22c55e","#f59e0b","#8b5cf6","#fb7185","#34d399"];
  const bars = items.map((item, i) => {
    const bh = ((item.value || 0) / maxVal * 80).toFixed(1);
    const bx = (sx + i * (barW + 6)).toFixed(1);
    const by = (105 - bh).toFixed(1);
    const col = pal[i % pal.length];
    return `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" rx="4" fill="${col}33" stroke="${col}" stroke-width="1.5" class="iv-rise" style="animation-delay:${(i*.1).toFixed(2)}s;transform-origin:${(+bx+barW/2).toFixed(1)}px 105px"/>
<text x="${(+bx+barW/2).toFixed(1)}" y="118" text-anchor="middle" fill="#475569" font-size="8">${escapeHTML(String(item.label||i+1))}</text>
<text x="${(+bx+barW/2).toFixed(1)}" y="${(+by-4).toFixed(1)}" text-anchor="middle" fill="${col}" font-size="9" opacity="0" style="animation:iv-fade .3s ease forwards ${(i*.1+.4).toFixed(2)}s both">${item.value}</text>`;
  });
  return svgWrap(W, H, "막대 그래프",
    `<line x1="${(sx-barW/2-4).toFixed(1)}" y1="105" x2="${(sx+items.length*(barW+6)).toFixed(1)}" y2="105" stroke="#334155" stroke-width="1"/>
${bars.join("")}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title || escapeHTML(problem.question || ""))}</text>`);
}

// ── 배열(어레이) ────────────────────────────────────────────
function ivObjectArray(v, problem) {
  const rows = Math.min(v ? (v.rows||3) : 3, 6);
  const cols = Math.min(v ? (v.cols||4) : 4, 8);
  const W = 400, H = 120;
  const dotR = Math.min(14, (W-60)/(cols*2.5), (H-40)/(rows*2.5));
  const xsp = dotR * 2.5, ysp = dotR * 2.5;
  const ox = (W - cols * xsp) / 2 + dotR, oy = (H - rows * ysp) / 2 + dotR;
  const dots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (ox + c * xsp).toFixed(1), y = (oy + r * ysp).toFixed(1);
    const delay = (0.05 + (r * cols + c) * 0.04).toFixed(2);
    dots.push(`<circle cx="${x}" cy="${y}" r="${dotR.toFixed(1)}" fill="rgba(251,146,60,.2)" stroke="#fb923c" stroke-width="1.5" class="iv-pop" style="animation-delay:${delay}s;transform-origin:${x}px ${y}px"/>`);
  }
  return svgWrap(W, H, "배열",
    `${dots.join("")}
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${rows} × ${cols} = ${rows*cols}개</text>`);
}

// ── 기본 식 박스 (fallback) ─────────────────────────────────
function ivExpressionBox(problem) {
  const W = 400, H = 100;
  const q = escapeHTML((problem.question || "").slice(0,40));
  const expr = escapeHTML((problem.expression || "").slice(0,30));
  return svgWrap(W, H, "문제",
    `<rect x="14" y="10" width="${W-28}" height="${H-20}" rx="14" fill="rgba(56,189,248,.08)" stroke="rgba(56,189,248,.2)" stroke-width="1.5" opacity="0" style="animation:iv-fade .5s ease forwards both"/>
<text x="${W/2}" y="42" text-anchor="middle" fill="#94a3b8" font-size="12" opacity="0" style="animation:iv-fade .3s ease forwards .15s both">${q}</text>
<text x="${W/2}" y="70" text-anchor="middle" fill="#dbeafe" font-size="20" font-weight="800" font-family="monospace" opacity="0" style="animation:iv-fade .4s ease forwards .3s both">${expr}</text>`);
}

// ── withVisual 데이터용 렌더러 매핑 ────────────────────────
function ivNumberLine(v, problem) {
  const vals = v.values || v.points || [0];
  const problem2 = { ...problem, expression: `${vals[0] || 0} + ?` };
  return ivNumberLineAnim(problem2);
}
function ivFractionStrip(v, problem) { return ivFractionBars(v, problem); }
function ivRectangle(v, problem)    { return ivRectShape(v, problem); }
function ivSquare(v, problem)       { return ivRectShape(v, problem); }
function ivTriangle(v, problem)     { return ivRectShape(v, problem); }
function ivParallelogram(v, problem){ return ivRectShape(v, problem); }
function ivTrapezoid(v, problem)    { return ivRectShape(v, problem); }
function ivTenFrame(v, problem) {
  const count = v ? (v.count || 5) : 5;
  const W = 400, H = 100;
  const cw = 28, ch = 26;
  const ox = (W - 10 * cw) / 2;
  const cells = Array.from({length:10}, (_,i) => {
    const x = (ox + i * cw).toFixed(1);
    const filled = i < count;
    return `<rect x="${x}" y="28" width="${cw-2}" height="${ch}" rx="4" fill="${filled?"rgba(56,189,248,.2)":"rgba(255,255,255,.04)"}" stroke="${filled?"#38bdf8":"rgba(148,163,184,.2)"}" stroke-width="1.5" class="iv-pop" style="animation-delay:${(i*.06).toFixed(2)}s;transform-origin:${(+x+cw/2).toFixed(1)}px 41px"/>`;
  });
  return svgWrap(W, H, "십 칸 틀",
    `${cells.join("")}
<text x="${W/2}" y="78" text-anchor="middle" fill="#64748b" font-size="10">${count}/10 채워져 있어요</text>`);
}
function ivPlaceValueBlocks(v, problem) { return ivPlaceValue(v, problem); }
function ivBarChartV(v, problem)    { return ivBarChart(v, problem); }
function ivObjectArrayV(v, problem) { return ivObjectArray(v, problem); }

// ── 자동 산수 시각화 (visual 없는 문제) ─────────────────────
function ivAutoArithmetic(problem) {
  const id = problem.skillId || "";
  if (id.includes("add") || id.includes("sub"))   return ivNumberLineAnim(problem);
  if (id.includes("times") || id.includes("mul")) return ivMulGrid(problem);
  if (id.includes("div"))                         return ivDivCircles(problem);
  if (id.includes("frac") || id.includes("fraction")) return ivFractionBars(null, problem);
  if (id.includes("decimal"))                     return ivDecimalBlocks(problem);
  if (id.includes("place") || id.includes("compose")) return ivPlaceValue(null, problem);
  return ivExpressionBox(problem);
}

function ivDecimalBlocks(problem) {
  const ans = String(problem.answer || "");
  const parts = ans.split(".");
  const intPart = parseInt(parts[0]) || 0;
  const decPart = parseInt(parts[1]) || 0;
  const W = 400, H = 110;
  const blocks = [];
  for (let i = 0; i < Math.min(intPart, 5); i++) {
    const x = 20 + i * 34;
    blocks.push(`<rect x="${x}" y="20" width="30" height="50" rx="4" fill="rgba(56,189,248,.18)" stroke="#38bdf8" stroke-width="2" class="iv-pop" style="animation-delay:${(i*.08).toFixed(2)}s;transform-origin:${x+15}px 45px"/>`);
  }
  for (let i = 0; i < Math.min(decPart, 9); i++) {
    const x = 20 + Math.min(intPart,5)*34 + 20 + i * 18;
    blocks.push(`<rect x="${x}" y="32" width="14" height="26" rx="3" fill="rgba(34,197,94,.18)" stroke="#22c55e" stroke-width="1.5" class="iv-pop" style="animation-delay:${(0.3+i*.06).toFixed(2)}s;transform-origin:${x+7}px 45px"/>`);
  }
  return svgWrap(W, H, "소수 블록",
    `${blocks.join("")}
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="10">■ 정수부분  □ 소수부분</text>
<text x="${W/2}" y="103" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(problem.expression||"")}</text>`);
}

// ── 메인 비주얼 라우터 ────────────────────────────────────
function buildElementaryVisual(problem) {
  const v = problem.visual;
  if (v) {
    const map = {
      "number-line":        ivNumberLine,
      "ten-frame":          ivTenFrame,
      "fraction-strip":     ivFractionStrip,
      "rectangle":          ivRectangle,
      "square":             ivSquare,
      "triangle":           ivTriangle,
      "parallelogram":      ivParallelogram,
      "trapezoid":          ivTrapezoid,
      "data-table":         ivDataTable,
      "place-value-blocks": ivPlaceValueBlocks,
      "bar-chart":          ivBarChartV,
      "object-array":       ivObjectArrayV,
    };
    return (map[v.type] || ivExpressionBox)(v, problem);
  }
  return ivAutoArithmetic(problem);
}

// ── AI 코치 보조 SVG (ai-stage 안 mood별) ──────────────────
function buildCoachVisualSVG(mood) {
  const W = 120, H = 48;
  if (mood === "good") {
    const stars = Array.from({length:5}, (_,i) => {
      const angle = i * Math.PI * 2 / 5, r = 16;
      const x = (W/2 + r * Math.cos(angle)).toFixed(1);
      const y = (H/2 + r * Math.sin(angle)).toFixed(1);
      return `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="#fde68a" opacity="0" style="animation:iv-fade .3s ease forwards ${(i*.1).toFixed(2)}s both">⭐</text>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block" aria-hidden="true"><defs><style>${IV_CSS}</style></defs>${stars}</svg>`;
  }
  if (mood === "alert") {
    const rings = [16,24,32].map((r,i) =>
      `<circle cx="${W/2}" cy="${H/2}" r="${r}" fill="none" stroke="#fb7185" stroke-width="1.5" opacity="0" style="animation:iv-fade .35s ease forwards ${(i*.15).toFixed(2)}s both"/>`
    ).join("");
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block" aria-hidden="true"><defs><style>${IV_CSS}</style></defs>${rings}</svg>`;
  }
  // thinking
  const wave = `<path d="M 10 ${H/2} Q 25 ${H/2-8} 40 ${H/2} Q 55 ${H/2+8} 70 ${H/2} Q 85 ${H/2-8} 100 ${H/2} Q 115 ${H/2+8} ${W} ${H/2}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0" style="animation:iv-fade .5s ease forwards both"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block" aria-hidden="true"><defs><style>${IV_CSS}</style></defs>${wave}</svg>`;
}

// ============================================================
// 커리큘럼 (generators 번들 기반, 단원 그룹핑)
// ============================================================
let CURRICULUM = {};

const GRADE_META = {
  1: { label:"1학년", emoji:"🌱" },
  2: { label:"2학년", emoji:"🌿" },
  3: { label:"3학년", emoji:"🍀" },
  4: { label:"4학년", emoji:"⭐" },
  5: { label:"5학년", emoji:"🔷" },
  6: { label:"6학년", emoji:"🏆" },
};

function initCurriculum() {
  const raw = window.PurunetGenerators && window.PurunetGenerators.OP_CURRICULUM;
  if (!raw) { console.error("PurunetGenerators not loaded"); return; }
  for (const [grade, semesters] of Object.entries(raw)) {
    const g = Number(grade);
    CURRICULUM[g] = { ...GRADE_META[g], 1: semesters["1"]||[], 2: semesters["2"]||[] };
  }
}

// 현재 학년/학기의 단원 목록
function currentUnits() {
  const entry = CURRICULUM[app.grade];
  return (entry && entry[app.semester]) || [];
}

// 현재 선택 단원
function currentUnit() {
  const units = currentUnits();
  return units[app.unitIdx] || units[0] || null;
}

// 난이도 → learningArea 허용 목록
function allowedAreas() {
  if (app.difficulty === "basic")     return ["basic"];
  if (app.difficulty === "standard")  return ["basic","concept","type"];
  return ["basic","concept","type","challenge"]; // challenge
}

// 유형 필터 + 난이도를 적용한 현재 단원의 topic 후보
function filteredTopics() {
  const unit = currentUnit();
  if (!unit) return [];
  const areas = allowedAreas();
  return unit.topics.filter(t => {
    const areaOk = areas.includes(t.learningArea);
    const typeOk = !app.typeFilter || t.learningArea === app.typeFilter;
    return areaOk && typeOk;
  });
}

// 현재 단원에서 랜덤 topic 하나 선택 (필터 적용)
function currentTopicEntry() {
  const topics = filteredTopics();
  if (topics.length === 0) return currentUnit()?.topics[0] || null;
  return topics[Math.floor(Math.random() * topics.length)];
}

// ============================================================
// UI 렌더링 - 단원/유형/난이도
// ============================================================
function renderUnitSelect() {
  const units = currentUnits();
  const sel = $("unit-select");
  if (!sel) return;
  sel.innerHTML = units.map((u, i) =>
    `<option value="${i}">${escapeHTML(u.unitTitle)} (${escapeHTML(u.unitLabel)})</option>`
  ).join("") || `<option>단원 없음</option>`;
  app.unitIdx = 0;
  sel.value = "0";
  const totalTopics = units.reduce((s, u) => s + u.topics.length, 0);
  $("course-state").textContent = `${units.length}개 단원 / ${totalTopics}개 주제`;
}

function initGradeTabs() {
  document.querySelectorAll(".grade-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".grade-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      app.grade = Number(btn.dataset.grade);
      renderUnitSelect();
    });
  });
  document.querySelectorAll(".semester-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".semester-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      app.semester = Number(btn.dataset.sem);
      renderUnitSelect();
    });
  });
  const unitSel = $("unit-select");
  if (unitSel) unitSel.addEventListener("change", e => { app.unitIdx = Number(e.target.value); });
  const typeSel = $("type-select");
  if (typeSel) typeSel.addEventListener("change", e => { app.typeFilter = e.target.value; });
  const diffSel = $("diff-select");
  if (diffSel) diffSel.addEventListener("change", e => { app.difficulty = e.target.value; });
}

// ============================================================
// 문제 생성
// ============================================================
function generateProblem(topicEntry) {
  if (!topicEntry || typeof topicEntry.generate !== "function") return null;
  let raw;
  try { raw = topicEntry.generate(); } catch(e) { return null; }
  if (!raw) return null;
  const ansStr = String(raw.answer ?? "");
  const choices = (raw.kind === "choice" && Array.isArray(raw.choices) && raw.choices.length >= 2)
    ? shuffle(raw.choices.map(String))
    : buildChoices4(ansStr, raw.kind);
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
// 미션 생성 및 렌더링
// ============================================================
function makeMission() {
  if (app.sessionProblems > 0 && app.sessionProblems >= app.setLimit) {
    const accuracy = app.total ? Math.round((app.correct / app.total) * 100) : 0;
    setCoach("good", `${app.setLimit}세트 완료!`,
      `${app.sessionProblems}문제 중 ${app.correct}개 정답, 정확도 ${accuracy}%.`,
      [["🎉","미션 완료",`정확도 ${accuracy}%`],["⭐","XP 획득",`총 ${app.xp} XP`],
       ["🔄","다시 도전","미션 시작 버튼을 눌러주세요."],["📊","리포트","우측 AI 코치 리포트 확인"]]
    );
    setMascot("win", `${app.setLimit}세트 완료! 수고했어요!`);
    return;
  }
  const topicEntry = currentTopicEntry();
  if (!topicEntry) { $("problem-title").textContent = "단원을 선택해주세요."; return; }
  let problem = null;
  for (let i = 0; i < 5 && !problem; i++) problem = generateProblem(topicEntry);
  if (!problem) { $("problem-title").textContent = "문제 생성 중 오류가 발생했습니다."; return; }
  app.problem = problem;
  app.choices = problem.choices.map(v => ({ value: v, correct: v === problem.answer }));
  app.answered = false;
  app.questCoachAnswers = 0; app.questHinted = false; app.questExplained = false;
  renderMission();
  const tip = coachStartTip(problem.skillId);
  setCoach("thinking","새 미션 준비",
    `${problem.skillTitle} 문제입니다. ${tip}`,
    [["🎯","바로 풀기","선택지를 누르면 즉시 정답 여부와 보상이 표시됩니다."],
     ["🧠","AI 질문","정답이나 오답 뒤에 이유를 묻는 짧은 질문이 이어집니다."]]
  );
  renderCoachQuestion("start");
  setMascot("ready","새 미션이 열렸습니다. 바로 답을 골라 AI 피드백을 받아보세요.");
}

function renderMission() {
  const p = app.problem;
  const gradeMeta = GRADE_META[app.grade] || { label:`${app.grade}학년`, emoji:"" };
  $("mission-kicker").textContent = `${gradeMeta.label} · ${p.skillTitle}`;
  $("problem-title").textContent = p.question;
  $("problem-visual").innerHTML = buildElementaryVisual(p);
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
  const a = String(problem.answer).trim(), v = String(value).trim();
  if (a === v) return true;
  const na = parseFloat(a), nv = parseFloat(v);
  if (!isNaN(na) && !isNaN(nv) && Math.abs(na - nv) < 0.001) return true;
  const fa = a.match(/^(-?\d+)\/(-?\d+)$/), fv = v.match(/^(-?\d+)\/(-?\d+)$/);
  if (fa && fv) { const [,an,ad]=fa.map(Number),[,vn,vd]=fv.map(Number); return an*vd===vn*ad; }
  return false;
}

function selectChoice(value, button) {
  if (app.answered) return;
  app.answered = true;
  const correct = sameAnswer(app.problem, value);
  app.total++; app.sessionProblems++;
  const xpReward = correct ? 40 + Math.min(app.streak + 1, 5) * 5 : 8;
  if (correct) {
    app.correct++; app.streak++; app.xp += xpReward; app.gems += 2;
    if (app.streak > 0 && app.streak % 3 === 0) app.badges++;
  } else {
    app.wrong++; app.streak = 0; app.xp += 8;
    app.weakMap[app.problem.skillTitle] = (app.weakMap[app.problem.skillTitle]||0) + 1;
  }
  document.querySelectorAll("[data-choice]").forEach(btn => {
    btn.disabled = true;
    if (sameAnswer(app.problem, btn.dataset.choice)) btn.classList.add("is-correct");
  });
  if (button) button.classList.add(correct ? "is-correct" : "is-wrong");
  const analysis = correct ? correctCoach() : wrongCoach(value);
  updateBoss(correct ? "hit" : "danger");
  setCoach(correct ? "good" : "alert", analysis.title, analysis.speech, analysis.cards);
  setMascot(correct ? "happy" : "alert",
    correct ? "정답입니다. 보상 젬을 획득했습니다." : "괜찮아요. AI 코치가 오답 이유를 정리했습니다.");
  renderCoachQuestion(correct ? "correct" : `wrong_${analysis.errorType||"concept"}`, value);
  showToast(correct ? `정답! XP +${xpReward}, 젬 +2` : "오답도 학습 기록에 반영됐습니다. XP +8");
  $("ai-judgement").textContent = correct ? "정답" : "오답";
  const feedbackEl = $("micro-feedback");
  if (feedbackEl) feedbackEl.innerHTML = correct
    ? `✅ <b>정답입니다!</b><br>${escapeHTML(app.problem.skillTitle)} 개념을 정확히 이해했습니다. 정답: <b>${escapeHTML(app.problem.answer)}</b>`
    : `⚠️ <b>오답 분석:</b><br>${escapeHTML(analysis.speech)}`;
  const meterFill=$("meter-fill"), meterText=$("meter-text");
  if (meterFill && meterText) { meterFill.className=`meter-fill ${correct?"low":"mid"}`; meterText.textContent=correct?"낮음 · 20%":"중간 · 55%"; }
  updateStats(); renderGameProgress(); renderReport();
}

// ============================================================
// AI 코치 시작 팁
// ============================================================
function coachStartTip(skillId) {
  const tips = {
    "add":"두 수를 더해보세요.", "sub":"큰 수에서 작은 수를 빼세요.",
    "mul":"구구단을 사용하세요.", "times":"구구단을 사용하세요.",
    "div":"나누는 수의 구구단을 떠올려보세요.",
    "frac":"분모를 통분한 뒤 분자를 계산하세요.",
    "decimal":"소수점 위치를 맞춰 계산하세요.",
    "gcd":"공약수 중 가장 큰 수를 구하세요.",
    "lcm":"공배수 중 가장 작은 수를 구하세요.",
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
  for (const [key, tip] of Object.entries(tips)) if (id.includes(key)) return tip;
  return "조건을 확인하고 알맞은 계산 방법을 생각해 보세요.";
}

// ============================================================
// 코칭 함수
// ============================================================
function correctCoach() {
  return {
    title:"정답 반응",
    speech:`정답입니다. ${coachStartTip(app.problem.skillId)}`,
    cards:[
      ["✅","정답 확인",`정답: ${app.problem.answer}`],
      ["⭐","미션 보상", `연속 ${app.streak}회 정답`],
      ["💡","다음 팁",   coachStartTip(app.problem.skillId)],
      ["➡️","다음 미션", "같은 유형을 한 문항 더 풀어 자동화를 높여 보세요."]
    ]
  };
}

function wrongCoach(value) {
  const skillId = app.problem.skillId || "";
  const hint = app.problem.hint || "풀이 첫 단계를 다시 확인하세요.";
  function mc(title, speech, errorType) {
    return { title, speech, errorType, cards:[
      ["⚠️","오답 확인",`${value}를 골랐습니다.`],
      ["💡","핵심 힌트",hint],
      ["📝","풀이 힌트",app.problem.solution||"다시 확인하세요."],
      ["🔄","재도전","처음 단계부터 다시 확인해봅시다."]
    ]};
  }
  if (skillId.includes("add-carry")||skillId.includes("add")&&skillId.includes("carry"))
    return mc("받아올림 오답","일의 자리 합이 10 이상이면 십의 자리로 1을 올립니다.","add-carry");
  if (skillId.includes("sub-borrow")||skillId.includes("sub")&&skillId.includes("bridge"))
    return mc("받아내림 오답","일의 자리를 못 빼면 십의 자리에서 10을 빌려옵니다.","sub-borrow");
  if (skillId.includes("times")||skillId.includes("mul"))
    return mc("곱셈 오답","구구단을 확인하거나 같은 수를 여러 번 더해 확인해보세요.","mul");
  if (skillId.includes("div"))
    return mc("나눗셈 오답","나누는 수의 구구단으로 답을 확인해보세요.","div");
  if (skillId.includes("gcd")||skillId.includes("common-factor"))
    return mc("최대공약수 오답","공통 약수 중 가장 큰 수. 지수가 작은 쪽을 선택합니다.","gcd");
  if (skillId.includes("lcm")||skillId.includes("common-multiple"))
    return mc("최소공배수 오답","공통 배수 중 가장 작은 수. 지수가 큰 쪽을 선택합니다.","lcm");
  if (skillId.includes("frac")||skillId.includes("fraction"))
    return mc("분수 오답","분모가 다르면 통분 먼저. 곱셈은 분자×분자, 분모×분모.","frac");
  if (skillId.includes("decimal"))
    return mc("소수 오답","소수점 위치를 맞춰 계산하세요.","decimal");
  if (skillId.includes("reduce")||skillId.includes("equivalent"))
    return mc("약분/통분 오답","최대공약수로 분자와 분모를 나누면 기약분수가 됩니다.","reduce");
  if (skillId.includes("place")||skillId.includes("compose"))
    return mc("자리값 오답","백·십·일의 자리값을 각각 확인하세요.","place");
  if (skillId.includes("compare")||skillId.includes("order"))
    return mc("크기 비교 오답","통분하거나 소수로 바꿔 크기를 비교하세요.","compare");
  if (skillId.includes("area")||skillId.includes("perimeter"))
    return mc("도형 넓이/둘레 오답","해당 도형의 공식을 확인하고 대입하세요.","area");
  if (skillId.includes("angle"))
    return mc("각도 오답","삼각형 내각의 합=180°, 사각형=360°를 기억하세요.","angle");
  if (skillId.includes("round"))
    return mc("반올림 오답","기준 자리 다음 숫자가 5 이상이면 올리고, 4 이하이면 버립니다.","round");
  return mc("개념 점검 오답",`선택한 보기는 풀이 흐름과 다릅니다. ${hint}`,"concept");
}

// ============================================================
// 풀이 흐름 / 힌트
// ============================================================
function showSolutionFlow() {
  if (!app.problem) return;
  app.questExplained = true; renderRoad();
  const steps = app.problem.steps && app.problem.steps.length
    ? app.problem.steps.map((s,i) => [String(i+1),`${i+1}단계`,s])
    : [["1","문제 확인",app.problem.question],["2","풀이",app.problem.solution],
       ["3","힌트",app.problem.hint||coachStartTip(app.problem.skillId)],["4","정답",`정답: ${app.problem.answer}`]];
  setMascot("thinking","풀이 흐름을 보고 각 단계를 내 말로 따라 말해봅시다.");
  setCoach("thinking","단계별 풀이법","정답을 외우기보다 풀이 단계의 이유를 이해해봅시다.",steps);
  renderCoachQuestion("solution"); showToast("풀이 흐름을 열었습니다.");
}

function showHint() {
  if (!app.problem) return;
  app.questHinted = true; renderRoad();
  const mf=$("meter-fill"), mt=$("meter-text");
  if (mf) mf.className="meter-fill mid"; if (mt) mt.textContent="중간 · 55%";
  setMascot("thinking","힌트를 봐도 괜찮아요. 답은 직접 고르는 게 핵심입니다.");
  showToast("AI 힌트를 열었습니다. 정답은 아직 숨겨져 있습니다.");
  const stageEl=$("ai-stage"), orbEl=$("ai-orb");
  if (stageEl) { stageEl.classList.remove("correct-glow","wrong-glow"); stageEl.classList.add("hint-glow"); }
  if (orbEl)   { orbEl.classList.remove("react-correct","react-wrong"); orbEl.classList.add("react-hint"); }
  setCoach("thinking","힌트 제공",app.problem.hint||coachStartTip(app.problem.skillId),[
    ["1","힌트",app.problem.hint||"핵심 조건을 확인하세요."],["2","주의","정답은 아직 공개하지 않습니다."]
  ]);
  renderCoachQuestion("hint");
}

// ============================================================
// renderCoachQuestion
// ============================================================
function renderCoachQuestion(type, selectedValue) {
  const skillId = app.problem ? (app.problem.skillId||"") : "";
  const correctQ = getCorrectQuestion(skillId);
  const wrongQ = getWrongQuestion(skillId);
  const questionBank = {
    start: ["AI 코치와 이 미션을 시작하는 가장 좋은 방법은?", [
      ["보기 하나를 고르고 즉시 피드백 받기",true,"맞아요. 짧게 풀고 바로 반응을 받는 흐름이 핵심입니다."],
      ["정답을 먼저 찾은 뒤 보기를 고르기",false,"선택 이유를 생각하며 고르는 것이 실력으로 남습니다."],
      ["아무 보기나 눌러보기",false,"이유를 생각하며 고르는 습관이 중요합니다."]
    ]],
    hint: ["힌트를 본 뒤 해야 할 행동은?", [
      ["내 말로 한 줄 풀이를 정리하기",true,"맞아요. 힌트를 내 풀이로 바꾸면 기억에 남습니다."],
      ["정답을 기다리기",false,"정답 대기보다 직접 선택이 중요합니다."],
      ["다음 문제로 넘어가기",false,"힌트를 활용해 이 문제를 먼저 풀어봅시다."]
    ]],
    solution: ["풀이 흐름을 볼 때 가장 중요한 태도는?", [
      ["각 단계를 내 말로 따라 말하기",true,"맞아요. 내 말로 설명해야 다음 문제에서 살아납니다."],
      ["정답 숫자만 외우기",false,"숫자만 외우면 새 문제에서 흔들립니다."],
      ["빠르게 넘어가기",false,"각 단계의 이유를 이해하는 것이 중요합니다."]
    ]],
    correct: ["다음 유사 문제를 연습하는 좋은 방법은?", [
      ["같은 유형의 문제를 반복해서 속도를 올리기",true,"맞아요. 반복으로 자동화가 이루어집니다."],
      ["이 문제를 외워두기",false,"원리를 이해해야 새 숫자에서도 풀 수 있습니다."],
      ["더 어려운 단원으로 넘어가기",false,"기초를 탄탄히 한 뒤 심화로 가는 것이 좋습니다."]
    ]],
  };
  let qData = null;
  if (type==="correct" && correctQ)                          qData = correctQ;
  else if ((type==="wrong"||type.startsWith("wrong_"))&&wrongQ) qData = wrongQ;
  if (!qData) { const k=type.startsWith("wrong_")?"hint":(type in questionBank?type:"hint"); qData=questionBank[k]||questionBank.hint; }
  const [question, options] = qData;
  $("coach-question-text").textContent = question;
  $("coach-options").innerHTML = options.map(([label,good,feedback],i) =>
    `<button class="answer-btn" type="button" data-good="${good}" data-feedback="${escapeHTML(feedback)}">
      ${i+1}. ${escapeHTML(label)}
    </button>`
  ).join("");
  document.querySelectorAll(".answer-btn").forEach(btn => btn.addEventListener("click",()=>handleCoachOption(btn)));
}

function getCorrectQuestion(skillId) {
  if (skillId.includes("add-carry")) return ["받아올림 덧셈이 필요한 이유는?", [
    ["일의 자리 합이 10 이상이면 십의 자리로 1을 올려야 하기 때문",true,"정확합니다."],
    ["십의 자리 수가 크면 올림이 필요하기 때문",false,"올림은 일의 자리 합이 10 이상일 때입니다."],
    ["결과가 두 자리 수일 때",false,"두 자리 결과가 아니라 일의 자리 합이 기준입니다."]
  ]];
  if (skillId.includes("gcd")) return ["최대공약수를 구할 때 지수를 선택하는 방법은?", [
    ["공통 소인수의 지수 중 작은 쪽을 선택",true,"맞아요."],
    ["지수 중 큰 쪽을 선택",false,"큰 지수는 최소공배수에 씁니다."],
    ["지수를 더한다",false,"더하지 않고 작은 쪽만 선택합니다."]
  ]];
  if (skillId.includes("frac")) return ["분모가 다른 분수를 더하기 전에 해야 할 일은?", [
    ["최소공배수로 통분하기",true,"맞아요."],
    ["분자끼리 바로 더하기",false,"분모가 다르면 바로 더할 수 없습니다."],
    ["분모끼리 더하기",false,"분모는 통분하는 것이지 더하는 것이 아닙니다."]
  ]];
  return null;
}

function getWrongQuestion(skillId) {
  if (skillId.includes("add-carry")) return ["47 + 36에서 일의 자리 합 13은?", [
    ["3을 일의 자리에 쓰고 1을 십의 자리로 받아올림",true,"맞아요."],
    ["13을 그대로 쓴다",false,"자릿값을 유지하기 위해 분리해야 합니다."],
    ["3만 쓰고 끝",false,"십의 자리로 1을 올려야 합니다."]
  ]];
  if (skillId.includes("frac")) return ["1/2 + 1/3을 계산하면?", [
    ["5/6 (통분: 3/6 + 2/6)",true,"맞아요."],
    ["2/5 (분자·분모 각각 더함)",false,"분모끼리 더하면 안 됩니다."],
    ["1/6",false,"통분 후 3/6+2/6=5/6입니다."]
  ]];
  return null;
}

function handleCoachOption(button) {
  const good = button.dataset.good === "true";
  document.querySelectorAll(".answer-btn").forEach(item => {
    item.disabled = true;
    item.classList.toggle("is-good", item===button&&good);
    item.classList.toggle("is-bad",  item===button&&!good);
  });
  if (good) { app.xp += 3; renderGameProgress(); }
  setMascot(good?"happy":"thinking",
    good?"좋은 선택입니다. AI 질문 보너스 XP +3!":"괜찮아요. 방금 선택도 생각을 고치는 재료입니다.");
  setCoach(good?"good":"thinking",good?"AI 질문 성공":"AI 질문 다시 생각",button.dataset.feedback,[
    ["Q","질문 반응",good?"핵심 사고를 잘 골랐습니다.":"틀린 답도 괜찮습니다."],
    ["XP","질문 보상",good?"XP +3이 추가됐습니다.":"다음 질문에서 다시 보상을 받을 수 있습니다."]
  ]);
  app.questCoachAnswers++; renderRoad();
}

// ============================================================
// AI 코치 UI
// ============================================================
function setCoach(mood, title, speech, cards) {
  const aiStatus=$("ai-status"); if (aiStatus) aiStatus.textContent=title;
  const stageEl=$("ai-stage"), orbEl=$("ai-orb");
  if (stageEl) {
    stageEl.classList.remove("correct-glow","wrong-glow","hint-glow");
    if (mood==="good") stageEl.classList.add("correct-glow");
    else if (mood==="alert") stageEl.classList.add("wrong-glow");
    else if (mood==="thinking") stageEl.classList.add("hint-glow");
  }
  if (orbEl) {
    orbEl.classList.remove("react-correct","react-wrong","react-hint");
    if (mood==="good") orbEl.classList.add("react-correct");
    else if (mood==="alert") orbEl.classList.add("react-wrong");
    else if (mood==="thinking") orbEl.classList.add("react-hint");
    orbEl.textContent = {good:"🤩",alert:"🧐",thinking:"🤔"}[mood]||"🤖";
  }
  // 코치 보조 SVG
  const coachSvgEl = $("coach-visual-svg");
  if (coachSvgEl) coachSvgEl.innerHTML = buildCoachVisualSVG(mood);

  const speechEl=$("ai-speech");
  if (speechEl) {
    clearInterval(app.coachTypingTimer); speechEl.textContent=""; speechEl.classList.add("typing-cursor");
    const chars=Array.from(String(speech)); let idx=0;
    app.coachTypingTimer=setInterval(()=>{
      speechEl.textContent+=chars[idx]||""; idx++;
      if(idx>=chars.length){clearInterval(app.coachTypingTimer);speechEl.classList.remove("typing-cursor");}
    },18);
  }
  const moodClassMap={good:"is-correct",alert:"is-error",thinking:"is-hint"};
  const cardClass=moodClassMap[mood]||"is-active";
  const missionsEl=$("coach-missions");
  if (missionsEl) {
    missionsEl.innerHTML=(cards||[]).map(([icon,head,body])=>
      `<div class="c-mission-card ${cardClass}">
        <div class="c-mission-icon">${escapeHTML(String(icon))}</div>
        <div><strong>${escapeHTML(String(head))}</strong><small>${escapeHTML(String(body))}</small></div>
      </div>`
    ).join("");
  }
}

function setMascot(mood, speech) {
  const charEl=$("mascot-character");
  if (charEl) {
    charEl.className=`avatar-emoji is-${mood}`;
    charEl.textContent={happy:"🤩",alert:"😤",thinking:"🤔",ready:"🦊",win:"🎉",wrong:"😅"}[mood]||"🦊";
  }
  const speechEl=$("mascot-speech"); if(speechEl) speechEl.textContent=speech;
}

function setRunner(mood, title, message) {
  const el=$("ai-emotion");
  if(el) el.textContent=`${{running:"🏃",win:"🎉",wrong:"⚠️",thinking:"🤔",good:"✅",alert:"❗"}[mood]||"🤖"} ${title}`;
  const pe=$("next-prompt"); if(pe) pe.textContent=message;
}

// ============================================================
// 보스 / 게임화
// ============================================================
function updateBoss(event) {
  if (event==="hit") app.bossHp=Math.max(0,app.bossHp-26);
  if (event==="danger") app.bossHp=Math.min(100,app.bossHp+10);
  if (app.bossHp<=0) { app.badges++; app.gems+=3; showToast("오답 보스를 클리어했습니다. 배지 +1, 젬 +3"); app.bossHp=100; }
  $("boss-hp-bar").style.width=`${app.bossHp}%`;
  $("boss-hp-text").textContent=`${app.bossHp}%`;
  $("boss-face").textContent=event==="hit"?"💥":event==="danger"?"🔥":"👾";
}
function renderGameProgress() {
  const level=Math.floor(app.xp/120)+1, lp=app.xp%120;
  $("xp-count").textContent=app.xp; $("level-badge").textContent=`Lv.${level}`;
  const xpBar=$("xp-bar"); if(xpBar) xpBar.style.width=`${Math.round((lp/120)*100)}%`;
  $("gem-count").textContent=app.gems; $("badge-count").textContent=app.badges;
  $("chest-state").textContent=app.gems>=6?"OPEN":"LOCK";
}
function updateStats() {
  const accuracy=app.total?Math.round((app.correct/app.total)*100):0;
  $("total-count").textContent=app.total; $("accuracy-rate").textContent=`${accuracy}%`; $("streak-count").textContent=app.streak;
}
function renderReport() {
  const accuracy=app.total?Math.round((app.correct/app.total)*100):0;
  const manipulation=Math.min(100,44+app.total*8+app.streak*6);
  const independence=Math.max(20,88-app.wrong*10);
  const correction=Math.min(100,58+app.correct*7);
  $("report-bars").innerHTML=[["정확도",accuracy],["미션 몰입도",manipulation],["힌트 독립성",independence],["오답 수정력",correction]]
    .map(([label,value])=>`<div class="bar-row"><div class="bar-top"><span>${label}</span><strong>${value}%</strong></div><div class="bar-track-outer"><div class="bar-track-fill" style="width:${value}%"></div></div></div>`).join("");
  const weak=Object.entries(app.weakMap).sort((a,b)=>b[1]-a[1])[0];
  $("weak-signal").textContent=weak?"보충 필요":"안정";
  $("weak-note").textContent=weak?`${weak[0]} 유형에서 오답 ${weak[1]}회가 누적됐습니다.`:"아직 두드러진 약점은 없습니다.";
}
function renderRoad() {
  const q1=app.questCoachAnswers>=3, q2=app.questExplained, q3=!app.questHinted&&app.answered;
  const st=app.problem?app.problem.skillTitle:"연산";
  $("mission-road").innerHTML=[["💬","AI 질문 3개 답하기",`${st} 학습 확인`,q1],["📋","단계별 풀이 확인","AI 코치 단계 설명 보기",q2],["🧠","힌트 없이 도전","힌트 미터가 보상에 반영",q3]]
    .map(([icon,title,body,done])=>`<div class="qitem${done?" is-done":""}"><div class="qbadge">${icon}</div><div><b>${done?"✅ ":""}${escapeHTML(title)}</b><small>${escapeHTML(body)}</small></div></div>`).join("");
}
function showToast(message) {
  const toast=$("game-toast"); app.toastId++;
  const id=app.toastId; toast.textContent=message; toast.classList.add("show");
  setTimeout(()=>{if(id===app.toastId)toast.classList.remove("show");},2200);
}

// ============================================================
// 프린트
// ============================================================
function printProblemSet() {
  const topicEntry=currentTopicEntry(); if(!topicEntry) return;
  const gradeLabel=(GRADE_META[app.grade]||{}).label||`${app.grade}학년`;
  const unit=currentUnit();
  const problems=[]; for(let i=0;i<app.setLimit;i++){const p=generateProblem(topicEntry);if(p)problems.push(p);}
  const rows=problems.map((p,i)=>`<div class="pp"><div class="ph"><span class="pn">${i+1}</span><span class="pq">${escapeHTML(p.question)} &nbsp; <b>${escapeHTML(p.expression)}</b></span></div><div class="pa">답: ______________________</div></div>`).join("");
  const answers=problems.map((p,i)=>`<span class="ak"><b>${i+1}.</b> ${escapeHTML(String(p.answer))}</span>`).join("");
  const html=`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${gradeLabel} 학습지</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Malgun Gothic',sans-serif;font-size:11pt;color:#111;padding:12mm 14mm}h1{font-size:14pt;font-weight:700;border-bottom:2px solid #111;padding-bottom:4px;margin-bottom:6px}.meta{font-size:10pt;display:flex;gap:24px;margin-bottom:10px;border-bottom:1px solid #bbb;padding-bottom:6px}.meta span{display:inline-flex;gap:6px}.meta span::after{content:'';display:inline-block;width:80px;border-bottom:1px solid #555}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}.pp{border:1px solid #ddd;border-radius:4px;padding:6px 8px;break-inside:avoid}.ph{display:flex;gap:6px;align-items:baseline;margin-bottom:4px}.pn{min-width:20px;font-weight:700;color:#333;flex-shrink:0}.pq{flex:1;font-size:11pt;line-height:1.5}.pa{font-size:9pt;color:#666;border-top:1px dotted #ccc;padding-top:3px;margin-top:2px}.spacer{min-height:14mm}.cut-line{border:none;border-top:1px dashed #aaa;margin:10px 0;position:relative}.cut-line::before{content:'✂  정답';position:absolute;left:50%;transform:translateX(-50%) translateY(-50%);background:#fff;padding:0 8px;font-size:9pt;color:#aaa}.ak-grid{display:flex;flex-wrap:wrap;gap:3px 14px;padding-top:6px}.ak{font-size:10pt}@media print{body{padding:8mm 10mm}@page{margin:8mm 10mm;size:A4 portrait}}</style></head><body><h1>${gradeLabel} ${escapeHTML(unit?unit.unitTitle:topicEntry.title)} 학습지 <small style="font-weight:400;font-size:11pt">(${problems.length}문제)</small></h1><div class="meta"><span>이름</span><span>날짜</span><span>점수</span></div><div class="grid">${rows}</div><div class="spacer"></div><hr class="cut-line"><div class="ak-grid">${answers}</div><script>window.onload=function(){window.print()}<\/script></body></html>`;
  const win=window.open("","_blank","width=794,height=1123"); if(win){win.document.write(html);win.document.close();}
}

// ============================================================
// 이벤트 리스너
// ============================================================
function startNewSession() { app.sessionProblems=0; makeMission(); }
$("new-mission").addEventListener("click", startNewSession);
const newMissionAlt=$("new-mission-alt"); if(newMissionAlt) newMissionAlt.addEventListener("click",startNewSession);
$("set-count-select").addEventListener("change", e=>{ app.setLimit=Number(e.target.value); });
$("next-button").addEventListener("click", makeMission);
$("hint-button").addEventListener("click", showHint);
$("explain-button").addEventListener("click", showSolutionFlow);
const printBtn=$("print-btn"); if(printBtn) printBtn.addEventListener("click",printProblemSet);

// ============================================================
// 초기화 (boot)
// ============================================================
function boot() {
  initCurriculum();
  initGradeTabs();
  renderUnitSelect();
  renderReport();
  renderGameProgress();
  makeMission();
}

boot();
