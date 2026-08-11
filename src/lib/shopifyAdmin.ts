import { createServerFn } from "@tanstack/react-start";
import { SHOPIFY_API_VERSION, SHOPIFY_STORE_PERMANENT_DOMAIN } from "@/lib/shopify";

export interface OrderLineItem { variantId: string; quantity: number; }
export interface ShopifyOrderPayload {
  name: string; phone: string; region: string; address: string; notes?: string;
  lineItems: OrderLineItem[]; discountPercent: number; deliveryFee: number;
}
export type ShopifyOrderResult = { ok: true; orderName?: string } | { ok: false; error: string };

async function getAdminAccessToken(): Promise<string | null> {
  return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || process.env.SHOPIFY_ACCESS_TOKEN?.trim() || null;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts.shift() || "Customer", lastName: parts.join(" ") || "" };
}

function orderNote(data: ShopifyOrderPayload) {
  return [
    `Customer: ${data.name}`,
    `Phone: +973 ${data.phone}`,
    `Delivery region: ${data.region}`,
    `Delivery address: ${data.address}`,
    data.notes ? `Notes: ${data.notes}` : null,
    "Payment method: BenefitPay",
    "Source: Website order",
    data.discountPercent > 0 ? `Website discount: ${data.discountPercent}%` : null,
  ].filter(Boolean).join("\n");
}

async function adminGraphQL(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}: ${json?.errors?.[0]?.message || "Request rejected"}`);
  if (json?.errors?.length) throw new Error(json.errors.map((e: { message?: string }) => e.message).filter(Boolean).join("; "));
  return json?.data;
}

async function createRealOrder(token: string, data: ShopifyOrderPayload): Promise<ShopifyOrderResult> {
  const query = `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      order { id name displayFinancialStatus }
      userErrors { field message }
    }
  }`;
  const person = splitName(data.name);
  const input: Record<string, unknown> = {
    lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
    financialStatus: "PENDING",
    phone: `+973${data.phone}`,
    note: orderNote(data),
    tags: ["Website", "BenefitPay", "Pending Payment"],
    sourceName: "website",
    shippingAddress: { firstName: person.firstName, lastName: person.lastName, address1: data.address, city: data.region, countryCode: "BH", phone: `+973${data.phone}` },
    billingAddress: { firstName: person.firstName, lastName: person.lastName, address1: data.address, city: data.region, countryCode: "BH", phone: `+973${data.phone}` },
  };
  if (data.deliveryFee > 0) {
    input.shippingLines = [{ title: "Delivery", priceSet: { shopMoney: { amount: data.deliveryFee.toFixed(3), currencyCode: "BHD" } }, code: "DELIVERY" }];
  }
  const result = await adminGraphQL(token, query, { order: input, options: { inventoryBehaviour: "DECREMENT_IGNORING_POLICY", sendReceipt: false, sendFulfillmentReceipt: false } });
  const errors = result?.orderCreate?.userErrors ?? [];
  if (errors.length) return { ok: false, error: errors.map((e: { field?: string[]; message: string }) => `${e.field?.join(".") || "order"}: ${e.message}`).join("; ") };
  const order = result?.orderCreate?.order;
  return order?.name ? { ok: true, orderName: order.name } : { ok: false, error: "Shopify did not return an order." };
}

/**
 * Compatibility fallback: if the Admin token doesn't have write_orders but does have
 * write_draft_orders, create the draft privately and immediately complete it. Shopify
 * converts it to a REGULAR ORDER, so the customer-facing result is still a real Order.
 */
async function createAndImmediatelyCompleteOrder(token: string, data: ShopifyOrderPayload): Promise<ShopifyOrderResult> {
  const person = splitName(data.name);
  const draftQuery = `mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) { draftOrder { id } userErrors { field message } }
  }`;
  const draftInput: Record<string, unknown> = {
    lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
    note: orderNote(data),
    tags: ["Website", "BenefitPay", "Pending Payment"],
    shippingAddress: { firstName: person.firstName, lastName: person.lastName, address1: data.address, city: data.region, country: "Bahrain", phone: `+973${data.phone}` },
    billingAddress: { firstName: person.firstName, lastName: person.lastName, address1: data.address, city: data.region, country: "Bahrain", phone: `+973${data.phone}` },
  };
  if (data.deliveryFee > 0) draftInput.shippingLine = { title: "Delivery", price: data.deliveryFee };

  const created = await adminGraphQL(token, draftQuery, { input: draftInput });
  const createErrors = created?.draftOrderCreate?.userErrors ?? [];
  if (createErrors.length) return { ok: false, error: createErrors.map((e: { field?: string[]; message: string }) => `${e.field?.join(".") || "draftOrder"}: ${e.message}`).join("; ") };
  const draftId = created?.draftOrderCreate?.draftOrder?.id;
  if (!draftId) return { ok: false, error: "Shopify could not create the order." };

  const completeQuery = `mutation draftOrderComplete($id: ID!, $sourceName: String) {
    draftOrderComplete(id: $id, sourceName: $sourceName) {
      draftOrder { id order { id name displayFinancialStatus } }
      userErrors { field message }
    }
  }`;
  const completed = await adminGraphQL(token, completeQuery, { id: draftId, sourceName: "website" });
  const completeErrors = completed?.draftOrderComplete?.userErrors ?? [];
  if (completeErrors.length) return { ok: false, error: completeErrors.map((e: { field?: string[]; message: string }) => `${e.field?.join(".") || "order"}: ${e.message}`).join("; ") };
  const order = completed?.draftOrderComplete?.draftOrder?.order;
  return order?.name ? { ok: true, orderName: order.name } : { ok: false, error: "Shopify created the order but returned no order number." };
}

export const createShopifyOrder = createServerFn({ method: "POST" })
  .validator((data: ShopifyOrderPayload) => data)
  .handler(async ({ data }): Promise<ShopifyOrderResult> => {
    const token = await getAdminAccessToken();
    if (!token) return { ok: false, error: "SHOPIFY_ADMIN_ACCESS_TOKEN is missing in Vercel Production." };

    try {
      const direct = await createRealOrder(token, data);
      if (direct.ok) return direct;

      console.error("[shopifyAdmin] Direct orderCreate failed:", direct.error);
      const fallback = await createAndImmediatelyCompleteOrder(token, data);
      if (fallback.ok) return fallback;

      console.error("[shopifyAdmin] Draft-to-order fallback failed:", fallback.error);
      return { ok: false, error: `${direct.error} | Fallback: ${fallback.error}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Shopify API error";
      console.error("[shopifyAdmin] Direct orderCreate failed:", message);
      try {
        const fallback = await createAndImmediatelyCompleteOrder(token, data);
        if (fallback.ok) return fallback;
        return { ok: false, error: `${message} | Fallback: ${fallback.error}` };
      } catch (fallbackErr) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : "Unknown fallback error";
        return { ok: false, error: `${message} | Fallback: ${fallbackMessage}` };
      }
    }
  });
