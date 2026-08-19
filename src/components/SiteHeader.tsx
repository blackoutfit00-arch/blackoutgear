import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import { STORE_NAME } from "@/config/store";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <img src="/vue-logo.png" alt={STORE_NAME} className="h-9 w-auto object-contain" />
        </Link>
        <div className="absolute right-4 sm:right-6">
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
