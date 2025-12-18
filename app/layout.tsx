import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SEO_CONFIG } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";

import Providers from "./providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.SERVER.PROD_URL),
  title: {
    default: SEO_CONFIG.home.title,
    template: `%s | ${SITE_CONFIG.TITLE}`,
  },
  creator: SITE_CONFIG.MAKER,
  authors: [{ name: SITE_CONFIG.MAKER }],
  description: SEO_CONFIG.home.description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.TITLE,
    title: SEO_CONFIG.home.title,
    url: SITE_CONFIG.SERVER.PROD_URL,
    description: SEO_CONFIG.home.description,
    locale: SITE_CONFIG.LANGUAGE.replace("-", "_"),
    images: [
      {
        width: 1200,
        height: 630,
        url: "/og-image.png",
        alt: SITE_CONFIG.TITLE,
      },
    ],
  },
  twitter: {
    images: ["/og-image.png"],
    card: "summary_large_image",
    title: SEO_CONFIG.home.title,
    description: SEO_CONFIG.home.description,
    creator: SITE_CONFIG.SOCIAL.TWITTER_HANDLE,
  },
  robots: {
    index: process.env.NODE_ENV === "production",
    follow: process.env.NODE_ENV === "production",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={SITE_CONFIG.LANGUAGE} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
