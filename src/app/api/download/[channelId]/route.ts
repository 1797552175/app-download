import fs from "fs";
import { eq } from "drizzle-orm";
import { jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { apps, channels } from "@/lib/db/schema";
import { ensureInitialized } from "@/lib/init";
import { getStorage } from "@/lib/storage";

type Params = { params: Promise<{ channelId: string }> };

export async function GET(_request: Request, { params }: Params) {
  await ensureInitialized();
  const channelId = Number((await params).channelId);
  if (!channelId) return jsonError("无效渠道");

  const db = getDb();
  const channel = db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .get();
  if (!channel?.androidFilePath) {
    return jsonError("该渠道暂无 Android 安装包", 404);
  }

  const app = db.select().from(apps).where(eq(apps.id, channel.appId)).get();
  if (!app?.published) {
    return jsonError("应用未上架", 404);
  }

  const abs = getStorage().absolutePath(channel.androidFilePath);
  if (!fs.existsSync(abs)) {
    return jsonError("安装包文件不存在", 404);
  }

  const buffer = fs.readFileSync(abs);
  const filename = channel.androidFileName || `${app.slug}-${channel.slug}.apk`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
