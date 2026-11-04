import { mount, useSettings } from "@vitrine/sdk";
import { Surface, useLook, uses12h } from "../shared/look";
import { Icon, weatherIcon } from "../shared/icons";
import { describe, emptyMessage, footer, unitSymbol, useWeather } from "../shared/weather";
import { BODY } from "../shared/fonts";
import { MONTSERRAT_REGULAR as MONTSERRAT } from "../shared/metrics";
import { flexAlign, legible, MIN_VALUE, textAlignOf, useFit, widest } from "../shared/fit";

// Reference design, in the original theme's CSS pixels: a 32 px icon, then three 1rem lines of
// Montserrat (line height 1.5) and a 0.707rem footer, 0.5rem apart.
const ICON = 32;
const GAP = 8;
const BODY_SIZE = 16;
const FOOT = 11.3;
const LH = 1.5;
const PAD = { bare: 8, card: 22 };
// Lines measured while there is no reading yet, so the layout does not jump when it arrives.
const SAMPLE = ["Today weather in London", "is partly cloudy with temperature 20°C", "it feels like 20°C, and humidity is 100%"];

function Weather() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    align: "left",
    city: "London",
    units: "celsius",
    showUpdated: true,
    hourFormat: "auto",
  });
  const l = useLook(s);
  const w = useWeather(s);
  const u = () => unitSymbol(s().units);
  const d = () => w.data();

  const lines = () =>
    d()
      ? [
          `Today weather in ${d()!.place}`,
          `is ${describe(d()!.code)} with temperature ${d()!.temp}${u()}`,
          `it feels like ${d()!.feels}${u()}, and humidity is ${d()!.humidity}%`,
        ]
      : [emptyMessage(w.error(), w.query())];
  const foot = () => (d() && (s().showUpdated || w.error()) ? footer(d()!, w.error(), uses12h(s().hourFormat)) : "");
  const hasFoot = () => !d() || s().showUpdated || !!w.error();

  const pad = () => (l().card ? PAD.card : PAD.bare);
  const k = useFit((k) => {
    const body = legible(BODY_SIZE, k, MIN_VALUE);
    const small = legible(FOOT, k);
    const textW = Math.max(widest(MONTSERRAT, d() ? lines() : SAMPLE, body), widest(MONTSERRAT, [foot()], small));
    const h = ICON + GAP + 3 * body * LH + (hasFoot() ? GAP + small * LH : 0);
    return { w: textW + 2 * pad(), h: h + 2 * pad() };
  });
  const body = () => legible(BODY_SIZE, k(), MIN_VALUE) * k();
  const small = () => legible(FOOT, k()) * k();

  return (
    <Surface
      l={l()}
      k={k()}
      style={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: flexAlign(s().align),
        padding: pad() * k(),
        gap: GAP * k(),
        fontFamily: BODY,
      }}
    >
      {(c) => (
        <>
          <Icon
            name={d() ? weatherIcon(d()!.code, d()!.isDay) : w.error() ? "off" : "loader"}
            size={ICON * k()}
            color={c.text}
            halo={c.halo}
          />
          <text style={{ fontSize: body(), lineHeight: LH, color: c.text, textAlign: textAlignOf(s().align), whiteSpace: "nowrap" }}>
            {lines().map((t, i) => (i ? [<br />, t] : t))}
          </text>
          {foot() ? (
            <text style={{ fontSize: small(), lineHeight: LH, color: w.error() ? c.accent : c.text2, whiteSpace: "nowrap" }}>{foot()}</text>
          ) : null}
        </>
      )}
    </Surface>
  );
}

mount(() => <Weather />);
