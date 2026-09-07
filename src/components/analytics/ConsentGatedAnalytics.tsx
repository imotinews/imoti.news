"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CONSENT_EVENT } from "@/components/CookieConsent";

// Only fires GA's script once the visitor has actually accepted cookies --
// reads the same localStorage key CookieConsent writes, and stays in sync
// with it live (no page reload needed after clicking "Приемам всички").
export default function ConsentGatedAnalytics({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(window.localStorage.getItem("cookie-consent") === "accepted");

    function onChange(e: Event) {
      setConsented((e as CustomEvent<string>).detail === "accepted");
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!consented) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
