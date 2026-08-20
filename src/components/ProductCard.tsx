import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney, type ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";

export function ProductCard({ product, compact = false }: { product: ShopifyProduct; compact?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const node = product.node;
  const image = node.images?.edges?.[0]?.node;
  const variants = node.variants.edges.map((e) => e.node);
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const price = node.priceRange.minVariantPrice;
  const hasOptions = node.options.some((o) => o.values.length > 1);

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

  if (compact) {
    return (
      <article className="group w-[190px] shrink-0 sm:w-[210px] lg:w-[220px]">
        <Link to="/product/$handle" params={{ handle: node.handle }} className="block overflow-hidden rounded-2xl bg-[#e9e1d0] aspect-square">
          {image ? (
            <img src={image.url} alt={image.altText ?? node.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#122b4b]/50">No image</div>
          )}
        </Link>
        <Link to="/product/$handle" params={{ handle: node.handle }} className="block px-1 pt-3">
          <h3 className="truncate font-display text-sm italic text-[#122b4b]">{node.title}</h3>
          <p className="mt-1 text-sm font-semibold text-[#122b4b]">{formatMoney(price.amount, price.currencyCode)}</p>
        </Link>
      </article>
    );
  }

  return (
    <article className="group min-w-0">
      <Link
        to="/product/$handle"
        params={{ handle: node.handle }}
        className="block aspect-square overflow-hidden bg-[#e9e1d0]"
      >
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? node.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#122b4b]/50">No image</div>
        )}
      </Link>

      <div className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <Link to="/product/$handle" params={{ handle: node.handle }} className="min-w-0">
            <h3 className="truncate font-display text-xl italic text-[#122b4b] sm:text-2xl">
              {node.title}
            </h3>
          </Link>
          <p className="shrink-0 text-lg font-medium text-[#122b4b] sm:text-xl">
            {formatMoney(price.amount, price.currencyCode)}
          </p>
        </div>

        <p className="mt-2 min-h-5 truncate text-xs uppercase tracking-[0.22em] text-[#122b4b]/50">
          {node.description?.replace(/<[^>]*>/g, " ").trim() || "Blackout Gear"}
        </p>

        {hasOptions ? (
          <Link
            to="/product/$handle"
            params={{ handle: node.handle }}
            className="mt-5 flex h-14 w-full items-center justify-center border border-[#122b4b] bg-transparent text-[11px] font-semibold uppercase tracking-[0.18em] text-[#122b4b] transition-colors hover:bg-[#122b4b] hover:text-[#f5efe2]"
          >
            View product
          </Link>
        ) : (
          <button
            onClick={handleAdd}
            disabled={isLoading || !firstAvailable?.availableForSale}
            className="mt-5 flex h-14 w-full items-center justify-center border border-[#122b4b] bg-transparent text-[11px] font-semibold uppercase tracking-[0.18em] text-[#122b4b] transition-colors hover:bg-[#122b4b] hover:text-[#f5efe2] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#122b4b]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : firstAvailable?.availableForSale ? "Add to Bag" : "Sold out"}
          </button>
        )}
      </div>
    </article>
  );
}
