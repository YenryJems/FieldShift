import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FARMS } from '@fieldshift/climate-data';
import App from './App';
import { AnalyticalSuiteSection } from './components/Agronomics/AnalyticalSuiteSection';
import { StrategyComparisonSection } from './components/Rotation/StrategyComparisonSection';
import { TRANSLATIONS } from './context/LanguageContext';

describe('home view and full FieldShift specification suite', () => {
  it('presents the climate-planning story and interactive field demo without account flows', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('Plan for a season that keeps changing.');
    expect(markup).toContain('Open decision workspace');
    expect(markup).toContain('Interactive decision workspace');
    expect(markup).toContain('Compare rotations');
    expect(markup).toContain('Choose a study farm');
    expect(markup).toContain('Selected field context');
    expect(markup).toContain('Seasonal climate profile');
    expect(markup).toContain('NASA Space Apps Challenge');
    expect(markup).toContain('The Next Frontier');
    expect(markup).toContain('aria-label="Page navigation"');
    expect(markup).toContain('Seasonal outlook');
    expect(markup).toContain('NASA POWER · historical monthly point data · 2020–2025');
    expect(markup).toContain('Nueva Ecija');
    expect(markup).toContain('Bukidnon');
    expect(markup).toContain('Isabela');
    expect(markup).toContain('Guimaras');
    expect(markup).toContain('USA Midwest');
    expect(markup).toContain('Satellite');
    expect(markup).toContain('Street');
    expect(markup).toContain('Historical month');
    expect(markup).toContain('Relative humidity');
    expect(markup).toContain('Solar radiation');
    expect(markup).toContain('Surface wetness');
    expect(markup).toContain('IMERG rainfall estimate');
    const additionalSignalsIndex = markup.indexOf(
      'aria-label="Additional January climate data for Nueva Ecija"',
    );
    const mapLayerControlsIndex = markup.indexOf('aria-label="Map layer"');
    expect(additionalSignalsIndex).toBeGreaterThan(-1);
    expect(additionalSignalsIndex).toBeLessThan(mapLayerControlsIndex);
    expect(markup).toContain('configured study extent');
    expect(markup).toContain('NASA Langley Research Center POWER Project');
    expect(markup).toContain('Raw JSON');
    expect(markup).not.toContain('Sign in');
    expect(markup).not.toContain('Create Account');
    expect(markup).not.toContain('Smallholder Free');
  });

  it('renders FARI 3-strategy comparison, 5 rubric explanations, projected estimate badges, and mandatory NASA disclaimer', () => {
    const markup = renderToStaticMarkup(createElement(App));

    // 3 strategies for default farm (Nueva Ecija)
    expect(markup).toContain('Strategy S1:');
    expect(markup).toContain('Strategy S2:');
    expect(markup).toContain('Strategy S3:');

    // 5 mandatory rubric explanation headings
    expect(markup).toContain('1. Why Suggested');
    expect(markup).toContain('2. Supporting NASA Evidence');
    expect(markup).toContain('3. Expected Benefits &amp; Crop Science');
    expect(markup).toContain('4. Information &amp; Data Gaps');
    expect(markup).toContain('5. Risks Requiring Local Review (MAO / Extension)');

    // Priority sliders & stress presets
    expect(markup).toContain('Conserve Water (W)');
    expect(markup).toContain('Stop Erosion (E)');
    expect(markup).toContain('Rebuild Nutrients (N)');
    expect(markup).toContain('Supplemental Income (M)');
    expect(markup).toContain('Drought (−30% Rain)');
    expect(markup).toContain('Heatwave (+2.5°C)');
    expect(markup).toContain('Deluge (+40% Rain)');

    // Mandatory labeling badges
    expect(markup).toContain('Projected estimate');
    expect(markup).toContain('Illustrative / modeled');
    expect(markup).toContain('Rule-based suitability ensemble (RF-style)');
    expect(markup).toContain('Orbital Confidence 80% | Ground-Truth Testing Required 20%');
    // English-only interface and mandatory verbatim NASA disclaimer
    expect(markup).toContain('English');
    expect(markup).not.toContain('Binisaya');
    expect(markup).toContain(
      'NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.',
    );
  });

  it('renders StrategyComparisonSection and AnalyticalSuiteSection cleanly across all 5 farms', () => {
    for (const farm of FARMS) {
      const stratMarkup = renderToStaticMarkup(
        createElement(StrategyComparisonSection, {
          farmId: farm.id,
          selectedMonth: 3,
        }),
      );
      expect(stratMarkup).toContain(farm.name);
      for (const strategy of farm.strategies) {
        expect(stratMarkup).toContain(strategy.name);
      }

      const analyticalMarkup = renderToStaticMarkup(
        createElement(AnalyticalSuiteSection, {
          farmId: farm.id,
          selectedMonth: 3,
        }),
      );
      expect(analyticalMarkup).toContain('90-Day Climatological Flower Induction');
      expect(analyticalMarkup).toContain('Terroir Nutrient Balance');
      expect(analyticalMarkup).toContain('Rule-based suitability ensemble (RF-style)');
      expect(analyticalMarkup).toContain('Tier 1 Orbital Assessment (80%)');
    }
  });

  it('provides the English interface and four plain-language glossary terms', () => {
    expect(TRANSLATIONS.en.glossaryItems).toHaveLength(4);
    expect(Object.keys(TRANSLATIONS)).toEqual(['en']);
  });
});
