"use client";

import { COLORS, MENU_ITEMS } from "@/constants";
import { cn } from "@/lib/cn";
import { changeBrushSize, changeColor } from "@/slice/toolboxslice";
import { socket } from "@/socket";
import { useAppDispatch, useAppSelector } from "@/store";

const swatches = Object.entries(COLORS) as [keyof typeof COLORS, string][];

export function ToolBox() {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((s) => s.menu.activeTool);
  const showStroke = activeTool === MENU_ITEMS.PENCIL;
  const showBrush =
    activeTool === MENU_ITEMS.PENCIL || activeTool === MENU_ITEMS.ERASER;
  const { color, size } = useAppSelector((s) => s.toolbox[activeTool]);

  const updateBrushSize = (next: number) => {
    dispatch(changeBrushSize({ item: activeTool, size: next }));
    socket.emit("changeConfig", { color, size: next });
  };

  const updateColor = (newColor: string) => {
    dispatch(changeColor({ item: activeTool, color: newColor }));
    socket.emit("changeConfig", { color: newColor, size });
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
          <div className="mt-3 flex flex-wrap gap-2">
            {swatches.map(([name, hex]) => (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  "h-7 w-7 rounded-lg border-2 border-transparent shadow-sm transition",
                  color === hex &&
                    "border-zinc-900 ring-2 ring-zinc-900/15 dark:border-zinc-100 dark:ring-zinc-100/25",
                )}
                style={{ backgroundColor: hex }}
                onClick={() => updateColor(hex)}
              />
            ))}
          </div>
        </div>
      )}

      {showBrush && (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {activeTool === MENU_ITEMS.ERASER ? "Eraser size" : "Brush size"}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={activeTool === MENU_ITEMS.ERASER ? 48 : 24}
              step={1}
              value={size}
              className="h-2 w-full cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              onChange={(e) => updateBrushSize(Number(e.target.value))}
              aria-valuemin={1}
              aria-valuemax={activeTool === MENU_ITEMS.ERASER ? 48 : 24}
              aria-valuenow={size}
              aria-label="Brush size"
            />
            <span className="w-6 tabular-nums text-sm text-zinc-600 dark:text-zinc-300">
              {size}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
