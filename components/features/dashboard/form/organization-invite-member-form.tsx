import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { inviteOrganizationMemberAction } from "@/server-functions/organization.functions";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

const createOrganizationInviteMemberFormSchema = (
  t: ReturnType<typeof useTranslations>,
) =>
  z.object({
    role: z.enum(["admin", "member"]),
    email: z.email({ message: t("validation.emailInvalid") }),
  });

type OrganizationInviteMemberFormValues = z.infer<
  ReturnType<typeof createOrganizationInviteMemberFormSchema>
>;

type OrganizationInviteMemberFormProps = {
  organizationId: string;
  onCancelAction?: () => void;
  onSuccessAction?: () => void;
};

export const OrganizationInviteMemberForm = ({
  onCancelAction,
  organizationId,
  onSuccessAction,
}: OrganizationInviteMemberFormProps) => {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  const formSchema = useMemo(
    () => createOrganizationInviteMemberFormSchema(t),
    [t],
  );

  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<OrganizationInviteMemberFormValues>({
    resolver,
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { mutate, isPending: isSending } = useMutation({
    mutationFn: async (data: OrganizationInviteMemberFormValues) => {
      const result = await inviteOrganizationMemberAction({
        organizationId,
        role: data.role,
        email: data.email,
      });

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("invite.success"));
      form.reset({ email: "", role: "member" });
      onSuccessAction?.();
    },
    onError: (error: Error) => toast.error(error.message || t("invite.error")),
  });

  return (
    <Form
      form={form}
      disabled={isSending}
      className="space-y-4"
      onSubmit={async (v) => mutate(v)}
    >
      <DialogHeader>
        <DialogTitle>{t("invite.title")}</DialogTitle>
        <DialogDescription>{t("invite.description")}</DialogDescription>
      </DialogHeader>
      <FormField
        name="email"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("invite.email")}</FormLabel>
            <FormControl>
              <Input
                type="email"
                autoComplete="email"
                placeholder={t("invite.emailPlaceholder")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="role"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("invite.role")}</FormLabel>
            <Select
              value={field.value}
              disabled={isSending}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("invite.role")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="member">{t("roles.member")}</SelectItem>
                <SelectItem value="admin">{t("roles.admin")}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSending}
          onClick={onCancelAction}
        >
          {tCommon("cancel")}
        </Button>
        <FormButton loading={isSending} type="submit">
          {t("invite.send")}
        </FormButton>
      </DialogFooter>
    </Form>
  );
};
