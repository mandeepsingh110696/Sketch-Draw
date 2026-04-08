"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, MENU_ITEMS, type MenuTool } from "@/constants";
import { cn } from "@/lib/cn";
import { setShowDotGrid, setTransparentExport } from "@/slice/preferencesSlice";
import {
  changeBrushSize,
  changeColor,
  changeOpacity,
} from "@/slice/toolboxslice";
import { getSocket } from "@/socket";
import { useAppDispatch, useAppSelector } from "@/store";

const swatches = Object.entries(COLORS) as [keyof typeof COLORS, string][];

const RECENT_KEY = "sketchdraw-recent-colors";
const MAX_RECENT = 8;

function loadRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === "string");
  } catch {
    return [];
  }
}

function saveRecentColors(colors: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(colors.slice(0, MAX_RECENT)),
    );
  } catch {
    /* noop */
  }
}

function brushMaxFor(tool: MenuTool) {
  if (tool === MENU_ITEMS.ERASER || tool === MENU_ITEMS.HIGHLIGHTER) return 48;
  return 24;
}

const canvasCheckboxBox = cn(
  "flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-md border-2 border-[var(--surface-border)] bg-white/90 shadow-sm",
  "transition-[border-color,background-color,box-shadow] duration-150 ease-out",
  "dark:bg-zinc-900/45",
  "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--surface)]",
  "peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
  "dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100 dark:peer-checked:shadow-[inset_0_1px_0_rgba(0,0,0,0.06)]",
  "peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100",
);

function CanvasCheckboxRow({
  id,
  checked,
  onCheckedChange,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition-colors first:mt-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span className={canvasCheckboxBox} aria-hidden>
        <Check
          className="h-3 w-3 scale-75 text-white opacity-0 transition-[transform,opacity] duration-150 ease-out dark:text-zinc-900"
          strokeWidth={2.75}
          aria-hidden
        />
      </span>
      <span className="select-none text-sm font-medium leading-none text-zinc-700 dark:text-zinc-200">
        {children}
      </span>
    </label>
  );
}

export function ToolBox() {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((s) => s.menu.activeTool);
  const transparentExport = useAppSelector(
    (s) => s.preferences.transparentExport,
  );
  const showDotGrid = useAppSelector((s) => s.preferences.showDotGrid);
  const { color, size, opacity } = useAppSelector((s) => s.toolbox[activeTool]);

  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    setRecentColors(loadRecentColors());
  }, []);

  const pushRecent = useCallback((hex: string) => {
    setRecentColors((prev) => {
      const next = [hex, ...prev.filter((c) => c !== hex)].slice(0, MAX_RECENT);
      saveRecentColors(next);
      return next;
    });
  }, []);

  const showStroke =
    activeTool === MENU_ITEMS.PENCIL ||
    activeTool === MENU_ITEMS.HIGHLIGHTER ||
    activeTool === MENU_ITEMS.LINE ||
    activeTool === MENU_ITEMS.RECT;

  const showBrush =
    activeTool === MENU_ITEMS.PENCIL ||
    activeTool === MENU_ITEMS.ERASER ||
    activeTool === MENU_ITEMS.HIGHLIGHTER ||
    activeTool === MENU_ITEMS.LINE ||
    activeTool === MENU_ITEMS.RECT;

  const showOpacity =
    activeTool !== MENU_ITEMS.ERASER &&
    (activeTool === MENU_ITEMS.HIGHLIGHTER
      ? true
      : activeTool === MENU_ITEMS.PENCIL ||
        activeTool === MENU_ITEMS.LINE ||
        activeTool === MENU_ITEMS.RECT);

  const brushMax = useMemo(() => brushMaxFor(activeTool), [activeTool]);

  const emitConfig = (next: {
    color: string;
    size: number;
    opacity: number;
  }) => {
    getSocket().emit("changeConfig", next);
  };

  const updateBrushSize = (next: number) => {
    dispatch(changeBrushSize({ item: activeTool, size: next }));
    emitConfig({ color, size: next, opacity });
  };

  const updateColor = (newColor: string) => {
    dispatch(changeColor({ item: activeTool, color: newColor }));
    emitConfig({ color: newColor, size, opacity });
    pushRecent(newColor);
  };

  const updateOpacity = (next: number) => {
    dispatch(changeOpacity({ item: activeTool, opacity: next }));
    emitConfig({ color, size, opacity: next });
  };

  return (
    <aside
      className="fixed left-5 top-[calc(50%-5rem)] z-30 w-64 -translate-y-1/2 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 shadow-[var(--surface-shadow)] backdrop-blur-md max-md:left-3 max-md:top-28 max-md:w-[calc(100%-1.5rem)] max-md:translate-y-0"
      aria-label="Brush settings"
    >
      {showStroke && (
        <div className="mb-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Stroke
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="color-picker">
              Custom color
            </label>
            <input
              id="color-picker"
              type="color"
              value={color}
              onChange={(e) => updateColor(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded-lg border border-[var(--surface-border)] bg-transparent p-0"
            />
            {swatches.map(([name, hex]) => (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  "h-7 w-7 rounded-lg border-2 border-transparent shadow-sm transition",
                  color.toLowerCase() === hex.toLowerCase() &&
                    "border-zinc-900 ring-2 ring-zinc-900/15 dark:border-zinc-100 dark:ring-zinc-100/25",
                )}
                style={{ backgroundColor: hex }}
                onClick={() => updateColor(hex)}
              />
            ))}
          </div>
          {recentColors.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Recent
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentColors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    className={cn(
                      "h-6 w-6 rounded-md border border-[var(--surface-border)] shadow-sm",
                      color.toLowerCase() === hex.toLowerCase() &&
                        "ring-2 ring-zinc-900/20 dark:ring-zinc-100/30",
                    )}
                    style={{ backgroundColor: hex }}
                    onClick={() => updateColor(hex)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showBrush && (
        <div className={showOpacity ? "mb-5" : ""}>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {activeTool === MENU_ITEMS.ERASER ? "Eraser size" : "Brush size"}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={brushMax}
              step={1}
              value={size}
              className="h-2 w-full cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              onChange={(e) => updateBrushSize(Number(e.target.value))}
              aria-valuemin={1}
              aria-valuemax={brushMax}
              aria-valuenow={size}
              aria-label="Brush size"
            />
            <span className="w-6 tabular-nums text-sm text-zinc-600 dark:text-zinc-300">
              {size}
            </span>
          </div>
        </div>
      )}

      {showOpacity && (
        <div className="mb-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Opacity
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={activeTool === MENU_ITEMS.HIGHLIGHTER ? 0.08 : 0.1}
              max={activeTool === MENU_ITEMS.HIGHLIGHTER ? 0.75 : 1}
              step={0.01}
              value={opacity}
              className="h-2 w-full cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              onChange={(e) => updateOpacity(Number(e.target.value))}
              aria-label="Stroke opacity"
            />
            <span className="w-10 tabular-nums text-sm text-zinc-600 dark:text-zinc-300">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--surface-border)] pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Canvas
        </h2>
        <CanvasCheckboxRow
          id="pref-dot-grid"
          checked={showDotGrid}
          onCheckedChange={(next) => dispatch(setShowDotGrid(next))}
        >
          Dot grid
        </CanvasCheckboxRow>
        <CanvasCheckboxRow
          id="pref-transparent-png"
          checked={transparentExport}
          onCheckedChange={(next) => dispatch(setTransparentExport(next))}
        >
          Transparent PNG export
        </CanvasCheckboxRow>
      </div>
    </aside>
  );
}
