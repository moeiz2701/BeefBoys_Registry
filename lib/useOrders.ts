"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase, type Order } from "./supabase";

const PAGE_SIZE = 1000;
const POLL_MS = 15000;

/**
 * Loads orders and keeps them fresh via Supabase realtime, with a polling
 * fallback in case realtime isn't enabled on the table.
 */
export function useOrders({ unservedOnly }: { unservedOnly: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const sb = getSupabase();
      const all: Order[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        let q = sb.from("orders").select("*");
        if (unservedOnly) q = q.eq("served", false);
        const { data, error } = await q
          .order("created_at", { ascending: unservedOnly })
          .order("id", { ascending: unservedOnly })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        all.push(...(data as Order[]));
        if (!data || data.length < PAGE_SIZE) break;
      }
      // Ignore responses that were superseded by a newer request.
      if (id !== requestId.current) return;
      setOrders(all);
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [unservedOnly]);

  useEffect(() => {
    load();
    let sb;
    try {
      sb = getSupabase();
    } catch {
      return;
    }
    const channel = sb
      .channel(`orders-${unservedOnly ? "serving" : "all"}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .subscribe();
    const timer = setInterval(load, POLL_MS);
    return () => {
      clearInterval(timer);
      sb.removeChannel(channel);
    };
  }, [load, unservedOnly]);

  return { orders, setOrders, loading, error, reload: load };
}
