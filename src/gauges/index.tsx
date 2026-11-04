import { Index } from "solid-js";
import { mount, useSettings, useSize, useSystem } from "@vitrine/sdk";
import { Surface, clamp, type Look, useLook } from "../shared/look";
import { BatteryIcon, Icon, type IconName } from "../shared/icons";
import { DISPLAY } from "../shared/fonts";

const SWEEP = 240; // degrees, gap centred at the bottom as in the original theme

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

function Dial(props: { l: Look; g: Gauge; d: number; showValue: boolean }) {
  const stroke = () => Math.max(3, props.d / 11);
  const r = () => props.d * (32 / 88);
  const c = () => props.d / 2;
  const v = () => clamp(props.g.value, 0, 100);
  const len = () => (r() * SWEEP * Math.PI) / 180;
  const icon = () => Math.round(props.d * (32 / 88));
  const label = () => (props.showValue ? `${props.g.label} ${Math.round(props.g.value)}%` : props.g.label);
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
      <view style={{ position: "absolute", left: 0, bottom: 0, width: "100%", alignItems: "center", justifyContent: "center" }}>
        <text style={{ fontFamily: DISPLAY, fontSize: Math.max(10, Math.round(props.d * 0.18)), lineHeight: 1, color: props.l.text, whiteSpace: "nowrap" }}>
          {label().toUpperCase()}
        </text>
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
  const size = useSize();
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

  const pad = () => (l().card ? 12 : 4);
  const gap = 8;
  const dial = () => {
    const n = gauges().length;
    const byW = (size().width - pad() * 2 - gap * (n - 1)) / n;
    return Math.floor(clamp(Math.min(byW, size().height - pad() * 2), 40, 200));
  };
  const justify = () => (s().align === "right" ? "flex-end" : s().align === "center" ? "center" : "flex-start");

  return (
    <Surface l={l()} shadow={s().shadow} style={{ flexDirection: "row", alignItems: "center", justifyContent: justify(), gap, padding: pad() }}>
      {(c) => (
        <>
      <Index each={gauges()}>{(g) => <Dial l={c} g={g()} d={dial()} showValue={s().showValues} />}</Index>
            </>
      )}
    </Surface>
  );
}

mount(() => <Gauges />);
