import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { pretty, render } from "@react-email/render"
import type {
	EmailParams,
	MailAdapter
} from "./adapters/mail-adapter.interface"
import { ResendAdapter } from "./adapters/resend.adapter"

type SendEmailParams = Omit<EmailParams, "from" | "html"> & {
	from?: string
	html?: string | React.ReactElement
}

class EmailService {
	private mailAdapter: MailAdapter

	constructor(mailAdapter: MailAdapter) {
		this.mailAdapter = mailAdapter
	}

	async sendEmail(params: SendEmailParams) {
		if (env.NODE_ENV === "development")
			params.subject = `[DEV] ${params.subject}`

		let html = ""

		if (typeof params.html === "string") html = params.html
		else if (params.html) html = await pretty(await render(params.html))

		const result = await this.mailAdapter.send({
			...params,
			html,
			from: params.from ?? env.EMAIL_FROM
		})

		if (result.error)
			logger.error("[sendEmail] Error", { result, subject: params.subject })

		return result
	}
}

export const emailService = new EmailService(
	new ResendAdapter(env.RESEND_API_KEY)
)

export type { SendEmailParams }
