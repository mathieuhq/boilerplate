import { type ReactNode } from "react";

type AuthTemplateProps = {
  title: string;
  form: ReactNode;
  footer?: ReactNode;
  description: ReactNode;
};

export const AuthTemplate = ({
  form,
  title,
  footer,
  description,
}: AuthTemplateProps) => {
  return (
    <>
      <div className="mb-2 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {form}
      {footer && (
        <p className="text-muted-foreground mt-4 px-8 text-center text-sm">
          {footer}
        </p>
      )}
    </>
  );
};
