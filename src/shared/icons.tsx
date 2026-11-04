// Outline icons drawn after Tabler Icons (MIT), the icon set of the original theme.

const P = {
  sun: "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",
  moon: "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",
  cloud:
    "M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878",
  partly:
    "M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878 M16 2v1 M20.5 3.5l-.7 .7 M22 8h-1",
  mist: "M5 5h3m4 0h9 M3 10h11m4 0h1 M5 15h5m4 0h7 M3 20h9m4 0h3",
  rain: "M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7 M11 13v2m0 3v2m4 -5v2m0 3v2",
  snow: "M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7 M11 15v.01m0 3v.01m0 3v.01m4 -4v.01m0 3v.01",
  storm: "M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1 M13 14l-2 4l3 0l-2 4",
  off: "M3 3l18 18 M18 18h-11c-2.598 0 -4.705 -2.015 -4.705 -4.5s2.107 -4.5 4.705 -4.5c.286 -1.274 1.03 -2.343 2.025 -3.03m3.18 -.96c.21 0 .418 .015 .623 .044c2.4 .337 4.258 2.388 4.258 4.856v.064h.982c1.88 0 3.4 1.516 3.4 3.386c0 .726 -.229 1.398 -.62 1.95",
  loader: "M12 6l0 -3 M16.25 7.75l2.15 -2.15 M18 12l3 0 M16.25 16.25l2.15 2.15 M12 18l0 3 M7.75 16.25l-2.15 2.15 M6 12l-3 0 M7.75 7.75l-2.15 -2.15",
  cpu: "M5 6a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z M9 9h6v6h-6z M3 10h2 M3 14h2 M10 3v2 M14 3v2 M21 10h-2 M21 14h-2 M14 21v-2 M10 21v-2",
  memory:
    "M14 4a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1z M3 14h12a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1v-12a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1v12",
  disk: "M3 13a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z M17 15v.01 M13 15v.01 M3 13l2.5 -7.5a2 2 0 0 1 1.9 -1.5h9.2a2 2 0 0 1 1.9 1.5l2.5 7.5",
  battery:
    "M6 7h11a2 2 0 0 1 2 2v.5a.5 .5 0 0 0 .5 .5a.5 .5 0 0 1 .5 .5v3a.5 .5 0 0 1 -.5 .5a.5 .5 0 0 0 -.5 .5v.5a2 2 0 0 1 -2 2h-11a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2",
  bolt: "M12 9.5l-2 3h4l-2 3",
};

export type IconName = keyof typeof P;

export function Icon(props: { name: IconName; size: number; color: string; stroke?: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24">
      <path
        d={P[props.name]}
        fill="none"
        stroke={props.color}
        strokeWidth={props.stroke ?? 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Battery outline with 0–4 level bars or a charging bolt. */
export function BatteryIcon(props: { level: number; charging: boolean; size: number; color: string; stroke?: number }) {
  const bars = () => (props.level > 80 ? 4 : props.level > 60 ? 3 : props.level > 40 ? 2 : props.level > 20 ? 1 : 0);
  const d = () =>
    props.charging
      ? P.bolt
      : ["M7 10v4", "M10 10v4", "M13 10v4", "M16 10v4"].slice(0, bars()).join(" ");
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24">
      <path d={P.battery} fill="none" stroke={props.color} strokeWidth={props.stroke ?? 1.5} strokeLinecap="round" strokeLinejoin="round" />
      {d() ? (
        <path d={d()} fill="none" stroke={props.color} strokeWidth={props.stroke ?? 1.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  );
}

/** WMO code → icon, as the original theme mapped it (with a moon for clear nights). */
export function weatherIcon(code: number, isDay = true): IconName {
  if (code <= 1) return isDay ? "sun" : "moon";
  if (code <= 3) return code === 2 ? "partly" : "cloud";
  if (code === 45 || code === 48) return "mist";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if (code >= 51) return "rain";
  return "cloud";
}
