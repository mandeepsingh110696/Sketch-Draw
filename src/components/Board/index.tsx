"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MENU_ITEMS, type MenuTool } from "@/constants";
import { cn } from "@/lib/cn";
import { eraserCursorValue } from "@/lib/eraserCursor";
import { actionItemClick } from "@/slice/menuSlice";
import { getSocket } from "@/socket";
import { useAppDispatch, useAppSelector } from "@/store";

export type PathPayload = {
  x: number;
  y: number;
  sender?: string;
  tool?: MenuTool;
  color?: string;
  size?: number;
  opacity?: number;
};

type ShapePending = {
  kind: typeof MENU_ITEMS.LINE | typeof MENU_ITEMS.RECT;
  x0: number;
  y0: number;
  color: string;
  size: number;
  opacity: number;
};

type StrokeMode = "freehand" | "line" | "rect";

function applyStrokeStyle(
  ctx: CanvasRenderingContext2D,
  tool: MenuTool,
  color: string,
  strokeWidth: number,
  opacity: number,
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = strokeWidth;
  if (tool === MENU_ITEMS.ERASER) {
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    return;
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.globalAlpha = Math.min(1, Math.max(0.05, opacity));
}

function captureCanvasSnapshot(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.restore();
  return snap;
}

function useSketchShortcuts() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch(
          actionItemClick(e.shiftKey ? MENU_ITEMS.REDO : MENU_ITEMS.UNDO),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);
}

export function Board() {
  useSketchShortcuts();
  const dispatch = useAppDispatch();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldDraw = useRef(false);
  const historyDraw = useRef<ImageData[]>([]);
  const historyPointer = useRef(0);
  const logicalSize = useRef({ w: 0, h: 0 });
  const pointerId = useRef<number | null>(null);
  const strokeMode = useRef<StrokeMode | null>(null);
  const shapeSnapRef = useRef<ImageData | null>(null);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const remoteShapeRef = useRef<Map<string, ShapePending>>(new Map());

  const actionMenuItem = useAppSelector((s) => s.menu.actionMenuItem);
  const activeTool = useAppSelector((s) => s.menu.activeTool);
  const toolSettings = useAppSelector((s) => s.toolbox[activeTool]);
  const { color, size, opacity } = toolSettings;
  const transparentExport = useAppSelector(
    (s) => s.preferences.transparentExport,
  );
  const showDotGrid = useAppSelector((s) => s.preferences.showDotGrid);

  const [eraserCursor, setEraserCursor] = useState(() =>
    eraserCursorValue("#18181b"),
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      setEraserCursor(eraserCursorValue(mq.matches ? "#e4e4e7" : "#18181b"));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const pushHistorySnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyDraw.current = historyDraw.current.slice(
      0,
      historyPointer.current + 1,
    );
    historyDraw.current.push(snap);
    historyPointer.current = historyDraw.current.length - 1;
  }, []);

  const syncCanvasSize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    logicalSize.current = { w, h };

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    historyDraw.current = [];
    historyPointer.current = 0;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    historyDraw.current.push(blank);
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    syncCanvasSize();
    const ro = new ResizeObserver(() => syncCanvasSize());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [syncCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
      const exportEl = document.createElement("canvas");
      exportEl.width = canvas.width;
      exportEl.height = canvas.height;
      const ex = exportEl.getContext("2d");
      if (ex) {
        if (!transparentExport) {
          const paper =
            getComputedStyle(document.documentElement)
              .getPropertyValue("--canvas-paper")
              .trim() || "#f4f4f5";
          ex.fillStyle = paper;
          ex.fillRect(0, 0, exportEl.width, exportEl.height);
        }
        ex.drawImage(canvas, 0, 0);
        const dataUrl = exportEl.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = "sketchdraw.png";
        anchor.click();
      }
      dispatch(actionItemClick(null));
      return;
    }

    if (actionMenuItem === MENU_ITEMS.CLEAR) {
      const { w, h } = logicalSize.current;
      if (w < 1 || h < 1) {
        dispatch(actionItemClick(null));
        return;
      }
      const dpr = canvas.width / w;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      historyDraw.current = [blank];
      historyPointer.current = 0;
      dispatch(actionItemClick(null));
      return;
    }

    if (
      actionMenuItem === MENU_ITEMS.UNDO ||
      actionMenuItem === MENU_ITEMS.REDO
    ) {
      if (actionMenuItem === MENU_ITEMS.UNDO && historyPointer.current > 0) {
        historyPointer.current -= 1;
      }
      if (
        actionMenuItem === MENU_ITEMS.REDO &&
        historyPointer.current < historyDraw.current.length - 1
      ) {
        historyPointer.current += 1;
      }
      const imageData = historyDraw.current[historyPointer.current];
      const { w } = logicalSize.current;
      if (imageData && w >= 1) {
        const dpr = canvas.width / w;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(imageData, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      dispatch(actionItemClick(null));
    }
  }, [actionMenuItem, dispatch, transparentExport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sock = getSocket();

    const mergeRemoteConfig = (config: {
      color: string;
      size: number;
      opacity?: number;
    }) => {
      applyStrokeStyle(
        ctx,
        activeTool,
        config.color,
        config.size,
        config.opacity ?? opacity,
      );
    };
    mergeRemoteConfig({ color, size, opacity });

    const onRemoteConfig = (config: {
      color: string;
      size: number;
      opacity?: number;
    }) => {
      mergeRemoteConfig(config);
    };
    sock.on("changeConfig", onRemoteConfig);
    return () => {
      sock.off("changeConfig", onRemoteConfig);
    };
  }, [color, size, opacity, activeTool]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sock = getSocket();
    const sender = () => sock.id ?? "";

    const devicePixelRatio = () =>
      canvas.width / Math.max(1, logicalSize.current.w);

    const restoreSnapThenScale = (snap: ImageData) => {
      const m = devicePixelRatio();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(snap, 0, 0);
      ctx.restore();
      ctx.setTransform(m, 0, 0, m, 0, 0);
    };

    const localPayloadBase = (): Omit<PathPayload, "x" | "y"> => ({
      sender: sender(),
      tool: activeTool,
      color,
      size,
      opacity,
    });

    const getPoint = (e: PointerEvent): PathPayload => ({
      ...localPayloadBase(),
      x: e.clientX - canvas.getBoundingClientRect().left,
      y: e.clientY - canvas.getBoundingClientRect().top,
    });

    const drawSegment = (pt: PathPayload) => {
      applyStrokeStyle(ctx, activeTool, color, size, opacity);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    };

    const beginFreehand = (pt: PathPayload) => {
      applyStrokeStyle(ctx, activeTool, color, size, opacity);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    };

    const previewLine = (x0: number, y0: number, x1: number, y1: number) => {
      applyStrokeStyle(ctx, activeTool, color, size, opacity);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };

    const previewRect = (x0: number, y0: number, x1: number, y1: number) => {
      applyStrokeStyle(ctx, activeTool, color, size, opacity);
      const x = Math.min(x0, x1);
      const y = Math.min(y0, y1);
      ctx.strokeRect(x, y, Math.abs(x1 - x0), Math.abs(y1 - y0));
    };

    const finalizeLine = (x0: number, y0: number, x1: number, y1: number) => {
      applyStrokeStyle(ctx, activeTool, color, size, opacity);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    };

    const finalizeRect = (x0: number, y0: number, x1: number, y1: number) => {
      applyStrokeStyle(ctx, activeTool, color, size, opacity);
      const x = Math.min(x0, x1);
      const y = Math.min(y0, y1);
      ctx.strokeRect(x, y, Math.abs(x1 - x0), Math.abs(y1 - y0));
    };

    const remoteKey = (path: PathPayload) => path.sender ?? "_";

    const handleBeginPath = (path: PathPayload) => {
      if (path.sender && path.sender === sock.id) return;
      const tool = path.tool ?? MENU_ITEMS.PENCIL;
      const c = path.color ?? color;
      const sz = path.size ?? size;
      const op = path.opacity ?? 1;

      if (tool === MENU_ITEMS.LINE || tool === MENU_ITEMS.RECT) {
        remoteShapeRef.current.set(remoteKey(path), {
          kind: tool,
          x0: path.x,
          y0: path.y,
          color: c,
          size: sz,
          opacity: op,
        });
        return;
      }

      applyStrokeStyle(ctx, tool, c, sz, op);
      ctx.beginPath();
      ctx.moveTo(path.x, path.y);
    };

    const handleDrawLine = (path: PathPayload) => {
      if (path.sender && path.sender === sock.id) return;
      const key = remoteKey(path);
      const pending = remoteShapeRef.current.get(key);
      if (pending?.kind === MENU_ITEMS.LINE) {
        applyStrokeStyle(
          ctx,
          MENU_ITEMS.LINE,
          pending.color,
          pending.size,
          pending.opacity,
        );
        ctx.beginPath();
        ctx.moveTo(pending.x0, pending.y0);
        ctx.lineTo(path.x, path.y);
        ctx.stroke();
        remoteShapeRef.current.delete(key);
        return;
      }
      if (pending?.kind === MENU_ITEMS.RECT) {
        applyStrokeStyle(
          ctx,
          MENU_ITEMS.RECT,
          pending.color,
          pending.size,
          pending.opacity,
        );
        const x = Math.min(pending.x0, path.x);
        const y = Math.min(pending.y0, path.y);
        ctx.strokeRect(
          x,
          y,
          Math.abs(path.x - pending.x0),
          Math.abs(path.y - pending.y0),
        );
        remoteShapeRef.current.delete(key);
        return;
      }
      ctx.lineTo(path.x, path.y);
      ctx.stroke();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      canvas.setPointerCapture(e.pointerId);
      pointerId.current = e.pointerId;
      shouldDraw.current = true;

      if (activeTool === MENU_ITEMS.LINE || activeTool === MENU_ITEMS.RECT) {
        strokeMode.current = activeTool === MENU_ITEMS.LINE ? "line" : "rect";
        shapeSnapRef.current = captureCanvasSnapshot(canvas, ctx);
        const p = getPoint(e);
        shapeStartRef.current = { x: p.x, y: p.y };
        return;
      }

      strokeMode.current = "freehand";
      const pt = getPoint(e);
      beginFreehand(pt);
      sock.emit("beginPath", pt);
    };

    const onMove = (e: PointerEvent) => {
      if (!shouldDraw.current || pointerId.current !== e.pointerId) return;
      const mode = strokeMode.current;
      const start = shapeStartRef.current;
      const snap = shapeSnapRef.current;

      if ((mode === "line" || mode === "rect") && start && snap) {
        const p = getPoint(e);
        restoreSnapThenScale(snap);
        if (mode === "line") {
          previewLine(start.x, start.y, p.x, p.y);
        } else {
          previewRect(start.x, start.y, p.x, p.y);
        }
        return;
      }

      const pt = getPoint(e);
      drawSegment(pt);
      sock.emit("drawLine", pt);
    };

    const endStroke = (e: PointerEvent) => {
      if (pointerId.current === e.pointerId) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        pointerId.current = null;
      }

      const mode = strokeMode.current;
      const start = shapeStartRef.current;
      const snap = shapeSnapRef.current;

      if (
        shouldDraw.current &&
        (mode === "line" || mode === "rect") &&
        start &&
        snap
      ) {
        const end = getPoint(e);
        restoreSnapThenScale(snap);
        if (mode === "line") {
          finalizeLine(start.x, start.y, end.x, end.y);
          sock.emit("beginPath", {
            ...localPayloadBase(),
            tool: MENU_ITEMS.LINE,
            x: start.x,
            y: start.y,
          });
          sock.emit("drawLine", {
            sender: sender(),
            x: end.x,
            y: end.y,
          });
        } else {
          finalizeRect(start.x, start.y, end.x, end.y);
          sock.emit("beginPath", {
            ...localPayloadBase(),
            tool: MENU_ITEMS.RECT,
            x: start.x,
            y: start.y,
          });
          sock.emit("drawLine", {
            sender: sender(),
            x: end.x,
            y: end.y,
          });
        }
        shapeSnapRef.current = null;
        shapeStartRef.current = null;
        strokeMode.current = null;
        shouldDraw.current = false;
        pushHistorySnapshot();
        return;
      }

      if (shouldDraw.current) {
        shouldDraw.current = false;
        strokeMode.current = null;
        pushHistorySnapshot();
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);
    canvas.addEventListener("pointerleave", endStroke);

    sock.on("beginPath", handleBeginPath);
    sock.on("drawLine", handleDrawLine);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", endStroke);
      canvas.removeEventListener("pointercancel", endStroke);
      canvas.removeEventListener("pointerleave", endStroke);
      sock.off("beginPath", handleBeginPath);
      sock.off("drawLine", handleDrawLine);
    };
  }, [activeTool, color, size, opacity, pushHistorySnapshot]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "fixed inset-0 z-0 bg-[var(--canvas-paper)]",
        showDotGrid && "bg-sketch-dots",
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={
          activeTool === MENU_ITEMS.ERASER
            ? { cursor: eraserCursor }
            : undefined
        }
        aria-label="Drawing canvas"
      />
    </div>
  );
}
