import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { languageLabels } from "@/features/user/interface/schemas/user.schema";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { authClient } from "@/lib/auth-client";
import { Language } from "@/lib/generated/prisma/enums";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { updateUserAction } from "@/server-functions/user.functions";
import type { AuthUser } from "@/types/auth-user";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../../form/form-button";

import { AvatarForm } from "./avatar-form";

const languages = Object.values(Language).map((lang) => ({
  label: languageLabels[lang],
  value: lang,
}));

const createAccountFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z
      .string()
      .min(2, { message: t("validation.nameMinLength") })
      .max(30, { message: t("validation.nameMaxLength") }),
    email: z.email({ message: t("validation.emailRequired") }),
    birthDate: z
      .date()
      .max(new Date(), t("validation.birthDatePast"))
      .optional(),
    language: z.enum(Language).optional(),
  });

type AccountFormValues = z.infer<ReturnType<typeof createAccountFormSchema>>;

type ProfilFormProps = {
  user: AuthUser;
};

export const ProfilForm = ({ user }: ProfilFormProps) => {
  const router = useRouter();

  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const accountFormSchema = useMemo(() => createAccountFormSchema(t), [t]);

  const resolver = useMemo(
    () => zodResolver(accountFormSchema),
    [accountFormSchema],
  );

  const form = useForm<AccountFormValues>({
    resolver,
    defaultValues: {
      name: user.name,
      email: user.email,
      language: user.language ?? undefined,
      birthDate: user.birthDate ?? undefined,
    },
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: AccountFormValues) => {
      const result = await updateUserAction({
        name: data.name,
        language: data.language,
        birthDate: data.birthDate,
      });

      const updatedUser = unwrapActionData(result);
      const nextEmail = data.email.trim().toLowerCase();
      const currentEmail = user.email.trim().toLowerCase();

      if (nextEmail === currentEmail)
        return { emailChangeRequested: false, user: updatedUser };

      const emailChange = await authClient.changeEmail({
        newEmail: nextEmail,
        callbackURL: "/settings/profile",
      });

      if (emailChange.error) throw new Error(emailChange.error.message);

      return { emailChangeRequested: true, user: updatedUser };
    },
    onSuccess: ({ emailChangeRequested }) => {
      toast.success(
        emailChangeRequested ? t("emailChangeRequested") : t("updateSuccess"),
      );
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("updateError")),
  });

  return (
    <div className="space-y-6">
      <AvatarForm user={user} onUploadSuccessAction={() => router.refresh()} />
      <Form
        form={form}
        disabled={isSaving}
        onSubmit={async (v) => mutate(v)}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder={t("namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAuth("email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={tAuth("emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="birthDate"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("dateOfBirth")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "MMM d, yyyy")
                        ) : (
                          <span>{tCommon("pickDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      captionLayout="dropdown"
                      onSelect={field.onChange}
                      disabled={(date: Date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="language"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("language")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? languages.find(
                              (language) => language.value === field.value,
                            )?.label
                          : tCommon("selectLanguage")}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder={tCommon("searchLanguage")} />
                      <CommandEmpty>{tCommon("noLanguageFound")}</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {languages.map((language) => (
                            <CommandItem
                              value={language.label}
                              key={language.value}
                              onSelect={() => {
                                form.setValue("language", language.value);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  language.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {language.label}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormButton loading={isSaving} type="submit">
          {tCommon("updateAccount")}
        </FormButton>
      </Form>
    </div>
  );
};
