import { type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, ShieldCheck } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";

import { LoadingButton } from "../../form/form-button";

type TwoFactorFormProps = {
  email: string;
  enabled: boolean;
  hasPassword: boolean;
};

type SetupState =
  | { step: "idle" }
  | { step: "verify"; totpURI: string; backupCodes: string[] }
  | { step: "backupCodes"; backupCodes: string[] };

const getTotpSecret = (totpURI: string) =>
  new URL(totpURI).searchParams.get("secret") ?? "";

export const TwoFactorForm = ({
  email,
  enabled,
  hasPassword,
}: TwoFactorFormProps) => {
  const router = useRouter();
  const t = useTranslations("settings.security");

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<SetupState>({ step: "idle" });

  const passwordPayload = hasPassword ? { password } : {};

  const enableMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.twoFactor.enable(passwordPayload);

      if (response.error) throw new Error(response.error.message);
      if (!("totpURI" in response.data))
        throw new Error(t("twoFactor.enableError"));

      return response.data;
    },
    onSuccess: (data) => {
      setPassword("");
      setSetup({
        step: "verify",
        totpURI: data.totpURI,
        backupCodes: data.backupCodes,
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || t("twoFactor.enableError")),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
      });

      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => {
      if (setup.step !== "verify") return;

      setCode("");
      setSetup({ step: "backupCodes", backupCodes: setup.backupCodes });
      toast.success(t("twoFactor.enabled"));
    },
    onError: (error: Error) =>
      toast.error(error.message || t("twoFactor.verifyError")),
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.twoFactor.disable(passwordPayload);

      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => {
      setPassword("");
      toast.success(t("twoFactor.disabled"));
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("twoFactor.disableError")),
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response =
        await authClient.twoFactor.generateBackupCodes(passwordPayload);

      if (response.error) throw new Error(response.error.message);
      if (!("totpURI" in response.data))
        throw new Error(t("twoFactor.enableError"));

      return response.data;
    },
    onSuccess: (data) => {
      setPassword("");
      setSetup({ step: "backupCodes", backupCodes: data.backupCodes });
    },
    onError: (error: Error) =>
      toast.error(error.message || t("twoFactor.regenerateError")),
  });

  const copyBackupCodes = async (backupCodes: string[]) => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success(t("twoFactor.copied"));
  };

  const finishSetup = () => {
    setSetup({ step: "idle" });
    router.refresh();
  };

  if (setup.step === "verify") {
    const secret = getTotpSecret(setup.totpURI);

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">{t("twoFactor.scan")}</p>
        <div className="w-fit rounded-md bg-white p-3">
          <QRCode value={setup.totpURI} size={160} />
        </div>
        <div className="space-y-1">
          <Label>{t("twoFactor.manualKey")}</Label>
          <code className="bg-muted block rounded-md px-3 py-2 font-mono text-sm break-all">
            {secret}
          </code>
        </div>
        <div className="space-y-1">
          <Label htmlFor="totp-code">{t("twoFactor.code")}</Label>
          <Input
            id="totp-code"
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <LoadingButton
            loading={verifyMutation.isPending}
            disabled={!/^\d{6}$/.test(code.trim())}
            onClick={() => verifyMutation.mutate()}
          >
            {t("twoFactor.verify")}
          </LoadingButton>
          <Button variant="ghost" onClick={() => setSetup({ step: "idle" })}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  if (setup.step === "backupCodes")
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {t("twoFactor.backupCodesHelp")}
        </p>
        <div className="bg-muted grid grid-cols-2 gap-2 rounded-md p-4 font-mono text-sm">
          {setup.backupCodes.map((backupCode) => (
            <span key={backupCode}>{backupCode}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => copyBackupCodes(setup.backupCodes)}
          >
            <Copy className="size-4" /> {t("twoFactor.copy")}
          </Button>
          <Button onClick={finishSetup}>{t("twoFactor.done")}</Button>
        </div>
      </div>
    );

  const isBusy =
    enableMutation.isPending ||
    disableMutation.isPending ||
    regenerateMutation.isPending;
  const canSubmit = !hasPassword || password.length > 0;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!enabled && canSubmit && !isBusy) enableMutation.mutate();
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input
        readOnly
        type="email"
        tabIndex={-1}
        aria-hidden="true"
        name="username"
        value={email}
        className="sr-only"
        autoComplete="username"
      />

      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4" />
        <span className="text-sm font-medium">{t("twoFactor.status")}</span>
        <Badge variant={enabled ? "default" : "secondary"}>
          {enabled ? t("twoFactor.on") : t("twoFactor.off")}
        </Badge>
      </div>

      {hasPassword && (
        <div className="space-y-1">
          <Label htmlFor="current-password">
            {t("twoFactor.passwordLabel")}
          </Label>
          <PasswordInput
            id="current-password"
            name="password"
            value={password}
            autoComplete="current-password"
            disabled={isBusy}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      )}

      {enabled ? (
        <div className="flex flex-wrap gap-2">
          <LoadingButton
            type="button"
            variant="outline"
            disabled={!canSubmit || isBusy}
            loading={regenerateMutation.isPending}
            onClick={() => regenerateMutation.mutate()}
          >
            {t("twoFactor.regenerate")}
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="destructive"
            disabled={!canSubmit || isBusy}
            loading={disableMutation.isPending}
            onClick={() => disableMutation.mutate()}
          >
            {t("twoFactor.disable")}
          </LoadingButton>
        </div>
      ) : (
        <LoadingButton
          type="submit"
          disabled={!canSubmit || isBusy}
          loading={enableMutation.isPending}
        >
          {t("twoFactor.enable")}
        </LoadingButton>
      )}
    </form>
  );
};
