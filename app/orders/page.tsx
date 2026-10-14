"use client";

import { useState } from "react";
import { MENU, formatRs } from "@/lib/menu";
import { getSupabase, type Order } from "@/lib/supabase";
import { useOrders } from "@/lib/useOrders";

function summarizeItems(order: Order): string {
  return MENU.map((m) => {
    const lines = order.items.filter((i) => i.item === m.id);
    if (lines.length === 0) return null;
    const meals = lines.filter((i) => i.meal).length;
    return `${lines.length}× ${m.name}${meals ? ` (${meals} meal)` : ""}`;
  })
    .filter(Boolean)
    .join(", ");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const { orders, setOrders, loading, error, reload } = useOrders({ unservedOnly: false });
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function deleteOrder(order: Order) {
    if (!confirm(`Delete order #${order.id} for ${order.customer_name}? This cannot be undone.`)) {
      return;
    }
    setBusyId(order.id);
    setActionError(null);
    const { data, error } = await getSupabase()
      .from("orders")
      .delete()
      .eq("id", order.id)
      .select("id");
    if (error) {
      setActionError(error.message);
    } else if (!data || data.length === 0) {
      // Supabase returns no error when row-level security blocks a delete.
      setActionError("Order was not deleted. Check that the delete policy exists in Supabase.");
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    }
    setBusyId(null);
    reload();
  }

  const totals = orders.reduce(
    (acc, o) => {
      const t = Number(o.total);
      acc.all += t;
      acc[o.payment_method] += t;
      return acc;
    },
    { all: 0, cash: 0, online: 0 },
  );

  return (
    <>
      <h1 className="page-title">Orders</h1>
      {(error || actionError) && (
        <div className="error" style={{ marginBottom: 16 }}>{actionError ?? error}</div>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Status</th>
              <th className="num">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="empty-row">
                <td colSpan={8}>Loading…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={8}>No orders yet</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatTime(o.created_at)}</td>
                  <td>
                    <strong>{o.customer_name}</strong>
                  </td>
                  <td>{summarizeItems(o)}</td>
                  <td>
                    <span className={`pill pill-${o.payment_method}`}>
                      {o.payment_method}
                    </span>
                  </td>
                  <td>
                    <span className={o.served ? "pill pill-served" : "pill pill-pending"}>
                      {o.served ? "Served" : "Pending"}
                    </span>
                  </td>
                  <td className="num">
                    <strong>{formatRs(Number(o.total))}</strong>
                  </td>
                  <td className="num">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteOrder(o)}
                      disabled={busyId === o.id}
                    >
                      {busyId === o.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="section stats">
        <div className="card stat highlight">
          <span className="label">Total worth</span>
          <div className="value">{formatRs(totals.all)}</div>
          <div className="sub" style={{ color: "var(--ink)" }}>
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="card stat">
          <span className="label">Cash</span>
          <div className="value">{formatRs(totals.cash)}</div>
        </div>
        <div className="card stat">
          <span className="label">Online</span>
          <div className="value">{formatRs(totals.online)}</div>
        </div>
      </div>
    </>
  );
}
