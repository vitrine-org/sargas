import { Index } from "solid-js";
import { localeInfo, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Surface, clamp, type Look, useLook } from "../shared/look";
import { DISPLAY } from "../shared/fonts";

// The day, week, month and year as the theme's open 240° arcs, the share gone written inside.

const SWEEP = 240;

const pt = (c: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
};
const arc = (c: number, r: number, from: number, to: number) =>
  `M ${pt(c, r, from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(c, r, to)}`;

interface Span {
  label: string;
  value: number; // 0..1
}

function Dial(props: { l: Look; g: Span; d: number }) {
  const stroke = () => Math.max(3, props.d / 11);
  const r = () => props.d * (32 / 88);
  const c = () => props.d / 2;
  const len = () => (r() * SWEEP * Math.PI) / 180;
  const pct = () => Math.floor(clamp(props.g.value, 0, 1) * 100);
  const big = () => Math.round(props.d * 0.3);
  return (
    <view style={{ width: props.d, height: props.d, flexShrink: 0 }}>
      <svg width={props.d} height={props.d} viewBox={`0 0 ${props.d} ${props.d}`}>
        {props.l.halo ? (
          <path d={arc(c(), r(), -SWEEP / 2, SWEEP / 2)} fill="none" stroke={props.l.halo} strokeWidth={stroke() * 1.4} strokeLinecap="round" />
        ) : null}
        <path d={arc(c(), r(), -SWEEP / 2, SWEEP / 2)} fill="none" stroke={props.l.track} strokeWidth={stroke()} strokeLinecap="round" />
        <path
          d={arc(c(), r(), -SWEEP / 2, SWEEP / 2)}
          fill="none"
          stroke={props.l.accent}
          strokeWidth={stroke()}
          strokeLinecap="round"
          strokeDasharray={`${len() * clamp(props.g.value, 0, 1)} ${len() + stroke() * 2}`}
          opacity={props.g.value > 0.005 ? 1 : 0}
          style={{ transition: "stroke-dasharray 600ms ease" }}
        />
      </svg>
      <view style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", paddingTop: props.d * 0.02 }}>
        <text style={{ fontFamily: DISPLAY, fontSize: big(), lineHeight: 1, color: props.l.text, whiteSpace: "nowrap" }}>
          {String(pct())}
          <span style={{ fontSize: Math.round(big() * 0.5), color: props.l.text2 }}>%</span>
        </text>
      </view>
      <view style={{ position: "absolute", left: 0, bottom: 0, width: "100%", alignItems: "center", justifyContent: "center" }}>
        <text style={{ fontFamily: DISPLAY, fontSize: Math.max(10, Math.round(props.d * 0.18)), lineHeight: 1, color: props.l.text, whiteSpace: "nowrap" }}>
          {props.g.label}
        </text>
      </view>
    </view>
  );
}

function Progress() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    align: "left",
    showDay: true,
    showWeek: true,
    showMonth: true,
    showYear: true,
    firstDayOfWeek: "auto",
  });
  const l = useLook(s);
  const size = useSize();
  const now = useClock("minute");

  const spans = (): Span[] => {
    const d = now();
    const t = d.getTime();
    const y = d.getFullYear();
    const m = d.getMonth();
    const midnight = new Date(y, m, d.getDate()).getTime();
    const first = (s().firstDayOfWeek === "auto" ? localeInfo().firstDayOfWeek : Number(s().firstDayOfWeek)) || 0;
    const weekStart = new Date(y, m, d.getDate() - ((d.getDay() - first + 7) % 7)).getTime();
    const within = (a: number, b: number) => (t - a) / (b - a);
    const out: Span[] = [];
    if (s().showDay) out.push({ label: "DAY", value: within(midnight, new Date(y, m, d.getDate() + 1).getTime()) });
    if (s().showWeek) out.push({ label: "WEEK", value: within(weekStart, weekStart + 7 * 86_400_000) });
    if (s().showMonth) out.push({ label: "MONTH", value: within(new Date(y, m, 1).getTime(), new Date(y, m + 1, 1).getTime()) });
    if (s().showYear) out.push({ label: String(y), value: within(new Date(y, 0, 1).getTime(), new Date(y + 1, 0, 1).getTime()) });
    return out;
  };

  const pad = () => (l().card ? 12 : 4);
  const gap = 8;
  const dial = () => {
    const n = Math.max(1, spans().length);
    const byW = (size().width - pad() * 2 - gap * (n - 1)) / n;
    return Math.floor(clamp(Math.min(byW, size().height - pad() * 2), 40, 200));
  };
  const justify = () => (s().align === "right" ? "flex-end" : s().align === "center" ? "center" : "flex-start");

  return (
    <Surface l={l()} shadow={s().shadow} style={{ flexDirection: "row", alignItems: "center", justifyContent: justify(), gap, padding: pad() }}>
      {(c) => (
        <>
          <Index each={spans()}>{(g) => <Dial l={c} g={g()} d={dial()} />}</Index>
        </>
      )}
    </Surface>
  );
}

mount(() => <Progress />);
