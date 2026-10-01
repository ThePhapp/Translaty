export interface ProtectedText {
  text: string;
  placeholders: ReadonlyMap<string, string>;
}

const PLACEHOLDER_PATTERN =
  /\{\{[^{}]+\}\}|\$\{[^{}]+\}|\{(?:[^{}]+|\d+)\}|%(?:\d+\$)?[sdif]|<\/?[a-zA-Z][^>]*>|\\n|\r?\n/g;
const TOKEN_PATTERN = /__TRANSLATY_P\d+__/g;

export function protectPlaceholders(input: string): ProtectedText {
  const placeholders = new Map<string, string>();
  let index = 0;
  const text = input.replace(PLACEHOLDER_PATTERN, (placeholder) => {
    const token = `__TRANSLATY_P${index++}__`;
    placeholders.set(token, placeholder);
    return token;
  });
  return { text, placeholders };
}

export function restorePlaceholders(
  translatedText: string,
  placeholders: ReadonlyMap<string, string>,
): string {
  validatePlaceholders(translatedText, placeholders);
  let restored = translatedText;
  for (const [token, original] of placeholders) {
    restored = restored.replace(token, original);
  }
  return restored;
}

export function validatePlaceholders(
  translatedText: string,
  placeholders: ReadonlyMap<string, string>,
): void {
  const found: string[] = translatedText.match(TOKEN_PATTERN) ?? [];
  const expected = [...placeholders.keys()];
  if (found.length !== expected.length || expected.some((token) => !found.includes(token))) {
    throw new Error('Translation changed or removed one or more placeholders.');
  }
  if (found.some((token) => !placeholders.has(token))) {
    throw new Error('Translation introduced an unknown placeholder.');
  }
}
