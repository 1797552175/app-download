import path from "path";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const DB_PATH = path.join(DATA_DIR, "qicheng.db");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
