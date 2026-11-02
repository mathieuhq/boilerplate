import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { NotificationType } from "@/lib/generated/prisma/enums";
import { updateNotificationPreferencesAction } from "@/server-functions/user.functions";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

const notificationsFormSchema = z.object({
  security_emails: z.boolean(),
  type: z.enum(NotificationType),
  social_emails: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  communication_emails: z.boolean().optional(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

type NotificationsFormProps = {
  user: UserResponseDTO;
};

export const NotificationsForm = ({ user }: NotificationsFormProps) => {
  const t = useTranslations("settings.notifications");

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      type: user.notificationPreferences.type,
      social_emails: user.notificationPreferences.social,
      security_emails: user.notificationPreferences.security,
      marketing_emails: user.notificationPreferences.marketing,
      communication_emails: user.notificationPreferences.communication,
    },
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: NotificationsFormValues) => {
      const result = await updateNotificationPreferencesAction(data);

      return unwrapActionData(result);
    },
    onSuccess: () => toast.success(t("updateSuccess")),
    onError: (error: Error) => toast.error(error.message || t("updateError")),
  });

  return (
    <Form form={form} disabled={isSaving} onSubmit={async (v) => mutate(v)}>
      <div className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="gap-3">
              <FormLabel>{t("notifyAbout")}</FormLabel>
              <FormControl>
                <RadioGroup
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  className="gap-3"
                >
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <RadioGroupItem value={NotificationType.ALL} />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("allMessages")}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <RadioGroupItem value={NotificationType.MENTIONS} />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("directMessages")}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <RadioGroupItem value={NotificationType.NONE} />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("nothing")}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>{t("notificationTypeHelp")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          <h3 className="font-medium">{t("emailNotifications")}</h3>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="communication_emails"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>{t("communicationEmails")}</FormLabel>
                    <FormDescription>
                      {t("communicationEmailsDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>{t("marketingEmails")}</FormLabel>
                    <FormDescription>
                      {t("marketingEmailsDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="social_emails"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>{t("socialEmails")}</FormLabel>
                    <FormDescription>
                      {t("socialEmailsDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="security_emails"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>{t("securityEmails")}</FormLabel>
                    <FormDescription>
                      {t("securityEmailsDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormButton loading={isSaving} type="submit">
          {t("updateNotifications")}
        </FormButton>
      </div>
    </Form>
  );
};
