import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { SignResetView } from "@/views/sign/reset";

export const metadata: Metadata = getPageMetadata("forgetPassword");

export default SignResetView;
