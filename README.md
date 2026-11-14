# FieldShift

FieldShift is a Vite-powered React presentation prototype for exploring how
temperature, rainfall, and soil moisture changes can shape farm planning. It
was built by Team Overachiever for the NASA Space Apps Challenge.

The demo is open—there are no accounts or paid plans. The dashboard uses NASA
POWER monthly point data for Nueva Ecija, Bukidnon, and Isabela from 2020–2025.
It summarizes monthly T2M and root-zone wetness values, and derives approximate
monthly precipitation by multiplying the monthly mean daily precipitation by
the number of calendar days. The source JSON files can be downloaded from the
dashboard; derived CSV exports include temperature, rainfall, humidity, solar
radiation, root- and surface-wetness summaries, sample counts, the source
citation, and calculation notes.

The interactive map uses Leaflet with Esri World Imagery satellite tiles and
OpenStreetMap street tiles. It shows the configured study-area extent and the
NASA POWER sample point; the selected month’s color cue is based on historical
point averages and simple prototype thresholds, not a spatial stress raster or
calibrated crop-risk assessment. Map tiles require an internet connection.

These are historical gridded point estimates, not field measurements or
forecasts. The what-if controls are hypothetical adjustments to historical
averages, not climate projections or farm-specific recommendations. Pair
planning ideas with local forecasts, field observations, and farmer or
extension expertise.

Data source: NASA Langley Research Center POWER Project,
[Monthly and Annual API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/).

## Monorepo structure

This repository uses npm workspaces:

- `apps/web` (`@fieldshift/web`): Vite + React + Tailwind + Leaflet frontend.
- `packages/climate-data` (`@fieldshift/climate-data`): NASA POWER monthly datasets, place extents, telemetry helpers, and CSV export utilities.

## Run locally

Use Node.js 20.19 or newer, then install dependencies and start the dev server:

```sh
npm install
npm run dev
```

Open the URL printed by Vite (by default, `http://localhost:3000`). To verify
the production build, typechecking, and tests across all workspaces:

```sh
npm run lint
npm test
npm run build
npm run preview
```

## Deploy to Vercel

Import this repository into Vercel. The included `vercel.json` configures the
build command (`npm run build`), the `apps/web/dist` output directory, and SPA
fallback rewrites for client-side paths. Vercel installs dependencies from
`package-lock.json`; no environment variables are required for the current
client-side app.
