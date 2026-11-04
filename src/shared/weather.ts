// Current weather from Open-Meteo, cached per widget instance so it shows offline too.
import { createEffect, createSignal, on, onCleanup } from "solid-js";
import { formatDate, useStorage } from "@vitrine/sdk";

// The original themes are English: dates are never translated.
const EN = "en-US";

const REFRESH_MS = 15 * 60 * 1000;

export interface Weather {
  query: string;
  units: string;
  place: string;
  lat: number;
  lon: number;
  fetchedAt: number;
  temp: number;
  feels: number;
  humidity: number;
  min: number;
  max: number;
  code: number;
  isDay: boolean;
}

/** WMO weather code → description, as in the original theme. */
const CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  56: "light freezing drizzle",
  57: "heavy freezing drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  66: "light freezing rain",
  67: "heavy freezing rain",
  71: "slight snowfall",
  73: "moderate snowfall",
  75: "heavy snowfall",
  77: "snow grains",
  80: "slight rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "slight snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
};
export const describe = (code: number) => CODES[code] ?? "cloudy";

async function load(query: string, units: string, prev: Weather | null): Promise<Weather> {
  let place = prev?.place ?? "";
  let lat = prev?.lat ?? 0;
  let lon = prev?.lon ?? 0;
  if (!prev || prev.query.toLowerCase() !== query.toLowerCase()) {
    const g = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
    );
    if (!g.ok) throw new Error(`geocoding ${g.status}`);
    const hit = (await g.json()).results?.[0];
    if (!hit) throw new Error("notfound");
    place = hit.name;
    lat = hit.latitude;
    lon = hit.longitude;
  }
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day` +
      `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1` +
      `&temperature_unit=${units === "fahrenheit" ? "fahrenheit" : "celsius"}`,
  );
  if (!r.ok) throw new Error(`forecast ${r.status}`);
  const j = await r.json();
  return {
    query,
    units,
    place,
    lat,
    lon,
    fetchedAt: Date.now(),
    temp: Math.round(j.current.temperature_2m),
    feels: Math.round(j.current.apparent_temperature),
    humidity: Math.round(j.current.relative_humidity_2m),
    min: Math.round(j.daily.temperature_2m_min[0]),
    max: Math.round(j.daily.temperature_2m_max[0]),
    code: j.current.weather_code,
    isDay: !!j.current.is_day,
  };
}

export type WeatherError = "nocity" | "notfound" | "offline" | null;

/** Weather for the `city` / `units` settings: cached data, the last error and a loading flag. */
export function useWeather(settings: () => { city: string; units: string }) {
  const [cache, setCache] = useStorage<Weather | null>("weather", null);
  const [error, setError] = createSignal<WeatherError>(null);
  const [loading, setLoading] = createSignal(false);
  const query = () => (settings().city || "").trim();
  const matches = (c: Weather | null) =>
    !!c && c.query.toLowerCase() === query().toLowerCase() && c.units === settings().units;

  const refresh = async () => {
    const c = cache();
    if (!query()) return setError("nocity");
    if (matches(c) && Date.now() - c!.fetchedAt < REFRESH_MS) return setError(null);
    setLoading(true);
    try {
      setCache(await load(query(), settings().units, c));
      setError(null);
    } catch (e) {
      setError(String((e as Error)?.message ?? e) === "notfound" ? "notfound" : "offline");
    } finally {
      setLoading(false);
    }
  };

  createEffect(on([query, () => settings().units], () => void refresh()));
  const timer = setInterval(() => void refresh(), REFRESH_MS);
  onCleanup(() => clearInterval(timer));

  return {
    data: () => (matches(cache()) ? cache() : null),
    error,
    loading,
    query,
  };
}

/** "Updated at 19:56" / "Network unavailable · Updated at 19:56". */
export function footer(w: Weather, error: WeatherError, h12: boolean): string {
  const at = `Updated at ${formatDate(w.fetchedAt, h12 ? "h:mm A" : "HH:mm", EN)}`;
  return error ? `Network unavailable · ${at}` : at;
}

/** Message when there is no data to show. */
export function emptyMessage(error: WeatherError, query: string): string {
  if (error === "nocity") return "Set a city in the settings";
  if (error === "notfound") return `City “${query}” not found`;
  if (error) return "Weather unavailable";
  return "Loading weather…";
}

export const unitSymbol = (units: string) => (units === "fahrenheit" ? "°F" : "°C");
