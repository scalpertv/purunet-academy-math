// 생성기 정답 정합성 표본 검증.
// TypeScript 생성기를 번들한 뒤 각 문항의 정답 형태와 핵심 수학 관계를 교차 확인한다.

import { rolldown } from "rolldown";

const bundle = await rolldown({ input: "src/lib/generators.ts", logLevel: "silent" });
const { output } = await bundle.generate({ format: "esm" });
await bundle.close();

const dataUrl =
  "data:text/javascript;base64," +
  Buffer.from(output[0].code).toString("base64");
const { GENERATORS } = await import(dataUrl);

const ITER = 2500;

function igcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : igcd(b, a % b);
}

function frac(n, d) {
  if (d === 0) throw new Error("zero denominator");
  return d < 0 ? { n: -n, d: -d } : { n, d };
}

function reduce(f) {
  const g = igcd(f.n, f.d) || 1;
  return frac(f.n / g, f.d / g);
}

function fracEq(a, b) {
  return a.n * b.d === b.n * a.d;
}

function parseValue(raw) {
  const s = raw.trim();
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  throw new Error(`cannot parse value: ${raw}`);
}

function parseFracText(raw) {
  const s = raw.trim();
  const m = s.match(/^(\d+)\/(\d+)$/);
  if (!m) throw new Error(`cannot parse fraction: ${raw}`);
  return frac(Number(m[1]), Number(m[2]));
}

function validateDisplayText(value, label) {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") throw new Error(`${label} is not string`);
  if (/�|NaN|Infinity|undefined|횞|첨|\?\?/.test(value)) {
    throw new Error(`bad display token in ${label}: ${value}`);
  }
}

function validateDisplayFields(p) {
  validateDisplayText(p.prompt, "prompt");
  validateDisplayText(p.expression, "expression");
  validateDisplayText(p.solution, "solution");
  validateDisplayText(p.hint, "hint");
  validateDisplayText(p.answerText, "answerText");
  for (const [index, choice] of (p.choices ?? []).entries()) {
    validateDisplayText(choice, `choice[${index}]`);
  }
}

function assertFiniteNumber(value, label, positive = false) {
  if (!Number.isFinite(value) || (positive && value <= 0)) {
    throw new Error(`bad visual number ${label}`);
  }
}

function assertFiniteTuple(values, label) {
  if (!Array.isArray(values)) throw new Error(`bad visual tuple ${label}`);
  values.forEach((value, index) => assertFiniteNumber(value, `${label}[${index}]`));
}

function validateVisual(visual) {
  if (!visual) return;
  switch (visual.type) {
    case "rectangle":
      assertFiniteNumber(Number(visual.width), "rectangle.width", true);
      assertFiniteNumber(Number(visual.height), "rectangle.height", true);
      return;
    case "square":
      assertFiniteNumber(Number(visual.side), "square.side", true);
      return;
    case "parallelogram":
      assertFiniteNumber(Number(visual.base), "parallelogram.base", true);
      assertFiniteNumber(Number(visual.height), "parallelogram.height", true);
      return;
    case "triangle":
      assertFiniteNumber(Number(visual.base), "triangle.base", true);
      assertFiniteNumber(Number(visual.height), "triangle.height", true);
      return;
    case "trapezoid":
      assertFiniteNumber(Number(visual.top), "trapezoid.top", true);
      assertFiniteNumber(Number(visual.bottom), "trapezoid.bottom", true);
      assertFiniteNumber(Number(visual.height), "trapezoid.height", true);
      return;
    case "composite-rect":
      assertFiniteNumber(Number(visual.width), "composite.width", true);
      assertFiniteNumber(Number(visual.height), "composite.height", true);
      assertFiniteNumber(Number(visual.cutWidth), "composite.cutWidth", true);
      assertFiniteNumber(Number(visual.cutHeight), "composite.cutHeight", true);
      return;
    case "cuboid":
      for (const key of ["width", "depth", "height"]) {
        if (typeof visual[key] === "number") assertFiniteNumber(visual[key], `cuboid.${key}`, true);
      }
      return;
    case "solid-shape":
      if (!["prism", "pyramid", "cylinder", "cone", "sphere"].includes(visual.kind)) throw new Error("bad solid shape kind");
      for (const key of ["height", "radius"]) {
        if (typeof visual[key] === "number") assertFiniteNumber(visual[key], `solidShape.${key}`, true);
      }
      return;
    case "cube-stack":
      assertFiniteNumber(visual.cols, "cubeStack.cols", true);
      assertFiniteNumber(visual.rows, "cubeStack.rows", true);
      assertFiniteNumber(visual.layers, "cubeStack.layers", true);
      return;
    case "data-table":
      if (!visual.headers?.length || !visual.rows?.length) throw new Error("empty data table visual");
      for (const [rowIndex, row] of visual.rows.entries()) {
        if (row.length !== visual.headers.length) throw new Error(`data table row length mismatch: ${rowIndex}`);
      }
      return;
    case "bar-chart":
      if (!visual.items?.length) throw new Error("empty bar chart visual");
      visual.items.forEach((item, index) => assertFiniteNumber(item.value, `barChart.items[${index}]`));
      if (visual.referenceValue !== undefined) assertFiniteNumber(visual.referenceValue, "barChart.referenceValue");
      return;
    case "line-chart":
      if (!visual.points?.length) throw new Error("empty line chart visual");
      visual.points.forEach((point, index) => assertFiniteNumber(point.value, `lineChart.points[${index}]`));
      if (visual.referenceValue !== undefined) assertFiniteNumber(visual.referenceValue, "lineChart.referenceValue");
      return;
    case "clock":
      assertFiniteNumber(visual.hour, "clock.hour", true);
      assertFiniteNumber(visual.minute, "clock.minute");
      if (!Number.isInteger(visual.hour) || visual.hour < 1 || visual.hour > 12) throw new Error("bad clock hour");
      if (!Number.isInteger(visual.minute) || visual.minute < 0 || visual.minute >= 60) throw new Error("bad clock minute");
      return;
    case "ruler":
      assertFiniteNumber(visual.length, "ruler.length", true);
      if (visual.max !== undefined) assertFiniteNumber(visual.max, "ruler.max", true);
      if (visual.unit !== undefined && !["cm", "mm"].includes(visual.unit)) throw new Error("bad ruler unit");
      return;
    case "line-type":
      if (!["segment", "ray", "line"].includes(visual.kind)) throw new Error("bad line type kind");
      return;
    case "right-angle":
      if (!["angle", "triangle", "rectangle", "square"].includes(visual.shape)) throw new Error("bad right angle shape");
      return;
    case "ten-frame":
      assertFiniteNumber(visual.filled, "tenFrame.filled");
      if (visual.total !== undefined && ![10, 20].includes(visual.total)) throw new Error("bad ten frame total");
      if (visual.splitAt !== undefined) assertFiniteNumber(visual.splitAt, "tenFrame.splitAt");
      return;
    case "number-bond":
      if (visual.total === undefined || visual.left === undefined || visual.right === undefined) throw new Error("bad number bond");
      return;
    case "place-value-blocks":
      assertFiniteNumber(visual.tens, "placeValue.tens");
      assertFiniteNumber(visual.ones, "placeValue.ones");
      if (!Number.isInteger(visual.tens) || visual.tens < 0 || !Number.isInteger(visual.ones) || visual.ones < 0) throw new Error("bad place value blocks");
      return;
    case "base-ten-blocks":
      assertFiniteNumber(visual.hundreds, "baseTen.hundreds");
      assertFiniteNumber(visual.tens, "baseTen.tens");
      assertFiniteNumber(visual.ones, "baseTen.ones");
      if (!Number.isInteger(visual.hundreds) || visual.hundreds < 0 || !Number.isInteger(visual.tens) || visual.tens < 0 || !Number.isInteger(visual.ones) || visual.ones < 0) throw new Error("bad base ten blocks");
      return;
    case "number-line":
      if (!visual.values?.length) throw new Error("empty number line");
      visual.values.forEach((value, index) => assertFiniteNumber(value, `numberLine.values[${index}]`));
      if (visual.missingIndex !== undefined) assertFiniteNumber(visual.missingIndex, "numberLine.missingIndex");
      return;
    case "range-line":
      assertFiniteNumber(visual.start, "rangeLine.start");
      assertFiniteNumber(visual.end, "rangeLine.end");
      if (typeof visual.leftInclusive !== "boolean" || typeof visual.rightInclusive !== "boolean") throw new Error("bad range endpoint type");
      return;
    case "object-array":
      assertFiniteNumber(visual.rows, "objectArray.rows", true);
      assertFiniteNumber(visual.cols, "objectArray.cols", true);
      if (!Number.isInteger(visual.rows) || !Number.isInteger(visual.cols)) throw new Error("bad object array size");
      return;
    case "shape-pattern":
      if (!visual.items?.length) throw new Error("empty shape pattern visual");
      return;
    case "pictograph":
      if (!visual.items?.length) throw new Error("empty pictograph visual");
      assertFiniteNumber(visual.bigValue, "pictograph.bigValue", true);
      assertFiniteNumber(visual.smallValue, "pictograph.smallValue", true);
      visual.items.forEach((item, index) => {
        for (const key of ["bigCount", "smallCount"]) {
          assertFiniteNumber(item[key], `pictograph.items[${index}].${key}`);
          if (!Number.isInteger(item[key]) || item[key] < 0) throw new Error(`bad pictograph count ${key}`);
        }
      });
      return;
    case "ratio-strip":
      assertFiniteNumber(visual.left, "ratioStrip.left", true);
      assertFiniteNumber(visual.right, "ratioStrip.right", true);
      if (visual.total !== undefined) assertFiniteNumber(visual.total, "ratioStrip.total", true);
      return;
    case "circle-chart":
      if (!visual.items?.length) throw new Error("empty circle chart visual");
      visual.items.forEach((item, index) => assertFiniteNumber(item.value, `circleChart.items[${index}]`));
      return;
    case "circle-diagram":
      if (!["radius", "diameter", "circumference", "area", "composite"].includes(visual.mode)) throw new Error("bad circle diagram mode");
      for (const key of ["radius", "diameter", "squareSide"]) {
        if (visual[key] !== undefined) assertFiniteNumber(visual[key], `circleDiagram.${key}`, true);
      }
      return;
    case "circle-pattern":
      assertFiniteNumber(visual.circles, "circlePattern.circles", true);
      assertFiniteNumber(visual.radius, "circlePattern.radius", true);
      if (!Number.isInteger(visual.circles)) throw new Error("bad circle pattern count");
      return;
    case "angle-diagram":
      assertFiniteNumber(visual.degrees, "angleDiagram.degrees", true);
      if (visual.degrees > 360) throw new Error("bad angle degrees");
      return;
    case "parallel-lines":
      if (!["parallel", "perpendicular", "distance"].includes(visual.mode)) throw new Error("bad parallel lines mode");
      return;
    case "quadrilateral-diagram":
      if (!["trapezoid", "parallelogram", "rhombus", "rectangle", "square"].includes(visual.kind)) throw new Error("bad quadrilateral kind");
      return;
    case "polygon-diagram":
      assertFiniteNumber(visual.sides, "polygonDiagram.sides", true);
      if (!Number.isInteger(visual.sides) || visual.sides < 3) throw new Error("bad polygon sides");
      return;
    case "fraction-strip":
      assertFiniteNumber(visual.numerator, "fractionStrip.numerator", true);
      assertFiniteNumber(visual.denominator, "fractionStrip.denominator", true);
      if (visual.divisorNumerator !== undefined) assertFiniteNumber(visual.divisorNumerator, "fractionStrip.divisorNumerator", true);
      return;
    case "probability-bag":
      assertFiniteNumber(visual.red, "probabilityBag.red", true);
      assertFiniteNumber(visual.blue, "probabilityBag.blue", true);
      return;
    case "coin-chance":
    case "rotation-180":
      return;
    case "coordinate-plane":
      assertFiniteTuple(visual.point, "coordinate.point");
      if (!["x", "y"].includes(visual.axis)) throw new Error("bad coordinate axis");
      if (visual.reflected) assertFiniteTuple(visual.reflected, "coordinate.reflected");
      return;
    case "congruent-triangles":
      if (!visual.target) throw new Error("missing congruent target");
      if (visual.sides) assertFiniteTuple(visual.sides, "congruent.sides");
      if (visual.angles) assertFiniteTuple(visual.angles, "congruent.angles");
      return;
    case "symmetry-shape":
      if (!["square", "rectangle", "equilateral-triangle", "isosceles-triangle", "parallelogram"].includes(visual.shape)) {
        throw new Error("bad symmetry shape");
      }
      return;
    default:
      throw new Error(`unknown visual type: ${visual.type}`);
  }
}

function validateFirstGradeAnswerVisual(p) {
  if (!p.topicId?.startsWith("g1-") || !p.visual) return;

  switch (p.visual.type) {
    case "object-array":
      if (p.visual.showTotalLabel !== false) throw new Error("first-grade object array exposes total label");
      return;
    case "ten-frame":
      if (p.visual.showCountLabel !== false) throw new Error("first-grade ten frame exposes count label");
      return;
    case "place-value-blocks":
    case "base-ten-blocks":
      if (p.visual.showTotal !== false) throw new Error("first-grade place-value visual exposes total label");
      return;
    case "bar-chart":
      if (p.topicId.includes("compare-facts") && p.visual.showValues !== false) {
        throw new Error("first-grade fact comparison chart exposes computed values");
      }
      return;
    default:
      return;
  }
}

function validateProblem(p) {
  if (!p || typeof p !== "object") throw new Error("problem is not object");
  if (!p.topicId || !p.prompt || !p.expression || !p.solution) {
    throw new Error("missing required display fields");
  }
  validateDisplayFields(p);
  validateVisual(p.visual);
  validateFirstGradeAnswerVisual(p);

  switch (p.kind) {
    case "integer":
      if (!Number.isInteger(p.answer)) throw new Error("integer answer is not integer");
      return;

    case "choice":
      if (!Array.isArray(p.choices) || !p.choices.includes(p.answer)) {
        throw new Error("choice answer is not present in choices");
      }
      if (new Set(p.choices).size !== p.choices.length) {
        throw new Error("duplicate choices");
      }
      return;

    case "fraction": {
      if (!Number.isInteger(p.answer.n) || !Number.isInteger(p.answer.d) || p.answer.d <= 0) {
        throw new Error("bad fraction answer");
      }
      if (p.requireDenominator && p.answer.d !== p.requireDenominator) {
        throw new Error("required denominator mismatch");
      }
      if (p.requireReduced && igcd(p.answer.n, p.answer.d) !== 1) {
        throw new Error("answer is not reduced");
      }
      if (p.topicId === "equivalent-fraction") {
        const [left] = p.expression.split("=");
        if (!fracEq(parseFracText(left), p.answer)) throw new Error("equivalent fraction mismatch");
      }
      if (p.topicId === "reduce-fraction") {
        const given = parseFracText(p.expression);
        if (!fracEq(reduce(given), p.answer)) throw new Error("reduced fraction mismatch");
      }
      return;
    }

    case "fractionPair": {
      if (!Array.isArray(p.answer) || p.answer.length !== 2) throw new Error("bad pair");
      for (const f of p.answer) {
        if (!Number.isInteger(f.n) || !Number.isInteger(f.d) || f.d <= 0) {
          throw new Error("bad fraction in pair");
        }
        if (p.commonDenominator && f.d !== p.commonDenominator) {
          throw new Error("common denominator mismatch");
        }
      }
      const m = p.expression.match(/\{\s*([^,]+),\s*([^}]+)\}/);
      if (m) {
        const left = parseFracText(m[1]);
        const right = parseFracText(m[2]);
        if (!fracEq(left, p.answer[0]) || !fracEq(right, p.answer[1])) {
          throw new Error("fraction pair is not equivalent to source");
        }
      }
      return;
    }

    case "compare": {
      if (![">", "=", "<"].includes(p.answer)) throw new Error("bad compare sign");
      const [left, right] = p.expression.split("□").map((s) => s.trim());
      const lv = parseValue(left);
      const rv = parseValue(right);
      const sign = lv === rv ? "=" : lv > rv ? ">" : "<";
      if (sign !== p.answer) throw new Error(`compare mismatch ${left} ${p.answer} ${right}`);
      return;
    }

    case "numberSet":
      if (!Array.isArray(p.answer) || p.answer.some((n) => !Number.isInteger(n))) {
        throw new Error("bad number set");
      }
      return;

    default:
      throw new Error(`unknown kind: ${p.kind}`);
  }
}

let failures = 0;

for (const [id, gen] of Object.entries(GENERATORS)) {
  let ok = 0;
  for (let i = 0; i < ITER; i++) {
    try {
      validateProblem(gen());
      ok++;
    } catch (e) {
      failures++;
      if (failures <= 20) console.log(`[${id}] ${e.message}`);
    }
  }
  console.log(`${ok === ITER ? "OK " : "XX "} ${id}: ${ok}/${ITER}`);
}

console.log(failures === 0 ? "\nALL PASSED" : `\nFAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
