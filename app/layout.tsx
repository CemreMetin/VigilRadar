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
    "A calm global risk monitor for earthquakes, conflict reports and sea straits, with a deterministic impact simulator. Not an official warning system.",
  manifest: "/manifest.webmanifest",
  // /icons/* is cached for a year (public/_headers): raise ?v= whenever an icon changes
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png?v=2", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/icon-192.png?v=2",
  },
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
