type Point = { day: string; orders: number; revenueKzt: number };

/** Гистограмма: число заказов по дням (SVG, без библиотек). */
export function OrdersBarSvg({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return <p style={{ color: "#64748b" }}>Нет данных для гистограммы.</p>;
  }

  const W = 720;
  const H = 280;
  const padL = 48;
  const padR = 20;
  const padT = 24;
  const padB = 56;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxO = Math.max(1, ...points.map((p) => p.orders));
  const n = points.length;
  const gap = 4;
  const barW = Math.max(8, (innerW - gap * (n - 1)) / n);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Гистограмма заказов по дням">
        <rect width={W} height={H} fill="#fafafa" rx={8} />
        <text x={padL} y={20} fontSize={14} fontWeight={600} fill="#0f172a">
          Заказы по дням (шт.)
        </text>
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#94a3b8" />

        {[0, 0.5, 1].map((t) => {
          const v = Math.round(maxO * t);
          const y = padT + innerH - (v / maxO) * innerH;
          return (
            <g key={`g-${t}`}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {v}
              </text>
            </g>
          );
        })}

        {points.map((p, i) => {
          const x = padL + i * (barW + gap);
          const h = (p.orders / maxO) * innerH;
          const y = padT + innerH - h;
          return (
            <g key={p.day}>
              <rect x={x} y={y} width={barW} height={h} rx={4} fill="#3b82f6" opacity={0.9} />
              <text x={x + barW / 2} y={H - 28} textAnchor="middle" fontSize={10} fill="#334155">
                {p.day.slice(5)}
              </text>
              <text x={x + barW / 2} y={H - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0f172a">
                {p.orders}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
