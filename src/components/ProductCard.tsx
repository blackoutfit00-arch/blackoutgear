import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney, type ShopifyProduct } from "@/lib/shopify";
import { STORE_NAME } from "@/config/store";
import { toast } from "sonner";

function amountOf(amount: string | number) {
  return typeof amount === "string" ? parseFloat(amount) : amount;
}

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const node = product.node;
  const image = node.images?.edges?.[0]?.node;
  const variants = node.variants.edges.map((e) => e.node);
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const price = node.priceRange.minVariantPrice;
  const comparePrice = node.compareAtPriceRange?.minVariantPrice;
  const showCompare = !!comparePrice && amountOf(comparePrice.amount) > amountOf(price.amount);
  const hasOptions = node.options.some((o) => o.values.length > 1);
  const isBestSeller =
    (node.tags ?? []).some((tag) => /best\s*seller/i.test(tag)) || /best/i.test(node.title);

  const handleAdd = async () => {
    if (!firstAvailable) return;
    await addItem({
      product,
      variantId: firstAvailable.id,
      variantTitle: firstAvailable.title,
      price: firstAvailable.price,
      quantity: 1,
      selectedOptions: firstAvailable.selectedOptions || [],
    });
    toast.success("Added to cart", { description: node.title });
  };

  return (
    <article className="group min-w-0">
      <Link
        to="/product/$handle"
        params={{ handle: node.handle }}
        className="relative block aspect-square overflow-hidden rounded-[4px] bg-[#f5f3ef] shadow-[0_10px_26px_rgba(0,0,0,0.12)]"
      >
        {isBestSeller && (
          <span className="absolute left-0 top-0 z-10 rounded-br-3xl bg-[#4d9d62] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:px-5 sm:text-xs">
            Best seller
          </span>
        )}
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? node.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#343532]/50">
            No image
          </div>
        )}
      </Link>

      <div className="pt-5 text-[#f4eee3]">
        <div className="flex items-start justify-between gap-4">
          <Link to="/product/$handle" params={{ handle: node.handle }} className="min-w-0">
            <h3 className="truncate font-display text-xl italic text-[#f4eee3] sm:text-2xl">
              {node.title}
            </h3>
          </Link>
          <p className="shrink-0 text-lg font-medium text-[#f4eee3] sm:text-xl">
            {showCompare ? (
              <>
                <span className="mr-1 text-xs text-[#f4eee3]/60 line-through">
                  {formatMoney(comparePrice.amount, comparePrice.currencyCode)}
                </span>
                {formatMoney(price.amount, price.currencyCode)}
              </>
            ) : (
              formatMoney(price.amount, price.currencyCode)
            )}
          </p>
        </div>

        <p className="mt-2 min-h-5 truncate text-xs uppercase tracking-[0.22em] text-[#f4eee3]/55">
          {node.description?.replace(/<[^>]*>/g, " ").trim() || STORE_NAME}
        </p>

        {hasOptions ? (
          <Link
            to="/product/$handle"
            params={{ handle: node.handle }}
            className="mt-5 flex h-14 w-full items-center justify-center border border-[#f4eee3]/80 bg-transparent text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4eee3] transition-colors hover:bg-[#f4eee3] hover:text-[#343532]"
          >
            View product
          </Link>
        ) : (
          <button
            onClick={handleAdd}
            disabled={isLoading || !firstAvailable?.availableForSale}
            className="mt-5 flex h-14 w-full items-center justify-center border border-[#f4eee3]/80 bg-transparent text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4eee3] transition-colors hover:bg-[#f4eee3] hover:text-[#343532] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#f4eee3]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : firstAvailable?.availableForSale ? (
              "Add to Bag"
            ) : (
              "Sold out"
            )}
          </button>
        )}
      </div>
    </article>
  );
}
