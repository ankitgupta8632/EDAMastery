import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Lodestar — your learning feed",
  description:
    "Paste any YouTube, Instagram, or web link. Lodestar curates it into a bounded daily feed aligned to your goals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <div className="mx-auto max-w-2xl pb-28">{children}</div>
        <NavBar />
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
