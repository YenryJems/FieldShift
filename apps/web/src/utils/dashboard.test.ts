import { describe, expect, it } from 'vitest';
import { evaluatePlotStrategies } from '@fieldshift/climate-data';
import { copyTextToClipboard } from './clipboard';
import {
  buildSmsFieldBrief,
  classifyRainfall,
  classifyTemperature,
  cropDisplayName,
  formatGain,
  rootZoneMoisturePct,
  SMS_MAX_CHARS,
  termLabel,
} from './dashboard';

describe('dashboard utilities', () => {
  it('classifies air temperature against 28.5°C threshold', () => {
    expect(classifyTemperature(28.5)).toEqual({ label: 'Within range', tone: 'emerald' });
    expect(classifyTemperature(28.6)).toEqual({ label: 'Thermal stress', tone: 'rose' });
  });

  it('classifies daily rainfall into dry spell, normal, and heavy-rain surge', () => {
    expect(classifyRainfall(1.9)).toEqual({ label: 'Dry spell', tone: 'amber' });
    expect(classifyRainfall(2)).toEqual({ label: 'Normal rainfall', tone: 'sky' });
    expect(classifyRainfall(14)).toEqual({ label: 'Normal rainfall', tone: 'sky' });
    expect(classifyRainfall(14.1)).toEqual({ label: 'Heavy-rain surge', tone: 'rose' });
  });

  it('converts root-zone wetness index to clamped percentage', () => {
    expect(rootZoneMoisturePct(0.734)).toBe(73);
    expect(rootZoneMoisturePct(Number.NaN)).toBe(0);
    expect(rootZoneMoisturePct(1.4)).toBe(100);
  });

  it('returns plain vs technical term labels', () => {
    expect(termLabel('temp', true)).toBe('Air Temperature');
    expect(termLabel('temp', false)).toContain('T2M');
    expect(termLabel('fari', true)).toBe('Top FARI Suitability Score');
    expect(termLabel('rootMoisture', false)).toContain('GWETROOT');
  });

  it('formats strategy gain vs baseline across all states', () => {
    const evalRes = evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 1 });
    const base = evalRes.baseline;
    expect(formatGain(base)).toBe('Baseline');
    expect(formatGain({ ...evalRes.top, key: 'regenerator', gainVsBaselinePct: null })).toBe(
      'n/a (baseline scores 0)',
    );
    expect(formatGain({ ...evalRes.top, key: 'regenerator', gainVsBaselinePct: 12.3 })).toBe(
      '+12.3% vs baseline',
    );
    expect(formatGain({ ...evalRes.top, key: 'regenerator', gainVsBaselinePct: -4 })).toBe(
      '−4% vs baseline',
    );
    expect(formatGain({ ...evalRes.top, key: 'regenerator', gainVsBaselinePct: 0 })).toBe(
      '±0% vs baseline',
    );
  });

  it('builds SMS field brief within 480 chars and without raw telemetry codes in plain mode', () => {
    const evalRes = evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 1 });
    const sms = buildSmsFieldBrief({
      farmName: 'Nueva Ecija Rice Plains',
      monthLabel: 'Jan',
      climate: evalRes.climate,
      top: evalRes.top,
      plainEnglish: true,
    });

    expect(sms.length).toBeLessThanOrEqual(SMS_MAX_CHARS);
    expect(sms).toContain('FieldShift brief – Nueva Ecija Rice Plains, Jan');
    expect(sms).toContain('Before acting:');
    for (const code of ['GWETTOP', 'GWETROOT', 'PRECTOTCORR', 'T2M']) {
      expect(sms).not.toContain(code);
    }
  });

  it('includes EcoCrop scientific name Oryza sativa in technical mode', () => {
    expect(cropDisplayName({ crops: ['Rice', 'Mungbean'] }, true)).toBe('Rice + Mungbean');
    expect(cropDisplayName({ crops: ['Rice', 'Mungbean'] }, false)).toContain('Oryza sativa');
  });

  it('resolves copyTextToClipboard to false safely in Node', async () => {
    await expect(copyTextToClipboard('test brief')).resolves.toBe(false);
  });
});
