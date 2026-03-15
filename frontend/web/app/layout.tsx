import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Production-grade job application tracker for web and mobile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

