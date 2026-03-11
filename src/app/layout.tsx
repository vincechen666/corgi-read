import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CorgiRead",
  description: "English PDF reader for immersive study and AI retelling feedback.",
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
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
