import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { CATEGORIES } from "@/config/categories";

export function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const goToCategory = (category: (typeof CATEGORIES)[number]) => {
    setIsOpen(false);
    navigate({ to: "/category/$slug", params: { slug: category.slug } });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex h-full w-full flex-col gap-0 p-0 pt-10 sm:max-w-sm [&>button]:hidden">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Browse categories</SheetDescription>

        <nav className="flex-1 overflow-y-auto px-4 py-2">
          <button
            onClick={() => { setIsOpen(false); navigate({ to: "/", search: { q: undefined } }); }}
            className="label-caps block w-full py-5 text-left text-2xl tracking-wide text-foreground transition-colors hover:text-primary sm:text-3xl"
          >
            Home
          </button>
          <button
            onClick={() => goToCategory(CATEGORIES.find((c) => c.slug === "all")!)}
            className="label-caps block w-full py-5 text-left text-2xl tracking-wide text-foreground transition-colors hover:text-primary sm:text-3xl"
          >
            All Products
          </button>
          {CATEGORIES.filter((c) => c.slug !== "all" && c.slug !== "offers").map((c) => (
            <button
              key={c.label}
              onClick={() => goToCategory(c)}
              className="label-caps block w-full py-5 text-left text-2xl tracking-wide text-foreground transition-colors hover:text-primary sm:text-3xl"
            >
              {c.label}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
