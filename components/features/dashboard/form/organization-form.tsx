"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateOrganizationAction } from "@/actions/organization/organization.action";
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
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { FormButton } from "../../form/form-button";

import { OrganizationLogoForm } from "./organization-logo-form";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

type OrganizationFormProps = {
  organization: Organization;
};

export const OrganizationForm = ({ organization }: OrganizationFormProps) => {
  const router = useRouter();
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  const formSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(2, { message: t("validation.nameMinLength") })
          .max(100),
        slug: z
          .string()
          .min(2, { message: t("validation.slugRequired") })
          .max(50)
          .regex(/^[a-z0-9-]+$/, { message: t("validation.slugFormat") }),
      }),
    [t],
  );

  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await updateOrganizationAction({
        organizationId: organization.id,
        name: data.name,
        slug: data.slug,
      });

      if (!isActionSuccessful(result))
        throw new Error(getActionErrorMessage(result));

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("updateError")),
  });

  return (
    <div className="space-y-6">
      <OrganizationLogoForm
        organizationId={organization.id}
        organizationName={organization.name}
        currentLogo={organization.logo}
        onUploadSuccess={() => router.refresh()}
      />
      <Form
        form={form}
        disabled={isSaving}
        onSubmit={async (v) => mutate(v)}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("namePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("slug")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("slugPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormButton loading={isSaving} type="submit">
          {tCommon("updateOrganization")}
        </FormButton>
      </Form>
    </div>
  );
};
