import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { usePathname, useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  createOrganizationAction,
  setActiveOrganizationAction,
} from "@/server-functions/organization.functions";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const t = useTranslations("organization");

  const [createOpen, setCreateOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const activeOrganization = useMemo(
    () => resolveActiveOrganization(organizations, activeOrganizationId),
    [activeOrganizationId, organizations],
  );

  const formSchema = useMemo(() => createSidebarOrganizationFormSchema(t), [t]);

  const form = useForm<SidebarOrganizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const switchOrganization = useOrganizationSwitchMutation(pathname);

  const createOrganization = useCreateOrganizationMutation({
    onCreated: () => {
      setCreateOpen(false);
      setSlugManuallyEdited(false);
      form.reset({ name: "", slug: "" });
    },
  });

  const activeLogo = activeOrganization?.logoUrl ?? undefined;
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
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={activeLogo} alt={activeName} />
                  <AvatarFallback className="rounded-lg">
                    <Building2 className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{activeName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("switcher.label")}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <OrganizationSwitcherDropdown
              isMobile={isMobile}
              organizations={organizations}
              onCreate={() => setCreateOpen(true)}
              isSwitching={switchOrganization.isPending}
              activeOrganizationId={resolvedActiveOrganizationId}
              switchingOrganizationId={switchOrganization.variables}
              onSwitch={(organizationId) =>
                switchOrganization.mutate(organizationId)
              }
            />
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrganizationDialog
        form={form}
        open={createOpen}
        onOpenChange={setCreateOpen}
        slugManuallyEdited={slugManuallyEdited}
        isCreating={createOrganization.isPending}
        onSlugManuallyEditedChange={setSlugManuallyEdited}
        onSubmit={(values) => createOrganization.mutate(values)}
      />
    </SidebarHeader>
  );
};

const OrganizationSwitcherDropdown = ({
  onCreate,
  onSwitch,
  isMobile,
  isSwitching,
  organizations,
  activeOrganizationId,
  switchingOrganizationId,
}: {
  isMobile: boolean;
  isSwitching: boolean;
  onCreate: () => void;
  activeOrganizationId: string;
  organizations: OrganizationResponseDTO[];
  onSwitch: (organizationId: string) => void;
  switchingOrganizationId: string | undefined;
}) => {
  const t = useTranslations("organization");

  return (
    <DropdownMenuContent
      align="start"
      sideOffset={4}
      side={isMobile ? "bottom" : "right"}
      className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
    >
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {t("switcher.label")}
      </DropdownMenuLabel>
      {organizations.length > 0 ? (
        organizations.map((organization) => {
          const isActive = organization.id === activeOrganizationId;
          const isCurrentSwitch =
            isSwitching && switchingOrganizationId === organization.id;

          return (
            <DropdownMenuItem
              key={organization.id}
              disabled={isSwitching}
              className="gap-2 p-2"
              onSelect={() => {
                if (!isActive) onSwitch(organization.id);
              }}
            >
              <Avatar className="size-6 rounded-md border">
                <AvatarImage
                  src={organization.logoUrl ?? undefined}
                  alt={organization.name}
                />
                <AvatarFallback className="rounded-md bg-transparent">
                  <Building2 className="size-3.5 shrink-0" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{organization.name}</span>
              <Check
                className={cn(
                  "ml-auto size-4",
                  isActive || isCurrentSwitch ? "opacity-100" : "opacity-0",
                )}
              />
            </DropdownMenuItem>
          );
        })
      ) : (
        <DropdownMenuItem disabled className="gap-2 p-2">
          {t("switcher.empty")}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="gap-2 p-2"
        onSelect={(event) => {
          event.preventDefault();
          onCreate();
        }}
      >
        <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
          <Plus className="size-4" />
        </div>
        <div className="font-medium">{t("switcher.create")}</div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

const CreateOrganizationDialog = ({
  form,
  open,
  onSubmit,
  isCreating,
  onOpenChange,
  slugManuallyEdited,
  onSlugManuallyEditedChange,
}: {
  open: boolean;
  isCreating: boolean;
  slugManuallyEdited: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<SidebarOrganizationFormValues>;
  onSubmit: (values: SidebarOrganizationFormValues) => void;
  onSlugManuallyEditedChange: (slugManuallyEdited: boolean) => void;
}) => {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form
          form={form}
          disabled={isCreating}
          onSubmit={onSubmit}
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
                      onSlugManuallyEditedChange(true);
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
              disabled={isCreating}
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <FormButton loading={isCreating} type="submit">
              {t("switcher.createSubmit")}
            </FormButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

function useOrganizationSwitchMutation(pathname: string) {
  const router = useRouter();

  const t = useTranslations("organization");

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await setActiveOrganizationAction({ organizationId });

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("switcher.switchSuccess"));
      if (pathname === "/settings/organization") router.replace("/");
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("switcher.switchError")),
  });
}

function useCreateOrganizationMutation({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("organization");

  return useMutation({
    mutationFn: async (data: SidebarOrganizationFormValues) => {
      const result = await createOrganizationAction(data);

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("switcher.createSuccess"));
      onCreated();
      router.replace("/");
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("switcher.createError")),
  });
}

function resolveActiveOrganization(
  organizations: OrganizationResponseDTO[],
  activeOrganizationId: string,
): OrganizationResponseDTO | null {
  const fallbackOrganization =
    organizations.length > 0 ? organizations[0] : null;

  return (
    organizations.find(
      (organization) => organization.id === activeOrganizationId,
    ) ?? fallbackOrganization
  );
}
