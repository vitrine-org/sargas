import { For } from "solid-js";
import { formatDate, mount, useClock, useSettings } from "@vitrine/sdk";
import { Surface, useLook, uses12h } from "../shared/look";
import { DISPLAY } from "../shared/fonts";
import { BEBASNEUE_REGULAR as BEBAS } from "../shared/metrics";
import { bearings, capTrim, flexAlign, textWidth, useFit, useShape } from "../shared/fit";

// The original themes are English: dates are never translated.
const EN = "en-US";

// Reference design, in the original theme's CSS pixels: Bebas Neue at 5.653rem, line height 0.9.
const F = 90;
const LH = 0.9;
const AMPM = 0.4; // AM / PM, relative to F
const PAD = { bare: 8, card: 22 };

const WEEKDAYS = Array.from({ length: 7 }, (_, i) => formatDate(new Date(2024, 0, 1 + i), "dddd", EN).toUpperCase());
const MONTHS = Array.from({ length: 12 }, (_, i) => formatDate(new Date(2024, i, 1), "MMMM", EN).toUpperCase());

/** Ink width of a line at F, without the side bearings of its ends. */
function ink(text: string): number {
  const [l, r] = bearings(BEBAS, text, F);
  return textWidth(BEBAS, text, F) - l - r;
}

interface Line {
  text: string; // the line as drawn (for the bearings)
  widest: number; // widest ink this line can take, so the size never changes with the day
  time?: boolean;
}

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
  const shape = useShape();
  const now = useClock("minute");
  const h12 = () => uses12h(s().hourFormat);

  const hours = () => formatDate(now(), h12() ? "h" : "HH", EN);
  const minutes = () => formatDate(now(), "mm", EN);
  const ampm = () => (h12() ? formatDate(now(), "A", EN) || (now().getHours() < 12 ? "AM" : "PM") : "");
  const timeWidest = () =>
    h12() ? ink("12:59") + textWidth(BEBAS, " PM", F * AMPM) - bearings(BEBAS, "M", F * AMPM)[1] + bearings(BEBAS, "9", F)[1] : ink("23:59");

  // Square and tall boxes stack year, weekday, day, month and time as in the original; wide
  // boxes pair them up: weekday and day, month and year, then the time.
  const lines = (): Line[] => {
    const d = now();
    const year = formatDate(d, "YYYY", EN);
    const day = formatDate(d, "D", EN);
    const weekday = formatDate(d, "dddd", EN).toUpperCase();
    const month = formatDate(d, "MMMM", EN).toUpperCase();
    const out: Line[] = [];
    if (shape() === "wide") {
      out.push({ text: `${weekday} ${day}`, widest: Math.max(...WEEKDAYS.map((w) => ink(`${w} 30`))) });
      const y = s().showYear ? " " + year : "";
      out.push({ text: month + y, widest: Math.max(...MONTHS.map((m) => ink(m + y))) });
    } else {
      if (s().showYear) out.push({ text: year, widest: ink(year) });
      out.push({ text: weekday, widest: Math.max(...WEEKDAYS.map(ink)) });
      out.push({ text: day, widest: ink("30") });
      out.push({ text: month, widest: Math.max(...MONTHS.map(ink)) });
    }
    if (s().showTime) out.push({ text: hours() + ":" + minutes(), widest: timeWidest(), time: true });
    return out;
  };

  const pad = () => (l().card ? PAD.card : PAD.bare);
  const k = useFit(() => {
    const ls = lines();
    return {
      w: Math.max(...ls.map((x) => x.widest)) + 2 * pad(),
      h: ((ls.length - 1) * LH + BEBAS.cap / 1000) * F + 2 * pad(),
    };
  });
  const fs = () => F * k();

  // Crop each line to its ink so the stack aligns on the letters, not on their side bearings.
  const style = (ln: Line, i: number, n: number) => {
    const [bl, br] = bearings(BEBAS, ln.text, fs());
    const trim = capTrim(BEBAS, fs(), LH);
    return {
      fontFamily: DISPLAY,
      fontSize: fs(),
      lineHeight: LH,
      color: l().text,
      whiteSpace: "nowrap" as const,
      marginLeft: -bl,
      marginRight: ln.time && ampm() ? -bearings(BEBAS, "M", fs() * AMPM)[1] : -br,
      marginTop: i === 0 ? trim.marginTop : 0,
      marginBottom: i === n - 1 ? trim.marginBottom : 0,
    };
  };

  return (
    <Surface
      l={l()}
      k={k()}
      style={{ flexDirection: "column", justifyContent: "center", alignItems: flexAlign(s().align), padding: pad() * k() }}
    >
      {(c) => (
        <For each={lines()}>
          {(ln, i) =>
            ln.time ? (
              <text style={style(ln, i(), lines().length)}>
                {hours() + ":"}
                <span style={{ color: c.accent }}>{minutes()}</span>
                {ampm() ? <span style={{ fontSize: fs() * AMPM }}>{" " + ampm()}</span> : null}
              </text>
            ) : (
              <text style={style(ln, i(), lines().length)}>{ln.text}</text>
            )
          }
        </For>
      )}
    </Surface>
  );
}

mount(() => <DateTime />);
