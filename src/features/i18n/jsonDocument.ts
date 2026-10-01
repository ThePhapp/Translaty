export interface JsonStringEntry {
  id: string;
  path: Array<string | number>;
  value: string;
}

export interface JsonTranslationDocument {
  source: unknown;
  entries: JsonStringEntry[];
  indentation: string | number;
}

function collectStrings(
  value: unknown,
  path: Array<string | number>,
  entries: JsonStringEntry[],
): void {
  if (typeof value === 'string') {
    entries.push({ id: `value-${entries.length}`, path, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => collectStrings(child, [...path, index], entries));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => collectStrings(child, [...path, key], entries));
  }
}

export function parseJsonDocument(content: string): JsonTranslationDocument {
  let source: unknown;
  try {
    source = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'parse failed'}`);
  }
  const entries: JsonStringEntry[] = [];
  collectStrings(source, [], entries);
  const indentation = /^([ \t]+)\S/m.exec(content)?.[1] ?? 2;
  return { source, entries, indentation };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function applyJsonTranslations(
  document: JsonTranslationDocument,
  translations: string[],
): string {
  if (translations.length !== document.entries.length) {
    throw new Error('Translated value count does not match the JSON document.');
  }
  const output = cloneJson(document.source);
  document.entries.forEach((entry, entryIndex) => {
    let cursor = output as Record<string | number, unknown>;
    entry.path.slice(0, -1).forEach((segment) => {
      cursor = cursor[segment] as Record<string | number, unknown>;
    });
    cursor[entry.path.at(-1)!] = translations[entryIndex];
  });
  return `${JSON.stringify(output, null, document.indentation)}\n`;
}

export function displayJsonPath(path: Array<string | number>): string {
  return path
    .map((part, index) =>
      typeof part === 'number' ? `[${part}]` : `${index === 0 ? '' : '.'}${part}`,
    )
    .join('');
}
