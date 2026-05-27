import type { MathVisual as MathVisualSpec } from "../lib/types";
import MathText from "./MathText";

interface Props {
  visual: MathVisualSpec;
}

function label(value: number | string, unit = "cm") {
  return unit ? `${value} ${unit}` : String(value);
}

function DimensionLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text className="visual-label" x={x} y={y} textAnchor="middle">
      {text}
    </text>
  );
}

function chartScale(values: number[]) {
  return Math.max(1, Math.ceil(Math.max(...values, 1) / 10) * 10);
}

function valueY(value: number, max: number) {
  return 138 - (value / max) * 92;
}

function BarChart({
  items,
  unit = "",
  referenceValue,
  showValues = true,
}: {
  items: Array<{ label: string; value: number }>;
  unit?: string;
  referenceValue?: number;
  showValues?: boolean;
}) {
  const max = chartScale([...items.map((item) => item.value), referenceValue ?? 0]);
  const barWidth = Math.min(42, 176 / Math.max(1, items.length));
  const gap = Math.max(10, (220 - items.length * barWidth) / Math.max(1, items.length + 1));
  const referenceY = referenceValue === undefined ? undefined : valueY(referenceValue, max);

  return (
    <svg viewBox="0 0 280 180">
      <line className="chart-axis" x1="38" y1="138" x2="250" y2="138" />
      <line className="chart-axis" x1="38" y1="28" x2="38" y2="138" />
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line key={ratio} className="chart-grid-line" x1="38" y1={138 - ratio * 92} x2="250" y2={138 - ratio * 92} />
      ))}
      {referenceY !== undefined && (
        <>
          <line className="chart-reference" x1="38" y1={referenceY} x2="250" y2={referenceY} />
          <text className="chart-reference-label" x="246" y={referenceY - 4} textAnchor="end">
            평균 {referenceValue}
          </text>
        </>
      )}
      {items.map((item, index) => {
        const x = 38 + gap + index * (barWidth + gap);
        const height = Math.max(4, (item.value / max) * 92);
        return (
          <g key={item.label}>
            <rect className="chart-bar" x={x} y={138 - height} width={barWidth} height={height} rx="6" />
            {showValues && (
              <text className="chart-value" x={x + barWidth / 2} y={132 - height} textAnchor="middle">
                {item.value}
              </text>
            )}
            <text className="chart-label" x={x + barWidth / 2} y="160" textAnchor="middle">
              {item.label}
            </text>
          </g>
        );
      })}
      {unit && (
        <text className="chart-unit" x="40" y="22">
          {unit}
        </text>
      )}
    </svg>
  );
}

function LineChart({
  points,
  unit = "",
  referenceValue,
}: {
  points: Array<{ label: string; value: number }>;
  unit?: string;
  referenceValue?: number;
}) {
  const max = chartScale([...points.map((point) => point.value), referenceValue ?? 0]);
  const xFor = (index: number) => 48 + (index * 184) / Math.max(1, points.length - 1);
  const plotted = points.map((point, index) => ({ ...point, x: xFor(index), y: valueY(point.value, max) }));
  const path = plotted.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const referenceY = referenceValue === undefined ? undefined : valueY(referenceValue, max);

  return (
    <svg viewBox="0 0 280 180">
      <line className="chart-axis" x1="38" y1="138" x2="250" y2="138" />
      <line className="chart-axis" x1="38" y1="28" x2="38" y2="138" />
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line key={ratio} className="chart-grid-line" x1="38" y1={138 - ratio * 92} x2="250" y2={138 - ratio * 92} />
      ))}
      {referenceY !== undefined && <line className="chart-reference" x1="38" y1={referenceY} x2="250" y2={referenceY} />}
      <path className="chart-line" d={path} />
      {plotted.map((point) => (
        <g key={point.label}>
          <circle className="chart-point" cx={point.x} cy={point.y} r="5" />
          <text className="chart-value" x={point.x} y={point.y - 10} textAnchor="middle">
            {point.value}
          </text>
          <text className="chart-label" x={point.x} y="160" textAnchor="middle">
            {point.label}
          </text>
        </g>
      ))}
      {unit && (
        <text className="chart-unit" x="40" y="22">
          {unit}
        </text>
      )}
    </svg>
  );
}

function Pictograph({
  items,
  bigValue,
  smallValue,
  unit = "",
}: {
  items: Array<{ label: string; bigCount: number; smallCount: number }>;
  bigValue: number;
  smallValue: number;
  unit?: string;
}) {
  return (
    <div className="pictograph-panel">
      <div className="pictograph-key" aria-label={`큰 그림은 ${bigValue}${unit}, 작은 그림은 ${smallValue}${unit}`}>
        <span className="pictograph-icon big" aria-hidden="true" />
        <span>= {bigValue}{unit}</span>
        <span className="pictograph-icon small" aria-hidden="true" />
        <span>= {smallValue}{unit}</span>
      </div>
      <div className="pictograph-rows">
        {items.map((item) => (
          <div className="pictograph-row" key={item.label}>
            <span className="pictograph-label">{item.label}</span>
            <span className="pictograph-symbols" aria-label={`${item.label}: 큰 그림 ${item.bigCount}개, 작은 그림 ${item.smallCount}개`}>
              {Array.from({ length: item.bigCount }).map((_, index) => (
                <span key={`big-${index}`} className="pictograph-icon big" aria-hidden="true" />
              ))}
              {Array.from({ length: item.smallCount }).map((_, index) => (
                <span key={`small-${index}`} className="pictograph-icon small" aria-hidden="true" />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const chartColors = ["#66b7c9", "#f2b66d", "#91c788", "#d786b6", "#9b8fe8", "#f08f74"];

function pointOnCircle(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function wedgePath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = pointOnCircle(cx, cy, radius, startAngle);
  const end = pointOnCircle(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function CircleChart({ items, unit = "" }: { items: Array<{ label: string; value: number }>; unit?: string }) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  const slices = items.reduce<Array<{ item: { label: string; value: number }; index: number; start: number; end: number; sweep: number }>>((acc, item, index) => {
    const start = acc.at(-1)?.end ?? 0;
    const sweep = (item.value / total) * 360;
    return [...acc, { item, index, start, end: start + sweep, sweep }];
  }, []);

  return (
    <svg viewBox="0 0 300 190">
      <circle className="circle-chart-ring" cx="96" cy="92" r="67" />
      {slices.map(({ item, index, start, end, sweep }) => {
        const labelPoint = pointOnCircle(96, 92, 42, start + sweep / 2);
        return (
          <g key={`${item.label}-${index}`}>
            <path className="circle-chart-wedge" d={wedgePath(96, 92, 64, start, end)} style={{ fill: chartColors[index % chartColors.length] }} />
            {sweep >= 35 && (
              <text className="circle-chart-percent" x={labelPoint.x} y={labelPoint.y + 4} textAnchor="middle">
                {item.value}
                {unit}
              </text>
            )}
          </g>
        );
      })}
      <circle className="circle-chart-hole" cx="96" cy="92" r="20" />
      {items.map((item, index) => (
        <g key={`legend-${item.label}-${index}`} transform={`translate(184 ${42 + index * 28})`}>
          <rect className="circle-chart-legend-chip" width="16" height="16" rx="4" style={{ fill: chartColors[index % chartColors.length] }} />
          <text className="chart-label" x="24" y="13">
            {item.label} {item.value}
            {unit}
          </text>
        </g>
      ))}
    </svg>
  );
}

function RatioStrip({
  leftLabel,
  rightLabel,
  left,
  right,
  unit = "",
  total,
}: {
  leftLabel: string;
  rightLabel: string;
  left: number;
  right: number;
  unit?: string;
  total?: number;
}) {
  const sum = Math.max(1, total ?? left + right);
  const width = 220;
  const leftWidth = Math.max(14, (left / sum) * width);
  const rightWidth = Math.max(14, width - leftWidth);
  const leftDots = Math.min(10, Math.max(1, Math.round(left)));
  const rightDots = Math.min(10, Math.max(1, Math.round(right)));

  return (
    <svg viewBox="0 0 300 180">
      <text className="visual-label" x="150" y="25" textAnchor="middle">
        {left}:{right}
      </text>
      <g transform="translate(40 52)">
        <rect className="ratio-strip-left" x="0" y="0" width={leftWidth} height="42" rx="8" />
        <rect className="ratio-strip-right" x={leftWidth} y="0" width={rightWidth} height="42" rx="8" />
        <line className="visual-guide" x1={leftWidth} y1="-6" x2={leftWidth} y2="48" />
        <text className="chart-label" x={leftWidth / 2} y="28" textAnchor="middle">
          {left}
          {unit}
        </text>
        <text className="chart-label" x={leftWidth + rightWidth / 2} y="28" textAnchor="middle">
          {right}
          {unit}
        </text>
        <DimensionLabel x={leftWidth / 2} y={72} text={leftLabel} />
        <DimensionLabel x={leftWidth + rightWidth / 2} y={72} text={rightLabel} />
      </g>
      <g transform="translate(48 140)">
        {Array.from({ length: leftDots }).map((_, index) => (
          <circle key={`left-${index}`} className="ratio-dot left" cx={index * 13} cy="0" r="5" />
        ))}
        {Array.from({ length: rightDots }).map((_, index) => (
          <circle key={`right-${index}`} className="ratio-dot right" cx={150 + index * 13} cy="0" r="5" />
        ))}
      </g>
    </svg>
  );
}

function CircleDiagram({
  mode,
  radius,
  diameter,
  squareSide,
  unit = "cm",
}: {
  mode: "radius" | "diameter" | "circumference" | "area" | "composite";
  radius?: number;
  diameter?: number;
  squareSide?: number;
  unit?: string;
}) {
  const r = radius ?? (diameter ? diameter / 2 : 5);
  const d = diameter ?? r * 2;
  const side = squareSide ?? d;

  if (mode === "composite") {
    return (
      <svg viewBox="0 0 280 190">
        <rect className="circle-square" x="58" y="28" width="132" height="132" rx="8" />
        <circle className="circle-area-fill" cx="124" cy="94" r="58" />
        <line className="visual-guide" x1="124" y1="94" x2="182" y2="94" />
        <DimensionLabel x={124} y={180} text={`정사각형 한 변 ${label(side, unit)}`} />
        <DimensionLabel x={153} y={86} text={`반지름 ${label(r, unit)}`} />
        <text className="chart-reference-label" x="218" y="78" textAnchor="middle">
          남은 넓이
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 280 190">
      <circle className={mode === "area" ? "circle-area-fill" : "circle-diagram-base"} cx="140" cy="92" r="62" />
      {(mode === "radius" || mode === "area" || mode === "circumference") && (
        <>
          <line className="circle-measure-line" x1="140" y1="92" x2="202" y2="92" />
          <circle className="coord-point" cx="140" cy="92" r="4" />
          <DimensionLabel x={172} y={82} text={`반지름 ${label(r, unit)}`} />
        </>
      )}
      {mode === "diameter" && (
        <>
          <line className="circle-measure-line" x1="78" y1="92" x2="202" y2="92" />
          <DimensionLabel x={140} y={82} text={`지름 ${label(d, unit)}`} />
        </>
      )}
      {mode === "circumference" && <circle className="circle-circumference" cx="140" cy="92" r="68" />}
      {mode === "area" && (
        <text className="chart-reference-label" x="140" y="166" textAnchor="middle">
          넓이 = 반지름 × 반지름 × 원주율
        </text>
      )}
      {mode === "diameter" && <DimensionLabel x={140} y={166} text={`반지름은 ${label(d / 2, unit)}`} />}
    </svg>
  );
}

function CirclePattern({ circles, radius, unit = "cm" }: { circles: number; radius: number; unit?: string }) {
  const ringCount = Math.max(0, circles - 1);
  const center = { x: 140, y: 92 };
  const ringRadius = 52;
  const drawnRadius = 22;

  return (
    <svg viewBox="0 0 280 190">
      <circle className="circle-pattern-center" cx={center.x} cy={center.y} r={drawnRadius} />
      {Array.from({ length: ringCount }).map((_, index) => {
        const angle = (index / Math.max(1, ringCount)) * Math.PI * 2 - Math.PI / 2;
        const x = center.x + Math.cos(angle) * ringRadius;
        const y = center.y + Math.sin(angle) * ringRadius;
        return <circle key={index} className="circle-pattern-petal" cx={x} cy={y} r={drawnRadius} />;
      })}
      <text className="visual-label" x="140" y="170" textAnchor="middle">
        반지름 {label(radius, unit)}인 원 {circles}개
      </text>
    </svg>
  );
}

function AngleDiagram({ degrees }: { degrees: number }) {
  const origin = { x: 72, y: 136 };
  const ray = 128;
  const arc = 52;
  const radians = (degrees * Math.PI) / 180;
  const end = { x: origin.x + Math.cos(radians) * ray, y: origin.y - Math.sin(radians) * ray };
  const arcEnd = { x: origin.x + Math.cos(radians) * arc, y: origin.y - Math.sin(radians) * arc };
  const largeArcFlag = degrees > 180 ? 1 : 0;
  const arcPath =
    degrees >= 360
      ? `M ${origin.x + arc} ${origin.y} A ${arc} ${arc} 0 1 0 ${origin.x - arc} ${origin.y} A ${arc} ${arc} 0 1 0 ${origin.x + arc} ${origin.y}`
      : `M ${origin.x + arc} ${origin.y} A ${arc} ${arc} 0 ${largeArcFlag} 0 ${arcEnd.x} ${arcEnd.y}`;

  return (
    <svg viewBox="0 0 260 180">
      <line className="angle-ray" x1={origin.x} y1={origin.y} x2={origin.x + ray} y2={origin.y} />
      <line className="angle-ray" x1={origin.x} y1={origin.y} x2={end.x} y2={end.y} />
      <path className="angle-arc" d={arcPath} />
      <circle className="coord-point" cx={origin.x} cy={origin.y} r="5" />
      <text className="visual-label" x="154" y="126" textAnchor="middle">
        {degrees}°
      </text>
    </svg>
  );
}

function handPoint(cx: number, cy: number, angle: number, length: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * length,
    y: cy + Math.sin(radians) * length,
  };
}

function ClockVisual({ hour, minute }: { hour: number; minute: number }) {
  const cx = 140;
  const cy = 92;
  const minutePoint = handPoint(cx, cy, minute * 6, 58);
  const hourPoint = handPoint(cx, cy, ((hour % 12) + minute / 60) * 30, 42);

  return (
    <svg viewBox="0 0 280 190">
      <circle className="clock-face" cx={cx} cy={cy} r="72" />
      {Array.from({ length: 60 }).map((_, index) => {
        const outer = handPoint(cx, cy, index * 6, 68);
        const inner = handPoint(cx, cy, index * 6, index % 5 === 0 ? 56 : 62);
        return <line key={index} className={index % 5 === 0 ? "clock-tick major" : "clock-tick"} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} />;
      })}
      {[12, 3, 6, 9].map((num) => {
        const point = handPoint(cx, cy, (num % 12) * 30, 45);
        return (
          <text key={num} className="clock-number" x={point.x} y={point.y + 5} textAnchor="middle">
            {num}
          </text>
        );
      })}
      <line className="clock-hand hour" x1={cx} y1={cy} x2={hourPoint.x} y2={hourPoint.y} />
      <line className="clock-hand minute" x1={cx} y1={cy} x2={minutePoint.x} y2={minutePoint.y} />
      <circle className="clock-center" cx={cx} cy={cy} r="5" />
      <text className="visual-label" x="140" y="178" textAnchor="middle">
        {hour}시 {minute}분
      </text>
    </svg>
  );
}

function RulerVisual({ length, unit = "cm", max }: { length: number; unit?: "cm" | "mm"; max?: number }) {
  const maxValue = Math.max(length, max ?? length, unit === "mm" ? 50 : 30);
  const majorStep = unit === "mm" || maxValue > 40 ? 10 : 1;
  const minorStep = unit === "mm" ? 5 : maxValue > 40 ? 5 : 0.5;
  const xFor = (value: number) => 30 + (value / maxValue) * 220;
  const majorTicks = Array.from({ length: Math.floor(maxValue / majorStep) + 1 }, (_, index) => index * majorStep).filter((value) => value <= maxValue);
  const minorTicks = Array.from({ length: Math.floor(maxValue / minorStep) + 1 }, (_, index) => index * minorStep).filter((value) => value <= maxValue && value % majorStep !== 0);

  return (
    <svg viewBox="0 0 280 150">
      <rect className="ruler-body" x="24" y="38" width="232" height="54" rx="9" />
      <line className="ruler-highlight" x1={xFor(0)} y1="102" x2={xFor(length)} y2="102" />
      {minorTicks.map((value) => (
        <line key={`minor-${value}`} className="ruler-tick minor" x1={xFor(value)} y1="38" x2={xFor(value)} y2="62" />
      ))}
      {majorTicks.map((value) => (
        <g key={`major-${value}`}>
          <line className="ruler-tick major" x1={xFor(value)} y1="38" x2={xFor(value)} y2="80" />
          <text className="ruler-number" x={xFor(value)} y="34" textAnchor="middle">
            {value}
          </text>
        </g>
      ))}
      <circle className="ruler-end-dot" cx={xFor(length)} cy="102" r="6" />
      <text className="visual-label" x="140" y="132" textAnchor="middle">
        {length} {unit}
      </text>
    </svg>
  );
}

function LineTypeVisual({ kind }: { kind: "segment" | "ray" | "line" }) {
  return (
    <svg viewBox="0 0 280 150">
      <defs>
        <marker id="line-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
          <path className="line-arrow" d="M0,0 L10,5 L0,10 z" />
        </marker>
      </defs>
      <line
        className="line-type-main"
        x1="54"
        y1="72"
        x2="226"
        y2="72"
        markerStart={kind === "line" ? "url(#line-arrow)" : undefined}
        markerEnd={kind === "ray" || kind === "line" ? "url(#line-arrow)" : undefined}
      />
      {(kind === "segment" || kind === "ray") && <circle className="line-endpoint" cx="54" cy="72" r="7" />}
      {kind === "segment" && <circle className="line-endpoint" cx="226" cy="72" r="7" />}
      <text className="visual-label" x="140" y="126" textAnchor="middle">
        {kind === "segment" ? "선분" : kind === "ray" ? "반직선" : "직선"}
      </text>
    </svg>
  );
}

function RightAngleMarker({ x, y }: { x: number; y: number }) {
  return <path className="right-angle-marker" d={`M${x} ${y - 22}v22h22`} />;
}

function RightAngleVisual({ shape }: { shape: "angle" | "triangle" | "rectangle" | "square" }) {
  if (shape === "angle") {
    return (
      <svg viewBox="0 0 280 170">
        <line className="angle-ray" x1="80" y1="126" x2="80" y2="40" />
        <line className="angle-ray" x1="80" y1="126" x2="190" y2="126" />
        <RightAngleMarker x={80} y={126} />
        <text className="visual-label" x="150" y="150" textAnchor="middle">직각</text>
      </svg>
    );
  }

  const node =
    shape === "triangle" ? (
      <polygon className="visual-shape" points="74,126 204,126 74,38" />
    ) : shape === "rectangle" ? (
      <rect className="visual-shape" x="58" y="48" width="164" height="86" rx="6" />
    ) : (
      <rect className="visual-shape" x="82" y="38" width="108" height="108" rx="6" />
    );
  const marker = shape === "triangle" ? { x: 74, y: 126 } : shape === "rectangle" ? { x: 58, y: 134 } : { x: 82, y: 146 };

  return (
    <svg viewBox="0 0 280 170">
      {node}
      <RightAngleMarker x={marker.x} y={marker.y} />
      <text className="visual-label" x="140" y="160" textAnchor="middle">
        {shape === "triangle" ? "직각삼각형" : shape === "rectangle" ? "직사각형" : "정사각형"}
      </text>
    </svg>
  );
}

function ObjectArrayVisual({
  rows,
  cols,
  unit = "개",
  showTotalLabel = true,
}: {
  rows: number;
  cols: number;
  unit?: string;
  showTotalLabel?: boolean;
}) {
  const gap = Math.min(24, 190 / Math.max(1, cols), 112 / Math.max(1, rows));
  const radius = Math.max(4, Math.min(8, gap * 0.28));
  const startX = 140 - ((cols - 1) * gap) / 2;
  const startY = 70 - ((rows - 1) * gap) / 2;

  return (
    <svg viewBox="0 0 280 170">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((__, col) => (
          <circle key={`${row}-${col}`} className="array-dot" cx={startX + col * gap} cy={startY + row * gap} r={radius} />
        )),
      )}
      {showTotalLabel && (
        <text className="visual-label" x="140" y="146" textAnchor="middle">
          {cols}{unit}씩 {rows}줄 = {rows * cols}{unit}
        </text>
      )}
    </svg>
  );
}

function TenFrameVisual({
  filled,
  total = 10,
  splitAt,
  showCountLabel = true,
}: {
  filled: number;
  total?: 10 | 20;
  splitAt?: number;
  showCountLabel?: boolean;
}) {
  const cols = 5;
  const rows = total / cols;
  const cell = 34;
  const gap = 7;
  const width = cols * cell + (cols - 1) * gap;
  const startX = 140 - width / 2;
  const startY = rows === 2 ? 36 : 18;
  const clampedFilled = Math.max(0, Math.min(total, filled));

  return (
    <svg viewBox="0 0 280 180">
      {Array.from({ length: total }).map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const isFilled = index < clampedFilled;
        const isSecondPart = splitAt !== undefined && index >= splitAt && index < clampedFilled;
        return (
          <g key={index}>
            <rect className="ten-frame-cell" x={startX + col * (cell + gap)} y={startY + row * (cell + gap)} width={cell} height={cell} rx="7" />
            {isFilled && (
              <circle
                className={isSecondPart ? "ten-frame-counter second" : "ten-frame-counter"}
                cx={startX + col * (cell + gap) + cell / 2}
                cy={startY + row * (cell + gap) + cell / 2}
                r="11"
              />
            )}
          </g>
        );
      })}
      {total === 20 && <line className="visual-guide" x1="34" y1={startY + 2 * (cell + gap) - gap / 2} x2="246" y2={startY + 2 * (cell + gap) - gap / 2} />}
      {showCountLabel && (
        <text className="visual-label" x="140" y="164" textAnchor="middle">
          {clampedFilled} / {total}
        </text>
      )}
    </svg>
  );
}

function NumberBondVisual({ total, left, right }: { total: number | string; left: number | string; right: number | string }) {
  return (
    <svg viewBox="0 0 280 180">
      <line className="number-bond-line" x1="140" y1="72" x2="92" y2="122" />
      <line className="number-bond-line" x1="140" y1="72" x2="188" y2="122" />
      <circle className="number-bond-total" cx="140" cy="56" r="34" />
      <circle className="number-bond-part" cx="82" cy="134" r="31" />
      <circle className="number-bond-part second" cx="198" cy="134" r="31" />
      <text className="number-bond-text" x="140" y="65" textAnchor="middle">
        {total}
      </text>
      <text className="number-bond-text" x="82" y="143" textAnchor="middle">
        {left}
      </text>
      <text className="number-bond-text" x="198" y="143" textAnchor="middle">
        {right}
      </text>
    </svg>
  );
}

function PlaceValueBlocks({ tens, ones, showTotal = true }: { tens: number; ones: number; showTotal?: boolean }) {
  const rods = Array.from({ length: tens });
  const dots = Array.from({ length: ones });
  const rodWidth = Math.min(16, 152 / Math.max(1, tens));
  const rodGap = Math.max(4, (156 - rods.length * rodWidth) / Math.max(1, rods.length + 1));
  const total = tens * 10 + ones;

  return (
    <svg viewBox="0 0 300 190">
      <text className="chart-label" x="78" y="28" textAnchor="middle">10묶음</text>
      <text className="chart-label" x="224" y="28" textAnchor="middle">낱개</text>
      <g transform="translate(20 42)">
        {rods.map((_, index) => (
          <g key={index} transform={`translate(${rodGap + index * (rodWidth + rodGap)} 0)`}>
            <rect className="place-value-rod" x="0" y="0" width={rodWidth} height="96" rx="5" />
            {Array.from({ length: 10 }).map((__, tick) => (
              <line key={tick} className="place-value-rod-tick" x1="0" x2={rodWidth} y1={9.6 * tick} y2={9.6 * tick} />
            ))}
          </g>
        ))}
      </g>
      <g transform="translate(190 48)">
        {dots.map((_, index) => (
          <rect key={index} className="place-value-one" x={(index % 3) * 25} y={Math.floor(index / 3) * 25} width="18" height="18" rx="5" />
        ))}
      </g>
      {showTotal && (
        <text className="visual-label" x="150" y="170" textAnchor="middle">
          {tens}십 + {ones}일 = {total}
        </text>
      )}
    </svg>
  );
}

function BaseTenBlocks({ hundreds, tens, ones, showTotal = true }: { hundreds: number; tens: number; ones: number; showTotal?: boolean }) {
  const flats = Array.from({ length: Math.min(hundreds, 9) });
  const rods = Array.from({ length: Math.min(tens, 9) });
  const dots = Array.from({ length: Math.min(ones, 9) });
  const total = hundreds * 100 + tens * 10 + ones;

  return (
    <svg viewBox="0 0 320 200">
      <text className="chart-label" x="58" y="24" textAnchor="middle">100</text>
      <text className="chart-label" x="164" y="24" textAnchor="middle">10</text>
      <text className="chart-label" x="264" y="24" textAnchor="middle">1</text>
      <g transform="translate(18 38)">
        {flats.map((_, index) => (
          <g key={index} transform={`translate(${(index % 3) * 30} ${Math.floor(index / 3) * 30})`}>
            <rect className="base-ten-flat" x="0" y="0" width="24" height="24" rx="4" />
            <line className="base-ten-flat-line" x1="8" x2="8" y1="0" y2="24" />
            <line className="base-ten-flat-line" x1="16" x2="16" y1="0" y2="24" />
            <line className="base-ten-flat-line" x1="0" x2="24" y1="8" y2="8" />
            <line className="base-ten-flat-line" x1="0" x2="24" y1="16" y2="16" />
          </g>
        ))}
      </g>
      <g transform="translate(128 38)">
        {rods.map((_, index) => (
          <g key={index} transform={`translate(${(index % 5) * 13} ${Math.floor(index / 5) * 62})`}>
            <rect className="base-ten-rod" x="0" y="0" width="9" height="54" rx="3" />
            {Array.from({ length: 5 }).map((__, tick) => (
              <line key={tick} className="base-ten-rod-line" x1="0" x2="9" y1={(tick + 1) * 9} y2={(tick + 1) * 9} />
            ))}
          </g>
        ))}
      </g>
      <g transform="translate(236 42)">
        {dots.map((_, index) => (
          <rect key={index} className="base-ten-one" x={(index % 3) * 22} y={Math.floor(index / 3) * 22} width="15" height="15" rx="4" />
        ))}
      </g>
      {showTotal && (
        <text className="visual-label" x="160" y="180" textAnchor="middle">
          {hundreds}백 + {tens}십 + {ones}일 = {total}
        </text>
      )}
    </svg>
  );
}

function NumberLineVisual({ values, missingIndex }: { values: number[]; missingIndex?: number }) {
  const count = Math.max(2, values.length);
  const xFor = (index: number) => 36 + (index * 208) / (count - 1);

  return (
    <svg viewBox="0 0 280 150">
      <line className="number-line-axis" x1="28" y1="74" x2="252" y2="74" />
      {values.map((value, index) => (
        <g key={`${value}-${index}`}>
          <line className="number-line-tick" x1={xFor(index)} y1="58" x2={xFor(index)} y2="90" />
          {missingIndex === index ? (
            <rect className="number-line-missing" x={xFor(index) - 18} y="98" width="36" height="28" rx="7" />
          ) : (
            <text className="number-line-label" x={xFor(index)} y="120" textAnchor="middle">
              {value}
            </text>
          )}
        </g>
      ))}
      <text className="visual-label" x="140" y="32" textAnchor="middle">
        수직선으로 순서 확인
      </text>
    </svg>
  );
}

function RangeLineVisual({
  start,
  end,
  leftInclusive,
  rightInclusive,
}: {
  start: number;
  end: number;
  leftInclusive: boolean;
  rightInclusive: boolean;
}) {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  const span = Math.max(4, high - low + 2);
  const marks = Array.from({ length: 5 }, (_, index) => Math.round(low - 1 + (index * span) / 4));
  const xFor = (value: number) => 32 + ((value - (low - 1)) / span) * 216;
  const leftX = xFor(start);
  const rightX = xFor(end);

  return (
    <svg viewBox="0 0 280 150">
      <line className="number-line-axis" x1="28" y1="74" x2="252" y2="74" />
      <line className="ruler-highlight" x1={leftX} y1="74" x2={rightX} y2="74" />
      {marks.map((value) => (
        <g key={value}>
          <line className="number-line-tick" x1={xFor(value)} y1="60" x2={xFor(value)} y2="88" />
          <text className="number-line-label" x={xFor(value)} y="120" textAnchor="middle">
            {value}
          </text>
        </g>
      ))}
      <circle className={leftInclusive ? "coord-point" : "coord-reflected"} cx={leftX} cy="74" r="7" />
      <circle className={rightInclusive ? "coord-point" : "coord-reflected"} cx={rightX} cy="74" r="7" />
      <text className="visual-label" x="140" y="32" textAnchor="middle">
        {leftInclusive ? "이상" : "초과"} · {rightInclusive ? "이하" : "미만"}
      </text>
    </svg>
  );
}

function ParallelLinesVisual({ mode }: { mode: "parallel" | "perpendicular" | "distance" }) {
  if (mode === "perpendicular") {
    return (
      <svg viewBox="0 0 280 160">
        <line className="angle-ray" x1="52" y1="96" x2="228" y2="96" />
        <line className="angle-ray" x1="128" y1="28" x2="128" y2="136" />
        <RightAngleMarker x={128} y={96} />
        <text className="visual-label" x="158" y="132" textAnchor="middle">수직</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 280 160">
      <line className="line-type-main" x1="46" y1="56" x2="234" y2="56" />
      <line className="line-type-main" x1="46" y1="112" x2="234" y2="112" />
      {mode === "distance" && (
        <>
          <line className="visual-guide" x1="144" y1="56" x2="144" y2="112" />
          <RightAngleMarker x={144} y={112} />
          <text className="visual-label" x="178" y="90" textAnchor="middle">거리</text>
        </>
      )}
      <text className="visual-label" x="140" y="146" textAnchor="middle">
        {mode === "distance" ? "평행선 사이의 거리는 일정" : "평행"}
      </text>
    </svg>
  );
}

function QuadrilateralDiagram({ kind }: { kind: "trapezoid" | "parallelogram" | "rhombus" | "rectangle" | "square" }) {
  const node =
    kind === "trapezoid" ? (
      <polygon className="visual-shape" points="88,42 188,42 226,124 52,124" />
    ) : kind === "parallelogram" ? (
      <polygon className="visual-shape" points="78,44 218,44 186,124 46,124" />
    ) : kind === "rhombus" ? (
      <polygon className="visual-shape" points="140,30 224,84 140,138 56,84" />
    ) : kind === "square" ? (
      <rect className="visual-shape" x="88" y="36" width="104" height="104" rx="6" />
    ) : (
      <rect className="visual-shape" x="58" y="48" width="164" height="86" rx="6" />
    );
  const labelText =
    kind === "trapezoid" ? "사다리꼴" : kind === "parallelogram" ? "평행사변형" : kind === "rhombus" ? "마름모" : kind === "square" ? "정사각형" : "직사각형";

  return (
    <svg viewBox="0 0 280 170">
      {node}
      {(kind === "trapezoid" || kind === "parallelogram") && (
        <>
          <line className="visual-guide" x1="88" y1="34" x2="188" y2="34" />
          <line className="visual-guide" x1={kind === "trapezoid" ? "52" : "46"} y1="132" x2={kind === "trapezoid" ? "226" : "186"} y2="132" />
        </>
      )}
      {(kind === "rectangle" || kind === "square") && <RightAngleMarker x={kind === "square" ? 88 : 58} y={kind === "square" ? 140 : 134} />}
      <text className="visual-label" x="140" y="160" textAnchor="middle">
        {labelText}
      </text>
    </svg>
  );
}

function PolygonDiagram({ sides, regular = false, showDiagonal = false }: { sides: number; regular?: boolean; showDiagonal?: boolean }) {
  const safeSides = Math.max(3, Math.min(10, Math.round(sides)));
  const center = { x: 140, y: 86 };
  const radius = 56;
  const points = Array.from({ length: safeSides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeSides;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
  const pointText = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const names: Record<number, string> = { 3: "삼각형", 4: "사각형", 5: "오각형", 6: "육각형", 7: "칠각형", 8: "팔각형", 9: "구각형", 10: "십각형" };
  const diagonalEnd = points[Math.min(2, safeSides - 1)]!;

  return (
    <svg viewBox="0 0 280 170">
      <polygon className="visual-shape" points={pointText} />
      {showDiagonal && <line className="visual-guide" x1={points[0]!.x} y1={points[0]!.y} x2={diagonalEnd.x} y2={diagonalEnd.y} />}
      <text className="visual-label" x="140" y="154" textAnchor="middle">
        {regular ? `정${names[safeSides] ?? `${safeSides}각형`}` : names[safeSides] ?? `${safeSides}각형`}
        {showDiagonal ? " · 대각선" : ""}
      </text>
    </svg>
  );
}

function PatternSymbol({ item, x }: { item: string; x: number }) {
  if (item === "?") {
    return (
      <g transform={`translate(${x} 76)`}>
        <rect className="pattern-placeholder" x="-20" y="-20" width="40" height="40" rx="8" />
        <text className="pattern-question" x="0" y="8" textAnchor="middle">?</text>
      </g>
    );
  }
  if (item === "△") return <polygon className="pattern-triangle" points={`${x},48 ${x + 26},98 ${x - 26},98`} />;
  if (item === "○") return <circle className="pattern-circle" cx={x} cy="76" r="25" />;
  if (item === "□") return <rect className="pattern-square" x={x - 24} y="52" width="48" height="48" rx="7" />;

  const colorClass = item === "빨강" ? "red" : item === "파랑" ? "blue" : "yellow";
  return (
    <g transform={`translate(${x} 76)`}>
      <circle className={`pattern-color ${colorClass}`} r="25" />
      <text className="pattern-label" x="0" y="7" textAnchor="middle">{item}</text>
    </g>
  );
}

function ShapePatternVisual({ items }: { items: string[] }) {
  const gap = Math.min(48, 232 / Math.max(1, items.length - 1));
  const startX = 140 - ((items.length - 1) * gap) / 2;

  return (
    <svg viewBox="0 0 280 150">
      {items.map((item, index) => (
        <PatternSymbol key={`${item}-${index}`} item={item} x={startX + index * gap} />
      ))}
      <text className="visual-label" x="140" y="132" textAnchor="middle">반복 규칙을 찾기</text>
    </svg>
  );
}

function FractionStrip({
  numerator,
  denominator,
  divisorNumerator,
}: {
  numerator: number;
  denominator: number;
  divisorNumerator?: number;
}) {
  const cells = Math.min(denominator, 24);
  const cellWidth = 220 / cells;
  const shaded = Math.min(numerator, denominator);

  return (
    <svg viewBox="0 0 300 170">
      <g transform="translate(40 46)">
        {Array.from({ length: cells }).map((_, index) => (
          <rect
            key={index}
            className={index < shaded ? "fraction-cell shaded" : "fraction-cell"}
            x={index * cellWidth}
            y="0"
            width={cellWidth}
            height="48"
            rx={index === 0 || index === cells - 1 ? 5 : 0}
          />
        ))}
        {divisorNumerator && divisorNumerator > 0 && (
          <>
            {Array.from({ length: Math.floor(shaded / divisorNumerator) }).map((_, index) => (
              <line key={`cut-${index}`} className="fraction-cut-line" x1={(index + 1) * divisorNumerator * cellWidth} y1="-8" x2={(index + 1) * divisorNumerator * cellWidth} y2="56" />
            ))}
            <text className="chart-reference-label" x="110" y="84" textAnchor="middle">
              {divisorNumerator}/{denominator}씩 묶기
            </text>
          </>
        )}
      </g>
      <text className="chart-label" x="40" y="122" textAnchor="middle">
        0
      </text>
      <text className="chart-label" x="260" y="122" textAnchor="middle">
        1
      </text>
      <text className="visual-label" x="150" y="150" textAnchor="middle">
        {numerator}/{denominator}
      </text>
    </svg>
  );
}

function CoordinatePlane({ point, axis, reflected }: { point: [number, number]; axis: "x" | "y"; reflected?: [number, number] }) {
  const scale = 11;
  const origin = { x: 140, y: 92 };
  const toScreen = ([x, y]: [number, number]) => ({ x: origin.x + x * scale, y: origin.y - y * scale });
  const p = toScreen(point);
  const r = reflected ? toScreen(reflected) : undefined;

  return (
    <svg viewBox="0 0 280 190">
      {Array.from({ length: 17 }, (_, index) => index - 8).map((tick) => (
        <g key={tick}>
          <line className="coord-grid" x1={origin.x + tick * scale} y1="4" x2={origin.x + tick * scale} y2="180" />
          <line className="coord-grid" x1="4" y1={origin.y - tick * scale} x2="276" y2={origin.y - tick * scale} />
        </g>
      ))}
      <line className="coord-axis" x1="4" y1={origin.y} x2="276" y2={origin.y} />
      <line className="coord-axis" x1={origin.x} y1="4" x2={origin.x} y2="180" />
      <line
        className="coord-symmetry"
        x1={axis === "y" ? origin.x : 4}
        y1={axis === "y" ? 4 : origin.y}
        x2={axis === "y" ? origin.x : 276}
        y2={axis === "y" ? 180 : origin.y}
      />
      <circle className="coord-point" cx={p.x} cy={p.y} r="6" />
      <text className="coord-label" x={p.x + 12} y={p.y - 8}>
        ({point[0]}, {point[1]})
      </text>
      {r && (
        <>
          <circle className="coord-reflected" cx={r.x} cy={r.y} r="6" />
          <text className="coord-label" x={r.x + 12} y={r.y + 14}>
            ({reflected![0]}, {reflected![1]})
          </text>
        </>
      )}
    </svg>
  );
}

function ProbabilityBag({ red, blue }: { red: number; blue: number }) {
  const balls = [
    ...Array.from({ length: red }, (_, index) => ({ color: "red", index })),
    ...Array.from({ length: blue }, (_, index) => ({ color: "blue", index })),
  ];
  const visible = balls.slice(0, 18);

  return (
    <svg viewBox="0 0 280 180">
      <path className="bag-shape" d="M72 62c20-26 116-26 136 0l-14 86c-4 18-104 18-108 0z" />
      <path className="bag-neck" d="M104 50c18 10 54 10 72 0" />
      {visible.map((ball, index) => {
        const x = 98 + (index % 6) * 17;
        const y = 86 + Math.floor(index / 6) * 20;
        return <circle key={`${ball.color}-${ball.index}`} className={`prob-ball ${ball.color}`} cx={x} cy={y} r="7" />;
      })}
      <text className="chart-label" x="92" y="166">
        빨간 공 {red}개
      </text>
      <text className="chart-label" x="190" y="166">
        파란 공 {blue}개
      </text>
    </svg>
  );
}

function CoinChance() {
  return (
    <svg viewBox="0 0 280 180">
      <circle className="coin-face front" cx="112" cy="90" r="44" />
      <circle className="coin-face back" cx="168" cy="90" r="44" />
      <text className="coin-label" x="112" y="99" textAnchor="middle">
        앞
      </text>
      <text className="coin-label" x="168" y="99" textAnchor="middle">
        뒤
      </text>
      <line className="chart-reference" x1="140" y1="38" x2="140" y2="142" />
      <text className="chart-reference-label" x="140" y="160" textAnchor="middle">
        1 : 1
      </text>
    </svg>
  );
}

function CongruentTriangles({
  sides,
  angles,
  target,
  unit = "cm",
}: {
  sides?: [number, number, number];
  angles?: [number, number, number];
  target: string;
  unit?: string;
}) {
  const labels = sides
    ? [`AB ${label(sides[0], unit)}`, `BC ${label(sides[1], unit)}`, `CA ${label(sides[2], unit)}`]
    : [`A ${angles?.[0]}°`, `B ${angles?.[1]}°`, `C ${angles?.[2]}°`];

  return (
    <svg viewBox="0 0 300 190">
      <polygon className="visual-shape" points="44,132 132,132 86,42" />
      <polygon className="visual-shape twin" points="170,132 258,132 212,42" />
      <text className="visual-label" x="86" y="36" textAnchor="middle">A</text>
      <text className="visual-label" x="36" y="145" textAnchor="middle">B</text>
      <text className="visual-label" x="140" y="145" textAnchor="middle">C</text>
      <text className="visual-label" x="212" y="36" textAnchor="middle">D</text>
      <text className="visual-label" x="162" y="145" textAnchor="middle">E</text>
      <text className="visual-label" x="266" y="145" textAnchor="middle">F</text>
      <text className="chart-label" x="88" y="158" textAnchor="middle">{labels[0]}</text>
      <text className="chart-label" x="86" y="176" textAnchor="middle">{labels[1]}</text>
      <text className="chart-label" x="88" y="20" textAnchor="middle">{labels[2]}</text>
      <path className="congruent-arrow" d="M140 88h24" />
      <text className="chart-reference-label" x="150" y="78" textAnchor="middle">합동</text>
      <text className="chart-reference-label" x="212" y="166" textAnchor="middle">구할 값: {target}</text>
    </svg>
  );
}

function SymmetryShape({ shape }: { shape: "square" | "rectangle" | "equilateral-triangle" | "isosceles-triangle" | "parallelogram" }) {
  const shapeNode =
    shape === "square" ? (
      <rect className="visual-shape" x="88" y="36" width="104" height="104" rx="6" />
    ) : shape === "rectangle" ? (
      <rect className="visual-shape" x="62" y="54" width="156" height="78" rx="6" />
    ) : shape === "equilateral-triangle" ? (
      <polygon className="visual-shape" points="140,28 222,142 58,142" />
    ) : shape === "isosceles-triangle" ? (
      <polygon className="visual-shape" points="140,30 210,142 70,142" />
    ) : (
      <polygon className="visual-shape" points="92,48 220,48 188,136 60,136" />
    );

  return (
    <svg viewBox="0 0 280 180">
      {shapeNode}
      <text className="chart-reference-label" x="140" y="164" textAnchor="middle">
        대칭축의 개수를 생각하세요
      </text>
    </svg>
  );
}

function Rotation180() {
  return (
    <svg viewBox="0 0 280 180">
      <circle className="coord-reflected" cx="140" cy="90" r="6" />
      <path className="rotation-path" d="M92 90a48 48 0 1 1 96 0" />
      <path className="rotation-tip" d="M188 90l-12-7 2 14z" />
      <polygon className="visual-shape" points="82,126 126,126 112,78 68,78" />
      <polygon className="visual-shape twin" points="198,54 154,54 168,102 212,102" />
      <text className="chart-reference-label" x="140" y="156" textAnchor="middle">180° 회전</text>
    </svg>
  );
}

function CubeStack({ cols, rows, layers }: { cols: number; rows: number; layers: number }) {
  const blocks = [];
  const size = 18;
  for (let z = 0; z < layers; z++) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        blocks.push(
          <g key={`${x}-${y}-${z}`} transform={`translate(${100 + x * size - y * 8}, ${122 - z * 15 + y * 11})`}>
            <polygon className="cube-top" points={`0,0 ${size},-8 ${size * 2},0 ${size},8`} />
            <polygon className="cube-left" points={`0,0 ${size},8 ${size},${size + 8} 0,${size}`} />
            <polygon className="cube-right" points={`${size},8 ${size * 2},0 ${size * 2},${size} ${size},${size + 8}`} />
          </g>,
        );
      }
    }
  }
  return <>{blocks}</>;
}

function SolidShape({
  kind,
  title,
  height,
  radius,
  unit = "cm",
}: {
  kind: "prism" | "pyramid" | "cylinder" | "cone" | "sphere";
  title?: string;
  height?: number | string;
  radius?: number | string;
  unit?: string;
}) {
  const heightText = height !== undefined ? label(height, unit) : undefined;
  const radiusText = radius !== undefined ? label(radius, unit) : undefined;

  if (kind === "prism") {
    return (
      <svg viewBox="0 0 280 190">
        <polygon className="cuboid-top" points="82,52 152,28 216,70 146,96" />
        <polygon className="cuboid-front" points="82,52 146,96 146,150 82,108" />
        <polygon className="cuboid-side" points="146,96 216,70 216,124 146,150" />
        <path className="visual-guide" d="M82 52v56M152 28v54M216 70v54" />
        <text className="visual-label" x="150" y="174" textAnchor="middle">{title ?? "각기둥"}</text>
        <text className="chart-reference-label" x="150" y="20" textAnchor="middle">합동인 두 밑면</text>
      </svg>
    );
  }

  if (kind === "pyramid") {
    return (
      <svg viewBox="0 0 280 190">
        <polygon className="visual-shape" points="78,132 146,72 218,132 142,164" />
        <polygon className="cuboid-side" points="146,72 218,132 142,164" />
        <path className="visual-guide" d="M146 72 78 132M146 72 142 164M146 72 218 132" />
        <text className="visual-label" x="146" y="58" textAnchor="middle">꼭짓점</text>
        <text className="chart-reference-label" x="146" y="178" textAnchor="middle">{title ?? "각뿔"}</text>
      </svg>
    );
  }

  if (kind === "cylinder") {
    return (
      <svg viewBox="0 0 280 190">
        <ellipse className="circle-diagram-fill" cx="140" cy="56" rx="66" ry="20" />
        <path className="visual-shape" d="M74 56v78c0 11 30 20 66 20s66-9 66-20V56" />
        <ellipse className="visual-guide" cx="140" cy="134" rx="66" ry="20" />
        {heightText && <DimensionLabel x={58} y={96} text={`높이 ${heightText}`} />}
        {radiusText && <DimensionLabel x={172} y={58} text={`반지름 ${radiusText}`} />}
        <text className="chart-reference-label" x="140" y="176" textAnchor="middle">{title ?? "원기둥"}</text>
      </svg>
    );
  }

  if (kind === "cone") {
    return (
      <svg viewBox="0 0 280 190">
        <path className="visual-shape" d="M140 36 74 136c0 12 30 22 66 22s66-10 66-22z" />
        <ellipse className="visual-guide" cx="140" cy="136" rx="66" ry="20" />
        <line className="visual-guide" x1="140" y1="36" x2="140" y2="136" />
        {heightText && <DimensionLabel x={164} y={88} text={`높이 ${heightText}`} />}
        {radiusText && <DimensionLabel x={164} y={142} text={`반지름 ${radiusText}`} />}
        <text className="chart-reference-label" x="140" y="178" textAnchor="middle">{title ?? "원뿔"}</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 280 190">
      <circle className="circle-diagram-fill" cx="140" cy="94" r="62" />
      <ellipse className="visual-guide" cx="140" cy="94" rx="62" ry="18" />
      <path className="visual-guide" d="M82 94c14-44 102-44 116 0M82 94c14 44 102 44 116 0" />
      {radiusText && <DimensionLabel x={178} y={96} text={`반지름 ${radiusText}`} />}
      <text className="chart-reference-label" x="140" y="176" textAnchor="middle">{title ?? "구"}</text>
    </svg>
  );
}

function NetDiagram({ kind, sides = 4, label: labelText }: { kind: "prism" | "pyramid" | "cylinder"; sides?: number; label?: string }) {
  if (kind === "cylinder") {
    return (
      <div className="net-diagram net-cylinder" aria-label="원기둥 전개도">
        <div className="net-face net-circle net-fold-top">윗면</div>
        <div className="net-face net-rect net-fold-side">옆면</div>
        <div className="net-face net-circle net-fold-bottom">아랫면</div>
        {labelText && <span className="net-label">{labelText}</span>}
      </div>
    );
  }

  if (kind === "pyramid") {
    return (
      <div className="net-diagram net-pyramid" aria-label={`${sides}각뿔 전개도`}>
        <div className="net-face net-tri net-fold-top">삼각형</div>
        <div className="net-pyramid-row">
          <div className="net-face net-tri net-fold-left">삼각형</div>
          <div className="net-face net-base net-fold-center">밑면</div>
          <div className="net-face net-tri net-fold-right">삼각형</div>
        </div>
        <div className="net-face net-tri net-fold-bottom">삼각형</div>
        {labelText && <span className="net-label">{labelText}</span>}
      </div>
    );
  }

  return (
    <div className="net-diagram net-prism" aria-label={`${sides}각기둥 전개도`}>
      <div className="net-face net-base net-fold-top">윗면</div>
      <div className="net-prism-row">
        <div className="net-face net-side net-fold-left">옆면</div>
        <div className="net-face net-side net-fold-front">앞면</div>
        <div className="net-face net-side net-fold-right">옆면</div>
        <div className="net-face net-side net-fold-back">뒷면</div>
      </div>
      <div className="net-face net-base net-fold-bottom">아랫면</div>
      {labelText && <span className="net-label">{labelText}</span>}
    </div>
  );
}

export default function MathVisual({ visual }: Props) {
  const unit = "unit" in visual ? visual.unit ?? "cm" : "개";

  if (visual.type === "rectangle") {
    return (
      <figure className="math-visual" aria-label="직사각형 도형">
        <svg viewBox="0 0 260 170">
          <rect className="visual-shape" x="52" y="36" width="156" height="88" rx="6" />
          <DimensionLabel x={130} y={150} text={label(visual.width, unit)} />
          <DimensionLabel x={28} y={86} text={label(visual.height, unit)} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "square") {
    return (
      <figure className="math-visual" aria-label="정사각형 도형">
        <svg viewBox="0 0 260 170">
          <rect className="visual-shape" x="72" y="28" width="116" height="116" rx="6" />
          <DimensionLabel x={130} y={162} text={label(visual.side, unit)} />
          <DimensionLabel x={40} y={88} text={label(visual.side, unit)} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "parallelogram") {
    return (
      <figure className="math-visual" aria-label="평행사변형 도형">
        <svg viewBox="0 0 260 170">
          <polygon className="visual-shape" points="74,42 210,42 184,128 48,128" />
          <line className="visual-guide" x1="184" y1="42" x2="184" y2="128" />
          <DimensionLabel x={116} y={152} text={label(visual.base, unit)} />
          <DimensionLabel x={206} y={88} text={label(visual.height, unit)} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "triangle") {
    return (
      <figure className="math-visual" aria-label="삼각형 도형">
        <svg viewBox="0 0 260 170">
          <polygon className="visual-shape" points="50,132 210,132 136,34" />
          <line className="visual-guide" x1="136" y1="34" x2="136" y2="132" />
          <DimensionLabel x={130} y={154} text={label(visual.base, unit)} />
          <DimensionLabel x={158} y={84} text={label(visual.height, unit)} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "trapezoid") {
    return (
      <figure className="math-visual" aria-label="사다리꼴 도형">
        <svg viewBox="0 0 260 170">
          <polygon className="visual-shape" points="86,42 174,42 216,130 42,130" />
          <line className="visual-guide" x1="174" y1="42" x2="174" y2="130" />
          <DimensionLabel x={130} y={32} text={label(visual.top, unit)} />
          <DimensionLabel x={130} y={154} text={label(visual.bottom, unit)} />
          <DimensionLabel x={198} y={88} text={label(visual.height, unit)} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "composite-rect") {
    return (
      <figure className="math-visual" aria-label="잘라 낸 직사각형 도형">
        <svg viewBox="0 0 260 170">
          <path className="visual-shape" d="M48 32h164v104h-76V82H48z" />
          <rect className="visual-cut" x="136" y="82" width="76" height="54" rx="3" />
          <DimensionLabel x={130} y={156} text={`큰 ${label(visual.width, unit)} × ${label(visual.height, unit)}`} />
          <DimensionLabel x={174} y={76} text={`뺀 ${label(visual.cutWidth, unit)} × ${label(visual.cutHeight, unit)}`} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "cuboid") {
    return (
      <figure className="math-visual" aria-label="직육면체 도형">
        <svg viewBox="0 0 260 180">
          <polygon className="cuboid-top" points="72,48 158,28 212,62 126,82" />
          <polygon className="cuboid-side" points="126,82 212,62 212,128 126,150" />
          <polygon className="cuboid-front" points="72,48 126,82 126,150 72,116" />
          <DimensionLabel x={100} y={160} text={label(visual.width, unit)} />
          <DimensionLabel x={182} y={150} text={label(visual.depth, unit)} />
          <DimensionLabel x={50} y={88} text={label(visual.height, unit)} />
        </svg>
      </figure>
    );
  }

  if (visual.type === "solid-shape") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.label ?? "입체도형 벡터 그림"}>
        <SolidShape kind={visual.kind} title={visual.label} height={visual.height} radius={visual.radius} unit={visual.unit} />
      </figure>
    );
  }

  if (visual.type === "net-diagram") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.label ?? "전개도 그림"}>
        <NetDiagram kind={visual.kind} sides={visual.sides} label={visual.label} />
      </figure>
    );
  }

  if (visual.type === "clock") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "시계 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <ClockVisual hour={visual.hour} minute={visual.minute} />
      </figure>
    );
  }

  if (visual.type === "ruler") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "자 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <RulerVisual length={visual.length} unit={visual.unit} max={visual.max} />
      </figure>
    );
  }

  if (visual.type === "line-type") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "선의 종류 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <LineTypeVisual kind={visual.kind} />
      </figure>
    );
  }

  if (visual.type === "right-angle") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "직각과 도형 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <RightAngleVisual shape={visual.shape} />
      </figure>
    );
  }

  if (visual.type === "ten-frame") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "10칸틀 수 모형"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <TenFrameVisual filled={visual.filled} total={visual.total} splitAt={visual.splitAt} showCountLabel={visual.showCountLabel} />
      </figure>
    );
  }

  if (visual.type === "number-bond") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "수 가르기 모형"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <NumberBondVisual total={visual.total} left={visual.left} right={visual.right} />
      </figure>
    );
  }

  if (visual.type === "place-value-blocks") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "자리값 블록"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <PlaceValueBlocks tens={visual.tens} ones={visual.ones} showTotal={visual.showTotal} />
      </figure>
    );
  }

  if (visual.type === "base-ten-blocks") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "백십일 자리값 블록"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <BaseTenBlocks hundreds={visual.hundreds} tens={visual.tens} ones={visual.ones} showTotal={visual.showTotal} />
      </figure>
    );
  }

  if (visual.type === "number-line") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "수직선"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <NumberLineVisual values={visual.values} missingIndex={visual.missingIndex} />
      </figure>
    );
  }

  if (visual.type === "range-line") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "수의 범위 수직선"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <RangeLineVisual start={visual.start} end={visual.end} leftInclusive={visual.leftInclusive} rightInclusive={visual.rightInclusive} />
      </figure>
    );
  }

  if (visual.type === "object-array") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "배열 곱셈 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <ObjectArrayVisual rows={visual.rows} cols={visual.cols} unit={visual.unit} showTotalLabel={visual.showTotalLabel} />
      </figure>
    );
  }

  if (visual.type === "shape-pattern") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "무늬 규칙 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <ShapePatternVisual items={visual.items} />
      </figure>
    );
  }

  if (visual.type === "data-table") {
    return (
      <figure className="math-visual table-visual" aria-label={visual.caption ?? "자료 표"}>
        <table>
          <thead>
            <tr>
              {visual.headers.map((header, index) => (
                <th key={`${header}-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visual.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`}>
                    <MathText text={String(cell)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visual.caption && <figcaption>{visual.caption}</figcaption>}
      </figure>
    );
  }

  if (visual.type === "bar-chart") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "막대그래프"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <BarChart items={visual.items} unit={visual.unit} referenceValue={visual.referenceValue} showValues={visual.showValues} />
      </figure>
    );
  }

  if (visual.type === "line-chart") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "꺾은선그래프"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <LineChart points={visual.points} unit={visual.unit} referenceValue={visual.referenceValue} />
      </figure>
    );
  }

  if (visual.type === "pictograph") {
    return (
      <figure className="math-visual chart-visual pictograph-visual" aria-label={visual.title ?? "그림그래프"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <Pictograph items={visual.items} bigValue={visual.bigValue} smallValue={visual.smallValue} unit={visual.unit} />
      </figure>
    );
  }

  if (visual.type === "ratio-strip") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "비율 띠 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <RatioStrip leftLabel={visual.leftLabel} rightLabel={visual.rightLabel} left={visual.left} right={visual.right} unit={visual.unit} total={visual.total} />
      </figure>
    );
  }

  if (visual.type === "circle-chart") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "원그래프"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <CircleChart items={visual.items} unit={visual.unit} />
      </figure>
    );
  }

  if (visual.type === "circle-diagram") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "원 도형 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <CircleDiagram mode={visual.mode} radius={visual.radius} diameter={visual.diameter} squareSide={visual.squareSide} unit={visual.unit} />
      </figure>
    );
  }

  if (visual.type === "circle-pattern") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "원 무늬 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <CirclePattern circles={visual.circles} radius={visual.radius} unit={visual.unit} />
      </figure>
    );
  }

  if (visual.type === "angle-diagram") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "각도 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <AngleDiagram degrees={visual.degrees} />
      </figure>
    );
  }

  if (visual.type === "parallel-lines") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "평행선과 수선 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <ParallelLinesVisual mode={visual.mode} />
      </figure>
    );
  }

  if (visual.type === "quadrilateral-diagram") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "사각형 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <QuadrilateralDiagram kind={visual.kind} />
      </figure>
    );
  }

  if (visual.type === "polygon-diagram") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "다각형 벡터 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <PolygonDiagram sides={visual.sides} regular={visual.regular} showDiagonal={visual.showDiagonal} />
      </figure>
    );
  }

  if (visual.type === "fraction-strip") {
    return (
      <figure className="math-visual chart-visual" aria-label={visual.title ?? "분수 막대 그림"}>
        {visual.title && <figcaption>{visual.title}</figcaption>}
        <FractionStrip numerator={visual.numerator} denominator={visual.denominator} divisorNumerator={visual.divisorNumerator} />
      </figure>
    );
  }

  if (visual.type === "probability-bag") {
    return (
      <figure className="math-visual chart-visual" aria-label="확률 주머니 벡터 그림">
        <ProbabilityBag red={visual.red} blue={visual.blue} />
      </figure>
    );
  }

  if (visual.type === "coin-chance") {
    return (
      <figure className="math-visual chart-visual" aria-label="동전 앞뒤 가능성 벡터 그림">
        <CoinChance />
      </figure>
    );
  }

  if (visual.type === "coordinate-plane") {
    return (
      <figure className="math-visual chart-visual" aria-label="좌표평면 그래프">
        <CoordinatePlane point={visual.point} axis={visual.axis} reflected={visual.reflected} />
      </figure>
    );
  }

  if (visual.type === "congruent-triangles") {
    return (
      <figure className="math-visual chart-visual" aria-label="합동 삼각형 벡터 그림">
        <CongruentTriangles sides={visual.sides} angles={visual.angles} target={visual.target} unit={visual.unit} />
      </figure>
    );
  }

  if (visual.type === "symmetry-shape") {
    return (
      <figure className="math-visual chart-visual" aria-label="대칭 도형 벡터 그림">
        <SymmetryShape shape={visual.shape} />
      </figure>
    );
  }

  if (visual.type === "rotation-180") {
    return (
      <figure className="math-visual chart-visual" aria-label="180도 회전 벡터 그림">
        <Rotation180 />
      </figure>
    );
  }

  return (
    <figure className="math-visual cube-stack-visual" aria-label="쌓기나무 도형">
      <svg viewBox="0 0 300 210">
        <CubeStack cols={visual.cols} rows={visual.rows} layers={visual.layers} />
      </svg>
      <figcaption>
        <MathText text={`가로 ${visual.cols}개 × 세로 ${visual.rows}개 × 높이 ${visual.layers}층`} />
      </figcaption>
    </figure>
  );
}
