import { useState, type ReactNode } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/shopify";
import { createShopifyDraftOrder } from "@/lib/shopifyAdmin";
import { saveLastOrder, generateOrderNumber } from "@/lib/lastOrder";
import { useCartTotals } from "@/lib/cartTotals";
import { useCartStore } from "@/stores/cartStore";
import { STORE_NAME, WHATSAPP_NUMBER, STORE_TAGLINE } from "@/config/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: `Checkout — ${STORE_NAME}` }],
  }),
  component: CheckoutPage,
});

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="label-caps mb-4 text-base">{title}</h2>
      {children}
    </div>
  );
}

// Official BenefitPay logo, provided by the store owner.
function BenefitPayBadge() {
  return (
    <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md">
      <img src="/benefitpay-logo.jpg" alt="BenefitPay" className="h-full w-full object-cover" />
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { updateQuantity, removeItem, clearCart } = useCartStore();
  const { items, totalItems, currency, subtotal, discountPercent, discountAmount, isFreeDelivery, deliveryFee, total } =
    useCartTotals();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);

  const fullAddress = `${region.trim()}${region.trim() && addressDetail.trim() ? ", " : ""}${addressDetail.trim()}`;

  const handleWhatsAppOrder = () => {
    if (!/^[\p{L}\s'-]{2,}$/u.test(name.trim())) {
      toast.error("Please enter your name (letters only)");
      return;
    }
    if (!/^\d{8}$/.test(phone.trim())) {
      toast.error("Phone must be 8 digits");
      return;
    }
    if (region.trim().length < 2) {
      toast.error("Please enter your region / governorate");
      return;
    }
    if (addressDetail.trim().length < 4) {
      toast.error("Please enter your delivery address");
      return;
    }
    if (!agreed) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }
    setIsConfirmOpen(true);
  };

  const sendWhatsAppOrder = async () => {
    const orderNumber = generateOrderNumber();

    const order = {
      orderNumber,
      name: name.trim(),
      phone: phone.trim(),
      address: fullAddress,
      notes: notes.trim(),
      currency,
      subtotal,
      discountPercent,
      discountAmount,
      isFreeDelivery,
      deliveryFee,
      total,
      totalItems,
      lines: items.map((i) => ({
        title: i.product.node.title,
        options: i.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(" · "),
        quantity: i.quantity,
        lineTotal: parseFloat(i.price.amount) * i.quantity,
        handle: i.product.node.handle,
      })),
    };

    const lineItems = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));

    saveLastOrder(order);
    setIsConfirmOpen(false);

    // Send the order to Shopify Admin as a Draft Order so it shows up in the
    // dashboard. Never blocks the customer flow if it fails.
    createShopifyDraftOrder({
      data: {
        name: order.name,
        phone: order.phone,
        address: order.address,
        notes: [`Website order #${orderNumber}`, order.notes].filter(Boolean).join(" — "),
        lineItems,
        discountPercent,
      },
    }).catch((err) => console.error("Failed to create Shopify draft order:", err));

    clearCart();
    navigate({ to: "/order-confirmed" });
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

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8">
        <div>
          <h1 className="label-caps text-2xl">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">{STORE_TAGLINE}</p>
        </div>

        <SectionCard title="Customer Info">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">
                  +973
                </span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  placeholder="XXXXXXXX"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Delivery Address">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Region / Governorate <span className="text-destructive">*</span>
              </label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Manama, Riffa, Hamad Town"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Delivery Address / House No. <span className="text-destructive">*</span>
              </label>
              <Input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="e.g. Block 1234, House 5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Order Notes (optional)</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any extra details..." />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Payment Method">
          <div className="flex items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 p-3">
            <BenefitPayBadge />
            <div>
              <p className="text-sm font-semibold">BenefitPay</p>
              <p className="text-xs text-muted-foreground">Transfer details are sent when you confirm your order via WhatsApp</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Order Summary">
          <div className="space-y-3">
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold">{item.product.node.title}</h4>
                      <p className="label-caps text-[10px] text-muted-foreground">
                        {item.selectedOptions.map((o) => o.value).join(" · ")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => removeItem(item.variantId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="w-5 text-center text-xs">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold">
                      {formatMoney(parseFloat(item.price.amount) * item.quantity, item.price.currencyCode)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-2 border-t border-border pt-3">
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
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="label-caps text-base">Total</span>
                <span className="text-2xl font-bold">{formatMoney(total, currency)}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-start gap-2">
          <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <label htmlFor="agree" className="text-xs leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <Link to="/returns" className="text-accent underline">
              Terms & Conditions
            </Link>{" "}
            and confirm my personal data will be used to process and deliver my order. Delivery takes 8–15 days from order confirmation.
          </label>
        </div>

        <Button
          onClick={handleWhatsAppOrder}
          size="lg"
          className="label-caps h-14 w-full rounded-xl text-base bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <MessageCircle className="mr-2 h-5 w-5" /> Place Order
        </Button>
      </main>

      <SiteFooter />

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="label-caps text-xl">Confirm Order</DialogTitle>
            <DialogDescription>Review your order details before sending on WhatsApp</DialogDescription>
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
              <p><span className="text-muted-foreground">Name: </span>{name.trim()}</p>
              <p><span className="text-muted-foreground">Phone: </span>+973 {phone.trim()}</p>
              <p><span className="text-muted-foreground">Address: </span>{fullAddress}</p>
              <p><span className="text-muted-foreground">Payment: </span>BenefitPay</p>
              {notes.trim() && <p><span className="text-muted-foreground">Notes: </span>{notes.trim()}</p>}
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="label-caps flex-1 sm:flex-none" onClick={() => setIsConfirmOpen(false)}>
              Back to edit
            </Button>
            <Button
              className="label-caps flex-1 bg-accent text-accent-foreground hover:bg-accent/90 sm:flex-none"
              onClick={sendWhatsAppOrder}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
