import type { LanguageCode } from '../../types/translation';

export const LANGUAGES: ReadonlyArray<{ code: LanguageCode; label: string }> = [
  { code: 'auto', label: 'Detect language' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
];

export function languageName(code: LanguageCode): string {
  return LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
