import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/shopify";
import { STORE_NAME } from "@/config/store";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: `Orders Admin — ${STORE_NAME}` },
      { name: "description", content: `Store owner order list for ${STORE_NAME}.` },
      { property: "og:title", content: `Orders Admin — ${STORE_NAME}` },
      { property: "og:description", content: "View and manage customer orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrdersPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string | null;
  items: unknown;
  total_quantity: number;
  total_price: number;
  currency: string;
  status: string;
  created_at: string;
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function AdminOrdersPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: admin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      setIsAdmin(!!admin);
      if (!admin) return;
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setOrders(data as OrderRow[]);
    })();
  }, [session]);

  const auth = async (mode: "in" | "up") => {
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin/orders` } });
    if (error) toast.error(error.message);
    else if (mode === "up") toast.success("Account created — check your email to confirm");
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((o) => o.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  let body;
  if (!ready) body = <p className="text-muted-foreground">Loading…</p>;
  else if (!session)
    body = (
      <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="label-caps text-lg">Owner sign in</h2>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <Button className="label-caps flex-1" onClick={() => auth("in")}>Sign in</Button>
          <Button variant="outline" className="label-caps flex-1" onClick={() => auth("up")}>Sign up</Button>
        </div>
      </div>
    );
  else if (!isAdmin)
    body = (
      <div className="space-y-3 text-center">
        <p className="text-muted-foreground">This account ({session.user.email}) doesn't have admin access yet.</p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  else
    body = (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{orders.length} orders</p>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
        {orders.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
        {orders.map((o) => {
          const items = Array.isArray(o.items) ? (o.items as { title: string; options?: string; quantity: number }[]) : [];
          return (
            <div key={o.id} className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">#{o.order_number} · {o.customer_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
              </div>
              <p className="text-muted-foreground">+973 {o.phone}{o.address ? ` · ${o.address}` : ""}</p>
              <ul className="space-y-0.5">
                {items.map((i, idx) => (
                  <li key={idx}>• {i.title}{i.options ? ` · ${i.options}` : ""} × {i.quantity}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="rounded-md border border-border bg-secondary px-2 py-1 text-sm capitalize text-foreground"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-lg font-bold">{formatMoney(Number(o.total_price), o.currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-8">
        <h1 className="label-caps text-2xl">Orders</h1>
        {body}
      </main>
      <SiteFooter />
    </div>
  );
}
