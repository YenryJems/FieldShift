import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FARMS } from '@fieldshift/climate-data';
import App from './App';
import { AnalyticalSuiteSection } from './components/Agronomics/AnalyticalSuiteSection';
import { FooterAndAttributions } from './components/Common/FooterAndAttributions';
import { WorkspaceView } from './components/WorkspaceView';
import { TopNavBar } from './components/TopNavBar';
import { StrategyComparisonSection } from './components/Rotation/StrategyComparisonSection';
import { TRANSLATIONS } from './context/LanguageContext';

describe('guided FieldShift planning experience', () => {
  const onPlannerStepChange = () => undefined;

  it('opens on a calm introduction and waits for the user to enter the workspace', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('The Next Frontier');
    expect(markup).toContain('NASA Space Apps Challenge');
    expect(markup).toContain('Enter the field workspace');
    expect(markup).toContain('A changing season.');
    expect(markup).toContain('One decision at a time.');
    expect(markup).toContain('Open-Meteo · live weather model');
    expect(markup).toContain('NASA SRTM · configured slope context');
    expect(markup).toContain('NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.');
    expect(markup).not.toContain('Choose a study farm');
    expect(markup).not.toContain('Selected field context');
    expect(markup).not.toContain('Satellite field view');
    expect(markup).not.toContain('Your planning path');
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Create Account');
  });

  it('reads the seasonal evidence before priorities and rotation comparison', () => {
    const season = renderToStaticMarkup(
      createElement(WorkspaceView, { plannerStep: 1, onPlannerStepChange }),
    );
    expect(season).toContain('Which rotation is worth discussing for this field and season?');
    expect(season).toContain('Satellite field view');
    expect(season).toContain('Current conditions &amp; 3-day outlook');

    const priorities = renderToStaticMarkup(
      createElement(WorkspaceView, { plannerStep: 2, onPlannerStepChange }),
    );
    expect(priorities).toContain('Set priorities for this season');
    expect(priorities).toContain('Conserve Water (W)');
    expect(priorities).toContain('Drought');
    expect(priorities).not.toContain('Strategy S1:');

    const comparison = renderToStaticMarkup(
      createElement(WorkspaceView, { plannerStep: 3, onPlannerStepChange }),
    );
    for (const id of ['S1', 'S2', 'S3']) expect(comparison).toContain(`Strategy ${id}:`);
    expect(comparison).toContain('Use as my draft plan');
    for (const heading of [
      '1. Why Suggested',
      '2. Supporting NASA Evidence',
      '3. Expected Benefits &amp; Crop Science',
      '4. Information &amp; Data Gaps',
      '5. Risks Requiring Local Review (MAO / Extension)',
    ]) expect(comparison).toContain(heading);
  });

  it('keeps every planning step directly accessible without completing earlier steps', () => {
    const markup = renderToStaticMarkup(
      createElement(TopNavBar, { plannerStep: 0, onPlannerStepChange, onReturnHome: () => undefined }),
    );
    expect(markup).toContain('Return to the FieldShift landing page');
    for (const label of ['Farm', 'Season', 'Priorities', 'Rotations', 'Review']) {
      expect(markup).toContain(`Go to ${label}`);
    }
    expect(markup).not.toContain('disabled=""');
  });

  it('scopes literature impact ranges to their farm context and avoids guaranteed-loss claims', () => {
    const plains = renderToStaticMarkup(
      createElement(StrategyComparisonSection, { farmId: 'nueva-ecija', selectedMonth: 1, displayMode: 'compare' }),
    );
    expect(plains).toContain('Bukidnon trial reference');
    expect(plains).toContain('Guimaras mango reference');
    expect(plains).not.toContain('prevents wasted KNO');

    const guimaras = renderToStaticMarkup(
      createElement(StrategyComparisonSection, { farmId: 'guimaras', selectedMonth: 1, displayMode: 'compare' }),
    );
    expect(guimaras).toContain('PHP 15,000-35,000/ha potential');
    expect(guimaras).toContain('cannot guarantee zero washout or savings');

    const bukidnon = renderToStaticMarkup(
      createElement(StrategyComparisonSection, { farmId: 'bukidnon', selectedMonth: 1, displayMode: 'compare' }),
    );
    expect(bukidnon).toContain('Up to 75%');
    expect(bukidnon).toContain('not a measured or guaranteed reduction');
  });

  it('ends with a reviewable field brief and preserves scientific labels and the NASA disclaimer', () => {
    const review = renderToStaticMarkup(
      createElement(WorkspaceView, { plannerStep: 4, onPlannerStepChange }),
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
      }),
    );
    expect(chosenReview).toContain('Your draft choice');
    expect(chosenReview).toContain('Rank #');

    const analyticalMarkup = renderToStaticMarkup(
      createElement(AnalyticalSuiteSection, { farmId: 'nueva-ecija', selectedMonth: 1 }),
    );
    expect(analyticalMarkup).toContain('Rule-based suitability ensemble (RF-style)');
    expect(analyticalMarkup).toContain('Orbital Confidence 80% | Ground-Truth Testing Required 20%');
    const footerMarkup = renderToStaticMarkup(createElement(FooterAndAttributions));
    expect(footerMarkup).toContain('Challenge inspiration: multigenerational farming experience');
    for (const citation of ['POWER data &amp; API', 'GPM IMERG', 'SMAP L4 product', 'MODIS Terra NDVI layer', 'SRTM mission data', 'Sentinel-2 mission &amp; products', 'FAO ECOCROP database', 'Illinois Grain Bids report', 'Forecast API documentation', 'OpenStreetMap copyright &amp; license']) {
      expect(footerMarkup).toContain(citation);
    }
    expect(footerMarkup).toContain('NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.');
  });

  it('mounts the Leaflet map only after the evidence step becomes visible', () => {
    const evidence = renderToStaticMarkup(
      createElement(WorkspaceView, { plannerStep: 1, onPlannerStepChange }),
    );
    expect(evidence).toContain('Satellite field view');
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
});
