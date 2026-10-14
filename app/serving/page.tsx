"use client";

import { useState } from "react";
import ItemBadge from "@/components/ItemBadge";
import { MENU } from "@/lib/menu";
import { getSupabase, type Order } from "@/lib/supabase";
import { useOrders } from "@/lib/useOrders";

function countItems(orders: Order[]) {
  return MENU.map((m) => {
    const lines = orders.flatMap((o) => o.items).filter((i) => i.item === m.id);
    return { item: m, count: lines.length, meals: lines.filter((i) => i.meal).length };
  });
}

export default function ServingPage() {
  const { orders, setOrders, loading, error, reload } = useOrders({ unservedOnly: true });
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const totals = countItems(orders);

  async function markServed(id: number) {
    setBusyId(id);
    setActionError(null);
    const { error } = await getSupabase()
      .from("orders")
      .update({ served: true, served_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setActionError(error.message);
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
    setBusyId(null);
    reload();
  }

  return (
    <>
      <div className="card serving-summary">
        {totals.map(({ item, count, meals }) => (
          <ItemBadge
            key={item.id}
            item={item}
            count={count}
            size={120}
            highlight={count >= 1}
            note={meals ? `${meals} meal${meals === 1 ? "" : "s"}` : undefined}
          />
        ))}
      </div>

      <div className="section" style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>To serve</h1>
        <span className="muted">
          {orders.length} order{orders.length === 1 ? "" : "s"} waiting
        </span>
      </div>

      {(error || actionError) && (
        <div className="error" style={{ marginTop: 16 }}>{actionError ?? error}</div>
      )}

      <div className="section queue">
        {loading ? (
          <div className="card muted" style={{ padding: 24, textAlign: "center" }}>
            Loading…
          </div>
        ) : orders.length === 0 ? (
          <div className="card muted" style={{ padding: 24, textAlign: "center" }}>
            All caught up — no orders to serve
          </div>
        ) : (
          orders.map((o, i) => (
            <div key={o.id} className={i === 0 ? "card queue-entry first" : "card queue-entry"}>
              <div className="queue-pos">{i + 1}</div>
              <div className="queue-info">
                <div className="queue-name">{o.customer_name}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Order #{o.id}
                  {i === 0 && <strong style={{ color: "var(--ink)" }}> · Next up</strong>}
                </div>
              </div>
              <div className="queue-items">
                {countItems([o])
                  .filter((t) => t.count > 0)
                  .map(({ item, count, meals }) => (
                    <ItemBadge
                      key={item.id}
                      item={item}
                      count={count}
                      size={64}
                      note={meals ? `${meals} meal${meals === 1 ? "" : "s"}` : undefined}
                    />
                  ))}
              </div>
              <button
                className="btn btn-green"
                onClick={() => markServed(o.id)}
                disabled={busyId === o.id}
              >
                {busyId === o.id ? "…" : "Served"}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
