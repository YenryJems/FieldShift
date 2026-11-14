import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('home view', () => {
  it('renders the FieldShift introduction and workspace action', () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain('Adapt crop rotations with NASA satellite soil, rain, and heat data.');
    expect(markup).toContain('Open Field Workspace');
    expect(markup).toContain('Smallholder Free');
  });
});
