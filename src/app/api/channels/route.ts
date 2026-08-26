import { and, eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { apps, channels } from "@/lib/db/schema";
import { ensureInitialized } from "@/lib/init";
import { getStorage } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const body = await request.json().catch(() => null);
  const appId = Number(body?.appId);
  const name = String(body?.name || "").trim();
  const slugInput = String(body?.slug || "").trim();
  const iosUrl = body?.iosUrl ? String(body.iosUrl).trim() : null;
  const iosNote = String(body?.iosNote || "即将推出").trim() || "即将推出";
  const sortOrder = Number(body?.sortOrder ?? 0) || 0;

  if (!appId || !name) return jsonError("请填写渠道名称并选择应用");

  const db = getDb();
  const app = db.select().from(apps).where(eq(apps.id, appId)).get();
  if (!app) return jsonError("应用不存在", 404);

  const slug = slugify(slugInput || name);
  const exists = db
    .select()
    .from(channels)
    .where(and(eq(channels.appId, appId), eq(channels.slug, slug)))
    .get();
  if (exists) return jsonError("该应用下渠道标识已存在");

  const now = new Date();
  const result = db
    .insert(channels)
    .values({
      appId,
      name,
      slug,
      iosUrl,
      iosNote,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const channel = db
    .select()
    .from(channels)
    .where(eq(channels.id, Number(result.lastInsertRowid)))
    .get();

  return jsonOk({ channel }, { status: 201 });
}

export async function PUT(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return jsonError("缺少渠道 ID");

  const db = getDb();
  const existing = db.select().from(channels).where(eq(channels.id, id)).get();
  if (!existing) return jsonError("渠道不存在", 404);

  const name = String(body?.name ?? existing.name).trim();
  const slug = slugify(String(body?.slug ?? existing.slug).trim());
  const iosUrl =
    body?.iosUrl === undefined
      ? existing.iosUrl
      : body.iosUrl
        ? String(body.iosUrl).trim()
        : null;
  const iosNote =
    String(body?.iosNote ?? existing.iosNote).trim() || "即将推出";
  const sortOrder =
    body?.sortOrder === undefined
      ? existing.sortOrder
      : Number(body.sortOrder) || 0;

  if (!name) return jsonError("请填写渠道名称");

  const conflict = db
    .select()
    .from(channels)
    .where(
      and(eq(channels.appId, existing.appId), eq(channels.slug, slug)),
    )
    .get();
  if (conflict && conflict.id !== id) {
    return jsonError("该应用下渠道标识已存在");
  }

  db.update(channels)
    .set({
      name,
      slug,
      iosUrl,
      iosNote,
      sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(channels.id, id))
    .run();

  return jsonOk({
    channel: db.select().from(channels).where(eq(channels.id, id)).get(),
  });
}

export async function DELETE(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return jsonError("缺少渠道 ID");

  const db = getDb();
  const channel = db.select().from(channels).where(eq(channels.id, id)).get();
  if (!channel) return jsonError("渠道不存在", 404);

  await getStorage().remove(channel.androidFilePath);
  db.delete(channels).where(eq(channels.id, id)).run();
  return jsonOk({ ok: true });
}
