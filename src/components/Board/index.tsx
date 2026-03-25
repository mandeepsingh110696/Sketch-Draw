"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/slice/menuSlice";
import { socket } from "@/socket";
import { useAppDispatch, useAppSelector } from "@/store";

type PathPayload = { x: number; y: number; sender?: string };

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

  const actionMenuItem = useAppSelector((s) => s.menu.actionMenuItem);
  const activeTool = useAppSelector((s) => s.menu.activeTool);
  const { color, size } = useAppSelector((s) => s.toolbox[activeTool]);

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

  const applyToolStyle = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const isEraser = activeTool === MENU_ITEMS.ERASER;
      ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = isEraser
        ? "destination-out"
        : "source-over";
    },
    [activeTool, color, size],
  );

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
    const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
        const paper =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--canvas-paper")
            .trim() || "#f4f4f5";
        ex.fillStyle = paper;
        ex.fillRect(0, 0, exportEl.width, exportEl.height);
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
      const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
      if (imageData) ctx.putImageData(imageData, 0, 0);
      dispatch(actionItemClick(null));
    }
  }, [actionMenuItem, dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const changeConfig = (config: { color: string; size: number }) => {
      applyToolStyle(ctx);
      ctx.strokeStyle =
        activeTool === MENU_ITEMS.ERASER ? "rgba(0,0,0,1)" : config.color;
      ctx.lineWidth = config.size;
    };
    changeConfig({ color, size });

    const onRemoteConfig = (config: { color: string; size: number }) => {
      changeConfig(config);
    };
    socket.on("changeConfig", onRemoteConfig);
    return () => {
      socket.off("changeConfig", onRemoteConfig);
    };
  }, [color, size, activeTool, applyToolStyle]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sender = () => socket.id ?? "";

    const getPoint = (e: PointerEvent): PathPayload => ({
      x: e.clientX - canvas.getBoundingClientRect().left,
      y: e.clientY - canvas.getBoundingClientRect().top,
    });

    const beginPath = (pt: PathPayload) => {
      applyToolStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    };

    const drawLine = (pt: PathPayload) => {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    };

    const handleBeginPath = (path: PathPayload) => {
      if (path.sender && path.sender === socket.id) return;
      applyToolStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(path.x, path.y);
    };

    const handleDrawLine = (path: PathPayload) => {
      if (path.sender && path.sender === socket.id) return;
      applyToolStyle(ctx);
      ctx.lineTo(path.x, path.y);
      ctx.stroke();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      canvas.setPointerCapture(e.pointerId);
      pointerId.current = e.pointerId;
      shouldDraw.current = true;
      const pt = { ...getPoint(e), sender: sender() };
      beginPath(pt);
      socket.emit("beginPath", pt);
    };

    const onMove = (e: PointerEvent) => {
      if (!shouldDraw.current || pointerId.current !== e.pointerId) return;
      const pt = { ...getPoint(e), sender: sender() };
      drawLine(pt);
      socket.emit("drawLine", pt);
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
      if (shouldDraw.current) {
        shouldDraw.current = false;
        pushHistorySnapshot();
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);
    canvas.addEventListener("pointerleave", endStroke);

    socket.on("beginPath", handleBeginPath);
    socket.on("drawLine", handleDrawLine);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", endStroke);
      canvas.removeEventListener("pointercancel", endStroke);
      canvas.removeEventListener("pointerleave", endStroke);
      socket.off("beginPath", handleBeginPath);
      socket.off("drawLine", handleDrawLine);
    };
  }, [applyToolStyle, pushHistorySnapshot]);

  return (
    <div ref={wrapRef} className="fixed inset-0 z-0 bg-[var(--canvas-paper)]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        aria-label="Drawing canvas"
      />
    </div>
  );
}
