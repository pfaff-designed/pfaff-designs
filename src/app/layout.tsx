import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { AIAnswerProvider } from "@/components/organisms/ai/AIAnswerContext";
import { SectionProvider } from "@/components/organisms/ai/SectionContext";
import { AiModalProvider, AiModalHost, AiHoverPillHost, FloatingAiButton } from "@/components/organisms/ai-modal";
import { CommandPaletteProvider } from "@/components/organisms/CommandPalette/CommandPaletteProvider";
import { ToastProvider } from "@/components/molecules/Toast";

export const metadata: Metadata = {
  title: "pfaff-designs",
  description: "Generative UI portfolio project",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          defer
          data-domain="pfaff.design"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        <ToastProvider>
          <AiModalProvider>
          <AIAnswerProvider>
            <SectionProvider>
              <Header />
              {children}
              <Footer />
            </SectionProvider>
          </AIAnswerProvider>
            {/* Global AI modal host - rendered once at root */}
            <AiModalHost />
            {/* Global AI hover pill host - tracks cursor/touch on AI-interactive regions */}
            <AiHoverPillHost />
            {/* Global floating AI button - mobile-only FAB in bottom-right */}
            {/* <FloatingAiButton /> */}
            {/* Global command palette - Cmd+K / Ctrl+K */}
            <CommandPaletteProvider />
          </AiModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

