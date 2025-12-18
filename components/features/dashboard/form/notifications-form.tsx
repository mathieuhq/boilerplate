"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateNotificationPreferencesAction } from "@/actions/user/user.action";
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
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { NotificationType } from "@/lib/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

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
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      social_emails: user.notificationPreferences.social,
      security_emails: user.notificationPreferences.security,
      marketing_emails: user.notificationPreferences.marketing,
      type: user.notificationPreferences.type,
      communication_emails: user.notificationPreferences.communication,
    },
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: NotificationsFormValues) => {
      const result = await updateNotificationPreferencesAction(data);

      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }

      return result.data;
    },
    onSuccess: () =>
      toast.success("Notification preferences updated successfully!"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update notification preferences"),
  });

  return (
    <Form form={form} disabled={isSaving} onSubmit={async (v) => mutate(v)}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="relative space-y-2">
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroup
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-y-0 space-x-3">
                    <FormControl>
                      <RadioGroupItem value={NotificationType.ALL} />
                    </FormControl>
                    <FormLabel className="font-normal">
                      All new messages
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-y-0 space-x-3">
                    <FormControl>
                      <RadioGroupItem value={NotificationType.MENTIONS} />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Direct messages and mentions
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-y-0 space-x-3">
                    <FormControl>
                      <RadioGroupItem value={NotificationType.NONE} />
                    </FormControl>
                    <FormLabel className="font-normal">Nothing</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Choose which types of notifications you want to receive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="relative space-y-2">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="communication_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">
                      Communication emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about your account activity.
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">
                      Marketing emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and more.
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
              name="social_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Social emails</FormLabel>
                    <FormDescription>
                      Receive emails for friend requests, follows, and more.
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Security emails</FormLabel>
                    <FormDescription>
                      Receive emails about your account activity and security.
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
          Update notifications
        </FormButton>
      </div>
    </Form>
  );
};
