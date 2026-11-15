import React, { useCallback, useEffect, useState } from 'react';
import { CloudRain, RefreshCw, ThermometerSun, Wind } from 'lucide-react';

interface LiveWeatherPanelProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

interface WeatherSnapshot {
  updatedAt: string;
  current: {
    time: string;
    temperatureC: number;
    humidityPct: number;
    precipitationMm: number;
    windKmh: number;
  };
  days: Array<{
    date: string;
    maxTemperatureC: number;
    minTemperatureC: number;
    precipitationProbabilityPct: number;
    precipitationMm: number;
  }>;
}

type WeatherState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: WeatherSnapshot; error: null }
  | { status: 'error'; data: null; error: string };

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

function readNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Weather response is missing ${label}.`);
  }
  return value;
}

function readString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Weather response is missing ${label}.`);
  }
  return value;
}

function parseWeatherPayload(payload: unknown): WeatherSnapshot {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Weather service returned an invalid response.');
  }
  const record = payload as Record<string, unknown>;
  const current = record.current;
  const daily = record.daily;
  if (typeof current !== 'object' || current === null || typeof daily !== 'object' || daily === null) {
    throw new Error('Weather service returned incomplete conditions.');
  }

  const currentRecord = current as Record<string, unknown>;
  const dailyRecord = daily as Record<string, unknown>;
  const dates = dailyRecord.time;
  const maxTemps = dailyRecord.temperature_2m_max;
  const minTemps = dailyRecord.temperature_2m_min;
  const rainProbabilities = dailyRecord.precipitation_probability_max;
  const rainAmounts = dailyRecord.precipitation_sum;
  if (
    !Array.isArray(dates) || !Array.isArray(maxTemps) || !Array.isArray(minTemps)
    || !Array.isArray(rainProbabilities) || !Array.isArray(rainAmounts)
  ) {
    throw new Error('Weather service returned an incomplete forecast.');
  }

  const days = dates.map((date, index) => ({
    date: readString(date, `forecast date ${index + 1}`),
    maxTemperatureC: readNumber(maxTemps[index], `maximum temperature for day ${index + 1}`),
    minTemperatureC: readNumber(minTemps[index], `minimum temperature for day ${index + 1}`),
    precipitationProbabilityPct: readNumber(rainProbabilities[index], `rain probability for day ${index + 1}`),
    precipitationMm: readNumber(rainAmounts[index], `rainfall for day ${index + 1}`),
  }));

  return {
    updatedAt: new Date().toISOString(),
    current: {
      time: readString(currentRecord.time, 'current observation time'),
      temperatureC: readNumber(currentRecord.temperature_2m, 'current temperature'),
      humidityPct: readNumber(currentRecord.relative_humidity_2m, 'current humidity'),
      precipitationMm: readNumber(currentRecord.precipitation, 'current precipitation'),
      windKmh: readNumber(currentRecord.wind_speed_10m, 'current wind speed'),
    },
    days,
  };
}

function advisoryFor(day: WeatherSnapshot['days'][number]) {
  if (day.precipitationProbabilityPct >= 60) {
    return {
      label: 'Rain likely',
      action: 'Recheck the local forecast before spraying or field work.',
      classes: 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]',
    };
  }
  if (day.precipitationProbabilityPct >= 30 || day.maxTemperatureC >= 33 || day.minTemperatureC <= 2) {
    return {
      label: 'Caution',
      action: 'Check near-term conditions and the crop before scheduling work.',
      classes: 'border-[#D97706] bg-[#FFFBEB] text-[#92400E]',
    };
  }
  return {
    label: 'No major signal',
    action: 'No strong rain or temperature signal in this model; verify locally.',
    classes: 'border-[#2D6A4F] bg-[#EDF7F0] text-[#1B4332]',
  };
}

export const LiveWeatherPanel: React.FC<LiveWeatherPanelProps> = ({ latitude, longitude, locationName }) => {
  const [weather, setWeather] = useState<WeatherState>({ status: 'loading', data: null, error: null });
  const [refreshToken, setRefreshToken] = useState(0);

  const loadWeather = useCallback(async (signal: AbortSignal) => {
    const url = new URL(OPEN_METEO_URL);
    url.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
      forecast_days: '3',
      timezone: 'auto',
    }).toString();

    try {
      const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
      const data = parseWeatherPayload(await response.json());
      setWeather({ status: 'ready', data, error: null });
    } catch (error) {
      if (signal.aborted) return;
      setWeather({
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Live weather is temporarily unavailable.',
      });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const controller = new AbortController();
    setWeather({ status: 'loading', data: null, error: null });
    void loadWeather(controller.signal);
    return () => controller.abort();
  }, [loadWeather, refreshToken]);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshToken((current) => current + 1), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [latitude, longitude]);

  const refresh = () => setRefreshToken((current) => current + 1);

  return (
    <section aria-labelledby="live-weather-heading" className="rounded-2xl border border-[#BFD6C4] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8DF] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7D4B0] bg-[#EDF7F0] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#1B4332]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2D6A4F]" aria-hidden="true" /> Live weather
            </span>
            <span className="text-[10px] text-[#65766A]">Model-updated conditions · refreshes every 15 minutes</span>
          </div>
          <h2 id="live-weather-heading" className="mt-2 text-xl font-extrabold text-[#17271D]">Current conditions &amp; 3-day outlook · {locationName}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#536458]">
            Open-Meteo combines weather models; these are not readings from a station on this farm. Use this screen as a quick check, then confirm spray timing with PAGASA or the local weather service.
          </p>
        </div>
        <button type="button" onClick={refresh} disabled={weather.status === 'loading'} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#1B4332] hover:bg-[#F0F5EE] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]">
          <RefreshCw className={`h-3.5 w-3.5 ${weather.status === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh now
        </button>
      </div>

      {weather.status === 'loading' && (
        <p className="mt-4 rounded-lg bg-[#F5F8F3] p-3 text-sm text-[#536458]" role="status">Loading the latest available conditions…</p>
      )}
      {weather.status === 'error' && (
        <div className="mt-4 rounded-lg border border-[#F2D2C8] bg-[#FFF7F4] p-3 text-sm text-[#7A3325]" role="status">
          <p>Live weather could not be loaded. Historical climate and strategy information remain available.</p>
          <p className="mt-1 text-xs">{weather.error}</p>
          <button type="button" onClick={refresh} className="mt-2 font-bold underline">Try again</button>
        </div>
      )}
      {weather.status === 'ready' && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <WeatherMetric icon={<ThermometerSun className="h-4 w-4" aria-hidden="true" />} label="Current air temperature" value={`${weather.data.current.temperatureC.toFixed(1)}°C`} />
            <WeatherMetric icon={<CloudRain className="h-4 w-4" aria-hidden="true" />} label="Current precipitation" value={`${weather.data.current.precipitationMm.toFixed(1)} mm`} />
            <WeatherMetric icon={<Wind className="h-4 w-4" aria-hidden="true" />} label="Wind" value={`${weather.data.current.windKmh.toFixed(0)} km/h`} />
            <WeatherMetric icon={<span className="font-mono text-[10px] font-black">RH</span>} label="Relative humidity" value={`${weather.data.current.humidityPct.toFixed(0)}%`} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {weather.data.days.map((day) => {
              const advisory = advisoryFor(day);
              const date = new Date(`${day.date}T12:00:00`);
              return (
                <article key={day.date} className="rounded-xl border border-[#DDE5D9] bg-[#FAFBF9] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#17271D]">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
                    <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold ${advisory.classes}`}>{advisory.label}</span>
                  </div>
                  <p className="mt-3 font-mono text-sm font-bold text-[#263B2E]">{day.minTemperatureC.toFixed(0)}°–{day.maxTemperatureC.toFixed(0)}°C</p>
                  <p className="mt-1 text-xs text-[#536458]">Rain chance {day.precipitationProbabilityPct}% · {day.precipitationMm.toFixed(1)} mm expected</p>
                  <p className="mt-3 border-t border-[#E2E8DF] pt-2 text-xs leading-5 text-[#536458]">{advisory.action}</p>
                </article>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[#738278]">
            Provider: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-bold underline">Open-Meteo</a> · CC BY 4.0 · Retrieved {new Date(weather.data.updatedAt).toLocaleString()} · Forecasts are model output and can change.
          </p>
        </>
      )}
    </section>
  );
};

interface WeatherMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const WeatherMetric: React.FC<WeatherMetricProps> = ({ icon, label, value }) => (
  <div className="rounded-lg bg-[#F5F8F3] p-3">
    <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#738278]">{icon}{label}</p>
    <p className="mt-1 font-mono text-lg font-extrabold tabular-nums text-[#17271D]">{value}</p>
  </div>
);
