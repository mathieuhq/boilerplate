import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CodeBlock } from "@/components/features/mcp/code-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ApiKeyDTO,
  ApiKeyListDTO,
} from "@/features/auth/application/dto/api-key.dto";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/server-functions/api-key.functions";

import { LoadingButton } from "../../form/form-button";

export const ApiKeysForm = ({ apiKeys, canManage }: ApiKeyListDTO) => {
  const t = useTranslations("settings.apiKeys");
  const router = useRouter();

  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () =>
      unwrapActionData(await createApiKeyAction({ name: name.trim() })),
    onSuccess: ({ key }) => {
      setName("");
      setCreatedKey(key);
      toast.success(t("created"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("createError")),
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) =>
      unwrapActionData(await revokeApiKeyAction({ keyId })),
    onSuccess: () => {
      toast.success(t("revoked"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("revokeError")),
  });

  return (
    <div className="space-y-4">
      {createdKey && (
        <div className="space-y-2 rounded-md border p-4">
          <p className="text-sm font-medium">{t("createdTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("createdDescription")}
          </p>
          <CodeBlock code={createdKey} />
          <Button variant="outline" onClick={() => setCreatedKey(null)}>
            {t("done")}
          </Button>
        </div>
      )}

      {apiKeys.length ? (
        <ul className="divide-y rounded-md border">
          {apiKeys.map((apiKey) => (
            <ApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              canRevoke={canManage}
              pending={revokeMutation.isPending}
              onRevoke={() => revokeMutation.mutate(apiKey.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {canManage ? (
        <form
          className="space-y-1"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Label htmlFor="api-key-name">{t("nameLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="api-key-name"
              value={name}
              maxLength={64}
              placeholder={t("namePlaceholder")}
              disabled={createMutation.isPending}
              onChange={(event) => setName(event.target.value)}
            />
            <LoadingButton
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              loading={createMutation.isPending}
            >
              {t("create")}
            </LoadingButton>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("impersonating")}</p>
      )}
    </div>
  );
};

const ApiKeyRow = ({
  apiKey,
  canRevoke,
  pending,
  onRevoke,
}: {
  apiKey: ApiKeyDTO;
  canRevoke: boolean;
  pending: boolean;
  onRevoke: () => void;
}) => {
  const t = useTranslations("settings.apiKeys");

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <KeyRound className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {apiKey.name ?? t("unnamed")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[
              apiKey.start && `${apiKey.start}…`,
              t("createdAt", {
                date: format(new Date(apiKey.createdAt), "PP"),
              }),
              apiKey.lastUsedAt
                ? t("lastUsed", {
                    date: format(new Date(apiKey.lastUsedAt), "PPp"),
                  })
                : t("neverUsed"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      {canRevoke && (
        <Button
          size="icon"
          variant="ghost"
          title={t("revoke")}
          aria-label={t("revoke")}
          disabled={pending}
          onClick={onRevoke}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
};
