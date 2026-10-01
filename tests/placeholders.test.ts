import { describe, expect, it } from 'vitest';
import {
  protectPlaceholders,
  restorePlaceholders,
  validatePlaceholders,
} from '../src/translation/placeholders/placeholders';

describe('placeholder protection', () => {
  it('protects and restores supported placeholders and tags', () => {
    const original = 'Hello {{name}} {0} %s ${value}\\n<strong>world</strong>\nNext';
    const protectedValue = protectPlaceholders(original);
    expect(protectedValue.placeholders.size).toBe(8);
    expect(restorePlaceholders(protectedValue.text, protectedValue.placeholders)).toBe(original);
  });

  it('rejects a result that loses a placeholder', () => {
    const protectedValue = protectPlaceholders('Hello {{name}} and {count}');
    expect(() =>
      validatePlaceholders('__TRANSLATY_P0__ only', protectedValue.placeholders),
    ).toThrow(/changed or removed/);
  });

  it('rejects unknown placeholder tokens', () => {
    const protectedValue = protectPlaceholders('Hello {name}');
    expect(() =>
      validatePlaceholders('__TRANSLATY_P0__ __TRANSLATY_P99__', protectedValue.placeholders),
    ).toThrow();
  });
});
