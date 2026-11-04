import { mount, useSettings, useSize } from "@vitrine/sdk";
import { Surface, clamp, useLook, uses12h } from "../shared/look";
import { Icon, weatherIcon } from "../shared/icons";
import { describe, emptyMessage, footer, unitSymbol, useWeather } from "../shared/weather";
import { BODY } from "../shared/fonts";

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
  const size = useSize();
  const w = useWeather(s);

  const pad = () => (l().card ? 14 : 6);
  // About 22 em for the longest line, 8.5 em for icon + three lines + footer.
  const fs = () => Math.floor(clamp(Math.min((size().width - pad() * 2) / 22, (size().height - pad() * 2) / 8.6), 9, 22));
  const align = () => (s().align === "right" ? "flex-end" : s().align === "center" ? "center" : "flex-start");
  const textAlign = () => (s().align === "right" ? "end" : s().align === "center" ? "center" : "start");
  const u = () => unitSymbol(s().units);

  return (
    <Surface
      l={l()}
      shadow={s().shadow}
      style={{ flexDirection: "column", justifyContent: "center", alignItems: align(), padding: pad(), gap: fs() * 0.5, fontFamily: BODY }}
    >
      {(c) => (
        <>
      {w.data() ? (
        <>
          <Icon name={weatherIcon(w.data()!.code, w.data()!.isDay)} size={Math.round(fs() * 2)} color={c.text} halo={c.halo} />
          <text style={{ fontSize: fs(), lineHeight: 1.5, color: c.text, textAlign: textAlign() }}>
            {`Today weather in ${w.data()!.place}`}
            <br />
            {`is ${describe(w.data()!.code)} with temperature ${w.data()!.temp}${u()}`}
            <br />
            {`it feels like ${w.data()!.feels}${u()}, and humidity is ${w.data()!.humidity}%`}
          </text>
          {s().showUpdated || w.error() ? (
            <text style={{ fontSize: Math.max(9, Math.round(fs() * 0.707)), color: w.error() ? c.accent : c.text2, whiteSpace: "nowrap" }}>
              {footer(w.data()!, w.error(), uses12h(s().hourFormat))}
            </text>
          ) : null}
        </>
      ) : (
        <>
          <Icon name={w.error() ? "off" : "loader"} size={Math.round(fs() * 2)} color={c.text} halo={c.halo} />
          <text style={{ fontSize: fs(), color: c.text, textAlign: textAlign() }}>{emptyMessage(w.error(), w.query())}</text>
        </>
      )}
            </>
      )}
    </Surface>
  );
}

mount(() => <Weather />);
