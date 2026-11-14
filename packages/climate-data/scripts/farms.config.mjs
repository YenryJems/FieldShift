// Single source of farm coordinates for data-acquisition scripts.
// Coordinates must stay identical to docs/PROJECT_SPECIFICATION.md and
// packages/climate-data/src/plotLocations.json.

export const FARMS = [
  { id: 'nueva-ecija', name: 'Nueva Ecija', latitude: 15.68, longitude: 120.89 },
  { id: 'bukidnon', name: 'Bukidnon', latitude: 8.15, longitude: 125.12 },
  { id: 'isabela', name: 'Isabela', latitude: 16.975, longitude: 121.81 },
  { id: 'guimaras', name: 'Guimaras', latitude: 10.583, longitude: 122.617 },
  { id: 'usa-midwest', name: 'Central Illinois (USA Midwest)', latitude: 40.1, longitude: -88.2 },
];

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJsonWithRetry(url, { attempts = 5, timeoutMs = 120_000, label = url } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'FieldShift-NASA-SpaceApps/0.1 (educational)' },
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
      }
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      const waitMs = 2_000 * attempt;
      console.warn(`[retry ${attempt}/${attempts}] ${label}: ${error.message}. Waiting ${waitMs} ms.`);
      await sleep(waitMs);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Failed after ${attempts} attempts: ${label}: ${lastError?.message}`);
}
