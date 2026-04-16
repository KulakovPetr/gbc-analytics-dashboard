import { NextResponse } from "next/server";
import { fetchOrdersSeries } from "@/lib/orders-series";

export async function GET() {
  try {
    const body = await fetchOrdersSeries();
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
