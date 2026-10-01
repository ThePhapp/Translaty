import type {
  TranslatedItem,
  TranslationItem,
  TranslationProvider,
  TranslationRunOptions,
} from '../../types/translation';
import type { TranslationMemory } from '../../storage/translationMemory';
import { createBatches, deduplicateItems, normalizeForMemory } from '../batching/batches';
import { protectPlaceholders, restorePlaceholders } from '../placeholders/placeholders';

export class TranslationService {
  constructor(
    private readonly provider: TranslationProvider,
    private readonly memory: TranslationMemory,
  ) {}

  async translateTexts(texts: string[], options: TranslationRunOptions): Promise<string[]> {
    const originalItems: TranslationItem[] = texts.map((text, index) => ({
      id: String(index),
      text,
    }));
    const { unique, idsByNormalizedText } = deduplicateItems(originalItems);
    const translatedByNormalizedText = new Map<string, string>();
    const misses: TranslationItem[] = [];
    let cacheHits = 0;

    for (const item of unique) {
      if (!item.text.trim()) {
        translatedByNormalizedText.set(normalizeForMemory(item.text), item.text);
        continue;
      }
      const hit = await this.memory.get({
        sourceText: item.text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
      });
      if (hit) {
        translatedByNormalizedText.set(normalizeForMemory(item.text), hit.translatedText);
        cacheHits += 1;
      } else {
        misses.push(item);
      }
    }

    options.onProgress?.({ completed: cacheHits, total: unique.length, cacheHits });
    let completed = cacheHits;
    for (const batch of createBatches(misses)) {
      if (options.signal?.aborted) throw new DOMException('Translation cancelled', 'AbortError');
      const protectedById = new Map(batch.map((item) => [item.id, protectPlaceholders(item.text)]));
      const protectedItems = batch.map((item) => ({
        id: item.id,
        text: protectedById.get(item.id)!.text,
      }));
      const result = await this.provider.translate({
        items: protectedItems,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        mode: options.mode ?? 'natural',
        glossary: options.glossary,
        signal: options.signal,
      });
      const byId = new Map(result.items.map((item: TranslatedItem) => [item.id, item.text]));
      for (const item of batch) {
        const translated = byId.get(item.id);
        if (translated === undefined)
          throw new Error(`Provider omitted translation ID ${item.id}.`);
        const restored = restorePlaceholders(translated, protectedById.get(item.id)!.placeholders);
        translatedByNormalizedText.set(normalizeForMemory(item.text), restored);
        await this.memory.put({
          sourceText: item.text,
          sourceLanguage: options.sourceLanguage,
          targetLanguage: options.targetLanguage,
          translatedText: restored,
          provider: result.provider,
        });
      }
      completed += batch.length;
      options.onProgress?.({ completed, total: unique.length, cacheHits });
    }

    const resultById = new Map<string, string>();
    for (const [normalized, ids] of idsByNormalizedText) {
      const translated = translatedByNormalizedText.get(normalized);
      if (translated === undefined) throw new Error('Translation mapping is incomplete.');
      ids.forEach((id) => resultById.set(id, translated));
    }
    return originalItems.map((item) => resultById.get(item.id) ?? item.text);
  }
}
