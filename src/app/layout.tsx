import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdSlot from "@/components/ads/AdSlot";
import Container from "@/components/layout/Container";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "imoti.news — Новини за недвижими имоти",
  description:
    "Новини от пазара на недвижими имоти в България: цени, ипотеки, строителство, регулации и инвестиции.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bg" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <div className="py-4">
          <Container>
            <AdSlot position="header" />
          </Container>
        </div>
        <main className="flex-1">{children}</main>
        <div className="py-4">
          <Container>
            <AdSlot position="footer" />
          </Container>
        </div>
        <Footer />
      </body>
    </html>
  );
}
