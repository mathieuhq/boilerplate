"use client";

import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/ui/loader";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";

export const AuthDropdownImpersonating = () => {
  const stopImpersonating = useMutation({
    mutationFn: async () => authClient.admin.stopImpersonating(),
    onSuccess: () => (window.location.href = "/dashboard/admin"),
  });

  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        stopImpersonating.mutate();
      }}
    >
      {stopImpersonating.isPending ? (
        <Loader className="size-4" />
      ) : (
        <LogOut className="size-4" />
      )}
      Stop Impersonating
    </DropdownMenuItem>
  );
};
