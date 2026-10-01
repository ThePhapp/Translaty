import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyMemoryProvider } from '../src/translation/providers/myMemoryProvider';

const baseRequest = {
  sourceLanguage: 'en' as const,
  targetLanguage: 'vi' as const,
  mode: 'natural' as const,
};

afterEach(() => vi.unstubAllGlobals());

describe('MyMemoryProvider', () => {
  it('returns real translations mapped to their input IDs', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const text = new URL(String(url)).searchParams.get('q');
      return new Response(
        JSON.stringify({
          responseStatus: 200,
          responseData: { translatedText: text === 'hi' ? 'xin chào' : 'cảm ơn' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await new MyMemoryProvider().translate({
      ...baseRequest,
      items: [
        { id: 'a', text: 'hi' },
        { id: 'b', text: 'thanks' },
      ],
    });

    expect(result.items).toEqual([
      { id: 'a', text: 'xin chào', detectedLanguage: undefined },
      { id: 'b', text: 'cảm ơn', detectedLanguage: undefined },
    ]);
  });

  it('retries autodetection with the detected source language when needed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            responseStatus: 200,
            responseData: { translatedText: 'hello', detectedLanguage: 'en' },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ responseStatus: 200, responseData: { translatedText: 'xin chào' } }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new MyMemoryProvider().translate({
      ...baseRequest,
      sourceLanguage: 'auto',
      items: [{ id: 'a', text: 'hello' }],
    });

    expect(result.items[0].text).toBe('xin chào');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('langpair=en%7Cvi');
  });

  it('rejects text beyond the provider limit with a clear message', async () => {
    await expect(
      new MyMemoryProvider().translate({
        ...baseRequest,
        items: [{ id: 'a', text: 'a'.repeat(501) }],
      }),
    ).rejects.toThrow(/500 bytes/);
  });
});
