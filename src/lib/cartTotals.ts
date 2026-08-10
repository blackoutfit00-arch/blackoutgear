import { useCartStore } from "@/stores/cartStore";
import { DELIVERY_CURRENCY, DELIVERY_FEE } from "@/config/store";

export function useCartTotals() {
  const items = useCartStore((s) => s.items);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? DELIVERY_CURRENCY;
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const discountPercent = totalItems >= 3 ? 15 : 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const isFreeDelivery = totalItems >= 2;
  const deliveryFee = isFreeDelivery ? 0 : DELIVERY_FEE;
  const total = subtotal - discountAmount + deliveryFee;

  // Progress toward the two tiers: 2 items → free delivery, 3+ items → 15% off
  const TIER_2_POS = 50;
  const TIER_3_POS = 100;
  const progressPct = totalItems <= 0 ? 0 : totalItems === 1 ? TIER_2_POS / 2 : totalItems === 2 ? TIER_2_POS : TIER_3_POS;
  const discountMessage =
    discountPercent >= 15
      ? "🎉 15% OFF unlocked on your order!"
      : isFreeDelivery
        ? "🎉 Free Delivery unlocked — add 1 more item for 15% OFF!"
        : totalItems === 1
          ? "Add 1 more item to unlock Free Delivery"
          : "Add 2 items for Free Delivery, or 3+ for 15% OFF";

  return {
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
  };
}
