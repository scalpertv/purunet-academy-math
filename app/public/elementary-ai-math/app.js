// 초등 AI 수학 코치 - 집중 연산 4지선다 AI 코치 메인 로직
// generators.js(번들)가 먼저 로드되어야 합니다.

// ============================================================
// 상태
// ============================================================
const app = {
  grade: 1, semester: 1,
  unitIdx: 0,           // 현재 선택 단원 인덱스
  typeFilter: "",       // "" | "basic" | "concept" | "type" | "challenge"
  difficulty: "challenge", // "basic" | "standard" | "challenge"
  problem: null, choices: [], answered: false,
  total: 0, correct: 0, wrong: 0, streak: 0,
  xp: 0, gems: 0, badges: 0, bossHp: 100,
  toastId: 0, coachTypingTimer: null, weakMap: {},
  questCoachAnswers: 0, questHinted: false, questExplained: false,
  setLimit: 10, sessionProblems: 0
};

const $ = id => document.getElementById(id);

const ACADEMY_API = "https://purunet-academy.pages.dev/api";
const ACADEMY_ACCOUNT_KEY = "purunet-elementary-ai-account-v1";
let academyAccount = readStoredJson(ACADEMY_ACCOUNT_KEY, null);
let academyHeartbeat = null;

// ============================================================
// 헬퍼
// ============================================================
function readStoredJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function academyPost(path, body, keepalive = false) {
  return fetch(`${ACADEMY_API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    keepalive
  }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
}

function updateAcademyStatus(message, online) {
  const status = $("academy-sync-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-online", !!online);
  status.classList.toggle("is-offline", !online);
}

function academyActivity(eventType, detail = {}, keepalive = false) {
  if (!academyAccount || academyAccount.role !== "student") return Promise.resolve();
  return academyPost("/activity", {
    id: [academyAccount.id, "elementary-ai-math", eventType, Date.now(), Math.random().toString(36).slice(2, 8)].join("-"),
    student_id: academyAccount.id,
    username: academyAccount.username || "",
    module_id: "ai-elementary-math",
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    detail,
    page: location.pathname
  }, keepalive).catch(() => {});
}

async function initAcademyLink() {
  const params = new URLSearchParams(location.search);
  const token = params.get("sso_token");
  if (token) {
    try {
      const response = await fetch("/api/auth/sso-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      academyAccount = {
        id: data.userId || data.learnerId || data.username,
        username: data.username,
        name: data.displayName || data.username,
        role: data.role || "student",
        source: data.source || "academy"
      };
      writeStoredJson(ACADEMY_ACCOUNT_KEY, academyAccount);
      params.delete("sso_token");
      const query = params.toString();
      history.replaceState({}, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    } catch (error) {
      updateAcademyStatus(`학원 로그인 연결 실패 · ${error.message}`, false);
      return;
    }
  }

  if (!academyAccount) {
    updateAcademyStatus("학원 홈에서 로그인하면 학습 기록이 저장됩니다", false);
    return;
  }
  updateAcademyStatus(`${academyAccount.name || academyAccount.username} · 학습 기록 저장 중`, true);
  await academyActivity("login", { source: academyAccount.source || "saved-session" });
  academyHeartbeat = window.setInterval(() => {
    academyActivity("heartbeat", { visibility: document.visibilityState });
  }, 60000);
}

function academyModuleInfo() {
  const unit = currentUnit();
  const unitId = unit?.unitId || unit?.id || `unit-${app.unitIdx + 1}`;
  return {
    moduleId: `ai-elementary-math:g${app.grade}-s${app.semester}-${unitId}`,
    unitId,
    unitTitle: unit?.unitTitle || unit?.title || `${app.unitIdx + 1}단원`,
    topicTotal: Math.max(1, unit?.topics?.length || 1)
  };
}

function syncAcademyAttempt(correct, selectedValue) {
  if (!academyAccount || academyAccount.role !== "student" || !app.problem) return;
  const info = academyModuleInfo();
  const key = `${ACADEMY_ACCOUNT_KEY}:progress:${academyAccount.id}:${info.moduleId}`;
  const previous = readStoredJson(key, { completed: [], attempts: 0, correct: 0 });
  const completed = Array.isArray(previous.completed) ? previous.completed.slice() : [];
  if (completed.indexOf(app.problem.skillId) < 0) completed.push(app.problem.skillId);
  const attempts = Number(previous.attempts || 0) + 1;
  const correctCount = Number(previous.correct || 0) + (correct ? 1 : 0);
  const percent = Math.min(100, Math.round(completed.length / info.topicTotal * 100));
  const updatedAt = new Date().toISOString();
  const record = {
    student_id: academyAccount.id,
    module_id: info.moduleId,
    subject_id: "ai-elementary-math",
    percent,
    stickers: correctCount,
    completed_topics: completed,
    updated_at: updatedAt,
    title: `${app.grade}학년 ${app.semester}학기 ${info.unitTitle}`,
    grade: app.grade,
    semester: app.semester,
    unitId: info.unitId,
    unitTitle: info.unitTitle,
    topicId: app.problem.skillId,
    topicTitle: app.problem.skillTitle,
    attempts,
    correct: correctCount,
    accuracy: Math.round(correctCount / attempts * 100),
    lastResult: correct ? "correct" : "wrong",
    selectedValue: String(selectedValue)
  };
  writeStoredJson(key, { completed, attempts, correct: correctCount, record });
  academyPost("/progress", record).catch(() => {
    updateAcademyStatus(`${academyAccount.name || academyAccount.username} · 기록 재연결 대기`, false);
  });
  academyActivity("problem_complete", {
    grade: app.grade,
    semester: app.semester,
    unitTitle: info.unitTitle,
    topicTitle: app.problem.skillTitle,
    correct,
    percent
  });
}

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

function katexInline(tex) {
  if (!window.katex || !tex) return "";
  try {
    return window.katex.renderToString(tex, {
      throwOnError: false,
      strict: "ignore",
      displayMode: false,
      output: "htmlAndMathml"
    });
  } catch {
    return "";
  }
}

function latexFromToken(token) {
  const mixed = String(token).match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return `${mixed[1]}\\frac{${mixed[2]}}{${mixed[3]}}`;
  const frac = String(token).match(/^(-?\d+)\/(\d+)$/);
  if (frac) return `\\frac{${frac[1]}}{${frac[2]}}`;
  return "";
}

// 텍스트 분수(3/5, 2 3/5)를 KaTeX 기반 수학 HTML로 변환
function formatMathHTML(str) {
  if (!str) return '';
  const s = String(str);
  const parts = [];
  let last = 0;
  // 대분수(2 3/5) → mixed, 분수(3/5) → fraction 순서로 처리
  const re = /(-?\d+)\s+(\d+)\/(\d+)|(-?\d+)\/(\d+)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    parts.push(escapeHTML(s.slice(last, m.index)));
    const tex = latexFromToken(m[0]);
    const rendered = katexInline(tex);
    if (rendered) {
      parts.push(`<span class="katex-math">${rendered}</span>`);
    } else
    if (m[1] !== undefined) {
      // 대분수: 정수부 + 분수부
      parts.push(`<span class="mf-mixed"><span class="mf-whole">${m[1]}</span><span class="mf"><span class="mf-n">${m[2]}</span><span class="mf-d">${m[3]}</span></span></span>`);
    } else {
      // 진분수 / 가분수
      parts.push(`<span class="mf"><span class="mf-n">${m[4]}</span><span class="mf-d">${m[5]}</span></span>`);
    }
    last = m.index + m[0].length;
  }
  parts.push(escapeHTML(s.slice(last)));
  return parts.join('');
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
@keyframes iv-wave{0%,100%{d:path("M10,24 Q25,16 40,24 Q55,32 70,24 Q85,16 100,24 Q115,32 120,24")}50%{d:path("M10,24 Q25,32 40,24 Q55,16 70,24 Q85,32 100,24 Q115,16 120,24")}}
@keyframes iv-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes iv-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes iv-celebrate{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(1.4) rotate(540deg);opacity:0}}
.iv-pop{transform-box:fill-box;transform-origin:center;animation:iv-pop .45s cubic-bezier(.34,1.56,.64,1) both}
.iv-pulse{transform-box:fill-box;transform-origin:center;animation:iv-pulse 1.8s ease-in-out infinite}
.iv-rise{transform-box:fill-box;transform-origin:50% 100%;animation:iv-rise .5s ease both}
.iv-bounce{transform-box:fill-box;transform-origin:center;animation:iv-bounce .7s ease-in-out infinite}
.iv-shake{transform-box:fill-box;transform-origin:center;animation:iv-shake .35s ease 3}
.iv-celebrate{transform-box:fill-box;transform-origin:center;animation:iv-celebrate .8s ease forwards}
`;

function svgWrap(W, H, lbl, inner) {
  const safeW = Math.max(160, Number(W) || 400);
  const safeH = Math.max(96, Number(H) || 180);
  const bg = `<rect x="1" y="1" width="${safeW - 2}" height="${safeH - 2}" rx="14" fill="#ffffff" stroke="#d9e2ef" stroke-width="2"/>`;
  return `<svg class="math-svg-board" viewBox="0 0 ${safeW} ${safeH}" role="img" aria-label="${escapeHTML(lbl)}" preserveAspectRatio="xMidYMid meet" overflow="visible"><defs><style>${IV_CSS}</style></defs>${bg}<g class="math-svg-content">${inner}</g></svg>`;
}

function enhanceMathVisual(html, label = "수학 시각 자료") {
  const raw = String(html || "").trim() || ivExpressionBox(app.problem || {});
  const template = document.createElement("template");
  template.innerHTML = raw;
  const svg = template.content.querySelector("svg");
  if (!svg) return raw;
  const viewBox = svg.getAttribute("viewBox");
  if (!viewBox) {
    const width = parseFloat(svg.getAttribute("width")) || 400;
    const height = parseFloat(svg.getAttribute("height")) || 180;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  svg.classList.add("math-svg-board");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("overflow", "visible");
  svg.setAttribute("role", "img");
  if (!svg.getAttribute("aria-label")) svg.setAttribute("aria-label", label);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  return template.innerHTML;
}

function stabilizeMathVisual(root) {
  if (!root) return;
  const svg = root.querySelector("svg.math-svg-board, svg");
  if (!svg) return;
  svg.classList.add("math-svg-board");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  if (window.SVG) {
    try {
      window.SVG(svg).viewbox(svg.getAttribute("viewBox") || "0 0 400 180");
    } catch {
      // SVG.js는 보조 안정화용입니다. 실패해도 기존 SVG는 그대로 표시합니다.
    }
  }
}

let activeMathToolCleanup = null;
let mathToolRenderId = 0;

function cleanupMathTool() {
  if (typeof activeMathToolCleanup === "function") {
    try { activeMathToolCleanup(); } catch {}
  }
  activeMathToolCleanup = null;
}

function createMathToolShell(root, tool, keepFallback = false) {
  const expression = root.querySelector(":scope > .problem-expr-text");
  if (expression) expression.remove();
  const fallbackHTML = root.innerHTML;
  root.innerHTML = `<div class="math-tool-shell ${keepFallback ? "is-linked-view" : ""}" data-tool="${tool}">
    <div class="math-tool-stage" role="img"></div>
    <div class="math-tool-fallback">${fallbackHTML}</div>
  </div>`;
  if (expression) root.appendChild(expression);
  return {
    shell: root.querySelector(".math-tool-shell"),
    stage: root.querySelector(".math-tool-stage"),
    fallback: root.querySelector(".math-tool-fallback"),
  };
}

function mathToolControls(actions) {
  const wrap = document.createElement("div");
  wrap.className = "math-tool-controls";
  actions.forEach(({ symbol, label, onClick, pressed }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "math-tool-icon-btn";
    button.textContent = symbol;
    button.title = label;
    button.setAttribute("aria-label", label);
    if (pressed !== undefined) button.setAttribute("aria-pressed", String(pressed));
    button.addEventListener("click", () => onClick(button));
    wrap.appendChild(button);
  });
  return wrap;
}

function numericDimension(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function solidSides(visual) {
  const direct = Number(visual.sides);
  if (Number.isFinite(direct) && direct >= 3) return Math.min(10, direct);
  const matched = String(visual.label || "").match(/(\d+)\s*각/);
  return matched ? Math.min(10, Math.max(3, Number(matched[1]))) : 4;
}

function threeGeometryForVisual(THREE, visual) {
  if (visual.type === "cuboid") {
    const width = numericDimension(visual.width, 6);
    const depth = numericDimension(visual.depth, 4);
    const height = numericDimension(visual.height, 3);
    const scale = 3 / Math.max(width, depth, height);
    return new THREE.BoxGeometry(width * scale, height * scale, depth * scale);
  }
  if (visual.type === "cube-stack") return null;

  const sides = solidSides(visual);
  const kind = visual.kind || "prism";
  if (kind === "cylinder") return new THREE.CylinderGeometry(1.35, 1.35, 2.7, 48);
  if (kind === "cone") return new THREE.ConeGeometry(1.45, 2.8, 48);
  if (kind === "sphere") return new THREE.SphereGeometry(1.55, 40, 24);
  if (kind === "pyramid") return new THREE.ConeGeometry(1.55, 2.7, sides);
  return new THREE.CylinderGeometry(1.45, 1.45, 2.7, sides);
}

function addEdgesToMesh(THREE, mesh, color = 0x172033) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 18),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.72 })
  );
  mesh.add(edges);
}

async function mountThreeMathTool(root, problem, keepFallback) {
  const visual = problem.visual;
  const { shell, stage, fallback } = createMathToolShell(root, "three", keepFallback);
  const renderId = ++mathToolRenderId;
  try {
    const [THREE, controlsModule] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]);
    const { OrbitControls } = controlsModule;
    if (renderId !== mathToolRenderId || !stage.isConnected) return;

    stage.setAttribute("aria-label", problem.question || problem.skillTitle || "회전 가능한 입체도형");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(4.8, 3.8, 5.8);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    stage.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d6, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(5, 7, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x60a5fa, 1.1);
    fill.position.set(-5, 2, -4);
    scene.add(fill);

    const group = new THREE.Group();
    scene.add(group);
    const palette = [0x38bdf8, 0x22c55e, 0xf59e0b, 0x8b5cf6, 0xfb7185, 0x14b8a6];
    let selectedMaterial = null;

    if (visual.type === "cube-stack") {
      const cols = Math.min(Number(visual.cols) || 3, 6);
      const rows = Math.min(Number(visual.rows) || 2, 5);
      const layers = Math.min(Number(visual.layers) || 1, 4);
      const spacing = 0.9;
      for (let z = 0; z < layers; z++) {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const material = new THREE.MeshStandardMaterial({
              color: palette[(x + y + z) % 3],
              roughness: 0.48,
              metalness: 0.02,
            });
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.82), material);
            cube.position.set(
              (x - (cols - 1) / 2) * spacing,
              (y - (rows - 1) / 2) * spacing,
              (z - (layers - 1) / 2) * spacing
            );
            cube.castShadow = true;
            cube.receiveShadow = true;
            addEdgesToMesh(THREE, cube);
            group.add(cube);
          }
        }
      }
    } else {
      selectedMaterial = new THREE.MeshStandardMaterial({
        color: palette[0],
        roughness: 0.42,
        metalness: 0.03,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
      });
      const geometry = threeGeometryForVisual(THREE, visual);
      const mesh = new THREE.Mesh(geometry, selectedMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgesToMesh(THREE, mesh);
      group.add(mesh);
    }

    const grid = new THREE.GridHelper(8, 8, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -1.75;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 11;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.25;
    controls.target.set(0, 0, 0);

    let folded = true;
    let foldValue = 1;
    let foldTarget = 1;
    const controlsEl = mathToolControls([
      {
        symbol: "↻",
        label: "처음 보기로 돌아가기",
        onClick: () => {
          camera.position.set(4.8, 3.8, 5.8);
          controls.target.set(0, 0, 0);
          controls.update();
        },
      },
      {
        symbol: "⟳",
        label: "자동 회전 켜기 또는 끄기",
        pressed: true,
        onClick: (button) => {
          controls.autoRotate = !controls.autoRotate;
          button.setAttribute("aria-pressed", String(controls.autoRotate));
        },
      },
    ]);
    if (visual.type === "net-diagram") {
      controlsEl.appendChild(mathToolControls([{
        symbol: "⇄",
        label: "전개도 접기 또는 펼치기",
        pressed: true,
        onClick: (button) => {
          folded = !folded;
          foldTarget = folded ? 1 : 0.08;
          button.setAttribute("aria-pressed", String(folded));
        },
      }]).firstElementChild);
    }
    stage.appendChild(controlsEl);

    if (visual.type === "net-diagram" && fallback) {
      const faces = [...fallback.querySelectorAll("[data-net-face]")];
      faces.forEach((face, index) => {
        const color = `#${palette[index % palette.length].toString(16).padStart(6, "0")}`;
        face.classList.add("net-face");
        face.setAttribute("tabindex", "0");
        face.setAttribute("role", "button");
        face.setAttribute("aria-label", `${index + 1}번 면`);
        const selectFace = () => {
          faces.forEach((item) => item.classList.remove("is-selected"));
          face.classList.add("is-selected");
          face.style.fill = `${color}55`;
          face.style.stroke = color;
          if (selectedMaterial) selectedMaterial.color.set(color);
        };
        face.addEventListener("click", selectFace);
        face.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectFace();
          }
        });
      });
    }

    let disposed = false;
    let animationFrame = 0;
    const resize = () => {
      const width = Math.max(260, stage.clientWidth);
      const height = Math.max(240, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    const animate = () => {
      if (disposed) return;
      animationFrame = requestAnimationFrame(animate);
      foldValue += (foldTarget - foldValue) * 0.09;
      if (visual.type === "net-diagram") {
        group.scale.y = Math.max(0.08, foldValue);
        group.rotation.z = (1 - foldValue) * Math.PI / 2;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    shell.classList.add("is-enhanced");

    activeMathToolCleanup = () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  } catch (error) {
    console.warn("Three.js 시각화를 불러오지 못해 SVG를 유지합니다.", error);
    shell.classList.add("has-fallback");
  }
}

function mountJSXGraphTool(root, problem) {
  if (!window.JXG) return;
  const visual = problem.visual;
  const { shell, stage } = createMathToolShell(root, "jsxgraph", false);
  const boardId = `jsx-math-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  stage.id = boardId;
  stage.classList.add("jxgbox");
  stage.setAttribute("aria-label", problem.question || "조작 가능한 좌표평면");
  const point = visual.point || [0, 0];
  const reflected = visual.reflected;
  const bound = Math.max(5, Math.abs(point[0]), Math.abs(point[1]), ...(reflected || [0, 0]).map(Math.abs)) + 2;
  const board = window.JXG.JSXGraph.initBoard(boardId, {
    boundingbox: [-bound, bound, bound, -bound],
    axis: true,
    grid: true,
    keepaspectratio: true,
    showNavigation: false,
    showCopyright: false,
    pan: { enabled: true },
    zoom: { enabled: true, wheel: true, pinch: true },
  });
  const originPoint = board.create("point", point, {
    name: `A(${point[0]}, ${point[1]})`,
    fixed: true,
    size: 5,
    fillColor: "#f59e0b",
    strokeColor: "#b45309",
    label: { color: "#172033", fontSize: 14 },
  });
  if (reflected) {
    board.create("point", reflected, {
      name: `A'(${reflected[0]}, ${reflected[1]})`,
      fixed: true,
      size: 5,
      fillColor: "#38bdf8",
      strokeColor: "#0369a1",
      label: { color: "#172033", fontSize: 14 },
    });
    board.create("segment", [point, reflected], {
      dash: 2,
      strokeColor: "#64748b",
      strokeWidth: 2,
      fixed: true,
    });
  }
  const controlsEl = mathToolControls([
    {
      symbol: "✥",
      label: "점 이동 연습 켜기 또는 끄기",
      pressed: false,
      onClick: (button) => {
        const movable = button.getAttribute("aria-pressed") !== "true";
        originPoint.setAttribute({ fixed: !movable });
        button.setAttribute("aria-pressed", String(movable));
      },
    },
    {
      symbol: "↻",
      label: "좌표평면 처음 보기",
      onClick: () => {
        originPoint.setPosition(window.JXG.COORDS_BY_USER, point);
        board.setBoundingBox([-bound, bound, bound, -bound], true);
      },
    },
  ]);
  shell.appendChild(controlsEl);
  shell.classList.add("is-enhanced");
  activeMathToolCleanup = () => window.JXG.JSXGraph.freeBoard(board);
}

function mountJSXLineGraphTool(root, problem) {
  if (!window.JXG) return;
  const visual = problem.visual;
  const { shell, stage } = createMathToolShell(root, "jsxgraph", false);
  const boardId = `jsx-line-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  stage.id = boardId;
  stage.classList.add("jxgbox");
  stage.setAttribute("aria-label", problem.question || visual.title || "조작 가능한 함수 그래프");
  const points = (visual.points || []).map((point, index) => {
    const numericLabel = Number(point.label);
    return [Number.isFinite(numericLabel) ? numericLabel : index + 1, Number(point.value) || 0];
  });
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const maxX = Math.max(5, ...xs) + 1;
  const maxY = Math.max(5, ...ys) + 1;
  const board = window.JXG.JSXGraph.initBoard(boardId, {
    boundingbox: [-1, maxY, maxX, -1],
    axis: true,
    grid: true,
    keepaspectratio: false,
    showNavigation: false,
    showCopyright: false,
    pan: { enabled: true },
    zoom: { enabled: true, wheel: true, pinch: true },
  });
  const curve = board.create("curve", [xs, ys], {
    strokeColor: "#0284c7",
    strokeWidth: 3,
    fixed: true,
  });
  points.forEach(([x, y], index) => {
    board.create("point", [x, y], {
      name: `(${x}, ${y})`,
      fixed: true,
      size: 4,
      fillColor: index === 0 ? "#f59e0b" : "#38bdf8",
      strokeColor: "#075985",
      label: { color: "#172033", fontSize: 12 },
    });
  });
  if (points.length > 1) {
    board.create("glider", [points[0][0], points[0][1], curve], {
      name: "P",
      size: 5,
      fillColor: "#8b5cf6",
      strokeColor: "#5b21b6",
      label: { color: "#5b21b6", fontSize: 13 },
    });
  }
  const controlsEl = mathToolControls([{
    symbol: "↻",
    label: "그래프 처음 보기",
    onClick: () => board.setBoundingBox([-1, maxY, maxX, -1], true),
  }]);
  shell.appendChild(controlsEl);
  shell.classList.add("is-enhanced");
  activeMathToolCleanup = () => window.JXG.JSXGraph.freeBoard(board);
}

function mountChartTool(root, problem) {
  if (!window.Chart) return;
  const visual = problem.visual;
  const { shell, stage } = createMathToolShell(root, "chartjs", false);
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", problem.question || visual.title || "통계 그래프");
  stage.appendChild(canvas);
  const isLine = visual.type === "line-chart";
  const isCircle = visual.type === "circle-chart";
  const source = isLine ? visual.points || [] : visual.items || [];
  const labels = source.map((item) => String(item.label || ""));
  const values = source.map((item) => Number(item.value) || 0);
  const colors = ["#38bdf8", "#22c55e", "#f59e0b", "#8b5cf6", "#fb7185", "#14b8a6"];
  const chart = new window.Chart(canvas, {
    type: isCircle ? "doughnut" : isLine ? "line" : "bar",
    data: {
      labels,
      datasets: [{
        label: visual.unit ? `${visual.title || "자료"} (${visual.unit})` : visual.title || "자료",
        data: values,
        borderColor: isLine ? "#0284c7" : colors,
        backgroundColor: isLine ? "rgba(56, 189, 248, 0.22)" : colors.map((color) => `${color}cc`),
        borderWidth: 2,
        pointRadius: isLine ? 5 : 0,
        pointHoverRadius: isLine ? 7 : 0,
        tension: isLine ? 0.18 : 0,
        fill: isLine,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650 },
      plugins: {
        legend: { display: isCircle, position: "right", labels: { color: "#172033", boxWidth: 14 } },
        title: { display: Boolean(visual.title), text: visual.title || "", color: "#172033", font: { size: 15, weight: "bold" } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}${visual.unit || ""}` } },
      },
      scales: isCircle ? {} : {
        x: { ticks: { color: "#334155" }, grid: { color: "rgba(148,163,184,.18)" } },
        y: {
          beginAtZero: true,
          ticks: { color: "#334155", precision: 0 },
          grid: { color: "rgba(148,163,184,.22)" },
        },
      },
    },
  });
  shell.classList.add("is-enhanced");
  activeMathToolCleanup = () => chart.destroy();
}

function upgradeProfessionalVisual(problem, root) {
  cleanupMathTool();
  const visual = problem && problem.visual;
  if (!visual || !root) return;
  if (["cuboid", "cube-stack", "solid-shape"].includes(visual.type)) {
    void mountThreeMathTool(root, problem, false);
    return;
  }
  if (visual.type === "net-diagram") {
    void mountThreeMathTool(root, problem, true);
    return;
  }
  if (visual.type === "coordinate-plane") {
    mountJSXGraphTool(root, problem);
    return;
  }
  if (visual.type === "line-chart" && /function|direct.proportion/.test(problem.skillId || "")) {
    mountJSXLineGraphTool(root, problem);
    return;
  }
  if (["bar-chart", "line-chart", "circle-chart"].includes(visual.type)) {
    mountChartTool(root, problem);
  }
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

// ── 받아올림·받아내림 세로셈 애니메이션 ──────────────────────────
function ivColumnArithmetic(problem) {
  const expr = problem.expression || "";
  const m = expr.match(/(\d+)\s*([+\-−–])\s*(\d+)/);
  if (!m) return null;
  const a = parseInt(m[1]), b = parseInt(m[3]);
  const isAdd = m[2] === "+";
  if (!isAdd && a < b) return null;
  const ans = isAdd ? a + b : a - b;
  function dig(n, i) { return Math.floor(Math.abs(n) / Math.pow(10, i)) % 10; }
  const numCols = Math.max(String(a).length, String(b).length, String(ans).length);
  if (numCols > 3) return null;
  // 받아올림/받아내림 여부 확인
  let hasCarryBorrow = false;
  if (isAdd) {
    let c = 0;
    for (let i = 0; i < numCols; i++) { const s = dig(a,i)+dig(b,i)+c; c=s>=10?1:0; if(c) hasCarryBorrow=true; }
  } else {
    let borrow = 0;
    for (let i = 0; i < numCols; i++) { const t=dig(a,i)-borrow; if(t<dig(b,i)){hasCarryBorrow=true;borrow=1;}else borrow=0; }
  }
  // 한 자리 수 둘 다 + 올림/내림 없으면 수직선으로; 두 자릿수 이상은 항상 세로셈
  if (!hasCarryBorrow && Math.max(a, b) < 10) return null;
  const W = 400, H = 210;
  const colW = 52;
  const onesX = W / 2 + (numCols - 1) * colW / 2;
  const cx = i => onesX - i * colW;
  const opX = cx(numCols - 1) - colW + 4;
  const Y = { carry: 26, top: 72, bot: 112, line: 126, res: 165, lbl: 200 };
  const els = [];
  let d = 0.05;
  const e = v => escapeHTML(String(v));
  const ft = (x,y,txt,fill,fs,fw,delay) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fs}" font-weight="${fw}" opacity="0" style="animation:iv-fade .3s ease forwards ${delay.toFixed(2)}s both">${e(txt)}</text>`;
  const pt = (x,y,txt,fill,fs,fw,delay) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fs}" font-weight="${fw}" style="transform-box:fill-box;transform-origin:center;animation:iv-pop .4s cubic-bezier(.34,1.56,.64,1) forwards ${delay.toFixed(2)}s both">${e(txt)}</text>`;
  // 제목
  els.push(ft(W/2, 18, isAdd ? "▲ 받아올림 풀이" : "▼ 받아내림 풀이", "#64748b", 11, 700, d));
  d += 0.1;
  // 위 숫자
  for (let i = numCols-1; i >= 0; i--) {
    if (String(a).length > i) { els.push(ft(cx(i), Y.top, dig(a,i), "#1d4ed8", 34, 900, d)); d += 0.1; }
  }
  // 연산자
  els.push(ft(opX, Y.bot, isAdd ? "+" : "−", isAdd ? "#15803d" : "#dc2626", 30, 900, d)); d += 0.06;
  // 아래 숫자
  for (let i = numCols-1; i >= 0; i--) {
    if (String(b).length > i) { els.push(ft(cx(i), Y.bot, dig(b,i), "#1d4ed8", 34, 900, d)); d += 0.1; }
  }
  // 가로선
  d += 0.05;
  els.push(`<line x1="24" y1="${Y.line}" x2="${W-24}" y2="${Y.line}" stroke="#475569" stroke-width="2.5" stroke-dasharray="${W-48}" stroke-dashoffset="${W-48}" style="animation:iv-draw .4s ease forwards ${d.toFixed(2)}s"/>`);
  d += 0.5;
  if (isAdd) {
    // 덧셈: 받아올림 뱃지만 표시 — 결과 자리는 ? 로 숨김
    let carry = 0;
    for (let i = 0; i <= numCols; i++) {
      if (i === numCols && carry === 0) break;
      const ai = i < numCols ? dig(a,i) : 0;
      const bi = i < numCols ? dig(b,i) : 0;
      const sum = ai + bi + carry;
      const newCarry = sum >= 10 ? 1 : 0;
      if (newCarry > 0 && i < numCols) {
        els.push(`<line x1="${cx(i+1)}" y1="${Y.top-14}" x2="${cx(i+1)}" y2="${Y.carry+12}" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="22" stroke-dashoffset="22" opacity="0" style="animation:iv-draw .25s ease forwards ${d.toFixed(2)}s,iv-fade .25s ease forwards ${d.toFixed(2)}s both"/>`);
        els.push(pt(cx(i+1), Y.carry+8, "1", "#fbbf24", 16, 900, d+0.05));
        d += 0.35;
      }
      carry = newCarry;
    }
  } else {
    // 뺄셈: 받아내림 화살표·뱃지만 표시 — 결과 자리는 ? 로 숨김
    let borrow = 0;
    for (let i = 0; i < numCols; i++) {
      const topRaw = dig(a,i) - borrow;
      const needsBorrow = i < numCols-1 && topRaw < dig(b,i);
      if (needsBorrow) {
        const x1 = cx(i+1), x2 = cx(i), mx = (x1+x2)/2;
        els.push(`<path d="M${x1} ${Y.top-6} Q${mx} ${Y.top-28} ${x2} ${Y.top-6}" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="65" stroke-dashoffset="65" opacity="0" style="animation:iv-draw .35s ease forwards ${d.toFixed(2)}s,iv-fade .35s ease forwards ${d.toFixed(2)}s both"/>`);
        els.push(pt(cx(i+1), Y.carry+8, "−1", "#fb923c", 14, 900, d+0.1));
        els.push(pt(cx(i), Y.carry+8, "+10", "#fbbf24", 14, 900, d+0.18));
        d += 0.5;
      }
      borrow = needsBorrow ? 1 : 0;
    }
  }
  // 결과 자리: ? 박스 (정답 숨김)
  const resBoxL = cx(String(ans).length - 1) - colW/2;
  const resBoxR = cx(0) + colW/2;
  els.push(`<rect x="${resBoxL}" y="${Y.res-28}" width="${resBoxR-resBoxL}" height="36" rx="6" fill="rgba(34,197,94,.12)" stroke="rgba(34,197,94,.55)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0" style="animation:iv-fade .3s ease forwards ${d.toFixed(2)}s both"/>`);
  els.push(pt(W/2, Y.res, "?", "#16a34a", 28, 900, d)); d += 0.25;
  // 정리 레이블 (정답 숨김)
  els.push(ft(W/2, Y.lbl, `${a} ${isAdd ? "+" : "−"} ${b} = □`, "#64748b", 10, 700, d+0.1));
  return svgWrap(W, H, isAdd ? "받아올림 덧셈 풀이" : "받아내림 뺄셈 풀이", els.join(""));
}

// ── 세로셈 곱셈 (받아올림 포함) ─────────────────────────────────
function ivColumnMul(problem) {
  const expr = problem.expression || "";
  const m = expr.match(/(\d+)\s*[×x]\s*(\d+)/);
  if (!m) return null;
  let a = parseInt(m[1]), b = parseInt(m[2]);
  if (String(b).length > String(a).length) [a, b] = [b, a];
  const ans = a * b;
  const aLen = String(a).length, bLen = String(b).length;
  if (aLen > 3 || bLen > 2 || ans > 9999) return null;
  function dig(n, i) { return Math.floor(Math.abs(n) / Math.pow(10, i)) % 10; }
  const twoDigMul = bLen === 2;
  const W = 400, H = twoDigMul ? 275 : 215;
  const colW = 50, ansCols = String(ans).length;
  const numCols = Math.max(aLen, bLen, ansCols) + 1;
  const onesX = W / 2 + (numCols - 1) * colW / 2;
  const cx = i => onesX - i * colW;
  const opX = cx(Math.max(aLen, bLen) - 1) - colW + 6;
  const Y = { title:18, carry:30, top:70, bot:110, line1:124,
    p1: twoDigMul ? 160 : 165, p2: twoDigMul ? 200 : 0,
    line2: twoDigMul ? 215 : 0,
    res: twoDigMul ? 248 : 165, lbl: twoDigMul ? 265 : 200 };
  const els = [], ev = v => escapeHTML(String(v));
  let d = 0.05;
  const ft = (x,y,t,fill,fs,fw,dl) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fs}" font-weight="${fw}" opacity="0" style="animation:iv-fade .3s ease forwards ${dl.toFixed(2)}s both">${ev(t)}</text>`;
  const pt = (x,y,t,fill,fs,fw,dl) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fs}" font-weight="${fw}" style="transform-box:fill-box;transform-origin:center;animation:iv-pop .4s cubic-bezier(.34,1.56,.64,1) forwards ${dl.toFixed(2)}s both">${ev(t)}</text>`;
  els.push(ft(W/2, Y.title, "▲ 세로셈 곱셈", "#64748b", 11, 700, d)); d += 0.1;
  for (let i = aLen-1; i >= 0; i--) { els.push(ft(cx(i), Y.top, dig(a,i), "#1d4ed8", 34, 900, d)); d += 0.1; }
  els.push(ft(opX, Y.bot, "×", "#7c3aed", 30, 900, d)); d += 0.06;
  for (let i = bLen-1; i >= 0; i--) { els.push(ft(cx(i), Y.bot, dig(b,i), "#1d4ed8", 34, 900, d)); d += 0.1; }
  d += 0.05;
  els.push(`<line x1="24" y1="${Y.line1}" x2="${W-24}" y2="${Y.line1}" stroke="#475569" stroke-width="2.5" stroke-dasharray="${W-48}" stroke-dashoffset="${W-48}" style="animation:iv-draw .4s ease forwards ${d.toFixed(2)}s"/>`);
  d += 0.5;
  if (!twoDigMul) {
    // 1자리 곱수: 받아올림 뱃지만 표시 — 결과 자리는 ? 로 숨김
    let carry = 0;
    for (let i = 0; i <= aLen; i++) {
      if (i === aLen && carry === 0) break;
      const ai = i < aLen ? dig(a,i) : 0;
      const prod = ai * b + carry;
      const nc = Math.floor(prod / 10);
      if (nc > 0 && i < aLen) {
        els.push(`<line x1="${cx(i+1)}" y1="${Y.top-14}" x2="${cx(i+1)}" y2="${Y.carry+12}" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="22" stroke-dashoffset="22" opacity="0" style="animation:iv-draw .25s ease forwards ${d.toFixed(2)}s,iv-fade .25s ease forwards ${d.toFixed(2)}s both"/>`);
        els.push(pt(cx(i+1), Y.carry+8, nc, "#fbbf24", 16, 900, d+0.05)); d += 0.35;
      }
      carry = nc;
    }
  } else {
    // 2자리 곱수: 부분곱 두 줄 표시 (교육적 스캐폴딩) — 최종 합계는 ? 로 숨김
    const p1 = a * dig(b,0), p2 = a * dig(b,1);
    const p1s = String(p1), p2s = String(p2);
    for (let i = p1s.length-1; i >= 0; i--) { els.push(pt(cx(i), Y.p1, dig(p1,i), "#15803d", 30, 900, d)); d += 0.12; }
    for (let i = p2s.length-1; i >= 0; i--) { els.push(pt(cx(i+1), Y.p2, dig(p2,i), "#dc2626", 30, 900, d)); d += 0.12; }
    els.push(ft(cx(0), Y.p2, "0", "#64748b", 26, 700, d-0.12));
    d += 0.08;
    els.push(`<line x1="24" y1="${Y.line2}" x2="${W-24}" y2="${Y.line2}" stroke="#475569" stroke-width="2" stroke-dasharray="${W-48}" stroke-dashoffset="${W-48}" style="animation:iv-draw .35s ease forwards ${d.toFixed(2)}s"/>`);
    d += 0.45;
  }
  // 결과 자리: ? 박스 (정답 숨김)
  const resBoxL = cx(ansCols - 1) - colW/2;
  const resBoxR = cx(0) + colW/2;
  els.push(`<rect x="${resBoxL}" y="${Y.res-28}" width="${resBoxR-resBoxL}" height="36" rx="6" fill="rgba(34,197,94,.12)" stroke="rgba(34,197,94,.55)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0" style="animation:iv-fade .3s ease forwards ${d.toFixed(2)}s both"/>`);
  els.push(pt(W/2, Y.res, "?", "#16a34a", 28, 900, d)); d += 0.25;
  // 정리 레이블 (정답 숨김)
  els.push(ft(W/2, Y.lbl, `${m[1]} × ${m[2]} = □`, "#64748b", 10, 700, d+0.1));
  return svgWrap(W, H, "세로셈 곱셈 풀이", els.join(""));
}

// ── 세로셈 나눗셈 (긴 나눗셈) ────────────────────────────────────
function ivColumnDiv(problem) {
  const expr = problem.expression || "";
  const m = expr.match(/(\d+)\s*[÷/]\s*(\d+)/);
  if (!m) return null;
  const dvd = parseInt(m[1]), dvs = parseInt(m[2]);
  if (dvs === 0 || dvd > 9999 || dvs > 99) return null;
  const quot = Math.floor(dvd / dvs), rem = dvd % dvs;
  if (String(quot).length > 3) return null;
  const dvdStr = String(dvd), dLen = dvdStr.length;
  // 긴 나눗셈 스텝 계산
  const steps = [];
  let cur = 0;
  for (let i = 0; i < dLen; i++) {
    cur = cur * 10 + parseInt(dvdStr[i]);
    const q = Math.floor(cur / dvs), sub = q * dvs, r = cur - sub;
    steps.push({ q, sub, rem: r, didx: i });
    cur = r;
  }
  const W = 400, colW = 46;
  const dvsW = String(dvs).length * 22 + 8;
  const brkX = dvsW + 30;               // 세로선 X
  const dColX = i => brkX + 12 + i * colW + colW / 2;
  const brkTopY = 48, dividY = 80;
  const rowSp = 34;
  const H = Math.min(280, dividY + (steps.length * 2 + 1) * rowSp + 36);
  const els = [], ev = v => escapeHTML(String(v));
  let d = 0.05;
  const ft = (x,y,t,fill,fs,fw,dl) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fs}" font-weight="${fw}" opacity="0" style="animation:iv-fade .3s ease forwards ${dl.toFixed(2)}s both">${ev(t)}</text>`;
  const pt = (x,y,t,fill,fs,fw,dl) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fs}" font-weight="${fw}" style="transform-box:fill-box;transform-origin:center;animation:iv-pop .4s cubic-bezier(.34,1.56,.64,1) forwards ${dl.toFixed(2)}s both">${ev(t)}</text>`;
  els.push(ft(W/2, 18, "▼ 세로셈 나눗셈 풀이", "#64748b", 11, 700, d)); d += 0.1;
  // 제수
  els.push(ft(dvsW/2 + 14, dividY, dvs, "#dc2626", 28, 900, d)); d += 0.1;
  // ⌐ 괄호 (가로선 + 세로선)
  const brkRight = brkX + 12 + dLen * colW + 6;
  els.push(`<line x1="${brkX}" y1="${brkTopY}" x2="${brkRight}" y2="${brkTopY}" stroke="#475569" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${brkRight-brkX}" stroke-dashoffset="${brkRight-brkX}" style="animation:iv-draw .45s ease forwards ${d.toFixed(2)}s"/>`);
  els.push(`<line x1="${brkX}" y1="${brkTopY}" x2="${brkX}" y2="${dividY+10}" stroke="#475569" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="50" stroke-dashoffset="50" style="animation:iv-draw .3s ease forwards ${(d+0.2).toFixed(2)}s"/>`);
  d += 0.6;
  // 피제수 숫자
  for (let i = 0; i < dLen; i++) { els.push(ft(dColX(i), dividY, dvdStr[i], "#1d4ed8", 28, 900, d)); d += 0.1; }
  d += 0.1;
  // 몫 자리: ? 박스 표시 (정답 숨김)
  const quotStr = String(quot);
  const qOffset = dLen - quotStr.length;
  const qBoxL = dColX(qOffset) - colW/2;
  const qBoxR = dColX(qOffset + quotStr.length - 1) + colW/2;
  els.push(`<rect x="${qBoxL}" y="${brkTopY-26}" width="${qBoxR-qBoxL}" height="30" rx="5" fill="rgba(34,197,94,.12)" stroke="rgba(34,197,94,.55)" stroke-width="1.3" stroke-dasharray="4,3" opacity="0" style="animation:iv-fade .25s ease forwards ${d.toFixed(2)}s both"/>`);
  els.push(pt((qBoxL+qBoxR)/2, brkTopY-6, "?", "#16a34a", 22, 900, d)); d += 0.2;
  d += 0.15;
  // 스텝 애니메이션: 빼기 + 나머지 + bring-down
  let rowY = dividY + rowSp;
  for (let si = 0; si < steps.length; si++) {
    const step = steps[si];
    // 빼기 값 표시
    const subStr = String(step.sub);
    const subStart = step.didx - subStr.length + 1;
    for (let j = 0; j < subStr.length; j++) {
      els.push(ft(dColX(subStart + j), rowY, subStr[j], "#64748b", 26, 700, d)); d += 0.08;
    }
    // 빼기 선
    const lx1 = dColX(subStart) - colW/2, lx2 = dColX(step.didx) + colW/2;
    els.push(`<line x1="${lx1}" y1="${rowY+10}" x2="${lx2}" y2="${rowY+10}" stroke="#475569" stroke-width="1.5" stroke-dasharray="${lx2-lx1}" stroke-dashoffset="${lx2-lx1}" style="animation:iv-draw .22s ease forwards ${d.toFixed(2)}s"/>`);
    d += 0.3; rowY += rowSp;
    if (si < steps.length - 1) {
      // 나머지 표시 (0이면 생략)
      if (step.rem > 0) { els.push(ft(dColX(step.didx), rowY, step.rem, "#64748b", 26, 700, d)); d += 0.08; }
      // bring-down 화살표
      const bdX = dColX(step.didx + 1);
      els.push(`<path d="M${bdX} ${dividY+14} L${bdX} ${rowY-4}" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="36" stroke-dashoffset="36" opacity="0" style="animation:iv-draw .2s ease forwards ${d.toFixed(2)}s,iv-fade .2s ease forwards ${d.toFixed(2)}s both"/>`);
      els.push(`<polygon points="${bdX},${rowY-2} ${bdX-5},${rowY-11} ${bdX+5},${rowY-11}" fill="#fbbf24" opacity="0" style="animation:iv-fade .2s ease forwards ${(d+0.15).toFixed(2)}s both"/>`);
      d += 0.3;
      els.push(pt(bdX, rowY, parseInt(dvdStr[step.didx + 1]), "#fbbf24", 26, 900, d)); d += 0.18;
    } else {
      // 최종 나머지
      const clr = step.rem === 0 ? "#16a34a" : "#b45309";
      els.push(pt(dColX(step.didx), rowY, step.rem, clr, 28, 900, d)); d += 0.25;
      if (step.rem > 0) els.push(ft(dColX(step.didx) + 52, rowY, `나머지 ${step.rem}`, "#b45309", 11, 700, d));
    }
  }
  els.push(ft(W/2, H-13, `${dvd} ÷ ${dvs} = □`, "#64748b", 10, 700, d+0.1));
  return svgWrap(W, H, "세로셈 나눗셈 풀이", els.join(""));
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

// ── 수 가르기/모으기 (number-bond) ──────────────────────────
function ivNumberBond(v, problem) {
  const total = v.total || 10;
  const left = v.left !== undefined ? v.left : "□";
  const right = v.right !== undefined ? v.right : "□";
  const W = 400, H = 130;
  const cx = W / 2, topY = 28, botY = 92, sideX = 72;
  const isLQ = String(left) === "□" || String(left) === "?";
  const isRQ = String(right) === "□" || String(right) === "?";
  const isTQ = String(total) === "□" || String(total) === "?";
  return svgWrap(W, H, "수 가르기",
    `<line x1="${cx}" y1="${topY+16}" x2="${cx-sideX}" y2="${botY-16}" stroke="#94a3b8" stroke-width="2" opacity="0" style="animation:iv-fade .3s ease .2s both"/>
<line x1="${cx}" y1="${topY+16}" x2="${cx+sideX}" y2="${botY-16}" stroke="#94a3b8" stroke-width="2" opacity="0" style="animation:iv-fade .3s ease .2s both"/>
<circle cx="${cx}" cy="${topY}" r="18" fill="${isTQ?'rgba(56,189,248,.14)':'rgba(56,189,248,.22)'}" stroke="#38bdf8" stroke-width="2" class="iv-pop" style="animation-delay:0s;transform-origin:${cx}px ${topY}px"/>
<text x="${cx}" y="${topY+5}" text-anchor="middle" fill="${isTQ?'#38bdf8':'#bae6fd'}" font-size="14" font-weight="700" class="iv-pop" style="animation-delay:.05s;transform-origin:${cx}px ${topY}px">${escapeHTML(String(total))}</text>
<circle cx="${cx-sideX}" cy="${botY}" r="16" fill="${isLQ?'rgba(56,189,248,.14)':'rgba(34,197,94,.22)'}" stroke="${isLQ?'#38bdf8':'#22c55e'}" stroke-width="2" class="iv-pop" style="animation-delay:.35s;transform-origin:${cx-sideX}px ${botY}px"/>
<text x="${cx-sideX}" y="${botY+5}" text-anchor="middle" fill="${isLQ?'#38bdf8':'#86efac'}" font-size="14" font-weight="700" class="iv-pop" style="animation-delay:.4s;transform-origin:${cx-sideX}px ${botY}px">${escapeHTML(String(left))}</text>
<circle cx="${cx+sideX}" cy="${botY}" r="16" fill="${isRQ?'rgba(56,189,248,.14)':'rgba(251,146,60,.22)'}" stroke="${isRQ?'#38bdf8':'#fb923c'}" stroke-width="2" class="iv-pop" style="animation-delay:.45s;transform-origin:${cx+sideX}px ${botY}px"/>
<text x="${cx+sideX}" y="${botY+5}" text-anchor="middle" fill="${isRQ?'#38bdf8':'#fed7aa'}" font-size="14" font-weight="700" class="iv-pop" style="animation-delay:.5s;transform-origin:${cx+sideX}px ${botY}px">${escapeHTML(String(right))}</text>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"수 가르기 모형")}</text>`);
}

// ── 자 (ruler) ──────────────────────────────────────────────
function ivRuler(v, problem) {
  const length = v.length || 10;
  const unit = v.unit || "cm";
  const max = v.max || Math.max(length * 2, 20);
  const W = 400, H = 100;
  const margin = 30, rulerW = W - margin * 2;
  const scale = rulerW / max;
  const ticks = [];
  for (let i = 0; i <= max; i++) {
    const x = (margin + i * scale).toFixed(1);
    const isMajor = i % 5 === 0, isEnd = i === length;
    ticks.push(`<line x1="${x}" y1="40" x2="${x}" y2="${40+(isMajor?12:7)}" stroke="${isEnd?'#f59e0b':'#475569'}" stroke-width="${isEnd?2:1}"/>`);
    if (isMajor) ticks.push(`<text x="${x}" y="62" text-anchor="middle" fill="${isEnd?'#fde68a':'#64748b'}" font-size="9" font-weight="${isEnd?700:400}">${i}</text>`);
  }
  return svgWrap(W, H, "자",
    `<rect x="${margin}" y="32" width="${rulerW}" height="20" rx="3" fill="rgba(255,255,255,.04)" stroke="#334155" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease both"/>
${ticks.join("")}
<rect x="${margin}" y="28" width="${(length*scale).toFixed(1)}" height="4" rx="2" fill="#f59e0b" opacity="0" style="animation:iv-fade .5s ease .4s both"/>
<text x="${(margin+length*scale/2).toFixed(1)}" y="22" text-anchor="middle" fill="#fde68a" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .6s both">${length}${unit}</text>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||`${length}${unit}`)}</text>`);
}

// ── 시계 (clock) ─────────────────────────────────────────────
function ivClock(v, problem) {
  const hour = v.hour || 3, minute = v.minute || 0;
  const W = 400, H = 140;
  const cx = W / 2, cy = 65, r = 48;
  const hRad = ((hour % 12 + minute / 60) * 30 - 90) * Math.PI / 180;
  const mRad = (minute * 6 - 90) * Math.PI / 180;
  const hx = (cx + r * 0.55 * Math.cos(hRad)).toFixed(1), hy = (cy + r * 0.55 * Math.sin(hRad)).toFixed(1);
  const mx = (cx + r * 0.75 * Math.cos(mRad)).toFixed(1), my = (cy + r * 0.75 * Math.sin(mRad)).toFixed(1);
  const nums = Array.from({length:12}, (_,i) => {
    const a = ((i+1)*30-90)*Math.PI/180;
    return `<text x="${(cx+Math.cos(a)*(r-11)).toFixed(1)}" y="${(cy+Math.sin(a)*(r-11)+4).toFixed(1)}" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="700">${i+1}</text>`;
  });
  return svgWrap(W, H, "시계",
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(30,41,59,.8)" stroke="#475569" stroke-width="2.5" class="iv-pop" style="transform-origin:${cx}px ${cy}px"/>
${nums.join("")}
<line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#bae6fd" stroke-width="3.5" stroke-linecap="round" opacity="0" style="animation:iv-fade .3s ease .5s both"/>
<line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#22c55e" stroke-width="2" stroke-linecap="round" opacity="0" style="animation:iv-fade .3s ease .6s both"/>
<circle cx="${cx}" cy="${cy}" r="3.5" fill="#f8fafc" class="iv-pop" style="animation-delay:.7s;transform-origin:${cx}px ${cy}px"/>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||`${hour}시 ${minute>0?minute+'분':'정각'}`)}</text>`);
}

// ── 대칭 도형 (symmetry-shape) ───────────────────────────────
function ivSymmetryShape(v, problem) {
  const shape = v.shape || "rectangle";
  const W = 400, H = 130, cx = W/2, cy = 60;
  let shapeEl;
  if (shape === "triangle") {
    shapeEl = `<polygon points="${cx},${cy-38} ${cx-44},${cy+32} ${cx+44},${cy+32}" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease both"/>`;
  } else if (shape === "square") {
    shapeEl = `<rect x="${cx-36}" y="${cy-36}" width="72" height="72" rx="4" fill="rgba(56,189,248,.12)" stroke="#38bdf8" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease both"/>`;
  } else {
    shapeEl = `<rect x="${cx-52}" y="${cy-28}" width="104" height="56" rx="4" fill="rgba(56,189,248,.12)" stroke="#38bdf8" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease both"/>`;
  }
  return svgWrap(W, H, "대칭 도형",
    `${shapeEl}
<line x1="${cx}" y1="8" x2="${cx}" y2="${H-16}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,4" opacity="0" style="animation:iv-fade .4s ease .5s both"/>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"대칭축 (노란 점선)")}</text>`);
}

// ── 도형 규칙 패턴 (shape-pattern) ──────────────────────────
function ivShapePattern(v, problem) {
  const items = (v.items || ["○","△","○","△","?"]).slice(0, 8);
  const W = 400, H = 100;
  const cw = Math.min(44, (W-40)/items.length);
  const ox = (W - items.length*cw)/2;
  const els = items.map((sym,i) => {
    const x = (ox+i*cw+cw/2).toFixed(1);
    const isQ = String(sym)==="?"||String(sym)==="□";
    return `<text x="${x}" y="60" text-anchor="middle" font-size="${isQ?22:18}" fill="${isQ?'#38bdf8':'#94a3b8'}" opacity="0" style="animation:iv-fade .3s ease ${(0.1+i*.1).toFixed(2)}s both">${escapeHTML(String(sym))}</text>`;
  });
  return svgWrap(W, H, "도형 패턴",
    `${els.join("")}
<text x="${W/2}" y="85" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"규칙을 찾아 ?를 채우세요")}</text>`);
}

// ── 원 무늬 패턴 (circle-pattern) ────────────────────────────
function ivCirclePattern(v, problem) {
  const circles = Math.min(v.circles||6, 10);
  const dotR = Math.min(v.radius||5, 22);
  const W = 400, H = 120, cx = W/2, cy = H/2;
  const bigR = Math.min(38, (W-60)/3);
  const els = [`<circle cx="${cx}" cy="${cy}" r="${bigR}" fill="none" stroke="#38bdf8" stroke-width="2" class="iv-pop" style="animation-delay:0s;transform-origin:${cx}px ${cy}px"/>`];
  for (let i=0; i<circles; i++) {
    const a = (i/circles)*2*Math.PI;
    const ox = (cx+(bigR+dotR+4)*Math.cos(a)).toFixed(1);
    const oy = (cy+(bigR+dotR+4)*Math.sin(a)).toFixed(1);
    els.push(`<circle cx="${ox}" cy="${oy}" r="${dotR}" fill="rgba(56,189,248,.18)" stroke="#38bdf8" stroke-width="1.5" class="iv-pop" style="animation-delay:${(0.1+i*.08).toFixed(2)}s;transform-origin:${ox}px ${oy}px"/>`);
  }
  return svgWrap(W, H, "원 무늬",
    `${els.join("")}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"원을 이용한 무늬")}</text>`);
}

// ── 원 (circle-diagram) ──────────────────────────────────────
function ivCircleDiagram(v, problem) {
  const radius = v.radius||5, unit = v.unit||"cm", mode = v.mode||"radius";
  const W = 400, H = 140, cx = W/2, cy = 65, r = 44;
  return svgWrap(W, H, "원",
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(56,189,248,.1)" stroke="#38bdf8" stroke-width="2" class="iv-pop" style="transform-origin:${cx}px ${cy}px"/>
<line x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="${r}" stroke-dashoffset="${r}" style="animation:iv-draw .5s ease .5s both"/>
${mode==="diameter"?`<line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="${2*r}" stroke-dashoffset="${2*r}" style="animation:iv-draw .5s ease .7s both"/>`:''}
<circle cx="${cx}" cy="${cy}" r="3.5" fill="#38bdf8" class="iv-pop" style="animation-delay:.4s;transform-origin:${cx}px ${cy}px"/>
<text x="${cx+r/2}" y="${cy-8}" text-anchor="middle" fill="#fde68a" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .8s both">r=${radius}${unit}</text>
${mode==="diameter"?`<text x="${cx}" y="${cy+22}" text-anchor="middle" fill="#86efac" font-size="10" opacity="0" style="animation:iv-fade .3s ease 1s both">지름=${radius*2}${unit}</text>`:''}
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||`반지름 ${radius}${unit}`)}</text>`);
}

// ── 각도 (angle-diagram) ─────────────────────────────────────
function ivAngleDiagram(v, problem) {
  const deg = Math.max(1, Math.min(v.degrees||90, 359));
  const W = 400, H = 140, cx = 90, cy = 112, armLen = 82;
  const rad = deg*Math.PI/180;
  const ex = (cx+armLen*Math.cos(-rad)).toFixed(1), ey = (cy+armLen*Math.sin(-rad)).toFixed(1);
  const arcR = 36, largeArc = deg>180?1:0;
  const arcEx = (cx+arcR*Math.cos(-rad)).toFixed(1), arcEy = (cy+arcR*Math.sin(-rad)).toFixed(1);
  const isRight = deg===90;
  const rightMark = isRight ? `<rect x="${cx}" y="${cy-10}" width="10" height="10" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0" style="animation:iv-fade .3s ease .7s both"/>` : '';
  return svgWrap(W, H, "각도",
    `<line x1="${cx}" y1="${cy}" x2="${cx+armLen}" y2="${cy}" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" opacity="0" style="animation:iv-fade .4s ease .1s both"/>
<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" opacity="0" style="animation:iv-fade .4s ease .4s both"/>
<path d="M ${cx+arcR} ${cy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEx} ${arcEy}" fill="rgba(245,158,11,.15)" stroke="#f59e0b" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .6s both"/>
${rightMark}
<text x="${cx+58}" y="${cy-28}" fill="#fde68a" font-size="14" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .7s both">${deg}°</text>
<text x="${W/2+30}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||`${deg}도 각도`)}</text>`);
}

// ── 평행/수직 (parallel-lines) ───────────────────────────────
function ivParallelLines(v, problem) {
  const mode = v.mode||"parallel";
  const W = 400, H = 130;
  const linesEl = mode==="parallel"
    ? `<line x1="60" y1="45" x2="340" y2="45" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="280" stroke-dashoffset="280" style="animation:iv-draw .5s ease .1s both"/>
<line x1="60" y1="88" x2="340" y2="88" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="280" stroke-dashoffset="280" style="animation:iv-draw .5s ease .4s both"/>
<text x="${W/2}" y="72" text-anchor="middle" fill="#94a3b8" font-size="11" opacity="0" style="animation:iv-fade .3s ease .7s both">// 평행</text>`
    : `<line x1="200" y1="22" x2="200" y2="108" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="86" stroke-dashoffset="86" style="animation:iv-draw .5s ease .1s both"/>
<line x1="80" y1="65" x2="320" y2="65" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="240" stroke-dashoffset="240" style="animation:iv-draw .5s ease .4s both"/>
<rect x="200" y="65" width="8" height="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0" style="animation:iv-fade .3s ease .7s both"/>
<text x="${W/2}" y="${H-10}" text-anchor="middle" fill="#94a3b8" font-size="10" opacity="0" style="animation:iv-fade .3s ease .8s both">⊥ 수직</text>`;
  return svgWrap(W, H, mode==="parallel"?"평행":"수직",
    `${linesEl}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"")}</text>`);
}

// ── 사각형 분류 (quadrilateral-diagram) ──────────────────────
function ivQuadrilateralDiagram(v, problem) {
  const kind = v.kind||"parallelogram";
  const W = 400, H = 130, cx = W/2, cy = 62;
  const ptsMap = {
    parallelogram:`${cx-55},${cy+30} ${cx+35},${cy+30} ${cx+55},${cy-30} ${cx-35},${cy-30}`,
    rhombus:`${cx},${cy-40} ${cx+45},${cy} ${cx},${cy+40} ${cx-45},${cy}`,
    trapezoid:`${cx-30},${cy-28} ${cx+30},${cy-28} ${cx+55},${cy+28} ${cx-55},${cy+28}`,
    rectangle:`${cx-55},${cy-28} ${cx+55},${cy-28} ${cx+55},${cy+28} ${cx-55},${cy+28}`,
    square:`${cx-35},${cy-35} ${cx+35},${cy-35} ${cx+35},${cy+35} ${cx-35},${cy+35}`,
  };
  const lbl = {parallelogram:"평행사변형",rhombus:"마름모",trapezoid:"사다리꼴",rectangle:"직사각형",square:"정사각형"};
  const pts = ptsMap[kind]||ptsMap.parallelogram;
  return svgWrap(W, H, lbl[kind]||kind,
    `<polygon points="${pts}" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="2" style="stroke-dasharray:220;stroke-dashoffset:220;animation:iv-draw .7s ease both"/>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .8s both">${lbl[kind]||kind}</text>`);
}

// ── 다각형 (polygon-diagram) ─────────────────────────────────
function ivPolygonDiagram(v, problem) {
  const sides = Math.max(3, Math.min(v.sides||5, 10));
  const W = 400, H = 130, cx = W/2, cy = 60, r = 46;
  const pts = Array.from({length:sides}, (_,i) => {
    const a = (i/sides)*2*Math.PI - Math.PI/2;
    return `${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const names = {3:"삼각형",4:"사각형",5:"오각형",6:"육각형",7:"칠각형",8:"팔각형",9:"구각형",10:"십각형"};
  return svgWrap(W, H, names[sides]||`${sides}각형`,
    `<polygon points="${pts}" fill="rgba(56,189,248,.1)" stroke="#38bdf8" stroke-width="2" style="stroke-dasharray:${(2*Math.PI*r).toFixed(0)};stroke-dashoffset:${(2*Math.PI*r).toFixed(0)};animation:iv-draw .8s ease both"/>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${sides}개 꼭짓점 · ${sides}개 변 · ${names[sides]||sides+'각형'}</text>`);
}

// ── 수의 범위 (range-line) ───────────────────────────────────
function ivRangeLine(v, problem) {
  const start = v.start||10, end = v.end||20;
  const leftInc = v.leftInclusive!==false, rightInc = v.rightInclusive!==false;
  const W = 400, H = 100, margin = 50;
  const span = end - start;
  const lo = start - Math.max(3, Math.round(span*0.3));
  const hi = end + Math.max(3, Math.round(span*0.3));
  const X = n => margin + (n-lo)/(hi-lo)*(W-margin*2);
  const sx = X(start).toFixed(1), ex = X(end).toFixed(1);
  const ticks = [];
  for (let i=lo; i<=hi; i++) {
    const x = X(i).toFixed(1), isMark = i===start||i===end, isMajor = isMark||i%5===0;
    ticks.push(`<line x1="${x}" y1="${isMark?38:42}" x2="${x}" y2="${isMajor?50:48}" stroke="${isMark?'#f59e0b':'#475569'}" stroke-width="${isMark?2:1}"/>`);
    if (isMajor) ticks.push(`<text x="${x}" y="63" text-anchor="middle" fill="${isMark?'#fde68a':'#64748b'}" font-size="9" font-weight="${isMark?700:400}">${i}</text>`);
  }
  return svgWrap(W, H, "수의 범위",
    `<line x1="${margin-10}" y1="45" x2="${W-margin+10}" y2="45" stroke="#334155" stroke-width="1.5" stroke-dasharray="${W-margin*2+20}" stroke-dashoffset="${W-margin*2+20}" style="animation:iv-draw .5s ease both"/>
${ticks.join("")}
<rect x="${sx}" y="37" width="${(+ex-+sx).toFixed(1)}" height="17" rx="3" fill="rgba(245,158,11,.2)" stroke="#f59e0b" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .4s both"/>
<circle cx="${sx}" cy="45" r="6" fill="${leftInc?'#f59e0b':'none'}" stroke="#f59e0b" stroke-width="2" class="iv-pop" style="animation-delay:.5s;transform-origin:${sx}px 45px"/>
<circle cx="${ex}" cy="45" r="6" fill="${rightInc?'#f59e0b':'none'}" stroke="#f59e0b" stroke-width="2" class="iv-pop" style="animation-delay:.6s;transform-origin:${ex}px 45px"/>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${leftInc?'[':'('} ${start} ~ ${end} ${rightInc?']':')'} · ${escapeHTML(v.title||"수의 범위")}</text>`);
}

// ── 꺾은선 그래프 (line-chart) ───────────────────────────────
function ivLineChart(v, problem) {
  if (!v||!v.points) return ivExpressionBox(problem);
  const pts = v.points.slice(0,8);
  const maxVal = Math.max(...pts.map(p=>p.value||0),1);
  const W = 400, H = 140, sx = 50, ex2 = W-30, sy = 20, ey2 = 105;
  const pw = (ex2-sx)/Math.max(pts.length-1,1), ph = ey2-sy;
  const cpts = pts.map((p,i) => ({
    x:(sx+i*pw).toFixed(1), y:(ey2-(p.value||0)/maxVal*ph).toFixed(1), ...p
  }));
  const pathD = cpts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(" ");
  const pathLen = cpts.reduce((s,p,i)=>i===0?0:s+Math.hypot(+p.x-+cpts[i-1].x,+p.y-+cpts[i-1].y),0);
  return svgWrap(W, H, "꺾은선 그래프",
    `<line x1="${sx}" y1="${sy}" x2="${sx}" y2="${ey2}" stroke="#334155" stroke-width="1.5"/>
<line x1="${sx}" y1="${ey2}" x2="${ex2}" y2="${ey2}" stroke="#334155" stroke-width="1.5"/>
<path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:${pathLen.toFixed(0)};stroke-dashoffset:${pathLen.toFixed(0)};animation:iv-draw .8s ease .2s both"/>
${cpts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#38bdf8" class="iv-pop" style="animation-delay:${(0.5+i*.1).toFixed(2)}s;transform-origin:${p.x}px ${p.y}px"/>
<text x="${p.x}" y="118" text-anchor="middle" fill="#475569" font-size="7">${escapeHTML(String(p.label||i+1))}</text>`).join("")}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"꺾은선 그래프")}</text>`);
}

// ── 직육면체 (cuboid) ────────────────────────────────────────
function ivCuboid(v, problem) {
  const W = 400, H = 140, w = Math.min(v.width||8,20), d = Math.min(v.depth||5,15), h = Math.min(v.height||6,18);
  const unit = v.unit||"cm", sc = 5;
  const rw = w*sc, rd = d*sc*0.5, rh = h*sc;
  const ox = W/2-rw/2-rd/2, oy = H/2+rh/2;
  const front = `${ox.toFixed(1)},${oy.toFixed(1)} ${(ox+rw).toFixed(1)},${oy.toFixed(1)} ${(ox+rw).toFixed(1)},${(oy-rh).toFixed(1)} ${ox.toFixed(1)},${(oy-rh).toFixed(1)}`;
  const top = `${ox.toFixed(1)},${(oy-rh).toFixed(1)} ${(ox+rw).toFixed(1)},${(oy-rh).toFixed(1)} ${(ox+rw+rd).toFixed(1)},${(oy-rh-rd*.8).toFixed(1)} ${(ox+rd).toFixed(1)},${(oy-rh-rd*.8).toFixed(1)}`;
  const right = `${(ox+rw).toFixed(1)},${oy.toFixed(1)} ${(ox+rw+rd).toFixed(1)},${(oy-rd*.8).toFixed(1)} ${(ox+rw+rd).toFixed(1)},${(oy-rh-rd*.8).toFixed(1)} ${(ox+rw).toFixed(1)},${(oy-rh).toFixed(1)}`;
  return svgWrap(W, H, "직육면체",
    `<polygon points="${front}" fill="rgba(56,189,248,.15)" stroke="#38bdf8" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .1s both"/>
<polygon points="${top}" fill="rgba(56,189,248,.25)" stroke="#38bdf8" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .3s both"/>
<polygon points="${right}" fill="rgba(56,189,248,.1)" stroke="#38bdf8" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .5s both"/>
<text x="${(ox+rw/2).toFixed(1)}" y="${(oy+14).toFixed(1)}" text-anchor="middle" fill="#bae6fd" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .6s both">${w}${unit}</text>
<text x="${(ox+rw+rd/2+6).toFixed(1)}" y="${(oy-rd*.4+4).toFixed(1)}" fill="#bae6fd" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .7s both">${d}${unit}</text>
<text x="${(ox-12).toFixed(1)}" y="${(oy-rh/2+4).toFixed(1)}" text-anchor="end" fill="#bae6fd" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .8s both">${h}${unit}</text>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"직육면체 (부피=가로×세로×높이)")}</text>`);
}

// ── 복합도형 (composite-rect) ────────────────────────────────
function ivCompositeRect(v, problem) {
  const W = 400, H = 140;
  const width = v.width||10, height = v.height||8, cutW = v.cutWidth||4, cutH = v.cutHeight||3;
  const unit = v.unit||"cm";
  const sc = Math.min(10, 80/Math.max(width, height));
  const rw = width*sc, rh = height*sc, cw = cutW*sc, ch = cutH*sc;
  const ox = W/2-rw/2, oy = H/2-rh/2;
  const pts = `${ox},${oy} ${ox+rw-cw},${oy} ${ox+rw-cw},${oy+ch} ${ox+rw},${oy+ch} ${ox+rw},${oy+rh} ${ox},${oy+rh}`;
  return svgWrap(W, H, "복합도형",
    `<polygon points="${pts}" fill="rgba(34,197,94,.12)" stroke="#22c55e" stroke-width="2" style="stroke-dasharray:${(2*(rw+rh)).toFixed(0)};stroke-dashoffset:${(2*(rw+rh)).toFixed(0)};animation:iv-draw .7s ease both"/>
<text x="${(ox+rw/2).toFixed(1)}" y="${(oy-7).toFixed(1)}" text-anchor="middle" fill="#bbf7d0" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .8s both">${width}${unit}</text>
<text x="${(ox-8).toFixed(1)}" y="${(oy+rh/2+4).toFixed(1)}" text-anchor="end" fill="#bbf7d0" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .9s both">${height}${unit}</text>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||`복합 도형 (${width}×${height} - ${cutW}×${cutH}${unit})`)}</text>`);
}

// ── 합동 삼각형 (congruent-triangles) ───────────────────────
function ivCongruentTriangles(v, problem) {
  const sides = v.sides||[5,7,6], target = v.target||"", unit = v.unit||"cm";
  const W = 400, H = 130;
  const drawTri = (ox, col, delay) => {
    const [a,b] = sides.map(s=>Math.min(s*7,55));
    const pts = `${ox},${90} ${ox+b},${90} ${ox+b*.5},${90-a*.7}`;
    return `<polygon points="${pts}" fill="rgba(${col},.12)" stroke="rgb(${col})" stroke-width="1.8" opacity="0" style="animation:iv-fade .4s ease ${delay}s both"/>`;
  };
  return svgWrap(W, H, "합동 삼각형",
    `${drawTri(40,"56,189,248",.1)}${drawTri(220,"34,197,94",.4)}
<text x="${W/2}" y="26" text-anchor="middle" fill="#f59e0b" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .6s both">≅ (합동)</text>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${target?`대응변: ${escapeHTML(target)} = ? ${unit}`:'대응변과 대응각이 같은 합동 삼각형'}</text>`);
}

// ── 좌표평면 (coordinate-plane) ──────────────────────────────
function ivCoordinatePlane(v, problem) {
  const point = v.point||[3,4];
  const W = 400, H = 140, ox = 70, oy = 110, unit = 18, gridMax = 8;
  const px = (ox+point[0]*unit).toFixed(1), py = (oy-point[1]*unit).toFixed(1);
  const grid = [];
  for (let i=0; i<=gridMax; i++) {
    const x = ox+i*unit, y = oy-i*unit;
    grid.push(`<line x1="${x}" y1="${oy}" x2="${x}" y2="${oy-gridMax*unit}" stroke="rgba(71,85,105,.25)" stroke-width=".5"/>`,
              `<line x1="${ox}" y1="${y}" x2="${ox+gridMax*unit}" y2="${y}" stroke="rgba(71,85,105,.25)" stroke-width=".5"/>`);
    if (i>0) {
      grid.push(`<text x="${x}" y="${oy+12}" text-anchor="middle" fill="#475569" font-size="8">${i}</text>`,
                `<text x="${ox-7}" y="${y+3}" text-anchor="end" fill="#475569" font-size="8">${i}</text>`);
    }
  }
  return svgWrap(W, H, "좌표평면",
    `${grid.join("")}
<line x1="${ox}" y1="${oy}" x2="${ox+gridMax*unit+16}" y2="${oy}" stroke="#334155" stroke-width="1.5" opacity="0" style="animation:iv-fade .3s ease both"/>
<line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy-gridMax*unit-16}" stroke="#334155" stroke-width="1.5" opacity="0" style="animation:iv-fade .3s ease both"/>
<text x="${ox+gridMax*unit+20}" y="${oy+4}" fill="#64748b" font-size="9">x</text>
<text x="${ox+4}" y="${oy-gridMax*unit-14}" fill="#64748b" font-size="9">y</text>
<line x1="${px}" y1="${oy}" x2="${px}" y2="${py}" stroke="rgba(56,189,248,.4)" stroke-width="1" stroke-dasharray="4,3" opacity="0" style="animation:iv-fade .3s ease .5s both"/>
<line x1="${ox}" y1="${py}" x2="${px}" y2="${py}" stroke="rgba(56,189,248,.4)" stroke-width="1" stroke-dasharray="4,3" opacity="0" style="animation:iv-fade .3s ease .5s both"/>
<circle cx="${px}" cy="${py}" r="6" fill="#f59e0b" class="iv-pop" style="animation-delay:.7s;transform-origin:${px}px ${py}px"/>
<text x="${(+px+9).toFixed(1)}" y="${(+py-5).toFixed(1)}" fill="#fde68a" font-size="10" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .9s both">(${point[0]},${point[1]})</text>`);
}

// ── 쌓기 나무 (cube-stack) ───────────────────────────────────
function ivCubeStack(v, problem) {
  const cols = Math.min(v.cols||3,6), rows = Math.min(v.rows||3,5), layers = Math.min(v.layers||1,3);
  const W = 400, H = 140, cs = 20;
  const ox = W/2-(cols*cs)/2-(layers*cs*.4)/2, oy = H-20;
  const cubes = [];
  let delay = 0;
  for (let l=0; l<layers; l++) {
    for (let r=rows-1; r>=0; r--) {
      for (let c=0; c<cols; c++) {
        const x = ox+c*cs-l*cs*.4, y = oy-r*cs-l*cs*.4;
        cubes.push(
          `<polygon points="${x},${y} ${x+cs},${y} ${x+cs},${y-cs} ${x},${y-cs}" fill="rgba(56,189,248,.18)" stroke="#38bdf8" stroke-width="1" opacity="0" style="animation:iv-fade .2s ease ${delay.toFixed(2)}s both"/>`,
          `<polygon points="${x},${y-cs} ${x+cs},${y-cs} ${x+cs-cs*.4},${y-cs-cs*.4} ${x-cs*.4},${y-cs-cs*.4}" fill="rgba(56,189,248,.28)" stroke="#38bdf8" stroke-width="1" opacity="0" style="animation:iv-fade .2s ease ${delay.toFixed(2)}s both"/>`,
          `<polygon points="${x+cs},${y} ${x+cs-cs*.4},${y-cs*.4} ${x+cs-cs*.4},${y-cs-cs*.4} ${x+cs},${y-cs}" fill="rgba(56,189,248,.1)" stroke="#38bdf8" stroke-width="1" opacity="0" style="animation:iv-fade .2s ease ${delay.toFixed(2)}s both"/>`
        );
        delay += 0.04;
      }
    }
  }
  return svgWrap(W, H, "쌓기 나무",
    `${cubes.join("")}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${cols}×${rows}×${layers} = ${cols*rows*layers}개 쌓기 나무</text>`);
}

// ── 동전 확률 (coin-chance) ─────────────────────────────────
function ivCoinChance(v, problem) {
  const W = 400, H = 110, cx = W/2, cy = 52;
  return svgWrap(W, H, "동전 확률",
    `<circle cx="${cx}" cy="${cy}" r="38" fill="rgba(245,158,11,.12)" stroke="#f59e0b" stroke-width="2.5" class="iv-pop" style="transform-origin:${cx}px ${cy}px"/>
<line x1="${cx}" y1="${cy-38}" x2="${cx}" y2="${cy+38}" stroke="rgba(245,158,11,.35)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0" style="animation:iv-fade .3s ease .5s both"/>
<text x="${cx-18}" y="${cy+5}" text-anchor="middle" fill="#fde68a" font-size="13" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .5s both">앞</text>
<text x="${cx+18}" y="${cy+5}" text-anchor="middle" fill="#fde68a" font-size="13" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .6s both">뒤</text>
<text x="${cx-18}" y="${cy+19}" text-anchor="middle" fill="#94a3b8" font-size="9" opacity="0" style="animation:iv-fade .3s ease .7s both">1/2</text>
<text x="${cx+18}" y="${cy+19}" text-anchor="middle" fill="#94a3b8" font-size="9" opacity="0" style="animation:iv-fade .3s ease .8s both">1/2</text>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">동전 던지기 · 앞면 또는 뒷면 확률 각 1/2</text>`);
}

// ── 확률 주머니 (probability-bag) ────────────────────────────
function ivProbabilityBag(v, problem) {
  const red = Math.min(v.red||3,10), blue = Math.min(v.blue||5,10), total = red+blue;
  const W = 400, H = 110;
  const ballR = Math.min(14,(W-60)/(total*2.5));
  const ox = (W-total*(ballR*2+3))/2+ballR;
  const balls = [];
  for (let i=0; i<red; i++) {
    const x = (ox+i*(ballR*2+3)).toFixed(1);
    balls.push(`<circle cx="${x}" cy="52" r="${ballR}" fill="rgba(251,113,133,.35)" stroke="#fb7185" stroke-width="1.5" class="iv-pop" style="animation-delay:${(i*.07).toFixed(2)}s;transform-origin:${x}px 52px"/>`);
  }
  for (let i=0; i<blue; i++) {
    const x = (ox+(red+i)*(ballR*2+3)).toFixed(1);
    balls.push(`<circle cx="${x}" cy="52" r="${ballR}" fill="rgba(56,189,248,.35)" stroke="#38bdf8" stroke-width="1.5" class="iv-pop" style="animation-delay:${((red+i)*.07).toFixed(2)}s;transform-origin:${x}px 52px"/>`);
  }
  return svgWrap(W, H, "확률 주머니",
    `${balls.join("")}
<text x="${W/2}" y="82" text-anchor="middle" fill="#64748b" font-size="9">빨간 ${red}개 (${red}/${total}) · 파란 ${blue}개 (${blue}/${total})</text>
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="8">${escapeHTML(v.title||"공 꺼낼 확률")}</text>`);
}

// ── 입체도형 (solid-shape) ──────────────────────────────────
function ivSolidShape(v, problem) {
  const kind = v.kind||"prism", label = v.label||"";
  const W = 400, H = 130, cx = W/2, cy = 62;
  let shapeEl;
  if (kind==="pyramid") {
    shapeEl = `<polygon points="${cx},${cy-42} ${cx-46},${cy+30} ${cx+46},${cy+30}" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease both"/>
<line x1="${cx}" y1="${cy-42}" x2="${cx+22}" y2="${cy+6}" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="3,3" opacity="0" style="animation:iv-fade .3s ease .5s both"/>`;
  } else {
    const pts1 = `${cx-36},${cy+30} ${cx+36},${cy+30} ${cx+36},${cy-12} ${cx-36},${cy-12}`;
    const pts2 = `${cx-36},${cy-12} ${cx-20},${cy-36} ${cx+52},${cy-36} ${cx+36},${cy-12}`;
    shapeEl = `<polygon points="${pts1}" fill="rgba(139,92,246,.12)" stroke="#8b5cf6" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease .1s both"/>
<polygon points="${pts2}" fill="rgba(139,92,246,.22)" stroke="#8b5cf6" stroke-width="2" opacity="0" style="animation:iv-fade .5s ease .3s both"/>`;
  }
  return svgWrap(W, H, label||kind,
    `${shapeEl}
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .7s both">${escapeHTML(label)}</text>`);
}

// ── 전개도 (net-diagram) ────────────────────────────────────
function ivNetDiagram(v, problem) {
  const label = v.label||"", sides = v.sides||4;
  const W = 400, H = 130, cx = W/2, cy = 60, fw = 40, fh = 34;
  const face = (x, y, delay) =>
    `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" rx="2" fill="rgba(56,189,248,.12)" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="${delay===.1?'none':'4,3'}" opacity="0" style="animation:iv-fade .3s ease ${delay}s both"/>`;
  const faces = [
    face(cx-fw/2, cy-fh/2, .1),
    face(cx-fw/2, cy-fh/2-fh-2, .2),
    face(cx-fw/2, cy+fh/2+2, .3),
    face(cx-fw/2-fw-2, cy-fh/2, .4),
    face(cx+fw/2+2, cy-fh/2, .5),
  ];
  if (sides>=6) faces.push(face(cx+fw/2+fw+4, cy-fh/2, .6));
  return svgWrap(W, H, label||"전개도",
    `${faces.join("")}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(label||v.kind+" 전개도")}</text>`);
}

// ── 비율 막대 (ratio-strip) ─────────────────────────────────
function ivProfessionalNetDiagram(v) {
  const label = v.label || "";
  const sides = Math.min(8, Math.max(3, Number(v.sides) || 4));
  const kind = v.kind || "prism";
  const W = 480, H = 220;
  const colors = ["#38bdf8", "#22c55e", "#f59e0b", "#8b5cf6", "#fb7185", "#14b8a6", "#6366f1", "#84cc16"];
  const faceAttrs = (index, color) =>
    `data-net-face="${index}" tabindex="0" role="button" aria-label="${index + 1}번 면" fill="${color}22" stroke="${color}" stroke-width="2"`;
  const fold = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,5"/>`;

  if (kind === "cylinder") {
    const rw = 210, rh = 76, x = (W - rw) / 2, y = 72, r = 38, cx = W / 2;
    return svgWrap(W, H, label || "원기둥 전개도", `
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="2" ${faceAttrs(0, colors[0])}/>
      <circle cx="${cx}" cy="${y-r}" r="${r}" ${faceAttrs(1, colors[1])}/>
      <circle cx="${cx}" cy="${y+rh+r}" r="${r}" ${faceAttrs(2, colors[2])}/>
      ${fold(x, y, x+rw, y)}
      ${fold(x, y+rh, x+rw, y+rh)}
      <text x="${W/2}" y="${H-8}" text-anchor="middle" fill="#475569" font-size="12">${escapeHTML(label || "원기둥 전개도")}</text>`);
  }

  const polygonPoints = (cx, cy, radius, count, rotation = -Math.PI / 2) =>
    Array.from({ length: count }, (_, index) => {
      const angle = rotation + index * Math.PI * 2 / count;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    });
  const pointsText = (points) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  if (kind === "pyramid") {
    const cx = W / 2, cy = 104, radius = sides >= 7 ? 42 : 48;
    const base = polygonPoints(cx, cy, radius, sides);
    const triangles = base.map((point, index) => {
      const next = base[(index + 1) % base.length];
      const midX = (point[0] + next[0]) / 2;
      const midY = (point[1] + next[1]) / 2;
      const dx = midX - cx, dy = midY - cy;
      const length = Math.hypot(dx, dy) || 1;
      const apexDistance = Math.max(28, radius * 0.72);
      const apex = [midX + dx / length * apexDistance, midY + dy / length * apexDistance];
      return `<polygon points="${pointsText([point, next, apex])}" ${faceAttrs(index + 1, colors[(index + 1) % colors.length])}/>
        ${fold(point[0], point[1], next[0], next[1])}`;
    });
    return svgWrap(W, H, label || `${sides}각뿔 전개도`, `
      ${triangles.join("")}
      <polygon points="${pointsText(base)}" ${faceAttrs(0, colors[0])}/>
      <text x="${W/2}" y="${H-8}" text-anchor="middle" fill="#475569" font-size="12">${escapeHTML(label || `${sides}각뿔 전개도`)}</text>`);
  }

  const faceWidth = Math.min(54, 330 / sides);
  const faceHeight = 72;
  const rowWidth = faceWidth * sides;
  const startX = (W - rowWidth) / 2;
  const rowY = 75;
  const sideFaces = Array.from({ length: sides }, (_, index) => {
    const x = startX + index * faceWidth;
    return `<rect x="${x}" y="${rowY}" width="${faceWidth}" height="${faceHeight}" rx="1" ${faceAttrs(index, colors[index % colors.length])}/>
      ${index > 0 ? fold(x, rowY, x, rowY + faceHeight) : ""}`;
  });
  const baseRadius = Math.min(34, faceWidth * 0.75);
  const topCenterX = startX + faceWidth * 1.5;
  const bottomCenterX = startX + faceWidth * Math.min(sides - 1.5, 4.5);
  const topBase = polygonPoints(topCenterX, rowY - baseRadius, baseRadius, sides);
  const bottomBase = polygonPoints(bottomCenterX, rowY + faceHeight + baseRadius, baseRadius, sides, Math.PI / 2);
  return svgWrap(W, H, label || `${sides}각기둥 전개도`, `
    ${sideFaces.join("")}
    <polygon points="${pointsText(topBase)}" ${faceAttrs(sides, colors[sides % colors.length])}/>
    <polygon points="${pointsText(bottomBase)}" ${faceAttrs(sides + 1, colors[(sides + 1) % colors.length])}/>
    ${fold(topCenterX - faceWidth / 2, rowY, topCenterX + faceWidth / 2, rowY)}
    ${fold(bottomCenterX - faceWidth / 2, rowY + faceHeight, bottomCenterX + faceWidth / 2, rowY + faceHeight)}
    <text x="${W/2}" y="${H-8}" text-anchor="middle" fill="#475569" font-size="12">${escapeHTML(label || `${sides}각기둥 전개도`)}</text>`);
}

function ivRatioStrip(v, problem) {
  const left = v.left||3, right = v.right||2, total = left+right;
  const lLbl = v.leftLabel||"A", rLbl = v.rightLabel||"B", unit = v.unit||"";
  const W = 400, H = 110, barH = 28, barW = W-60, ox = 30, oy = 38;
  const lw = (left/total*barW).toFixed(1), rw = (right/total*barW).toFixed(1);
  return svgWrap(W, H, "비율 막대",
    `<rect x="${ox}" y="${oy}" width="${lw}" height="${barH}" rx="4" fill="rgba(56,189,248,.28)" stroke="#38bdf8" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .1s both"/>
<rect x="${(ox+Number(lw)).toFixed(1)}" y="${oy}" width="${rw}" height="${barH}" rx="4" fill="rgba(34,197,94,.28)" stroke="#22c55e" stroke-width="1.5" opacity="0" style="animation:iv-fade .4s ease .3s both"/>
<text x="${(ox+Number(lw)/2).toFixed(1)}" y="${oy+18}" text-anchor="middle" fill="#bae6fd" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .5s both">${escapeHTML(lLbl)} ${left}</text>
<text x="${(ox+Number(lw)+Number(rw)/2).toFixed(1)}" y="${oy+18}" text-anchor="middle" fill="#bbf7d0" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ease .6s both">${escapeHTML(rLbl)} ${right}</text>
<text x="${W/2}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(lLbl)} : ${escapeHTML(rLbl)} = ${left} : ${right}${unit?' ('+unit+')':''}</text>
<text x="${W/2}" y="${H+5}" text-anchor="middle" fill="#64748b" font-size="8">${escapeHTML(v.title||"")}</text>`);
}

// ── 원 그래프 (circle-chart) ─────────────────────────────────
function ivCircleChart(v, problem) {
  if (!v||!v.items) return ivExpressionBox(problem);
  const items = v.items.slice(0,5);
  const total = items.reduce((s,it)=>s+(it.value||0),0)||1;
  const W = 400, H = 140, cx = W/2-25, cy = 65, r = 46;
  const pal = ["#38bdf8","#22c55e","#f59e0b","#fb7185","#8b5cf6"];
  const sectors = [], legend = [];
  let startA = -Math.PI/2;
  items.forEach((item,i) => {
    const frac = (item.value||0)/total;
    const sweepA = frac*2*Math.PI, endA = startA+sweepA;
    const x1 = (cx+r*Math.cos(startA)).toFixed(1), y1 = (cy+r*Math.sin(startA)).toFixed(1);
    const x2 = (cx+r*Math.cos(endA)).toFixed(1), y2 = (cy+r*Math.sin(endA)).toFixed(1);
    const midA = startA+sweepA/2;
    const lx = (cx+(r+18)*Math.cos(midA)).toFixed(1), ly = (cy+(r+18)*Math.sin(midA)+4).toFixed(1);
    const col = pal[i%pal.length];
    sectors.push(`<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${sweepA>Math.PI?1:0} 1 ${x2} ${y2} Z" fill="${col}33" stroke="${col}" stroke-width="1.5" opacity="0" style="animation:iv-fade .35s ease ${(i*.1+.1).toFixed(2)}s both"/>
<text x="${lx}" y="${ly}" text-anchor="middle" fill="${col}" font-size="9" font-weight="700" opacity="0" style="animation:iv-fade .3s ease ${(i*.1+.4).toFixed(2)}s both">${item.value}%</text>`);
    const lly = 20+i*18;
    legend.push(`<rect x="${W-70}" y="${lly}" width="10" height="10" rx="2" fill="${col}44" stroke="${col}" stroke-width="1" opacity="0" style="animation:iv-fade .3s ease ${(i*.1+.3).toFixed(2)}s both"/>
<text x="${W-57}" y="${lly+9}" fill="${col}" font-size="9" opacity="0" style="animation:iv-fade .3s ease ${(i*.1+.4).toFixed(2)}s both">${escapeHTML(String(item.label||''))}</text>`);
    startA = endA;
  });
  return svgWrap(W, H, "원 그래프",
    `${sectors.join("")}${legend.join("")}
<text x="${cx}" y="${H-5}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"원 그래프")}</text>`);
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
  const vals = (v.values || v.points || [0]).map(Number);
  const missingIdx = v.missingIndex !== undefined ? v.missingIndex : -1;
  const W = 400, H = 110;
  const lo = Math.min(...vals) - Math.max(2, Math.round((Math.max(...vals)-Math.min(...vals))*.3));
  const hi = Math.max(...vals) + Math.max(2, Math.round((Math.max(...vals)-Math.min(...vals))*.3));
  const X = n => 24 + (n-lo)/(hi-lo)*(W-48);
  const ticks = [];
  for (let i=lo; i<=hi; i++) {
    const x = X(i).toFixed(1), isMark = vals.includes(i);
    ticks.push(`<line x1="${x}" y1="${isMark?52:56}" x2="${x}" y2="64" stroke="${isMark?'#38bdf8':'#334155'}" stroke-width="${isMark?2:1}"/>`);
    if (isMark||i%5===0) ticks.push(`<text x="${x}" y="76" text-anchor="middle" fill="${isMark?'#bae6fd':'#475569'}" font-size="9" font-weight="${isMark?700:400}">${i}</text>`);
  }
  const dots = vals.map((v2,i) => {
    const x = X(v2).toFixed(1);
    const isMissing = i === missingIdx;
    const delay = (0.4+i*0.12).toFixed(2);
    if (isMissing) return `<circle cx="${x}" cy="60" r="9" fill="rgba(56,189,248,.14)" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,3" class="iv-pop" style="animation-delay:${delay}s;transform-origin:${x}px 60px"/>
<text x="${x}" y="64" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="700" class="iv-pop" style="animation-delay:${(+delay+.05).toFixed(2)}s;transform-origin:${x}px 60px">?</text>`;
    return `<circle cx="${x}" cy="60" r="7" fill="#38bdf8" class="iv-pop" style="animation-delay:${delay}s;transform-origin:${x}px 60px"/>
<text x="${x}" y="64" text-anchor="middle" fill="#0f172a" font-size="9" font-weight="700" class="iv-pop" style="animation-delay:${(+delay+.05).toFixed(2)}s;transform-origin:${x}px 60px">${v2}</text>`;
  });
  return svgWrap(W, H, "수직선",
    `<line x1="16" y1="60" x2="${W-16}" y2="60" stroke="#334155" stroke-width="2" stroke-dasharray="${W-32}" stroke-dashoffset="${W-32}" style="animation:iv-draw .6s ease both"/>
<polygon points="${W-16},60 ${W-23},56 ${W-23},64" fill="#334155" opacity="0" style="animation:iv-fade .3s ease .7s both"/>
${ticks.join("")}${dots.join("")}
<text x="${W/2}" y="${H-3}" text-anchor="middle" fill="#64748b" font-size="9">${escapeHTML(v.title||"수직선")}</text>`);
}
function ivFractionStrip(v, problem) { return ivFractionBars(v, problem); }
function ivRectangle(v, problem)    { return ivRectShape(v, problem); }
function ivSquare(v, problem)       { return ivRectShape(v, problem); }
function ivTriangle(v, problem)     { return ivRectShape(v, problem); }
function ivParallelogram(v, problem){ return ivRectShape(v, problem); }
function ivTrapezoid(v, problem)    { return ivRectShape(v, problem); }
function ivTenFrame(v, problem) {
  const count = v ? (v.filled ?? v.count ?? 5) : 5;
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
  if (id.includes("add") || id.includes("sub")) {
    const col = ivColumnArithmetic(problem);
    if (col) return col;
    return ivNumberLineAnim(problem);
  }
  if (id.includes("times") || id.includes("mul")) {
    const col = ivColumnMul(problem);
    if (col) return col;
    return ivMulGrid(problem);
  }
  if (id.includes("div")) {
    const col = ivColumnDiv(problem);
    if (col) return col;
    return ivDivCircles(problem);
  }
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

// ============================================================
// 국제 수학 교과서 시각 요소 (바 모델·분수 원·넓이 모델 등)
// ============================================================

// ── 바 모델 (Bar Model) — 영국·싱가포르 핵심 표현 ────────────
function ivBarModel(v, problem) {
  const W = 400, H = 150;
  const mode = v.mode || 'part-whole';

  if (mode === 'comparison') {
    const items = v.items || v.parts || [];
    const maxVal = Math.max(...items.map(i => i.value || 1), 1);
    const barMaxW = 290, startX = 72, barH = 28, gap = 18;
    const bars = items.map((item, i) => {
      const w = Math.max(14, Math.round((item.value / maxVal) * barMaxW));
      const y = 18 + i * (barH + gap);
      const color = item.color || ['#6366f1','#0ea5e9','#22c55e','#f59e0b'][i % 4];
      return `<text x="68" y="${y+barH/2+5}" text-anchor="end" fill="#94a3b8" font-size="11">${escapeHTML(item.label||'')}</text>
<rect x="${startX}" y="${y}" width="${w}" height="${barH}" rx="4" fill="${color}33" stroke="${color}" stroke-width="1.5" class="iv-pop" style="animation-delay:${(i*.15).toFixed(2)}s"/>
<text x="${startX+w+6}" y="${y+barH/2+5}" fill="${color}" font-size="12" font-weight="700" class="iv-pop" style="animation-delay:${(i*.15+.1).toFixed(2)}s">${escapeHTML(String(item.value))}</text>`;
    });
    return svgWrap(W, H, "바 모델 비교", bars.join(''));
  }

  // part-whole 모드
  const whole = v.whole || { label:'전체', value:'?' };
  const parts = v.parts || [];
  const barW = 300, startX = 50, topY = 18, botY = 84;
  const partsSum = parts.reduce((s, p) => s + (p.value || 0), 0) || 1;
  const topSvg = `<rect x="${startX}" y="${topY}" width="${barW}" height="34" rx="5" fill="rgba(99,102,241,.18)" stroke="#6366f1" stroke-width="1.8" class="iv-pop" style="animation-delay:0s"/>
<text x="${startX+barW/2}" y="${topY+22}" text-anchor="middle" fill="#a5b4fc" font-size="15" font-weight="700" class="iv-pop" style="animation-delay:.05s">${escapeHTML(String(whole.value!==undefined?whole.value:whole.label||'?'))}</text>`;
  let curX = startX;
  const partSvgs = parts.map((p, i) => {
    const pw = Math.max(14, Math.round((p.value||0) / partsSum * barW));
    const isQ = p.value===null || p.value===undefined;
    const fill = isQ ? 'rgba(56,189,248,.1)' : ['rgba(34,197,94,.22)','rgba(251,146,60,.22)'][i%2];
    const stroke = isQ ? '#38bdf8' : ['#22c55e','#fb923c'][i%2];
    const textFill = isQ ? '#38bdf8' : ['#86efac','#fed7aa'][i%2];
    const disp = isQ ? '?' : (p.label || String(p.value));
    const x = curX; curX += pw;
    return `<rect x="${x}" y="${botY}" width="${pw-2}" height="34" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.8" class="iv-pop" style="animation-delay:${(.25+i*.15).toFixed(2)}s"/>
<text x="${x+(pw-2)/2}" y="${botY+22}" text-anchor="middle" fill="${textFill}" font-size="14" font-weight="700" class="iv-pop" style="animation-delay:${(.3+i*.15).toFixed(2)}s">${escapeHTML(disp)}</text>`;
  });
  const connector = `<line x1="${W/2}" y1="${topY+34}" x2="${W/2}" y2="${botY}" stroke="#475569" stroke-width="1" stroke-dasharray="3,3" opacity="0" style="animation:iv-fade .3s .2s both"/>`;
  return svgWrap(W, H, "바 모델", topSvg + connector + partSvgs.join(''));
}

// ── 분수 원 (Fraction Circle) — 미국·중국 핵심 ───────────────
function ivFractionCircle(v, problem) {
  const W = 300, H = 160;
  const d = Math.max(2, Math.min(12, Number(v.denominator) || 4));
  const n = Math.max(0, Math.min(d, Number(v.numerator) || 1));
  const cx = 78, cy = 76, r = 58;
  const sectors = Array.from({length: d}, (_, i) => {
    const a1 = (i/d)*Math.PI*2 - Math.PI/2;
    const a2 = ((i+1)/d)*Math.PI*2 - Math.PI/2;
    const x1 = (cx + r*Math.cos(a1)).toFixed(1), y1 = (cy + r*Math.sin(a1)).toFixed(1);
    const x2 = (cx + r*Math.cos(a2)).toFixed(1), y2 = (cy + r*Math.sin(a2)).toFixed(1);
    const large = (1/d) > 0.5 ? 1 : 0;
    const filled = i < n;
    return `<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}Z" fill="${filled?'rgba(99,102,241,.8)':'rgba(100,116,139,.18)'}" stroke="#1e293b" stroke-width="1.2" class="iv-pop" style="animation-delay:${(i*.07).toFixed(2)}s;transform-origin:${cx}px ${cy}px"/>`;
  });
  const label = `<text x="185" y="56" fill="#a5b4fc" font-size="28" font-weight="800" text-anchor="middle" class="iv-pop" style="animation-delay:${(d*.07).toFixed(2)}s">${n}</text>
<line x1="165" y1="66" x2="205" y2="66" stroke="#6366f1" stroke-width="2" opacity="0" style="animation:iv-fade .25s ${(d*.07+.05).toFixed(2)}s both"/>
<text x="185" y="88" fill="#a5b4fc" font-size="28" font-weight="800" text-anchor="middle" class="iv-pop" style="animation-delay:${(d*.07+.1).toFixed(2)}s">${d}</text>
<text x="${cx}" y="${cy+r+18}" text-anchor="middle" fill="#64748b" font-size="10">${n}/${d} 만큼 색칠되어 있습니다</text>`;
  return svgWrap(W, H, `분수 원 ${n}/${d}`, sectors.join('') + label);
}

// ── 넓이 모델 (Area Model) — 미국 Common Core ────────────────
function ivAreaModel(v, problem) {
  const a = Number(v.a || 0), b = Number(v.b || 0);
  if (!a || !b || a < 10 || b < 10) return ivExpressionBox(problem);
  const aT = Math.floor(a/10)*10, aO = a%10;
  const bT = Math.floor(b/10)*10, bO = b%10;
  const W = 360, H = 185;
  const sX = 72, sY = 42;
  const c1W = 140, c2W = aO ? 72 : 0;
  const r1H = 70, r2H = bO ? 36 : 0;
  const cells = [
    [aT, bT, sX,     sY,     c1W, r1H, '#6366f1', '0.10'],
    [aO, bT, sX+c1W, sY,     c2W, r1H, '#0ea5e9', '0.20'],
    [aT, bO, sX,     sY+r1H, c1W, r2H, '#0ea5e9', '0.30'],
    [aO, bO, sX+c1W, sY+r1H, c2W, r2H, '#f59e0b', '0.40'],
  ];
  const rects = cells.filter(([ca,cb,,,cw,ch])=>ca&&cb&&cw&&ch).map(([ca,cb,cx,cy,cw,ch,col,dl]) => {
    const prod = ca*cb;
    return `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="2" fill="${col}20" stroke="${col}" stroke-width="1.2" class="iv-pop" style="animation-delay:${dl}s"/>
<text x="${cx+cw/2}" y="${cy+ch/2+5}" text-anchor="middle" fill="${col}" font-size="${prod>=1000?10:13}" font-weight="700" class="iv-pop" style="animation-delay:${(Number(dl)+.05).toFixed(2)}s">${prod}</text>`;
  });
  const axis = `<text x="${sX+c1W/2}" y="${sY-10}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600">${aT}</text>
${aO?`<text x="${sX+c1W+c2W/2}" y="${sY-10}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600">${aO}</text>`:''}
<text x="${sX-8}" y="${sY+r1H/2+4}" text-anchor="end" fill="#94a3b8" font-size="11" font-weight="600">${bT}</text>
${bO?`<text x="${sX-8}" y="${sY+r1H+r2H/2+4}" text-anchor="end" fill="#94a3b8" font-size="11" font-weight="600">${bO}</text>`:''}
<text x="${sX+(c1W+c2W)/2}" y="${sY+r1H+r2H+18}" text-anchor="middle" fill="#6366f1" font-size="12" font-weight="700">${a} × ${b} = ${a*b}</text>`;
  return svgWrap(W, H, `넓이 모델 ${a}×${b}`, rects.join('') + axis);
}

// ── 전체-부분 상자 (Part-Whole Box) — 싱가포르·중국 ──────────
function ivPartWholeBox(v, problem) {
  const W = 360, H = 152;
  const whole = v.whole !== undefined ? v.whole : '?';
  const p1 = v.part1 !== undefined ? v.part1 : '?';
  const p2 = v.part2 !== undefined ? v.part2 : '?';
  const tcx = W/2, bw = 84, bh = 38;
  const topY = 16, botY = 96, lx = W/2-95, rx = W/2+95;
  const isQ2 = String(p2) === '?' || p2 === null;
  return svgWrap(W, H, "전체-부분 상자", `
<rect x="${tcx-bw/2}" y="${topY}" width="${bw}" height="${bh}" rx="6" fill="rgba(99,102,241,.18)" stroke="#6366f1" stroke-width="2" class="iv-pop" style="animation-delay:0s;transform-origin:${tcx}px ${topY+bh/2}px"/>
<text x="${tcx}" y="${topY+bh/2+6}" text-anchor="middle" fill="#a5b4fc" font-size="16" font-weight="700" class="iv-pop" style="animation-delay:.05s;transform-origin:${tcx}px ${topY+bh/2}px">${escapeHTML(String(whole))}</text>
<line x1="${tcx}" y1="${topY+bh}" x2="${lx}" y2="${botY}" stroke="#475569" stroke-width="1.8" opacity="0" style="animation:iv-fade .25s .22s both"/>
<line x1="${tcx}" y1="${topY+bh}" x2="${rx}" y2="${botY}" stroke="#475569" stroke-width="1.8" opacity="0" style="animation:iv-fade .25s .22s both"/>
<rect x="${lx-bw/2}" y="${botY}" width="${bw}" height="${bh}" rx="6" fill="rgba(34,197,94,.18)" stroke="#22c55e" stroke-width="2" class="iv-pop" style="animation-delay:.32s;transform-origin:${lx}px ${botY+bh/2}px"/>
<text x="${lx}" y="${botY+bh/2+6}" text-anchor="middle" fill="#86efac" font-size="16" font-weight="700" class="iv-pop" style="animation-delay:.37s;transform-origin:${lx}px ${botY+bh/2}px">${escapeHTML(String(p1))}</text>
<rect x="${rx-bw/2}" y="${botY}" width="${bw}" height="${bh}" rx="6" fill="${isQ2?'rgba(56,189,248,.1)':'rgba(251,146,60,.18)'}" stroke="${isQ2?'#38bdf8':'#fb923c'}" stroke-width="2" class="iv-pop" style="animation-delay:.46s;transform-origin:${rx}px ${botY+bh/2}px"/>
<text x="${rx}" y="${botY+bh/2+6}" text-anchor="middle" fill="${isQ2?'#38bdf8':'#fed7aa'}" font-size="16" font-weight="700" class="iv-pop" style="animation-delay:.51s;transform-origin:${rx}px ${botY+bh/2}px">${escapeHTML(String(p2))}</text>`);
}

// ── 테이프 다이어그램 (Tape Diagram) — 미국·싱가포르 ─────────
function ivTapeDiagram(v, problem) {
  const W = 380, H = 140;
  const items = (v.items || []).slice(0, 5);
  if (!items.length) return ivExpressionBox(problem);
  const maxVal = Math.max(...items.map(i => Number(i.value) || 1), 1);
  const COLORS = ['#6366f1','#0ea5e9','#22c55e','#f59e0b','#ec4899'];
  const bMaxW = 256, sX = 72, bH = 26, gap = 14;
  const tapes = items.map((item, i) => {
    const w = Math.max(16, Math.round((Number(item.value)||0) / maxVal * bMaxW));
    const y = 14 + i*(bH+gap);
    const c = COLORS[i % COLORS.length];
    return `<text x="68" y="${y+bH/2+5}" text-anchor="end" fill="#94a3b8" font-size="11">${escapeHTML(item.label||'')}</text>
<rect x="${sX}" y="${y}" width="${w}" height="${bH}" rx="4" fill="${c}28" stroke="${c}" stroke-width="1.5" class="iv-pop" style="animation-delay:${(i*.14).toFixed(2)}s"/>
<text x="${sX+w+6}" y="${y+bH/2+5}" fill="${c}" font-size="12" font-weight="700" class="iv-pop" style="animation-delay:${(i*.14+.1).toFixed(2)}s">${escapeHTML(String(item.value))}${v.unit?escapeHTML(v.unit):''}</text>`;
  });
  let totalSvg = '';
  if (v.showTotal && items.length > 1) {
    const total = items.reduce((s, i) => s + (Number(i.value)||0), 0);
    const ty = 14 + items.length*(bH+gap);
    totalSvg = `<line x1="${sX}" y1="${ty}" x2="${sX+bMaxW}" y2="${ty}" stroke="#6366f1" stroke-width="1.5" opacity="0" style="animation:iv-fade .3s ${(items.length*.14).toFixed(2)}s both"/>
<text x="${sX+bMaxW/2}" y="${ty+15}" text-anchor="middle" fill="#a5b4fc" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .3s ${(items.length*.14+.1).toFixed(2)}s both">합계: ${total}${v.unit?escapeHTML(v.unit):''}</text>`;
  }
  return svgWrap(W, H, "테이프 다이어그램", tapes.join('') + totalSvg);
}

// ── 쿠이즈네르 막대 (Cuisenaire Rods) — 영국 핵심 ───────────
function ivCuisenaireRods(v, problem) {
  const W = 360, H = 155;
  const rods = (v.rods || []).slice(0, 6).map(r => Math.min(10, Math.max(1, Number(r)||1)));
  if (!rods.length) return ivExpressionBox(problem);
  const COLORS = {1:'#e2e8f0',2:'#ef4444',3:'#22c55e',4:'#a855f7',5:'#eab308',
                  6:'#16a34a',7:'#334155',8:'#92400e',9:'#3b82f6',10:'#f97316'};
  const TEXT_DARK = new Set([1,5,10]);
  const UNIT = 26, sX = 20, sY = 16, bH = 22, gap = 10;
  const rodSvgs = rods.map((len, i) => {
    const w = len * UNIT;
    const y = sY + i*(bH+gap);
    const color = COLORS[len];
    const tc = TEXT_DARK.has(len) ? '#1e293b' : '#f8fafc';
    return `<rect x="${sX}" y="${y}" width="${w}" height="${bH}" rx="4" fill="${color}" class="iv-pop" style="animation-delay:${(i*.1).toFixed(2)}s"/>
<text x="${sX+w/2}" y="${y+bH/2+5}" text-anchor="middle" fill="${tc}" font-size="11" font-weight="700" class="iv-pop" style="animation-delay:${(i*.1+.05).toFixed(2)}s">${len}</text>`;
  });
  let sumSvg = '';
  if (v.showSum) {
    const total = rods.reduce((s, r) => s+r, 0);
    const sumY = sY + rods.length*(bH+gap) + 4;
    sumSvg = `<text x="${sX}" y="${sumY+14}" fill="#94a3b8" font-size="11" opacity="0" style="animation:iv-fade .3s ${(rods.length*.1).toFixed(2)}s both">${rods.join(' + ')} = ${total}</text>`;
  }
  return svgWrap(W, H, "쿠이즈네르 막대", rodSvgs.join('') + sumSvg);
}

// ── 이중 수직선 (Double Number Line) — 미국·싱가포르 ─────────
function ivDoubleNumberLine(v, problem) {
  const W = 380, H = 118;
  const top = v.top || { label:'', values:[0,1,2,3,4] };
  const bot = v.bottom || { label:'', values:[0,2,4,6,8] };
  const tVals = top.values || [], bVals = bot.values || [];
  const steps = Math.max(tVals.length, bVals.length, 2);
  const lsX = 60, leX = 345, topY = 38, botY = 76, lW = leX-lsX;
  const tTicks = tVals.map((val, i) => {
    const x = (lsX + i/(steps-1)*lW).toFixed(1);
    return `<line x1="${x}" y1="${topY-9}" x2="${x}" y2="${topY+9}" stroke="#6366f1" stroke-width="1.5" opacity="0" style="animation:iv-fade .2s ${(i*.09).toFixed(2)}s both"/>
<text x="${x}" y="${topY-14}" text-anchor="middle" fill="#a5b4fc" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .2s ${(i*.09+.05).toFixed(2)}s both">${escapeHTML(String(val))}</text>`;
  });
  const bTicks = bVals.map((val, i) => {
    const x = (lsX + i/(steps-1)*lW).toFixed(1);
    return `<line x1="${x}" y1="${botY-9}" x2="${x}" y2="${botY+9}" stroke="#0ea5e9" stroke-width="1.5" opacity="0" style="animation:iv-fade .2s ${(.18+i*.09).toFixed(2)}s both"/>
<text x="${x}" y="${botY+23}" text-anchor="middle" fill="#7dd3fc" font-size="11" font-weight="700" opacity="0" style="animation:iv-fade .2s ${(.23+i*.09).toFixed(2)}s both">${escapeHTML(String(val))}</text>
<line x1="${x}" y1="${topY+9}" x2="${x}" y2="${botY-9}" stroke="#475569" stroke-width="1" stroke-dasharray="3,2" opacity="0.35"/>`;
  });
  return svgWrap(W, H, "이중 수직선",
    `<line x1="${lsX}" y1="${topY}" x2="${leX}" y2="${topY}" stroke="#6366f1" stroke-width="2.2"/>
<line x1="${lsX}" y1="${botY}" x2="${leX}" y2="${botY}" stroke="#0ea5e9" stroke-width="2.2"/>
<text x="${lsX-6}" y="${topY+5}" text-anchor="end" fill="#a5b4fc" font-size="10">${escapeHTML(top.label||'')}</text>
<text x="${lsX-6}" y="${botY+5}" text-anchor="end" fill="#7dd3fc" font-size="10">${escapeHTML(bot.label||'')}</text>
${tTicks.join('')}${bTicks.join('')}`);
}

// ============================================================
// 개념 카드 정적 SVG 일러스트레이션
// ============================================================
function buildConceptStaticSVG(type) {
  const W = 320, H = 96;
  const sw = (inner, lbl) =>
    `<svg class="math-svg-board concept-svg-board" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHTML(lbl||type)}" preserveAspectRatio="xMidYMid meet"><defs><style>text{font-family:inherit;user-select:none}</style></defs><rect x="1" y="1" width="${W-2}" height="${H-2}" rx="8" fill="#ffffff" stroke="#d9e2ef" stroke-width="2"/>${inner}</svg>`;

  if (type === 'add') {
    const d = [];
    for (let i=0;i<3;i++) d.push(`<circle cx="${32+i*20}" cy="38" r="8" fill="rgba(56,189,248,.75)" stroke="#38bdf8" stroke-width="1.5"/>`);
    d.push(`<text x="108" y="43" text-anchor="middle" fill="#94a3b8" font-size="20" font-weight="700">+</text>`);
    for (let i=0;i<4;i++) d.push(`<circle cx="${128+i*20}" cy="38" r="8" fill="rgba(34,197,94,.75)" stroke="#22c55e" stroke-width="1.5"/>`);
    d.push(`<text x="228" y="43" text-anchor="middle" fill="#94a3b8" font-size="20" font-weight="700">=</text>`);
    for (let i=0;i<7;i++) d.push(`<circle cx="${248+i*9}" cy="38" r="${i<3?5:4}" fill="${i<3?'rgba(56,189,248,.55)':'rgba(34,197,94,.55)'}" stroke="${i<3?'#38bdf8':'#22c55e'}" stroke-width="1"/>`);
    d.push(`<text x="${W/2}" y="76" text-anchor="middle" fill="#64748b" font-size="11">3개 + 4개 = 7개  |  수직선에서 오른쪽으로</text>`);
    return sw(d.join(''), '덧셈 일러스트');
  }

  if (type === 'sub') {
    const d = [`<line x1="18" y1="42" x2="${W-18}" y2="42" stroke="#334155" stroke-width="2"/>`,
      `<polygon points="${W-18},42 ${W-26},37 ${W-26},47" fill="#334155"/>`];
    for (let i=0;i<=7;i++) { const x=24+i*38; d.push(`<line x1="${x}" y1="37" x2="${x}" y2="47" stroke="#475569" stroke-width="${i%2===0?1.5:1}"/><text x="${x}" y="59" text-anchor="middle" fill="#64748b" font-size="9">${i}</text>`); }
    d.push(`<circle cx="${24+7*38}" cy="42" r="8" fill="rgba(251,146,60,.6)" stroke="#fb923c" stroke-width="1.5"/>`);
    d.push(`<circle cx="${24+5*38}" cy="42" r="8" fill="rgba(34,197,94,.6)" stroke="#22c55e" stroke-width="1.5"/>`);
    d.push(`<path d="M ${24+7*38} 28 Q ${24+6*38} 16 ${24+5*38} 28" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>`);
    d.push(`<polygon points="${24+5*38},28 ${24+5*38-5},21 ${24+5*38+5},21" fill="#f59e0b"/>`);
    d.push(`<text x="${W/2}" y="80" text-anchor="middle" fill="#64748b" font-size="11">7 − 2 = 5  (수직선에서 왼쪽으로 2칸)</text>`);
    return sw(d.join(''), '뺄셈 일러스트');
  }

  if (type === 'mul') {
    const d = [];
    for (let r=0;r<3;r++) for (let c=0;c<4;c++) d.push(`<circle cx="${50+c*28}" cy="${20+r*22}" r="8" fill="rgba(139,92,246,.7)" stroke="#8b5cf6" stroke-width="1.5"/>`);
    d.push(`<text x="175" y="36" fill="#94a3b8" font-size="14" font-weight="700">→</text>`);
    d.push(`<text x="220" y="48" fill="#a78bfa" font-size="28" font-weight="900">12</text>`);
    d.push(`<text x="${W/2}" y="80" text-anchor="middle" fill="#64748b" font-size="11">3행 × 4열 = 12개  |  배열(Array) 모델</text>`);
    return sw(d.join(''), '곱셈 배열 일러스트');
  }

  if (type === 'div') {
    const d = [];
    for (let g=0;g<3;g++) {
      const gx=46+g*82;
      d.push(`<ellipse cx="${gx}" cy="40" rx="28" ry="22" fill="none" stroke="rgba(139,92,246,.45)" stroke-width="1.5" stroke-dasharray="4,3"/>`);
      for (let k=0;k<4;k++) { const a=k/4*Math.PI*2; d.push(`<circle cx="${(gx+13*Math.cos(a)).toFixed(1)}" cy="${(40+13*Math.sin(a)).toFixed(1)}" r="5" fill="rgba(139,92,246,.75)" stroke="#8b5cf6" stroke-width="1"/>`); }
      d.push(`<text x="${gx}" y="74" text-anchor="middle" fill="#a78bfa" font-size="11" font-weight="700">4개</text>`);
    }
    d.push(`<text x="${W/2}" y="90" text-anchor="middle" fill="#64748b" font-size="11">12 ÷ 3 = 4  (3묶음, 각 4개)</text>`);
    return sw(d.join(''), '나눗셈 그룹 일러스트');
  }

  if (type === 'fraction') {
    const cx=58, cy=46, r=34, n=3, d_=4;
    const sec = Array.from({length:d_}, (_,i) => {
      const a1=i/d_*Math.PI*2-Math.PI/2, a2=(i+1)/d_*Math.PI*2-Math.PI/2;
      const x1=(cx+r*Math.cos(a1)).toFixed(1),y1=(cy+r*Math.sin(a1)).toFixed(1);
      const x2=(cx+r*Math.cos(a2)).toFixed(1),y2=(cy+r*Math.sin(a2)).toFixed(1);
      return `<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}Z" fill="${i<n?'rgba(99,102,241,.82)':'rgba(100,116,139,.2)'}" stroke="#1e293b" stroke-width="1.2"/>`;
    });
    return sw(sec.join('') +
      `<text x="130" y="32" fill="#a5b4fc" font-size="26" font-weight="900" text-anchor="middle">3</text>
<line x1="112" y1="42" x2="148" y2="42" stroke="#6366f1" stroke-width="2"/>
<text x="130" y="60" fill="#a5b4fc" font-size="26" font-weight="900" text-anchor="middle">4</text>
<text x="200" y="38" fill="#64748b" font-size="11">분자 = 색칠 칸</text>
<text x="200" y="56" fill="#64748b" font-size="11">분모 = 전체 칸</text>
<text x="${W/2}" y="84" text-anchor="middle" fill="#64748b" font-size="11">3/4 = 0.75  |  분수 원(Fraction Circle)</text>`,
      '분수 원 일러스트');
  }

  if (type === 'decimal') {
    const d = [];
    d.push(`<rect x="18" y="16" width="38" height="50" rx="4" fill="rgba(56,189,248,.25)" stroke="#38bdf8" stroke-width="2"/>`);
    d.push(`<text x="37" y="44" text-anchor="middle" fill="#38bdf8" font-size="16" font-weight="700">1</text>`);
    d.push(`<text x="37" y="76" text-anchor="middle" fill="#64748b" font-size="9">1</text>`);
    d.push(`<circle cx="64" cy="62" r="3.5" fill="#94a3b8"/>`);
    for (let i=0;i<3;i++) {
      const x=72+i*22;
      d.push(`<rect x="${x}" y="24" width="18" height="34" rx="3" fill="rgba(34,197,94,.28)" stroke="#22c55e" stroke-width="1.5"/>`);
    }
    d.push(`<text x="114" y="70" text-anchor="middle" fill="#64748b" font-size="9">0.1×3</text>`);
    d.push(`<text x="195" y="44" fill="#94a3b8" font-size="13" font-weight="700">= 1.3</text>`);
    d.push(`<text x="${W/2}" y="84" text-anchor="middle" fill="#64748b" font-size="11">1 + 0.3  |  소수점 자릿값 블록</text>`);
    return sw(d.join(''), '소수 블록 일러스트');
  }

  if (type === 'place-value') {
    const d = [];
    for (let i=0;i<3;i++) d.push(`<rect x="${14+i*16}" y="12" width="14" height="14" rx="2" fill="rgba(245,158,11,.65)" stroke="#f59e0b" stroke-width="1"/>`);
    d.push(`<text x="42" y="36" text-anchor="middle" fill="#94a3b8" font-size="9">백(100)</text>`);
    for (let i=0;i<5;i++) d.push(`<rect x="${72+i*16}" y="10" width="12" height="24" rx="2" fill="rgba(56,189,248,.65)" stroke="#38bdf8" stroke-width="1"/>`);
    d.push(`<text x="122" y="44" text-anchor="middle" fill="#94a3b8" font-size="9">십(10)</text>`);
    for (let i=0;i<2;i++) d.push(`<circle cx="${158+i*18}" cy="22" r="7" fill="rgba(34,197,94,.65)" stroke="#22c55e" stroke-width="1"/>`);
    d.push(`<text x="174" y="42" text-anchor="middle" fill="#94a3b8" font-size="9">일(1)</text>`);
    d.push(`<text x="240" y="32" fill="#6366f1" font-size="18" font-weight="800" text-anchor="middle">352</text>`);
    d.push(`<text x="${W/2}" y="76" text-anchor="middle" fill="#64748b" font-size="11">300 + 50 + 2 = 352  |  자릿값 블록</text>`);
    return sw(d.join(''), '자릿값 블록 일러스트');
  }

  if (type === 'measurement') {
    const d = [];
    d.push(`<rect x="18" y="34" width="240" height="26" rx="4" fill="rgba(245,158,11,.1)" stroke="#f59e0b" stroke-width="1.8"/>`);
    for (let i=0;i<=12;i++) { const x=18+i*20, maj=i%2===0; d.push(`<line x1="${x}" y1="34" x2="${x}" y2="${maj?24:28}" stroke="#f59e0b" stroke-width="${maj?1.8:1}"/>`); if (maj) d.push(`<text x="${x}" y="20" text-anchor="middle" fill="#92400e" font-size="8">${i*2}</text>`); }
    d.push(`<rect x="18" y="34" width="80" height="26" rx="2" fill="rgba(245,158,11,.38)"/>`);
    d.push(`<text x="58" y="51" text-anchor="middle" fill="#92400e" font-size="12" font-weight="700">8cm</text>`);
    d.push(`<text x="275" y="48" fill="#64748b" font-size="9">1m=</text><text x="275" y="60" fill="#64748b" font-size="9">100cm</text>`);
    d.push(`<text x="${W/2}" y="80" text-anchor="middle" fill="#64748b" font-size="11">1cm = 10mm  |  1m = 100cm  |  1km = 1000m</text>`);
    return sw(d.join(''), '길이·측정 일러스트');
  }

  if (type === 'time') {
    const cx=52, cy=46, r=34;
    const hRad=(3.25*30-90)*Math.PI/180, mRad=(15*6-90)*Math.PI/180;
    const nums=Array.from({length:12},(_,i)=>{const a=((i+1)*30-90)*Math.PI/180;return `<text x="${(cx+Math.cos(a)*(r-11)).toFixed(1)}" y="${(cy+Math.sin(a)*(r-11)+3).toFixed(1)}" text-anchor="middle" fill="#94a3b8" font-size="7" font-weight="700">${i+1}</text>`;});
    return sw(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(30,41,59,.9)" stroke="#475569" stroke-width="2"/>` +
      nums.join('') +
      `<line x1="${cx}" y1="${cy}" x2="${(cx+r*.55*Math.cos(hRad)).toFixed(1)}" y2="${(cy+r*.55*Math.sin(hRad)).toFixed(1)}" stroke="#bae6fd" stroke-width="3.5" stroke-linecap="round"/>
<line x1="${cx}" y1="${cy}" x2="${(cx+r*.75*Math.cos(mRad)).toFixed(1)}" y2="${(cy+r*.75*Math.sin(mRad)).toFixed(1)}" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
<circle cx="${cx}" cy="${cy}" r="3" fill="#f8fafc"/>
<text x="120" y="24" fill="#bae6fd" font-size="14" font-weight="700">3시 15분</text>
<text x="120" y="44" fill="#64748b" font-size="11">1시간 = 60분</text>
<text x="120" y="60" fill="#64748b" font-size="11">1분 = 60초</text>
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">오전·오후  |  시·분·초 단위 변환</text>`,
    '시계 일러스트');
  }

  if (type === 'area') {
    const d = [];
    for (let r=0;r<3;r++) for (let c=0;c<4;c++) d.push(`<rect x="${28+c*26}" y="${10+r*22}" width="24" height="20" rx="2" fill="rgba(34,197,94,.2)" stroke="#22c55e" stroke-width="1"/>`);
    d.push(`<text x="138" y="80" text-anchor="middle" fill="#64748b" font-size="9">가로 4cm</text>`);
    d.push(`<text x="14" y="42" text-anchor="middle" fill="#64748b" font-size="9" transform="rotate(-90 14 42)">세로 3cm</text>`);
    d.push(`<text x="210" y="40" fill="#22c55e" font-size="20" font-weight="800" text-anchor="middle">12</text>`);
    d.push(`<text x="210" y="58" text-anchor="middle" fill="#64748b" font-size="11">cm²</text>`);
    d.push(`<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">4 × 3 = 12cm²  |  단위 넓이로 채우기</text>`);
    return sw(d.join(''), '넓이 모델 일러스트');
  }

  if (type === 'angle') {
    const cx=72, cy=66, r=44, deg=60, rad=deg*Math.PI/180;
    const ex=(cx+r*Math.cos(-rad)).toFixed(1), ey=(cy+r*Math.sin(-rad)).toFixed(1);
    const aR=22, axE=(cx+aR*Math.cos(-rad)).toFixed(1), ayE=(cy+aR*Math.sin(-rad)).toFixed(1);
    return sw(`<line x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/>
<path d="M ${cx+aR} ${cy} A ${aR} ${aR} 0 0 0 ${axE} ${ayE}" fill="rgba(245,158,11,.2)" stroke="#f59e0b" stroke-width="2"/>
<text x="${cx+36}" y="${cy-14}" fill="#fde68a" font-size="16" font-weight="700">${deg}°</text>
<text x="160" y="28" fill="#38bdf8" font-size="11">직각 = 90°</text>
<text x="160" y="46" fill="#22c55e" font-size="11">직선 = 180°</text>
<text x="160" y="64" fill="#f59e0b" font-size="11">한바퀴 = 360°</text>`,
    '각도 일러스트');
  }

  if (type === 'ratio') {
    return sw(`<rect x="18" y="16" width="156" height="26" rx="4" fill="rgba(56,189,248,.28)" stroke="#38bdf8" stroke-width="1.5"/>
<text x="96" y="33" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700">A — 3</text>
<rect x="18" y="50" width="104" height="26" rx="4" fill="rgba(34,197,94,.28)" stroke="#22c55e" stroke-width="1.5"/>
<text x="70" y="67" text-anchor="middle" fill="#22c55e" font-size="13" font-weight="700">B — 2</text>
<text x="216" y="44" fill="#a5b4fc" font-size="22" font-weight="900" text-anchor="middle">3:2</text>
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">A:B = 3:2  |  전체 5 중 A=3, B=2</text>`,
    '비율 바 일러스트');
  }

  if (type === 'number-bond') {
    const cx=160, topY=22, botY=66, sx=62;
    return sw(`<line x1="${cx}" y1="${topY+16}" x2="${cx-sx}" y2="${botY-14}" stroke="#94a3b8" stroke-width="1.8"/>
<line x1="${cx}" y1="${topY+16}" x2="${cx+sx}" y2="${botY-14}" stroke="#94a3b8" stroke-width="1.8"/>
<circle cx="${cx}" cy="${topY}" r="17" fill="rgba(56,189,248,.22)" stroke="#38bdf8" stroke-width="2"/>
<text x="${cx}" y="${topY+6}" text-anchor="middle" fill="#bae6fd" font-size="16" font-weight="700">10</text>
<circle cx="${cx-sx}" cy="${botY}" r="15" fill="rgba(34,197,94,.22)" stroke="#22c55e" stroke-width="2"/>
<text x="${cx-sx}" y="${botY+6}" text-anchor="middle" fill="#86efac" font-size="15" font-weight="700">3</text>
<circle cx="${cx+sx}" cy="${botY}" r="15" fill="rgba(251,146,60,.22)" stroke="#fb923c" stroke-width="2"/>
<text x="${cx+sx}" y="${botY+6}" text-anchor="middle" fill="#fed7aa" font-size="15" font-weight="700">7</text>
<text x="${cx}" y="88" text-anchor="middle" fill="#64748b" font-size="11">10 = 3 + 7  |  수 가르기 다이어그램</text>`,
    '수 결합 다이어그램');
  }

  if (type === 'symmetry') {
    const cx=100, cy=66;
    return sw(`<polygon points="${cx},${cy-44} ${cx-40},${cy+24} ${cx+40},${cy+24}" fill="rgba(139,92,246,.15)" stroke="#8b5cf6" stroke-width="2"/>
<line x1="${cx}" y1="6" x2="${cx}" y2="${H-8}" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="5,4"/>
<text x="165" y="30" fill="#f59e0b" font-size="12">대칭축</text>
<text x="162" y="50" fill="#8b5cf6" font-size="11">접으면</text>
<text x="162" y="66" fill="#8b5cf6" font-size="11">완전히 겹침</text>
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">선대칭  |  합동  |  이동·뒤집기·돌리기</text>`,
    '대칭 일러스트');
  }

  if (type === 'pattern') {
    const items=['○','△','○','△','?'];
    const els=items.map((s,i)=>`<text x="${24+i*56}" y="54" text-anchor="middle" font-size="${s==='?'?28:22}" fill="${s==='?'?'#38bdf8':'#94a3b8'}">${s}</text>`);
    return sw(els.join('') + `<text x="${W/2}" y="80" text-anchor="middle" fill="#64748b" font-size="11">규칙을 찾아 ?를 채우세요  |  반복·증가·감소 패턴</text>`, '패턴 일러스트');
  }

  if (type === 'statistics') {
    const data=[4,7,5,8,3], max=8, pal=['#38bdf8','#22c55e','#f59e0b','#8b5cf6','#fb7185'];
    const bW=30, gap=8, ox=22, oy=68;
    const bars=data.map((v,i)=>{const x=ox+i*(bW+gap), h=(v/max*48).toFixed(1); return `<rect x="${x}" y="${(oy-h).toFixed(1)}" width="${bW}" height="${h}" rx="3" fill="${pal[i]}44" stroke="${pal[i]}" stroke-width="1.3"/><text x="${x+bW/2}" y="${(oy-h-4).toFixed(1)}" text-anchor="middle" fill="${pal[i]}" font-size="9">${v}</text>`;});
    return sw(`<line x1="${ox-4}" y1="${oy}" x2="${ox+5*(bW+gap)}" y2="${oy}" stroke="#334155" stroke-width="1.5"/>` + bars.join('') +
      `<text x="${W/2}" y="86" text-anchor="middle" fill="#64748b" font-size="11">막대 그래프  |  꺾은선·원 그래프도 있어요</text>`, '통계 그래프 일러스트');
  }

  if (type === 'volume') {
    const ox=24, oy=72, rw=60, rd=28, rh=44;
    const fr=`${ox},${oy} ${ox+rw},${oy} ${ox+rw},${oy-rh} ${ox},${oy-rh}`;
    const tp=`${ox},${oy-rh} ${ox+rw},${oy-rh} ${ox+rw+rd*.55},${oy-rh-rd*.38} ${ox+rd*.55},${oy-rh-rd*.38}`;
    const ri=`${ox+rw},${oy} ${ox+rw+rd*.55},${oy-rd*.38} ${ox+rw+rd*.55},${oy-rh-rd*.38} ${ox+rw},${oy-rh}`;
    return sw(`<polygon points="${fr}" fill="rgba(56,189,248,.15)" stroke="#38bdf8" stroke-width="1.5"/>
<polygon points="${tp}" fill="rgba(56,189,248,.28)" stroke="#38bdf8" stroke-width="1.5"/>
<polygon points="${ri}" fill="rgba(56,189,248,.1)" stroke="#38bdf8" stroke-width="1.5"/>
<text x="155" y="32" fill="#94a3b8" font-size="11">가로 × 세로 × 높이</text>
<text x="155" y="52" fill="#6366f1" font-size="18" font-weight="700">= 부피</text>
<text x="155" y="70" fill="#64748b" font-size="11">단위: cm³</text>
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">직육면체 부피  |  단위 cm³ = 세제곱센티미터</text>`, '부피 일러스트');
  }

  if (type === 'gcd-lcm') {
    return sw(`<ellipse cx="110" cy="42" rx="35" ry="28" fill="rgba(56,189,248,.18)" stroke="#38bdf8" stroke-width="1.8"/>
<ellipse cx="148" cy="42" rx="35" ry="28" fill="rgba(34,197,94,.18)" stroke="#22c55e" stroke-width="1.8"/>
<text x="84" y="46" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="700">2  4</text>
<text x="129" y="46" text-anchor="middle" fill="#a5b4fc" font-size="12" font-weight="800">6</text>
<text x="172" y="46" text-anchor="middle" fill="#22c55e" font-size="11" font-weight="700">9  18</text>
<text x="84" y="80" text-anchor="middle" fill="#64748b" font-size="9">12의 약수</text>
<text x="173" y="80" text-anchor="middle" fill="#64748b" font-size="9">18의 약수</text>
<text x="244" y="36" fill="#6366f1" font-size="11" font-weight="700">GCD=6</text>
<text x="244" y="56" fill="#22c55e" font-size="11" font-weight="700">LCM=36</text>
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">벤 다이어그램  |  공약수 ↔ 공배수</text>`, '최대공약수·최소공배수 일러스트');
  }

  if (type === 'equation') {
    return sw(`<line x1="160" y1="16" x2="160" y2="48" stroke="#94a3b8" stroke-width="2"/>
<line x1="72" y1="48" x2="248" y2="48" stroke="#94a3b8" stroke-width="2.5"/>
<rect x="52" y="50" width="94" height="26" rx="5" fill="rgba(56,189,248,.22)" stroke="#38bdf8" stroke-width="1.8"/>
<text x="99" y="67" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700">x + 5</text>
<rect x="174" y="50" width="60" height="26" rx="5" fill="rgba(34,197,94,.22)" stroke="#22c55e" stroke-width="1.8"/>
<text x="204" y="67" text-anchor="middle" fill="#22c55e" font-size="13" font-weight="700">12</text>
<text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">x + 5 = 12 → x = 7  |  등식의 저울</text>`, '방정식 저울 일러스트');
  }

  if (type === 'percent') {
    const cells=[];
    for (let r=0;r<5;r++) for (let c=0;c<10;c++) { const idx=r*10+c, f=idx<30, x=14+c*22, y=6+r*14; cells.push(`<rect x="${x}" y="${y}" width="20" height="12" rx="1" fill="${f?'rgba(99,102,241,.72)':'rgba(100,116,139,.15)'}" stroke="${f?'#6366f1':'rgba(148,163,184,.2)'}" stroke-width="0.8"/>`); }
    return sw(cells.join('') + `<text x="236" y="46" fill="#6366f1" font-size="22" font-weight="800" text-anchor="middle">30%</text><text x="236" y="64" text-anchor="middle" fill="#64748b" font-size="10">100칸 중 30칸</text><text x="${W/2}" y="88" text-anchor="middle" fill="#64748b" font-size="11">백분율 = (부분/전체) × 100</text>`, '백분율 일러스트');
  }

  if (type === 'proportion') {
    const hd=['x','1','2','3','?'], vl=['y','3','6','9','?'];
    const cw_=50, sx_=14, sy_=14, ch_=26;
    const cells=[];
    [hd,vl].forEach((row,ri)=>row.forEach((cell,ci)=>{
      const rx=sx_+ci*cw_, ry=sy_+ri*ch_;
      const isH=ri===0, isQ=cell==='?';
      cells.push(`<rect x="${rx}" y="${ry}" width="${cw_-2}" height="${ch_-2}" fill="${isH?'rgba(99,102,241,.2)':isQ?'rgba(56,189,248,.1)':'rgba(255,255,255,.05)'}" stroke="rgba(148,163,184,.3)" stroke-width="1"/>
<text x="${rx+cw_/2-1}" y="${ry+17}" text-anchor="middle" fill="${isH?'#a5b4fc':isQ?'#38bdf8':'#dbeafe'}" font-size="11" font-weight="${isH||isQ?700:400}">${escapeHTML(cell)}</text>`);
    }));
    return sw(cells.join('') + `<text x="${W/2}" y="80" text-anchor="middle" fill="#64748b" font-size="11">x가 2배 → y도 2배  |  정비례 관계표</text>`, '정비례 표 일러스트');
  }

  // 기본 fallback SVG
  return sw(`<rect x="20" y="18" width="${W-40}" height="${H-36}" rx="8" fill="rgba(56,189,248,.08)" stroke="rgba(56,189,248,.2)" stroke-width="1.5"/>
<text x="${W/2}" y="${H/2+4}" text-anchor="middle" fill="#94a3b8" font-size="14">수학 개념 학습</text>
<text x="${W/2}" y="${H/2+22}" text-anchor="middle" fill="#64748b" font-size="11">문제를 풀며 개념을 익혀요!</text>`, '수학 개념');
}

// ── visual ↔ problem 정합성 검증 ─────────────────────────
// [visual.type, 해당 visual이 유효한 skillId 패턴] — 나열된 타입은 매칭되는 스킬에서만 허용
const VISUAL_TYPE_SKILL_RULES = [
  ["clock",               /clock|time/],
  ["ruler",               /ruler|measure|length/],
  ["angle-diagram",       /angle/],
  ["probability-bag",     /probability/],
  ["coin-chance",         /probability|coin/],
  ["coordinate-plane",    /coordinate/],
  ["symmetry-shape",      /symmetry/],
  ["rotation-180",        /rotation/],
  ["congruent-triangles", /congruent/],
  ["cube-stack",          /cube.stack|stack/],
  ["solid-shape",         /solid|prism|pyramid|cylinder|cone|sphere/],
  ["net-diagram",         /net|solid|prism|pyramid/],
  ["range-line",          /range|inequality/],
  ["bar-chart",           /chart|graph|data/],
  ["line-chart",          /chart|graph|data/],
  ["circle-chart",        /chart|graph|data/],
  ["pictograph",          /pictograph|chart|graph/],
  ["double-number-line",  /proportion|ratio/],
  ["circle-diagram",      /circle/],
  ["circle-pattern",      /circle/],
  ["parallel-lines",      /parallel|perpendicular/],
  ["quadrilateral-diagram",/quadrilateral|사각형/],
  ["polygon-diagram",     /polygon|다각형/],
];

function isVisualTypeCompatible(visualType, skillId) {
  const rule = VISUAL_TYPE_SKILL_RULES.find(([type]) => type === visualType);
  if (!rule) return true; // 규칙 없는 타입은 통과
  return rule[1].test(skillId);
}

function isVisualDataConsistent(v, problem) {
  const text = `${problem.question || ""} ${problem.expression || ""} ${problem.answer || ""}`;

  if (v.type === "clock") {
    const hourM = text.match(/(\d{1,2})\s*시/);
    const minM  = text.match(/(\d{1,2})\s*분/);
    if (hourM && v.hour !== undefined && Number(hourM[1]) !== v.hour) return false;
    if (minM  && v.minute !== undefined && Number(minM[1]) !== v.minute) return false;
    return true;
  }

  if (v.type === "fraction-strip" || v.type === "fraction-circle") {
    const fracs = [...text.matchAll(/(\d+)\/(\d+)/g)];
    if (fracs.length === 0) return true;
    return fracs.some(m => Number(m[1]) === v.numerator && Number(m[2]) === v.denominator);
  }

  if (v.type === "angle-diagram") {
    if (v.degrees === undefined) return true;
    const nums = text.match(/\d+/g) || [];
    return nums.includes(String(v.degrees));
  }

  if (v.type === "ruler") {
    if (v.length === undefined) return true;
    const nums = text.match(/\d+(?:\.\d+)?/g) || [];
    return nums.includes(String(v.length));
  }

  return true;
}

// ── 메인 비주얼 라우터 ────────────────────────────────────
function buildElementaryVisual(problem) {
  const v = problem.visual;
  if (v) {
    const id = problem.skillId || "";

    // 검증 1: visual.type ↔ skillId 타입 호환성
    if (!isVisualTypeCompatible(v.type, id)) {
      return enhanceMathVisual(ivAutoArithmetic(problem), problem.question || problem.skillTitle);
    }

    // 검증 2: visual 데이터 ↔ 문제 수치 정합성 (clock·분수·각도·자 등)
    if (!isVisualDataConsistent(v, problem)) {
      return enhanceMathVisual(ivExpressionBox(problem), problem.question || problem.skillTitle);
    }

    // 곱셈 문제는 data-table/object-array 대신 세로셈 SVG 우선 표시
    if ((id.includes("mul") || id.includes("times")) &&
        (v.type === "data-table" || v.type === "object-array")) {
      const col = ivColumnMul(problem);
      if (col) return enhanceMathVisual(col, problem.question || problem.skillTitle);
    }
    const map = {
      "number-line":          ivNumberLine,
      "number-bond":          ivNumberBond,
      "ten-frame":            ivTenFrame,
      "fraction-strip":       ivFractionStrip,
      "rectangle":            ivRectangle,
      "square":               ivSquare,
      "triangle":             ivTriangle,
      "parallelogram":        ivParallelogram,
      "trapezoid":            ivTrapezoid,
      "data-table":           ivDataTable,
      "place-value-blocks":   ivPlaceValueBlocks,
      "base-ten-blocks":      ivPlaceValueBlocks,
      "bar-chart":            ivBarChartV,
      "object-array":         ivObjectArrayV,
      "ruler":                ivRuler,
      "clock":                ivClock,
      "symmetry-shape":       ivSymmetryShape,
      "shape-pattern":        ivShapePattern,
      "circle-pattern":       ivCirclePattern,
      "circle-diagram":       ivCircleDiagram,
      "angle-diagram":        ivAngleDiagram,
      "parallel-lines":       ivParallelLines,
      "quadrilateral-diagram":ivQuadrilateralDiagram,
      "polygon-diagram":      ivPolygonDiagram,
      "range-line":           ivRangeLine,
      "line-chart":           ivLineChart,
      "cuboid":               ivCuboid,
      "composite-rect":       ivCompositeRect,
      "congruent-triangles":  ivCongruentTriangles,
      "coordinate-plane":     ivCoordinatePlane,
      "cube-stack":           ivCubeStack,
      "coin-chance":          ivCoinChance,
      "probability-bag":      ivProbabilityBag,
      "solid-shape":          ivSolidShape,
      "net-diagram":          ivProfessionalNetDiagram,
      "ratio-strip":          ivRatioStrip,
      "circle-chart":         ivCircleChart,
      "bar-model":            ivBarModel,
      "fraction-circle":      ivFractionCircle,
      "area-model":           ivAreaModel,
      "part-whole-box":       ivPartWholeBox,
      "tape-diagram":         ivTapeDiagram,
      "cuisenaire-rods":      ivCuisenaireRods,
      "double-number-line":   ivDoubleNumberLine,
    };
    if (map[v.type]) return enhanceMathVisual(map[v.type](v, problem), problem.question || problem.skillTitle);
    return enhanceMathVisual(ivExpressionBox(problem), problem.question || problem.skillTitle);
  }
  return enhanceMathVisual(ivAutoArithmetic(problem), problem.question || problem.skillTitle);
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
  // thinking — 파란 뇌파 웨이브 (무한 반복 펄스)
  const waveCSS = `@keyframes iv-wavepulse{0%,100%{stroke-dashoffset:0;opacity:.9}50%{stroke-dashoffset:-20;opacity:.4}}`;
  const wave = `<path d="M 10 ${H/2} Q 25 ${H/2-8} 40 ${H/2} Q 55 ${H/2+8} 70 ${H/2} Q 85 ${H/2-8} 100 ${H/2} Q 115 ${H/2+8} ${W} ${H/2}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8,4" style="animation:iv-wavepulse 1.2s ease-in-out infinite"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block" aria-hidden="true"><defs><style>${IV_CSS}${waveCSS}</style></defs>${wave}</svg>`;
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
}

// ============================================================
// skillId 기반 visual 자동 주입 (generators.js에 visual 없는 경우 보완)
// ============================================================
const NEW_VISUAL_TYPES = new Set(['bar-model','fraction-circle','area-model','part-whole-box','tape-diagram','cuisenaire-rods','double-number-line']);

function injectVisualBySkill(raw, sid) {
  if (!raw) return raw;
  // 이미 새 visual 타입이면 유지
  if (raw.visual && NEW_VISUAL_TYPES.has(raw.visual.type)) return raw;

  const expr = String(raw.expression || raw.prompt || '');

  // 두 자리 × 두 자리 곱셈 → 넓이 모델 (기존 visual 없을 때만)
  if (!raw.visual && (sid.includes('two-digit-two-digit') || sid.includes('two-digit-times-two'))) {
    const m = expr.match(/(\d{2,3})\s*[×x]\s*(\d{2,3})/);
    if (m && m[1].length >= 2 && m[2].length >= 2) {
      return { ...raw, visual: { type: 'area-model', a: Number(m[1]), b: Number(m[2]) } };
    }
  }

  // 분수(fraction-strip 또는 visual 없음) → 분수 원 40% 확률 교체
  if (/fraction/.test(sid)) {
    const canReplace = !raw.visual || raw.visual.type === 'fraction-strip';
    if (canReplace && Math.random() < 0.4) {
      const m = expr.match(/(\d+)\/(\d+)/);
      if (m && Number(m[2]) >= 2 && Number(m[2]) <= 12) {
        return { ...raw, visual: { type: 'fraction-circle', numerator: Number(m[1]), denominator: Number(m[2]) } };
      }
    }
  }

  // 덧셈/뺄셈 문장제 → 바 모델 (visual 없을 때)
  if (!raw.visual && /word/.test(sid) && /(add|sub)/.test(sid)) {
    const nums = (expr.match(/\d+/g) || []).map(Number).filter(n => n > 0 && n < 500).slice(0, 2);
    if (nums.length === 2) {
      return { ...raw, visual: { type: 'bar-model', mode: 'part-whole',
        whole: { label: String(nums[0]+nums[1]), value: nums[0]+nums[1] },
        parts: [{ label: String(nums[0]), value: nums[0] }, { label: '?', value: null }] } };
    }
  }

  // 비율 → 테이프 다이어그램 (visual 없을 때)
  if (!raw.visual && /ratio/.test(sid)) {
    const m = expr.match(/(\d+)\s*[:대]\s*(\d+)/);
    if (m) {
      return { ...raw, visual: { type: 'tape-diagram',
        items: [{ label: 'A', value: Number(m[1]) }, { label: 'B', value: Number(m[2]) }],
        showTotal: false } };
    }
  }

  // 정비례 → 이중 수직선 (visual 없을 때)
  if (!raw.visual && /direct.proportion|proportion.table/.test(sid)) {
    const nums = (expr.match(/\d+/g) || []).map(Number).filter(n => n > 0 && n <= 200).slice(0, 4);
    if (nums.length >= 4) {
      return { ...raw, visual: { type: 'double-number-line',
        top:    { label: '', values: [0, nums[0], nums[1]] },
        bottom: { label: '', values: [0, nums[2], nums[3]] } } };
    }
  }

  // 수 분해·number-bond (1~2학년 작은 수) → 쿠이즈네르 막대 (visual 없을 때, 30% 확률)
  if (!raw.visual && /(number.bond|split.number|make.ten|decompose)/.test(sid) && Math.random() < 0.3) {
    const nums = (expr.match(/\d+/g) || []).map(Number).filter(n => n >= 1 && n <= 10);
    if (nums.length >= 2) {
      return { ...raw, visual: { type: 'cuisenaire-rods', rods: nums.slice(0, 4), showSum: true } };
    }
  }

  return raw;
}

// ============================================================
// 문제 생성
// ============================================================
function generateProblem(topicEntry) {
  if (!topicEntry || typeof topicEntry.generate !== "function") return null;
  let raw;
  try { raw = topicEntry.generate(); } catch(e) { return null; }
  if (!raw) return null;
  raw = injectVisualBySkill(raw, topicEntry.id);
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
    solutionSteps: raw.solutionSteps || [],
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
    showConfetti();
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

// ============================================================
// 국제 교과서 개념 설명 카드 (미국·영국·중국·홍콩)
// ============================================================
const CONCEPT_BANK = [
  {
    match: ['add-carry','make-ten','add-bridge','add-under-20','op-m08-add','op-m11-add'],
    title: '받아올림 덧셈', emoji: '➕',
    core: '일의 자리 합이 10이 넘으면 10을 십의 자리로 올려요.',
    example: '7 + 8 = ?  →  7 + 3 = 10,  10 + 5 = 15',
    real: '색연필 7자루에 8자루를 더 사면 모두 15자루!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Bridge through 10: split one number to make 10 first' },
      { flag:'🇬🇧', label:'UK', text:'Number Bond: 8 = 3 + 5 → fill the 10, then add 5' },
      { flag:'🇨🇳', label:'CN', text:'凑十法 — 先凑够10，再加剩余的数' },
      { flag:'🇭🇰', label:'HK', text:'湊十法 — 數夠10，再數餘數加上去' },
    ],
    remember: '십의 자리에 올라간 "1"을 작게 꼭 써두세요!',
  },
  {
    match: ['add-no-carry','add-under-10','add-wide','three-number-add','word-add'],
    title: '기본 덧셈', emoji: '➕',
    core: '두 수 또는 세 수를 합쳐서 전체를 구해요.',
    example: '3 + 4 = 7',
    real: '주머니에 사탕 3개, 가방에 4개 → 합치면 7개!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Use a number line — jump right!' },
      { flag:'🇬🇧', label:'UK', text:'Count on from the bigger number' },
      { flag:'🇨🇳', label:'CN', text:'数数法 — 从大数开始往上数' },
      { flag:'🇭🇰', label:'HK', text:'從大數開始向上數' },
    ],
    remember: '덧셈은 순서를 바꿔도 같아요! 3+4 = 4+3',
  },
  {
    match: ['sub-borrow','sub-bridge','op-m08-sub','op-m11-sub','two-digit-sub-borrow'],
    title: '받아내림 뺄셈', emoji: '➖',
    core: '일의 자리에서 뺄 수 없으면 십의 자리에서 10을 빌려 와요.',
    example: '32 − 7 = ?  →  12 − 7 = 5,  20 + 5 = 25',
    real: '지갑에 32,000원, 7,000원짜리 과자 사면 25,000원 남아요!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Regroup: borrow 10 from the tens place' },
      { flag:'🇬🇧', label:'UK', text:'Count back or use a number line' },
      { flag:'🇨🇳', label:'CN', text:'退位减法 — 从十位借1当10用' },
      { flag:'🇭🇰', label:'HK', text:'退位減法 — 從十位借1作10用' },
    ],
    remember: '빌린 자리에 "작은 10"을 써서 헷갈리지 않게!',
  },
  {
    match: ['sub-no-borrow','sub-under','sub-wide','word-sub'],
    title: '기본 뺄셈', emoji: '➖',
    core: '전체에서 일부를 덜어내면 나머지를 구할 수 있어요.',
    example: '9 − 4 = 5',
    real: '쿠키 9개 중 4개를 먹으면 5개 남아요!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Count back on a number line' },
      { flag:'🇬🇧', label:'UK', text:'Think "what + 4 = 9?" → addition helps!' },
      { flag:'🇨🇳', label:'CN', text:'想加算减 — 用加法帮助算减法' },
      { flag:'🇭🇰', label:'HK', text:'想加做減 — 用加法想減法' },
    ],
    remember: '뺄셈과 덧셈은 거꾸로예요. 9−4=5 ↔ 5+4=9',
  },
  {
    match: ['multiply-basic','times-table','times-missing','multiplication-array','repeated-addition','missing-factor','missing-multiplier'],
    title: '곱셈구구', emoji: '✖️',
    core: '같은 수를 여러 번 더하는 것을 곱셈으로 나타내요.',
    example: '4 × 3 = 4 + 4 + 4 = 12',
    real: '한 상자에 과자 4개, 3상자이면 4×3=12개!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Arrays: rows × columns = total' },
      { flag:'🇬🇧', label:'UK', text:'Repeated addition & skip-counting' },
      { flag:'🇨🇳', label:'CN', text:'乘法口诀 — 背熟乘法表' },
      { flag:'🇭🇰', label:'HK', text:'乘法口訣 — 背熟乘法表' },
    ],
    remember: '순서를 바꿔도 같아요! 4×3 = 3×4 = 12',
  },
  {
    match: ['two-digit-two-digit','two-digit-times-two','three-digit-times','mul-3x2','mul-word','two-digit-times','tens-times','big-multiply'],
    title: '두 자리(세 자리) 곱셈', emoji: '✖️',
    core: '큰 수 곱셈은 자릿값으로 나눠서 더하면 쉬워요.',
    example: '23 × 14 = 20×14 + 3×14 = 280 + 42 = 322',
    real: '한 줄에 23명, 14줄이면 23×14=322명!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Area model: split into tens × tens, tens × ones…' },
      { flag:'🇬🇧', label:'UK', text:'Grid method: draw a rectangle divided by place value' },
      { flag:'🇨🇳', label:'CN', text:'竖式计算 — 对齐位数逐步相乘' },
      { flag:'🇭🇰', label:'HK', text:'直式計算 — 對齊位數逐步相乘' },
    ],
    remember: '자릿수를 맞춰 써야 실수하지 않아요!',
  },
  {
    match: ['division-basic','division-remainder','div-3by','long-division','div-word'],
    title: '나눗셈', emoji: '➗',
    core: '전체를 같은 크기로 나누거나 몇 묶음이 되는지 구해요.',
    example: '12 ÷ 3 = 4  (3씩 4묶음)',
    real: '초콜릿 12개를 친구 3명에게 나누면 각각 4개!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Equal groups: share equally or make equal groups' },
      { flag:'🇬🇧', label:'UK', text:'Grouping & sharing — use times tables in reverse' },
      { flag:'🇨🇳', label:'CN', text:'用乘法口诀帮助做除法' },
      { flag:'🇭🇰', label:'HK', text:'用乘法口訣幫助做除法' },
    ],
    remember: '나눗셈 ↔ 곱셈! 12÷3=4 ↔ 4×3=12',
  },
  {
    match: ['fraction-add','fraction-sub','like-denom','mixed-like','proper-fraction-sub','mixed-fraction','common-denominator','fraction-add-sub'],
    title: '분수 덧셈·뺄셈', emoji: '🍕',
    core: '분모가 같으면 분자끼리만 더하거나 빼요.',
    example: '3/7 + 2/7 = 5/7  (분모 7은 그대로)',
    real: '피자 7조각 중 3조각 + 2조각 = 5조각!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Same denominator = add/subtract only numerators' },
      { flag:'🇬🇧', label:'UK', text:'Fraction strips show equal parts visually' },
      { flag:'🇨🇳', label:'CN', text:'同分母分数加减 — 分母不变，分子相加减' },
      { flag:'🇭🇰', label:'HK', text:'同分母分數加減 — 分母不變，分子相加減' },
    ],
    remember: '분모는 절대 더하지 않아요. 분자만!',
  },
  {
    match: ['fraction-compare','fraction-order','unit-fraction-compare','like-denom-compare','compare-fractions','order-fractions','equivalent-fraction','equivalent-choice','reduce-fraction','fraction-numberline','fraction-decimal'],
    title: '분수 비교', emoji: '⚖️',
    core: '분모가 같으면 분자가 클수록, 분자가 같으면 분모가 작을수록 커요.',
    example: '3/5 > 2/5  /  1/3 > 1/5',
    real: '피자 같은 크기에서 3조각 > 2조각!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Use fraction bars or number lines to compare' },
      { flag:'🇬🇧', label:'UK', text:'Same denominator → compare numerators' },
      { flag:'🇨🇳', label:'CN', text:'同分母比大小 — 分子大的分数大' },
      { flag:'🇭🇰', label:'HK', text:'同分母比大小 — 分子大的分數大' },
    ],
    remember: '통분하면 어떤 분수든 비교할 수 있어요!',
  },
  {
    match: ['fraction-times','fraction-of-quantity','integer-times-fraction','mixed-times'],
    title: '분수의 곱셈', emoji: '✖️',
    core: '분수 × 분수는 분자끼리, 분모끼리 곱해요.',
    example: '2/3 × 3/4 = (2×3)/(3×4) = 6/12 = 1/2',
    real: '케이크 2/3판의 3/4는 얼마? → 1/2판!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Multiply numerators and denominators straight across' },
      { flag:'🇬🇧', label:'UK', text:'Simplify before multiplying to keep numbers small' },
      { flag:'🇨🇳', label:'CN', text:'分数乘法 — 分子乘分子，分母乘分母' },
      { flag:'🇭🇰', label:'HK', text:'分數乘法 — 分子乘分子，分母乘分母' },
    ],
    remember: '먼저 약분하면 계산이 훨씬 쉬워요!',
  },
  {
    match: ['fraction-divide','natural-divide-fraction','mixed-divide'],
    title: '분수의 나눗셈', emoji: '➗',
    core: '나누는 분수를 뒤집어서(역수) 곱해요.',
    example: '3/4 ÷ 1/2 = 3/4 × 2/1 = 6/4 = 3/2',
    real: '3/4m 끈을 1/2m씩 자르면 몇 도막? → 1.5도막!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Keep-Change-Flip (KCF): keep ÷ → × → flip divisor' },
      { flag:'🇬🇧', label:'UK', text:'Multiply by the reciprocal of the divisor' },
      { flag:'🇨🇳', label:'CN', text:'除以一个数 = 乘以它的倒数' },
      { flag:'🇭🇰', label:'HK', text:'除以一個數 = 乘以它的倒數' },
    ],
    remember: '나누는 분수만 뒤집어요. 앞의 수는 그대로!',
  },
  {
    match: ['decimal-add','decimal-sub','decimal-tenths','decimal-read','decimal-two-add','decimal-two-sub','decimal-compare','decimal-place','decimal-relation','decimal-word'],
    title: '소수 덧셈·뺄셈', emoji: '🔢',
    core: '소수점을 맞추면 자릿값끼리 더하거나 빼요.',
    example: '1.4 + 0.8 = 2.2  (소수점 아래끼리 먼저)',
    real: '키 1.4m인 친구보다 0.8m 더 크면 2.2m!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Line up decimal points before adding/subtracting' },
      { flag:'🇬🇧', label:'UK', text:'Use place-value columns for tenths and hundredths' },
      { flag:'🇨🇳', label:'CN', text:'小数加减 — 小数点对齐再计算' },
      { flag:'🇭🇰', label:'HK', text:'小數加減 — 小數點對齊再計算' },
    ],
    remember: '소수점 위치가 어긋나면 틀려요 — 꼭 맞추세요!',
  },
  {
    match: ['decimal-times','decimal-divide','decimal-missing-factor','decimal-area','integer-times-decimal','decimal-times-integer'],
    title: '소수 곱셈·나눗셈', emoji: '🔢',
    core: '소수 곱셈은 정수처럼 계산 후 소수점을 이동해요.',
    example: '0.3 × 4 = 1.2  (3×4=12, 소수 한 자리 → 1.2)',
    real: '한 병 0.3L짜리 주스 4병 → 1.2L!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Multiply as whole numbers, then adjust the decimal' },
      { flag:'🇬🇧', label:'UK', text:'Count total decimal places in the answer' },
      { flag:'🇨🇳', label:'CN', text:'先按整数乘，再点小数点' },
      { flag:'🇭🇰', label:'HK', text:'先按整數乘，再點小數點' },
    ],
    remember: '곱한 뒤 소수점은 두 수의 소수 자리 수를 더한 만큼!',
  },
  {
    match: ['place-value','tens-ones','three-digit','four-digit','big-number','million'],
    title: '자릿값', emoji: '🏛️',
    core: '같은 숫자라도 어느 자리에 있느냐에 따라 값이 달라요.',
    example: '352 = 300 + 50 + 2',
    real: '우리 학교 학생 352명 = 100명 묶음 3개 + 10명 묶음 5개 + 1명 2개!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Place value chart: ones, tens, hundreds…' },
      { flag:'🇬🇧', label:'UK', text:'Base-ten blocks: cubes=1, rods=10, flats=100' },
      { flag:'🇨🇳', label:'CN', text:'数位顺序 — 个十百千万' },
      { flag:'🇭🇰', label:'HK', text:'數位順序 — 個十百千萬' },
    ],
    remember: '자릿값 표로 쓰면 덧셈·뺄셈 실수가 줄어요!',
  },
  {
    match: ['number-bond','split-number','missing-add','zero-add','fact-family','ten-pairs'],
    title: '수 가르기·모으기', emoji: '🔗',
    core: '하나의 수를 두 부분으로 나누거나, 두 부분을 하나로 합칠 수 있어요.',
    example: '10 = 3 + 7  /  4 + 6 = 10',
    real: '연필 10자루를 필통에 3자루, 책상에 7자루!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Number bond circle diagram: whole at top, parts below' },
      { flag:'🇬🇧', label:'UK', text:'Part-part-whole model — fill in any missing part' },
      { flag:'🇨🇳', label:'CN', text:'分与合 — 把一个数分成两部分' },
      { flag:'🇭🇰', label:'HK', text:'分與合 — 把一個數分成兩部分' },
    ],
    remember: '3 + 7 = 10, 7 + 3 = 10, 10 − 3 = 7, 10 − 7 = 3 — 네 식이 한 가족!',
  },
  {
    match: ['rectangle','perimeter','grid-area','rectangle-area','rectangle-perimeter','area-unit','square-perimeter'],
    title: '직사각형·넓이·둘레', emoji: '📐',
    core: '둘레 = (가로 + 세로) × 2,  넓이 = 가로 × 세로',
    example: '가로 5cm, 세로 3cm → 둘레 16cm, 넓이 15cm²',
    real: '방 바닥 타일 몇 개 필요한지 → 넓이로 계산!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Area = tiling with unit squares' },
      { flag:'🇬🇧', label:'UK', text:'Perimeter = walking around the edge' },
      { flag:'🇨🇳', label:'CN', text:'周长 = 各边之和  /  面积 = 长×宽' },
      { flag:'🇭🇰', label:'HK', text:'周界 = 各邊之和  /  面積 = 長×寬' },
    ],
    remember: '넓이는 cm², 둘레는 cm — 단위가 달라요!',
  },
  {
    match: ['triangle-area','parallelogram-area','trapezoid-area','composite-area','parallelogram','trapezoid','rhombus'],
    title: '삼각형·평행사변형·사다리꼴 넓이', emoji: '📐',
    core: '삼각형 = 밑×높이÷2,  평행사변형 = 밑×높이,  사다리꼴 = (윗변+아랫변)×높이÷2',
    example: '밑 6cm, 높이 4cm인 삼각형 → 6×4÷2 = 12cm²',
    real: '지붕 모양의 삼각형 판자 면적 구할 때!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Triangle = ½ × base × height (half of rectangle)' },
      { flag:'🇬🇧', label:'UK', text:'Parallelogram: slide the triangle to make a rectangle' },
      { flag:'🇨🇳', label:'CN', text:'三角形 = 底×高÷2  梯形 = (上底+下底)×高÷2' },
      { flag:'🇭🇰', label:'HK', text:'三角形 = 底×高÷2  梯形 = (上底+下底)×高÷2' },
    ],
    remember: '높이는 반드시 밑변에 수직! 기울어진 옆면이 아니에요.',
  },
  {
    match: ['angle','angle-sum','angle-measure','angle-estimate','angle-in-shape','triangle-kind','quadrilateral-angle','triangle-angle','equilateral-angle','isosceles-angle','parallel-perpendicular','parallel-distance','polygon-diagonal','polygon-name','regular-polygon','quadrilateral-kind'],
    title: '각도', emoji: '📐',
    core: '각도는 두 선이 벌어진 크기예요. 직각 = 90°, 한 바퀴 = 360°.',
    example: '삼각형 세 각의 합 = 180°',
    real: '시계 12시 방향과 3시 방향 사이 → 90°(직각)!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Use a protractor — line up the baseline, read the scale' },
      { flag:'🇬🇧', label:'UK', text:'Right angle = 90°, straight line = 180°, full turn = 360°' },
      { flag:'🇨🇳', label:'CN', text:'用量角器量角 — 一边对准0度，读另一边' },
      { flag:'🇭🇰', label:'HK', text:'用量角器量角 — 一邊對準0度，讀另一邊' },
    ],
    remember: '삼각형 내각의 합 = 180°,  사각형 내각의 합 = 360°',
  },
  {
    match: ['cuboid-volume','stacked-cubes','cube-count','volume-unit','prep-volume'],
    title: '부피', emoji: '📦',
    core: '직육면체 부피 = 가로 × 세로 × 높이',
    example: '2cm × 3cm × 4cm = 24cm³',
    real: '냉장고에 물 2×3×4=24L 들어가요!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Volume = filling with unit cubes layer by layer' },
      { flag:'🇬🇧', label:'UK', text:'L × W × H — same as area × height' },
      { flag:'🇨🇳', label:'CN', text:'体积 = 长×宽×高  (单位：立方厘米 cm³)' },
      { flag:'🇭🇰', label:'HK', text:'體積 = 長×寬×高  (單位：立方厘米 cm³)' },
    ],
    remember: '단위가 cm³ (세제곱센티미터)예요 — cm²와 달라요!',
  },
  {
    match: ['ratio','simplify-ratio','ratio-rate','ratio-write','ratio-equivalent','proportional-distribution'],
    title: '비와 비율', emoji: '⚖️',
    core: '두 수의 비교를 나타내요. A : B = A를 B로 나눈 값(비율)',
    example: '3 : 5 → 비율 = 3/5 = 0.6',
    real: '오렌지주스 3컵 : 물 5컵으로 음료 만들기!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Ratio = part-to-part, rate = part-to-whole' },
      { flag:'🇬🇧', label:'UK', text:'Simplify ratio like a fraction: divide by GCD' },
      { flag:'🇨🇳', label:'CN', text:'比 = A:B  / 比值 = A÷B' },
      { flag:'🇭🇰', label:'HK', text:'比 = A:B  / 比值 = A÷B' },
    ],
    remember: '비를 가장 간단하게! 6:4 → 3:2 (÷2)',
  },
  {
    match: ['direct-proportion','direct-proportion-table','direct-proportion-graph','proportion-check','proportion-missing'],
    title: '정비례', emoji: '📈',
    core: 'x가 2배, 3배 되면 y도 2배, 3배 — 항상 x/y가 일정해요.',
    example: '속도 60km/h → 1시간:60km, 2시간:120km, 3시간:180km',
    real: '마트에서 사과 1개 500원, 3개 1500원 — 정비례!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Direct proportion: y = kx (k is the constant of proportionality)' },
      { flag:'🇬🇧', label:'UK', text:'Double number line shows proportional relationships' },
      { flag:'🇨🇳', label:'CN', text:'正比例 — y/x = 常数 (比例系数)' },
      { flag:'🇭🇰', label:'HK', text:'正比例 — y/x = 常數 (比例係數)' },
    ],
    remember: '표에서 x × k = y가 항상 같으면 정비례!',
  },
  {
    match: ['inverse-proportion','inverse-proportion-table'],
    title: '반비례', emoji: '📉',
    core: 'x가 2배 되면 y는 1/2배 — 두 수의 곱이 항상 일정해요.',
    example: '속도×시간=거리 → 속도 2배이면 시간 1/2배',
    real: '같은 일을 사람이 많을수록 빨리 끝내요!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Inverse proportion: y = k/x (xy = constant)' },
      { flag:'🇬🇧', label:'UK', text:'As one increases, the other decreases proportionally' },
      { flag:'🇨🇳', label:'CN', text:'反比例 — xy = 常数' },
      { flag:'🇭🇰', label:'HK', text:'反比例 — xy = 常數' },
    ],
    remember: 'x × y = 항상 같은 수이면 반비례!',
  },
  {
    match: ['gcd','lcm','common-factor','common-multiple','factor-basic','multiple-basic','factor-multiple','multiples','factors','factor-count','review-factor'],
    title: '최대공약수·최소공배수', emoji: '🔢',
    core: '약수: 나누어 떨어지는 수 / 배수: 곱해서 나오는 수',
    example: '12와 18의 GCD = 6,  LCM = 36',
    real: '12개·18개 사탕을 같은 봉지 수로 나눌 때 → GCD!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Prime factorization: 12=2²×3, 18=2×3² → GCD=2×3=6' },
      { flag:'🇬🇧', label:'UK', text:'Venn diagram: shared factors in the overlap' },
      { flag:'🇨🇳', label:'CN', text:'短除法求最大公因数和最小公倍数' },
      { flag:'🇭🇰', label:'HK', text:'短除法求最大公因數和最小公倍數' },
    ],
    remember: 'GCD는 두 수를 모두 나눌 수 있는 가장 큰 수!',
  },
  {
    match: ['bar-graph','line-graph','circle-graph','data-table','bar-chart','line-chart','pictograph'],
    title: '통계·자료 정리', emoji: '📊',
    core: '자료를 표나 그래프로 나타내면 한눈에 비교할 수 있어요.',
    example: '막대그래프: 항목별 크기 비교 / 꺾은선: 변화 흐름',
    real: '반 학생 좋아하는 과목 조사 → 막대그래프!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Bar graph = comparing categories, Line graph = over time' },
      { flag:'🇬🇧', label:'UK', text:'Pie chart shows parts of a whole (360°)' },
      { flag:'🇨🇳', label:'CN', text:'条形图比较大小 / 折线图看变化趋势' },
      { flag:'🇭🇰', label:'HK', text:'柱形圖比較大小 / 折線圖看變化趨勢' },
    ],
    remember: '제목·축 이름·단위를 꼭 쓰세요!',
  },
  {
    match: ['pattern','pattern-shape','pattern-number','pattern-table'],
    title: '규칙과 패턴', emoji: '🔄',
    core: '반복되는 규칙을 찾아 다음에 올 것을 예측해요.',
    example: '2, 4, 6, 8, __  → 2씩 늘어나므로 10',
    real: '달력의 요일, 계절의 순서도 모두 규칙!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Find the rule: +2, ×3, alternating shapes…' },
      { flag:'🇬🇧', label:'UK', text:'Describe the pattern, then predict the next term' },
      { flag:'🇨🇳', label:'CN', text:'找规律 — 说出变化的规则，再填空' },
      { flag:'🇭🇰', label:'HK', text:'找規律 — 說出變化的規則，再填空' },
    ],
    remember: '규칙을 말로 설명할 수 있으면 완벽 이해!',
  },
  {
    match: ['symmetry','congruent','line-symmetry','point-symmetry','motion-flip','motion-turn'],
    title: '대칭·합동', emoji: '🪞',
    core: '대칭: 선을 기준으로 양쪽이 똑같아요. 합동: 모양과 크기가 완전히 같아요.',
    example: '나비의 날개 → 좌우 대칭!',
    real: '알파벳 A, H, M 등은 세로 대칭!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Line of symmetry: fold the shape in half — it matches!' },
      { flag:'🇬🇧', label:'UK', text:'Congruent shapes: same shape, same size (can be rotated/reflected)' },
      { flag:'🇨🇳', label:'CN', text:'轴对称 — 沿对称轴折叠，两边完全重合' },
      { flag:'🇭🇰', label:'HK', text:'線對稱 — 沿對稱軸摺疊，兩邊完全重疊' },
    ],
    remember: '대칭축에서의 거리가 같아야 진짜 대칭!',
  },
  // ── 5학년 추가 ──────────────────────────────────────────────
  {
    match: ['average-basic','average-missing','average-total'],
    title: '평균', emoji: '📊',
    core: '평균 = 전체 합계 ÷ 개수  (모두 똑같이 나눈 값)',
    example: '점수 80, 90, 70 → 합계 240 ÷ 3 = 평균 80점',
    real: '우리 반 평균 키, 시험 평균 점수 모두 평균!',
    remember: '(모든 값의 합) ÷ (개수) = 평균. 단위를 꼭 써요!',
  },
  {
    match: ['rounding','round-ten','round-hundred','estimate-sum','estimate-product','range-exclusive','range-inclusive','range-statement'],
    title: '반올림·어림', emoji: '🔢',
    core: '구하는 자리 바로 아래 자릿수가 5 이상이면 올리고, 4 이하이면 버려요.',
    example: '472를 십의 자리에서 반올림 → 500  /  437 → 400',
    real: '마트 영수증 합계를 빠르게 어림잡을 때 사용!',
    remember: '5 이상 → 올림, 4 이하 → 버림. 기준 자리를 먼저 확인!',
  },
  {
    match: ['chance-compare','chance-statement','probability'],
    title: '가능성·확률', emoji: '🎲',
    core: '어떤 일이 일어날 가능성을 0~1 사이의 수로 나타내요.',
    example: '동전 앞면이 나올 가능성 = 1/2 = 0.5',
    real: '주사위 3이 나올 가능성 = 1/6 ≈ 0.167',
    remember: '불가능 = 0, 확실 = 1. 그 사이가 확률!',
  },
  {
    match: ['rate-value','rate-table','rate-table-reverse','rate-decimal','rate-fraction','op-m04-rate'],
    title: '단위량·속도', emoji: '🚀',
    core: '단위당 얼마인지 구해 비교해요. 속도 = 거리 ÷ 시간',
    example: '100km를 2시간에 가면 → 속도 50km/h',
    real: '두 가게 중 어디가 더 저렴한지 → 1개당 가격 비교!',
    remember: '단위가 다르면 단위량(1당 값)으로 바꿔서 비교해요!',
  },
  // ── 6학년 추가 ──────────────────────────────────────────────
  {
    match: ['circle-area','circumference-from','circle-composite','pi-from','circle-draw','circle-basic'],
    title: '원의 넓이·둘레', emoji: '⭕',
    core: '원주(둘레) = 지름 × π ≈ 지름 × 3.14  /  넓이 = 반지름² × π',
    example: '반지름 5cm → 원주 ≈ 31.4cm, 넓이 ≈ 78.5cm²',
    real: '피자, 동전, 시계판 모두 원! 둘레와 넓이를 계산해요.',
    remember: 'π ≈ 3.14  /  원주 = 2πr  /  넓이 = πr²',
  },
  {
    match: ['percent-basic','percent-of-quantity','percent-to-angle','quantity-from-percent','percent'],
    title: '백분율', emoji: '💯',
    core: '전체를 100으로 봤을 때 얼마인지 나타내는 비율이에요.',
    example: '20명 중 5명 → 5/20 = 0.25 = 25%',
    real: '할인율 30%, 득표율 48% 모두 백분율!',
    remember: '백분율(%) = (부분/전체) × 100. 소수로 바꾸면 ÷100!',
  },
  {
    match: ['integer-addition','integer-subtraction','integer-number-line','signed-number','rational-number','integer-multiplication','multi-integer-product','integer-division'],
    title: '정수와 유리수', emoji: '➕➖',
    core: '0보다 작은 음수(−)가 있어요. 수직선에서 0 오른쪽은 +, 왼쪽은 −',
    example: '+3 + (−5) = −2  /  −4 − (−2) = −2',
    real: '영하 기온, 해저, 지하층 번호 모두 음수!',
    remember: '부호가 같으면 더하고, 다르면 빼고 — 큰 쪽 부호를 따요!',
  },
  {
    match: ['linear-equation','equation-word','equation-check','equation-property','expression-value','simplify-like'],
    title: '방정식', emoji: '🔤',
    core: '□ 대신 x를 써서 등식의 성질로 x 값을 구해요.',
    example: 'x + 5 = 12  →  x = 12 − 5 = 7',
    real: '"사과 몇 개가 있어야 12개가 되지?" → x + 5 = 12!',
    remember: '등식의 성질: 양쪽에 같은 수를 더하고 빼고 곱하고 나눠도 등식 성립!',
  },
  {
    match: ['prime-factorization','factorization-word','prime-composite','prime-factors','divisor-count'],
    title: '소인수분해', emoji: '🔢',
    core: '모든 자연수는 소수들의 곱으로 나타낼 수 있어요.',
    example: '12 = 2 × 2 × 3 = 2² × 3',
    real: '12의 약수 개수: (2+1)×(1+1) = 6개 → 1,2,3,4,6,12!',
    remember: '소수(Prime): 1과 자기 자신만으로 나누어지는 수 (2, 3, 5, 7, 11…)',
  },
  {
    match: ['cylinder-volume','cylinder-height','prism-face','prism-edge','pyramid-face','pyramid-edge','solid-name','cone-sphere','prism-pyramid-net','cuboid-edge','cuboid-face','cuboid-parallel','cylinder-surface','cuboid-surface','cylinder-net','cuboid-counts','cuboid-edge-sum'],
    title: '원기둥·각기둥·각뿔', emoji: '🏛️',
    core: '기둥 부피 = 밑넓이 × 높이  /  원기둥 부피 = πr² × 높이',
    example: '반지름 3, 높이 5인 원기둥 → 3.14×9×5 ≈ 141.3cm³',
    real: '음료 캔, 연필통, 텐트 등 생활 속 입체도형!',
    remember: '기둥: 위아래 면이 합동·평행  /  뿔: 꼭짓점 1개, 옆면 삼각형',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Prism: 2 congruent bases + rectangular lateral faces' },
      { flag:'🇬🇧', label:'UK', text:'Pyramid: 1 base + triangular faces meeting at apex' },
      { flag:'🇨🇳', label:'CN', text:'棱柱底面积×高=体积  / 棱锥=底面积×高÷3' },
      { flag:'🇭🇰', label:'HK', text:'稜柱底面積×高=體積  / 稜錐=底面積×高÷3' },
    ],
  },
  // ── 추가 개념 (누락 skillId 보완) ──────────────────────────────
  {
    match: ['mm-cm','length-km','length-convert','weight-add','weight','volume-add','measurement','length-add'],
    title: '측정·단위', emoji: '📏',
    core: '1m = 100cm = 1000mm  /  1kg = 1000g  /  1L = 1000mL',
    example: '3km 500m = 3500m  /  2kg 300g = 2300g',
    real: '육상 100m 달리기, 물 500mL 생수병 — 모두 측정 단위!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Use metric prefix: kilo- (×1000), centi- (÷100), milli- (÷1000)' },
      { flag:'🇬🇧', label:'UK', text:'Convert by multiplying or dividing by powers of 10' },
      { flag:'🇨🇳', label:'CN', text:'进率：1km=1000m, 1m=100cm, 1cm=10mm' },
      { flag:'🇭🇰', label:'HK', text:'換算：1km=1000m, 1m=100cm, 1cm=10mm' },
    ],
    remember: '큰 단위 → 작은 단위는 ×(곱하기), 작은 → 큰 단위는 ÷(나누기)!',
  },
  {
    match: ['time-add','clock-add','calendar','seconds','time-sub','clock','schedule'],
    title: '시간·달력', emoji: '⏰',
    core: '1일 = 24시간  /  1시간 = 60분  /  1분 = 60초  /  1년 = 365일',
    example: '2시간 30분 + 1시간 50분 = 4시간 20분',
    real: '버스 출발까지 남은 시간, 방학 날짜 수 계산!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Use a number line for time: start → add/subtract minutes/hours' },
      { flag:'🇬🇧', label:'UK', text:'Convert hours to minutes (×60) before adding/subtracting' },
      { flag:'🇨🇳', label:'CN', text:'时间计算要注意进率60，分>60就化为时' },
      { flag:'🇭🇰', label:'HK', text:'時間計算注意進率60，分>60就換算為小時' },
    ],
    remember: '60진법! 분이 60 이상이면 1시간으로 올려요 — 10진법과 달라요!',
  },
  {
    match: ['compare-facts','missing-number','missing-operator','count-by-tens','skip-count','order-number'],
    title: '수 비교·순서', emoji: '🔢',
    core: '두 수의 크기를 비교할 때는 자릿수부터 확인하고, 같으면 높은 자리부터 비교해요.',
    example: '352 < 429  (백의 자리 3 < 4)',
    real: '키 152cm와 148cm 비교, 점수 순위 정하기!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Compare from left (highest place value) to right' },
      { flag:'🇬🇧', label:'UK', text:'Number line: further right = bigger number' },
      { flag:'🇨🇳', label:'CN', text:'先比较位数，再从高位到低位依次比较' },
      { flag:'🇭🇰', label:'HK', text:'先比較位數，再從高位到低位依次比較' },
    ],
    remember: '> 크다, < 작다, = 같다. 입이 큰 쪽이 더 큰 수!',
  },
  {
    match: ['plane-flip','flip-turn','motion-flip','motion-turn','rotate','translate','reflection'],
    title: '도형의 이동', emoji: '🔄',
    core: '도형을 밀기(평행이동), 뒤집기(반사), 돌리기(회전)해도 모양과 크기는 변하지 않아요.',
    example: '삼각형을 오른쪽으로 밀면 위치만 바뀌고 모양은 같아요.',
    real: '도장 찍기 = 뒤집기, 풍차 = 돌리기, 퍼즐 맞추기 = 밀기!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Transformations: translation (slide), reflection (flip), rotation (turn)' },
      { flag:'🇬🇧', label:'UK', text:'Rotation: specify centre, angle, and direction (clockwise/anticlockwise)' },
      { flag:'🇨🇳', label:'CN', text:'图形的运动：平移、翻转、旋转 — 形状大小不变' },
      { flag:'🇭🇰', label:'HK', text:'圖形的運動：平移、翻轉、旋轉 — 形狀大小不變' },
    ],
    remember: '밀기·뒤집기·돌리기 모두 합동 변환 — 모양과 크기 그대로!',
  },
  {
    match: ['mixed-review','mixed-change','mixed-add-sub','mixed-mul-div','addsub','addsub-paren','muldiv','mixed'],
    title: '혼합 계산', emoji: '🧮',
    core: '괄호 → 곱셈·나눗셈 → 덧셈·뺄셈 순서로 계산해요.',
    example: '3 + 4 × 2 = 3 + 8 = 11  /  (3+4) × 2 = 7 × 2 = 14',
    real: '마트에서 과자 3봉지 × 500원 + 음료 1000원 계산!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'PEMDAS: Parentheses → Exponents → Multiply/Divide → Add/Subtract' },
      { flag:'🇬🇧', label:'UK', text:'BODMAS: Brackets → Orders → Division/Multiplication → Addition/Subtraction' },
      { flag:'🇨🇳', label:'CN', text:'先乘除后加减，有括号先算括号' },
      { flag:'🇭🇰', label:'HK', text:'先乘除後加減，有括號先算括號' },
    ],
    remember: '곱셈·나눗셈이 덧셈·뺄셈보다 먼저! 괄호는 무조건 제일 먼저!',
  },
  {
    match: ['table-missing','table-total','offset-value','rate-table','function-graph','direct-proportion-table','inverse-proportion-table','relation-equation','formula-choice','function-graph-table','relation-table'],
    title: '표와 대응 관계', emoji: '📋',
    core: '두 양의 대응 관계를 표로 나타내면 규칙을 쉽게 찾을 수 있어요.',
    example: 'x: 1 2 3 4  /  y: 3 6 9 12  → y = x × 3',
    real: '요금표, 단가표, 환율표 모두 대응 관계!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Input-output table: find the rule connecting x and y values' },
      { flag:'🇬🇧', label:'UK', text:'Function machine: what operation turns input into output?' },
      { flag:'🇨🇳', label:'CN', text:'找规律：看x增加时y如何变化，写出规律式' },
      { flag:'🇭🇰', label:'HK', text:'找規律：看x增加時y如何變化，寫出規律式' },
    ],
    remember: '규칙을 식으로 쓸 수 있으면 어떤 값도 바로 구해요!',
  },
  {
    match: [],
    title: '수학 문제 풀이', emoji: '💡',
    core: '문제를 잘 읽고 조건을 파악한 뒤, 알맞은 계산 방법을 선택하세요.',
    example: '① 구하는 것 확인 → ② 조건 정리 → ③ 식 세우기 → ④ 계산 → ⑤ 검토',
    real: '어떤 수학 문제든 이 5단계로 풀 수 있어요!',
    tips: [
      { flag:'🇺🇸', label:'US', text:'Read carefully, identify key information, choose a strategy' },
      { flag:'🇬🇧', label:'UK', text:'Show working — marks are given for method, not just the answer' },
      { flag:'🇨🇳', label:'CN', text:'审题→找条件→列式→计算→验算 — 五步解题法' },
      { flag:'🇭🇰', label:'HK', text:'審題→找條件→列式→計算→驗算 — 五步解題法' },
    ],
    remember: '답만 쓰지 말고 풀이 과정을 보여주세요. 과정이 실력!',
  },
];

function getConceptEntry(skillId) {
  const sid = String(skillId || '');
  for (const entry of CONCEPT_BANK) {
    if (entry.match.length > 0 && entry.match.some(kw => sid.includes(kw))) return entry;
  }
  // 광역 fallback — 패턴 순서 중요 (구체적인 것 먼저)
  if (/add.carry|carry.add/.test(sid))                              return CONCEPT_BANK[0];
  if (/sub.borrow|borrow.sub|sub.bridge/.test(sid))                return CONCEPT_BANK[2];
  if (/two.digit.two|three.digit.times|two.digit.times|tens.times|big.multiply|mul.2|mul2/.test(sid)) return CONCEPT_BANK[5];
  if (/integer.times.decimal|decimal.times.integer/.test(sid))     return CONCEPT_BANK[12];
  if (/integer.multiplication|integer.division|multi.integer/.test(sid)) return CONCEPT_BANK[32];
  if (/decimal/.test(sid))                                          return CONCEPT_BANK[11];
  if (/add/.test(sid))                                              return CONCEPT_BANK[1];
  if (/sub/.test(sid))                                              return CONCEPT_BANK[3];
  if (/mixed.fraction|mixed.like|common.denominator/.test(sid))     return CONCEPT_BANK[7];
  if (/compare.fractions|order.fractions|equivalent.fraction|reduce.fraction|fraction.numberline|fraction.decimal/.test(sid)) return CONCEPT_BANK[8];
  if (/fraction.times|fraction.of.quantity/.test(sid))             return CONCEPT_BANK[9];
  if (/fraction.divide|natural.divide.fraction|mixed.divide/.test(sid)) return CONCEPT_BANK[10];
  if (/fraction|frac|denominator|numerator/.test(sid))             return CONCEPT_BANK[7];
  if (/factor.multiple|multiples|review.factor/.test(sid))         return CONCEPT_BANK[22];
  if (/mul|times|repeated|array|skip.count|missing.factor/.test(sid)) return CONCEPT_BANK[4];
  if (/div/.test(sid))                                              return CONCEPT_BANK[6];
  if (/place.value|place|digit|tens.ones|compose|decompose|big.number|three.digit|four.digit/.test(sid)) return CONCEPT_BANK[13];
  if (/circle.area|circumference|circle.composite|pi.from|circle.draw|circle.basic/.test(sid)) return CONCEPT_BANK[30];
  if (/cylinder|prism.edge|prism.face|pyramid.edge|pyramid.face|cone.sphere|cuboid.edge|cuboid.face|cuboid.parallel|cylinder.surface|cuboid.surface|cylinder.net|cuboid.counts/.test(sid)) return CONCEPT_BANK[35];
  if (/triangle.area|parallelogram.area|trapezoid.area|composite.area|parallelogram|trapezoid|rhombus/.test(sid)) return CONCEPT_BANK[16];
  if (/rectangle.area|rectangle.perimeter|area.unit|square.perimeter/.test(sid)) return CONCEPT_BANK[15];
  if (/parallel.perpendicular|parallel.distance|polygon.diagonal|polygon.name|regular.polygon|quadrilateral.kind/.test(sid)) return CONCEPT_BANK[17];
  if (/volume|cuboid.volume|stacked.cubes|cube.count/.test(sid))   return CONCEPT_BANK[18];
  if (/measurement|length|km|meter|weight|mass|capacity|volume.add/.test(sid)) return CONCEPT_BANK[36];
  if (/time|clock|calendar|schedule|seconds/.test(sid))            return CONCEPT_BANK[37];
  if (/compare|order|missing|operator|count.by/.test(sid))         return CONCEPT_BANK[38];
  if (/flip|turn|rotate|motion|transform|reflect/.test(sid))       return CONCEPT_BANK[39];
  if (/mixed|review|addsub|muldiv/.test(sid))                      return CONCEPT_BANK[40];
  if (/relation.equation|formula.choice|function.graph.table/.test(sid)) return CONCEPT_BANK[41];
  if (/table|offset|function|graph.table/.test(sid))               return CONCEPT_BANK[41];
  if (/ratio|rate/.test(sid))                                       return CONCEPT_BANK[19];
  if (/direct.proportion|proportion|inverse/.test(sid))             return CONCEPT_BANK[20];
  if (/percent/.test(sid))                                          return CONCEPT_BANK[31];
  if (/integer|signed/.test(sid))                                   return CONCEPT_BANK[32];
  if (/equation|expression|simplify.like/.test(sid))               return CONCEPT_BANK[33];
  if (/prime|factor|gcd|lcm/.test(sid))                            return CONCEPT_BANK[34];
  if (/average/.test(sid))                                          return CONCEPT_BANK[26];
  if (/round|estimate|range/.test(sid))                             return CONCEPT_BANK[27];
  if (/chance|probability/.test(sid))                               return CONCEPT_BANK[28];
  if (/area|perimeter/.test(sid))                                   return CONCEPT_BANK[16];
  if (/angle|shape/.test(sid))                                      return CONCEPT_BANK[17];
  if (/symmetry|congruent/.test(sid))                               return CONCEPT_BANK[25];
  if (/pattern/.test(sid))                                          return CONCEPT_BANK[24];
  if (/bar.graph|bar.chart|line.graph|circle.graph|pictograph|band.graph/.test(sid)) return CONCEPT_BANK[23];
  if (/coordinate/.test(sid))                                       return CONCEPT_BANK[33];
  if (/cube.top|view.count|view.from/.test(sid))                   return CONCEPT_BANK[18];
  if (/zero/.test(sid))                                             return CONCEPT_BANK[14];
  if (/word/.test(sid))                                             return CONCEPT_BANK[1];
  if (/equal.share|share/.test(sid))                               return CONCEPT_BANK[6];
  if (/parentheses|four.mix|paren/.test(sid))                      return CONCEPT_BANK[40];
  if (/relation/.test(sid))                                         return CONCEPT_BANK[41];
  if (/graph.read|prep/.test(sid))                                  return CONCEPT_BANK[23];
  // 최종 catch-all — 항상 개념 카드를 표시
  return CONCEPT_BANK[42];
}

function problemMathContext(problem) {
  const expression = String(problem?.expression || "").trim();
  const question = String(problem?.question || "").trim();
  const hint = String(problem?.hint || "").trim();
  const source = `${question} ${expression} ${hint}`;
  const units = ["cm³","cm²","m³","m²","km","mm","cm","m","kg","g","L","mL","원","명","개","쪽","분","초","°","%"].filter((unit) => source.includes(unit));
  const numbers = (source.match(/-?\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?/g) || []).slice(0, 6);
  const ops = [];
  if (/[+＋]/.test(expression)) ops.push("더하기");
  if (/[−-]/.test(expression)) ops.push("빼기");
  if (/[×*]/.test(expression)) ops.push("곱하기");
  if (/[÷/]/.test(expression)) ops.push("나누기");
  if (/%/.test(source)) ops.push("백분율");
  if (/:/.test(expression)) ops.push("비");
  if (/\d+\/\d+/.test(expression)) ops.push("분수");
  if (/\d+\.\d+/.test(expression)) ops.push("소수");
  return {
    expression,
    question,
    hint,
    units: [...new Set(units)],
    numbers: [...new Set(numbers)],
    ops: [...new Set(ops)],
  };
}

function operationConceptFromContext(ctx, problem) {
  const id = problem.skillId || "";
  if (ctx.ops.includes("백분율")) return "이 문제는 전체를 100으로 보았을 때 부분이 어느 정도인지 읽는 문제입니다. 먼저 전체량과 구하려는 부분을 표시한 뒤, 백분율을 분수나 소수와 연결해서 계산합니다.";
  if (ctx.ops.includes("비")) return "이 문제는 두 양의 관계를 비로 나타내는 문제입니다. 앞항과 뒤항이 각각 어떤 양을 뜻하는지 확인하고, 같은 배로 늘리거나 줄여도 관계가 유지되는지 봅니다.";
  if (ctx.ops.includes("분수") && ctx.ops.includes("나누기")) return "이 문제는 분수 나눗셈 구조입니다. 나누어지는 양과 나누는 양을 구분하고, 필요하면 나누는 수의 역수를 곱하는 식으로 바꾸어 풉니다.";
  if (ctx.ops.includes("분수")) return "이 문제는 분수의 크기와 연산을 다룹니다. 분모는 전체를 나눈 칸 수, 분자는 그중 선택한 칸 수이므로, 분모가 다르면 같은 크기의 칸으로 맞추어 생각합니다.";
  if (ctx.ops.includes("소수")) return "이 문제는 소수의 자리값을 맞추어 계산해야 합니다. 0.1, 0.01 자리의 의미를 확인하고, 소수점이 계산 과정에서 어디에 놓이는지 끝까지 살핍니다.";
  if (ctx.ops.includes("나누기")) return "이 문제는 나눗셈 관계를 사용합니다. 전체를 똑같이 나누는지, 한 묶음이 몇 번 들어가는지 확인하고, 몫과 나누는 수를 곱해 검산할 수 있습니다.";
  if (ctx.ops.includes("곱하기")) return "이 문제는 같은 크기의 묶음이 몇 개 있는지 보는 곱셈 관계입니다. 곱해지는 수와 곱하는 수가 무엇을 뜻하는지 표시하고 자리값을 맞추어 계산합니다.";
  if (ctx.ops.includes("빼기")) return "이 문제는 남은 양이나 두 양의 차이를 구하는 뺄셈 관계입니다. 같은 단위끼리 빼고, 받아내림이 필요한 자리인지 확인합니다.";
  if (ctx.ops.includes("더하기")) return "이 문제는 같은 종류의 양을 모으는 덧셈 관계입니다. 단위와 자리값을 맞춘 뒤 앞에서 주어진 양을 차례로 합합니다.";
  if (/graph|table|chart/.test(id)) return "이 문제는 자료를 읽는 문제입니다. 표나 그래프에서 전체, 항목, 눈금 간격을 먼저 확인하고 필요한 값만 골라 식으로 옮깁니다.";
  if (/area|perimeter|volume|cuboid|cube|shape|angle/.test(id)) return "이 문제는 도형의 성질을 현재 주어진 길이와 단위에 연결하는 문제입니다. 구하는 것이 길이, 넓이, 부피, 각도 중 무엇인지 먼저 확인합니다.";
  return "이 문제는 주어진 조건을 식으로 옮기고, 구해야 하는 값을 보기와 대조하는 문제입니다. 문제의 수와 단위를 먼저 표시하면 풀이 방향이 선명해집니다.";
}

function buildProblemConcept(problem) {
  const base = getConceptEntry(problem.skillId);
  const ctx = problemMathContext(problem);
  const exprText = ctx.expression ? `이번 식은 ${ctx.expression}입니다. ` : "";
  const unitText = ctx.units.length ? `단위는 ${ctx.units.join(", ")}를 그대로 맞추어야 합니다. ` : "";
  const numberText = ctx.numbers.length ? `눈여겨볼 수는 ${ctx.numbers.join(", ")}입니다. ` : "";
  const choiceText = Array.isArray(problem.choices) && problem.choices.length ? "마지막에는 계산값과 같은 보기를 고릅니다." : "마지막에는 구한 값이 문제 조건에 맞는지 확인합니다.";
  return {
    emoji: base?.emoji || "📘",
    title: `${problem.skillTitle || base?.title || "문제"} 개념 연결`,
    core: `${exprText}${operationConceptFromContext(ctx, problem)}`,
    example: `${numberText}${unitText}${choiceText}`,
    real: problem.question || "문제 문장을 조건과 구해야 하는 값으로 나누어 읽습니다.",
    remember: "정답 숫자는 먼저 보지 말고, 이 문제에 주어진 식과 단위를 따라가며 보기와 대조하세요.",
    svgType: getConceptSVGType(base),
  };
}

// 개념 카드 정적 SVG 타입 결정
function getConceptSVGType(c) {
  if (!c) return 'default';
  const t = c.title;
  if (t.includes('덧셈')) return 'add';
  if (t.includes('뺄셈')) return 'sub';
  if (t.includes('곱셈') || t.includes('구구')) return 'mul';
  if (t.includes('나눗셈')) return 'div';
  if (t.includes('분수')) return 'fraction';
  if (t.includes('소수')) return 'decimal';
  if (t.includes('자릿값') || t.includes('자리')) return 'place-value';
  if (t.includes('측정') || t.includes('길이') || t.includes('무게') || t.includes('단위')) return 'measurement';
  if (t.includes('시간') || t.includes('달력') || t.includes('시각') || t.includes('시계')) return 'time';
  if (t.includes('넓이') || t.includes('둘레') || t.includes('삼각형') || t.includes('평행사변형') || t.includes('사다리꼴')) return 'area';
  if (t.includes('각도')) return 'angle';
  if (t.includes('부피')) return 'volume';
  if (t.includes('비와') || t.includes('비율') || t.includes('단위량')) return 'ratio';
  if (t.includes('정비례') || t.includes('반비례') || t.includes('표와')) return 'proportion';
  if (t.includes('수 가르기') || t.includes('모으기')) return 'number-bond';
  if (t.includes('대칭') || t.includes('합동') || t.includes('이동')) return 'symmetry';
  if (t.includes('규칙') || t.includes('패턴') || t.includes('비교') || t.includes('순서') || t.includes('혼합')) return 'pattern';
  if (t.includes('통계') || t.includes('그래프') || t.includes('자료')) return 'statistics';
  if (t.includes('최대공약') || t.includes('최소공배') || t.includes('소인수')) return 'gcd-lcm';
  if (t.includes('방정식') || t.includes('유리수') || t.includes('정수')) return 'equation';
  if (t.includes('백분율')) return 'percent';
  return 'default';
}

// ============================================================
// 벤다이어그램식 단계별 풀이 흐름 시스템 (전체 문제 커버)
// ============================================================

// solution 텍스트에서 "산술식 = 결과" 쌍을 모두 추출
function _pullArithEqs(text, skipSet) {
  const results = [];
  if (!text) return results;
  // 숫자·연산자를 포함하는 좌변 = 숫자(단위포함) 우변
  const re = /([\d][\d\s()\[\]×÷+\-−*/.,/]+(?:[×÷+\-−*/][\d\s()\[\].,×÷+\-−*/]+)+)\s*=\s*([-\d][\d,./ ]*(?:cm[²³]?|m[²³]?|g|kg|L|mL|°|%|명|개|칸|분|초|cm|mm|km|원|개)?)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const expr = m[1].trim().replace(/^[,\s]+|[,\s]+$/g, '');
    const result = m[2].trim().replace(/\s+/g, '');
    if (!expr || !result || expr.length < 3) continue;
    if (skipSet && skipSet.has(result)) continue;
    results.push({ expr, result });
  }
  return results;
}

// 분수 형태 "N/N = N/N" 추출
function _pullFracEqs(text, skipSet) {
  const results = [];
  if (!text) return results;
  const re = /((?:\d+\s+)?\d+\/\d+(?:\s*[+\-−]\s*(?:\d+\s+)?\d+\/\d+)*)\s*=\s*((?:\d+\s+)?\d+\/\d+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const expr = m[1].trim();
    const result = m[2].trim();
    if (!expr || !result) continue;
    if (skipSet && skipSet.has(result)) continue;
    if (expr === result) continue;
    results.push({ expr, result });
  }
  return results;
}

// solution 텍스트 → 시각 노드 배열 생성 (핵심 파서)
function buildVennNodes(problem) {
  const sol   = problem.solution   || '';
  const expr  = (problem.expression || '').split('\n')[0].trim();
  const finalStr = String(problem.answer ?? '').trim();
  const nodes = [];

  // ── 시작 노드: 항상 문제 표현식 ─────────────────────────
  if (expr) nodes.push({ type: 'start', text: expr });

  // ── 중간 노드 추출 ─────────────────────────────────────
  const skipSet = new Set([finalStr]);
  const mids = [];

  const clean = sol.replace(/입니다\.?\s*$/, '').trim();

  // 전략 1: "이므로" 또는 "이고" 분리 — 앞 부분에서 계산식 추출
  const splitIdx = Math.max(clean.indexOf('이므로'), clean.indexOf('이고'));
  if (splitIdx > 3) {
    const before = clean.slice(0, splitIdx).trim();
    // 산술식 추출
    const arith = _pullArithEqs(before, skipSet);
    const frac  = _pullFracEqs(before, skipSet);
    const combined = [...arith, ...frac];
    combined.slice(0, 2).forEach(eq => {
      mids.push({ type: 'mid', text: `${eq.expr} = ${eq.result}` });
      skipSet.add(eq.result);
    });
    // 뒤 부분(이므로 이후)에서 최종 계산 추출
    const after = clean.slice(splitIdx).replace(/^이므로|이고/, '').trim();
    const afterArith = _pullArithEqs(after, skipSet);
    const afterFrac  = _pullFracEqs(after, skipSet);
    [...afterArith, ...afterFrac].slice(0, 1).forEach(eq => {
      if (eq.result !== finalStr) {
        mids.push({ type: 'mid', text: `${eq.expr} = ${eq.result}` });
        skipSet.add(eq.result);
      }
    });
  }

  // 전략 2: 전체 텍스트에서 산술식 = 결과 패턴 (이미 찾은 것 제외)
  if (mids.length === 0) {
    const arith = _pullArithEqs(clean, skipSet);
    const frac  = _pullFracEqs(clean, skipSet);
    [...arith, ...frac].filter(eq => eq.result !== finalStr).slice(0, 3).forEach(eq => {
      mids.push({ type: 'mid', text: `${eq.expr} = ${eq.result}` });
      skipSet.add(eq.result);
    });
  }

  // 전략 3: "X = Y = Z" 체인에서 중간값 추출
  if (mids.length === 0) {
    const chainParts = clean.split(/\s*=\s*/);
    if (chainParts.length >= 3) {
      const lastPart = chainParts[chainParts.length - 1].replace(/[입니다.\s]+$/, '').trim();
      if (lastPart === finalStr || lastPart.replace(/\s/g,'') === finalStr.replace(/\s/g,'')) {
        for (let i = 1; i < chainParts.length - 1; i++) {
          const mid = chainParts[i].trim();
          if (/^[-\d.,/ ]+$/.test(mid) && mid !== finalStr && !skipSet.has(mid)) {
            const leftExpr = chainParts.slice(0, i).join(' = ').trim();
            mids.push({ type: 'mid', text: `${leftExpr} = ${mid}` });
            skipSet.add(mid);
            break;
          }
        }
      }
    }
  }

  // 전략 4: 쉼표 분리 "A=B, C=D" 패턴
  if (mids.length === 0) {
    const commaArith = _pullArithEqs(clean.split('.')[0], skipSet);
    commaArith.filter(eq => eq.result !== finalStr).slice(0, 2).forEach(eq => {
      mids.push({ type: 'mid', text: `${eq.expr} = ${eq.result}` });
      skipSet.add(eq.result);
    });
  }

  // 전략 5: 설명문 — 핵심 키워드를 포함한 첫 절을 추출
  if (mids.length === 0 && clean.length > 5) {
    // 수식 없는 설명형 solution → 첫 의미 있는 절 사용
    const clauses = clean
      .split(/[,。]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 5 && s.length <= 55 && s !== finalStr && s !== expr);
    if (clauses.length > 0) {
      mids.push({ type: 'explain', text: clauses[0] });
      if (clauses.length > 1 && clauses[1].length <= 55) {
        mids.push({ type: 'explain', text: clauses[1] });
      }
    }
  }

  // 중간 노드 추가 (최대 4개)
  mids.slice(0, 4).forEach(n => nodes.push(n));

  // ── 끝 노드: 항상 정답 ──────────────────────────────────
  nodes.push({ type: 'end', text: finalStr });

  return nodes;
}

// 계산식 표현에서 사고 유도 힌트 도출
function _calcHint(exprText) {
  const t = exprText;
  if (t.includes('×') || t.includes('*')) return '두 수를 곱하면 얼마가 될까요?';
  if (t.includes('÷')) return '나누면 얼마가 나올까요?';
  if (t.includes('+')) return '두 수를 더하면 얼마가 될까요?';
  if (/\d\s*[-−]\s*\d/.test(t)) return '큰 수에서 작은 수를 빼면 얼마가 남을까요?';
  if (t.includes('/') || t.includes('분의')) return '분자끼리, 분모끼리 계산해보세요.';
  if (t.includes('²') || t.includes('³')) return '거듭제곱을 계산해보세요.';
  return '식을 읽고 □에 알맞은 값을 생각해보세요.';
}

// 벤다이어그램식 풀이 흐름 HTML 렌더링 (정답 숨김 — 채점 후 공개)
function renderVennFlow() {
  const el = $('step-note');
  if (!el) return;
  const p = app.problem;
  if (!p) { el.innerHTML = ''; return; }

  const guidedCards = buildTeacherSolutionCards(p);
  const answerValue = String(p.answer ?? '').trim();
  const cardHTML = guidedCards.map((card, i) => {
    const [num, title, body] = card;
    const safeBody = maskAnswerText(String(body || ''), answerValue);
    const cls = i === 0 ? 'vf-start' : 'vf-explain';
    return `<div class="vf-node vf-card ${cls}" data-idx="${i}" role="listitem">
      <span class="vf-tag">${escapeHTML(String(num || i + 1))}</span>
      <strong class="vf-card-title">${escapeHTML(String(title || '풀이 단계'))}</strong>
      <span class="vf-body-text">${formatMathHTML(safeBody)}</span>
    </div>`;
  }).join('<span class="vf-arrow" aria-hidden="true">→</span>');
  const answerCard = `<span class="vf-arrow" aria-hidden="true">→</span><div class="vf-node vf-card vf-answer-card vf-end-locked" role="listitem">
    <span class="vf-tag">정답 확인</span>
    <strong class="vf-card-title">마지막 값은 아직 가려요</strong>
    <span class="vf-answer-hidden vf-answer-locked" data-answer="${escapeHTML(answerValue)}">□</span>
  </div>`;
  el.innerHTML = `
<div class="vflow-card">
  <div class="vflow-head">
    <span class="vflow-icon" aria-hidden="true">🔢</span>
    <span class="vflow-title">단계별 풀이 흐름</span>
    <button class="vflow-toggle" type="button" id="vflow-toggle-btn" aria-expanded="true">접기</button>
  </div>
  <div class="vflow-nodes" id="vflow-body" role="list">${cardHTML}${answerCard}</div>
</div>`;

  $('vflow-toggle-btn')?.addEventListener('click', function() {
    const body = $('vflow-body');
    if (!body) return;
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    this.textContent = collapsed ? '접기' : '펼치기';
    this.setAttribute('aria-expanded', String(collapsed));
  });
  return;

  const nodes = buildVennNodes(p);

  // 노드가 시작+끝만 있으면 (=중간 없으면) 그래도 렌더
  const nodeHTMLs = nodes.map((n, i) => {
    const cls  = n.type === 'start'   ? 'vf-start'
               : n.type === 'end'     ? 'vf-end'
               : n.type === 'explain' ? 'vf-explain'
               :                       'vf-mid';
    const tag  = n.type === 'start'   ? '📌 문제'
               : n.type === 'end'     ? '★ 정답'
               : n.type === 'explain' ? '💡 풀이'
               :                       `⓪①②③④⑤`[i] + ' 계산';
    let displayText;
    if (n.type === 'start') {
      // 시작 노드: 문제 수식 그대로 표시
      displayText = `<span class="vf-body-text">${formatMathHTML(n.text)}</span>`;
    } else if (n.type === 'end') {
      // 정답 노드: 채점 전까지 숨김
      displayText = `<span class="vf-answer-hidden" data-answer="${escapeHTML(n.text)}">?</span>`;
    } else if (n.type === 'explain') {
      // 설명 노드: "식 = 값" 패턴이 있으면 값 숨김, 없으면 최종 정답 문자열 마스킹
      const eqIdxEx = n.text.lastIndexOf(' = ');
      if (eqIdxEx >= 0) {
        const exprPart = n.text.slice(0, eqIdxEx);
        const ansPart  = n.text.slice(eqIdxEx + 3);
        displayText = `<span class="vf-body-text">${formatMathHTML(exprPart)}&nbsp;<span class="vf-eq">=</span>&nbsp;<span class="vf-answer-hidden" data-answer="${escapeHTML(ansPart)}">?</span></span>`;
      } else {
        // 설명 문장 안에 최종 정답이 포함되면 마스킹
        const finalAns = String(p.answer ?? '').trim();
        let safeHtml;
        if (finalAns && n.text.includes(finalAns)) {
          const idx = n.text.indexOf(finalAns);
          safeHtml = formatMathHTML(n.text.slice(0, idx))
            + `<span class="vf-answer-hidden" data-answer="${escapeHTML(finalAns)}">?</span>`
            + formatMathHTML(n.text.slice(idx + finalAns.length));
        } else {
          safeHtml = formatMathHTML(n.text);
        }
        displayText = `<span class="vf-body-text">${safeHtml}</span>`;
      }
    } else {
      // 중간 계산 노드: "식 = ?" 로 정답 숨기고 힌트 표시
      const eqIdx = n.text.lastIndexOf(' = ');
      if (eqIdx >= 0) {
        const exprPart = n.text.slice(0, eqIdx);
        const ansPart  = n.text.slice(eqIdx + 3);
        const hint     = _calcHint(exprPart);
        displayText = `<span class="vf-body-text">${formatMathHTML(exprPart)}&nbsp;<span class="vf-eq">=</span>&nbsp;<span class="vf-answer-hidden" data-answer="${escapeHTML(ansPart)}">?</span></span>`
          + `<span class="vf-hint-text">💡 ${hint}</span>`;
      } else {
        displayText = `<span class="vf-body-text">${formatMathHTML(n.text)}</span>`;
      }
    }
    return `<div class="vf-node ${cls}" data-idx="${i}"><span class="vf-tag">${tag}</span>${displayText}</div>`;
  });

  // 노드 사이에 화살표 삽입
  const rowHTML = nodeHTMLs.reduce((acc, h, i) =>
    acc + h + (i < nodeHTMLs.length - 1 ? '<span class="vf-arrow" aria-hidden="true">→</span>' : ''),
  '');

  el.innerHTML = `\
<div class="vflow-card">
  <div class="vflow-head">
    <span class="vflow-icon" aria-hidden="true">🔢</span>
    <span class="vflow-title">단계별 풀이 흐름</span>
    <button class="vflow-toggle" type="button" id="vflow-toggle-btn" aria-expanded="true">▲ 접기</button>
  </div>
  <div class="vflow-nodes" id="vflow-body" role="list">${rowHTML}</div>
</div>`;

  $('vflow-toggle-btn')?.addEventListener('click', function() {
    const body = $('vflow-body');
    if (!body) return;
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    this.textContent = collapsed ? '▲ 접기' : '▼ 펼치기';
    this.setAttribute('aria-expanded', String(collapsed));
  });
}

// 채점 후에도 풀이 흐름 안의 값은 숨김 유지
function gradeSteps() {
  document.querySelectorAll('#vflow-body .vf-answer-hidden').forEach(el => {
    el.classList.add('vf-answer-locked');
    el.innerHTML = '□';
  });
  const endNode = document.querySelector('#vflow-body .vf-end');
  if (endNode) endNode.classList.add('vf-end-locked');
}

function renderConceptNote(problem) {
  const el = $('concept-note');
  if (!el) return;
  const c = buildProblemConcept(problem || {});
  if (!c) { el.innerHTML = ''; return; }
  const svgType = c.svgType || 'default';
  const staticSVG = buildConceptStaticSVG(svgType);
  el.innerHTML =
    `<div class="concept-card">
  <div class="concept-head">
    <span class="concept-emoji" aria-hidden="true">${c.emoji}</span>
    <span class="concept-title">${escapeHTML(c.title)}</span>
    <button class="concept-toggle" type="button" aria-expanded="true" aria-controls="concept-body-inner">▲ 개념</button>
  </div>
  <div class="concept-body" id="concept-body-inner">
    <div class="concept-svg-wrap" aria-hidden="true">${staticSVG}</div>
    <p class="concept-core">${formatMathHTML(c.core)}</p>
    <p class="concept-example">✏️ 이 문제에서: ${formatMathHTML(c.example)}</p>
    <p class="concept-real">📌 조건 읽기: ${escapeHTML(c.real)}</p>
    <p class="concept-remember">💡 확인: ${escapeHTML(c.remember)}</p>
  </div>
</div>`;
  el.querySelector('.concept-toggle')?.addEventListener('click', function() {
    const body = $('concept-body-inner');
    if (!body) return;
    const show = body.style.display === 'none';
    body.style.display = show ? '' : 'none';
    this.textContent = show ? '▲ 개념' : '▼ 개념';
    this.setAttribute('aria-expanded', String(show));
  });
}

// ============================================================
// 미션 렌더링
// ============================================================
function renderMission() {
  const p = app.problem;
  const gradeMeta = GRADE_META[app.grade] || { label:`${app.grade}학년`, emoji:"" };
  $("mission-kicker").textContent = `${gradeMeta.label} · ${p.skillTitle}`;
  $("problem-title").textContent = p.question;
  const visualEl = $("problem-visual");
  visualEl.innerHTML = "";
  void visualEl.offsetHeight;
  visualEl.innerHTML = buildElementaryVisual(p);
  renderConceptNote(p);
  renderVennFlow();
  if (p.expression && p.expression.trim()) {
    const exprDiv = document.createElement("div");
    exprDiv.className = "problem-expr-text";
    exprDiv.innerHTML = formatMathHTML(p.expression);
    visualEl.appendChild(exprDiv);
  }
  stabilizeMathVisual(visualEl);
  upgradeProfessionalVisual(p, visualEl);
  renderChoices(true);
  renderRoad();
  updateStats();
  renderGameProgress();
  renderReport();
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
      <span class="option4-value">${formatMathHTML(ch.value)}</span>
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
  gradeSteps();
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
    ? `✅ <b>정답입니다!</b><br>${escapeHTML(app.problem.skillTitle)} 개념을 정확히 이해했습니다. 정답: <b>${formatMathHTML(app.problem.answer)}</b>`
    : `⚠️ <b>오답 분석:</b><br>${escapeHTML(analysis.speech)}`;
  const meterFill=$("meter-fill"), meterText=$("meter-text");
  if (meterFill && meterText) { meterFill.className=`meter-fill ${correct?"low":"mid"}`; meterText.textContent=correct?"낮음 · 20%":"중간 · 55%"; }
  updateStats(); renderGameProgress(); renderReport();
  syncAcademyAttempt(correct, value);
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

function maskAnswerText(text, answer) {
  let value = String(text || "");
  const ans = String(answer || "").trim();
  if (ans) value = value.split(ans).join("□");
  value = value.replace(/(정답\s*[:：]\s*)[^\n.。]+/g, "$1□");
  value = value.replace(/(=\s*)(-?\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?(?:\s*[a-zA-Z가-힣%°²³]+)?)/g, "$1□");
  return value;
}

function teacherConceptGuide(problem) {
  const ctx = problemMathContext(problem);
  const expr = ctx.expression ? `${ctx.expression}에서 ` : "이 문제에서 ";
  const units = ctx.units.length ? ` 단위 ${ctx.units.join(", ")}도 함께 맞춥니다.` : "";
  const id = problem.skillId || "";
  if (ctx.ops.includes("분수") || id.includes("fraction") || id.includes("frac")) return `${expr}분자, 분모, 연산 기호를 먼저 확인합니다. 분수는 같은 전체를 몇 칸으로 나누었는지 보는 수이므로, 현재 식에 있는 분모를 기준으로 계산 방법을 정합니다.${units}`;
  if (ctx.ops.includes("소수") || id.includes("decimal")) return `${expr}소수점 위치와 자리값을 먼저 표시합니다. 계산 중에는 0.1, 0.01 자리의 의미가 바뀌지 않게 줄을 맞추어 생각합니다.${units}`;
  if (ctx.ops.includes("나누기") || id.includes("div")) return `${expr}나누어지는 수와 나누는 수를 구분합니다. 몫을 바로 보려 하지 말고, '몇 묶음인지' 또는 '한 묶음의 양이 얼마인지'를 문제 문장과 연결합니다.${units}`;
  if (ctx.ops.includes("곱하기") || id.includes("mul") || id.includes("times")) return `${expr}같은 크기의 묶음과 묶음 수를 구분합니다. 자리값이 있는 곱셈이라면 각 자리에서 나온 부분곱을 차례로 모읍니다.${units}`;
  if (ctx.ops.includes("더하기")) return `${expr}더해야 하는 양들이 같은 종류인지 확인합니다. 자리값이나 단위가 다르면 먼저 맞춘 뒤 차례로 합합니다.${units}`;
  if (ctx.ops.includes("빼기")) return `${expr}처음 양, 덜어 내는 양, 남는 양을 구분합니다. 같은 자리와 같은 단위끼리 빼며 받아내림 여부를 확인합니다.${units}`;
  if (ctx.ops.includes("백분율") || ctx.ops.includes("비") || id.includes("ratio") || id.includes("percent") || id.includes("rate")) return `${expr}기준량과 비교하는 양을 먼저 나누어 봅니다. 비, 비율, 백분율은 모두 두 양의 관계를 나타내므로 기준이 되는 양이 무엇인지가 핵심입니다.${units}`;
  if (id.includes("graph") || id.includes("table")) return `${expr}표나 그래프에서 필요한 항목과 전체를 먼저 찾습니다. 눈금 간격, 합계, 차이 중 무엇을 묻는지 표시한 뒤 식으로 옮깁니다.${units}`;
  if (id.includes("area") || id.includes("perimeter") || id.includes("volume") || id.includes("cuboid") || id.includes("cube")) return `${expr}구하는 것이 길이, 둘레, 넓이, 부피 중 무엇인지 먼저 정합니다. 주어진 치수를 도형 위에 대응시키고 맞는 공식을 선택합니다.${units}`;
  if (id.includes("angle")) return `${expr}주어진 각과 구해야 하는 각을 구분합니다. 직각 90도, 일직선 180도, 한 바퀴 360도 중 어느 기준을 쓰는지 확인합니다.`;
  if (id.includes("place") || id.includes("number")) return `${expr}각 숫자가 어느 자리에 있는지 확인합니다. 같은 숫자라도 자리에 따라 값이 달라지므로 자리표를 떠올리며 읽습니다.`;
  if (id.includes("pattern")) return `${expr}앞뒤 항이 얼마씩 변하는지, 또는 어떤 모양이 반복되는지 찾습니다. 찾은 규칙을 다음 칸에도 똑같이 적용합니다.`;
  return `${expr}주어진 조건과 구해야 하는 값을 먼저 나누어 생각합니다. 문제에 나온 수와 단위를 식에 그대로 연결하면 풀이 방향이 선명해집니다.${units}`;
}

function teacherPlanGuide(problem) {
  const ctx = problemMathContext(problem);
  const expr = ctx.expression ? `식 ${ctx.expression}을 기준으로 ` : "문제 조건을 기준으로 ";
  const numbers = ctx.numbers.length ? `사용할 수는 ${ctx.numbers.join(", ")}입니다. ` : "";
  const id = problem.skillId || "";
  if (id.includes("compare") || id.includes("order")) return `${numbers}${expr}두 값을 같은 기준으로 바꾼 뒤 비교합니다. 분수는 분모를 맞추고, 소수는 자릿수를 맞추고, 단위가 있으면 단위를 통일합니다.`;
  if (id.includes("word")) return `${numbers}문장에 나온 양을 전체량, 한 묶음의 양, 구해야 하는 양으로 표시합니다. 그 표시를 그대로 식에 연결한 뒤 마지막 값은 보기와 비교합니다.`;
  if (id.includes("graph") || id.includes("table")) return `${numbers}그래프나 표에서 필요한 칸만 먼저 표시합니다. 전체와 부분, 차이, 합계 중 문제에서 묻는 관계를 찾아 계산합니다.`;
  if (id.includes("area") || id.includes("volume") || id.includes("perimeter")) return `${numbers}도형의 각 길이를 공식의 문자 자리에 대응시킵니다. 계산 뒤에는 cm, cm², cm³처럼 단위 차원이 맞는 보기를 찾습니다.`;
  if (problem.kind === "choice") return `${numbers}${expr}한 줄씩 계산하거나 조건을 확인한 뒤, 네 보기 중 같은 값 또는 같은 설명을 고릅니다. 답은 □로 가려 두고 보기의 단위와 표현까지 대조합니다.`;
  return `${numbers}${expr}계산 순서를 지키며 한 줄씩 풀어 봅니다. 마지막 값은 아직 가려 두고 조건과 단위를 비교합니다.`;
}

function buildTeacherSolutionCards(problem) {
  const answer = problem.answer;
  const ctx = problemMathContext(problem);
  const contextCard = [
    "1",
    "문제 조건 확인",
    `${ctx.expression ? `먼저 식 ${ctx.expression}을 봅니다. ` : ""}${ctx.numbers.length ? `문제에 쓰인 수는 ${ctx.numbers.join(", ")}입니다. ` : ""}${ctx.units.length ? `단위 ${ctx.units.join(", ")}를 마지막까지 맞춥니다. ` : ""}무엇을 구하는지 확인한 뒤 정답값은 □로 가려 두고 풀이합니다.`,
  ];
  if (Array.isArray(problem.solutionSteps) && problem.solutionSteps.length) {
    return [contextCard, ...problem.solutionSteps.map((step, i) => [
      String(i + 2),
      `${i + 2}단계 · ${step.label || "풀이"}`,
      maskAnswerText(step.answer || step.hint || "풀이 이유를 차근차근 확인해 봅시다.", answer),
    ])];
  }
  const cards = [
    contextCard,
    ["2", "핵심 개념 떠올리기", teacherConceptGuide(problem)],
    ["3", "풀이 계획 세우기", teacherPlanGuide(problem)],
    ["4", "정답은 가리고 대조하기", "마지막 계산값은 □로 가려 두겠습니다. 풀이 흐름을 따라 직접 계산한 뒤, 보기 중 같은 값 또는 같은 설명을 고르세요."],
  ];
  if (problem.hint) cards.splice(3, 0, ["힌트", "작은 도움", maskAnswerText(problem.hint, answer)]);
  return cards;
}

function teacherHintSummary(problem) {
  return buildTeacherSolutionCards(problem)
    .slice(0, 3)
    .map(([, head, body]) => `${head}: ${body}`)
    .join(" ");
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
      ["📝","풀이 힌트",teacherHintSummary(app.problem)],
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
  const guidedSteps = buildTeacherSolutionCards(app.problem);
  setMascot("thinking","좋아요. 정답은 잠깐 가려 두고, 선생님과 함께 풀이 길을 따라가 봅시다.");
  setCoach("thinking","단계별 풀이법","정답을 먼저 보는 것보다, 왜 그런 식을 세우는지 이해하는 힘이 더 중요해요. 한 단계씩 천천히 확인해봅시다.",guidedSteps);
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
        <div><strong>${escapeHTML(String(head))}</strong><small>${formatMathHTML(String(body))}</small></div>
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
  const accuracy = app.total ? Math.round((app.correct / app.total) * 100) : 0;
  const hintPenalty = app.questHinted ? 20 : 0;
  const independence = Math.max(0, 100 - app.wrong * 8 - hintPenalty);
  const correction = app.total ? Math.min(100, Math.round((app.correct / app.total) * 100)) : 0;
  const streak = Math.min(100, app.streak * 10);

  // 검산표 요약 행
  const summary = `<div class="report-summary">
    <div class="rs-item"><span class="rs-num">${app.total}</span><span class="rs-lbl">총 문제</span></div>
    <div class="rs-item rs-correct"><span class="rs-num">${app.correct}</span><span class="rs-lbl">정답</span></div>
    <div class="rs-item rs-wrong"><span class="rs-num">${app.wrong}</span><span class="rs-lbl">오답</span></div>
    <div class="rs-item rs-streak"><span class="rs-num">${app.streak}</span><span class="rs-lbl">연속정답</span></div>
  </div>`;

  const bars = [
    ["정확도", accuracy, "#22c55e"],
    ["힌트 독립성", independence, "#38bdf8"],
    ["오답 수정력", correction, "#a78bfa"],
    ["연속 정답", streak, "#f59e0b"],
  ].map(([label, value, color]) =>
    `<div class="bar-row">
      <div class="bar-top"><span>${label}</span><strong>${value}%</strong></div>
      <div class="bar-track-outer"><div class="bar-track-fill" style="width:${value}%;background:${color}"></div></div>
    </div>`
  ).join("");

  $("report-bars").innerHTML = summary + bars;

  const weak = Object.entries(app.weakMap).sort((a,b) => b[1]-a[1])[0];
  $("weak-signal").textContent = weak ? "보충 필요" : "안정";
  $("weak-note").textContent = weak
    ? `${weak[0]} 유형에서 오답 ${weak[1]}회 누적 — 다시 도전해 보세요!`
    : app.total > 0 ? `정확도 ${accuracy}% · ${app.correct}문제 연속 정답 중!` : "미션을 시작하면 결과가 여기 표시됩니다.";
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

function showConfetti() {
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6BFF','#FFB347','#87CEEB'];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.cssText = `left:${(Math.random()*100).toFixed(1)}%;` +
      `background:${colors[i % colors.length]};` +
      `animation-delay:${(Math.random()*0.6).toFixed(2)}s;` +
      `animation-duration:${(0.9+Math.random()*0.7).toFixed(2)}s;` +
      `transform:rotate(${Math.floor(Math.random()*360)}deg)`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
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
function startNewSession() {
  app.sessionProblems=0;
  academyActivity("session_start", { grade: app.grade, semester: app.semester });
  makeMission();
}
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
async function boot() {
  await initAcademyLink();
  initCurriculum();
  initGradeTabs();
  renderUnitSelect();
  renderReport();
  renderGameProgress();
  makeMission();
}

boot();

window.addEventListener("pagehide", () => {
  if (academyHeartbeat) window.clearInterval(academyHeartbeat);
  academyActivity("offline", { reason: "pagehide" }, true);
});
