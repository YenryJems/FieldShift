# FieldShift

FieldShift is a Vite-powered React app for exploring climate-resilient farm
planning.

## Run locally

Use Node.js 20.19 or newer, then install dependencies and start the dev server:

```sh
npm install
npm run dev
```

Open the URL printed by Vite (by default, `http://localhost:3000`). To verify
the production build locally, run:

```sh
npm run build
npm run preview
```

## Deploy to Vercel

Import this repository into Vercel. The included `vercel.json` configures the
build command (`npm run build`), the `dist` output directory, and SPA fallback
rewrites for client-side paths. Vercel installs dependencies from
`package-lock.json`; no environment variables are required for the current
client-side app.
