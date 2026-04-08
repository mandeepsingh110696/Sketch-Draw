"use client";

import { Link2, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getSocket } from "@/socket";

export function CollabBar() {
  const [peerCount, setPeerCount] = useState(1);
  const [roomId, setRoomId] = useState("public");
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const r =
      new URLSearchParams(window.location.search).get("room")?.trim() || "";
    setRoomId(r.length > 0 ? r.slice(0, 64) : "public");
  }, []);

  useEffect(() => {
    const sock = getSocket();
    const onPeers = (p: { count: number }) =>
      setPeerCount(Math.max(1, p.count));
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    sock.on("roomPeers", onPeers);
    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    setConnected(sock.connected);
    return () => {
      sock.off("roomPeers", onPeers);
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
    };
  }, []);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const newRoom = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("room", crypto.randomUUID().slice(0, 8));
    window.location.assign(url.toString());
  };

  return (
    <section
      className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-[var(--surface-shadow)] backdrop-blur-md max-md:bottom-4 max-md:max-w-[calc(100%-1.5rem)] max-md:flex-wrap max-md:justify-center"
      aria-label="Collaboration"
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          connected ? "bg-emerald-500" : "bg-amber-500",
        )}
        title={connected ? "Socket connected" : "Connecting…"}
      />
      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
        <Users className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
        <span className="tabular-nums">{peerCount}</span>
        <span className="text-zinc-400 dark:text-zinc-500">online</span>
      </span>
      <span className="hidden h-4 w-px bg-[var(--surface-border)] sm:block" />
      <span
        className="max-w-[140px] truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400"
        title={`Room: ${roomId}`}
      >
        {roomId}
      </span>
      <button
        type="button"
        onClick={() => void copyInviteLink()}
        className="flex h-8 items-center gap-1 rounded-lg border border-transparent px-2 text-zinc-700 transition hover:bg-black/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
      >
        <Link2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={newRoom}
        className="flex h-8 items-center gap-1 rounded-lg border border-transparent px-2 text-zinc-700 transition hover:bg-black/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
        title="New room (reloads)"
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        New room
      </button>
    </section>
  );
}
