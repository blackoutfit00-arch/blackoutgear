import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/shopify";
import { DELIVERY_CURRENCY, STORE_NAME, WHATSAPP_NUMBER } from "@/config/store";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");


  const { items, updateQuantity, removeItem, syncCart } = useCartStore();

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? DELIVERY_CURRENCY;
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const discountPercent = totalItems >= 3 ? 15 : totalItems === 2 ? 10 : 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  // Progress toward the two discount tiers: 2 items → 10%, 3+ items → 15%
  const TIER_2_POS = 66.66;
  const TIER_3_POS = 100;
  const progressPct = totalItems <= 0 ? 0 : totalItems === 1 ? TIER_2_POS / 2 : totalItems === 2 ? TIER_2_POS : TIER_3_POS;
  const discountMessage =
    discountPercent >= 15
      ? "🎉 15% OFF unlocked on your order!"
      : discountPercent === 10
        ? "🎉 10% OFF unlocked — add 1 more item for 15% OFF!"
        : totalItems === 1
          ? "Add 1 more item to unlock 10% OFF"
          : "Add 2 items to unlock 10% OFF, or 3+ for 15% OFF";

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  const handleWhatsAppOrder = () => {
    if (!/^[\p{L}\s'-]{2,}$/u.test(name.trim())) {
      toast.error("Please enter your name (letters only)", { position: "top-center" });
      return;
    }
    if (!/^\d{8}$/.test(phone.trim())) {
      toast.error("Phone must be 8 digits", { position: "top-center" });
      return;
    }
    if (address.trim().length < 6) {
      toast.error("Please enter your delivery address", { position: "top-center" });
      return;
    }
    setIsConfirmOpen(true);
  };

  const sendWhatsAppOrder = () => {
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
      `🚚 Delivery: Free`,
      `Subtotal: ${formatMoney(subtotal, currency)}`,
      discountPercent > 0 ? `🎉 Discount (${discountPercent}% off ${totalItems} items): -${formatMoney(discountAmount, currency)}` : "",
      `🧾 Order Total: ${formatMoney(total, currency)}`,
      notes.trim() ? `\n📝 Notes: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    setIsConfirmOpen(false);
    setIsOpen(false);
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-11 w-11">
          <ShoppingBag className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-full w-[90%] flex-col sm:max-w-lg">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="label-caps text-xl">Your cart ({totalItems})</SheetTitle>
          <SheetDescription className="sr-only">Review your items and place your order on WhatsApp</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-shrink-0 px-4 pb-2 pt-1">
                <p className="mb-2.5 text-xs font-medium text-foreground">{discountMessage}</p>
                <div className="relative h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                  {[
                    { pos: 66.66, active: progressPct >= 66.66 },
                    { pos: 100, active: progressPct >= 100 },
                  ].map((m) => (
                    <div
                      key={m.pos}
                      className={cn(
                        "absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background",
                        m.active ? "bg-accent" : "bg-muted-foreground/40",
                      )}
                      style={{ left: `${m.pos}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span>10% · 2 items</span>
                  <span>15% · 3+ items</span>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {(() => {
                        const thumb = item.image ?? item.product.node.images?.edges?.[0]?.node;
                        return thumb ? (
                          <img src={thumb.url} alt={item.product.node.title} className="h-full w-full object-cover" />
                        ) : null;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold">{item.product.node.title}</h4>
                      <p className="label-caps text-[11px] text-muted-foreground">
                        {item.selectedOptions.map((o) => o.value).join(" · ")}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.variantId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-sm font-bold">
                        {formatMoney(parseFloat(item.price.amount) * item.quantity, item.price.currencyCode)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 space-y-3 border-t border-border px-4 pt-4">
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
                  <span className="font-semibold text-foreground">Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-sm">Total</span>
                  <span className="text-2xl font-bold">{formatMoney(total, currency)}</span>
                </div>

                <div className="space-y-2 pt-1">
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

                <Button onClick={handleWhatsAppOrder} size="lg" className="label-caps mb-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <MessageCircle className="mr-2 h-4 w-4" /> Place order & open WhatsApp
                </Button>
              </div>
            </>
          )}
        </div>

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
                  <span className="font-semibold text-foreground">Free</span>
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
      </SheetContent>
    </Sheet>

  );
}
