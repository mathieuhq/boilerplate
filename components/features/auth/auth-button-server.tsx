import {
  LoggedInButton,
  SignInButton,
} from "@/components/features/auth/auth-button-client";
import { authService } from "@/services/auth/auth.service";

export const AuthButton = async () => {
  const user = await authService.getUser();

  if (user) return <LoggedInButton user={user} />;

  return <SignInButton />;
};
