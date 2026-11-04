import { Index } from "solid-js";
import { mount, useSettings, useSystem } from "@vitrine/sdk";
import { Surface, clamp, type Look, useLook } from "../shared/look";
import { BatteryIcon, Icon, type IconName } from "../shared/icons";
import { DISPLAY } from "../shared/fonts";
import { flexAlign, legible, useFit } from "../shared/fit";

// Reference design, in the original theme's CSS pixels: 88 px dials 8 px apart, a 240° arc of
// radius 32 and stroke 8 (gap centred at the bottom), a 32 px icon in the middle and a 1rem
// Bebas Neue label sitting in the gap of the arc.
const SWEEP = 240;
const D = 88;
const R = 32;
const STROKE = 8;
const ICON = 32;
const LABEL = 16;
const BASELINE = 84; // label baseline from the top of the dial
const GAP = 8;
// The arcs leave 8 px of air inside the dial, so the outer padding is that much smaller.
const PAD = { bare: 2, card: 14 };

interface Gauge {
  label: string;
  value: number; // 0..100
  icon: IconName | { level: number; charging: boolean };
}

/** Point on a circle, angle in degrees clockwise from 12 o'clock. */
const pt = (c: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
};
function arc(c: number, r: number, from: number, to: number): string {
  return `M ${pt(c, r, from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(c, r, to)}`;
}

function Dial(props: { l: Look; g: Gauge; k: number; label: number; showValue: boolean }) {
  const d = () => D * props.k;
  const stroke = () => STROKE * props.k;
  const r = () => R * props.k;
  const c = () => d() / 2;
  const v = () => clamp(props.g.value, 0, 100);
  const len = () => (r() * SWEEP * Math.PI) / 180;
  const icon = () => ICON * props.k;
  const fs = () => props.label * props.k;
  const text = () => (props.showValue ? `${props.g.label} ${Math.round(props.g.value)}%` : props.g.label).toUpperCase();
  return (
    <view style={{ width: d(), height: d(), flexShrink: 0 }}>
      <svg width={d()} height={d()} viewBox={`0 0 ${d()} ${d()}`}>
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
          strokeDasharray={`${len() * (v() / 100)} ${len() + stroke() * 2}`}
          opacity={v() > 0.5 ? 1 : 0}
          style={{ transition: "stroke-dasharray 600ms ease" }}
        />
      </svg>
      <view style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
        {typeof props.g.icon === "string" ? (
          <Icon name={props.g.icon} size={icon()} color={props.l.text} halo={props.l.halo} />
        ) : (
          <BatteryIcon level={props.g.icon.level} charging={props.g.icon.charging} size={icon()} color={props.l.text} halo={props.l.halo} />
        )}
      </view>
      <view
        style={{
          position: "absolute",
          left: -GAP * props.k,
          right: -GAP * props.k,
          top: BASELINE * props.k - 0.8 * fs(),
          height: fs(),
          justifyContent: "center",
        }}
      >
        <text style={{ fontFamily: DISPLAY, fontSize: fs(), lineHeight: 1, color: props.l.text, whiteSpace: "nowrap" }}>{text()}</text>
      </view>
    </view>
  );
}

function Gauges() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    align: "left",
    showBattery: true,
    showDisk: false,
    drive: "C",
    showValues: false,
    interval: 2,
  });
  const l = useLook(s);
  const snap = useSystem(["cpu", "memory", "battery", "drives"], clamp(s().interval, 1, 30) * 1000);

  const gauges = (): Gauge[] => {
    const { cpu, memory, battery, drives } = snap();
    const g: Gauge[] = [
      { label: "CPU", value: cpu?.usage ?? 0, icon: "cpu" },
      { label: "RAM", value: memory && memory.total > 0 ? (memory.used / memory.total) * 100 : 0, icon: "memory" },
    ];
    if (s().showDisk) {
      const letter = (s().drive || "C").toUpperCase();
      const d = drives?.find((x) => x.name.toUpperCase().startsWith(letter + ":"));
      g.push({ label: `Disk ${letter}`, value: d && d.total > 0 ? (d.used / d.total) * 100 : 0, icon: "disk" });
    }
    if (s().showBattery && battery?.hasBattery) {
      const level = battery.level ?? 0;
      g.push({ label: "Battery", value: level, icon: { level, charging: !!battery.charging } });
    }
    return g;
  };

  const pad = () => (l().card ? PAD.card : PAD.bare);
  const n = () => gauges().length;
  // The row of dials at k = 1; the label stays legible and may then hang below the dial.
  const k = useFit((k) => {
    const below = Math.max(0, BASELINE + legible(LABEL, k) * 0.2 - D);
    return { w: n() * D + (n() - 1) * GAP + 2 * pad(), h: D + below + 2 * pad() };
  });
  const label = () => legible(LABEL, k());

  return (
    <Surface
      l={l()}
      k={k()}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: flexAlign(s().align), gap: GAP * k(), padding: pad() * k() }}
    >
      {(c) => <Index each={gauges()}>{(g) => <Dial l={c} g={g()} k={k()} label={label()} showValue={s().showValues} />}</Index>}
    </Surface>
  );
}

mount(() => <Gauges />);
