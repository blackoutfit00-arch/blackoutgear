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
      <article className="group w-[calc((100vw-3.5rem)/2)] shrink-0 sm:w-[260px] lg:w-[300px]">
        <Link to="/product/$handle" params={{ handle: node.handle }} className="block aspect-[3/4] overflow-hidden rounded-sm bg-muted">
          {image ? (
            <img src={image.url} alt={image.altText ?? node.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </Link>
        <Link to="/product/$handle" params={{ handle: node.handle }} className="block pt-4">
          <h3 className="truncate text-[11px] font-semibold uppercase text-foreground sm:text-xs">{node.title}</h3>
          <p className="mt-1.5 text-[13px] font-light text-foreground sm:text-sm">{formatMoney(price.amount, price.currencyCode)}</p>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-foreground/60">
      <Link to="/product/$handle" params={{ handle: node.handle }} className="block aspect-square overflow-hidden bg-muted">
        {image ? (
          <img src={image.url} alt={image.altText ?? node.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link to="/product/$handle" params={{ handle: node.handle }} className="flex-1">
          <h3 className="text-lg leading-tight">{node.title}</h3>
          <p className="mt-1 text-base font-semibold text-foreground">{formatMoney(price.amount, price.currencyCode)}</p>
        </Link>
        {hasOptions ? (
          <Button asChild className="label-caps border-0 bg-primary text-primary-foreground transition-colors hover:bg-primary/85">
            <Link to="/product/$handle" params={{ handle: node.handle }}>View product</Link>
          </Button>
        ) : (
          <Button onClick={handleAdd} disabled={isLoading || !firstAvailable?.availableForSale} className="label-caps border-0 bg-primary text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : firstAvailable?.availableForSale ? "Add to cart" : "Sold out"}
          </Button>
        )}
      </div>
    </article>
  );
}
