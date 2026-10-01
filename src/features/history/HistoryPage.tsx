import { Clock3, Copy, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import type { HistoryEntry } from '../../storage/history';
import { copyText } from '../../utils/download';

export function HistoryPage({
  entries,
  onClear,
}: {
  entries: HistoryEntry[];
  onClear: () => void;
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Local activity"
        title="Translation History"
        description="Recent quick and clipboard translations saved only on this device."
        actions={
          entries.length ? (
            <button className="secondary-button danger" onClick={onClear}>
              <Trash2 size={16} /> Clear history
            </button>
          ) : undefined
        }
      />
      {entries.length ? (
        <div className="history-list">
          {entries.map((entry) => (
            <article key={entry.id} className="history-card">
              <div className="history-meta">
                <span>
                  {entry.sourceLanguage.toUpperCase()} → {entry.targetLanguage.toUpperCase()}
                </span>
                <time>
                  <Clock3 size={14} /> {new Date(entry.createdAt).toLocaleString()}
                </time>
              </div>
              <div className="history-text">
                <p>{entry.source}</p>
                <p>{entry.translated}</p>
              </div>
              <button
                className="icon-button"
                title="Copy translation"
                onClick={() => void copyText(entry.translated)}
              >
                <Copy size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Clock3 size={30} />
          <h2>No translations yet</h2>
          <p>Quick and clipboard translations will appear here.</p>
        </div>
      )}
    </div>
  );
}
