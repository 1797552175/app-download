import { eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { channels } from "@/lib/db/schema";
import { ensureInitialized } from "@/lib/init";
import { getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  await ensureInitialized();
  const session = await requireAdmin();
  if (!session) return jsonError("未登录", 401);

  const form = await request.formData();
  const channelId = Number(form.get("channelId"));
  const file = form.get("file");

  if (!channelId || !(file instanceof File)) {
    return jsonError("请选择渠道并上传 APK 文件");
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".apk")) {
    return jsonError("仅支持 .apk 文件");
  }

  const db = getDb();
  const channel = db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .get();
  if (!channel) return jsonError("渠道不存在", 404);

  const storage = getStorage();
  await storage.remove(channel.androidFilePath);

  const saved = await storage.save("apk", `channel-${channelId}`, file);

  db.update(channels)
    .set({
      androidFilePath: saved.relativePath,
      androidFileName: saved.originalName,
      androidFileSize: saved.size,
      updatedAt: new Date(),
    })
    .where(eq(channels.id, channelId))
    .run();

  return jsonOk({
    channel: db.select().from(channels).where(eq(channels.id, channelId)).get(),
  });
}
