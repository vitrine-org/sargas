import { Index } from "solid-js";
import { formatDate, localeInfo, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Surface, clamp, useLook } from "../shared/look";
import { BODY, DISPLAY } from "../shared/fonts";

// The month as a Conky block: its name stacked in Bebas Neue over a bare grid of days,
// gone days dimmed, today in the accent color with a short bar under it.

interface Cell {
  day: number; // 0 = blank (a day of the next or previous month)
  past: boolean;
  today: boolean;
}

function Calendar() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    align: "left",
    firstDayOfWeek: "auto",
    showYear: true,
    dimPast: true,
  });
  const l = useLook(s);
  const size = useSize();
  const now = useClock("minute");

  const first = () => (s().firstDayOfWeek === "auto" ? localeInfo().firstDayOfWeek : Number(s().firstDayOfWeek)) || 0;
  const cells = (): Cell[] => {
    const d = now();
    const y = d.getFullYear();
    const m = d.getMonth();
    const lead = (new Date(y, m, 1).getDay() - first() + 7) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const out: Cell[] = [];
    for (let i = 0; i < lead; i++) out.push({ day: 0, past: false, today: false });
    for (let i = 1; i <= days; i++) out.push({ day: i, past: i < d.getDate(), today: i === d.getDate() });
    while (out.length % 7) out.push({ day: 0, past: false, today: false });
    return out;
  };
  const weeks = () => cells().length / 7;
  const heads = () => {
    const names = localeInfo().daysShort;
    // Three letters where they fit the column, else two, else one.
    const cell = innerW() / 7;
    const wf = headFs();
    const n = [3, 2, 1].find((k) => k * wf * 0.78 + (k - 1) * 1 <= cell * 0.82) ?? 1;
    return Array.from({ length: 7 }, (_, i) => (names[(first() + i) % 7] ?? "").slice(0, n).toUpperCase());
  };
  const month = () => formatDate(now(), "MMMM").toUpperCase();
  const year = () => formatDate(now(), "YYYY");

  const pad = () => (l().card ? 16 : 6);
  const innerW = () => size().width - pad() * 2;
  const innerH = () => size().height - pad() * 2;
  // Height budget in units of the day size: header 1.75, weekday row 0.75, each week 1.25.
  const fs = () => {
    const byH = innerH() / (1.75 + 0.75 + weeks() * 1.25);
    const byW = innerW() / 7 / 1.05;
    return Math.floor(clamp(Math.min(byH, byW), 9, 90));
  };
  const headFs = () => Math.max(7, Math.round(fs() * 0.3));
  const head = () => {
    const chars = month().length + (s().showYear ? 5 : 0);
    return Math.floor(Math.min(fs() * 1.75 / 0.9, innerW() / (chars * 0.41)));
  };
  const align = () => (s().align === "right" ? "flex-end" : s().align === "center" ? "center" : "flex-start");

  return (
    <Surface l={l()} shadow={s().shadow} style={{ flexDirection: "column", justifyContent: "center", padding: pad() }}>
      {(c) => (
        <>
          <view style={{ flexDirection: "row", justifyContent: align(), height: fs() * 1.75, alignItems: "flex-end", flexShrink: 0 }}>
            <text style={{ fontFamily: DISPLAY, fontSize: head(), lineHeight: 0.9, color: c.text, whiteSpace: "nowrap" }}>
              {month()}
              {s().showYear ? <span style={{ color: c.accent }}>{" " + year()}</span> : null}
            </text>
          </view>
          <view style={{ flexDirection: "row", height: fs() * 0.75, alignItems: "center", flexShrink: 0 }}>
            <Index each={heads()}>
              {(h) => (
                <text
                  style={{
                    flex: 1,
                    fontFamily: BODY,
                    fontSize: headFs(),
                    letterSpacing: 1,
                    color: c.text2,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h()}
                </text>
              )}
            </Index>
          </view>
          <view style={{ flexDirection: "row", flexWrap: "wrap", flexShrink: 0 }}>
            <Index each={cells()}>
              {(cell) => (
                <view style={{ width: `${100 / 7}%`, height: fs() * 1.25, alignItems: "center", justifyContent: "center" }}>
                  {cell().day ? (
                    <text
                      style={{
                        fontFamily: DISPLAY,
                        fontSize: fs(),
                        lineHeight: 1,
                        color: cell().today ? c.accent : cell().past && s().dimPast ? c.text3 : c.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {String(cell().day)}
                    </text>
                  ) : null}
                  {cell().today ? (
                    <view
                      style={{
                        position: "absolute",
                        bottom: fs() * 0.04,
                        width: Math.max(8, fs() * 0.7),
                        height: Math.max(2, Math.round(fs() * 0.09)),
                        borderRadius: 2,
                        background: c.accent,
                      }}
                    />
                  ) : null}
                </view>
              )}
            </Index>
          </view>
        </>
      )}
    </Surface>
  );
}

mount(() => <Calendar />);
