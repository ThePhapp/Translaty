import { describe, expect, it } from 'vitest';
import {
  applyJsonTranslations,
  displayJsonPath,
  parseJsonDocument,
} from '../src/features/i18n/jsonDocument';

describe('i18n JSON document', () => {
  it('collects string values without translating keys or scalar values', () => {
    const document = parseJsonDocument(
      JSON.stringify({ 'login.button': 'Login', nested: { count: 2, labels: ['Save', 'Cancel'] } }),
    );
    expect(document.entries.map((entry) => entry.value)).toEqual(['Login', 'Save', 'Cancel']);
    expect(displayJsonPath(document.entries[1].path)).toBe('nested.labels[0]');
    const output = JSON.parse(applyJsonTranslations(document, ['Đăng nhập', 'Lưu', 'Hủy']));
    expect(output).toEqual({
      'login.button': 'Đăng nhập',
      nested: { count: 2, labels: ['Lưu', 'Hủy'] },
    });
  });

  it('reports invalid JSON clearly', () => {
    expect(() => parseJsonDocument('{bad')).toThrow(/Invalid JSON/);
  });
});
