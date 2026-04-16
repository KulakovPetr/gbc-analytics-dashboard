import { OrdersDualLineSvg } from "@/components/OrdersDualLineSvg";
import { fetchOrdersSeries } from "@/lib/orders-series";

export const dynamic = "force-dynamic";

function DayBars({ points }: { points: { day: string; orders: number; revenueKzt: number }[] }) {
  const maxOrders = Math.max(1, ...points.map((p) => p.orders));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {points.map((p) => {
        const width = Math.max(2, Math.round((p.orders / maxOrders) * 100));
        return (
          <div key={p.day} style={{ display: "grid", gridTemplateColumns: "120px 1fr 160px", gap: 12, alignItems: "center" }}>
            <div style={{ fontVariantNumeric: "tabular-nums", color: "#334155" }}>{p.day}</div>
            <div style={{ background: "#e2e8f0", borderRadius: 8, overflow: "hidden", height: 18 }}>
              <div style={{ width: `${width}%`, background: "#2563eb", height: "100%" }} />
            </div>
            <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#0f172a" }}>
              {p.orders} шт · {Math.round(p.revenueKzt).toLocaleString("ru-RU")} ₸
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function Page() {
  let data;
  try {
    data = await fetchOrdersSeries();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return (
      <section style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Не удалось загрузить данные</h1>
        <p style={{ margin: 0, color: "#b91c1c" }}>{msg}</p>
        <p style={{ margin: 0, color: "#475569" }}>
          Проверьте переменные окружения на Vercel: <code>NEXT_PUBLIC_SUPABASE_URL</code> и <code>SUPABASE_SERVICE_ROLE_KEY</code> (см.{" "}
          <code>.env.example</code>).
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Заказы по дням (Supabase)</h1>
      <p style={{ margin: 0, color: "#475569" }}>
        Данные из таблицы <code>public.orders</code>. Ниже — <strong>линейный график</strong> по дням и столбчатое представление.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(160px, 1fr))", gap: 12 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>Всего заказов</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.totalOrders}</div>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>Выручка, тенге</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{Math.round(data.totalRevenueKzt).toLocaleString("ru-RU")}</div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>График по дням</h2>
        <OrdersDualLineSvg points={data.points} />
      </div>

      <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>По дням (столбцы)</h2>
        <DayBars points={data.points} />
      </div>
    </section>
  );
}
