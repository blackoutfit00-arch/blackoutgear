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

// In-memory cache for the access token obtained via the Client Credentials
// Grant, so we don't request a new one on every single order (tokens are
// valid for ~24h). This is per server-process — fine for a low-traffic store.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAdminAccessToken(): Promise<string | null> {
  // Preferred: the Admin API token provisioned by the Shopify integration.
  const directToken =
    process.env["SHOPIFY_ACCESS_TOKEN"] ?? process.env["SHOPIFY_ADMIN_ACCESS_TOKEN"];
  if (directToken) return directToken;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env["SHOPIFY_APP_CLIENT_ID"];
  const clientSecret = process.env["SHOPIFY_APP_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    console.error("[shopifyAdmin] No Shopify Admin credentials available.");
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
      console.error("[shopifyAdmin] Failed to obtain access token:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const accessToken = json?.access_token as string | undefined;
    const expiresIn = (json?.expires_in as number | undefined) ?? 60 * 60 * 24; // default 24h
    if (!accessToken) {
      console.error("[shopifyAdmin] Token response missing access_token:", json);
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
 * Creates a Draft Order in Shopify Admin whenever a customer places an order
 * on the site. This does NOT charge or confirm anything automatically — it
 * just makes the order visible in Shopify Admin so it can be reviewed and
 * confirmed manually (same order details also go out over WhatsApp).
 *
 * Uses the OAuth 2.0 Client Credentials Grant: exchanges SHOPIFY_APP_CLIENT_ID
 * + SHOPIFY_APP_CLIENT_SECRET (server env vars, never sent to the browser)
 * for a short-lived Admin API access token on demand.
 */
export const createShopifyDraftOrder = createServerFn({ method: "POST" })
  .validator((data: DraftOrderPayload) => data)
  .handler(async ({ data }): Promise<DraftOrderResult> => {
    const token = await getAdminAccessToken();
    if (!token) {
      return { ok: false, error: "missing_token" };
    }

    const query = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id name invoiceUrl }
          userErrors { field message }
        }
      }
    `;

    const totalItems = data.lineItems.reduce((sum, li) => sum + li.quantity, 0);

    const noteLines = [
      `Customer: ${data.name}`,
      `Phone: ${data.phone}`,
      `Delivery address: ${data.address}`,
      data.notes ? `Notes: ${data.notes}` : null,
      "Source: Website order (pending confirmation via WhatsApp)",
    ].filter(Boolean);

    const input: Record<string, unknown> = {
      lineItems: data.lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
      note: noteLines.join("\n"),
      tags: ["Website"],
      useCustomerDefaultAddress: false,
    };

    if (data.discountPercent > 0) {
      input["appliedDiscount"] = {
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
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({ query, variables: { input } }),
        },
      );

      const json = await res.json();

      const userErrors = json?.data?.draftOrderCreate?.userErrors;
      if (userErrors?.length) {
        console.error("[shopifyAdmin] draftOrderCreate userErrors:", userErrors);
        return { ok: false, error: "user_errors" };
      }
      if (json.errors) {
        console.error("[shopifyAdmin] draftOrderCreate GraphQL errors:", json.errors);
        return { ok: false, error: "graphql_errors" };
      }

      const draftOrder = json?.data?.draftOrderCreate?.draftOrder;
      return { ok: true, orderName: draftOrder?.name };
    } catch (err) {
      console.error("[shopifyAdmin] draftOrderCreate request failed:", err);
      return { ok: false, error: "request_failed" };
    }
  });
