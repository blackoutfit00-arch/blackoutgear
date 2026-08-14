import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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

      <SheetContent
        side="left"
        className="flex h-full w-full flex-col gap-0 border-none bg-white p-0 pt-6 text-black sm:max-w-sm [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Browse categories</SheetDescription>

        <SheetClose asChild>
          <button aria-label="Close menu" className="mb-4 ml-6 flex h-8 w-8 items-center justify-center text-black">
            <X className="h-7 w-7" strokeWidth={1.75} />
          </button>
        </SheetClose>

        <nav className="flex-1 overflow-y-auto px-6">
          <button
            onClick={() => { setIsOpen(false); navigate({ to: "/", search: { q: undefined } }); }}
            className="block w-full py-4 text-left text-3xl font-normal text-black transition-colors hover:text-neutral-500 sm:text-4xl"
          >
            Home
          </button>
          <button
            onClick={() => goToCategory(CATEGORIES.find((c) => c.slug === "all")!)}
            className="block w-full py-4 text-left text-3xl font-normal text-black transition-colors hover:text-neutral-500 sm:text-4xl"
          >
            All Products
          </button>
          {CATEGORIES.filter((c) => c.slug !== "all" && c.slug !== "offers").map((c) => (
            <button
              key={c.label}
              onClick={() => goToCategory(c)}
              className="block w-full py-4 text-left text-3xl font-normal text-black transition-colors hover:text-neutral-500 sm:text-4xl"
            >
              {c.label}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
