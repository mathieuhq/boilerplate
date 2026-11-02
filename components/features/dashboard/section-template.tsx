import type { ReactNode } from "react";

type SectionTemplateProps = {
  title: string;
  nav?: ReactNode;
  children?: ReactNode;
  description?: string;
};

export const SectionTemplate = ({
  nav,
  title,
  children,
  description,
}: SectionTemplateProps) => {
  return (
    <div
      data-layout="fixed"
      className="flex flex-1 flex-col gap-6 overflow-hidden px-4 pt-6 md:px-6"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </header>
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-1 md:overflow-hidden lg:flex-row lg:gap-10">
        {nav && <aside className="shrink-0 lg:w-52">{nav}</aside>}
        <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
};
