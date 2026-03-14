import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RockASK",
  description: "Enterprise RAG dashboard starter for RockASK.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
