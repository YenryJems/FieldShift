import React, { createContext, useContext, useState } from 'react';

// Translations need native-speaker review.
export type SupportedLanguage = 'en' | 'ceb' | 'tl';

export interface GlossaryItem {
  term: 'Evapotranspiration' | 'NDVI' | 'Soil Wetness Anomaly' | 'GWETROOT';
  shortCode: string;
  definition: string;
  farmerMeaning: string;
}

export interface TranslationStrings {
  languageName: string;
  reviewNotice: string;
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
    reviewNotice: 'Translations need native-speaker review.',
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
    waterPriorityLabel: 'Water Suitability (W)',
    erosionPriorityLabel: 'Erosion Protection (E)',
    nutrientsPriorityLabel: 'Nutrient Regeneration (N)',
    marketPriorityLabel: 'Market & Cash Viability (M)',
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
    printBriefButton: 'Print 1-page MAO brief',
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
  ceb: {
    languageName: 'Binisaya',
    reviewNotice: 'Translations need native-speaker review.',
    navOverview: 'Kinatibuk-an',
    navHowItWorks: 'Giunsa Paglihok',
    navFieldDemo: 'Demo sa Uma',
    navFariEngine: 'FARI ug Estratehiya',
    navAgronomics: 'Terroir ug Sertipiko',
    droughtAlertBanner:
      'Uga kaayo ang yuta—ayaw una pag-spray og pampabulak; pagtanom og munggo o kamote aron mapanalipdan ang kaumog.',
    fariSectionTitle: '3-ka-Estratehiya sa Pagpulipuli sa Tanom ug FARI Engine',
    fariSectionSubtitle:
      'Itandi ang naandang monocrop batok sa duha ka lig-on nga rotation base sa Tubig (W), Erosyon (E), Sustansya (N), ug Merkado (M).',
    prioritySlidersTitle: 'Prayoridad sa Mag-uuma (Awtomatikong Nabalanseng 100%)',
    waterPriorityLabel: 'Kahaom sa Tubig (W)',
    erosionPriorityLabel: 'Proteksyon sa Yuta/Erosyon (E)',
    nutrientsPriorityLabel: 'Sustansya sa Yuta (N)',
    marketPriorityLabel: 'Kita ug Merkado (M)',
    stressPresetsTitle: ' pagsulay sa Krisis sa Panahon ("What-If" Stress)',
    constraintsTitle: 'Kahimtang ug Limitasyon sa Uma',
    constraintRainfed: 'Salig sa Ulan Lang (Walay Deep Well)',
    constraintManual: 'Manwal nga Gamit Lang (Walay Traktor)',
    constraintFastCash: 'Paspas 60-Adlaw nga Kita Gikinahanglan',
    strategyComparisonTitle: 'Pagtandi sa Tulo ka Estratehiya sa Tanom',
    whySuggestedLabel: '1. Nganong Gisugyot',
    supportingEvidenceLabel: '2. Ebidensya gikan sa NASA',
    expectedBenefitsLabel: '3. Gipaabot nga Kaayohan sa Tanom ug Yuta',
    dataGapsLabel: '4. Limitasyon sa Satellite Data',
    localReviewAlertsLabel: '5. Pahimangno: Ipasiusi sa MAO / Extension',
    timelineTitle: '12-Ka-Bulan nga Kalendaryo sa Tanom ug Pagputol sa Peste',
    projectedImpactsTitle: 'Gibanabanang Epekto Base sa Pagtuon',
    projectedEstimateBadge: 'Projected estimate',
    projectedEstimateTooltip:
      'This is a literature-range estimate for educational decision support. It is not a measured result, guaranteed outcome, or site-specific recommendation.',
    illustrativeModeledBadge: 'Illustrative / modeled',
    readAloudButton: 'Ipabasa sa tingog',
    stopAudioButton: 'Undanga ang tingog',
    copySmsBriefButton: 'Kopyaha ang SMS / Messenger brief',
    printBriefButton: 'I-print ang 1-pahina nga MAO brief',
    glossaryTitle: 'Yano nga Diksyonaryo sa Siyensya sa Yuta ug Satellite',
    glossaryItems: [
      {
        term: 'Evapotranspiration',
        shortCode: 'ET / EVPTRNS',
        definition:
          'Ang hiniusang alisngaw sa tubig gikan sa yuta ug singot sa dahon sa tanom.',
        farmerMeaning:
          'Kon init kaayo, dali mahurot ang kaumog—ang mulch ug munggo/kamote makapugong sa pagkauga sa yuta.',
      },
      {
        term: 'NDVI',
        shortCode: 'Sentinel-2 / MODIS Index',
        definition:
          'Sukod sa kalabong ug kaberde sa tanom gikan sa satellite (-1 ngadto sa +1).',
        farmerMeaning:
          'Kon ubos sa 0.20, hawan ug walay tabon ang yuta mao nga dali kini mabanlas sa kusog nga ulan.',
      },
      {
        term: 'Soil Wetness Anomaly',
        shortCode: 'Z-Score vs. 2001–2025',
        definition:
          'Kalainan sa kaumog karon kon itandi sa 25 ka tuig nga kasagarang rekord sa maong bulan.',
        farmerMeaning:
          'Magpakita kon nagsugod na ang huwaw o sobra nga pagbasa aron makapili og sakto nga binhi.',
      },
      {
        term: 'GWETROOT',
        shortCode: 'NASA POWER 0–100 cm',
        definition:
          'Indeks gikan 0 (uga) ngadto 1 (basa kaayo) sa kaumog sa ilawom nga 0–100 cm diin naa ang gamot.',
        farmerMeaning:
          'Bisan uga ang ibabaw sa yuta, kon duna pay kaumog sa ilawom, mabuhi ang lawom og gamot sama sa munggo, mani, ug sorghum.',
      },
    ],
  },
  tl: {
    languageName: 'Tagalog',
    reviewNotice: 'Translations need native-speaker review.',
    navOverview: 'Pangkalahatan',
    navHowItWorks: 'Paano Gumagana',
    navFieldDemo: 'Demo sa Bukid',
    navFariEngine: 'FARI at Estratehiya',
    navAgronomics: 'Terroir at Sertipiko',
    droughtAlertBanner:
      'Tuyong-tuyo ang lupa—ipagpaliban muna ang pag-spray ng pampabulaklak; magtanim ng munggo o kamote upang mapanatili ang halumigmig ng lupa.',
    fariSectionTitle: '3-Estratehiya sa Pagpapalit-Tanom at FARI Decision Engine',
    fariSectionSubtitle:
      'Ihambing ang nakagawiang monocrop laban sa dalawang climate-adaptive rotation batay sa Tubig (W), Erosyon (E), Sustansya (N), at Merkado (M).',
    prioritySlidersTitle: 'Prayoridad ng Magsasaka (Awtomatikong 100% Kabuuan)',
    waterPriorityLabel: 'Kaangkupan sa Tubig (W)',
    erosionPriorityLabel: 'Proteksyon sa Erosyon (E)',
    nutrientsPriorityLabel: 'Pagpapanumbalik ng Sustansya (N)',
    marketPriorityLabel: 'Kita at Merkado (M)',
    stressPresetsTitle: 'Sitwasyon ng Klima ("What-If" Stress)',
    constraintsTitle: 'Tunay na Kondisyon sa Bukid',
    constraintRainfed: 'Umaasa sa Ulan Lang (Walang Deep Well)',
    constraintManual: 'Manwal na Kagamitan Lang (Walang Traktor)',
    constraintFastCash: 'Kailangan ng 60-Araw na Mabilis na Kita',
    strategyComparisonTitle: 'Paghahambing ng Tatlong Estratehiya sa Pagtatanim',
    whySuggestedLabel: '1. Bakit Iminungkahi',
    supportingEvidenceLabel: '2. Ebidensya mula sa NASA',
    expectedBenefitsLabel: '3. Inaasahang Benepisyo at Agham-Pananim',
    dataGapsLabel: '4. Limitasyon ng Satellite Data',
    localReviewAlertsLabel: '5. Paalala: Ikonsulta sa MAO / Extension',
    timelineTitle: '12-Buwang Kalendaryo ng Takip-Lupa at Pagputol sa Peste',
    projectedImpactsTitle: 'Inaasahang Epekto Batay sa Literatura',
    projectedEstimateBadge: 'Projected estimate',
    projectedEstimateTooltip:
      'This is a literature-range estimate for educational decision support. It is not a measured result, guaranteed outcome, or site-specific recommendation.',
    illustrativeModeledBadge: 'Illustrative / modeled',
    readAloudButton: 'Basahin nang malakas',
    stopAudioButton: 'Itigil ang boses',
    copySmsBriefButton: 'Kopyahin ang SMS / Messenger brief',
    printBriefButton: 'I-print ang 1-pahinang MAO brief',
    glossaryTitle: 'Simpleng Talatinigan ng Agham-Lupa at Satellite',
    glossaryItems: [
      {
        term: 'Evapotranspiration',
        shortCode: 'ET / EVPTRNS',
        definition:
          'Pinagsamang singaw ng tubig mula sa lupa at pawis ng mga dahon ng halaman.',
        farmerMeaning:
          'Kapag matindi ang init, mabilis maubos ang tubig sa lupa—nakakatulong ang mulch at munggo/kamote upang mapanatili ang halumigmig.',
      },
      {
        term: 'NDVI',
        shortCode: 'Sentinel-2 / MODIS Index',
        definition:
          'Sukatan ng pagiging luntian at kapal ng pananim mula sa satellite (-1 hanggang +1).',
        farmerMeaning:
          'Ang mababa sa 0.20 ay nangangahulugang nakatiwangwang ang lupa at madaling maanod ng malakas na ulan.',
      },
      {
        term: 'Soil Wetness Anomaly',
        shortCode: 'Z-Score vs. 2001–2025',
        definition:
          'Gaano katuyo o kabasa ang kasalukuyang buwan kumpara sa 25-taong karaniwang rekord.',
        farmerMeaning:
          'Nagbibigay-babala sa maagang tagtuyot o sobrang pagkababad upang makapili ng angkop na pananim.',
      },
      {
        term: 'GWETROOT',
        shortCode: 'NASA POWER 0–100 cm',
        definition:
          'Indeks mula 0 (tuyo) hanggang 1 (basa) ng tubig sa lalim na 0–100 cm kung saan naroon ang ugat.',
        farmerMeaning:
          'Kahit tuyo ang ibabaw ng lupa, kung may halumigmig pa sa ilalim ay mabubuhay ang malalalim ang ugat gaya ng munggo, mani, at sorghum.',
      },
    ],
  },
};

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationStrings;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
  t: TRANSLATIONS.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
