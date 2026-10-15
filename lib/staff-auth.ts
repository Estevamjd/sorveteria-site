import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function isStaff() {
  const user = await getChatGPTUser();
  const allowed = env.STAFF_EMAIL?.trim().toLowerCase();
  return Boolean(user?.userId && allowed && user.email.trim().toLowerCase() === allowed);
}
