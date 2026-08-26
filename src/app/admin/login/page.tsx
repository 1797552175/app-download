"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("huqicheng");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <p className="text-sm tracking-[0.16em] text-[var(--muted)]">ADMIN</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold">
          启程下载站后台
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">请使用管理员账号登录</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-[var(--line)] bg-white/85 p-6 shadow-[0_18px_50px_rgba(21,35,31,0.08)]"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--muted)]">账号</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none ring-[var(--brand)] focus:ring-2"
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--muted)]">密码</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none ring-[var(--brand)] focus:ring-2"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-60"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </main>
  );
}
