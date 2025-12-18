"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChangelogNotification } from "@/hooks/use-changelog-notification";
import { cn } from "@/lib/utils";

type ChangelogNotificationProps = {
  latestVersion: string | null;
};

export function ChangelogNotification({
  latestVersion,
}: ChangelogNotificationProps) {
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
            <span className="sr-only">Nouveautés</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hasNewChangelog ? "Nouvelles mises à jour !" : "Changelog"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
