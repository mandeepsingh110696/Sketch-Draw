# SketchDraw

A browser-based drawing canvas built with **Next.js**, **React**, and the **Canvas 2D API**, with optional **real-time collaboration** through a small **Socket.IO** relay server.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

## Features

### Drawing tools

- **Pencil** — freehand strokes, color, size, and opacity
- **Highlighter** — translucent strokes (opacity tuned for markers)
- **Line** — click/touch and drag to place a straight segment
- **Rectangle** — drag to place a stroked rectangle
- **Eraser** — removes ink using the canvas composite mode (`destination-out`)

### Color and brush

- Preset **swatches** plus a native **color picker**
- **Recently used colors** (stored in `localStorage`)
- **Opacity** slider for pencil, highlighter, line, and rectangle tools

### Canvas and export

- Optional **dot grid** behind the artboard (toggle in the sidebar)
- **Undo / redo** with keyboard shortcuts **⌘Z** / **⌃Z** and **⇧⌘Z** / **⇧⌃Z**
- **Clear canvas**
- **Export PNG** — optional **transparent background** (no paper fill) when enabled in the sidebar

### Real-time collaboration

- **`server/socket-server.ts`** — relays `beginPath`, `drawLine`, and `changeConfig` only to clients in the same **room** (run via `pnpm socket` using `tsx`)
- **Room** is chosen via the URL: `?room=<id>`. If omitted, clients join the default room **`public`**
- **Collab bar** (bottom): connection status, approximate **peer count** for the room, **copy link**, and **new room** (reloads with a fresh `?room=` so the socket reconnects in that room)
- Remote strokes carry **tool, color, size, and opacity** so other participants see the correct appearance, not your local tool settings

Collaboration is **best-effort**: anyone with the room URL can draw; there is **no built-in account authentication**. Undo/clear are **local** unless you extend the protocol.

## Tool reference

| Tool          | Description                                              |
| ------------- | -------------------------------------------------------- |
| Pencil        | Freehand drawing; color, size, opacity                   |
| Highlighter   | Semi-transparent freehand strokes                      |
| Line          | Straight segment from press to release                   |
| Rectangle     | Stroked axis-aligned rectangle from drag               |
| Eraser        | Erases ink by destination-out composite                  |

## Getting started

### Prerequisites

- **Node.js** (LTS recommended)
- **pnpm** (`corepack enable` or install from [pnpm.io](https://pnpm.io))

### Install

```bash
pnpm install
```

### Run the web app

```bash
pnpm dev
```

Open the URL shown in the terminal (usually `http://localhost:3000`).

### Run real-time relay (optional)

In a **second** terminal:

```bash
pnpm socket
```

By default the relay listens on **port 8500** (override with `PORT`).

With **`pnpm dev`** + **`pnpm socket`**, the client connects to `http://localhost:8500` when `NEXT_PUBLIC_SOCKET_URL` is unset in development.

## Scripts

| Command        | Description                                         |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Next.js development server                          |
| `pnpm build`   | Production build                                    |
| `pnpm start`   | Start production Next.js server (after `build`)     |
| `pnpm socket`  | Start Socket.IO relay (`server/socket-server.ts` via `tsx`) |
| `pnpm lint`    | Run Biome check                                     |
| `pnpm lint:fix`| Biome check with auto-fix where possible             |

## Environment variables

| Variable                    | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SOCKET_URL`    | Public **https** base URL of the Socket.IO relay (no trailing slash). Browsers need this in production when the relay is **not** on the same hostname as the app. If unset in production, the client falls back to the **current page origin** (only works if something on that host proxies `/socket.io` to your relay). |
| `PORT`                      | Only for running **`pnpm socket`** locally or on your relay host (default **8500**). Not something you set for the Next.js app on Vercel. |

### Vercel

In **Settings → Environment Variables**, add **`NEXT_PUBLIC_SOCKET_URL`** with whatever public HTTPS URL your relay actually uses (where you deployed `server/socket-server.ts`). Enable it for Production; add it to Preview deployments too if you use those and the relay is fine talking to preview URLs.

These values are baked in at **build time**, so redeploy after you change them.

Collaboration needs that relay on a normal always-on Node host (Railway, Fly, a VPS, etc.)—not inside this Vercel project. Without `NEXT_PUBLIC_SOCKET_URL`, the client assumes the socket lives on the same host as the site, which usually isn’t true, so realtime drawing won’t connect unless you’ve wired up a proxy yourself.

No other env vars are required for the canvas, export, or UI.

## Production notes

1. **Deploy two pieces**: the **Next.js** app and the **socket relay**, unless you put both behind one hostname and proxy WebSocket traffic to the relay.
2. Set **`NEXT_PUBLIC_SOCKET_URL`** to the relay’s HTTPS URL, then **rebuild** the frontend so the browser knows where to connect.
3. The relay uses permissive CORS (`origin: true`) for flexibility; you may want to **restrict `origin`** to your real site in production.
4. **Peer count** is “connections in this room,” not unique logged-in users (multiple tabs count separately).

## Technical overview

- **Rendering**: single full-viewport `<canvas>` with device pixel ratio scaling; history stacks **full-canvas `ImageData`** snapshots for undo/redo
- **State**: Redux Toolkit (`menu`, `toolbox`, `preferences`)
- **Input**: Pointer Events API for mouse and touch
- **Lint / format**: [Biome](https://biomejs.dev/)

## Possible next steps

- Vector or stroke-list history for lighter undo on large canvases
- Server-side or CRDT-based sync for undo/clear/shared state
- Auth and private rooms

---

SketchDraw began as a bare-bones drawing page. It’s now a Next.js app with a proper tool palette and optional realtime rooms so more than one person can sketch at once.
