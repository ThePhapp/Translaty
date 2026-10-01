import { describe, expect, it, vi } from 'vitest';
import { InMemoryTranslationMemory } from '../src/storage/translationMemory';
import { TranslationService } from '../src/translation/core/translationService';
import type { TranslationProvider, TranslationRequest } from '../src/types/translation';

function createProvider(): TranslationProvider {
  return {
    id: 'test',
    name: 'Test',
    supportsAutoDetect: true,
    translate: vi.fn(async (request) => ({
      provider: 'test',
      items: [...request.items].reverse().map((item) => ({ id: item.id, text: `T:${item.text}` })),
    })),
  };
}

describe('TranslationService', () => {
  it('maps unordered responses by ID, restores placeholders, and deduplicates', async () => {
    const provider = createProvider();
    const service = new TranslationService(provider, new InMemoryTranslationMemory());
    const translated = await service.translateTexts(['Save {name}', 'Cancel', 'Save {name}'], {
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });
    expect(translated).toEqual(['T:Save {name}', 'T:Cancel', 'T:Save {name}']);
    expect(provider.translate).toHaveBeenCalledOnce();
    expect(vi.mocked(provider.translate).mock.calls[0][0].items).toHaveLength(2);
  });

  it('reuses translation memory without another provider request', async () => {
    const provider = createProvider();
    const memory = new InMemoryTranslationMemory();
    const service = new TranslationService(provider, memory);
    const options = { sourceLanguage: 'en' as const, targetLanguage: 'vi' as const };
    await service.translateTexts(['Save'], options);
    await service.translateTexts(['Save'], options);
    expect(provider.translate).toHaveBeenCalledOnce();
  });

  it('does not cache invalid placeholder results', async () => {
    const provider = createProvider();
    provider.translate = vi.fn(async (request: TranslationRequest) => ({
      provider: 'test',
      items: request.items.map((item) => ({ id: item.id, text: 'placeholder removed' })),
    }));
    const memory = new InMemoryTranslationMemory();
    const service = new TranslationService(provider, memory);
    await expect(
      service.translateTexts(['Hello {name}'], { sourceLanguage: 'en', targetLanguage: 'vi' }),
    ).rejects.toThrow(/placeholder/);
    await expect(
      memory.get({ sourceText: 'Hello {name}', sourceLanguage: 'en', targetLanguage: 'vi' }),
    ).resolves.toBeUndefined();
  });
});
