import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corgi Read",
  description: "English PDF reader for immersive study and AI retelling feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
