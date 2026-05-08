import { Button, type ButtonProps } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { useRouter } from "@/lib/navigation";

export const ErrorBackButton = ({
  variant = "outline",
  children,
  ...props
}: ButtonProps) => {
  const router = useRouter();

  return (
    <Button variant={variant} onClick={() => router.back()} {...props}>
      {children ?? <TranslatedGoBackLabel />}
    </Button>
  );
};

function TranslatedGoBackLabel() {
  const t = useTranslations("common");

  return t("goBack");
}
