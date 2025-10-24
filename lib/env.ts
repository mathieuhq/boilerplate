import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		DATABASE_URL: z.url(),

		BETTER_AUTH_URL: z.url(),
		BETTER_AUTH_SECRET: z.string().min(32),

		GITHUB_CLIENT_ID: z.string().optional(),
		GITHUB_CLIENT_SECRET: z.string().optional(),

		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),

		EMAIL_FROM: z.email(),
		RESEND_API_KEY: z.string().min(1),
		RESEND_AUDIENCE_ID: z.string().min(1)
	},
	client: {},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		DATABASE_URL: process.env.DATABASE_URL,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		EMAIL_FROM: process.env.EMAIL_FROM,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID
	}
})
