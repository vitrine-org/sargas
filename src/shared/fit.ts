// Responsive layout: the box's shape picks the layout, its size only scales it. Each widget draws
// a reference design in design units (the original theme's CSS pixels) and multiplies every
// length by one factor k, the largest that fits the design in the box. Text never goes below a
// legible floor (`MIN_TEXT` DIPs, `MIN_VALUE` for primary values): near the smallest sizes the
// small texts stop shrinking and the rest of the design makes room for them.
import { createMemo } from "solid-js";
import { useSize } from "@vitrine/sdk";
import type { FontData } from "./metrics";

export type Shape = "wide" | "square" | "tall";

/** Shape of a box from its aspect ratio, with the engine's thresholds. */
export function shapeOf(w: number, h: number): Shape {
  const a = w / Math.max(1, h);
  return a >= 1.25 ? "wide" : a <= 0.8 ? "tall" : "square";
}

export function useShape(): () => Shape {
  const size = useSize();
  return () => shapeOf(size().width, size().height);
}

export const MIN_TEXT = 11;
export const MIN_VALUE = 12;

/** A text size in design units that stays at least `min` DIPs once scaled by `k`. */
export const legible = (size: number, k: number, min = MIN_TEXT) => Math.max(size, min / k);

/**
 * Factor that fits the design into the widget box. `design(k)` gives its size in design units
 * at scale k (sizes made `legible` grow as k shrinks), so the fit is refined a few times.
 */
export function useFit(design: (k: number) => { w: number; h: number }): () => number {
  const size = useSize();
  return createMemo(() => {
    let k = 1;
    for (let i = 0; i < 6; i++) {
      const d = design(k);
      k = Math.max(0.05, Math.min(size().width / d.w, size().height / d.h));
    }
    return k;
  });
}

const lookup = new WeakMap<FontData, Map<string, number>>();
function at(f: FontData, ch: string): number {
  let m = lookup.get(f);
  if (!m) {
    m = new Map();
    for (let i = f.chars.length - 1; i >= 0; i--) m.set(f.chars[i], i);
    lookup.set(f, m);
  }
  const i = m.get(ch);
  return i === undefined ? -1 : i;
}

/** Fallback advance for characters the table lacks: the width of an "n". */
const fallback = (f: FontData) => f.adv[at(f, "n")] ?? 550;

/**
 * Width in px of one line of `text` at `size` px, with `track` em of letter spacing between
 * characters (the renderer also adds it after the last one: see `trailing`).
 */
export function textWidth(f: FontData, text: string, size: number, track = 0): number {
  let w = 0;
  let n = 0;
  for (const ch of text) {
    const i = at(f, ch);
    w += i < 0 ? fallback(f) : f.adv[i];
    n++;
  }
  return (w / 1000) * size + Math.max(0, n - 1) * track * size;
}

/** Widest of several lines. */
export const widest = (f: FontData, lines: string[], size: number, track = 0) =>
  Math.max(0, ...lines.map((t) => textWidth(f, t, size, track)));

/** Left side bearing of the first character and right one of the last, in px. */
export function bearings(f: FontData, text: string, size: number): [number, number] {
  const chars = [...text];
  if (!chars.length) return [0, 0];
  const l = at(f, chars[0]);
  const r = at(f, chars[chars.length - 1]);
  return [((l < 0 ? 0 : f.lsb[l]) / 1000) * size, ((r < 0 ? 0 : f.rsb[r]) / 1000) * size];
}

/**
 * Margins that crop a text box to the ink of its capitals (and, with `desc`, of descenders
 * `desc` em deep), for optical alignment. The renderer gives each line `lh` × size and puts
 * the baseline at 0.8 of it.
 */
export function capTrim(f: FontData, size: number, lh: number, desc = 0) {
  return {
    marginTop: -(0.8 * lh - f.cap / 1000) * size,
    marginBottom: -(0.2 * lh - desc) * size,
  };
}

/** Height in px of `lines` lines cropped as `capTrim` does. */
export const capHeight = (f: FontData, size: number, lh: number, lines = 1, desc = 0) =>
  ((lines - 1) * lh + f.cap / 1000 + desc) * size;

/** Flex alignment for an align setting ("left" / "center" / "right"). */
export const flexAlign = (a: string) => (a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start");
export const textAlignOf = (a: string) => (a === "right" ? "end" : a === "center" ? "center" : "start");
