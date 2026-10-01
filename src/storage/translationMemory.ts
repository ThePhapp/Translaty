import type { LanguageCode } from '../types/translation';
import { normalizeForMemory } from '../translation/batching/batches';

export interface MemoryQuery {
  sourceText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: Exclude<LanguageCode, 'auto'>;
}

export interface MemoryRecord extends MemoryQuery {
  translatedText: string;
  provider: string;
}

export interface TranslationMemory {
  get(query: MemoryQuery): Promise<MemoryRecord | undefined>;
  put(record: MemoryRecord): Promise<void>;
}

function memoryKey(query: MemoryQuery): string {
  return `${query.sourceLanguage}\u0000${query.targetLanguage}\u0000${normalizeForMemory(query.sourceText)}`;
}

export class InMemoryTranslationMemory implements TranslationMemory {
  private readonly records = new Map<string, MemoryRecord>();

  async get(query: MemoryQuery): Promise<MemoryRecord | undefined> {
    const record = this.records.get(memoryKey(query));
    return record?.provider === 'demo' ? undefined : record;
  }

  async put(record: MemoryRecord): Promise<void> {
    this.records.set(memoryKey(record), record);
  }
}

export class SqliteTranslationMemory implements TranslationMemory {
  private databasePromise?: Promise<import('@tauri-apps/plugin-sql').default>;

  private async database() {
    this.databasePromise ??= import('@tauri-apps/plugin-sql').then(
      async ({ default: Database }) => {
        const db = await Database.load('sqlite:translaty.db');
        await db.execute(`CREATE TABLE IF NOT EXISTS translation_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_text TEXT NOT NULL,
        normalized_source TEXT NOT NULL,
        source_lang TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        provider TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(normalized_source, source_lang, target_lang)
      )`);
        return db;
      },
    );
    return this.databasePromise;
  }

  async get(query: MemoryQuery): Promise<MemoryRecord | undefined> {
    const db = await this.database();
    const rows = await db.select<Array<{ translated_text: string; provider: string }>>(
      `SELECT translated_text, provider FROM translation_memory
       WHERE normalized_source = $1 AND source_lang = $2 AND target_lang = $3
         AND provider <> 'demo' LIMIT 1`,
      [normalizeForMemory(query.sourceText), query.sourceLanguage, query.targetLanguage],
    );
    const row = rows[0];
    return row
      ? { ...query, translatedText: row.translated_text, provider: row.provider }
      : undefined;
  }

  async put(record: MemoryRecord): Promise<void> {
    const db = await this.database();
    await db.execute(
      `INSERT INTO translation_memory
        (source_text, normalized_source, source_lang, target_lang, translated_text, provider)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(normalized_source, source_lang, target_lang) DO UPDATE SET
        source_text = excluded.source_text,
        translated_text = excluded.translated_text,
        provider = excluded.provider,
        updated_at = CURRENT_TIMESTAMP`,
      [
        record.sourceText,
        normalizeForMemory(record.sourceText),
        record.sourceLanguage,
        record.targetLanguage,
        record.translatedText,
        record.provider,
      ],
    );
  }
}

export function createTranslationMemory(): TranslationMemory {
  return '__TAURI_INTERNALS__' in window
    ? new SqliteTranslationMemory()
    : new InMemoryTranslationMemory();
}
