// Shared look: text colours for a wallpaper overlay (Conky style) or a Fluent acrylic card.
import type { JSX } from "solid-js";
import { localeInfo, useAppearance, type Style } from "@vitrine/sdk";

export interface Look {
  /** Light text (for dark wallpapers / dark card). */
  dark: boolean;
  card: boolean;
  text: string;
  text2: string;
  text3: string;
  track: string;
  accent: string;
  onAccent: string;
  /** CSS text-shadow on the wallpaper, null on a card or when turned off. */
  shadow: string | null;
  /** Colour of the soft halo SVG strokes get under them (SVG has no shadow), or null. */
  halo: string | null;
}

export interface LookSettings {
  theme: string; // "dark" (light text) | "light" (dark text) | "auto" (follow Windows)
  accent: string; // "system" | "#RRGGBB"
  background: string; // "none" | "acrylic"
  shadow?: boolean;
}

const valid = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Mixes `hex` toward white (t > 0) or black (t < 0). */
function mix(hex: string, t: number): string {
  const to = t > 0 ? 255 : 0;
  const a = Math.abs(t);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - a) + to * a).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function look(s: LookSettings, system = { dark: true, accent: "#0078D4" }): Look {
  const dark = s.theme === "auto" ? system.dark : s.theme !== "light";
  let accent: string;
  if (s.accent === "system" || !valid(s.accent)) {
    const base = valid(system.accent) ? system.accent : "#0078D4";
    accent = dark ? mix(base, 0.45) : mix(base, -0.2);
  } else accent = s.accent;
  const card = s.background === "acrylic";
  const shade = !card && s.shadow !== false;
  const base = {
    dark,
    card,
    shadow: shade ? (dark ? "0 1px 8px rgba(0, 0, 0, 0.5)" : "0 0 8px rgba(255, 255, 255, 0.55)") : null,
    halo: shade ? (dark ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.22)") : null,
    accent,
    onAccent: luminance(accent) > 0.35 ? "#000000" : "#FFFFFF",
  };
  return dark
    ? { ...base, text: "#F8F8F2", text2: "rgba(248, 248, 242, 0.78)", text3: "rgba(248, 248, 242, 0.55)", track: "rgba(248, 248, 242, 0.25)" }
    : { ...base, text: "#212121", text2: "rgba(33, 33, 33, 0.78)", text3: "rgba(33, 33, 33, 0.55)", track: "rgba(33, 33, 33, 0.22)" };
}

/** The look from the widget's theme/accent/background settings, live with Windows appearance. */
export function useLook(settings: () => LookSettings): () => Look {
  const system = useAppearance();
  return () => look(settings(), system());
}

/** Resolves the "hourFormat" setting (auto / 12 / 24) against the Windows locale. */
export function uses12h(hourFormat: string): boolean {
  if (hourFormat === "12") return true;
  if (hourFormat === "24") return false;
  return localeInfo().hour12;
}

/**
 * The widget surface. Transparent by default, like the original desktop theme, with a soft
 * Gaussian text shadow for legibility on any wallpaper; "acrylic" puts the content on a
 * Windows 11 card instead.
 */
export function Surface(props: { l: Look; shadow?: boolean; style?: Style; children: (l: Look) => JSX.Element }) {
  return (
    <view
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        overflow: "hidden",
        color: props.l.text,
        ...(props.l.shadow ? { textShadow: props.l.shadow } : {}),
        ...(props.l.card
          ? {
              background: props.l.dark
                ? "linear-gradient(160deg, rgba(48, 48, 48, 0.86), rgba(30, 30, 30, 0.80))"
                : "linear-gradient(160deg, rgba(252, 252, 252, 0.88), rgba(240, 240, 240, 0.82))",
              border: `1px solid ${props.l.dark ? "rgba(255, 255, 255, 0.09)" : "rgba(0, 0, 0, 0.07)"}`,
            }
          : {}),
        ...props.style,
      }}
    >
      {props.children(props.l)}
    </view>
  );
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
