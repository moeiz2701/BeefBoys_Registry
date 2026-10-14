"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MEAL_PRICE,
  MENU,
  MENU_BY_ID,
  formatRs,
  type MenuItemId,
} from "@/lib/menu";
import { getSupabase, type OrderItem, type PaymentMethod } from "@/lib/supabase";

type Line = { key: number; item: MenuItemId; meal: boolean };

let nextKey = 1;

function linePrice(line: Line): number {
  return MENU_BY_ID[line.item].price + (line.meal ? MEAL_PRICE : 0);
}

export default function RegisterPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  const total = lines.reduce((sum, l) => sum + linePrice(l), 0);
  const receivedNum = received.trim() === "" ? null : Number(received);
  const change =
    receivedNum === null || Number.isNaN(receivedNum) ? null : receivedNum - total;

  const nameMissing = customer.trim() === "";
  const canComplete = !saving && lines.length > 0 && !nameMissing;

  function addItem(item: MenuItemId) {
    setLines((prev) => [...prev, { key: nextKey++, item, meal: false }]);
    setSuccess(null);
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function toggleMeal(key: number) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, meal: !l.meal } : l)),
    );
  }

  function clearOrder() {
    setLines([]);
    setCustomer("");
    setPayment("cash");
    setReceived("");
    setError(null);
    setNameTouched(false);
  }

  async function completeOrder() {
    setNameTouched(true);
    if (nameMissing) {
      setError("Customer name is required.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one item.");
      return;
    }
    if (receivedNum !== null && (Number.isNaN(receivedNum) || receivedNum < 0)) {
      setError("Received cash must be a valid amount.");
      return;
    }

    setSaving(true);
    setError(null);
    const items: OrderItem[] = lines.map((l) => ({
      item: l.item,
      name: MENU_BY_ID[l.item].name,
      meal: l.meal,
      price: linePrice(l),
    }));
    try {
      const { data, error } = await getSupabase()
        .from("orders")
        .insert({
          customer_name: customer.trim(),
          payment_method: payment,
          items,
          total,
          received: receivedNum,
          change_due: change,
        })
        .select("id")
        .single();
      if (error) throw error;
      const name = customer.trim();
      clearOrder();
      setSuccess(`Order #${data.id} for ${name} saved and sent to serving.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="menu-row">
        {MENU.map((m) => (
          <button
            key={m.id}
            className="menu-btn"
            onClick={() => addItem(m.id)}
            aria-label={`Add ${m.name}`}
          >
            <Image
              src={m.image}
              alt={m.name}
              width={400}
              height={400}
              sizes="(max-width: 1000px) 33vw, 320px"
              priority
            />
            <span className="menu-price">{formatRs(m.price)}</span>
          </button>
        ))}
      </div>

      <div className="section fields">
        <div className="field">
          <label htmlFor="customer">Customer name *</label>
          <input
            id="customer"
            className={nameTouched && nameMissing ? "input invalid" : "input"}
            placeholder="e.g. Ali"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onBlur={() => setNameTouched(true)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <span className="label">Payment</span>
          <div className="segmented" role="group" aria-label="Payment method">
            {(["cash", "online"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={payment === p ? "active" : ""}
                onClick={() => setPayment(p)}
                aria-pressed={payment === p}
              >
                {p === "cash" ? "Cash" : "Online"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section card table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Item</th>
              <th className="num">Price</th>
              <th>Meal</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={5}>Tap an item above to add it to the order</td>
              </tr>
            ) : (
              lines.map((l, i) => {
                const item = MENU_BY_ID[l.item];
                return (
                  <tr key={l.key}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{item.name}</strong>
                      {l.meal && <span className="muted"> + Meal</span>}
                    </td>
                    <td className="num">{formatRs(linePrice(l))}</td>
                    <td>
                      {item.mealable && (
                        <button
                          className={l.meal ? "btn btn-sm btn-meal on" : "btn btn-sm btn-meal"}
                          onClick={() => toggleMeal(l.key)}
                          aria-pressed={l.meal}
                          title={`Meal adds ${formatRs(MEAL_PRICE)}`}
                        >
                          {l.meal ? "✓ Meal" : "+ Meal"}
                        </button>
                      )}
                    </td>
                    <td className="num">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeLine(l.key)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="section stats">
        <div className="card stat highlight">
          <span className="label">Total</span>
          <div className="value">{formatRs(total)}</div>
        </div>
        <div className="card stat">
          <label className="label" htmlFor="received">
            Received cash
          </label>
          <input
            id="received"
            className="value"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
          />
        </div>
        <div className="card stat">
          <span className="label">Change</span>
          <div className={change !== null && change < 0 ? "value negative" : "value"}>
            {change === null ? "—" : formatRs(Math.abs(change))}
          </div>
          {change !== null && change < 0 && <div className="sub">Short by this amount</div>}
        </div>
      </div>

      {(error || success) && (
        <div className="section">
          {error && <div className="error">{error}</div>}
          {success && <div className="toast">{success}</div>}
        </div>
      )}

      <div className="section actions">
        <button
          className="btn btn-lg btn-primary"
          onClick={completeOrder}
          disabled={!canComplete}
          title={nameMissing ? "Enter the customer name first" : undefined}
        >
          {saving ? "Saving…" : "Complete order"}
        </button>
        <button className="btn btn-lg" onClick={clearOrder} disabled={saving}>
          Clear order
        </button>
      </div>
    </>
  );
}
