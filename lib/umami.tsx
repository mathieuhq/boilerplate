import Script from "next/script";

import { env } from "./env";

export const Umami = () => {
  if (!env.NEXT_PUBLIC_UMAMI_URL || !env.NEXT_PUBLIC_UMAMI_WEBSITE_ID)
    return null;

  return (
    <Script
      defer
      src={env.NEXT_PUBLIC_UMAMI_URL}
      data-website-id={env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
    />
  );
};
