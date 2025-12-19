"use client";

import { type PropsWithChildren, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { SearchProvider } from "@/contexts/command-search.context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

type ProvidersProps = PropsWithChildren<{
  locale: string;
  messages: IntlMessages;
}>;

export default function Providers({
  children,
  locale,
  messages,
}: ProvidersProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Paris"
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SearchProvider value={{ open, setOpen }}>
          <QueryClientProvider client={queryClient}>
            <Toaster />
            {children}
          </QueryClientProvider>
        </SearchProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
