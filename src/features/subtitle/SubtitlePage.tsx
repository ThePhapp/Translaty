import { useRef, useState } from 'react';
import { Download, FileVideo2, Languages, UploadCloud, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import type { TranslateFunction } from '../../types/app';
import { downloadText } from '../../utils/download';
import {
  formatFromFilename,
  parseSubtitle,
  serializeSubtitle,
  type SubtitleDocument,
} from './subtitleParser';

interface LoadedSubtitle {
  name: string;
  size: number;
  document: SubtitleDocument;
}

export function SubtitlePage({ translate }: { translate: TranslateFunction }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const [file, setFile] = useState<LoadedSubtitle>();
  const [translated, setTranslated] = useState<string[]>();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const loadFile = async (selected: File) => {
    setError('');
    try {
      const format = formatFromFilename(selected.name);
      const document = parseSubtitle(await selected.text(), format);
      setFile({ name: selected.name, size: selected.size, document });
      setTranslated(undefined);
      setProgress(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open this subtitle.');
    }
  };

  const run = async () => {
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    setError('');
    try {
      const result = await translate(
        file.document.cues.map((cue) => cue.text),
        {
          signal: controller.signal,
          onProgress: ({ completed, total }) => setProgress(total ? completed / total : 0),
        },
      );
      setTranslated(result);
      setProgress(1);
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : 'Subtitle translation failed.');
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="File workflow"
        title="Subtitle Translator"
        description="Translate dialogue while keeping every cue, timestamp, and metadata block intact."
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
          accept=".srt,.vtt"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) void loadFile(selected);
          }}
        />
        {file ? (
          <>
            <div className="file-icon">
              <FileVideo2 />
            </div>
            <div className="file-info">
              <strong>{file.name}</strong>
              <span>
                {file.document.cues.length} cues · {(file.size / 1024).toFixed(1)} KB ·{' '}
                {file.document.format.toUpperCase()}
              </span>
            </div>
            <button className="icon-button" title="Remove file" onClick={() => setFile(undefined)}>
              <X size={18} />
            </button>
          </>
        ) : (
          <button className="drop-button" onClick={() => inputRef.current?.click()}>
            <UploadCloud size={30} />
            <strong>Drop a subtitle here, or browse</strong>
            <span>SRT and WebVTT · timestamps never leave the app</span>
          </button>
        )}
      </section>

      {file && (
        <section className="workflow-card">
          <div className="workflow-header">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>Dialogue cues</h2>
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
                  onClick={() => {
                    const extension = file.document.format;
                    const base = file.name.replace(/\.(srt|vtt)$/i, '');
                    downloadText(
                      `${base}.translated.${extension}`,
                      serializeSubtitle(file.document, translated),
                    );
                  }}
                >
                  <Download size={16} /> Export
                </button>
              )}
              <button className="primary-button" disabled={isRunning} onClick={run}>
                <Languages size={16} /> {translated ? 'Translate again' : 'Translate all'}
              </button>
            </div>
          </div>
          {isRunning && (
            <div className="progress-track">
              <span style={{ width: `${Math.max(3, progress * 100)}%` }} />
            </div>
          )}
          <div className="preview-table">
            <div className="table-row table-head">
              <span>#</span>
              <span>Timing</span>
              <span>Source</span>
              <span>Translation</span>
            </div>
            {file.document.cues.slice(0, 50).map((cue, index) => (
              <div className="table-row" key={cue.id}>
                <span>{index + 1}</span>
                <span className="mono">{cue.timing}</span>
                <span>{cue.text}</span>
                <span className={!translated ? 'muted' : ''}>
                  {translated?.[index] ?? 'Waiting…'}
                </span>
              </div>
            ))}
          </div>
          {file.document.cues.length > 50 && (
            <p className="table-note">Showing the first 50 of {file.document.cues.length} cues.</p>
          )}
        </section>
      )}
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </div>
  );
}
