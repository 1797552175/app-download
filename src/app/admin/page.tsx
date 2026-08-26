"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppWithChannels } from "@/lib/services/apps";
import { formatBytes, formatDate } from "@/lib/utils";

type DraftApp = {
  name: string;
  slug: string;
  description: string;
  published: boolean;
  sortOrder: number;
};

type DraftChannel = {
  name: string;
  slug: string;
  iosUrl: string;
  iosNote: string;
  sortOrder: number;
};

const emptyApp: DraftApp = {
  name: "",
  slug: "",
  description: "",
  published: true,
  sortOrder: 0,
};

const emptyChannel: DraftChannel = {
  name: "",
  slug: "",
  iosUrl: "",
  iosNote: "即将推出",
  sortOrder: 0,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [apps, setApps] = useState<AppWithChannels[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [appDraft, setAppDraft] = useState<DraftApp>(emptyApp);
  const [editingAppId, setEditingAppId] = useState<number | null>(null);
  const [channelDrafts, setChannelDrafts] = useState<Record<number, DraftChannel>>(
    {},
  );
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();
      if (!me.isLoggedIn) {
        router.replace("/admin/login");
        return;
      }
      setUsername(me.username || "");

      const appsRes = await fetch("/api/apps");
      const appsData = await appsRes.json();
      if (!appsRes.ok) {
        setError(appsData.error || "加载失败");
        return;
      }
      setApps(appsData.apps || []);
    } catch {
      setError("加载失败，请刷新重试");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  async function saveApp(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    const payload = {
      ...appDraft,
      id: editingAppId ?? undefined,
      sortOrder: Number(appDraft.sortOrder) || 0,
    };
    const res = await fetch("/api/apps", {
      method: editingAppId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "保存应用失败");
      return;
    }
    setMessage(editingAppId ? "应用已更新" : "应用已创建");
    setAppDraft(emptyApp);
    setEditingAppId(null);
    await load();
  }

  function startEditApp(app: AppWithChannels) {
    setEditingAppId(app.id);
    setAppDraft({
      name: app.name,
      slug: app.slug,
      description: app.description || "",
      published: app.published,
      sortOrder: app.sortOrder,
    });
  }

  async function deleteApp(id: number) {
    if (!confirm("确定删除该应用及其全部渠道与安装包？")) return;
    const res = await fetch(`/api/apps?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "删除失败");
      return;
    }
    setMessage("应用已删除");
    await load();
  }

  function channelDraft(appId: number): DraftChannel {
    return channelDrafts[appId] || emptyChannel;
  }

  function setChannelDraft(appId: number, patch: Partial<DraftChannel>) {
    setChannelDrafts((prev) => ({
      ...prev,
      [appId]: { ...channelDraft(appId), ...patch },
    }));
  }

  async function createChannel(appId: number, event: FormEvent) {
    event.preventDefault();
    const draft = channelDraft(appId);
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId,
        ...draft,
        iosUrl: draft.iosUrl || null,
        sortOrder: Number(draft.sortOrder) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "创建渠道失败");
      return;
    }
    setMessage("渠道已创建");
    setChannelDrafts((prev) => ({ ...prev, [appId]: emptyChannel }));
    await load();
  }

  async function deleteChannel(id: number) {
    if (!confirm("确定删除该渠道？")) return;
    const res = await fetch(`/api/channels?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "删除渠道失败");
      return;
    }
    setMessage("渠道已删除");
    await load();
  }

  async function uploadApk(channelId: number, file: File | null) {
    if (!file) return;
    setUploadingId(channelId);
    setError("");
    try {
      const form = new FormData();
      form.append("channelId", String(channelId));
      form.append("file", file);
      const res = await fetch("/api/channels/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }
      setMessage("安装包已更新为最新版本");
      await load();
    } finally {
      setUploadingId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5">
        <p className="text-[var(--muted)]">加载中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">已登录 · {username}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold">
            管理后台
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            管理应用、渠道，并上传最新 Android 安装包。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm"
          >
            前台
          </a>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm text-white"
          >
            退出
          </button>
        </div>
      </header>

      {message ? (
        <p className="mb-4 rounded-xl bg-[var(--brand)]/10 px-3 py-2 text-sm text-[var(--brand-deep)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-3xl border border-[var(--line)] bg-white/85 p-5">
        <h2 className="text-lg font-semibold">
          {editingAppId ? "编辑应用" : "新建应用"}
        </h2>
        <form onSubmit={saveApp} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="mb-1 block text-sm text-[var(--muted)]">名称</span>
            <input
              required
              value={appDraft.name}
              onChange={(e) =>
                setAppDraft((d) => ({ ...d, name: e.target.value }))
              }
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted)]">
              标识（可选）
            </span>
            <input
              value={appDraft.slug}
              onChange={(e) =>
                setAppDraft((d) => ({ ...d, slug: e.target.value }))
              }
              placeholder="自动生成"
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-[var(--muted)]">简介</span>
            <textarea
              value={appDraft.description}
              onChange={(e) =>
                setAppDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={2}
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--muted)]">排序</span>
            <input
              type="number"
              value={appDraft.sortOrder}
              onChange={(e) =>
                setAppDraft((d) => ({
                  ...d,
                  sortOrder: Number(e.target.value),
                }))
              }
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5"
            />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={appDraft.published}
              onChange={(e) =>
                setAppDraft((d) => ({ ...d, published: e.target.checked }))
              }
            />
            <span className="text-sm">前台可见</span>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-[var(--brand)] px-4 py-2.5 font-medium text-white"
            >
              {editingAppId ? "保存修改" : "创建应用"}
            </button>
            {editingAppId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAppId(null);
                  setAppDraft(emptyApp);
                }}
                className="rounded-xl border border-[var(--line)] px-4 py-2.5"
              >
                取消
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">应用列表（{apps.length}）</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">还没有应用，先创建一个吧。</p>
        ) : (
          apps.map((app) => (
            <article
              key={app.id}
              className="rounded-3xl border border-[var(--line)] bg-white/85 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{app.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {app.slug} · {app.published ? "已上架" : "已下架"} · 渠道{" "}
                    {app.channels.length}
                  </p>
                  {app.description ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {app.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditApp(app)}
                    className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteApp(app.id)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-[var(--danger)]"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {app.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {channel.slug}
                          {channel.androidFileName
                            ? ` · ${channel.androidFileName} · ${formatBytes(channel.androidFileSize)}`
                            : " · 尚未上传 APK"}
                          {` · ${formatDate(channel.updatedAt)}`}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          iOS：
                          {channel.iosUrl
                            ? channel.iosUrl
                            : channel.iosNote || "即将推出"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteChannel(channel.id)}
                        className="text-sm text-[var(--danger)]"
                      >
                        删除渠道
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white">
                        {uploadingId === channel.id
                          ? "上传中..."
                          : "上传 / 覆盖 APK"}
                        <input
                          type="file"
                          accept=".apk,application/vnd.android.package-archive"
                          className="hidden"
                          disabled={uploadingId === channel.id}
                          onChange={(e) =>
                            uploadApk(channel.id, e.target.files?.[0] || null)
                          }
                        />
                      </label>
                      {channel.androidFilePath ? (
                        <a
                          href={`/api/download/${channel.id}`}
                          className="text-sm text-[var(--brand-deep)] underline"
                        >
                          测试下载
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => createChannel(app.id, e)}
                className="mt-4 grid gap-3 rounded-2xl border border-dashed border-[var(--line)] p-4 sm:grid-cols-2"
              >
                <div className="sm:col-span-2 text-sm font-medium">新增渠道</div>
                <input
                  required
                  placeholder="渠道名称，如官网版"
                  value={channelDraft(app.id).name}
                  onChange={(e) =>
                    setChannelDraft(app.id, { name: e.target.value })
                  }
                  className="rounded-xl border border-[var(--line)] px-3 py-2"
                />
                <input
                  placeholder="标识（可选）"
                  value={channelDraft(app.id).slug}
                  onChange={(e) =>
                    setChannelDraft(app.id, { slug: e.target.value })
                  }
                  className="rounded-xl border border-[var(--line)] px-3 py-2"
                />
                <input
                  placeholder="iOS 链接（可选，暂无则留空）"
                  value={channelDraft(app.id).iosUrl}
                  onChange={(e) =>
                    setChannelDraft(app.id, { iosUrl: e.target.value })
                  }
                  className="rounded-xl border border-[var(--line)] px-3 py-2"
                />
                <input
                  placeholder="iOS 占位文案"
                  value={channelDraft(app.id).iosNote}
                  onChange={(e) =>
                    setChannelDraft(app.id, { iosNote: e.target.value })
                  }
                  className="rounded-xl border border-[var(--line)] px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-medium text-white sm:col-span-2"
                >
                  添加渠道
                </button>
              </form>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
