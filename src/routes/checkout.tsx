import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/shopify";
import { createShopifyDraftOrder } from "@/lib/shopifyAdmin";
import { useCartTotals } from "@/lib/cartTotals";
import { STORE_NAME, WHATSAPP_NUMBER, STORE_TAGLINE } from "@/config/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: `Checkout — ${STORE_NAME}` }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalItems, currency, subtotal, discountPercent, discountAmount, isFreeDelivery, deliveryFee, total } =
    useCartTotals();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleWhatsAppOrder = () => {
    if (!/^[\p{L}\s'-]{2,}$/u.test(name.trim())) {
      toast.error("Please enter your name (letters only)");
      return;
    }
    if (!/^\d{8}$/.test(phone.trim())) {
      toast.error("Phone must be 8 digits");
      return;
    }
    if (address.trim().length < 6) {
      toast.error("Please enter your delivery address");
      return;
    }
    setIsConfirmOpen(true);
  };

  const sendWhatsAppOrder = () => {
    // Create the order in Shopify Admin (as a Draft Order) in the background.
    // Never blocks or breaks the WhatsApp flow if this fails.
    createShopifyDraftOrder({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        lineItems: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        discountPercent,
      },
    }).catch((err) => console.error("Failed to create Shopify draft order:", err));

    const lines = items.map((i) => {
      const opts = i.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(" · ");
      const url = `${window.location.origin}/product/${i.product.node.handle}`;
      return `• ${i.product.node.title}${opts ? ` · ${opts}` : ""} · Qty: ${i.quantity}\n  ${url}`;
    });

    const message = [
      `Hi ${STORE_NAME}! New Order (pending confirmation)`,
      "",
      `👤 ${name.trim()}`,
      `📞 ${phone.trim()}`,
      `🚚 Delivery to: ${address.trim()}`,
      "",
      ...lines,
      "",
      `🚚 Delivery: ${isFreeDelivery ? "Free" : formatMoney(deliveryFee, currency)}`,
      `Subtotal: ${formatMoney(subtotal, currency)}`,
      discountPercent > 0 ? `🎉 Discount (${discountPercent}% off ${totalItems} items): -${formatMoney(discountAmount, currency)}` : "",
      `🧾 Order Total: ${formatMoney(total, currency)}`,
      notes.trim() ? `\n📝 Notes: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    setIsConfirmOpen(false);
    navigate({ to: "/" });
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-6 text-muted-foreground">Your cart is empty</p>
          <Button asChild className="label-caps">
            <Link to="/">Continue shopping</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="label-caps text-2xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">{STORE_TAGLINE}</p>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-3 border-b border-border pb-3 last:border-0">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {(() => {
                  const thumb = item.image ?? item.product.node.images?.edges?.[0]?.node;
                  return thumb ? (
                    <img src={thumb.url} alt={item.product.node.title} className="h-full w-full object-cover" />
                  ) : null;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold">{item.product.node.title}</h4>
                <p className="label-caps text-[10px] text-muted-foreground">
                  {item.selectedOptions.map((o) => o.value).join(" · ")} · Qty {item.quantity}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-bold">
                {formatMoney(parseFloat(item.price.amount) * item.quantity, item.price.currencyCode)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {discountPercent > 0 && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="label-caps">Subtotal</span>
                <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-accent">
                <span className="label-caps">Discount ({discountPercent}%)</span>
                <span className="font-semibold">-{formatMoney(discountAmount, currency)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="label-caps">Delivery</span>
            <span className="font-semibold text-foreground">
              {isFreeDelivery ? "Free" : formatMoney(deliveryFee, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="label-caps text-base">Total</span>
            <span className="text-2xl font-bold">{formatMoney(total, currency)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name * (letters only)" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric"
            placeholder="Phone (WhatsApp) * — 8 digits"
          />
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Delivery address * (block, road, house, area)"
            rows={2}
          />
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} />
        </div>

        <Button
          onClick={handleWhatsAppOrder}
          size="lg"
          className="label-caps mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <MessageCircle className="mr-2 h-4 w-4" /> Place order & open WhatsApp
        </Button>
      </main>

      <SiteFooter />

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="label-caps text-xl">تأكيد الطلب</DialogTitle>
            <DialogDescription>راجع تفاصيل طلبك قبل الإرسال على واتساب</DialogDescription>
          </DialogHeader>

          <div className="max-h-[45vh] space-y-3 overflow-y-auto text-sm">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="font-semibold">{item.product.node.title}</span>
                    {item.selectedOptions.length > 0 && (
                      <span className="text-muted-foreground"> · {item.selectedOptions.map((o) => o.value).join(" · ")}</span>
                    )}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="whitespace-nowrap font-semibold">
                    {formatMoney(parseFloat(item.price.amount) * item.quantity, item.price.currencyCode)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-border pt-3 text-muted-foreground">
              {discountPercent > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="label-caps">Subtotal</span>
                    <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-accent">
                    <span className="label-caps">Discount ({discountPercent}%)</span>
                    <span className="font-semibold">-{formatMoney(discountAmount, currency)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="label-caps">Delivery</span>
                <span className="font-semibold text-foreground">
                  {isFreeDelivery ? "Free" : formatMoney(deliveryFee, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="label-caps text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{formatMoney(total, currency)}</span>
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-3">
              <p><span className="text-muted-foreground">الاسم: </span>{name.trim()}</p>
              <p><span className="text-muted-foreground">الجوال: </span>{phone.trim()}</p>
              <p><span className="text-muted-foreground">العنوان: </span>{address.trim()}</p>
              {notes.trim() && <p><span className="text-muted-foreground">ملاحظات: </span>{notes.trim()}</p>}
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="label-caps flex-1 sm:flex-none" onClick={() => setIsConfirmOpen(false)}>
              رجوع للتعديل
            </Button>
            <Button
              className="label-caps flex-1 bg-accent text-accent-foreground hover:bg-accent/90 sm:flex-none"
              onClick={sendWhatsAppOrder}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> تأكيد وإرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
