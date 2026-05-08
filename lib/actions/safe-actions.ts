import { auth } from "@/lib/auth";
import { ActionError } from "@/lib/errors/action-error";
import { getServerRequestHeaders } from "@/lib/request";

export async function getRequiredActionUser() {
  const session = await auth.api.getSession({
    headers: getServerRequestHeaders(),
  });

  if (!session?.user) throw ActionError.unauthorized();

  return session.user;
}

export async function getRequiredActionAdmin() {
  const user = await getRequiredActionUser();

  if (user.role !== "admin")
    throw ActionError.forbidden("Admin access required");

  return user;
}
