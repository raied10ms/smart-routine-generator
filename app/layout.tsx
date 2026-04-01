import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSC 27 Smart Routine — 10 Minute School",
  description: "তোমার SSC 27 রুটিন তৈরি করো মাত্র ৩ মিনিটে",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
