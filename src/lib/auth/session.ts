import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  isLoggedIn: boolean;
  username?: string;
};

const password =
  process.env.SESSION_SECRET ||
  "qicheng-download-session-secret-change-me-32";

function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "qicheng_session",
  cookieOptions: {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.username) {
    return null;
  }
  return session;
}
