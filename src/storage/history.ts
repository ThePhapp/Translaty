export interface HistoryEntry {
  id: string;
  source: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
}

const HISTORY_KEY = 'translaty.history.v1';
const MAX_ENTRIES = 30;

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry[] {
  const next = [
    { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...loadHistory(),
  ].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
