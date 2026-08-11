import { createServerFn } from "@tanstack/react-start";
import { SHOPIFY_API_VERSION, SHOPIFY_STORE_PERMANENT_DOMAIN } from "@/lib/shopify";

export interface OrderLineItem { variantId: string; quantity: number; }
export interface ShopifyOrderPayload { name: string; phone: string; region: string; address: string; notes?: string; lineItems: OrderLineItem[]; discountPercent: number; deliveryFee: number; }
export type ShopifyOrderResult = { ok: true; orderName?: string } | { ok: false; error: string };

const tokenFromEnv = () => process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || process.env.SHOPIFY_ACCESS_TOKEN?.trim() || null;

function splitName(name: string) { const parts = name.trim().split(/\s+/); return { firstName: parts.shift() || "Customer", lastName: parts.join(" ") || "" }; }
function orderNote(data: ShopifyOrderPayload) { return [`Customer: ${data.name}`, `Phone: +973 ${data.phone}`, `Delivery region: ${data.region}`, `Delivery address: ${data.address}`, data.notes ? `Notes: ${data.notes}` : null, "Payment method: BenefitPay", "Source: Website order", data.discountPercent > 0 ? `Website discount: ${data.discountPercent}%` : null].filter(Boolean).join("\n"); }

async function adminGraphQL(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Shopify-Access-Token": token }, body: JSON.stringify({ query, variables }) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}: ${json?.errors?.[0]?.message || "Request rejected"}`);
  if (json?.errors?.length) throw new Error(json.errors.map((e: { message?: string }) => e.message).filter(Boolean).join("; "));
  return json?.data;
}

async function createRealOrder(token: string, data: ShopifyOrderPayload): Promise<ShopifyOrderResult> {
  // Keep this mutation intentionally minimal. Shopify's orderCreate mutation requires
  // write_orders; invalid/unsupported fields are not sent so they cannot block checkout.
  const query = `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) { orderCreate(order: $order, options: $options) { userErrors { field message } order { id name displayFinancialStatus } } }`;
  const person = splitName(data.name);
  const input: Record<string, unknown> = {
    lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
    financialStatus: "PENDING",
    phone: `+973${data.phone}`,
    note: orderNote(data),
    tags: ["Website", "BenefitPay", "Pending Payment"],
    shippingAddress: { firstName: person.firstName, lastName: person.lastName, address1: data.address, city: data.region, countryCode: "BH", phone: `+973${data.phone}` },
    billingAddress: { firstName: person.firstName, lastName: person.lastName, address1: data.address, city: data.region, countryCode: "BH", phone: `+973${data.phone}` },
  };
  if (data.deliveryFee > 0) input.shippingLines = [{ title: "Delivery", priceSet: { shopMoney: { amount: data.deliveryFee.toFixed(3), currencyCode: "BHD" } } }];

  try {
    const result = await adminGraphQL(token, query, { order: input, options: { inventoryBehaviour: "DECREMENT_IGNORING_POLICY", sendReceipt: false, sendFulfillmentReceipt: false } });
    const errors = result?.orderCreate?.userErrors ?? [];
    if (errors.length) return { ok: false, error: errors.map((e: { field?: string[]; message: string }) => `${e.field?.join(".") || "order"}: ${e.message}`).join("; ") };
    const order = result?.orderCreate?.order;
    return order?.name ? { ok: true, orderName: order.name } : { ok: false, error: "Shopify returned no order." };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Shopify Admin API request failed." }; }
}

export const createShopifyOrder = createServerFn({ method: "POST" }).validator((data: ShopifyOrderPayload) => data).handler(async ({ data }): Promise<ShopifyOrderResult> => {
  const token = tokenFromEnv();
  if (!token) return { ok: false, error: "SHOPIFY_ADMIN_ACCESS_TOKEN is missing in Vercel Production." };
  return createRealOrder(token, data);
});
