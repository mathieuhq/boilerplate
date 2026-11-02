import { type ReactNode } from "react";

import { ErrorBackButton } from "@/components/features/error/error-back-button";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";

type ErrorTemplateProps = {
  title: string;
  code: string | number;
  description: ReactNode;
  goBackLabel?: ReactNode;
  backToHomeLabel?: ReactNode;
};

export function ErrorTemplate({
  code,
  title,
  description,
  goBackLabel,
  backToHomeLabel,
}: ErrorTemplateProps) {
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">{code}</h1>
        <span className="font-medium">{title}</span>
        <p className="text-center text-muted-foreground">{description}</p>
        <div className="mt-6 flex gap-4">
          <ErrorBackButton>{goBackLabel}</ErrorBackButton>

          <Link className={buttonVariants()} href="/">
            {backToHomeLabel ?? <TranslatedBackToHomeLabel />}
          </Link>
        </div>
      </div>
    </div>
  );
}

function TranslatedBackToHomeLabel() {
  const t = useTranslations("common");

  return t("backToHome");
}
