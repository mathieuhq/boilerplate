"use client";

import { authClient } from "@/lib/auth-client";
import { ApplicationError } from "@/lib/errors/application-error";

type SignInOptions = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type SignUpOptions = {
  email: string;
  name?: string;
  image?: string;
  password: string;
};

type ForgetPasswordOptions = {
  email: string;
  redirectTo?: string;
};

type ResetPasswordOptions = {
  newPassword: string;
  token: string;
};

/**
 * Client-side authentication service for use in React components
 */
class AuthClientService {
  /**
   * Sign in with email and password
   */
  async signIn(options: SignInOptions) {
    const response = await authClient.signIn.email({
      email: options.email,
      password: options.password,
      rememberMe: options.rememberMe,
    });

    if (response.error)
      throw new ApplicationError(response.error.message ?? "Failed to sign in");

    return response;
  }

  /**
   * Sign up with email and password
   */
  async signUp(options: SignUpOptions) {
    const response = await authClient.signUp.email({
      email: options.email,
      image: options.image,
      password: options.password,
      name: options.name ?? options.email.split("@")[0],
    });

    if (response.error)
      throw new ApplicationError(response.error.message ?? "Failed to sign up");

    return response;
  }

  /**
   * Sign in with OAuth provider (GitHub, Google, etc.)
   */
  async signInWithProvider(provider: "github" | "google", callbackURL = "/") {
    const response = await authClient.signIn.social({
      provider,
      callbackURL,
    });

    if (response.error)
      throw new ApplicationError(
        response.error.message ?? `Failed to sign in with ${provider}`,
      );

    return response;
  }

  /**
   * Request password reset email
   */
  async forgetPassword(options: ForgetPasswordOptions) {
    const response = await authClient.requestPasswordReset({
      email: options.email,
      redirectTo: options.redirectTo ?? "/auth/reset-password",
    });

    if (response.error)
      throw new ApplicationError(
        response.error.message ?? "Failed to send password reset email",
      );

    return response;
  }

  /**
   * Reset password with token from email
   */
  async resetPassword(options: ResetPasswordOptions) {
    const response = await authClient.resetPassword({
      newPassword: options.newPassword,
      token: options.token,
    });

    if (response.error)
      throw new ApplicationError(
        response.error.message ?? "Failed to reset password",
      );

    return response;
  }
}

export const authClientService = new AuthClientService();
