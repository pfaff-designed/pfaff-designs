import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/page-components/Header";
import { Footer } from "@/components/page-components/Footer";
import { AIAnswerProvider } from "@/components/ai/AIAnswerContext";
import { SectionProvider } from "@/components/ai/SectionContext";
import { AiModalProvider, AiModalHost, AiHoverPillHost, FloatingAiButton } from "@/components/ai-modal";

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
          <FloatingAiButton />
        </AiModalProvider>
      </body>
    </html>
  );
}

