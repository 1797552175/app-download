import { eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { ensureInitialized } from "@/lib/init";

export async function POST(request: Request) {
  await ensureInitialized();
  const body = await request.json().catch(() => null);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");

  if (!username || !password) {
    return jsonError("请输入账号和密码");
  }

  const admin = getDb()
    .select()
    .from(admins)
    .where(eq(admins.username, username))
    .get();

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return jsonError("账号或密码错误", 401);
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.username = admin.username;
  await session.save();

  return jsonOk({ ok: true, username: admin.username });
}
