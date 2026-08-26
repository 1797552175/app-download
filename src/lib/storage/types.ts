export type SavedFile = {
  relativePath: string;
  originalName: string;
  size: number;
};

export interface FileStorage {
  ensureRoot(): Promise<void>;
  save(
    category: "apk" | "icon",
    key: string,
    file: File,
  ): Promise<SavedFile>;
  remove(relativePath: string | null | undefined): Promise<void>;
  absolutePath(relativePath: string): string;
}
