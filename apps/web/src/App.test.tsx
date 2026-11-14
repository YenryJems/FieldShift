import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FARMS } from '@fieldshift/climate-data';
import App from './App';
import { AnalyticalSuiteSection } from './components/Agronomics/AnalyticalSuiteSection';
import { WorkspaceView } from './components/WorkspaceView';
import { StrategyComparisonSection } from './components/Rotation/StrategyComparisonSection';
import { TRANSLATIONS } from './context/LanguageContext';

describe('guided FieldShift planning experience', () => {
  const onPlannerStepChange = () => undefined;

  it('opens with a clear mission, start action, and location-selection step', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('The Next Frontier');
    expect(markup).toContain('NASA Space Apps Challenge');
    expect(markup).toContain('Start your field plan');
    expect(markup).toContain('Build a resilient season plan');
    expect(markup).toContain('Step 1');
    expect(markup).toContain('Choose a study farm');
    expect(markup).toContain('Selected field context');
    expect(markup).not.toContain('Satellite field view');
    for (const name of ['Nueva Ecija', 'Bukidnon', 'Isabela', 'Guimaras', 'USA Midwest']) {
      expect(markup).toContain(name);
    }
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Create Account');
  });

  it('reads the seasonal evidence before priorities and rotation comparison', () => {
    const season = renderToStaticMarkup(
      createElement(WorkspaceView, { plannerStep: 1, onPlannerStepChange }),
    );
    expect(season).toContain('Which rotation is worth discussing for this field and season?');
    expect(season).toContain('Satellite field view');

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

    const markup = renderToStaticMarkup(createElement(App));
    expect(markup).toContain('Projected estimate');
    expect(markup).toContain('Illustrative / modeled');
    expect(markup).toContain('Rule-based suitability ensemble (RF-style)');
    expect(markup).toContain('Orbital Confidence 80% | Ground-Truth Testing Required 20%');
    expect(markup).toContain('NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.');
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
