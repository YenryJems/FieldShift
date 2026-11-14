import type { GeoTIFFImage } from 'geotiff';

export interface SentinelNdviObservation {
  ndvi: number;
  acquisitionDate: string;
  cloudCoverPct: number;
  pixelSizeM: 10;
  status: 'derived';
  source: 'Sentinel-2 L2A / Earth Search AWS';
}

interface StacAsset {
  href?: string;
}

interface StacItem {
  id?: string;
  properties?: {
    datetime?: string;
    'eo:cloud_cover'?: number;
    'proj:epsg'?: number;
  };
  assets?: Record<string, StacAsset>;
}

interface StacSearchResult {
  features?: StacItem[];
}

const STAC_SEARCH_URL = 'https://earth-search.aws.element84.com/v1/search';
const LOOKBACK_DAYS = 90;

/** Fetches the latest usable Sentinel-2 L2A 10 m NDVI at the configured farm point.
 * This is a single point sample, not a field-parcel or farm-wide average.
 */
export async function getSentinelNdviAtPoint(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<SentinelNdviObservation | null> {
  const now = new Date();
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const response = await fetch(STAC_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      collections: ['sentinel-2-c1-l2a'],
      bbox: [longitude - 0.001, latitude - 0.001, longitude + 0.001, latitude + 0.001],
      datetime: `${start.toISOString()}/${now.toISOString()}`,
      limit: 20,
      query: { 'eo:cloud_cover': { lt: 60 } },
      sortby: [{ field: 'properties.datetime', direction: 'desc' }],
    }),
  });
  if (!response.ok) throw new Error(`Sentinel-2 catalog request failed (${response.status}).`);

  const result = (await response.json()) as StacSearchResult;
  const items = (result.features ?? []).filter((item) =>
    item.properties?.datetime &&
    Number.isFinite(item.properties['eo:cloud_cover']) &&
    Number.isFinite(item.properties['proj:epsg']) &&
    item.assets?.red?.href && item.assets?.nir?.href && item.assets?.scl?.href,
  );

  for (const item of items.slice(0, 6)) {
    if (signal?.aborted) throw new DOMException('Request cancelled.', 'AbortError');
    try {
      const sample = await readItemNdvi(item, latitude, longitude);
      if (signal?.aborted) throw new DOMException('Request cancelled.', 'AbortError');
      if (sample === null) continue;
      return {
        ndvi: sample,
        acquisitionDate: item.properties?.datetime ?? '',
        cloudCoverPct: item.properties?.['eo:cloud_cover'] ?? 100,
        pixelSizeM: 10,
        status: 'derived',
        source: 'Sentinel-2 L2A / Earth Search AWS',
      };
    } catch (error) {
      if (signal?.aborted) throw error;
      // A scene may be listed before its public COG assets are reachable; try the next scene.
    }
  }
  return null;
}

async function readItemNdvi(item: StacItem, latitude: number, longitude: number): Promise<number | null> {
  const assets = item.assets;
  const epsg = item.properties?.['proj:epsg'];
  const redHref = assets?.red?.href;
  const nirHref = assets?.nir?.href;
  const sclHref = assets?.scl?.href;
  if (!epsg || !redHref || !nirHref || !sclHref) return null;

  const [{ fromUrl }, proj4Module] = await Promise.all([import('geotiff'), import('proj4')]);
  const proj4 = proj4Module.default;
  const projected = proj4('EPSG:4326', `EPSG:${epsg}`, [longitude, latitude]);
  const [redTiff, nirTiff, sclTiff] = await Promise.all([
    fromUrl(redHref), fromUrl(nirHref), fromUrl(sclHref),
  ]);
  const [redImage, nirImage, sclImage] = await Promise.all([
    redTiff.getImage(), nirTiff.getImage(), sclTiff.getImage(),
  ]);
  const projectedPoint: [number, number] = [projected[0], projected[1]];
  const redRaw = await readPixel(redImage, projectedPoint);
  const nirRaw = await readPixel(nirImage, projectedPoint);
  const sclRaw = await readPixel(sclImage, projectedPoint);
  if (redRaw === null || nirRaw === null || sclRaw === null || !isClearLandClass(sclRaw)) return null;

  // Sentinel-2 L2A reflectance uses scale 0.0001 and offset -0.1. Apply both
  // before calculating NDVI; this avoids treating the digital number as reflectance.
  const red = redRaw * 0.0001 - 0.1;
  const nir = nirRaw * 0.0001 - 0.1;
  const denominator = nir + red;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-8) return null;
  const ndvi = (nir - red) / denominator;
  return Number.isFinite(ndvi) && ndvi >= -1 && ndvi <= 1 ? ndvi : null;
}

async function readPixel(
  image: GeoTIFFImage,
  projected: [number, number],
): Promise<number | null> {
  const origin = image.getOrigin();
  const resolution = image.getResolution();
  const x = Math.floor((projected[0] - origin[0]) / resolution[0]);
  const y = Math.floor((projected[1] - origin[1]) / resolution[1]);
  if (x < 0 || y < 0 || x >= image.getWidth() || y >= image.getHeight()) return null;
  const values = await image.readRasters({ window: [x, y, x + 1, y + 1], samples: [0] });
  const value = Number(values[0]?.[0]);
  return Number.isFinite(value) ? value : null;
}

function isClearLandClass(scl: number): boolean {
  // Keep clear vegetation and bare-soil pixels only. Reject water, unclassified,
  // cloud, shadow, snow, saturated/defective, and no-data classes.
  return scl === 4 || scl === 5;
}
