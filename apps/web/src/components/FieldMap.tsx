import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';
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
    description:
      'NASA GIBS SMAP L4 surface-moisture map layer. Each pixel covers about 9 km, so it cannot show moisture variation inside one farm. This layer is not used in FARI.',
  },
  {
    id: 'vegetation-ndvi',
    label: 'Vegetation Greenness (NDVI)',
    shortSensor: 'NASA Terra MODIS · rolling 8-day · 250 m',
    statusLabel: 'NASA satellite product',
    color: '#15803D',
    fillColor: '#22C55E',
    description:
      'NASA GIBS MODIS/Terra rolling 8-day NDVI imagery at 250 m per pixel. Pixels may include multiple fields and crops; this layer is not used in FARI.',
  },
  {
    id: 'precipitation-imerg',
    label: 'Recent Precipitation Rate',
    shortSensor: 'NASA GPM IMERG · 0.1 degree · 30-minute product',
    statusLabel: 'NASA satellite product',
    color: '#0369A1',
    fillColor: '#38BDF8',
    description:
      'NASA GIBS IMERG shows satellite-estimated precipitation over an area. It does not predict future rain or replace a rain gauge at the farm.',
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
    shortSensor: 'Crop calendar × modeled cover period',
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
  onMapLayerChange?: (layer: MapBaseLayer) => void;
  onSelectPlot?: (plotId: PlotId) => void;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  selectedPlotId,
  activeMonthData,
  mapLayer,
  onMapLayerChange,
  onSelectPlot,
}) => {
  const fullscreenWrapperRef = useRef<HTMLDivElement | null>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    if (!map) return;
    smapLayerRef.current?.remove();
    smapLayerRef.current = null;
    if (!activeOverlays.includes('water-stress')) return;

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

    const [[minLat, minLon], [maxLat, maxLon]] = plotConfig.bounds;
    const latSpan = maxLat - minLat;
    const lonSpan = maxLon - minLon;

    activeOverlays.forEach((overlayId, idx) => {
      const meta = ENVIRONMENTAL_OVERLAYS.find((o) => o.id === overlayId);
      if (!meta) return;
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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      const rafId = window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
      const timerId = window.setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, 180);
      return () => {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(timerId);
      };
    }
    return undefined;
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        mapInstanceRef.current?.invalidateSize({ animate: false });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      try {
        if (!next && document.fullscreenElement) {
          void document.exitFullscreen?.();
        }
      } catch {
        // Ignore browser fullscreen errors; fixed viewport overlay handles layout cleanly.
      }
      return next;
    });
  };

  return (
    <div
      ref={fullscreenWrapperRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[2000] flex flex-col gap-3 overflow-y-auto bg-[#F5F7F4] p-3 sm:p-5'
          : 'space-y-3'
      }
    >
      {/* Fullscreen Header Banner (only visible when expanded) */}
      {isFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4DDD0] bg-white px-4 py-3 shadow-xs">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
              Fullscreen Field Inspector · Esri &amp; NASA GIBS
            </p>
            <h3 className="text-base font-extrabold text-[#17271D]">
              {plotConfig.name} ({activeMonthData.month}) · {plotConfig.center.lat.toFixed(3)}°N,{' '}
              {plotConfig.center.lon.toFixed(3)}°E
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onMapLayerChange && (
              <div
                role="group"
                aria-label="Map layer"
                className="inline-flex h-9 rounded-lg border border-[#C7D5C5] bg-[#F3F6F1] p-1"
              >
                {(['satellite', 'street'] as const).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    aria-pressed={mapLayer === layer}
                    onClick={() => onMapLayerChange(layer)}
                    className={`rounded-md px-3 text-xs font-bold capitalize transition-colors ${
                      mapLayer === layer
                        ? 'bg-white text-[#1B4332] shadow-sm'
                        : 'text-[#536458] hover:text-[#1B4332]'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#1B4332] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#2D6A4F]"
            >
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              Exit Fullscreen (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Compact Map Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSplitComparison((prev) => !prev)}
            aria-pressed={showSplitComparison}
            className={`inline-flex min-h-8 items-center rounded-lg border px-3 py-1 text-xs font-bold transition-colors ${
              showSplitComparison
                ? 'border-[#1B4332] bg-[#1B4332] text-white'
                : 'border-[#C7D5C5] bg-[#F7FAF5] text-[#1B4332] hover:bg-[#EEF5EB]'
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
              className="inline-flex min-h-8 items-center rounded-lg border border-[#C7D5C5] bg-[#F7FAF5] px-3 py-1 text-xs font-bold text-[#1B4332] transition-colors hover:bg-[#EEF5EB] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {showOsmOverlay ? 'Hide' : 'Show'} OSM roads &amp; boundaries
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] font-semibold text-[#52715E]">
            {activeOverlays.length} of {ENVIRONMENTAL_OVERLAYS.length} layers active
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-1 text-xs font-bold text-[#1B4332] shadow-2xs transition-colors hover:bg-[#EEF5EB]"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                Fullscreen
              </>
            )}
          </button>
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
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-[#D4DDD0] bg-[#E8EFE6] shadow-sm ${
          isFullscreen ? 'min-h-[60vh] flex-1' : 'h-[420px]'
        }`}
      >
        <div
          ref={mapContainerRef}
          className="z-0 h-full w-full"
          role="region"
          aria-label={`Map of ${plotConfig.name}, ${activeMonthData.month} historical NASA POWER signals`}
        />

        {/* Floating Top-Right Fullscreen Map Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen map' : 'Open map in fullscreen'}
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Expand map to fullscreen'}
          className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg border border-[#D4DDD0] bg-white/95 px-2.5 py-1.5 text-xs font-bold text-[#17271D] shadow-md backdrop-blur-xs transition-colors hover:bg-[#EEF5EB] hover:text-[#1B4332]"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
              <span>Fullscreen</span>
            </>
          )}
        </button>

        {showSplitComparison && <SplitSlider value={splitPercent} onChange={setSplitPercent} />}

        <div
          className={`absolute ${showSplitComparison ? 'bottom-16' : 'bottom-3'} left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow backdrop-blur-sm`}
        >
          <span className="font-semibold text-emerald-400">
            Historical {activeMonthData.month} signal:
          </span>{' '}
          {signalStyle.label} · {activeMonthData.t2m.toFixed(1)}°C ·{' '}
          {activeMonthData.precCorr.toFixed(2)} mm/day · GWETROOT{' '}
          {activeMonthData.gwetRoot.toFixed(2)}
        </div>
      </div>

      {/* Sleek Environmental Telemetry Layer Selector */}
      <div className="rounded-xl border border-[#D4DDD0] bg-[#F7FAF5] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#263B2E]">
            Environmental Telemetry Overlays ({ENVIRONMENTAL_OVERLAYS.length} Layers)
          </span>
          <span className="font-mono text-[10px] font-semibold text-[#52715E]">
            3 NASA GIBS layers · 2 illustrative overlays
          </span>
        </div>

        <div
          role="group"
          aria-label="Environmental telemetry layers"
          className={`grid gap-1.5 ${isFullscreen ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}
        >
          {ENVIRONMENTAL_OVERLAYS.map((overlay) => {
            const isActive = activeOverlays.includes(overlay.id);
            const isNasaProduct = overlay.statusLabel.startsWith('NASA');
            return (
              <button
                key={overlay.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleOverlay(overlay.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? 'border-[#1B4332] bg-white shadow-2xs'
                    : 'border-[#DCE4D9] bg-white/60 text-[#536458] hover:bg-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: overlay.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#17271D]">
                      {overlay.label}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[#52715E]">
                      {overlay.shortSensor}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    isNasaProduct
                      ? 'border border-sky-200 bg-sky-50 text-sky-900'
                      : 'border border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  {overlay.statusLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
