import { Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChangelogNotification } from "@/hooks/use-changelog-notification";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ChangelogNotificationProps = {
  latestVersion: string | null;
};

export const ChangelogNotification = ({
  latestVersion,
}: ChangelogNotificationProps) => {
  const t = useTranslations("changelog");
  const { hasNewChangelog } = useChangelogNotification(latestVersion);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/changelog">
            <Gift className="size-[1.2rem]" />
            {hasNewChangelog && (
              <span
                className={cn(
                  "absolute top-1 right-1 size-2 rounded-full",
                  "animate-pulse bg-red-500",
                )}
              />
            )}
            <span className="sr-only">{t("whatsNew")}</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hasNewChangelog ? t("newUpdatesAvailable") : t("title")}</p>
      </TooltipContent>
    </Tooltip>
  );
};
