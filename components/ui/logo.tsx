import Image from "next/image";

import { SITE_CONFIG } from "@/lib/site-config";

export const Logo = ({
  width = 18,
  height = 18,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <Image
    width={width}
    height={height}
    alt="Shadcnblocks"
    className={className}
    src={SITE_CONFIG.LOGO}
  />
);
