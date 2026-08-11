import { createServerFn } from "@tanstack/react-start";
import { SHOPIFY_API_VERSION, SHOPIFY_STORE_PERMANENT_DOMAIN } from "@/lib/shopify";

export interface OrderLineItem { variantId: string; quantity: number; }
export interface ShopifyOrderPayload {
  name: string; phone: string; region: string; address: string; notes?: string;
  lineItems: OrderLineItem[]; discountPercent: number; deliveryFee: number;
}
export type ShopifyOrderResult = { ok: true; orderName?: string } | { ok: false; error: string };

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAdminAccessToken(): Promise<string | null> {
  const directToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || process.env.SHOPIFY_ACCESS_TOKEN?.trim();
  if (directToken) return directToken;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken;

  const clientId = process.env.SHOPIFY_APP_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[shopifyAdmin] Missing SHOPIFY_ADMIN_ACCESS_TOKEN and Shopify app client credentials.");
    return null;
  }
  try {
    const res = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/oauth/access_token`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    });
    if (!res.ok) { console.error("[shopifyAdmin] Token error:", res.status, await res.text()); return null; }
    const json = await res.json();
    const accessToken = json?.access_token as string | undefined;
    const expiresIn = (json?.expires_in as number | undefined) ?? 86400;
    if (!accessToken) return null;
    cachedToken = { accessToken, expiresAt: Date.now() + expiresIn * 1000 };
    return accessToken;
  } catch (err) { console.error("[shopifyAdmin] Token request failed:", err); return null; }
}

/** Creates a real Shopify Order, not a Draft Order. Payment remains PENDING for BenefitPay. */
export const createShopifyOrder = createServerFn({ method: "POST" })
  .validator((data: ShopifyOrderPayload) => data)
  .handler(async ({ data }): Promise<ShopifyOrderResult> => {
    const token = await getAdminAccessToken();
    if (!token) return { ok: false, error: "Shopify token is missing on the server." };

    const query = `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
      orderCreate(order: $order, options: $options) {
        order { id name displayFinancialStatus }
        userErrors { field message }
      }
    }`;

    const input: Record<string, unknown> = {
      lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
      financialStatus: "PENDING",
      phone: `+973${data.phone}`,
      note: [
        `Customer: ${data.name}`, `Phone: +973 ${data.phone}`, `Delivery region: ${data.region}`,
        `Delivery address: ${data.address}`, data.notes ? `Notes: ${data.notes}` : null,
        "Payment method: BenefitPay", "Source: Website order",
        data.discountPercent > 0 ? `Website discount: ${data.discountPercent}%` : null,
      ].filter(Boolean).join("\n"),
      tags: ["Website", "BenefitPay", "Pending Payment"],
      shippingAddress: { name: data.name, phone: `+973${data.phone}`, address1: data.address, city: data.region, countryCode: "BH" },
      billingAddress: { name: data.name, phone: `+973${data.phone}`, address1: data.address, city: data.region, countryCode: "BH" },
    };
    if (data.deliveryFee > 0) input.shippingLines = [{ title: "Delivery", priceSet: { shopMoney: { amount: data.deliveryFee.toFixed(3), currencyCode: "BHD" } } }];

    try {
      const res = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query, variables: { order: input, options: { inventoryBehaviour: "BYPASS", sendReceipt: false, sendFulfillmentReceipt: false } } }),
      });
      const json = await res.json();
      if (!res.ok) { console.error("[shopifyAdmin] HTTP error:", res.status, json); return { ok: false, error: `Shopify API error (${res.status}).` }; }
      if (json?.errors?.length) {
        const message = json.errors.map((e: { message?: string }) => e.message).filter(Boolean).join("; ");
        console.error("[shopifyAdmin] GraphQL errors:", json.errors);
        return { ok: false, error: message || "Shopify GraphQL error." };
      }
      const userErrors = json?.data?.orderCreate?.userErrors ?? [];
      if (userErrors.length) {
        const message = userErrors.map((e: { field?: string[]; message: string }) => `${e.field?.join(".") || "order"}: ${e.message}`).join("; ");
        console.error("[shopifyAdmin] orderCreate userErrors:", userErrors);
        return { ok: false, error: message };
      }
      const order = json?.data?.orderCreate?.order;
      if (!order?.name) { console.error("[shopifyAdmin] No order returned:", json); return { ok: false, error: "Shopify did not return an order." }; }
      return { ok: true, orderName: order.name };
    } catch (err) { console.error("[shopifyAdmin] orderCreate request failed:", err); return { ok: false, error: "Could not connect to Shopify." }; }
  });
