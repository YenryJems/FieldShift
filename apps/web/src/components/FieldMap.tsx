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
  | 'erosion-corridors'
  | 'bare-soil-ndvi'
  | 'groundwater-grace';

interface OverlayMetadata {
  id: EnvironmentalOverlayId;
  label: string;
  shortSensor: string;
  color: string;
  fillColor: string;
  description: string;
}

export const ENVIRONMENTAL_OVERLAYS: OverlayMetadata[] = [
  {
    id: 'water-stress',
    label: 'Water Stress & Drought Hotspots',
    shortSensor: 'SMAP + ECOSTRESS proxy',
    color: '#D97706',
    fillColor: '#F59E0B',
    description:
      'Modeled root-zone wetness deficit (GWETROOT/SMAP proxy) paired with canopy thermal stress.',
  },
  {
    id: 'erosion-corridors',
    label: 'Erosion & Topsoil Runoff Corridors',
    shortSensor: 'SRTM slope + GPM rain bursts',
    color: '#DC2626',
    fillColor: '#EF4444',
    description:
      'Modeled slope-runoff susceptibility from SRTM terrain grade and 95th-percentile daily rainfall bursts.',
  },
  {
    id: 'bare-soil-ndvi',
    label: 'Bare-Soil Exposure Windows',
    shortSensor: 'Sentinel-2 / Landsat NDVI < 0.20 proxy',
    color: '#92400E',
    fillColor: '#B45309',
    description:
      'Modeled low-canopy / fallow exposure window where bare topsoil is unshielded from sun or rain.',
  },
  {
    id: 'groundwater-grace',
    label: 'Groundwater Depletion Trends',
    shortSensor: 'GRACE / GRACE-FO regional proxy',
    color: '#2563EB',
    fillColor: '#3B82F6',
    description:
      'Modeled basin-scale terrestrial water storage & dry-season groundwater pumping pressure.',
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
    if (telemetry.gwetRoot < 0.55) {
      return {
        color: '#ef4444',
        fillColor: '#f97316',
        label: 'Lower root-zone wetness signal',
      };
    }
    if (telemetry.precCorr > 14 || telemetry.gwetRoot > 0.93) {
      return {
        color: '#3b82f6',
        fillColor: '#0ea5e9',
        label: 'Higher rainfall or wetness signal',
      };
    }
    if (telemetry.t2m > 28.5) {
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
              • <b>Root-zone wetness index:</b> ${activeMonthData.gwetRoot.toFixed(2)} (unitless)<br/>
              • <b>2 m temperature:</b> ${activeMonthData.t2m.toFixed(1)}°C<br/>
              • <b>Precipitation:</b> ${activeMonthData.precCorr.toFixed(2)} mm/day<br/>
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
      {/* 4 Toggleable Environmental Overlays with Mandatory "Illustrative / modeled" Badges */}
      <div className="rounded-xl border border-[#D4DDD0] bg-[#F7FAF5] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#263B2E]">
              Environmental Telemetry Overlays (4 Layers)
            </span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
              Illustrative / modeled
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSplitComparison((prev) => !prev)}
            aria-pressed={showSplitComparison}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
              showSplitComparison
                ? 'border-[#1B4332] bg-[#1B4332] text-white'
                : 'border-[#C7D5C5] bg-white text-[#1B4332] hover:bg-[#EEF5EB]'
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
              className="rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1B4332] hover:bg-[#EEF5EB] focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    ? 'border-[#1B4332] bg-white shadow-xs'
                    : 'border-[#DCE4D9] bg-[#F3F6F1]/70 text-[#536458] hover:bg-white'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#17271D]">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: overlay.color }}
                    />
                    {overlay.label}
                  </span>
                  <span className="rounded bg-amber-100/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-900">
                    Illustrative / modeled
                  </span>
                </div>
                <span className="mt-1 font-mono text-[10px] text-[#52715E]">
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
          className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950"
        >
          <span className="font-bold">Offline / Tile-Server Fallback Active:</span> Map imagery
          tiles could not be reached. Vector study-area extents, NASA POWER point coordinates (
          {plotConfig.center.lat}°, {plotConfig.center.lon}°), and all FARI crop-rotation
          calculations remain 100% functional offline.
        </div>
      )}

      {/* Map Canvas + Optional Split-Screen Visual Comparison */}
      <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-[#D4DDD0] bg-[#E8EFE6] shadow-lg">
        <div
          ref={mapContainerRef}
          className="z-0 h-full w-full"
          role="region"
          aria-label={`Map of ${plotConfig.name}, ${activeMonthData.month} historical NASA POWER signals`}
        />

        {showSplitComparison && <SplitSlider value={splitPercent} onChange={setSplitPercent} />}

        <div className={`absolute ${showSplitComparison ? 'bottom-16' : 'bottom-3'} left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow backdrop-blur-sm`}>
          <span className="font-semibold text-emerald-400">
            Historical {activeMonthData.month} signal:
          </span>{' '}
          {signalStyle.label} · {activeMonthData.t2m.toFixed(1)}°C ·{' '}
          {activeMonthData.precCorr.toFixed(2)} mm/day · GWETROOT{' '}
          {activeMonthData.gwetRoot.toFixed(2)}
        </div>
      </div>


    </div>
  );
};
