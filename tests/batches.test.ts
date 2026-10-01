import { describe, expect, it } from 'vitest';
import { createBatches, deduplicateItems } from '../src/translation/batching/batches';

describe('translation batching', () => {
  it('deduplicates normalized text while retaining original IDs', () => {
    const result = deduplicateItems([
      { id: 'a', text: 'Cancel' },
      { id: 'b', text: ' Cancel ' },
      { id: 'c', text: 'Save' },
    ]);
    expect(result.unique).toHaveLength(2);
    expect(result.idsByNormalizedText.get('Cancel')).toEqual(['a', 'b']);
  });

  it('respects item limits', () => {
    const batches = createBatches(
      Array.from({ length: 5 }, (_, index) => ({ id: String(index), text: 'text' })),
      { maxItems: 2, maxEstimatedTokens: 100 },
    );
    expect(batches.map((batch) => batch.length)).toEqual([2, 2, 1]);
  });
});
