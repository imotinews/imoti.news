import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdSlotContainer from "@/components/ads/AdSlotContainer";
import Container from "@/components/layout/Container";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <>
      {adsenseClientId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      <Header />
      <div className="py-4">
        <Container>
          <AdSlotContainer position="header" />
        </Container>
      </div>
      <main className="flex-1">{children}</main>
      <div className="py-4">
        <Container>
          <AdSlotContainer position="footer" />
        </Container>
      </div>
      <Footer />
    </>
  );
}
