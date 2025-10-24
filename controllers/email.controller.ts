import { emailService, type SendEmailParams } from "@/services/email"
import { z } from "zod"

const sendEmailSchema = z.object({
	subject: z.string().min(1),
	from: z.email().optional(),
	html: z.string().optional(),
	text: z.string().optional(),
	replyTo: z.email().optional(),
	to: z.union([z.email(), z.array(z.email())]),
	cc: z.union([z.email(), z.array(z.email())]).optional(),
	bcc: z.union([z.email(), z.array(z.email())]).optional()
})

export type SendEmailInput = z.infer<typeof sendEmailSchema>

export class EmailController {
	async sendEmail(input: unknown) {
		const validationResult = sendEmailSchema.safeParse(input)

		if (!validationResult.success)
			return {
				success: false,
				error: "Validation failed",
				details: validationResult.error.issues
			}

		const params = validationResult.data

		const result = await emailService.sendEmail(params as SendEmailParams)

		if (result.error)
			return {
				success: false,
				error: result.error.message
			}

		return {
			success: true,
			data: result.data
		}
	}
}

export const emailController = new EmailController()
