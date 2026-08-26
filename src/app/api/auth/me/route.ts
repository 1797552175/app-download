import { jsonOk } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { ensureInitialized } from "@/lib/init";

export async function GET() {
  await ensureInitialized();
  const session = await getSession();
  return jsonOk({
    isLoggedIn: !!session.isLoggedIn,
    username: session.username || null,
  });
}
