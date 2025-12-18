import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { SignUpView } from "@/views/sign/signup";

export const metadata: Metadata = getPageMetadata("signup");

export default SignUpView;
