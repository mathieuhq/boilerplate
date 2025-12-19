import { type ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ErrorBackButton } from "@/components/features/error/error-back-button";
import { buttonVariants } from "@/components/ui/button";

type ErrorTemplateProps = {
  title: string;
  code: string | number;
  description: ReactNode;
};

export async function ErrorTemplate({
  code,
  title,
  description,
}: ErrorTemplateProps) {
  const t = await getTranslations("common");

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">{code}</h1>
        <span className="font-medium">{title}</span>
        <p className="text-muted-foreground text-center">{description}</p>
        <div className="mt-6 flex gap-4">
          <ErrorBackButton />

          <Link className={buttonVariants()} href="/">
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
