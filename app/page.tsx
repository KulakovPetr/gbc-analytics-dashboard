import { OrdersBarSvg } from "@/components/OrdersBarSvg";
import { OrdersDualLineSvg } from "@/components/OrdersDualLineSvg";
import { fetchOrdersSeries } from "@/lib/orders-series";

export const dynamic = "force-dynamic";

function DayTable({ points }: { points: { day: string; orders: number; revenueKzt: number }[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "#64748b" }}>
          <th style={{ padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>День</th>
          <th style={{ padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>Заказы</th>
          <th style={{ padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>Выручка, ₸</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.day}>
            <td style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>{p.day}</td>
            <td style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>{p.orders}</td>
            <td style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(p.revenueKzt).toLocaleString("ru-RU")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
        Данные из таблицы <code>public.orders</code>. Сначала <strong>выручка по дням</strong> (зелёная линия), затем <strong>заказы</strong> (синяя линия и столбцы) и таблица.
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
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Выручка и заказы по дням (линии)</h2>
        <OrdersDualLineSvg points={data.points} />
      </div>

      <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>График заказов по дням (столбцы)</h2>
        <OrdersBarSvg points={data.points} />
      </div>

      <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>По дням (таблица)</h2>
        <DayTable points={data.points} />
      </div>
    </section>
  );
}
