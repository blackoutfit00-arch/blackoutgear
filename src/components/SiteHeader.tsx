import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import { SiteMenu } from "@/components/SiteMenu";
import { STORE_NAME } from "@/config/store";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-4 py-4">
        <div className="flex items-center">
          <SiteMenu />
        </div>
        <Link to="/" className="flex items-center justify-center">
          <img src="/vue-logo.png" alt={STORE_NAME} className="h-9 w-auto object-contain" />
        </Link>
        <div className="flex items-center justify-end gap-2">
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
