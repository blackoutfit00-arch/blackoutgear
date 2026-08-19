import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
        <Link to="/product/$handle" params={{ handle: node.handle }} className="block overflow-hidden rounded-2xl bg-muted aspect-square">
          {image ? (
            <img src={image.url} alt={image.altText ?? node.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </Link>
        <Link to="/product/$handle" params={{ handle: node.handle }} className="block px-1 pt-3">
          <h3 className="truncate text-sm font-medium text-foreground">{node.title}</h3>
          <p className="mt-1 text-sm font-semibold text-foreground">{formatMoney(price.amount, price.currencyCode)}</p>
        </Link>
      </article>
    );
  }

  return (
    <article className="group min-w-0">
      <Link
        to="/product/$handle"
        params={{ handle: node.handle }}
        className="block aspect-square overflow-hidden bg-muted"
      >
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? node.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
      </Link>

      <div className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <Link to="/product/$handle" params={{ handle: node.handle }} className="min-w-0">
            <h3 className="truncate text-xl font-normal tracking-tight text-foreground sm:text-2xl">
              {node.title}
            </h3>
          </Link>
          <p className="shrink-0 text-lg font-medium text-foreground sm:text-xl">
            {formatMoney(price.amount, price.currencyCode)}
          </p>
        </div>

        <p className="mt-2 min-h-5 truncate text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {node.description?.replace(/<[^>]*>/g, " ").trim() || "Blackout Gear"}
        </p>

        {hasOptions ? (
          <Button asChild className="mt-5 h-14 w-full rounded-none border border-border bg-transparent text-foreground shadow-none transition-colors hover:bg-white hover:text-black">
            <Link to="/product/$handle" params={{ handle: node.handle }} className="label-caps">
              View product
            </Link>
          </Button>
        ) : (
          <Button
            onClick={handleAdd}
            disabled={isLoading || !firstAvailable?.availableForSale}
            className="mt-5 h-14 w-full rounded-none border-0 bg-green-600 text-white shadow-none transition-colors hover:bg-green-700 disabled:bg-green-600 disabled:text-white disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : firstAvailable?.availableForSale ? "Add to cart" : "Sold out"}
          </Button>
        )}
      </div>
    </article>
  );
}
