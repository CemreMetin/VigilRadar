import type { Map as MlMap } from "maplibre-gl";
import { COLOR } from "@/lib/palette";

// Procedural @2x Retina cartographic instrument glyphs (Braun / Taktil Minimalizm).
// Zero external image requests, zero glyph/font server, GPU-composited at 60 FPS by MapLibre.

function makeIcon(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw(ctx, size);
  const { width, height, data } = ctx.getImageData(0, 0, size, size);
  return { width, height, data };
}

function drawPlant(stroke: string, core: string, active: boolean) {
  return makeIcon(32, (ctx, s) => {
    const c = s / 2;
    const r = active ? 9.5 : 7.5;
    // subtle dark backing for figure-ground clarity over countries
    ctx.beginPath();
    ctx.moveTo(c, c - r);
    ctx.lineTo(c + r, c);
    ctx.lineTo(c, c + r);
    ctx.lineTo(c - r, c);
    ctx.closePath();
    ctx.fillStyle = "rgba(18, 17, 16, 0.88)";
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = active ? 2.4 : 1.8;
    ctx.stroke();
    // cardinal precision ticks on active/chronic plants
    if (active) {
      ctx.strokeStyle = "rgba(244, 239, 230, 0.65)";
      ctx.lineWidth = 1.4;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        ctx.beginPath();
        ctx.moveTo(c + dx * (r + 1.5), c + dy * (r + 1.5));
        ctx.lineTo(c + dx * (r + 4.5), c + dy * (r + 4.5));
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.arc(c, c, active ? 3.2 : 2.2, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  });
}

function drawStrait(stroke: string, core: string, active: boolean) {
  return makeIcon(40, (ctx, s) => {
    const cx = s / 2;
    const cy = s / 2;
    // maritime channel gate ][ (converging funnel brackets)
    ctx.strokeStyle = "rgba(18, 17, 16, 0.9)";
    ctx.lineWidth = active ? 5.2 : 4.2;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 11, cy - 8);
      ctx.lineTo(cx + dir * 5.5, cy - 3.5);
      ctx.lineTo(cx + dir * 5.5, cy + 3.5);
      ctx.lineTo(cx + dir * 11, cy + 8);
      ctx.stroke();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = active ? 2.5 : 2;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 11, cy - 8);
      ctx.lineTo(cx + dir * 5.5, cy - 3.5);
      ctx.lineTo(cx + dir * 5.5, cy + 3.5);
      ctx.lineTo(cx + dir * 11, cy + 8);
      ctx.stroke();
    }
    // central transit bead
    ctx.beginPath();
    ctx.arc(cx, cy, active ? 3.4 : 2.3, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  });
}

function drawConflict(size: number) {
  return makeIcon(size, (ctx, s) => {
    const pad = 4;
    const len = Math.max(5, Math.round(s * 0.24));
    const a = pad;
    const b = s - pad;
    // soft matte terracotta tint inside viewfinder
    ctx.fillStyle = "rgba(224, 90, 43, 0.16)";
    ctx.fillRect(a, a, b - a, b - a);
    // four architectural corner brackets
    ctx.strokeStyle = COLOR.accent;
    ctx.lineWidth = 2.2;
    const corners: [number, number, number, number][] = [
      [a, a, 1, 1],
      [b, a, -1, 1],
      [b, b, -1, -1],
      [a, b, 1, -1],
    ];
    for (const [x, y, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + dx * len, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * len);
      ctx.stroke();
    }
    // centre pip
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.fg;
    ctx.fill();
  });
}

function drawVolcano() {
  return makeIcon(36, (ctx, s) => {
    const cx = s / 2;
    // classic geological caldera triangle with crater dot
    ctx.beginPath();
    ctx.moveTo(cx, 5);
    ctx.lineTo(s - 5, s - 6);
    ctx.lineTo(5, s - 6);
    ctx.closePath();
    ctx.fillStyle = "rgba(18, 17, 16, 0.9)";
    ctx.fill();
    ctx.strokeStyle = COLOR.geo;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, s - 13, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.fg;
    ctx.fill();
  });
}

function drawShock() {
  return makeIcon(48, (ctx, s) => {
    const c = s / 2;
    // outer telemetry ring
    ctx.beginPath();
    ctx.arc(c, c, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(224, 90, 43, 0.18)";
    ctx.fill();
    ctx.strokeStyle = COLOR.fg;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // cardinal Braun crosshair ticks
    ctx.strokeStyle = COLOR.fg;
    ctx.lineWidth = 1.8;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      ctx.beginPath();
      ctx.moveTo(c + dx * 10, c + dy * 10);
      ctx.lineTo(c + dx * 21, c + dy * 21);
      ctx.stroke();
    }
    // solid terracotta centre + cream pinpoint
    ctx.beginPath();
    ctx.arc(c, c, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.fg;
    ctx.fill();
  });
}

function drawLanding() {
  return makeIcon(24, (ctx, s) => {
    const c = s / 2;
    ctx.beginPath();
    ctx.arc(c, c, 6.2, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.bg;
    ctx.fill();
    ctx.strokeStyle = COLOR.fg;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLOR.accent;
    ctx.fill();
  });
}

/** Registers every procedural @2x cartographic icon on a freshly loaded MapLibre map. */
export function registerMapGlyphs(map: MlMap): void {
  const icons: Record<string, ReturnType<typeof makeIcon>> = {
    "plant-idle": drawPlant(COLOR.dim, COLOR.stone, false),
    "plant-chronic": drawPlant(COLOR.geo, COLOR.geo, true),
    "plant-active": drawPlant(COLOR.accent, COLOR.fg, true),
    "strait-idle": drawStrait(COLOR.stone, COLOR.dim, false),
    "strait-chronic": drawStrait(COLOR.geo, COLOR.fg, true),
    "strait-active": drawStrait(COLOR.accent, COLOR.fg, true),
    "conflict-sm": drawConflict(32),
    "conflict-md": drawConflict(40),
    "conflict-lg": drawConflict(50),
    volcano: drawVolcano(),
    shock: drawShock(),
    landing: drawLanding(),
  };
  for (const [name, img] of Object.entries(icons)) {
    if (!map.hasImage(name)) map.addImage(name, img, { pixelRatio: 2 });
  }
}
