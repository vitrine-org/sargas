# Serbas for Vitrine

Conky-style widgets for [Vitrine](https://github.com/vitrine-widgets/vitrine), inspired by
[Sargas](https://www.deviantart.com/zren/art/Conky-Sargas-601690886): a tall stacked date in
Bebas Neue, open arc gauges and the weather told in a sentence, drawn straight on your wallpaper.

| Widget | Size | |
|---|---|---|
| **Date & time**: year, weekday, day, month and time, minutes in the accent color | 2×3 to 6×8 | ![Date & time](src/datetime/preview.png) |
| **Gauges**: CPU, RAM, battery and optionally a disk as 240° arcs | 3×1 to 6×3 | ![Gauges](src/gauges/preview.png) |
| **Weather**: today's conditions from [Open-Meteo](https://open-meteo.com), works offline from cache | 4×2 to 7×3 | ![Weather](src/weather/preview.png) |

Every widget has light or dark text, an accent color (or the Windows one), left/center/right
alignment, a soft text shadow and an optional acrylic card for busy wallpapers.

## Install

Download `serbas-2.0.0.vitrine` from the [latest release](https://github.com/vitrine-widgets/serbas/releases/latest)
and double-click it. Vitrine adds the widgets to its gallery.

The Vitrine 1 theme lives on the [`v1`](https://github.com/vitrine-widgets/serbas/tree/v1) branch.

## Build

```sh
npm install
npm run pack      # → serbas-2.0.0.vitrine
```

`package.json` points `@vitrine/sdk` at `file:../../vitrine-sdk` for local builds; releases use
`github:vitrine-widgets/sdk#v2.0.0`. Preview a widget with
`vitrine render dist gauges --cells 4x2 --scale 2 --out gauges.png`.

## License

MIT. Bebas Neue and Montserrat are bundled under the SIL Open Font License 1.1 (see `LICENSE`).
