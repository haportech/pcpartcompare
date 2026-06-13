import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PartCompare — PC Part Comparison",
  description: "Compare computer parts side by side — specs, benchmarks, and pricing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <a href="/compare" className="text-xl font-bold tracking-tight text-zinc-100">
              PartCompare
            </a>
            <span className="text-xs text-zinc-500">v0.1</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
