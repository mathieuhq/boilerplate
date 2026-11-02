import type { JSX } from "react";

import { SectionNavTemplate } from "@/components/features/dashboard/section-nav-template";
import { usePathname, useRouter } from "@/lib/navigation";

type Props = {
  items: {
    href: string;
    title: string;
    icon: JSX.Element;
  }[];
};

export const SidebarLayout = ({ items }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SectionNavTemplate
      value={pathname}
      onValueChange={(href) => router.push(href)}
      items={items.map((item) => ({
        value: item.href,
        href: item.href,
        label: item.title,
        icon: item.icon,
      }))}
    />
  );
};
