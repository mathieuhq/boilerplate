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
