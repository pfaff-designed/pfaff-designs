import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pfaff-designs",
  description: "Generative UI portfolio project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

