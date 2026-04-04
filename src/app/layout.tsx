import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppProvider } from "@/contexts/app-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { NavBar } from "@/components/layout/nav-bar";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EDAMastery",
  description: "Master Exploratory Data Analysis with guided, bite-sized lessons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full text-foreground" style={{ backgroundColor: '#121212', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
        <AppProvider>
          <TooltipProvider>
            <Header />
            <main className="pb-20"><ErrorBoundary>{children}</ErrorBoundary></main>
            <NavBar />
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
