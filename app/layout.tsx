import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-anek",
  display: "swap",
});
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
  display: "swap",
});

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
    <html lang="bn" className={`${inter.variable} ${anekBangla.variable} ${bebasNeue.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
