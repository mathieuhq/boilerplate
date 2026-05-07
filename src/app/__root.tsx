import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { getMessages } from "@/i18n/messages";
import { routing } from "@/i18n/routing";
import { initGlitchTip } from "@/lib/glitchtip";
import { SEO_CONFIG } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";
import { Umami } from "@/lib/umami";
import { getRootI18n } from "@/server-functions/root.functions";
import { NotFoundView } from "@/views/errors/404";
import { InternalServerErrorView } from "@/views/errors/500";

import Providers from "./-providers";
import appCss from "./globals.css?url";

initGlitchTip();

export const Route = createRootRoute({
  loader: async () => getRootI18n(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SEO_CONFIG.home.title },
      { name: "description", content: SITE_CONFIG.SEO.DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
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
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
