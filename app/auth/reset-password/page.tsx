import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { SignResetPasswordView } from "@/views/sign/reset-password";

export const metadata: Metadata = getPageMetadata("resetPassword");

export default SignResetPasswordView;
