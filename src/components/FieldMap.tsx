import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import plotLocations from '../data/plotLocations.json';
import type { MonthlyTelemetry } from '../data/nasaTelemetryData';

type PlotId = 'nueva-ecija' | 'bukidnon' | 'isabela';
type MapLayer = 'satellite' | 'street';

interface FieldMapProps {
  selectedPlotId: PlotId;
  activeMonthData: MonthlyTelemetry;
  mapLayer: MapLayer;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  selectedPlotId,
  activeMonthData,
  mapLayer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const plotConfig = plotLocations.plots.find((plot) => plot.id === selectedPlotId);
  if (!plotConfig) {
    throw new Error(`No map configuration found for plot "${selectedPlotId}".`);
  }

  const getMonthlySignalStyle = (telemetry: MonthlyTelemetry) => {
    if (telemetry.gwetRoot < 0.55) {
      return { color: '#ef4444', fillColor: '#f97316', label: 'Lower root-zone wetness signal' };
    }
    if (telemetry.precCorr > 14 || telemetry.gwetRoot > 0.93) {
      return { color: '#3b82f6', fillColor: '#0ea5e9', label: 'Higher rainfall or wetness signal' };
    }
    if (telemetry.t2m > 28.5) {
      return { color: '#f59e0b', fillColor: '#eab308', label: 'Warmer monthly air-temperature signal' };
    }
    return { color: '#10b981', fillColor: '#22c55e', label: 'No elevated display threshold' };
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

    tileLayerRef.current?.remove();
    const tileLayer =
      mapLayer === 'satellite'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
              maxZoom: 18,
            },
          )
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
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
    const overlayGroup = overlayGroupRef.current;
    if (!map || !overlayGroup) return;

    overlayGroup.clearLayers();

    const bounds = plotConfig.bounds as L.LatLngBoundsExpression;
    // The boundary is configured context; NASA POWER telemetry remains point-scale.
    const studyExtent = L.rectangle(bounds, {
      color: signalStyle.color,
      fillColor: signalStyle.fillColor,
      fillOpacity: 0.04,
      weight: 2.5,
      dashArray: '6, 4',
    }).addTo(overlayGroup);

    // Mark the point that supplies the NASA POWER summary.
    const centerMarker = L.circleMarker(
      [plotConfig.center.lat, plotConfig.center.lon],
      {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: signalStyle.color,
        fillOpacity: 0.95,
      }
    ).addTo(overlayGroup);

    const popupHtml = `
      <div style="font-family: system-ui, sans-serif; min-width: 200px;">
        <strong style="font-size: 13px; color: #0f172a;">${plotConfig.name}</strong><br/>
        <span style="font-size: 11px; color: #475569;">${plotConfig.agroZone}</span>
        <hr style="margin: 6px 0; border-color: #e2e8f0;"/>
        <div style="font-size: 11px; line-height: 1.5; color: #1e293b;">
          <b>Historical ${activeMonthData.month} signal:</b> ${signalStyle.label}<br/>
          • <b>Root-zone wetness index:</b> ${activeMonthData.gwetRoot.toFixed(2)} (unitless)<br/>
          • <b>2 m temperature:</b> ${activeMonthData.t2m.toFixed(1)}°C<br/>
          • <b>Precipitation:</b> ${activeMonthData.precCorr.toFixed(2)} mm/day<br/>
          • <b>NASA POWER point:</b> ${plotConfig.center.lat}°N, ${plotConfig.center.lon}°E (${plotConfig.center.elevationM} m)
        </div>
      </div>
    `;

    centerMarker.bindPopup(popupHtml).openPopup();
    studyExtent.bindTooltip(`Configured study-area extent (${plotConfig.id})`, {
      sticky: true,
    });
  }, [selectedPlotId, activeMonthData]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyToBounds(plotConfig.bounds as L.LatLngBoundsExpression, {
      padding: [30, 30],
      duration: 1.1,
    });
  }, [selectedPlotId]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-[#D4DDD0] shadow-lg">
      <div
        ref={mapContainerRef}
        className="z-0 h-full w-full"
        role="region"
        aria-label={`Map of ${plotConfig.name}, ${activeMonthData.month} historical NASA POWER signals`}
      />
      <div className="absolute bottom-3 left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow backdrop-blur-sm">
        <span className="font-semibold text-emerald-400">Historical {activeMonthData.month} signal:</span>{' '}
        {signalStyle.label} · {activeMonthData.t2m.toFixed(1)}°C · {activeMonthData.precCorr.toFixed(2)} mm/day · GWETROOT {activeMonthData.gwetRoot.toFixed(2)}
      </div>
    </div>
  );
};