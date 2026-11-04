import { createEffect, createSignal } from "solid-js";
import { mount, useSettings, useSize, useSystem } from "@vitrine/sdk";
import { Surface, clamp, type Look, useLook } from "../shared/look";
import { BODY, DISPLAY } from "../shared/fonts";

// Download and upload as two Bebas Neue readings over a Conky-style trace of the last minute.

const HISTORY = 60;

function rate(bytesPerSec: number | undefined, units: string): [string, string] {
  if (bytesPerSec === undefined) return ["–", ""];
  const bits = units !== "bytes";
  let v = bits ? bytesPerSec * 8 : bytesPerSec;
  const names = bits ? ["BPS", "KBPS", "MBPS", "GBPS"] : ["B/S", "KB/S", "MB/S", "GB/S"];
  let i = 0;
  while (v >= 1000 && i < names.length - 1) {
    v /= bits ? 1000 : 1024;
    i++;
  }
  return [v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1), names[i]];
}

/** A down or up chevron drawn to sit on the reading's label line. */
function Chevron(props: { up: boolean; size: number; color: string; halo: string | null }) {
  const d = () => (props.up ? "M 3 9 L 7 5 L 11 9" : "M 3 5 L 7 9 L 11 5");
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 14 14">
      {props.halo ? <path d={d()} fill="none" stroke={props.halo} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
      <path d={d()} fill="none" stroke={props.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Reading(props: { l: Look; up: boolean; label: string; value: [string, string]; fs: number; align: string }) {
  const small = () => Math.max(8, Math.round(props.fs * 0.26));
  return (
    <view style={{ flexDirection: "column", alignItems: props.align as any, flexShrink: 0 }}>
      <view style={{ flexDirection: "row", alignItems: "center", gap: Math.round(small() * 0.3) }}>
        <Chevron up={props.up} size={Math.round(small() * 1.3)} color={props.up ? props.l.text2 : props.l.accent} halo={props.l.halo} />
        <text style={{ fontFamily: BODY, fontSize: small(), letterSpacing: Math.max(1, small() * 0.18), color: props.l.text2, whiteSpace: "nowrap" }}>
          {props.label}
        </text>
      </view>
      <text style={{ fontFamily: DISPLAY, fontSize: props.fs, lineHeight: 0.95, color: props.l.text, whiteSpace: "nowrap" }}>
        {props.value[0]}
        <span style={{ fontSize: Math.round(props.fs * 0.5), color: props.up ? props.l.text2 : props.l.accent }}>{" " + props.value[1]}</span>
      </text>
    </view>
  );
}

/** Path through the samples, newest at the right edge. */
function trace(values: number[], max: number, w: number, h: number, closed: boolean): string {
  if (values.length < 2) return "";
  const step = w / (HISTORY - 1);
  const x0 = w - (values.length - 1) * step;
  const pts = values.map((v, i) => `${(x0 + i * step).toFixed(1)} ${(h - 1 - (v / max) * (h - 3)).toFixed(1)}`);
  const line = "M " + pts.join(" L ");
  return closed ? `${line} L ${w} ${h} L ${x0.toFixed(1)} ${h} Z` : line;
}

function Network() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    align: "left",
    units: "bits",
    showTrace: true,
    interval: 1,
  });
  const l = useLook(s);
  const size = useSize();
  const snap = useSystem(["network"], clamp(s().interval, 1, 10) * 1000);
  const [rx, setRx] = createSignal<number[]>([]);
  const [tx, setTx] = createSignal<number[]>([]);

  createEffect(() => {
    const n = snap().network;
    if (!n) return;
    setRx((h) => [...h, n.rxPerSec].slice(-HISTORY));
    setTx((h) => [...h, n.txPerSec].slice(-HISTORY));
  });

  const pad = () => (l().card ? 14 : 6);
  const innerW = () => size().width - pad() * 2;
  const innerH = () => size().height - pad() * 2;
  // The trace gets what the two readings leave, when there is room for one worth reading.
  const traceOn = () => s().showTrace && innerH() > 100;
  const fs = () => {
    const byH = traceOn() ? innerH() * 0.36 : innerH() / 1.35;
    const byW = innerW() / 2 / (8 * 0.41);
    return Math.floor(clamp(Math.min(byH, byW), 14, 120));
  };
  const traceH = () => Math.max(0, Math.floor(innerH() - fs() * 1.4 - fs() * 0.2));
  const max = () => Math.max(1024, ...rx(), ...tx()) * 1.1;
  const align = () => (s().align === "right" ? "flex-end" : s().align === "center" ? "center" : "flex-start");
  const justify = () => (s().align === "center" ? "space-evenly" : s().align === "right" ? "flex-end" : "flex-start");

  return (
    <Surface l={l()} shadow={s().shadow} style={{ flexDirection: "column", justifyContent: "center", padding: pad(), gap: fs() * 0.2 }}>
      {(c) => (
        <>
          <view style={{ flexDirection: "row", justifyContent: justify(), gap: Math.round(fs() * 0.9), flexShrink: 0 }}>
            <Reading l={c} up={false} label="DOWN" value={rate(snap().network?.rxPerSec, s().units)} fs={fs()} align={align()} />
            <Reading l={c} up label="UP" value={rate(snap().network?.txPerSec, s().units)} fs={fs()} align={align()} />
          </view>
          {traceOn() ? (
            <svg style={{ flexShrink: 0 }} width={innerW()} height={traceH()} viewBox={`0 0 ${innerW()} ${traceH()}`}>
              <line x1={0} y1={traceH() - 0.5} x2={innerW()} y2={traceH() - 0.5} stroke={c.track} strokeWidth={1} />
              <path d={trace(rx(), max(), innerW(), traceH(), true)} fill={c.accent} fillOpacity={0.16} />
              {c.halo ? <path d={trace(rx(), max(), innerW(), traceH(), false)} fill="none" stroke={c.halo} strokeWidth={4} strokeLinejoin="round" /> : null}
              <path d={trace(rx(), max(), innerW(), traceH(), false)} fill="none" stroke={c.accent} strokeWidth={1.6} strokeLinejoin="round" />
              <path d={trace(tx(), max(), innerW(), traceH(), false)} fill="none" stroke={c.text2} strokeWidth={1.2} strokeLinejoin="round" />
            </svg>
          ) : null}
        </>
      )}
    </Surface>
  );
}

mount(() => <Network />);
