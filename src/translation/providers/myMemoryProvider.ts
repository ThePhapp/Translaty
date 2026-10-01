import type {
  TranslatedItem,
  TranslationProvider,
  TranslationRequest,
} from '../../types/translation';

interface MyMemoryResponse {
  responseData?: { translatedText?: string; detectedLanguage?: string };
  responseStatus?: number | string;
  responseDetails?: string;
  quotaFinished?: boolean;
}

const API_URL = 'https://api.mymemory.translated.net/get';
const MAX_BYTES = 500;
const CONCURRENCY = 4;

function decodeEntities(value: string): string {
  const element = document.createElement('textarea');
  element.innerHTML = value;
  return element.value;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

export class MyMemoryProvider implements TranslationProvider {
  readonly id = 'mymemory';
  readonly name = 'MyMemory Free';
  readonly supportsAutoDetect = true;

  private async request(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    signal?: AbortSignal,
  ): Promise<{ text: string; detectedLanguage?: string }> {
    const parameters = new URLSearchParams({
      q: text,
      langpair: `${sourceLanguage}|${targetLanguage}`,
      mt: '1',
    });
    const response = await fetch(`${API_URL}?${parameters}`, { signal });
    if (!response.ok) throw new Error(`MyMemory request failed (${response.status}).`);

    const payload = (await response.json()) as MyMemoryResponse;
    const status = Number(payload.responseStatus ?? response.status);
    if (status !== 200 || !payload.responseData?.translatedText) {
      throw new Error(payload.responseDetails || 'MyMemory returned an invalid response.');
    }
    if (payload.quotaFinished) {
      throw new Error('MyMemory daily quota is exhausted. Choose another provider in Settings.');
    }
    return {
      text: decodeEntities(payload.responseData.translatedText),
      detectedLanguage: payload.responseData.detectedLanguage,
    };
  }

  private async translateItem(
    item: TranslationRequest['items'][number],
    request: TranslationRequest,
  ): Promise<TranslatedItem> {
    if (new TextEncoder().encode(item.text).length > MAX_BYTES) {
      throw new Error(
        'MyMemory accepts up to 500 bytes per text. Use the OpenAI-compatible provider for longer content.',
      );
    }
    const source = request.sourceLanguage === 'auto' ? 'autodetect' : request.sourceLanguage;
    let result = await this.request(item.text, source, request.targetLanguage, request.signal);

    if (
      request.sourceLanguage === 'auto' &&
      result.detectedLanguage &&
      result.detectedLanguage !== request.targetLanguage &&
      result.text.trim().toLocaleLowerCase() === item.text.trim().toLocaleLowerCase()
    ) {
      result = await this.request(
        item.text,
        result.detectedLanguage,
        request.targetLanguage,
        request.signal,
      );
    }
    return { id: item.id, text: result.text, detectedLanguage: result.detectedLanguage };
  }

  async translate(request: TranslationRequest) {
    const items = await mapWithConcurrency(request.items, CONCURRENCY, (item) =>
      this.translateItem(item, request),
    );
    return { provider: this.id, items };
  }
}
