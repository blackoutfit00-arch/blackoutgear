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
import { MessageCircle, ShoppingBag, Minus, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/shopify";
import { createShopifyDraftOrder } from "@/lib/shopifyAdmin";
import { useCartTotals } from "@/lib/cartTotals";
import { useCartStore } from "@/stores/cartStore";
import { STORE_NAME, WHATSAPP_NUMBER, STORE_TAGLINE } from "@/config/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: `الدفع — ${STORE_NAME}` }],
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

function CheckoutPage() {
  const navigate = useNavigate();
  const { updateQuantity, removeItem } = useCartStore();
  const { items, totalItems, currency, subtotal, discountPercent, discountAmount, isFreeDelivery, deliveryFee, total } =
    useCartTotals();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);

  const fullAddress = `${region.trim()}${region.trim() && addressDetail.trim() ? "، " : ""}${addressDetail.trim()}`;

  const handleWhatsAppOrder = () => {
    if (!/^[\p{L}\s'-]{2,}$/u.test(name.trim())) {
      toast.error("الرجاء إدخال الاسم (أحرف فقط)");
      return;
    }
    if (!/^\d{8}$/.test(phone.trim())) {
      toast.error("رقم الهاتف يجب أن يكون 8 أرقام");
      return;
    }
    if (region.trim().length < 2) {
      toast.error("الرجاء إدخال المنطقة / المحافظة");
      return;
    }
    if (addressDetail.trim().length < 4) {
      toast.error("الرجاء إدخال عنوان التوصيل");
      return;
    }
    if (!agreed) {
      toast.error("الرجاء الموافقة على الشروط والأحكام");
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
        address: fullAddress,
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
      `📞 +973 ${phone.trim()}`,
      `🚚 Delivery to: ${fullAddress}`,
      `💳 Payment: BenefitPay`,
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
      <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-6 text-muted-foreground">سلتك فارغة</p>
          <Button asChild className="label-caps">
            <Link to="/">تصفح المنتجات</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8">
        <div>
          <h1 className="label-caps text-2xl">إتمام الطلب</h1>
          <p className="mt-1 text-sm text-muted-foreground">{STORE_TAGLINE}</p>
        </div>

        <SectionCard title="معلومات العميل">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                الاسم <span className="text-destructive">*</span>
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                رقم الهاتف <span className="text-destructive">*</span>
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

        <SectionCard title="عنوان التوصيل">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                المنطقة / المحافظة <span className="text-destructive">*</span>
              </label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="مثال: المنامة، الرفاع، مدينة حمد"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                عنوان التوصيل / رقم المنزل <span className="text-destructive">*</span>
              </label>
              <Input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="مثال: مجمع 1234، منزل 5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">ملاحظات الطلب (اختياري)</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="أي تفاصيل إضافية..." />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="طريقة الدفع">
          <div className="flex items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 p-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">بنفت باي (BenefitPay)</p>
              <p className="text-xs text-muted-foreground">تفاصيل التحويل ترسل لك عند تأكيد الطلب عبر واتساب</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="ملخص الطلب">
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
                    <span className="label-caps">المجموع الفرعي</span>
                    <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-accent">
                    <span className="label-caps">الخصم ({discountPercent}%)</span>
                    <span className="font-semibold">-{formatMoney(discountAmount, currency)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="label-caps">رسوم التوصيل</span>
                <span className="font-semibold text-foreground">
                  {isFreeDelivery ? "مجاني" : formatMoney(deliveryFee, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="label-caps text-base">المجموع النهائي</span>
                <span className="text-2xl font-bold">{formatMoney(total, currency)}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-start gap-2">
          <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <label htmlFor="agree" className="text-xs leading-relaxed text-muted-foreground">
            أوافق على{" "}
            <Link to="/returns" className="text-accent underline">
              الشروط والأحكام
            </Link>{" "}
            وأقر بأن بياناتي الشخصية ستُستخدم لمعالجة طلبي وتسليمه. التوصيل خلال 8-15 يوم من تأكيد الطلب.
          </label>
        </div>

        <Button
          onClick={handleWhatsAppOrder}
          size="lg"
          className="label-caps h-14 w-full rounded-xl text-base bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <MessageCircle className="ml-2 h-5 w-5" /> تأكيد الطلب
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
                    <span className="label-caps">المجموع الفرعي</span>
                    <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-accent">
                    <span className="label-caps">الخصم ({discountPercent}%)</span>
                    <span className="font-semibold">-{formatMoney(discountAmount, currency)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="label-caps">رسوم التوصيل</span>
                <span className="font-semibold text-foreground">
                  {isFreeDelivery ? "مجاني" : formatMoney(deliveryFee, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="label-caps text-foreground">المجموع النهائي</span>
                <span className="text-xl font-bold text-foreground">{formatMoney(total, currency)}</span>
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-3">
              <p><span className="text-muted-foreground">الاسم: </span>{name.trim()}</p>
              <p><span className="text-muted-foreground">الجوال: </span>+973 {phone.trim()}</p>
              <p><span className="text-muted-foreground">العنوان: </span>{fullAddress}</p>
              <p><span className="text-muted-foreground">الدفع: </span>بنفت باي</p>
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
