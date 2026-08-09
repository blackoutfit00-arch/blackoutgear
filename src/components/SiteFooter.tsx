import { Link } from "@tanstack/react-router";
import { STORE_NAME, WHATSAPP_NUMBER } from "@/config/store";

const INSTAGRAM_HANDLE = "blackoutgear.bh";

const CUSTOMER_CARE_LINKS = [
  { label: "FAQs", to: "/faq" as const },
  { label: "Returns & Replacements", to: "/returns" as const },
  { label: "Privacy Policy", to: "/privacy" as const },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card">
      <div className="relative mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3">
          <img src="/bg-logo.png" alt={STORE_NAME} className="h-7 w-auto object-contain" />
        </div>

        <h2 className="label-caps mt-4 text-lg text-foreground">{STORE_NAME}</h2>

        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div>
            <p className="label-caps text-xs text-muted-foreground">Customer Care</p>
            <ul className="mt-3 space-y-2">
              {CUSTOMER_CARE_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-foreground/90 hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-caps text-xs text-muted-foreground">Connect</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-foreground/90 hover:text-primary"
                >
                  WhatsApp ·&nbsp;
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-foreground/90 hover:text-primary"
                >
                  Instagram · @{INSTAGRAM_HANDLE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs italic text-muted-foreground">
          {STORE_NAME.toUpperCase()} is an independent retailer. All trademarks belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}
