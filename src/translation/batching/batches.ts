import type { TranslationItem } from '../../types/translation';

export interface BatchLimits {
  maxItems: number;
  maxEstimatedTokens: number;
}

export const DEFAULT_BATCH_LIMITS: BatchLimits = {
  maxItems: 40,
  maxEstimatedTokens: 2_500,
};

export function normalizeForMemory(text: string): string {
  return text.trim().replace(/\s+/g, ' ').normalize('NFC');
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3.5));
}

export function deduplicateItems(items: TranslationItem[]): {
  unique: TranslationItem[];
  idsByNormalizedText: Map<string, string[]>;
} {
  const firstByText = new Map<string, TranslationItem>();
  const idsByNormalizedText = new Map<string, string[]>();

  for (const item of items) {
    const normalized = normalizeForMemory(item.text);
    const ids = idsByNormalizedText.get(normalized) ?? [];
    ids.push(item.id);
    idsByNormalizedText.set(normalized, ids);
    if (!firstByText.has(normalized)) firstByText.set(normalized, item);
  }

  return { unique: [...firstByText.values()], idsByNormalizedText };
}

export function createBatches(
  items: TranslationItem[],
  limits: BatchLimits = DEFAULT_BATCH_LIMITS,
): TranslationItem[][] {
  const batches: TranslationItem[][] = [];
  let current: TranslationItem[] = [];
  let tokens = 0;

  for (const item of items) {
    const itemTokens = estimateTokens(item.text) + 8;
    const wouldOverflow =
      current.length > 0 &&
      (current.length >= limits.maxItems || tokens + itemTokens > limits.maxEstimatedTokens);
    if (wouldOverflow) {
      batches.push(current);
      current = [];
      tokens = 0;
    }
    current.push(item);
    tokens += itemTokens;
  }

  if (current.length) batches.push(current);
  return batches;
}
