"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateUserAction } from "@/actions/user/user.action";
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
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { Language } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { FormButton } from "../../form/form-button";

import { AvatarForm } from "./avatar-form";

const languages = Object.values(Language).map((lang) => ({
  label: languageLabels[lang],
  value: lang,
}));

type ProfilFormProps = {
  user: AuthUser;
};

export const ProfilForm = ({ user }: ProfilFormProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const accountFormSchema = useMemo(
    () =>
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
      }),
    [t],
  );

  const resolver = useMemo(
    () => zodResolver(accountFormSchema),
    [accountFormSchema],
  );

  type AccountFormValues = z.infer<typeof accountFormSchema>;

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
        email: data.email,
        birthDate: data.birthDate,
        language: data.language,
      });

      if (!isActionSuccessful(result))
        throw new Error(getActionErrorMessage(result));

      return { data: result.data, newLanguage: data.language };
    },
    onSuccess: ({ newLanguage }) => {
      toast.success(t("updateSuccess"));
      if (newLanguage && newLanguage !== user.language) router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("updateError")),
  });

  return (
    <div className="space-y-6">
      <AvatarForm
        user={user}
        onUploadSuccessAction={() => router.refresh()}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAuth("email")}</FormLabel>
                <FormControl>
                  <Input placeholder={tAuth("emailPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
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
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="flex flex-col">
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
