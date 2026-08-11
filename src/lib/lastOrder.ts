export interface LastOrderLine {
  title: string;
  options: string;
  quantity: number;
  lineTotal: number;
  handle: string;
}

export interface LastOrder {
  orderNumber: string;
  name: string;
  phone: string;
  address: string;
  currency: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  isFreeDelivery: boolean;
  deliveryFee: number;
  total: number;
  totalItems: number;
  lines: LastOrderLine[];
}

const KEY = "bg-last-order";

export function saveLastOrder(order: LastOrder) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function loadLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

export function generateOrderNumber(): string {
  return String(Math.floor(100 + Math.random() * 900));
}
