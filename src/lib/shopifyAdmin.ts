import { createServerFn } from "@tanstack/react-start";
import { SHOPIFY_API_VERSION, SHOPIFY_STORE_PERMANENT_DOMAIN } from "@/lib/shopify";

export interface DraftOrderLineItem {
  variantId: string;
  quantity: number;
}

export interface DraftOrderPayload {
  name: string;
  phone: string;
  address: string;
  notes?: string;
  lineItems: DraftOrderLineItem[];
  discountPercent: number;
}

export type DraftOrderResult =
  | { ok: true; orderName?: string }
  | { ok: false; error: string };

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAdminAccessToken(): Promise<string | null> {
  // Vercel production variable: SHOPIFY_ADMIN_ACCESS_TOKEN.
  // SHOPIFY_ACCESS_TOKEN remains supported for compatibility.
  const directToken =
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || process.env.SHOPIFY_ACCESS_TOKEN?.trim();

  if (directToken) return directToken;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.SHOPIFY_APP_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[shopifyAdmin] Missing SHOPIFY_ADMIN_ACCESS_TOKEN and Shopify app client credentials.");
    return null;
  }

  try {
    const res = await fetch(`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      console.error("[shopifyAdmin] Failed to obtain Admin API token:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const accessToken = json?.access_token as string | undefined;
    const expiresIn = (json?.expires_in as number | undefined) ?? 60 * 60 * 24;
    if (!accessToken) {
      console.error("[shopifyAdmin] Token response did not contain access_token.");
      return null;
    }

    cachedToken = { accessToken, expiresAt: Date.now() + expiresIn * 1000 };
    return accessToken;
  } catch (err) {
    console.error("[shopifyAdmin] Token request failed:", err);
    return null;
  }
}

/**
 * Creates a Shopify Draft Order when a customer confirms checkout.
 * The order is left as a draft so payment can be confirmed manually via BenefitPay.
 */
export const createShopifyDraftOrder = createServerFn({ method: "POST" })
  .validator((data: DraftOrderPayload) => data)
  .handler(async ({ data }): Promise<DraftOrderResult> => {
    const token = await getAdminAccessToken();
    if (!token) return { ok: false, error: "missing_admin_token" };

    const query = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id name invoiceUrl }
          userErrors { field message }
        }
      }
    `;

    const totalItems = data.lineItems.reduce((sum, li) => sum + li.quantity, 0);

    const input: Record<string, unknown> = {
      lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
      note: [
        `Customer: ${data.name}`,
        `Phone: +973 ${data.phone}`,
        `Delivery address: ${data.address}`,
        data.notes ? `Notes: ${data.notes}` : null,
        "Payment method: BenefitPay",
        "Source: Website order (pending payment confirmation)",
      ]
        .filter(Boolean)
        .join("\n"),
      tags: ["Website", "BenefitPay", "Pending Payment"],
      shippingAddress: {
        name: data.name,
        phone: `+973${data.phone}`,
        address1: data.address,
        countryCode: "BH",
      },
      useCustomerDefaultAddress: false,
    };

    if (data.discountPercent > 0) {
      input.appliedDiscount = {
        valueType: "PERCENTAGE",
        value: data.discountPercent,
        title: `${data.discountPercent}% off (${totalItems} items)`,
      };
    }

    try {
      const res = await fetch(
        `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({ query, variables: { input } }),
        },
      );

      const json = await res.json();

      if (!res.ok) {
        console.error("[shopifyAdmin] Admin API HTTP error:", res.status, json);
        return { ok: false, error: `http_${res.status}` };
      }

      if (json?.errors?.length) {
        console.error("[shopifyAdmin] GraphQL errors:", json.errors);
        return { ok: false, error: "graphql_errors" };
      }

      const userErrors = json?.data?.draftOrderCreate?.userErrors;
      if (userErrors?.length) {
        console.error("[shopifyAdmin] draftOrderCreate userErrors:", userErrors);
        return { ok: false, error: userErrors.map((e: { message: string }) => e.message).join("; ") };
      }

      const draftOrder = json?.data?.draftOrderCreate?.draftOrder;
      if (!draftOrder?.name) {
        console.error("[shopifyAdmin] Shopify returned no draft order:", json);
        return { ok: false, error: "no_draft_order_returned" };
      }

      return { ok: true, orderName: draftOrder.name };
    } catch (err) {
      console.error("[shopifyAdmin] draftOrderCreate request failed:", err);
      return { ok: false, error: "request_failed" };
    }
  });
