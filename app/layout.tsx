import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import type { Organization, WebSite, WithContext } from "schema-dts";

import { JsonLd } from "@/components/seo/json-ld";
import { SEO_CONFIG } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";
import { Umami } from "@/lib/umami";

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
  creator: SITE_CONFIG.MAKER.NAME,
  keywords: [...SITE_CONFIG.SEO.KEYWORDS],
  description: SITE_CONFIG.SEO.DESCRIPTION,
  authors: [{ name: SITE_CONFIG.MAKER.NAME }],
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: SITE_CONFIG.SERVER.PROD_URL,
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.TITLE,
    title: SEO_CONFIG.home.title,
    url: SITE_CONFIG.SERVER.PROD_URL,
    description: SITE_CONFIG.SEO.DESCRIPTION,
    locale: SITE_CONFIG.LANGUAGE.replace("-", "_"),
    images: [
      {
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.TITLE,
        url: "/opengraph-image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: SEO_CONFIG.home.title,
    site: SITE_CONFIG.SOCIAL.X.HANDLE,
    creator: SITE_CONFIG.SOCIAL.X.HANDLE,
    description: SITE_CONFIG.SEO.DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-video-preview": -1,
      "max-image-preview": "large",
    },
  },
};

const organizationJsonLd: WithContext<Organization> = {
  "@type": "Organization",
  name: SITE_CONFIG.TITLE,
  url: SITE_CONFIG.SERVER.PROD_URL,
  "@context": "https://schema.org",
  description: SITE_CONFIG.SEO.DESCRIPTION,
  logo: `${SITE_CONFIG.SERVER.PROD_URL}${SITE_CONFIG.LOGO}`,
  founder: {
    "@type": "Person",
    name: SITE_CONFIG.MAKER.NAME,
  },
  sameAs: [
    SITE_CONFIG.SOCIAL.X.URL,
    SITE_CONFIG.SOCIAL.LINKEDIN.URL,
    SITE_CONFIG.SOCIAL.INSTAGRAM.URL,
  ],
};

const websiteJsonLd: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_CONFIG.TITLE,
  url: SITE_CONFIG.SERVER.PROD_URL,
  description: SITE_CONFIG.SEO.DESCRIPTION,
  inLanguage: SITE_CONFIG.LANGUAGE,
  publisher: {
    "@type": "Organization",
    name: SITE_CONFIG.TITLE,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = (await getMessages()) as IntlMessages;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Umami />
        <JsonLd data={websiteJsonLd} />
        <JsonLd data={organizationJsonLd} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
