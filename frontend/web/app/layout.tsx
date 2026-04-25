import "./globals.css";
import type { Metadata } from "next";

import { ApiWarmup } from "@/components/api-warmup";
import { API_READY_URL } from "@/lib/api-base-url";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Production-grade job application tracker for web and mobile.",
};

function warmApiInBackground() {
  void fetch(API_READY_URL, {
    cache: "no-store",
  }).catch(() => {
    // Interactive API calls already handle backend readiness and retries.
  });
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  warmApiInBackground();

  return (
    <html lang="en">
      <body>
        <ApiWarmup />
        {children}
      </body>
    </html>
  );
}

