import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FARMS } from '@fieldshift/climate-data';
import App from './App';
import { AnalyticalSuiteSection } from './components/Agronomics/AnalyticalSuiteSection';
import { FooterAndAttributions } from './components/Common/FooterAndAttributions';
import { WorkspaceView } from './components/WorkspaceView';
import { TopNavBar, WORKBENCH_TABS, type WorkbenchTab } from './components/TopNavBar';
import { StrategyComparisonSection } from './components/Rotation/StrategyComparisonSection';
import { TRANSLATIONS } from './context/LanguageContext';

const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;');

describe('unified FieldShift split-pane workbench experience', () => {
  const onTabChange = (_tab: WorkbenchTab) => undefined;

  it('opens on a calm introduction and waits for the user to enter the workspace', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('The Next Frontier');
    expect(markup).toContain('NASA Space Apps Challenge');
    expect(markup).toContain('Enter the field workspace');
    expect(markup).toContain('A changing season.');
    expect(markup).toContain('One decision at a time.');
    expect(markup).toContain('Mango Sugar-Loading Index');
    expect(markup).toContain('not measure fruit sugar');
    expect(markup).toContain('18–22° Brix suitability target');
    expect(markup).toContain('Open-Meteo · live weather model');
    expect(markup).toContain('NASA SRTM · configured slope context');
    expect(markup).toContain(
      'NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.',
    );
    expect(markup).not.toContain('Choose a study farm');
    expect(markup).not.toContain('Selected field context');
    expect(markup).not.toContain('Satellite field view');
    expect(markup).not.toContain('Your planning path');
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Create Account');
  });

  it('renders the persistent 4-KPI header and all four workbench tabs cleanly', () => {
    const fieldSeason = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'field-season', onTabChange }),
    );
    expect(fieldSeason).toContain('Air Temperature (°C)');
    expect(fieldSeason).toContain('Daily Rainfall (mm/day)');
    expect(fieldSeason).toContain('Root-Zone Moisture (%)');
    expect(fieldSeason).toContain('Active FARI Score (%)');
    expect(fieldSeason).toContain('Which rotation is worth discussing for this field and season?');
    expect(fieldSeason).toContain('Satellite field view');
    expect(fieldSeason).toContain('Current conditions &amp; 3-day outlook');
    expect(fieldSeason).toContain('viewBox="0 0 760 300"');
    expect(fieldSeason).toContain('min-w-[540px]');
    expect(fieldSeason).toContain('Mean air temperature');
    expect(fieldSeason).toContain('Lowest Root-Zone Moisture');
    expect(fieldSeason).not.toContain('Mean T2M');
    expect(fieldSeason).not.toContain('Display thresholds: GWETROOT');

    const prioritiesRotations = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'priorities-rotations', onTabChange }),
    );
    expect(prioritiesRotations).toContain('Conserve Water (W)');
    expect(prioritiesRotations).toContain('Drought');
    for (const id of ['S1', 'S2', 'S3']) expect(prioritiesRotations).toContain(`Strategy ${id}:`);
    expect(prioritiesRotations).toContain('Use as my draft plan');
    expect(prioritiesRotations).toContain('Configured cultivars &amp; seed notes');
    expect(prioritiesRotations).toContain('Seed stock not verified locally');
    for (const heading of [
      '1. Why Suggested',
      '2. Supporting NASA Evidence',
      '3. Expected Benefits &amp; Crop Science',
      '4. Information &amp; Data Gaps',
      '5. Risks Requiring Local Review (MAO / Extension)',
    ]) {
      expect(prioritiesRotations).toContain(heading);
    }

    const soilAgronomy = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'soil-agronomy', onTabChange }),
    );
    expect(soilAgronomy).toContain('Agronomic Deep-Dive &amp; Verification Suite');
    expect(soilAgronomy).toContain('90-Day Climatological Flower Induction');
    expect(soilAgronomy).toContain('Tier 1 Orbital Assessment (80%)');
    expect(soilAgronomy).toContain('All 14 Reference Species');

    const sourcesBrief = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'sources-brief', onTabChange }),
    );
    expect(sourcesBrief).toContain('Your draft field plan');
    expect(sourcesBrief).toContain('Active priority weights &amp; constraints');
    expect(sourcesBrief).toContain('Edit priorities or change draft');
    expect(sourcesBrief).toContain('all five study locations');
    expect(sourcesBrief).toContain('All 5 locations · CSV');
    expect(sourcesBrief).toContain('Air Temperature (2 m) · °C');
    expect(sourcesBrief).toContain('Root-Zone Moisture · 0–100% scaled');
    expect(sourcesBrief).not.toContain('all three places');
    expect(sourcesBrief).not.toContain('GWETROOT · unitless');
  });

  it('supports standalone WorkspaceView rendering without props', () => {
    const standalone = renderToStaticMarkup(createElement(WorkspaceView));
    expect(standalone).toContain('Satellite field view');
    expect(standalone).toContain('Active FARI Score (%)');
  });

  it('keeps every workbench tab directly accessible without completing earlier steps', () => {
    const markup = renderToStaticMarkup(
      createElement(TopNavBar, {
        activeTab: 'field-season',
        onTabChange,
        onReturnHome: () => undefined,
      }),
    );
    expect(markup).toContain('Return to the FieldShift landing page');
    expect(markup).toContain('Field workbench');
    expect(markup).toContain('Precision-Agri Workbench');
    expect(markup).toContain('aria-current="page"');
    expect(markup).not.toContain('aria-current="step"');
    for (const item of WORKBENCH_TABS) {
      expect(markup).toContain(`Go to ${escapeHtml(item.label)}`);
    }
    expect(markup).not.toContain('disabled=""');
  });

  it('scopes literature impact ranges to their farm context and avoids guaranteed-loss claims', () => {
    const plains = renderToStaticMarkup(
      createElement(StrategyComparisonSection, {
        farmId: 'nueva-ecija',
        selectedMonth: 1,
        displayMode: 'compare',
      }),
    );
    expect(plains).toContain('Bukidnon trial reference');
    expect(plains).toContain('Guimaras mango reference');
    expect(plains).not.toContain('prevents wasted KNO');

    const guimaras = renderToStaticMarkup(
      createElement(StrategyComparisonSection, {
        farmId: 'guimaras',
        selectedMonth: 1,
        displayMode: 'compare',
      }),
    );
    expect(guimaras).toContain('PHP 15,000-35,000/ha potential');
    expect(guimaras).toContain('cannot guarantee zero washout or savings');

    const bukidnon = renderToStaticMarkup(
      createElement(StrategyComparisonSection, {
        farmId: 'bukidnon',
        selectedMonth: 1,
        displayMode: 'compare',
      }),
    );
    expect(bukidnon).toContain('Up to 75%');
    expect(bukidnon).toContain('not a measured or guaranteed reduction');
  });

  it('ends with a reviewable field brief and preserves scientific labels and the NASA disclaimer', () => {
    const review = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'sources-brief', onTabChange }),
    );
    expect(review).toContain('Your draft field plan');
    expect(review).toContain('Highest score · not selected');
    expect(review).toContain('Print detailed field report');
    expect(review).toContain('Printable scientific field planning brief');
    expect(review).toContain('Methods, sources &amp; limits');
    expect(review).toContain('12-month crop sequence &amp; ground-cover schedule');
    expect(review).toContain('FARI');

    const chosenReview = renderToStaticMarkup(
      createElement(StrategyComparisonSection, {
        farmId: 'nueva-ecija',
        selectedMonth: 1,
        displayMode: 'review',
        selectedStrategyId: 'S2',
        onEditPriorities: () => undefined,
      }),
    );
    expect(chosenReview).toContain('Your draft choice');
    expect(chosenReview).toContain('Rank #');
    expect(chosenReview).toContain('Edit priorities or change draft');

    const analyticalMarkup = renderToStaticMarkup(
      createElement(AnalyticalSuiteSection, { farmId: 'nueva-ecija', selectedMonth: 1 }),
    );
    expect(analyticalMarkup).toContain('Rule-based suitability ensemble (RF-style)');
    expect(analyticalMarkup).toContain('Orbital Confidence 80% | Ground-Truth Testing Required 20%');

    const footerMarkup = renderToStaticMarkup(createElement(FooterAndAttributions));
    expect(footerMarkup).toContain('Challenge inspiration: multigenerational farming experience');
    for (const citation of [
      'POWER data &amp; API',
      'GPM IMERG',
      'SMAP L4 product',
      'MODIS Terra NDVI layer',
      'SRTM mission data',
      'Sentinel-2 mission &amp; products',
      'FAO ECOCROP database',
      'Illinois Grain Bids report',
      'Forecast API documentation',
      'OpenStreetMap copyright &amp; license',
    ]) {
      expect(footerMarkup).toContain(citation);
    }
    expect(footerMarkup).toContain(
      'NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.',
    );
  });

  it('mounts the Leaflet map only on the field-season workbench tab', () => {
    const fieldSeason = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'field-season', onTabChange }),
    );
    expect(fieldSeason).toContain('Satellite field view');

    for (const tab of ['priorities-rotations', 'soil-agronomy', 'sources-brief'] as const) {
      const otherTabMarkup = renderToStaticMarkup(
        createElement(WorkspaceView, { activeTab: tab, onTabChange }),
      );
      expect(otherTabMarkup).not.toContain('Satellite field view');
    }
  });

  it('renders strategy and analytical views cleanly for every supported farm', () => {
    for (const farm of FARMS) {
      const strategyMarkup = renderToStaticMarkup(
        createElement(StrategyComparisonSection, { farmId: farm.id, selectedMonth: 3 }),
      );
      expect(strategyMarkup).toContain(farm.name);
      for (const strategy of farm.strategies) expect(strategyMarkup).toContain(strategy.name);

      const analyticalMarkup = renderToStaticMarkup(
        createElement(AnalyticalSuiteSection, { farmId: farm.id, selectedMonth: 3 }),
      );
      expect(analyticalMarkup).toContain('90-Day Climatological Flower Induction');
      expect(analyticalMarkup).toContain('Terroir Nutrient Balance');
      expect(analyticalMarkup).toContain('Rule-based suitability ensemble (RF-style)');
      expect(analyticalMarkup).toContain('Tier 1 Orbital Assessment (80%)');
    }
  });

  it('keeps the English interface and four plain-language glossary terms', () => {
    expect(TRANSLATIONS.en.glossaryItems).toHaveLength(4);
    expect(Object.keys(TRANSLATIONS)).toEqual(['en']);
  });

  it('renders plain-English moisture percentages, the SSR-safe NasaDataAuditDrawer, and all 14 EcoCrop profiles', () => {
    const seasonMarkup = renderToStaticMarkup(
      createElement(WorkspaceView, { activeTab: 'field-season', onTabChange }),
    );
    expect(seasonMarkup).toContain('Root-Zone Moisture');
    expect(seasonMarkup).toContain('Active FARI Score');
    expect(seasonMarkup).toContain('NASA &amp; FAO Parameter Audit Drawer');
    expect(seasonMarkup).toContain('GWETROOT');

    const analyticalMatched = renderToStaticMarkup(
      createElement(AnalyticalSuiteSection, {
        farmId: 'nueva-ecija',
        selectedMonth: 1,
        initialEcoCropScope: 'matched',
      }),
    );
    expect(analyticalMatched).toContain('Agronomic &amp; EcoCrop Parameter Audit Drawer');
    expect(analyticalMatched).toContain('Taxonomy, soil &amp; EcoCrop metadata');
    expect(analyticalMatched).toContain('All 14 Reference Species');
    expect(analyticalMatched).toContain('Matched to Strategy S2');

    const analyticalAll = renderToStaticMarkup(
      createElement(AnalyticalSuiteSection, {
        farmId: 'nueva-ecija',
        selectedMonth: 1,
        initialEcoCropScope: 'all',
      }),
    );
    expect(analyticalAll).toContain('All 14 Reference Species');
    expect(analyticalAll).toContain('Coix lacryma-jobi');
    expect(analyticalAll).toContain('adlai');
  });
});
