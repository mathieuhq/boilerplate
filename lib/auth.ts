import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod } from "better-auth/plugins";
import type Stripe from "stripe";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { emailController } from "@/controllers/email.controller";
import { userController } from "@/controllers/user.controller";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { render } from "@react-email/render";

import { ApplicationError } from "./errors/application-error";
import { getServerUrl } from "./server-url";
import { SITE_CONFIG } from "./site-config";
import { stripe } from "./stripe";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

/**
 * Configured social authentication providers based on environment variables
 */
export const SocialProviders: SocialProvidersType = {};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
  SocialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  SocialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };

/**
 * Helper function to send emails using the email controller
 */
const sendEmail = async (params: {
  to: string;
  subject: string;
  markdown: string;
  preview?: string;
}) => {
  const html = await render(
    MarkdownEmail({
      preview: params.preview,
      markdown: params.markdown,
    }),
  );

  const result = await emailController.sendEmail({
    html,
    to: params.to,
    subject: params.subject,
  });

  if (!result.success) {
    logger.error("Failed to send email", {
      to: params.to,
      error: result.error,
      subject: params.subject,
    });

    throw new ApplicationError(result.error ?? "Failed to send email");
  }
};

/**
 * Server-side authentication instance with Better Auth
 */
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 20,
    updateAge: 60 * 60 * 24 * 7,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const result = await emailController.subscribeContact({
              userId: user.id,
            });

            if (result.success) {
              logger.info("User subscribed to email audience", {
                userId: user.id,
                resendContactId: result.data,
              });
            } else {
              logger.warn("Failed to subscribe user to email audience", {
                userId: user.id,
                error: result.error,
              });
            }
          } catch (error) {
            logger.error("Error subscribing user to email audience", {
              error,
              userId: user.id,
            });
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        preview: `Reset your password for ${SITE_CONFIG.TITLE}`,
        markdown: `
          Hello,

          You requested to reset your password.

          [Click here to reset your password](${url})
          `,
      });
    },
  },
  user: {
    additionalFields: {
      birthDate: {
        type: "date",
        required: false,
      },
      language: {
        type: "string",
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url }) => {
        await sendEmail({
          to: newEmail,
          subject: "Change email address",
          preview: `Change your email address for ${SITE_CONFIG.TITLE}`,
          markdown: `
            Hello,

            You requested to change your email address.

            [Click here to verify your new email address](${url})
            `,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackUrl=/auth/goodbye`;
        await sendEmail({
          to: user.email,
          subject: "Delete your account",
          preview: `Delete your account from ${SITE_CONFIG.TITLE}`,
          markdown: `
            Hello,

            You requested to delete your account.

            [Click here to confirm account deletion](${url})
            `,
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        preview: `Verify your email for ${SITE_CONFIG.TITLE}`,
        markdown: `
          Hello,

          Welcome to ${SITE_CONFIG.TITLE}! Please verify your email address.

          [Click here to verify your email](${url})
          `,
      });
    },
  },
  advanced: {
    cookiePrefix: SITE_CONFIG.APP_ID,
  },
  socialProviders: SocialProviders,
  plugins: [
    stripePlugin({
      stripeClient: stripe,
      createCustomerOnSignUp: true,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "free",
            priceId: "price_free",
          },
          {
            name: "pro",
            priceId: env.STRIPE_PRO_PRICE_ID,
            annualDiscountPriceId: env.STRIPE_PRO_ANNUAL_PRICE_ID,
            freeTrial: {
              days: 14,
            },
          },
        ],
        onSubscriptionComplete: async ({ subscription, plan }) => {
          logger.info("Subscription completed", {
            plan: plan.name,
            subscriptionId: subscription.id,
            referenceId: subscription.referenceId,
          });

          const user = await userController.getUserForEmail(
            subscription.referenceId,
          );

          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Welcome to Pro!",
              preview: "Your subscription is now active",
              markdown: `
                Hello${user.name ? ` ${user.name}` : ""},

                Thank you for subscribing to the **${plan.name}** plan!

                Your subscription is now active and you have full access to all features.

                If you have any questions, feel free to reach out.
              `,
            });
          }
        },
        onSubscriptionCancel: async ({ subscription }) => {
          logger.info("Subscription cancelled", {
            plan: subscription.plan,
            subscriptionId: subscription.id,
            referenceId: subscription.referenceId,
          });

          const user = await userController.getUserForEmail(
            subscription.referenceId,
          );

          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Your subscription has been cancelled",
              preview: "We're sorry to see you go",
              markdown: `
                Hello${user.name ? ` ${user.name}` : ""},

                Your subscription has been cancelled. You'll continue to have access until the end of your current billing period.

                If you change your mind, you can resubscribe anytime from your account settings.

                We'd love to hear your feedback on how we can improve.
              `,
            });
          }
        },
        onTrialEnd: async ({
          subscription,
        }: {
          subscription: {
            id: string;
            plan: string;
            referenceId: string;
          };
        }) => {
          logger.info("Trial ended", {
            plan: subscription.plan,
            subscriptionId: subscription.id,
            referenceId: subscription.referenceId,
          });

          const user = await userController.getUserForEmail(
            subscription.referenceId,
          );
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: "Your trial is ending soon",
              preview: "Upgrade now to keep your access",
              markdown: `
                Hello${user.name ? ` ${user.name}` : ""},

                Your free trial is ending soon. To continue enjoying all the features, please upgrade to a paid plan.

                [Upgrade now](${getServerUrl()}/settings/billing)

                If you have any questions about our plans, feel free to reach out.
              `,
            });
          }
        },
        onEvent: async (event: Stripe.Event) => {
          if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object as { customer: string };
            const customerId = invoice.customer;

            const user =
              await userController.getUserByStripeCustomerId(customerId);

            if (user?.email) {
              await sendEmail({
                to: user.email,
                subject: "Payment failed",
                preview: "Please update your payment method",
                markdown: `
                  Hello${user.name ? ` ${user.name}` : ""},

                  We were unable to process your payment. Please update your payment method to avoid any interruption to your service.

                  [Update payment method](${getServerUrl()}/settings/billing)

                  If you believe this is an error, please contact us.
                `,
              });
            }
          }
        },
      },
    }),
    lastLoginMethod(),
    nextCookies(),
  ],
});
