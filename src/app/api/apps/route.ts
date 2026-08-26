import { eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { apps } from "@/lib/db/schema";
import { ensureInitialized } from "@/lib/init";
import { listAllApps } from "@/lib/services/apps";
import { getStorage } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export async function GET() {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);
  return jsonOk({ apps: await listAllApps() });
}

export async function POST(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const description = String(body?.description || "").trim();
  const slugInput = String(body?.slug || "").trim();
  const published = body?.published !== false;
  const sortOrder = Number(body?.sortOrder ?? 0) || 0;

  if (!name) return jsonError("请填写应用名称");

  const slug = slugify(slugInput || name);
  const db = getDb();
  const exists = db.select().from(apps).where(eq(apps.slug, slug)).get();
  if (exists) return jsonError("标识已存在，请换一个");

  const now = new Date();
  const result = db
    .insert(apps)
    .values({
      name,
      slug,
      description,
      published,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const app = db
    .select()
    .from(apps)
    .where(eq(apps.id, Number(result.lastInsertRowid)))
    .get();

  return jsonOk({ app }, { status: 201 });
}

export async function PUT(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return jsonError("缺少应用 ID");

  const db = getDb();
  const existing = db.select().from(apps).where(eq(apps.id, id)).get();
  if (!existing) return jsonError("应用不存在", 404);

  const name = String(body?.name ?? existing.name).trim();
  const description = String(body?.description ?? existing.description).trim();
  const slug = slugify(String(body?.slug ?? existing.slug).trim());
  const published =
    typeof body?.published === "boolean" ? body.published : existing.published;
  const sortOrder =
    body?.sortOrder === undefined
      ? existing.sortOrder
      : Number(body.sortOrder) || 0;

  if (!name) return jsonError("请填写应用名称");

  const conflict = db.select().from(apps).where(eq(apps.slug, slug)).get();
  if (conflict && conflict.id !== id) {
    return jsonError("标识已存在，请换一个");
  }

  db.update(apps)
    .set({
      name,
      slug,
      description,
      published,
      sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(apps.id, id))
    .run();

  return jsonOk({
    app: db.select().from(apps).where(eq(apps.id, id)).get(),
  });
}

export async function DELETE(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return jsonError("缺少应用 ID");

  const db = getDb();
  const app = await (await import("@/lib/services/apps")).getAppById(id);
  if (!app) return jsonError("应用不存在", 404);

  const storage = getStorage();
  await storage.remove(app.iconPath);
  for (const channel of app.channels) {
    await storage.remove(channel.androidFilePath);
  }

  db.delete(apps).where(eq(apps.id, id)).run();
  return jsonOk({ ok: true });
}
