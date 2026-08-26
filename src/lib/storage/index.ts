import { LocalFileStorage } from "./local";
import type { FileStorage } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __qichengStorage: FileStorage | undefined;
}

export function getStorage(): FileStorage {
  if (!global.__qichengStorage) {
    global.__qichengStorage = new LocalFileStorage();
  }
  return global.__qichengStorage;
}

export type { FileStorage, SavedFile } from "./types";
