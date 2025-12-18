import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { SignInView } from "@/views/sign/signin";

export const metadata: Metadata = getPageMetadata("signin");

export default SignInView;
