import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, Dancing_Script } from "next/font/google";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripGain SME Outreach",
  description: "B2B Email Outreach Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hankenGrotesk.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <AppLayoutShell>
          {children}
        </AppLayoutShell>
      </body>
    </html>
  );
}
