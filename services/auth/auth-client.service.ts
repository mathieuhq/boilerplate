"use client";

import { authClient } from "@/lib/auth-client";

type SignInOptions = {
  email: string;
  password: string;
  rememberMe?: boolean;
  callbackURL?: string;
};

type SignUpOptions = {
  email: string;
  name?: string;
  image?: string;
  password: string;
  callbackURL?: string;
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
      callbackURL: options.callbackURL ?? "/dashboard",
    });

    if (response.error)
      throw new Error(response.error.message ?? "Failed to sign in");

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
      callbackURL: options.callbackURL ?? "/dashboard",
    });

    if (response.error)
      throw new Error(response.error.message ?? "Failed to sign up");

    return response;
  }

  /**
   * Sign in with OAuth provider (GitHub, Google, etc.)
   */
  async signInWithProvider(
    provider: "github" | "google",
    callbackURL = "/dashboard",
  ) {
    const response = await authClient.signIn.social({
      provider,
      callbackURL,
    });

    if (response.error)
      throw new Error(
        response.error.message ?? `Failed to sign in with ${provider}`,
      );

    return response;
  }
}

export const authClientService = new AuthClientService();
