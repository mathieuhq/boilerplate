import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getAdminRoleLabel } from "@/components/features/dashboard/admin/admin-role-label";
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
  FormDescription,
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
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import { isValidRoleKey } from "@/features/admin/domain/roles";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import {
  createAdminRoleAction,
  updateAdminRoleAction,
} from "@/server-functions/admin.functions";
import {
  ACCESS_FEATURE_KEYS,
  ACCESS_FEATURES,
  ACCESS_LEVELS,
  type AccessFeature,
  type AccessGrants,
  type AccessLevel,
  getFeatureLevels,
  hasAccess,
} from "@/shared/domain/access-control";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

const NO_ACCESS = "none";

const ACCESS_GROUPS = ACCESS_FEATURE_KEYS.reduce<
  { group: string; features: AccessFeature[] }[]
>((groups, feature) => {
  const { group } = ACCESS_FEATURES[feature];
  const existing = groups.find((item) => item.group === group);

  if (existing) existing.features.push(feature);
  else groups.push({ group, features: [feature] });

  return groups;
}, []);

const createAdminRoleFormSchema = (
  t: ReturnType<typeof useTranslations>,
  isEditing: boolean,
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t("roles.validation.nameMinLength") })
      .max(64, { message: t("roles.validation.nameMaxLength") }),
    key: z
      .string()
      .trim()
      .refine((key) => isEditing || isValidRoleKey(key), {
        message: t("roles.validation.keyFormat"),
      }),
    description: z
      .string()
      .trim()
      .max(280, { message: t("roles.validation.descriptionMaxLength") }),
    access: z.partialRecord(z.enum(ACCESS_FEATURE_KEYS), z.enum(ACCESS_LEVELS)),
  });

type AdminRoleFormValues = z.infer<
  ReturnType<typeof createAdminRoleFormSchema>
>;

type AdminRoleFormProps = {
  role?: AdminRoleDTO;
  actorAccess: AccessGrants;
  onCancelAction?: () => void;
  onSuccessAction?: () => void;
};

export const AdminRoleForm = ({
  role,
  actorAccess,
  onCancelAction,
  onSuccessAction,
}: AdminRoleFormProps) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const isEditing = Boolean(role);
  const isSystemRole = Boolean(role?.system);
  const [keyEdited, setKeyEdited] = useState(isEditing);

  const formSchema = useMemo(
    () => createAdminRoleFormSchema(t, isEditing),
    [t, isEditing],
  );
  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<AdminRoleFormValues>({
    resolver,
    defaultValues: {
      name: role ? getAdminRoleLabel(role, t) : "",
      key: role?.key ?? "",
      description: role?.description ?? "",
      access: role?.access ?? {},
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AdminRoleFormValues) => {
      const action = isEditing ? updateAdminRoleAction : createAdminRoleAction;
      const result = await action(data);

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? t("roles.form.updateSuccess")
          : t("roles.form.createSuccess"),
      );
      onSuccessAction?.();
    },
    onError: (error: Error) =>
      toast.error(
        error.message ||
          (isEditing
            ? t("roles.form.updateError")
            : t("roles.form.createError")),
      ),
  });

  return (
    <Form
      form={form}
      disabled={isPending}
      className="space-y-4"
      onSubmit={async (values) => mutate(values)}
    >
      <DialogHeader>
        <DialogTitle>
          {isEditing ? t("roles.form.editTitle") : t("roles.form.createTitle")}
        </DialogTitle>
        <DialogDescription>
          {isSystemRole
            ? t("roles.form.userRoleDescription")
            : t("roles.form.description")}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("roles.form.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("roles.form.namePlaceholder")}
                  {...field}
                  disabled={isSystemRole || isPending}
                  onChange={(event) => {
                    field.onChange(event);

                    if (!keyEdited)
                      form.setValue("key", toRoleKey(event.target.value), {
                        shouldValidate: form.formState.isSubmitted,
                      });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="key"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("roles.form.key")}</FormLabel>
              <FormControl>
                <Input
                  className="font-mono"
                  placeholder={t("roles.form.keyPlaceholder")}
                  {...field}
                  disabled={isEditing || isPending}
                  onChange={(event) => {
                    setKeyEdited(true);
                    field.onChange(event);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {!isSystemRole && (
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("roles.form.roleDescription")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("roles.form.roleDescriptionPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        name="access"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("roles.form.access")}</FormLabel>
            <FormDescription>{t("roles.form.accessHint")}</FormDescription>
            <div className="max-h-80 space-y-4 overflow-y-auto rounded-lg border p-4">
              {ACCESS_GROUPS.map(({ group, features }) => (
                <fieldset key={group} className="space-y-3">
                  <legend className="text-sm font-medium">
                    {t(`access.groups.${group}`)}
                  </legend>
                  {features.map((feature) => (
                    <AccessLevelField
                      key={feature}
                      feature={feature}
                      value={field.value[feature]}
                      actorAccess={actorAccess}
                      disabled={isPending}
                      onChange={(level) => {
                        const { [feature]: _previous, ...rest } = field.value;

                        field.onChange(
                          level ? { ...rest, [feature]: level } : rest,
                        );
                      }}
                    />
                  ))}
                </fieldset>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancelAction}
        >
          {tCommon("cancel")}
        </Button>
        <FormButton loading={isPending} type="submit">
          {isEditing ? t("roles.form.save") : t("roles.form.create")}
        </FormButton>
      </DialogFooter>
    </Form>
  );
};

const AccessLevelField = ({
  feature,
  value,
  actorAccess,
  disabled,
  onChange,
}: {
  feature: AccessFeature;
  value?: AccessLevel;
  actorAccess: AccessGrants;
  disabled: boolean;
  onChange: (level?: AccessLevel) => void;
}) => {
  const t = useTranslations("admin");
  const id = `role-access-${feature}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <label htmlFor={id} className="space-y-0.5">
        <span className="block text-sm">
          {t(`access.features.${feature}.label`)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {t(`access.features.${feature}.description`)}
        </span>
      </label>
      <Select
        value={value ?? NO_ACCESS}
        disabled={disabled}
        onValueChange={(level) =>
          onChange(level === NO_ACCESS ? undefined : (level as AccessLevel))
        }
      >
        <SelectTrigger id={id} className="w-full shrink-0 sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_ACCESS}>{t("access.levels.none")}</SelectItem>
          {getFeatureLevels(feature).map((level) => (
            <SelectItem
              key={level}
              value={level}
              disabled={
                level !== value && !hasAccess(actorAccess, feature, level)
              }
            >
              {t(`access.levels.${level}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

function toRoleKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[^a-z]+/, "")
    .slice(0, 32)
    .replace(/-+$/, "");
}
