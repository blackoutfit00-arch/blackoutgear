import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import { STORE_NAME } from "@/config/store";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/bg-logo-header.png" alt={STORE_NAME} className="h-9 w-auto object-contain" />
          {/* Store name removed per user request */}
        </Link>
        <CartDrawer />
      </div>
    </header>
  );
}
