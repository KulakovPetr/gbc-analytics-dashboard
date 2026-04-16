type Point = { day: string; orders: number; revenueKzt: number };

/** Линейный график по дням без внешних библиотек (SVG). */
export function OrdersDualLineSvg({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return <p style={{ color: "#64748b" }}>Нет данных для графика.</p>;
  }

  const W = 720;
  const H = 320;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 52;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxOrders = Math.max(1, ...points.map((p) => p.orders));
  const maxRev = Math.max(1, ...points.map((p) => p.revenueKzt));
  const n = points.length;
  const gx = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yOrders = (v: number) => padT + innerH - (v / maxOrders) * innerH;
  const yRev = (v: number) => padT + innerH - (v / maxRev) * innerH;

  const pathOrders = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${gx(i).toFixed(1)} ${yOrders(p.orders).toFixed(1)}`)
    .join(" ");
  const pathRev = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${gx(i).toFixed(1)} ${yRev(p.revenueKzt).toFixed(1)}`)
    .join(" ");

  const ticks = n <= 8 ? points.map((_, i) => i) : points.map((_, i) => i).filter((i) => i % Math.ceil(n / 8) === 0 || i === n - 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="График заказов и выручки по дням">
        <rect x={0} y={0} width={W} height={H} fill="#fafafa" rx={8} />
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#94a3b8" strokeWidth={1} />
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#94a3b8" strokeWidth={1} />

        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const v = Math.round(maxOrders * t);
          const y = yOrders(v);
          return (
            <g key={`o-${t}`}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {v}
              </text>
            </g>
          );
        })}

        <path d={pathOrders} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathRev} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />

        {points.map((p, i) => (
          <g key={p.day}>
            <circle cx={gx(i)} cy={yOrders(p.orders)} r={4} fill="#2563eb" />
            <circle cx={gx(i)} cy={yRev(p.revenueKzt)} r={4} fill="#16a34a" />
          </g>
        ))}

        {ticks.map((i) => {
          const p = points[i];
          return (
            <text key={`t-${i}`} x={gx(i)} y={H - 18} textAnchor="middle" fontSize={11} fill="#334155">
              {p.day.slice(5)}
            </text>
          );
        })}

        <text x={padL + 8} y={padT + 14} fontSize={12} fill="#2563eb" fontWeight={600}>
          Заказы (шт.)
        </text>
        <text x={padL + 120} y={padT + 14} fontSize={12} fill="#16a34a" fontWeight={600}>
          Выручка (₸)
        </text>
      </svg>
    </div>
  );
}
