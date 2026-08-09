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

/**
 * Creates a Draft Order in Shopify Admin whenever a customer places an order
 * on the site. This does NOT charge or confirm anything automatically — it
 * just makes the order visible in Shopify Admin so it can be reviewed and
 * confirmed manually (same order details also go out over WhatsApp).
 *
 * Requires SHOPIFY_ADMIN_API_TOKEN to be set as a server environment
 * variable (never exposed to the browser). Created via a custom app in
 * Shopify Admin → Settings → Apps and sales channels → Develop apps, with
 * the write_draft_orders scope.
 */
export const createShopifyDraftOrder = createServerFn({ method: "POST" })
  .validator((data: DraftOrderPayload) => data)
  .handler(async ({ data }): Promise<DraftOrderResult> => {
    const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
    if (!token) {
      console.error("[shopifyAdmin] SHOPIFY_ADMIN_API_TOKEN is not set — skipping draft order creation.");
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
