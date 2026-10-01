import type { TranslationProvider, TranslationRequest } from '../../types/translation';

const VIETNAMESE: Record<string, string> = {
  hello: 'Xin chào',
  save: 'Lưu',
  cancel: 'Hủy',
  'thank you': 'Cảm ơn bạn',
  settings: 'Cài đặt',
  welcome: 'Chào mừng',
};

export class DemoTranslationProvider implements TranslationProvider {
  readonly id = 'demo';
  readonly name = 'Local demo';
  readonly supportsAutoDetect = true;

  async translate(request: TranslationRequest) {
    if (request.signal?.aborted) throw new DOMException('Translation cancelled', 'AbortError');
    await new Promise((resolve) => setTimeout(resolve, 180));
    return {
      provider: this.id,
      items: request.items.map((item) => {
        const key = item.text.trim().toLowerCase();
        const known = request.targetLanguage === 'vi' ? VIETNAMESE[key] : undefined;
        return {
          id: item.id,
          text: known ?? `[${request.targetLanguage.toUpperCase()}] ${item.text}`,
          detectedLanguage: request.sourceLanguage === 'auto' ? 'en' : request.sourceLanguage,
        };
      }),
    };
  }
}
