"use client";

import {
  Download,
  Eraser,
  Highlighter,
  Pencil,
  PenLine,
  Redo2,
  Square,
  Trash2,
  Undo2,
} from "lucide-react";
import { MENU_ITEMS } from "@/constants";
import { cn } from "@/lib/cn";
import { actionItemClick, menuItemClick } from "@/slice/menuSlice";
import { useAppDispatch, useAppSelector } from "@/store";

const toolButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-zinc-600 transition hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white";

const actionButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition hover:bg-black/[0.04] hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100";

export function MenuBar() {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((s) => s.menu.activeTool);

  return (
    <nav
      className="fixed left-1/2 top-5 z-30 flex max-w-[calc(100%-1rem)] -translate-x-1/2 gap-0.5 overflow-x-auto rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] px-1.5 py-2 shadow-[var(--surface-shadow)] backdrop-blur-md sm:gap-1 sm:px-2"
      aria-label="Drawing tools"
    >
      <button
        type="button"
        title="Pencil"
        className={cn(
          toolButton,
          activeTool === MENU_ITEMS.PENCIL &&
            "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900",
        )}
        onClick={() => dispatch(menuItemClick(MENU_ITEMS.PENCIL))}
      >
        <Pencil className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Highlighter"
        className={cn(
          toolButton,
          activeTool === MENU_ITEMS.HIGHLIGHTER &&
            "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900",
        )}
        onClick={() => dispatch(menuItemClick(MENU_ITEMS.HIGHLIGHTER))}
      >
        <Highlighter className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Line"
        className={cn(
          toolButton,
          activeTool === MENU_ITEMS.LINE &&
            "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900",
        )}
        onClick={() => dispatch(menuItemClick(MENU_ITEMS.LINE))}
      >
        <PenLine className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Rectangle"
        className={cn(
          toolButton,
          activeTool === MENU_ITEMS.RECT &&
            "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900",
        )}
        onClick={() => dispatch(menuItemClick(MENU_ITEMS.RECT))}
      >
        <Square className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Eraser"
        className={cn(
          toolButton,
          activeTool === MENU_ITEMS.ERASER &&
            "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900",
        )}
        onClick={() => dispatch(menuItemClick(MENU_ITEMS.ERASER))}
      >
        <Eraser className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <span className="mx-0.5 w-px shrink-0 self-stretch bg-[var(--surface-border)] sm:mx-1" />
      <button
        type="button"
        title="Undo (⌘Z)"
        className={actionButton}
        onClick={() => dispatch(actionItemClick(MENU_ITEMS.UNDO))}
      >
        <Undo2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Redo (⇧⌘Z)"
        className={actionButton}
        onClick={() => dispatch(actionItemClick(MENU_ITEMS.REDO))}
      >
        <Redo2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Clear canvas"
        className={actionButton}
        onClick={() => dispatch(actionItemClick(MENU_ITEMS.CLEAR))}
      >
        <Trash2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="Export PNG"
        className={actionButton}
        onClick={() => dispatch(actionItemClick(MENU_ITEMS.DOWNLOAD))}
      >
        <Download className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </nav>
  );
}
