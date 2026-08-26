"use client";

import { useMemo, useState } from "react";
import type { AppWithChannels } from "@/lib/services/apps";
import { formatBytes, formatDate } from "@/lib/utils";

type Props = {
  apps: AppWithChannels[];
};

export function DownloadExperience({ apps }: Props) {
  const [appId, setAppId] = useState<number | null>(apps[0]?.id ?? null);
  const [channelId, setChannelId] = useState<number | null>(
    apps[0]?.channels[0]?.id ?? null,
  );

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === appId) ?? null,
    [apps, appId],
  );

  const selectedChannel = useMemo(
    () =>
      selectedApp?.channels.find((channel) => channel.id === channelId) ??
      selectedApp?.channels[0] ??
      null,
    [selectedApp, channelId],
  );

  function onSelectApp(id: number) {
    setAppId(id);
    const next = apps.find((app) => app.id === id);
    setChannelId(next?.channels[0]?.id ?? null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-12 pt-10 sm:pt-14">
      <header className="mb-10 animate-[fadeUp_0.6s_ease_both]">
        <p className="mb-3 text-sm tracking-[0.18em] text-[var(--muted)]">
          QICHENG
        </p>
        <h1
          className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-5xl"
        >
          启程下载站
        </h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-[var(--muted)]">
          选择应用与渠道，下载最新安装包。页面为移动端优化。
        </p>
      </header>

      {apps.length === 0 ? (
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur-md animate-[fadeUp_0.7s_ease_both]">
          <h2 className="text-lg font-semibold">暂无可下载应用</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            管理员上架应用并上传安装包后，这里会显示下载入口。
          </p>
        </section>
      ) : (
        <section className="space-y-5 animate-[fadeUp_0.75s_ease_both]">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
              选择应用
            </label>
            <div className="grid gap-2">
              {apps.map((app) => {
                const active = app.id === selectedApp?.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onSelectApp(app.id)}
                    className={`rounded-2xl border px-4 py-3.5 text-left transition duration-200 ${
                      active
                        ? "border-[var(--brand)] bg-white shadow-[0_10px_30px_rgba(15,107,92,0.12)]"
                        : "border-[var(--line)] bg-[var(--surface)] hover:bg-white/90"
                    }`}
                  >
                    <div className="font-semibold">{app.name}</div>
                    {app.description ? (
                      <div className="mt-1 text-sm text-[var(--muted)]">
                        {app.description}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedApp && selectedApp.channels.length > 0 ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                选择渠道
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedApp.channels.map((channel) => {
                  const active = channel.id === selectedChannel?.id;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setChannelId(channel.id)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        active
                          ? "bg-[var(--brand)] text-white"
                          : "bg-white/70 text-[var(--ink)] ring-1 ring-[var(--line)] hover:bg-white"
                      }`}
                    >
                      {channel.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : selectedApp ? (
            <p className="text-sm text-[var(--muted)]">该应用暂未配置渠道。</p>
          ) : null}

          {selectedChannel ? (
            <div className="rounded-3xl border border-[var(--line)] bg-white/85 p-5 shadow-[0_18px_50px_rgba(21,35,31,0.08)] backdrop-blur-md">
              <div className="mb-4">
                <div className="text-sm text-[var(--muted)]">当前渠道</div>
                <div className="mt-1 text-xl font-semibold">
                  {selectedApp?.name} · {selectedChannel.name}
                </div>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  更新时间 {formatDate(selectedChannel.updatedAt)}
                  {selectedChannel.androidFileSize
                    ? ` · ${formatBytes(selectedChannel.androidFileSize)}`
                    : ""}
                </div>
              </div>

              <div className="grid gap-3">
                {selectedChannel.androidFilePath ? (
                  <a
                    href={`/api/download/${selectedChannel.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-3.5 text-center font-semibold text-white transition hover:bg-[var(--brand-deep)] active:scale-[0.99]"
                  >
                    下载 Android 安装包
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl bg-[var(--ink)]/10 px-4 py-3.5 font-semibold text-[var(--muted)]"
                  >
                    Android 包尚未上传
                  </button>
                )}

                {selectedChannel.iosUrl ? (
                  <a
                    href={selectedChannel.iosUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] px-4 py-3.5 font-semibold transition hover:bg-white"
                  >
                    前往 iOS 下载
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-3.5 font-medium text-[var(--muted)]"
                  >
                    iOS · {selectedChannel.iosNote || "即将推出"}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--muted)] animate-[fadeUp_0.9s_ease_both]">
        © {new Date().getFullYear()} 启程下载站
      </footer>
    </main>
  );
}
