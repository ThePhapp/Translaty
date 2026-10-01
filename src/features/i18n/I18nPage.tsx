import { useRef, useState } from 'react';
import { Braces, Download, Languages, UploadCloud, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import type { TranslateFunction } from '../../types/app';
import { downloadText } from '../../utils/download';
import {
  applyJsonTranslations,
  displayJsonPath,
  parseJsonDocument,
  type JsonTranslationDocument,
} from './jsonDocument';

interface LoadedJson {
  name: string;
  size: number;
  document: JsonTranslationDocument;
}

export function I18nPage({ translate }: { translate: TranslateFunction }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const [file, setFile] = useState<LoadedJson>();
  const [translated, setTranslated] = useState<string[]>();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const loadFile = async (selected: File) => {
    setError('');
    if (!selected.name.toLowerCase().endsWith('.json')) {
      setError('Choose a JSON localization file.');
      return;
    }
    try {
      const document = parseJsonDocument(await selected.text());
      if (!document.entries.length)
        throw new Error('This JSON file has no translatable string values.');
      setFile({ name: selected.name, size: selected.size, document });
      setTranslated(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open this JSON file.');
    }
  };

  const run = async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setError('');
    setIsRunning(true);
    setProgress(0);
    try {
      const result = await translate(
        file.document.entries.map((entry) => entry.value),
        {
          signal: controller.signal,
          onProgress: ({ completed, total }) => setProgress(total ? completed / total : 0),
        },
      );
      setTranslated(result);
      setProgress(1);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : 'JSON translation failed.');
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Localization workflow"
        title="i18n File Translator"
        description="Translate JSON values in batches while keys, nesting, data types, and placeholders stay untouched."
      />
      <section
        className={`file-drop ${file ? 'has-file' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const selected = event.dataTransfer.files[0];
          if (selected) void loadFile(selected);
        }}
      >
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) void loadFile(selected);
          }}
        />
        {file ? (
          <>
            <div className="file-icon">
              <Braces />
            </div>
            <div className="file-info">
              <strong>{file.name}</strong>
              <span>
                {file.document.entries.length} strings · {(file.size / 1024).toFixed(1)} KB · JSON
              </span>
            </div>
            <button className="icon-button" title="Remove file" onClick={() => setFile(undefined)}>
              <X size={18} />
            </button>
          </>
        ) : (
          <button className="drop-button" onClick={() => inputRef.current?.click()}>
            <UploadCloud size={30} />
            <strong>Drop a localization file here, or browse</strong>
            <span>JSON · only string values are translated</span>
          </button>
        )}
      </section>
      {file && (
        <section className="workflow-card">
          <div className="workflow-header">
            <div>
              <p className="eyebrow">Review</p>
              <h2>String diff</h2>
            </div>
            <div className="workflow-actions">
              {isRunning && (
                <button className="secondary-button" onClick={() => abortRef.current?.abort()}>
                  Cancel
                </button>
              )}
              {translated && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    downloadText(
                      file.name.replace(/\.json$/i, '.translated.json'),
                      applyJsonTranslations(file.document, translated),
                      'application/json',
                    )
                  }
                >
                  <Download size={16} /> Export JSON
                </button>
              )}
              <button className="primary-button" disabled={isRunning} onClick={run}>
                <Languages size={16} /> {translated ? 'Translate again' : 'Translate values'}
              </button>
            </div>
          </div>
          {isRunning && (
            <div className="progress-track">
              <span style={{ width: `${Math.max(3, progress * 100)}%` }} />
            </div>
          )}
          <div className="preview-table json-table">
            <div className="table-row table-head">
              <span>Key path</span>
              <span>Source value</span>
              <span>Translation</span>
            </div>
            {file.document.entries.slice(0, 80).map((entry, index) => (
              <div className="table-row" key={entry.id}>
                <span className="mono path">{displayJsonPath(entry.path)}</span>
                <span>{entry.value}</span>
                <span className={!translated ? 'muted' : ''}>
                  {translated?.[index] ?? 'Waiting…'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </div>
  );
}
