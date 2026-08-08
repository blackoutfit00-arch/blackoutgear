import { STORE_NAME, WHATSAPP_NUMBER } from "@/config/store";
import footerLogo from "@/assets/bg-logo-metallic.png.asset.json";

const INSTAGRAM_HANDLE = "blackoutgear.bh";

const CUSTOMER_CARE_LINKS = ["FAQs", "Returns & Replacements", "Privacy Policy"];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card">
      <img
        src="/bg-logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/2 hidden w-64 -translate-y-1/2 object-contain opacity-[0.06] sm:block"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3">
          <img src="/bg-logo.png" alt={STORE_NAME} className="h-10 w-auto object-contain" />
          <p className="label-caps text-xs text-muted-foreground">Sports Online Store · Bahrain</p>
        </div>

        <h2 className="label-caps mt-4 text-lg text-foreground">{STORE_NAME}</h2>

        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div>
            <p className="label-caps text-xs text-muted-foreground">Customer Care</p>
            <ul className="mt-3 space-y-2">
              {CUSTOMER_CARE_LINKS.map((label) => (
                <li key={label} className="text-sm text-foreground/90">
                  {label}
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
                  WhatsApp · +{WHATSAPP_NUMBER.slice(0, 3)} {WHATSAPP_NUMBER.slice(3)}
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
