import React from 'react';
import { BookOpen, Globe2, HeartHandshake, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FooterAndAttributions: React.FC = () => {
  const { t } = useLanguage();

  const globalAgencies = [
    {
      agency: 'NASA',
      datasets:
        'POWER Agroclimatology Archive (2001–2025), GPM IMERG v07, SMAP L4 Root-Zone Soil Moisture, ECOSTRESS LST, GRACE-FO Terrestrial Water Storage, MODIS MOD13Q1',
    },
    {
      agency: 'ESA (Copernicus)',
      datasets:
        'Sentinel-2 MSI 10m Multi-Spectral Surface Reflectance & NDVI Vegetation Cover Reference',
    },
    {
      agency: 'UN FAO',
      datasets:
        'CropWat 8.0 / AquaCrop Evapotranspiration Coefficients, EcoCrop Legume N-Fixation Benchmarks, & Harmonized World Soil Database (HWSD)',
    },
    {
      agency: 'USDA',
      datasets:
        'NASS Cropland Data Layer (CDL) Corn-Soybean Rotation Reference & NRCS Web Soil Survey (SSURGO) Mollisol Benchmark',
    },
    {
      agency: 'USGS & Philippine DA-BSWM',
      datasets:
        'SRTM 30m Digital Elevation Model (Slope & Contour Analysis), Landsat 8/9 OLI/TIRS, & BSWM / PhilRice / BPI-NMRDC Regional Soil & Crop Guides',
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
              Human-Centered Agricultural Design · Team Overachiever (CIT-U Cebu)
            </p>
            <h3
              id="farmers-reality-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              About the Farmer&rsquo;s Reality: Why Changing a Generational Crop Calendar Is Hard
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#3B4D41]">
              For a smallholder family in Nueva Ecija, Bukidnon, Isabela, or Guimaras, a planting calendar is not just a schedule—it is a multigenerational survival contract tied to seasonal production loans, local trader advances, irrigation turnouts, and household food security. Asking a farmer to abandon their primary crop is unrealistic. FieldShift is designed around{' '}
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
            Global Space Agency &amp; Agronomic Data Attributions
          </h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
