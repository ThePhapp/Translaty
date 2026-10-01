import { useEffect, useState } from 'react';
import { Clipboard, ClipboardCheck, Copy, ExternalLink, Keyboard, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import type { TranslateFunction } from '../../types/app';
import { copyText } from '../../utils/download';

interface Props {
  translate: TranslateFunction;
  shortcut: string;
  trigger: number;
  onOpenQuick: (text: string, translation: string) => void;
}

async function readClipboardText(): Promise<string> {
  if ('__TAURI_INTERNALS__' in window) {
    const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
    return (await readText()) ?? '';
  }
  return navigator.clipboard.readText();
}

export function ClipboardPage({ translate, shortcut, trigger, onOpenQuick }: Props) {
  const [source, setSource] = useState('');
  const [translated, setTranslated] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready for clipboard text');

  const readAndTranslate = async () => {
    setError('');
    setIsLoading(true);
    setStatus('Reading clipboard…');
    try {
      const text = await readClipboardText();
      if (!text.trim()) throw new Error('The clipboard does not contain text.');
      setSource(text);
      setStatus('Translating…');
      const [result] = await translate([text]);
      setTranslated(result);
      setStatus('Translation ready');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not translate the clipboard.');
      setStatus('Ready for clipboard text');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trigger > 0) void readAndTranslate();
    // The trigger intentionally represents a desktop shortcut event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <div className="page clipboard-page">
      <PageHeader
        eyebrow="Desktop shortcut"
        title="Clipboard Translate"
        description="Copy text anywhere, use one shortcut, and act on the translation without losing context."
      />
      <div className="clipboard-layout">
        <section className="clipboard-instructions">
          <div className="shortcut-key">
            <Keyboard size={20} />
            <kbd>{shortcut.replace('CommandOrControl', 'Ctrl / ⌘')}</kbd>
          </div>
          <h2>Your fast translation loop</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Copy text in any app</strong>
                <p>Translaty reads text only when you ask.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Press the shortcut</strong>
                <p>The desktop build opens this compact workflow.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Copy or replace</strong>
                <p>Continue working with the translated text.</p>
              </div>
            </li>
          </ol>
          <button className="primary-button wide" disabled={isLoading} onClick={readAndTranslate}>
            <Clipboard size={17} /> {isLoading ? 'Working…' : 'Read clipboard now'}
          </button>
          {!('__TAURI_INTERNALS__' in window) && (
            <p className="browser-note">
              Browser preview may ask for clipboard permission. The global shortcut is available in
              the Tauri desktop build.
            </p>
          )}
        </section>
        <section className="floating-preview">
          <div className="floating-title">
            <div className="brand-mark small">T</div>
            <div>
              <strong>Translaty</strong>
              <span>{status}</span>
            </div>
            <span className={`status-dot ${isLoading ? 'busy' : ''}`} />
          </div>
          <div className="floating-body">
            <label>Clipboard</label>
            <p className={!source ? 'muted' : ''}>
              {source || 'Your copied text will appear here.'}
            </p>
            <div className="floating-separator">
              <Sparkles size={14} />
            </div>
            <label>Translation</label>
            <p className={!translated ? 'muted' : ''}>
              {translated || 'Translation will appear here.'}
            </p>
          </div>
          <div className="floating-actions">
            <button disabled={!translated} onClick={() => void copyText(translated)}>
              <Copy size={15} /> Copy
            </button>
            <button
              disabled={!translated}
              onClick={async () => {
                await copyText(translated);
                setStatus('Clipboard replaced');
              }}
            >
              <ClipboardCheck size={15} /> Replace
            </button>
            <button disabled={!translated} onClick={() => onOpenQuick(source, translated)}>
              <ExternalLink size={15} /> Full app
            </button>
          </div>
        </section>
      </div>
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </div>
  );
}
