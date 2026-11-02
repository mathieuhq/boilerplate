import { type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl tracking-tight">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription className="text-balance">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>{form}</CardContent>
      </Card>
      {footer && (
        <p className="px-6 text-center text-xs text-balance text-muted-foreground">
          {footer}
        </p>
      )}
    </>
  );
};
