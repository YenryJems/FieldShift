import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('home view', () => {
  it('presents the climate-planning story and interactive field demo without account flows', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('Weather shifts.');
    expect(markup).toContain('Explore the field demo');
    expect(markup).toContain('Interactive field demo');
    expect(markup).toContain('Try a different climate scenario.');
    expect(markup).toContain('NASA POWER · historical monthly point data · 2020–2025');
    expect(markup).toContain('Nueva Ecija');
    expect(markup).toContain('Bukidnon');
    expect(markup).toContain('Isabela');
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
});
