import { useMemo, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchProductByHandle, formatMoney, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$handle")({
  loader: async ({ params }) => {
    const product = await fetchProductByHandle(params.handle);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.product?.node.title ?? "Product";
    const description = (loaderData?.product?.node.description ?? "").slice(0, 150) || "Gym apparel and lifting gear delivered in Bahrain.";
    return {
      meta: [
        { title: `${title} — Blackout Gear` },
        { name: "description", content: description },
        { property: "og:title", content: `${title} — Blackout Gear` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL", "XXXXL", "5XL"];

function sizeRank(value: string) {
  const upper = value.trim().toUpperCase();
  const index = SIZE_ORDER.indexOf(upper);
  if (index !== -1) return index;
  const num = parseFloat(value);
  if (!isNaN(num)) return 100 + num;
  return 1000;
}

function sortValues(values: string[], optionName: string) {
  const name = optionName.toLowerCase();
  if (name.includes("size") || name.includes("مقاس") || name.includes("size")) {
    return [...values].sort((a, b) => sizeRank(a) - sizeRank(b));
  }
  return values;
}

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: ShopifyProduct };
  const node = product.node;
  const variants = node.variants.edges.map((e) => e.node);
  const options = node.options ?? [];

  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const initialSelections = useMemo(() => {
    const map: Record<string, string> = {};
    for (const opt of firstAvailable?.selectedOptions ?? []) {
      map[opt.name] = opt.value;
    }
    return map;
  }, [firstAvailable]);

  const [selections, setSelections] = useState<Record<string, string>>(initialSelections);
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  const images = node.images.edges.map((e) => e.node);

  const variant = useMemo(() => {
    return (
      variants.find((v) => v.selectedOptions.every((opt) => selections[opt.name] === opt.value)) ??
      variants[0]
    );
  }, [variants, selections]);

  const handleSelect = (optionName: string, value: string) => {
    const next = { ...selections, [optionName]: value };
    const matched = variants.find((v) =>
      v.selectedOptions.every((opt) => next[opt.name] === opt.value),
    );
    if (matched) {
      setSelections(next);
    }
  };

  const handleAdd = async () => {
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("Added to cart", { position: "top-center", description: node.title });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/" className="label-caps mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-md border border-border bg-muted"
              onMouseEnter={() => setZoomActive(true)}
              onMouseLeave={() => setZoomActive(false)}
              onMouseMove={handleImageMouseMove}
              onClick={() => setLightboxOpen(true)}
            >
              {images[imageIndex] ? (
                <img
                  src={images[imageIndex].url}
                  alt={images[imageIndex].altText ?? node.title}
                  className="h-full w-full object-cover transition-transform duration-150 ease-out"
                  style={
                    zoomActive
                      ? { transform: "scale(2)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                      : undefined
                  }
                />
              ) : null}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => setImageIndex(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded border ${i === imageIndex ? "border-primary" : "border-border"}`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {lightboxOpen && images[imageIndex] && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute right-4 top-4 text-3xl leading-none text-white/80 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
              <img
                src={images[imageIndex].url}
                alt={images[imageIndex].altText ?? node.title}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div>
            <h1 className="text-4xl">{node.title}</h1>
            <p className="mt-2 text-2xl text-primary">
              {variant ? formatMoney(variant.price.amount, variant.price.currencyCode) : null}
            </p>

            {options.length > 0 && (
              <div className="mt-6 space-y-5">
                {options.map((option) => {
                  const values = sortValues(option.values, option.name);
                  return (
                    <div key={option.name}>
                      <p className="label-caps mb-2 text-xs text-muted-foreground">{option.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => {
                          const isActive = selections[option.name] === value;
                          const isAvailable = variants.some(
                            (v) =>
                              v.availableForSale &&
                              v.selectedOptions.some((opt) => opt.name === option.name && opt.value === value) &&
                              v.selectedOptions.every((opt) =>
                                opt.name === option.name ? true : selections[opt.name] === opt.value,
                              ),
                          );
                          return (
                            <button
                              key={value}
                              onClick={() => handleSelect(option.name, value)}
                              disabled={!isAvailable}
                              className={`rounded border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                                isActive
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border text-muted-foreground hover:border-foreground/40"
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button onClick={handleAdd} disabled={isLoading || !variant?.availableForSale} className="label-caps mt-8 w-full" size="lg">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : variant?.availableForSale ? "Add to cart" : "Sold out"}
            </Button>

            {node.description && (
              <p
                dir="rtl"
                className="mt-8 whitespace-pre-line text-right text-sm leading-loose text-muted-foreground [&>br]:block [&>br]:content-[''] [&>br]:mt-2"
                style={{ lineHeight: 2 }}
              >
                {node.description}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
