import { type PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";

import { ThemeProvider } from "@/components/features/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SearchProvider } from "@/contexts/command-search.context";
import { I18nProvider, type Locale, type Messages } from "@/i18n";

const queryClient = new QueryClient();

type ProvidersProps = PropsWithChildren<{
  locale: Locale;
  messages: Messages;
}>;

export default function Providers({
  locale,
  messages,
  children,
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
    <I18nProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <MotionConfig
          reducedMotion="user"
          transition={{ type: "spring", bounce: 0, visualDuration: 0.3 }}
        >
          <QueryClientProvider client={queryClient}>
            <SearchProvider value={{ open, setOpen }}>
              <Toaster />
              {children}
            </SearchProvider>
          </QueryClientProvider>
        </MotionConfig>
      </ThemeProvider>
    </I18nProvider>
  );
}
