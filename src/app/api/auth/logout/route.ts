import { jsonOk } from "@/lib/api";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return jsonOk({ ok: true });
}
