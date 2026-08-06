import { useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchProductByHandle, formatMoney } from "@/lib/shopify";
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

function ProductPage() {
  const { product } = Route.useLoaderData();
  const node = product.node;
  const variants = node.variants.edges.map((e) => e.node);
  const [variantId, setVariantId] = useState(
    (variants.find((v) => v.availableForSale) ?? variants[0])?.id,
  );
  const [imageIndex, setImageIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const images = node.images.edges.map((e) => e.node);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];

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
            <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
              {images[imageIndex] ? (
                <img src={images[imageIndex].url} alt={images[imageIndex].altText ?? node.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => setImageIndex(i)}
                    className={`h-16 w-16 overflow-hidden rounded border ${i === imageIndex ? "border-primary" : "border-border"}`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl">{node.title}</h1>
            <p className="mt-2 text-2xl text-primary">
              {variant ? formatMoney(variant.price.amount, variant.price.currencyCode) : null}
            </p>

            {variants.length > 1 && (
              <div className="mt-6">
                <p className="label-caps mb-2 text-xs text-muted-foreground">Options</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      disabled={!v.availableForSale}
                      className={`rounded border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                        v.id === variantId ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleAdd} disabled={isLoading || !variant?.availableForSale} className="label-caps mt-8 w-full" size="lg">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : variant?.availableForSale ? "Add to cart" : "Sold out"}
            </Button>

            {node.description && (
              <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{node.description}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
