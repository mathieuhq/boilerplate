import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";

import { LoadingButton } from "../../form/form-button";

export const PasskeysForm = () => {
  const t = useTranslations("settings.security.passkeys");

  const [name, setName] = useState("");
  const { data: passkeys, isPending: isLoading } = authClient.useListPasskeys();

  const addMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      });

      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => {
      setName("");
      toast.success(t("added"));
    },
    onError: (error: Error) => toast.error(error.message || t("addError")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authClient.passkey.deletePasskey({ id });

      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => toast.success(t("deleted")),
    onError: (error: Error) => toast.error(error.message || t("deleteError")),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : passkeys?.length ? (
        <ul className="divide-y rounded-md border">
          {passkeys.map((passkey) => (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-2 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="text-muted-foreground size-4" />
                <div>
                  <p className="text-sm font-medium">
                    {passkey.name ?? t("unnamed")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("createdAt", {
                      date: format(new Date(passkey.createdAt), "PP"),
                    })}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t("delete")}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(passkey.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}

      <div className="space-y-1">
        <Label htmlFor="passkey-name">{t("nameLabel")}</Label>
        <div className="flex gap-2">
          <Input
            id="passkey-name"
            value={name}
            placeholder={t("namePlaceholder")}
            disabled={addMutation.isPending}
            onChange={(event) => setName(event.target.value)}
          />
          <LoadingButton
            loading={addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {t("add")}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};
