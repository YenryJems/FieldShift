import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SplitSlider } from './SplitSlider';
import {
  FARMS_BY_ID,
  plotLocations,
  type MonthlyTelemetry,
  type PlaceId,
} from '@fieldshift/climate-data';

type PlotId = PlaceId;
export type MapBaseLayer = 'satellite' | 'street';
export type EnvironmentalOverlayId =
  | 'water-stress'
  | 'vegetation-ndvi'
  | 'precipitation-imerg'
  | 'erosion-corridors'
  | 'bare-soil-ndvi';

interface OverlayMetadata {
  id: EnvironmentalOverlayId;
  label: string;
  shortSensor: string;
  statusLabel: string;
  color: string;
  fillColor: string;
  description: string;
}

export const ENVIRONMENTAL_OVERLAYS: OverlayMetadata[] = [
  {
    id: 'water-stress',
    label: 'Water Stress & Drought Hotspots',
    shortSensor: 'NASA SMAP L4 · 9 km surface moisture',
    statusLabel: 'NASA product · model-assimilated',
    color: '#D97706',
    fillColor: '#F59E0B',
    description: 'NASA GIBS SMAP L4 surface-moisture map layer. Each pixel covers about 9 km, so it cannot show moisture variation inside one farm. This layer is not used in FARI.',
  },
  {
    id: 'vegetation-ndvi',
    label: 'Vegetation Greenness (NDVI)',
    shortSensor: 'NASA Terra MODIS - rolling 8-day - 250 m',
    statusLabel: 'NASA satellite product',
    color: '#15803D',
    fillColor: '#22C55E',
    description: 'NASA GIBS MODIS/Terra rolling 8-day NDVI imagery at 250 m per pixel. Pixels may include multiple fields and crops; this layer is not used in FARI.',
  },
  {
    id: 'precipitation-imerg',
    label: 'Recent Precipitation Rate',
    shortSensor: 'NASA GPM IMERG - 0.1 degree - 30-minute product',
    statusLabel: 'NASA satellite product',
    color: '#0369A1',
    fillColor: '#38BDF8',
    description: 'NASA GIBS IMERG shows satellite-estimated precipitation over an area. It does not predict future rain or replace a rain gauge at the farm.',
  },
  {
    id: 'erosion-corridors',
    label: 'Erosion & Topsoil Runoff Corridors',
    shortSensor: 'Configured slope + POWER rainfall summaries',
    statusLabel: 'Illustrative / modeled',
    color: '#DC2626',
    fillColor: '#EF4444',
    description:
      'Illustrative runoff susceptibility from configured study-area slope and historical rainfall bursts. This is not a terrain-flow simulation.',
  },
  {
    id: 'bare-soil-ndvi',
    label: 'Bare-Soil Exposure Windows',
    shortSensor: 'Crop calendar x modeled cover period',
    statusLabel: 'Illustrative / modeled',
    color: '#92400E',
    fillColor: '#B45309',
    description:
      'Illustrative low-canopy / fallow exposure window based on configured crop-calendar assumptions. Not derived from satellite imagery or mapped field boundaries.',
  },
];

interface FieldMapProps {
  selectedPlotId: PlotId;
  activeMonthData: MonthlyTelemetry;
  mapLayer: MapBaseLayer;
  onSelectPlot?: (plotId: PlotId) => void;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  selectedPlotId,
  activeMonthData,
  mapLayer,
  onSelectPlot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const osmOverlayRef = useRef<L.TileLayer | null>(null);
  const smapLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const modisNdviLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const imergLayerRef = useRef<L.TileLayer.WMS | null>(null);

  const [activeOverlays, setActiveOverlays] = useState<EnvironmentalOverlayId[]>([
    'water-stress',
  ]);
  const [tileError, setTileError] = useState(false);
  const [showSplitComparison, setShowSplitComparison] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [showOsmOverlay, setShowOsmOverlay] = useState(true);

  const plotConfig = plotLocations.plots.find((plot) => plot.id === selectedPlotId);
  if (!plotConfig) {
    throw new Error(`No map configuration found for plot "${selectedPlotId}".`);
  }
  const activeFarm = FARMS_BY_ID[selectedPlotId];

  const toggleOverlay = (id: EnvironmentalOverlayId) => {
    setActiveOverlays((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const getMonthlySignalStyle = (telemetry: MonthlyTelemetry) => {
    if (telemetry.rootZoneMoisturePct < 55) {
      return {
        color: '#ef4444',
        fillColor: '#f97316',
        label: 'Lower root-zone moisture signal',
      };
    }
    if (telemetry.dailyRainfallMm > 14 || telemetry.rootZoneMoisturePct > 93) {
      return {
        color: '#3b82f6',
        fillColor: '#0ea5e9',
        label: 'Higher rainfall or moisture signal',
      };
    }
    if (telemetry.airTempCelsius > 28.5) {
      return {
        color: '#f59e0b',
        fillColor: '#eab308',
        label: 'Warmer monthly air-temperature signal',
      };
    }
    return {
      color: '#10b981',
      fillColor: '#22c55e',
      label: 'No elevated display threshold',
    };
  };
  const signalStyle = getMonthlySignalStyle(activeMonthData);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [plotConfig.center.lat, plotConfig.center.lon],
      zoom: plotConfig.zoom,
      zoomControl: true,
    });

    overlayGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setTileError(false);
    tileLayerRef.current?.remove();
    const tileLayer =
      mapLayer === 'satellite'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution:
                'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
              maxZoom: 18,
            },
          )
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    return () => {
      tileLayer.remove();
      if (tileLayerRef.current === tileLayer) tileLayerRef.current = null;
    };
  }, [mapLayer]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    osmOverlayRef.current?.remove();
    osmOverlayRef.current = null;
    if (!showOsmOverlay || mapLayer !== 'satellite') return;

    const osmOverlay = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.26,
    });
    osmOverlay.on('tileerror', () => setTileError(true));
    osmOverlay.addTo(map);
    osmOverlayRef.current = osmOverlay;

    return () => {
      osmOverlay.remove();
      if (osmOverlayRef.current === osmOverlay) osmOverlayRef.current = null;
    };
  }, [mapLayer, showOsmOverlay]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    smapLayerRef.current?.remove();
    smapLayerRef.current = null;
    if (!activeOverlays.includes('water-stress')) return;

    // NASA GIBS serves the actual SMAP L4 analyzed surface-moisture map.
    // This is a 9 km satellite/model visualization, not a farm point reading.
    const smapLayer = L.tileLayer.wms(
      'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
      {
        layers: 'SMAP_L4_Analyzed_Surface_Soil_Moisture',
        styles: 'default',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        opacity: 0.58,
        attribution: 'NASA GIBS / SMAP L4 (9 km)',
      },
    );
    smapLayer.on('tileerror', () => setTileError(true));
    smapLayer.addTo(map);
    smapLayerRef.current = smapLayer;
    return () => {
      smapLayer.remove();
      if (smapLayerRef.current === smapLayer) smapLayerRef.current = null;
    };
  }, [activeOverlays]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    modisNdviLayerRef.current?.remove();
    modisNdviLayerRef.current = null;
    if (!activeOverlays.includes('vegetation-ndvi')) return;

    const layer = L.tileLayer.wms(
      'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
      {
        layers: 'MODIS_Terra_NDVI_8Day',
        styles: 'default',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        opacity: 0.66,
        attribution: 'NASA GIBS / MODIS Terra NDVI (250 m, rolling 8-day)',
      },
    );
    layer.on('tileerror', () => setTileError(true));
    layer.addTo(map);
    modisNdviLayerRef.current = layer;
    return () => {
      layer.remove();
      if (modisNdviLayerRef.current === layer) modisNdviLayerRef.current = null;
    };
  }, [activeOverlays]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    imergLayerRef.current?.remove();
    imergLayerRef.current = null;
    if (!activeOverlays.includes('precipitation-imerg')) return;

    const layer = L.tileLayer.wms(
      'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
      {
        layers: 'IMERG_Precipitation_Rate',
        styles: 'default',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        opacity: 0.62,
        attribution: 'NASA GIBS / GPM IMERG precipitation rate',
      },
    );
    layer.on('tileerror', () => setTileError(true));
    layer.addTo(map);
    imergLayerRef.current = layer;
    return () => {
      layer.remove();
      if (imergLayerRef.current === layer) imergLayerRef.current = null;
    };
  }, [activeOverlays]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlayGroup = overlayGroupRef.current;
    if (!map || !overlayGroup) return;

    overlayGroup.clearLayers();

    // Render all 5 farms' bounding boxes & markers so all 5 farm locations are represented
    for (const plot of plotLocations.plots) {
      const isSelected = plot.id === selectedPlotId;
      const bounds = plot.bounds as L.LatLngBoundsExpression;

      const rect = L.rectangle(bounds, {
        color: isSelected ? signalStyle.color : '#64748B',
        fillColor: isSelected ? signalStyle.fillColor : '#94A3B8',
        fillOpacity: isSelected ? 0.08 : 0.03,
        weight: isSelected ? 2.5 : 1.5,
        dashArray: '6, 4',
      }).addTo(overlayGroup);

      rect.bindTooltip(`Configured study-area extent (${plot.id})`, {
        sticky: true,
      });

      const marker = L.circleMarker([plot.center.lat, plot.center.lon], {
        radius: isSelected ? 9 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: isSelected ? signalStyle.color : '#1B4332',
        fillOpacity: 0.95,
      }).addTo(overlayGroup);

      if (onSelectPlot) {
        marker.on('click', () => onSelectPlot(plot.id as PlotId));
      }

      if (isSelected) {
        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; min-width: 210px;">
            <strong style="font-size: 13px; color: #0f172a;">${plot.name}</strong><br/>
            <span style="font-size: 11px; color: #475569;">${plot.agroZone}</span>
            <hr style="margin: 6px 0; border-color: #e2e8f0;"/>
            <div style="font-size: 11px; line-height: 1.5; color: #1e293b;">
              <b>Historical ${activeMonthData.month} signal:</b> ${signalStyle.label}<br/>
              • <b>Root-Zone Moisture:</b> ${activeMonthData.rootZoneMoisturePct}%<br/>
              • <b>Air Temperature:</b> ${activeMonthData.airTempCelsius.toFixed(1)}°C<br/>
              • <b>Daily Rainfall:</b> ${activeMonthData.dailyRainfallMm.toFixed(2)} mm/day<br/>
              • <b>Soil & slope:</b> ${activeFarm.soilType} (${activeFarm.slopePct}% slope)<br/>
              • <b>NASA POWER point:</b> ${plot.center.lat}°, ${plot.center.lon}° (${plot.center.elevationM} m)
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml).openPopup();
      } else {
        marker.bindTooltip(`${plot.name} (${plot.region})`);
      }
    }

    // Render active modeled environmental overlays around the selected plot
    const [[minLat, minLon], [maxLat, maxLon]] = plotConfig.bounds;
    const latSpan = maxLat - minLat;
    const lonSpan = maxLon - minLon;

    activeOverlays.forEach((overlayId, idx) => {
      const meta = ENVIRONMENTAL_OVERLAYS.find((o) => o.id === overlayId);
      if (!meta) return;
      // NASA SMAP, MODIS NDVI, and GPM IMERG are rendered by GIBS WMS above.
      if (['water-stress', 'vegetation-ndvi', 'precipitation-imerg'].includes(overlayId)) return;

      const inset = 0.08 + idx * 0.05;
      const overlayBounds: L.LatLngBoundsExpression = [
        [minLat + latSpan * inset, minLon + lonSpan * inset],
        [maxLat - latSpan * inset, maxLon - lonSpan * inset],
      ];

      const layerRect = L.rectangle(overlayBounds, {
        color: meta.color,
        fillColor: meta.fillColor,
        fillOpacity: 0.14,
        weight: 2,
        dashArray: '3, 5',
      }).addTo(overlayGroup);

      layerRect.bindTooltip(
        `[Illustrative / modeled] ${meta.label} (${meta.shortSensor})`,
        { sticky: true },
      );
    });
  }, [selectedPlotId, activeMonthData, activeOverlays, activeFarm]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyToBounds(plotConfig.bounds as L.LatLngBoundsExpression, {
      padding: [30, 30],
      duration: 1.0,
    });
  }, [selectedPlotId]);

  return (
    <div className="space-y-3">
      {/* NASA raster products are identified separately from illustrative overlays. */}
      <div className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F0F9FF]">
              Environmental Telemetry Overlays (6 Layers)
            </span>
            <span className="rounded-full border border-sky-400/20 bg-[#0D182E] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#CBD5E1]">
              Three NASA data layers and three illustrative overlays
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSplitComparison((prev) => !prev)}
            aria-pressed={showSplitComparison}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
              showSplitComparison
                ? 'border-sky-400 bg-sky-400 text-[#040811] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                : 'border-sky-400/20 bg-[#0D182E] text-[#F0F9FF] hover:border-sky-400/50 hover:bg-[#0B1426]'
            }`}
          >
            {showSplitComparison
              ? 'Hide Before/After Split View'
              : 'Compare Baseline vs. Rotation Split View'}
          </button>
          {mapLayer === 'satellite' && (
            <button
              type="button"
              aria-pressed={showOsmOverlay}
              onClick={() => setShowOsmOverlay((visible) => !visible)}
              className="rounded-lg border border-sky-400/20 bg-[#0D182E] px-2.5 py-1 text-[11px] font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#0B1426] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              {showOsmOverlay ? 'Hide' : 'Show'} OSM roads &amp; boundaries
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Environmental telemetry layers"
          className="mt-2.5 grid gap-2 sm:grid-cols-2"
        >
          {ENVIRONMENTAL_OVERLAYS.map((overlay) => {
            const isActive = activeOverlays.includes(overlay.id);
            return (
              <button
                key={overlay.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleOverlay(overlay.id)}
                className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-sky-400 bg-[#0D182E] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                    : 'border-sky-400/20 bg-[#0D182E]/70 text-[#94A3B8] hover:border-sky-400/50 hover:bg-[#0B1426]'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#F0F9FF]">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: overlay.color }}
                    />
                    {overlay.label}
                  </span>
                  <span className="rounded border border-sky-400/20 bg-[#0B1426] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#7DD3FC]">
                    {overlay.statusLabel}
                  </span>
                </div>
                <span className="mt-1 font-mono text-[10px] text-sky-300/75">
                  {overlay.shortSensor}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Offline / Tile Failure Fallback Banner */}
      {tileError && (
        <div
          role="status"
          className="rounded-lg border border-sky-400/20 bg-[#0D182E] px-3.5 py-2.5 text-xs text-[#CBD5E1]"
        >
          <span className="font-bold text-[#F0F9FF]">Offline / Tile-Server Fallback Active:</span> Map imagery
          tiles could not be reached. Vector study-area extents, NASA POWER point coordinates (
          {plotConfig.center.lat}°, {plotConfig.center.lon}°), and all FARI crop-rotation
          calculations remain 100% functional offline.
        </div>
      )}

      {/* Map Canvas + Optional Split-Screen Visual Comparison */}
      <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-sky-400/20 bg-[#08101F]">
        <div
          ref={mapContainerRef}
          className="z-0 h-full w-full"
          role="region"
          aria-label={`Map of ${plotConfig.name}, ${activeMonthData.month} historical NASA POWER signals`}
        />

        {showSplitComparison && <SplitSlider value={splitPercent} onChange={setSplitPercent} />}

        <div className={`absolute ${showSplitComparison ? 'bottom-16' : 'bottom-3'} left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-lg border border-sky-400/25 bg-[#08101F]/90 px-3 py-2 text-xs text-[#F0F9FF] backdrop-blur-md`}>
          <span className="font-semibold text-[#7DD3FC]">
            Historical {activeMonthData.month} signal:
          </span>{' '}
          {signalStyle.label} · {activeMonthData.airTempCelsius.toFixed(1)}°C ·{' '}
          {activeMonthData.dailyRainfallMm.toFixed(2)} mm/day · Root-Zone Moisture{' '}
          {activeMonthData.rootZoneMoisturePct}%
        </div>
      </div>


    </div>
  );
};
