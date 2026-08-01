import { describe, it, expect } from 'vitest';
import { wmoToCondition } from './wmoCode.js';

describe('wmoToCondition', () => {
  it('maps clear sky codes', () => {
    expect(wmoToCondition(0)).toBe('clear');
    expect(wmoToCondition(1)).toBe('clear');
  });

  it('maps thunderstorm codes', () => {
    expect(wmoToCondition(95)).toBe('thunderstorm');
    expect(wmoToCondition(99)).toBe('thunderstorm');
  });

  it('maps rain codes', () => {
    expect(wmoToCondition(61)).toBe('rain');
    expect(wmoToCondition(82)).toBe('rain');
  });

  it('falls back to unknown for unmapped codes', () => {
    expect(wmoToCondition(9999)).toBe('unknown');
  });
});
