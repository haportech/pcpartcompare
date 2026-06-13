import type { Metadata } from "next";
import { Exo, Roboto_Mono } from "next/font/google";
import "./globals.css";

const exo = Exo({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
      className={`${exo.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#0F172A", color: "#F8FAFC" }}>
        <header style={{ borderBottom: "1px solid #1E293B", padding: "16px 24px" }}>
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <a href="/compare" className="text-xl font-bold tracking-tight" style={{ color: "#F8FAFC", fontFamily: "var(--font-exo)" }}>
              <span style={{ color: "#22C55E" }}>Part</span>Compare
            </a>
            <span className="text-xs" style={{ color: "#475569" }}>v0.1</span>
            <span className="ml-auto text-xs" style={{ color: "#475569" }}>
              {`${"39"}K+ parts`}
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
