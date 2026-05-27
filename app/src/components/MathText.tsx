import { useMemo, type ReactNode } from "react";
import katex from "katex";

interface MathTextProps {
  text: string;
}

type Token =
  | { type: "text"; value: string; key: string }
  | { type: "math"; value: string; key: string; display?: boolean };

const EXPLICIT_MATH_RE = /(\$\$[^$]+\$\$|\$[^$]+\$|\\\([^)]*\\\))/g;
const AUTO_MATH_RE =
  /(\d+\s+\d+\/\d+|(?:\d+|□)\/(?:\d+|□)|[(){}]|□|[+\-×÷=<>]|cm³|cm²|cm|m³|m²|m|°|[0-9]+(?:\.[0-9]+)?)/g;

function renderTex(tex: string, displayMode = false) {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    output: "mathml",
  });
}

function escapeTextForTex(value: string) {
  return value.replace(/[\\{}_$&#%]/g, (match) => `\\${match}`);
}

function fractionToTex(raw: string) {
  const mixed = raw.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return `${mixed[1]}\\,\\frac{${mixed[2]}}{${mixed[3]}}`;

  const simple = raw.match(/^(\d+|□)\/(\d+|□)$/);
  if (!simple) return null;
  const numerator = simple[1] === "□" ? "\\square" : simple[1];
  const denominator = simple[2] === "□" ? "\\square" : simple[2];
  return `\\frac{${numerator}}{${denominator}}`;
}

function autoTokenToTex(raw: string) {
  const fraction = fractionToTex(raw);
  if (fraction) return fraction;
  if (raw === "×") return "\\times";
  if (raw === "÷") return "\\div";
  if (raw === "□") return "\\square";
  if (raw === "cm³") return "\\mathrm{cm}^{3}";
  if (raw === "cm²") return "\\mathrm{cm}^{2}";
  if (raw === "m³") return "\\mathrm{m}^{3}";
  if (raw === "m²") return "\\mathrm{m}^{2}";
  if (raw === "cm" || raw === "m") return `\\mathrm{${raw}}`;
  if (raw === "°") return "^\\circ";
  if (raw === "<") return "<";
  if (raw === ">") return ">";
  return escapeTextForTex(raw);
}

function stripExplicitMath(raw: string) {
  if (raw.startsWith("$$") && raw.endsWith("$$")) {
    return { tex: raw.slice(2, -2), display: true };
  }
  if (raw.startsWith("$") && raw.endsWith("$")) {
    return { tex: raw.slice(1, -1), display: false };
  }
  if (raw.startsWith("\\(") && raw.endsWith("\\)")) {
    return { tex: raw.slice(2, -2), display: false };
  }
  return { tex: raw, display: false };
}

function autoMathTokens(text: string, baseKey: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;

  for (const match of text.matchAll(AUTO_MATH_RE)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: "text", value: text.slice(last, index), key: `${baseKey}-t-${last}` });
    tokens.push({ type: "math", value: autoTokenToTex(match[0]), key: `${baseKey}-m-${index}` });
    last = index + match[0].length;
  }

  if (last < text.length) tokens.push({ type: "text", value: text.slice(last), key: `${baseKey}-t-${last}` });
  return tokens;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;

  for (const match of text.matchAll(EXPLICIT_MATH_RE)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push(...autoMathTokens(text.slice(last, index), `auto-${last}`));
    const explicit = stripExplicitMath(match[0]);
    tokens.push({
      type: "math",
      value: explicit.tex,
      display: explicit.display,
      key: `explicit-${index}`,
    });
    last = index + match[0].length;
  }

  if (last < text.length) tokens.push(...autoMathTokens(text.slice(last), `auto-${last}`));
  return tokens;
}

function MathToken({ tex, display }: { tex: string; display?: boolean }) {
  const markup = useMemo(() => renderTex(tex, display), [display, tex]);
  return (
    <span
      className={display ? "math-katex display" : "math-katex"}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export default function MathText({ text }: MathTextProps) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const nodes: ReactNode[] = tokens.map((token) =>
    token.type === "math" ? (
      <MathToken key={token.key} tex={token.value} display={token.display} />
    ) : (
      <span key={token.key}>{token.value}</span>
    ),
  );

  return <span className="math-text">{nodes}</span>;
}
