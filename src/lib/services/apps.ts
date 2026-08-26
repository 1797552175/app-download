import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { apps, channels, type App, type Channel } from "@/lib/db/schema";
import { ensureInitialized } from "@/lib/init";

export type AppWithChannels = App & { channels: Channel[] };

export async function listPublishedApps(): Promise<AppWithChannels[]> {
  await ensureInitialized();
  const db = getDb();
  const appRows = db
    .select()
    .from(apps)
    .where(eq(apps.published, true))
    .orderBy(asc(apps.sortOrder), asc(apps.id))
    .all();

  return appRows.map((app) => ({
    ...app,
    channels: db
      .select()
      .from(channels)
      .where(eq(channels.appId, app.id))
      .orderBy(asc(channels.sortOrder), asc(channels.id))
      .all(),
  }));
}

export async function listAllApps(): Promise<AppWithChannels[]> {
  await ensureInitialized();
  const db = getDb();
  const appRows = db
    .select()
    .from(apps)
    .orderBy(asc(apps.sortOrder), asc(apps.id))
    .all();

  return appRows.map((app) => ({
    ...app,
    channels: db
      .select()
      .from(channels)
      .where(eq(channels.appId, app.id))
      .orderBy(asc(channels.sortOrder), asc(channels.id))
      .all(),
  }));
}

export async function getAppById(id: number) {
  await ensureInitialized();
  const db = getDb();
  const app = db.select().from(apps).where(eq(apps.id, id)).get();
  if (!app) return null;
  const channelRows = db
    .select()
    .from(channels)
    .where(eq(channels.appId, id))
    .orderBy(asc(channels.sortOrder), asc(channels.id))
    .all();
  return { ...app, channels: channelRows };
}
