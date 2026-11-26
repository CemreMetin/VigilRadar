import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

// latin-ext carries the Turkish letters (İ, Ş, Ğ); without it they fall back to another font and look wrong in capitals
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "VigilRadar",
  description:
    "A calm, static analysis desk for large earthquakes and conflict events and their possible effect on nuclear plants and sea straits. Not an official warning system.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "VigilRadar", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#121110",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
