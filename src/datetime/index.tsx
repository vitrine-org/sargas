import { formatDate, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Surface, clamp, useLook, uses12h } from "../shared/look";
import { DISPLAY } from "../shared/fonts";

// The original themes are English: dates are never translated.
const EN = "en-US";

// Bebas Neue is condensed: an average glyph is about 0.4 em wide.
const GLYPH = 0.41;
const LINE = 0.9;

function DateTime() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    align: "left",
    showYear: true,
    showTime: true,
    hourFormat: "auto",
  });
  const l = useLook(s);
  const size = useSize();
  const now = useClock("minute");
  const h12 = () => uses12h(s().hourFormat);

  const lines = () => {
    const d = now();
    const v = [formatDate(d, "dddd", EN), formatDate(d, "D", EN), formatDate(d, "MMMM", EN)];
    if (s().showYear) v.unshift(formatDate(d, "YYYY", EN));
    return v.map((t) => t.toUpperCase());
  };
  const hours = () => formatDate(now(), h12() ? "h" : "HH", EN);
  const minutes = () => formatDate(now(), "mm", EN);
  const ampm = () => (h12() ? formatDate(now(), "A", EN) || (now().getHours() < 12 ? "AM" : "PM") : "");

  const pad = () => (l().card ? 16 : 6);
  const fontSize = () => {
    const rows = lines().length + (s().showTime ? 1 : 0);
    const widest = Math.max(...lines().map((t) => t.length), s().showTime ? 5 + (h12() ? 1.2 : 0) : 0);
    const byH = (size().height - pad() * 2) / (rows * LINE);
    const byW = (size().width - pad() * 2) / (widest * GLYPH);
    return Math.floor(clamp(Math.min(byH, byW), 14, 220));
  };
  const align = () => (s().align === "right" ? "flex-end" : s().align === "center" ? "center" : "flex-start");

  return (
    <Surface
      l={l()}
      shadow={s().shadow}
      style={{ flexDirection: "column", justifyContent: "center", alignItems: align(), padding: pad() }}
    >
      {(c) => (
        <>
      {lines().map((t) => (
        <text style={{ fontFamily: DISPLAY, fontSize: fontSize(), lineHeight: LINE, color: c.text, whiteSpace: "nowrap" }}>{t}</text>
      ))}
      {s().showTime ? (
        <text style={{ fontFamily: DISPLAY, fontSize: fontSize(), lineHeight: LINE, color: c.text, whiteSpace: "nowrap" }}>
          {hours() + ":"}
          <span style={{ color: c.accent }}>{minutes()}</span>
          {ampm() ? <span style={{ fontSize: Math.round(fontSize() * 0.4) }}>{" " + ampm()}</span> : null}
        </text>
      ) : null}
            </>
      )}
    </Surface>
  );
}

mount(() => <DateTime />);
