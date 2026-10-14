import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MenuItemId } from "./menu";

export type PaymentMethod = "cash" | "online";

export type OrderItem = {
  item: MenuItemId;
  name: string;
  meal: boolean;
  price: number; // line price, including meal upgrade
};

export type Order = {
  id: number;
  created_at: string;
  customer_name: string;
  payment_method: PaymentMethod;
  items: OrderItem[];
  total: number;
  received: number | null;
  change_due: number | null;
  served: boolean;
  served_at: string | null;
};

let client: SupabaseClient | null = null;

// Created lazily so a missing env var fails at runtime with a clear message
// instead of breaking the build.
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  client = createClient(url, key);
  return client;
}
