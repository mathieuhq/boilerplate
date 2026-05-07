import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { Organization, WebSite, WithContext } from "schema-dts";

import { JsonLd } from "@/components/seo/json-ld";
import { getMessages } from "@/i18n/messages";
import { routing } from "@/i18n/routing";
import { SEO_CONFIG } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";
import { Umami } from "@/lib/umami";
import { getRootI18n } from "@/server-functions/root.functions";
import { NotFoundView } from "@/views/errors/404";
import { InternalServerErrorView } from "@/views/errors/500";

import Providers from "./-providers";
import appCss from "./globals.css?url";

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
  "@type": "WebSite",
  name: SITE_CONFIG.TITLE,
  inLanguage: SITE_CONFIG.LANGUAGE,
  url: SITE_CONFIG.SERVER.PROD_URL,
  "@context": "https://schema.org",
  description: SITE_CONFIG.SEO.DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: SITE_CONFIG.TITLE,
  },
};

export const Route = createRootRoute({
  loader: async () => getRootI18n(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SEO_CONFIG.home.title },
      { name: "description", content: SITE_CONFIG.SEO.DESCRIPTION },
      { name: "creator", content: SITE_CONFIG.MAKER.NAME },
      {
        name: "keywords",
        content: SITE_CONFIG.SEO.KEYWORDS.join(", "),
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_CONFIG.TITLE },
      { property: "og:title", content: SEO_CONFIG.home.title },
      { property: "og:url", content: SITE_CONFIG.SERVER.PROD_URL },
      { property: "og:description", content: SITE_CONFIG.SEO.DESCRIPTION },
      {
        property: "og:locale",
        content: SITE_CONFIG.LANGUAGE.replace("-", "_"),
      },
      { property: "og:image", content: "/opengraph-image" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO_CONFIG.home.title },
      { name: "twitter:image", content: "/opengraph-image" },
      {
        name: "twitter:description",
        content: SITE_CONFIG.SEO.DESCRIPTION,
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "canonical", href: SITE_CONFIG.SERVER.PROD_URL },
    ],
  }),
  component: RootComponent,
  errorComponent: () => (
    <RootDocument lang={routing.defaultLocale}>
      <Providers
        locale={routing.defaultLocale}
        messages={getMessages(routing.defaultLocale)}
      >
        <InternalServerErrorView />
      </Providers>
    </RootDocument>
  ),
  notFoundComponent: () => (
    <RootDocument lang={routing.defaultLocale}>
      <Providers
        locale={routing.defaultLocale}
        messages={getMessages(routing.defaultLocale)}
      >
        <NotFoundView />
      </Providers>
    </RootDocument>
  ),
});

function RootComponent() {
  const { locale, messages } = Route.useLoaderData();

  return (
    <RootDocument lang={locale}>
      <Providers locale={locale} messages={messages}>
        <Outlet />
      </Providers>
    </RootDocument>
  );
}

function RootDocument({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
        <Umami />
        <JsonLd data={websiteJsonLd} />
        <JsonLd data={organizationJsonLd} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
