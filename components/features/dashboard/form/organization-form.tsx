import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { updateOrganizationAction } from "@/server-functions/organization.functions";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

import { OrganizationLogoForm } from "./organization-logo-form";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logoUrl?: string | null;
};

const createOrganizationFormSchema = (t: ReturnType<typeof useTranslations>) =>
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
  });

type OrganizationFormValues = z.infer<
  ReturnType<typeof createOrganizationFormSchema>
>;

type OrganizationFormProps = {
  organization: Organization;
};

export const OrganizationForm = ({ organization }: OrganizationFormProps) => {
  const router = useRouter();

  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  const formSchema = useMemo(() => createOrganizationFormSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<OrganizationFormValues>({
    resolver,
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: OrganizationFormValues) => {
      const result = await updateOrganizationAction({
        organizationId: organization.id,
        name: data.name,
        slug: data.slug,
      });

      return unwrapActionData(result);
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
        currentLogo={organization.logo}
        currentLogoUrl={organization.logoUrl}
        organizationId={organization.id}
        organizationName={organization.name}
        onUploadSuccessAction={() => router.refresh()}
      />
      <Form
        form={form}
        disabled={isSaving}
        className="space-y-4"
        onSubmit={async (v) => mutate(v)}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField
            name="name"
            control={form.control}
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
            name="slug"
            control={form.control}
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
