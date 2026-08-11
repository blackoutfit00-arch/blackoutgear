import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/shopify";
import { loadLastOrder, type LastOrder } from "@/lib/lastOrder";
import { STORE_NAME, WHATSAPP_NUMBER, BANK_IBAN, BANK_ACCOUNT_NAME } from "@/config/store";

export const Route = createFileRoute("/order-confirmed")({
  head: () => ({
    meta: [
      { title: `Order Confirmed — ${STORE_NAME}` },
      { name: "description", content: `Your order at ${STORE_NAME} has been placed. Transfer to our IBAN and send the receipt on WhatsApp to confirm.` },
      { property: "og:title", content: `Order Confirmed — ${STORE_NAME}` },
      { property: "og:description", content: "Your order has been placed. Send your transfer receipt on WhatsApp to confirm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmedPage,
});

function buildWhatsAppMessage(order: LastOrder) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const lines = order.lines.map((line, index) => {
    const productUrl = origin ? `${origin}/product/${line.handle}` : "";
    return [
      `${index + 1}. ${line.title}`,
      line.options ? `   Options: ${line.options}` : "",
      `   Qty: ${line.quantity} | Price: ${formatMoney(line.lineTotal, order.currency)}`,
      productUrl ? `   ${productUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    `*${STORE_NAME.toUpperCase()}*`,
    `Order #${order.orderNumber}`,
    "",
    "CUSTOMER",
    `Name: ${order.name}`,
    `Phone: +973 ${order.phone}`,
    "",
    "DELIVERY",
    `Address: ${order.address}`,
    "",
    "PAYMENT",
    "BenefitPay / Bank transfer",
    "",
    "ORDER ITEMS",
    ...lines,
    "",
    "ORDER SUMMARY",
    `Subtotal: ${formatMoney(order.subtotal, order.currency)}`,
    `Delivery: ${order.isFreeDelivery ? "Free" : formatMoney(order.deliveryFee, order.currency)}`,
    order.discountPercent > 0
      ? `Discount (${order.discountPercent}%): -${formatMoney(order.discountAmount, order.currency)}`
      : "",
    `TOTAL: ${formatMoney(order.total, order.currency)}`,
    order.notes ? `\nNotes: ${order.notes}` : "",
    "",
    "I have attached my transfer receipt to confirm this order.",
    "Thank you!",
  ]
    .filter(Boolean)
    .join("\n");
}

function OrderConfirmedPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrder(loadLastOrder());
  }, []);

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(BANK_IBAN);
      setCopied(true);
      toast.success("IBAN copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  };

  const sendWhatsApp = () => {
    const text = order ? buildWhatsAppMessage(order) : `Hi ${STORE_NAME}! Here is my transfer receipt.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>

        <div>
          <h1 className="label-caps text-3xl">Order Confirmed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Thank you for your order. Your order number is:</p>
        </div>

        <div className="mx-auto w-40 rounded-xl border-2 border-border bg-card py-5">
          <span className="text-3xl font-bold tracking-[0.2em]">{order?.orderNumber ?? "—"}</span>
        </div>

        <div className="space-y-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-left">
          <p className="text-sm leading-relaxed text-muted-foreground">
            To confirm your order, transfer the amount to the IBAN below via BenefitPay, then send us a photo of the
            transfer receipt on WhatsApp.
          </p>

          {order && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <span className="label-caps text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">{formatMoney(order.total, order.currency)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide">{BANK_IBAN}</span>
            <Button variant="outline" size="sm" className="label-caps h-8 flex-shrink-0" onClick={copyIban}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Account name: {BANK_ACCOUNT_NAME}</p>

          <Button
            onClick={sendWhatsApp}
            size="lg"
            className="label-caps h-13 w-full rounded-xl bg-accent py-4 text-base text-accent-foreground hover:bg-accent/90"
          >
            <MessageCircle className="mr-2 h-5 w-5" /> Send receipt on WhatsApp
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          We'll contact you shortly to confirm your order and arrange delivery (8–15 days).
        </p>

        <Button asChild variant="outline" size="lg" className="label-caps w-full rounded-xl">
          <Link to="/">
            <ShoppingBag className="mr-2 h-4 w-4" /> Continue shopping
          </Link>
        </Button>
      </main>

      <SiteFooter />
    </div>
  );
}
