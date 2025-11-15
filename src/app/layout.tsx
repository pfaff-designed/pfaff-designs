import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/page-components/Header";
import { Footer } from "@/components/page-components/Footer";

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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

