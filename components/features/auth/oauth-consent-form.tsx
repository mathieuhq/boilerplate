import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/features/form/form-button";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { getSignedOAuthQuery } from "@/shared/infrastructure/http/oauth-query";

const KNOWN_SCOPES = new Set(["openid", "profile", "email", "offline_access"]);

type OAuthConsentFormProps = {
  scopes: string[];
};

type OAuthConsentResponse = {
  redirect: boolean;
  url: string;
};

export const OAuthConsentForm = ({ scopes }: OAuthConsentFormProps) => {
  const t = useTranslations("auth");

  const consent = useMutation({
    mutationFn: async (accept: boolean) => {
      const oauthQuery = getSignedOAuthQuery(window.location.search);

      if (!oauthQuery) throw new Error(t("oauthConsentExpired"));

      const response = await authClient.$fetch<OAuthConsentResponse>(
        "/oauth2/consent",
        { method: "POST", body: { accept, oauth_query: oauthQuery } },
      );

      if (response.error) throw new Error(response.error.message);

      return response.data.url;
    },
    onSuccess: (url) => window.location.assign(url),
    onError: (error: Error) =>
      toast.error(error.message || t("oauthConsentError")),
  });

  const permissions = [
    t("oauthScopes.tools"),
    ...scopes
      .filter((scope) => KNOWN_SCOPES.has(scope))
      .map((scope) => t(`oauthScopes.${scope}`)),
  ];

  return (
    <div className="grid gap-4">
      <ul className="grid gap-2 text-sm">
        {permissions.map((permission) => (
          <li key={permission} className="flex items-start gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{permission}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <LoadingButton
          type="button"
          variant="outline"
          disabled={consent.isPending}
          loading={consent.isPending && consent.variables === false}
          onClick={() => consent.mutate(false)}
        >
          {t("oauthConsentDeny")}
        </LoadingButton>
        <LoadingButton
          type="button"
          disabled={consent.isPending}
          loading={consent.isPending && consent.variables === true}
          onClick={() => consent.mutate(true)}
        >
          {t("oauthConsentAllow")}
        </LoadingButton>
      </div>
    </div>
  );
};
