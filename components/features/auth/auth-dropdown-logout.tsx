import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/ui/loader";
import { useTranslations } from "@/i18n";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";

export const AuthDropdownLogout = () => {
  const router = useRouter();

  const t = useTranslations("auth");

  const logout = useMutation({
    mutationFn: async () => signOut(),
    onSuccess: () => router.refresh(),
  });

  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        logout.mutate();
      }}
    >
      {logout.isPending ? (
        <Loader className="size-4" />
      ) : (
        <LogOut className="size-4" />
      )}
      <span>{t("logOut")}</span>
    </DropdownMenuItem>
  );
};
