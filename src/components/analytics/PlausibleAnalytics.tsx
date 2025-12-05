"use client";

import Script from "next/script";

export function PlausibleAnalytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  if (!domain) {
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


