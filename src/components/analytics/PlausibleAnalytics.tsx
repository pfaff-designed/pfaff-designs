"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PlausibleAnalytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const pathname = usePathname();
  const hasDomain = Boolean(domain);

  useEffect(() => {
    if (!hasDomain) return;
    if (typeof window === "undefined") return;
    const plausible = (window as unknown as { plausible?: (event: string, opts?: any) => void }).plausible;
    if (typeof plausible !== "function") return;
    plausible("pageview");
  }, [hasDomain, pathname]);

  if (!hasDomain) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analytics] NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not set; Plausible will be disabled.");
    }
    return null;
  }

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.tagged-events.js"
      strategy="afterInteractive"
    />
  );
}


