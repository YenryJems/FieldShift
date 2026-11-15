import React from 'react';
import { BookOpen, ExternalLink, Globe2, HeartHandshake, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FooterAndAttributions: React.FC = () => {
  const { t } = useLanguage();

  const globalAgencies = [
    {
      agency: 'NASA',
      datasets:
        'NASA POWER historical point baselines (MERRA-2 meteorology and CERES/SYN1deg solar inputs), GPM IMERG precipitation, NASA GIBS SMAP L4 surface-moisture imagery (~9 km), Terra MODIS rolling 8-day NDVI imagery (250 m), and SRTM-referenced configured slope context. SMAP and MODIS are map context only; they do not enter FARI. No SRTM raster is connected.',
      citations: [
        { label: 'POWER data & API', href: 'https://power.larc.nasa.gov/docs/services/api/' },
        { label: 'POWER methodology / data sources', href: 'https://power.larc.nasa.gov/docs/methodology/' },
        { label: 'GPM IMERG', href: 'https://gpm.nasa.gov/data/imerg' },
        { label: 'SMAP L4 product', href: 'https://nsidc.org/data/spl4smau/versions/8' },
        { label: 'MODIS Terra NDVI layer', href: 'https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_NDVI_8Day.json' },
        { label: 'SRTM mission data', href: 'https://www.earthdata.nasa.gov/data/instruments/srtm' },
      ],
    },
    {
      agency: 'ESA (Copernicus)',
      datasets:
        'Copernicus Sentinel-2 L2A red/NIR point sample used to derive NDVI when a clear scene is available (10 m; not a parcel average or FARI input).',
      citations: [
        { label: 'Sentinel-2 mission & products', href: 'https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2' },
        { label: 'Earth Search STAC catalog used by the app', href: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a' },
      ],
    },
    {
      agency: 'UN FAO',
      datasets:
        'A local ECOCROP extract with 13 curated crop climate-reference profiles.',
      citations: [
        { label: 'FAO ECOCROP database', href: 'https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/' },
      ],
    },
    {
      agency: 'USDA',
      datasets:
        'A dated USDA AMS Market News corn and soybean price snapshot for the Central Illinois benchmark.',
      citations: [
        { label: 'Illinois Grain Bids report', href: 'https://www.ams.usda.gov/mnreports/ams_3192.pdf' },
      ],
    },
    {
      agency: 'Philippine Statistics Authority',
      datasets:
        'September 2026 national palay and corn farmgate price snapshots.',
      citations: [
        { label: 'Palay and Corn Statistics, Q3 2026', href: 'https://psa.gov.ph/sites/default/files/infographics/Palay%20and%20Corn%20Statistics%2C%20Q3%202026.pdf' },
      ],
    },
    {
      agency: 'Open-Meteo',
      datasets:
        'Model-updated current conditions and 3-day weather outlook shown in the Season workspace; forecast model output, not a farm weather-station record.',
      citations: [
        { label: 'Forecast API documentation', href: 'https://open-meteo.com/en/docs' },
        { label: 'Data license (CC BY 4.0)', href: 'https://open-meteo.com/en/license' },
      ],
    },
    {
      agency: 'Map basemaps',
      datasets:
        'Esri World Imagery satellite basemap and OpenStreetMap street basemap used for map orientation.',
      citations: [
        { label: 'Esri World Imagery', href: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9' },
        { label: 'OpenStreetMap copyright & license', href: 'https://www.openstreetmap.org/copyright' },
      ],
    },
  ];

  return (
    <footer className="space-y-8 border-t border-[#D4DDD0] pt-8">
      {/* 1. About the Farmer's Reality — Multigenerational Empathy Context Panel */}
      <section
        aria-labelledby="farmers-reality-heading"
        className="rounded-2xl border border-[#C7D5C5] bg-[#F4F8F2] p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4332] text-white">
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
              Challenge inspiration: multigenerational farming experience · Team Overachiever (CIT-U Cebu)
            </p>
            <h3
              id="farmers-reality-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              About the Farmer&rsquo;s Reality: Why Changing a Generational Crop Calendar Is Hard
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#3B4D41]">
              For a smallholder family in Nueva Ecija, Bukidnon, Isabela, or Guimaras, a planting calendar is not just a schedule—it is a multigenerational survival contract tied to production loans, local trader advances, irrigation access, and household food security. Trying an unfamiliar crop can mean risking a season&rsquo;s income; seed may be hard to source, buyers are not guaranteed, and weather can shift. FieldShift is designed around{' '}
              <strong>low-risk relay intercropping, fast 60-to-75-day legume cash turnarounds, farmer-saved open-pollinated seeds, and livestock cut-and-carry forage</strong>—so families can protect their topsoil and cut synthetic urea bills without sacrificing their main harvest.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Plain-Language Earth Science Glossary */}
      <section
        aria-labelledby="earth-science-glossary-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
          <h3
            id="earth-science-glossary-heading"
            className="text-lg font-extrabold text-[#17271D]"
          >
            {t.glossaryTitle}
          </h3>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.glossaryItems.map((item) => (
            <details
              key={item.term}
              className="rounded-xl border border-[#E2E8DF] bg-[#FAFBF9] p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]">
                <h4 className="text-sm font-extrabold text-[#1B4332]">
                  {item.term}
                </h4>
                <span className="rounded bg-[#E8F3EC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#2D6A4F]">
                  {item.shortCode}
                </span>
              </summary>
              <p className="mt-3 rounded-lg border border-[#E2E8DF] bg-white p-3 text-xs leading-5 text-[#536458]">
                {item.definition}
              </p>
              <span className="mt-2 block border-t border-[#E2E8DF] pt-2 text-[#17271D]">
                <strong>On the farm: </strong>
                {item.farmerMeaning}
              </span>
            </details>
          ))}
        </div>
      </section>

      {/* 3. Global Space Agency & Scientific Attributions */}
      <section
        aria-labelledby="global-attributions-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
          <h3
            id="global-attributions-heading"
            className="text-lg font-extrabold text-[#17271D]"
          >
          Data providers used in FieldShift
          </h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {globalAgencies.map((item) => (
            <div
              key={item.agency}
              className="rounded-xl border border-[#E2E8DF] bg-[#F8FAF7] p-3.5 text-xs"
            >
              <p className="font-mono text-xs font-extrabold text-[#1B4332]">
                {item.agency}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-[#536458]">
                {item.datasets}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#E2E8DF] pt-2">
                {item.citations.map((citation) => (
                  <li key={citation.label}>
                    <a href={citation.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#285A40] underline underline-offset-2">
                      {citation.label}<ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Mandatory Verbatim NASA Space Apps & Agronomic Disclaimer */}
      <div
        role="contentinfo"
        aria-label="Mandatory scientific and NASA non-endorsement disclaimer"
        className="rounded-xl border border-[#C7D5C5] bg-[#17271D] p-4 text-xs leading-5 text-[#E6ECE4]"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-[#74C69D]"
            aria-hidden="true"
          />
          <p className="font-medium">
            NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.
          </p>
        </div>
      </div>
    </footer>
  );
};
