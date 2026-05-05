"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createOrganizationAction,
  setActiveOrganizationAction,
} from "@/actions/organization/organization.action";
import { FormButton } from "@/components/features/form/form-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { OrganizationResponseDTO } from "@/features/organization/application/dto/organization-response.dto";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { getStorageFile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

const createSidebarOrganizationFormSchema = (
  t: ReturnType<typeof useTranslations>,
) =>
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

type SidebarOrganizationFormValues = z.infer<
  ReturnType<typeof createSidebarOrganizationFormSchema>
>;

type SidebarOrganizationSwitcherProps = {
  activeOrganizationId: string;
  organizations: OrganizationResponseDTO[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export const SidebarOrganizationSwitcher = ({
  organizations,
  activeOrganizationId,
}: SidebarOrganizationSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  const [createOpen, setCreateOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const activeOrganization = useMemo(() => {
    const organization = organizations.find(
      (organization) => organization.id === activeOrganizationId,
    );

    if (organization) return organization;

    return organizations.length > 0 ? organizations[0] : null;
  }, [activeOrganizationId, organizations]);

  const formSchema = useMemo(
    () => createSidebarOrganizationFormSchema(t),
    [t],
  );

  const form = useForm<SidebarOrganizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const refreshForOrganizationChange = () => {
    if (pathname === "/settings/organization") router.replace("/");
    router.refresh();
  };

  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await setActiveOrganizationAction({ organizationId });

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("switcher.switchSuccess"));
      refreshForOrganizationChange();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("switcher.switchError")),
  });

  const createOrganization = useMutation({
    mutationFn: async (data: SidebarOrganizationFormValues) => {
      const result = await createOrganizationAction(data);

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("switcher.createSuccess"));
      setCreateOpen(false);
      setSlugManuallyEdited(false);
      form.reset({ name: "", slug: "" });
      router.replace("/");
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("switcher.createError")),
  });

  const activeLogo = getStorageFile(activeOrganization?.logo ?? null);
  const activeName = activeOrganization?.name ?? t("switcher.choose");

  const resolvedActiveOrganizationId =
    activeOrganization?.id ?? activeOrganizationId;

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                tooltip={activeName}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={activeLogo ?? undefined} alt={activeName} />
                  <AvatarFallback className="rounded-lg">
                    <Building2 className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{activeName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {t("switcher.label")}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={4}
              side={isMobile ? "bottom" : "right"}
              className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            >
              <DropdownMenuLabel>{t("switcher.label")}</DropdownMenuLabel>
              {organizations.length > 0 ? (
                organizations.map((organization) => {
                  const isActive =
                    organization.id === resolvedActiveOrganizationId;
                  const isSwitching =
                    switchOrganization.isPending &&
                    switchOrganization.variables === organization.id;

                  return (
                    <DropdownMenuItem
                      key={organization.id}
                      disabled={isActive || switchOrganization.isPending}
                      onSelect={() =>
                        !isActive && switchOrganization.mutate(organization.id)
                      }
                    >
                      <Building2 className="size-4" />
                      <span className="truncate">{organization.name}</span>
                      <Check
                        className={cn(
                          "ml-auto size-4",
                          isActive || isSwitching ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem disabled>
                  {t("switcher.empty")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setCreateOpen(true);
                }}
              >
                <Plus className="size-4" />
                {t("switcher.create")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <Form
            form={form}
            disabled={createOrganization.isPending}
            onSubmit={(values) => createOrganization.mutate(values)}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{t("switcher.createTitle")}</DialogTitle>
              <DialogDescription>
                {t("switcher.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        if (!slugManuallyEdited) {
                          form.setValue("slug", slugify(event.target.value), {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
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
                    <Input
                      placeholder={t("slugPlaceholder")}
                      {...field}
                      onChange={(event) => {
                        setSlugManuallyEdited(true);
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createOrganization.isPending}
                onClick={() => setCreateOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <FormButton loading={createOrganization.isPending} type="submit">
                {t("switcher.createSubmit")}
              </FormButton>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </SidebarHeader>
  );
};
