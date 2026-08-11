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

async function createWithGraphQL(token: string, data: ShopifyOrderPayload): Promise<ShopifyOrderResult> {
  const query = `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      order { id name displayFinancialStatus }
      userErrors { field message }
    }
  }`;
  const person = splitName(data.name);

  // Keep this payload to fields supported by Shopify's orderCreate mutation.
  const input: Record<string, unknown> = {
    lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
    financialStatus: "PENDING",
    phone: `+973${data.phone}`,
    note: orderNote(data),
    tags: ["Website", "BenefitPay", "Pending Payment"],
    shippingAddress: {
      firstName: person.firstName,
      lastName: person.lastName,
      address1: data.address,
      city: data.region,
      countryCode: "BH",
      phone: `+973${data.phone}`,
    },
    billingAddress: {
      firstName: person.firstName,
      lastName: person.lastName,
      address1: data.address,
      city: data.region,
      countryCode: "BH",
      phone: `+973${data.phone}`,
    },
  };

  if (data.deliveryFee > 0) {
    input.shippingLines = [{
      title: "Delivery",
      priceSet: { shopMoney: { amount: data.deliveryFee.toFixed(3), currencyCode: "BHD" } },
      code: "DELIVERY",
      source: "Website",
    }];
  }

  const res = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables: { order: input, options: { inventoryBehaviour: "BYPASS", sendReceipt: false, sendFulfillmentReceipt: false } } }),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) return { ok: false, error: `GraphQL HTTP ${res.status}: ${json?.errors?.[0]?.message || "Shopify rejected the request"}` };
  if (json?.errors?.length) return { ok: false, error: json.errors.map((e: { message?: string }) => e.message).filter(Boolean).join("; ") };

  const errors = json?.data?.orderCreate?.userErrors ?? [];
  if (errors.length) {
    return { ok: false, error: errors.map((e: { field?: string[]; message: string }) => `${e.field?.join(".") || "order"}: ${e.message}`).join("; ") };
  }
  const order = json?.data?.orderCreate?.order;
  return order?.name ? { ok: true, orderName: order.name } : { ok: false, error: "Shopify returned no order." };
}

export const createShopifyOrder = createServerFn({ method: "POST" })
  .validator((data: ShopifyOrderPayload) => data)
  .handler(async ({ data }): Promise<ShopifyOrderResult> => {
    const token = await getAdminAccessToken();
    if (!token) return { ok: false, error: "SHOPIFY_ADMIN_ACCESS_TOKEN is missing in Vercel Production." };
    try {
      return await createWithGraphQL(token, data);
    } catch (err) {
      console.error("[shopifyAdmin] orderCreate failed:", err);
      return { ok: false, error: "Could not connect to Shopify Admin API." };
    }
  });
