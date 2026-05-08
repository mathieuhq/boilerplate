import { clientEnv } from "@/lib/env/client";

export const Umami = () => {
  if (!clientEnv.VITE_UMAMI_URL || !clientEnv.VITE_UMAMI_WEBSITE_ID)
    return null;

  return (
    <script
      defer
      src={clientEnv.VITE_UMAMI_URL}
      data-website-id={clientEnv.VITE_UMAMI_WEBSITE_ID}
    />
  );
};
