export type LanguageCode = 'auto' | 'en' | 'vi' | 'ja' | 'ko' | 'zh' | 'fr' | 'de' | 'es';

export type TranslationMode = 'natural' | 'formal' | 'casual' | 'technical';

export interface TranslationItem {
  id: string;
  text: string;
}

export interface TranslationRequest {
  items: TranslationItem[];
  sourceLanguage: LanguageCode;
  targetLanguage: Exclude<LanguageCode, 'auto'>;
  mode: TranslationMode;
  glossary?: GlossaryEntry[];
  signal?: AbortSignal;
}

export interface TranslatedItem {
  id: string;
  text: string;
  detectedLanguage?: string;
}

export interface TranslationResult {
  items: TranslatedItem[];
  provider: string;
}

export interface TranslationProvider {
  readonly id: string;
  readonly name: string;
  readonly supportsAutoDetect: boolean;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

export interface GlossaryEntry {
  source: string;
  target: string;
}

export interface TranslationProgress {
  completed: number;
  total: number;
  cacheHits: number;
}

export interface TranslationRunOptions {
  sourceLanguage: LanguageCode;
  targetLanguage: Exclude<LanguageCode, 'auto'>;
  mode?: TranslationMode;
  glossary?: GlossaryEntry[];
  signal?: AbortSignal;
  onProgress?: (progress: TranslationProgress) => void;
}
