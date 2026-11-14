import React, { createContext, useContext } from 'react';

// Translations need native-speaker review.
export type SupportedLanguage = 'en';

export interface GlossaryItem {
  term: 'Evapotranspiration' | 'NDVI' | 'Soil Wetness Anomaly' | 'GWETROOT';
  shortCode: string;
  definition: string;
  farmerMeaning: string;
}

export interface TranslationStrings {
  languageName: string;
  navOverview: string;
  navHowItWorks: string;
  navFieldDemo: string;
  navFariEngine: string;
  navAgronomics: string;
  droughtAlertBanner: string;
  fariSectionTitle: string;
  fariSectionSubtitle: string;
  prioritySlidersTitle: string;
  waterPriorityLabel: string;
  erosionPriorityLabel: string;
  nutrientsPriorityLabel: string;
  marketPriorityLabel: string;
  stressPresetsTitle: string;
  constraintsTitle: string;
  constraintRainfed: string;
  constraintManual: string;
  constraintFastCash: string;
  strategyComparisonTitle: string;
  whySuggestedLabel: string;
  supportingEvidenceLabel: string;
  expectedBenefitsLabel: string;
  dataGapsLabel: string;
  localReviewAlertsLabel: string;
  timelineTitle: string;
  projectedImpactsTitle: string;
  projectedEstimateBadge: string;
  projectedEstimateTooltip: string;
  illustrativeModeledBadge: string;
  readAloudButton: string;
  stopAudioButton: string;
  copySmsBriefButton: string;
  printBriefButton: string;
  glossaryTitle: string;
  glossaryItems: GlossaryItem[];
}

// Translations need native-speaker review.
export const TRANSLATIONS: Record<SupportedLanguage, TranslationStrings> = {
  en: {
    languageName: 'English',
    navOverview: 'Overview',
    navHowItWorks: 'How it works',
    navFieldDemo: 'Field demo',
    navFariEngine: 'FARI & Strategies',
    navAgronomics: 'Terroir & Certification',
    droughtAlertBanner:
      'Root-zone soil is very dry—delay foliar flower-induction sprays and plant mungbean or sweet potato (camote) relay cover to conserve soil moisture.',
    fariSectionTitle: '3-Strategy Crop Rotation & FARI Decision Engine',
    fariSectionSubtitle:
      'Compare the existing baseline practice against two climate-adaptive rotations scored across Water (W), Erosion (E), Nutrients (N), and Market (M).',
    prioritySlidersTitle: 'Farmer Priority Weights (Auto-Normalized to 100%)',
    waterPriorityLabel: 'Conserve Water (W)',
    erosionPriorityLabel: 'Stop Erosion (E)',
    nutrientsPriorityLabel: 'Rebuild Nutrients (N)',
    marketPriorityLabel: 'Supplemental Income (M)',
    stressPresetsTitle: 'Climate Stress Scenarios ("What-If" Simulation)',
    constraintsTitle: 'Field Reality Constraints',
    constraintRainfed: 'Rainfed Only (No Deep Well)',
    constraintManual: 'Manual Tools Only (No Tractor)',
    constraintFastCash: 'Fast 60-Day Cash Needed',
    strategyComparisonTitle: 'Side-by-Side Strategy Comparison (3 Strategies)',
    whySuggestedLabel: '1. Why Suggested',
    supportingEvidenceLabel: '2. Supporting NASA Evidence',
    expectedBenefitsLabel: '3. Expected Benefits & Crop Science',
    dataGapsLabel: '4. Information & Data Gaps',
    localReviewAlertsLabel: '5. Risks Requiring Local Review (MAO / Extension)',
    timelineTitle: '12-Month Ground Cover & Pest-Cycle Disruption Calendar',
    projectedImpactsTitle: 'Literature-Range Projected Agronomic Impacts',
    projectedEstimateBadge: 'Projected estimate',
    projectedEstimateTooltip:
      'This is a literature-range estimate for educational decision support. It is not a measured result, guaranteed outcome, or site-specific recommendation.',
    illustrativeModeledBadge: 'Illustrative / modeled',
    readAloudButton: 'Read top strategy aloud',
    stopAudioButton: 'Stop audio',
    copySmsBriefButton: 'Copy SMS / Messenger field brief',
    printBriefButton: 'Print detailed field report',
    glossaryTitle: 'Plain-Language Earth Science Glossary',
    glossaryItems: [
      {
        term: 'Evapotranspiration',
        shortCode: 'ET / EVPTRNS',
        definition:
          'Combined water lost from soil evaporation and plant leaf transpiration into the air.',
        farmerMeaning:
          'When heat and solar radiation spike, crops lose water faster—mulch and fast-closing relay canopies keep moisture in the root zone.',
      },
      {
        term: 'NDVI',
        shortCode: 'Sentinel-2 / MODIS Index',
        definition:
          'Normalized Difference Vegetation Index (-1 to +1) measuring green leaf cover from reflected red and near-infrared sunlight.',
        farmerMeaning:
          'Values below 0.20 indicate bare, unshielded soil vulnerable to baking in summer or washing away in heavy rain.',
      },
      {
        term: 'Soil Wetness Anomaly',
        shortCode: 'Z-Score vs. 2001–2025',
        definition:
          'How much wetter or drier the current month is compared to the 25-year historical average for that exact calendar month.',
        farmerMeaning:
          'Signals early drought onset or unusual saturation so you can switch to deeper-rooted or contour-protected crops in time.',
      },
      {
        term: 'GWETROOT',
        shortCode: 'NASA POWER 0–100 cm',
        definition:
          'Unitless index from 0 (completely dry) to 1 (saturated) estimating water stored in the top 100 cm root zone.',
        farmerMeaning:
          'Even when topsoil (GWETTOP) dries out, moderate GWETROOT lets deep-rooted mungbean, peanut, or sorghum thrive without irrigation.',
      },
    ],
  },
};

interface LanguageContextValue {
  language: SupportedLanguage;
  t: TranslationStrings;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: TRANSLATIONS.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageContext.Provider
      value={{
        language: 'en',
        t: TRANSLATIONS.en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
