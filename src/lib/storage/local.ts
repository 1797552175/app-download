import fs from "fs/promises";
import path from "path";
import { UPLOADS_DIR } from "@/lib/paths";
import type { FileStorage, SavedFile } from "./types";

function safeExt(name: string, fallback: string) {
  const ext = path.extname(name).toLowerCase();
  if (!ext || ext.length > 10) return fallback;
  return ext;
}

export class LocalFileStorage implements FileStorage {
  async ensureRoot() {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }

  absolutePath(relativePath: string) {
    return path.join(UPLOADS_DIR, relativePath);
  }

  async save(
    category: "apk" | "icon",
    key: string,
    file: File,
  ): Promise<SavedFile> {
    await this.ensureRoot();
    const ext =
      category === "apk"
        ? ".apk"
        : safeExt(file.name, ".png");
    const relativePath = path.join(category, `${key}${ext}`);
    const abs = this.absolutePath(relativePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(abs, buffer);
    return {
      relativePath: relativePath.replace(/\\/g, "/"),
      originalName: file.name,
      size: buffer.length,
    };
  }

  async remove(relativePath: string | null | undefined) {
    if (!relativePath) return;
    const abs = this.absolutePath(relativePath);
    try {
      await fs.unlink(abs);
    } catch {
      // ignore missing files
    }
  }
}
