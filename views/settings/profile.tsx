import { DataExportForm } from "@/components/features/dashboard/form/data-export-form";
import { ProfileForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { Separator } from "@/components/ui/separator";
import type { DataExportStatusDTO } from "@/features/user/application/dto/data-export.dto";
import { useTranslations } from "@/i18n";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
  dataExport: DataExportStatusDTO;
};

export function ProfileSettingsView({
  user,
  dataExport,
}: ProfileSettingsViewProps) {
  const t = useTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <div className="space-y-8">
        <ProfileForm user={user} />

        <Separator />

        <section className="space-y-4">
          <div>
            <h4 className="font-medium">{t("dataExport.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("dataExport.description")}
            </p>
          </div>
          <DataExportForm status={dataExport} />
        </section>
      </div>
    </PageLayout>
  );
}
