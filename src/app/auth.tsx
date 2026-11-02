import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Logo } from "@/components/ui/logo";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10 sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo width={40} height={40} className="mx-auto" />
        <Outlet />
      </div>
    </div>
  );
}
