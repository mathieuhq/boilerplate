"use client";

import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/ui/loader";
import { signOut } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";

export const AuthDropdownLogout = () => {
  const logout = useMutation({
    mutationFn: async () => signOut(),
    onSuccess: () => (window.location.href = "/auth/signin"),
  });

  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        logout.mutate();
      }}
    >
      {logout.isPending ? (
        <Loader className="size-4" />
      ) : (
        <LogOut className="size-4" />
      )}
      <span>Logout</span>
    </DropdownMenuItem>
  );
};
