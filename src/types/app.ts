import type { TranslationProgress, TranslationRunOptions } from './translation';

export type TranslateFunction = (
  texts: string[],
  options?: Partial<TranslationRunOptions> & {
    onProgress?: (progress: TranslationProgress) => void;
  },
) => Promise<string[]>;
