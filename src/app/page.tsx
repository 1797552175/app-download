import { DownloadExperience } from "@/components/DownloadExperience";
import { listPublishedApps } from "@/lib/services/apps";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const apps = await listPublishedApps();
  return <DownloadExperience apps={apps} />;
}
