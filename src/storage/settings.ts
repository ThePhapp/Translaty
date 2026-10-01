import type { GlossaryEntry, LanguageCode, TranslationMode } from '../types/translation';

export interface AppSettings {
  sourceLanguage: LanguageCode;
  targetLanguage: Exclude<LanguageCode, 'auto'>;
  mode: TranslationMode;
  provider: 'mymemory' | 'demo' | 'openai-compatible';
  shortcut: string;
  theme: 'light' | 'dark' | 'system';
  baseUrl: string;
  model: string;
  glossary: GlossaryEntry[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  sourceLanguage: 'auto',
  targetLanguage: 'vi',
  mode: 'natural',
  provider: 'mymemory',
  shortcut: 'CommandOrControl+Shift+T',
  theme: 'light',
  baseUrl: import.meta.env.VITE_TRANSLATION_API_BASE_URL ?? 'https://api.openai.com/v1',
  model: import.meta.env.VITE_TRANSLATION_MODEL ?? 'gpt-4.1-mini',
  glossary: [],
};

const SETTINGS_KEY = 'translaty.settings.v2';

export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(saved) as Partial<AppSettings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
