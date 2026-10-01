import type {
  TranslationProvider,
  TranslationRequest,
  TranslatedItem,
} from '../../types/translation';
import { languageName } from '../core/languages';

interface ProviderOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAiCompatibleProvider implements TranslationProvider {
  readonly id = 'openai-compatible';
  readonly name = 'OpenAI compatible';
  readonly supportsAutoDetect = true;

  constructor(private readonly options: ProviderOptions) {}

  async translate(request: TranslationRequest) {
    const relevantGlossary = (request.glossary ?? []).filter((entry) =>
      request.items.some((item) =>
        item.text.toLocaleLowerCase().includes(entry.source.toLocaleLowerCase()),
      ),
    );
    const source =
      request.sourceLanguage === 'auto'
        ? 'the detected language'
        : languageName(request.sourceLanguage);
    const glossary = relevantGlossary.length
      ? ` Use terminology: ${relevantGlossary.map((entry) => `${entry.source}=${entry.target}`).join('; ')}.`
      : '';
    const instruction = `Translate from ${source} to ${languageName(request.targetLanguage)} in a ${request.mode} style. Preserve __TRANSLATY_Pn__ tokens exactly. Return only JSON: {"items":[{"id":"...","text":"..."}]}.${glossary}`;
    const baseUrl = (this.options.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: request.signal,
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.options.model ?? 'gpt-4.1-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: JSON.stringify(request.items) },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Provider request failed (${response.status}): ${body.slice(0, 180)}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('Provider returned an empty response.');
    const parsed = JSON.parse(content) as { items?: TranslatedItem[] };
    if (!Array.isArray(parsed.items)) throw new Error('Provider response has an invalid shape.');
    return { provider: this.id, items: parsed.items };
  }
}
