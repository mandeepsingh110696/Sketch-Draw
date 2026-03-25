"use client";

import { Board } from "@/components/Board";
import { MenuBar } from "@/components/MenuBar";
import { ToolBox } from "@/components/ToolBox";

export function SketchWorkspace() {
  return (
    <div className="relative min-h-screen">
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center pt-6">
        <div className="pointer-events-none text-center">
          <p className="font-display text-lg font-medium tracking-tight text-zinc-800 dark:text-zinc-100">
            SketchDraw
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Pencil · eraser · undo · export
          </p>
        </div>
      </header>
      <MenuBar />
      <ToolBox />
      <Board />
    </div>
  );
}
