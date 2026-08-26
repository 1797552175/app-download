import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { getStorage } from "@/lib/storage";

let initialized = false;

export async function ensureInitialized() {
  if (initialized) return;
  const db = getDb();
  await getStorage().ensureRoot();

  const username = process.env.ADMIN_USERNAME || "huqicheng";
  const password = process.env.ADMIN_PASSWORD || "huqicheng";

  const existing = db
    .select()
    .from(admins)
    .where(eq(admins.username, username))
    .get();

  if (!existing) {
    const passwordHash = await hashPassword(password);
    db.insert(admins)
      .values({
        username,
        passwordHash,
        createdAt: new Date(),
      })
      .run();
  }

  initialized = true;
}
