type Point = { day: string; orders: number; revenueKzt: number };

function formatKzt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} млн`;
  if (n >= 1000) return `${Math.round(n / 1000)} тыс`;
  return String(Math.round(n));
}

function niceTicks(max: number, count: number): number[] {
  if (max <= 0) return [0];
  const rough = max / Math.max(1, count - 1);
  const pow10 = 10 ** Math.floor(Math.log10(rough));
  const nice = rough / pow10;
  const stepBase = nice <= 1 ? 1 : nice <= 2 ? 2 : nice <= 5 ? 5 : 10;
  const step = stepBase * pow10;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.01; v += step) {
    ticks.push(Math.round(v));
    if (ticks.length > 12) break;
  }
  if (ticks[ticks.length - 1] < max) ticks.push(Math.ceil(max / step) * step);
  return ticks;
}

type SubplotProps = {
  points: Point[];
  W: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  title: string;
  titleColor: string;
  stroke: string;
  fill: string;
  /** значение с точки */
  getY: (p: Point) => number;
  maxY: number;
  formatTick: (v: number) => string;
  showXLabels: boolean;
  valueLabel: (p: Point) => string;
};

function LineSubplot({
  points,
  W,
  padL,
  padR,
  padT,
  padB,
  title,
  titleColor,
  stroke,
  fill,
  getY,
  maxY,
  formatTick,
  showXLabels,
  valueLabel,
}: SubplotProps) {
  const innerW = W - padL - padR;
  const innerH = 150;
  const H = padT + innerH + padB;
  const n = points.length;
  const gx = (i: number) => padL + (n === 1 ? innerW / 2 : (i / Math.max(1, n - 1)) * innerW);
  const yScale = (v: number) => padT + innerH - (v / maxY) * innerH;
  const ticks = niceTicks(maxY, 5);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${gx(i).toFixed(1)} ${yScale(getY(p)).toFixed(1)}`)
    .join(" ");

  const tickIndices = n <= 10 ? points.map((_, i) => i) : points.map((_, i) => i).filter((i) => i % Math.ceil(n / 10) === 0 || i === n - 1);

  return (
    <g>
      <text x={padL} y={14} fontSize={13} fontWeight={600} fill={titleColor}>
        {title}
      </text>
      <rect x={padL} y={padT} width={innerW} height={innerH} fill="white" stroke="#e2e8f0" rx={4} />
      <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#94a3b8" strokeWidth={1} />
      <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#94a3b8" strokeWidth={1} />

      {ticks.map((tv) => {
        const y = yScale(tv);
        if (y < padT - 1 || y > padT + innerH + 1) return null;
        return (
          <g key={`grid-${title}-${tv}`}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
              {formatTick(tv)}
            </text>
          </g>
        );
      })}

      <path d={pathD} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={`${title}-${p.day}`}>
          <circle cx={gx(i)} cy={yScale(getY(p))} r={5} fill={fill} stroke="white" strokeWidth={2} />
          {n <= 14 && (
            <text x={gx(i)} y={yScale(getY(p)) - 12} textAnchor="middle" fontSize={10} fill="#334155" fontWeight={600}>
              {valueLabel(p)}
            </text>
          )}
        </g>
      ))}

      {showXLabels &&
        tickIndices.map((i) => {
          const p = points[i];
          return (
            <text key={`x-${p.day}`} x={gx(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="#334155">
              {p.day.slice(5)}
            </text>
          );
        })}
    </g>
  );
}

/**
 * Два отдельных графика по дням (свой масштаб Y), чтобы заказы и выручка не «лепились»
 * на одной сетке и не путались цвета с подписями оси.
 */
export function OrdersDualLineSvg({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return <p style={{ color: "#64748b" }}>Нет данных для графика.</p>;
  }

  const W = 720;
  const padL = 56;
  const padR = 20;
  const padT = 22;
  const padB = 28;
  const between = 32;

  const maxOrders = Math.max(1, ...points.map((p) => p.orders));
  const maxRev = Math.max(1, ...points.map((p) => p.revenueKzt));

  const hTop = padT + 150 + padB;
  const yOffsetBottom = hTop + between;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${yOffsetBottom + padT + 150 + padB + 4}`} width="100%" height={yOffsetBottom + padT + 150 + padB + 4} role="img" aria-label="Заказы и выручка по дням, два графика">
        <rect width={W} height="100%" fill="#fafafa" rx={8} />

        <g transform="translate(0, 0)">
          <LineSubplot
            points={points}
            W={W}
            padL={padL}
            padR={padR}
            padT={padT}
            padB={padB}
            title="Заказы (шт.) — синяя линия"
            titleColor="#1d4ed8"
            stroke="#2563eb"
            fill="#2563eb"
            getY={(p) => p.orders}
            maxY={maxOrders}
            formatTick={(v) => String(v)}
            showXLabels={false}
            valueLabel={(p) => String(p.orders)}
          />
        </g>

        <g transform={`translate(0, ${yOffsetBottom})`}>
          <LineSubplot
            points={points}
            W={W}
            padL={padL}
            padR={padR}
            padT={padT}
            padB={padB}
            title="Выручка (₸) — зелёная линия"
            titleColor="#15803d"
            stroke="#16a34a"
            fill="#16a34a"
            getY={(p) => p.revenueKzt}
            maxY={maxRev}
            formatTick={(v) => (v >= 1000 ? `${formatKzt(v)} ₸` : `${Math.round(v)}`)}
            showXLabels={true}
            valueLabel={(p) => Math.round(p.revenueKzt).toLocaleString("ru-RU")}
          />
        </g>
      </svg>
    </div>
  );
}
