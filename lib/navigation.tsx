import {
  Link as RouterLink,
  type LinkProps,
  useLocation,
  useNavigate,
  useRouter as useTanStackRouter,
} from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href?: string;
  to?: string;
};

const Link = ({ href, to, ...props }: AppLinkProps) => {
  return (
    <RouterLink
      to={(to ?? href ?? "/") as LinkProps["to"]}
      {...(props as Omit<LinkProps, "to">)}
    />
  );
};

export default Link;

export function usePathname() {
  return useLocation({ select: (location) => location.pathname });
}

export function useSearchParams() {
  const href = useLocation({ select: (location) => location.href });
  const query = href.split("?")[1]?.split("#")[0] ?? "";

  return new URLSearchParams(query);
}

function useAppRouter() {
  const router = useTanStackRouter();
  const navigate = useNavigate();

  return {
    back() {
      window.history.back();
    },
    push(href: string) {
      void navigate({ to: href as LinkProps["to"] });
    },
    replace(href: string) {
      void navigate({ to: href as LinkProps["to"], replace: true });
    },
    refresh() {
      void router.invalidate();
    },
  };
}

export const useRouter = useAppRouter;
