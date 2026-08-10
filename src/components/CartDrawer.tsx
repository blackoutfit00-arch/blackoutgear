import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Minus, Plus, Trash2, Percent, Truck, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/shopify";
import { useCartTotals } from "@/lib/cartTotals";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { updateQuantity, removeItem, syncCart } = useCartStore();
  const {
    items,
    totalItems,
    currency,
    subtotal,
    discountPercent,
    discountAmount,
    isFreeDelivery,
    deliveryFee,
    total,
    progressPct,
    discountMessage,
  } = useCartTotals();

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

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
          <SheetDescription className="sr-only">Review your items and proceed to checkout</SheetDescription>
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
              <div className="flex-shrink-0 px-4 pb-9 pt-1">
                <p className="mb-7 text-center text-sm leading-snug text-foreground">
                  {discountPercent >= 15 ? (
                    <>
                      🎉 <span className="font-bold">15% OFF</span> unlocked on your order!
                    </>
                  ) : isFreeDelivery ? (
                    <>
                      🎉 <span className="font-bold">Free Delivery</span> unlocked — add 1 more item for{" "}
                      <span className="font-bold">15% OFF</span>!
                    </>
                  ) : totalItems === 1 ? (
                    <>
                      Add 1 more item to unlock <span className="font-bold">Free Delivery</span>
                    </>
                  ) : (
                    <>
                      Add 2 items for <span className="font-bold">Free Delivery</span>, or 3+ for{" "}
                      <span className="font-bold">15% OFF</span>
                    </>
                  )}
                </p>
                <div className="relative mx-6">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        backgroundImage:
                          "repeating-linear-gradient(45deg, hsl(var(--accent)) 0px, hsl(var(--accent)) 7px, hsl(var(--accent) / 0.55) 7px, hsl(var(--accent) / 0.55) 14px)",
                      }}
                    />
                  </div>

                  {/* Fixed tier labels */}
                  {[
                    { pos: 50, label: "Free Delivery", reached: isFreeDelivery },
                    { pos: 100, label: "15% Off", reached: progressPct >= 100 },
                  ].map((m) => (
                    <span
                      key={m.label}
                      className={cn(
                        "absolute top-full mt-2.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium",
                        m.reached ? "text-accent" : "text-muted-foreground",
                      )}
                      style={{ left: `${m.pos}%` }}
                    >
                      {m.label}
                    </span>
                  ))}

                  {/* Single moving marker showing the next/current reward icon */}
                  <div
                    className="absolute top-1/2 flex h-11 w-11 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border-4 border-background bg-accent text-accent-foreground shadow-lg transition-all duration-300"
                    style={{ left: `${progressPct}%` }}
                  >
                    {isFreeDelivery ? <Percent className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 border-b border-border pb-3 last:border-0">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
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
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="w-5 text-center text-xs">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
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
              </div>

              <div className="flex-shrink-0 space-y-2 border-t border-border px-4 pt-3">
                {discountPercent > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="label-caps">Subtotal</span>
                      <span className="font-semibold text-foreground">{formatMoney(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-accent">
                      <span className="label-caps">Discount ({discountPercent}%)</span>
                      <span className="font-semibold">-{formatMoney(discountAmount, currency)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="label-caps">Delivery</span>
                  <span className="font-semibold text-foreground">
                    {isFreeDelivery ? "Free" : formatMoney(deliveryFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="label-caps text-sm">Total</span>
                  <span className="text-xl font-bold">{formatMoney(total, currency)}</span>
                </div>

                <Button
                  asChild
                  className="label-caps mb-4 h-14 w-full rounded-xl text-base bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/checkout">
                    Checkout <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
