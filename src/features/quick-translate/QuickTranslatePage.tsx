import { useEffect, useState } from 'react';
import { ArrowRightLeft, Copy, Eraser, Sparkles } from 'lucide-react';
import { LanguageSelect } from '../../components/LanguageSelect';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { copyText } from '../../utils/download';
import type { TranslateFunction } from '../../types/app';
import type { AppSettings } from '../../storage/settings';
import type { TranslationMode } from '../../types/translation';

interface Props {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  translate: TranslateFunction;
  draft?: { source: string; translated: string };
}

const MODES: Array<{ value: TranslationMode; label: string }> = [
  { value: 'natural', label: 'Natural' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
];

export function QuickTranslatePage({ settings, updateSettings, translate, draft }: Props) {
  const [source, setSource] = useState('');
  const [translated, setTranslated] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (draft) {
      setSource(draft.source);
      setTranslated(draft.translated);
    }
  }, [draft]);

  const runTranslation = async () => {
    if (!source.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const [result] = await translate([source]);
      setTranslated(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Translation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const swap = () => {
    if (settings.sourceLanguage === 'auto') {
      updateSettings({ sourceLanguage: settings.targetLanguage, targetLanguage: 'en' });
    } else {
      updateSettings({
        sourceLanguage: settings.targetLanguage,
        targetLanguage: settings.sourceLanguage,
      });
    }
    setSource(translated);
    setTranslated(source);
  };

  return (
    <div className="page quick-page">
      <PageHeader
        eyebrow="Everyday translation"
        title="Quick Translate"
        description="Translate a thought, message, or technical passage without breaking your flow."
        actions={
          <span className="provider-pill">
            <span />
            {settings.provider === 'demo' ? 'Local demo' : settings.model}
          </span>
        }
      />

      <section className="translate-card">
        <div className="translation-toolbar">
          <LanguageSelect
            label="Source language"
            value={settings.sourceLanguage}
            onChange={(sourceLanguage) => updateSettings({ sourceLanguage })}
          />
          <button className="icon-button" title="Swap languages" onClick={swap}>
            <ArrowRightLeft size={17} />
          </button>
          <LanguageSelect
            label="Target language"
            allowAuto={false}
            value={settings.targetLanguage}
            onChange={(targetLanguage) =>
              updateSettings({ targetLanguage: targetLanguage === 'auto' ? 'vi' : targetLanguage })
            }
          />
          <div className="mode-tabs" aria-label="Translation tone">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                className={settings.mode === mode.value ? 'active' : ''}
                onClick={() => updateSettings({ mode: mode.value })}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="translation-panels">
          <div className="text-panel source-panel">
            <div className="panel-label">
              <span>Source</span>
              <span>{source.length.toLocaleString()} characters</span>
            </div>
            <textarea
              autoFocus
              value={source}
              onChange={(event) => setSource(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter')
                  void runTranslation();
              }}
              placeholder="Type or paste text here…"
            />
            <button
              className="panel-action"
              disabled={!source}
              onClick={() => {
                setSource('');
                setTranslated('');
                setError('');
              }}
            >
              <Eraser size={16} /> Clear
            </button>
          </div>
          <div className="panel-divider" />
          <div className="text-panel output-panel">
            <div className="panel-label">
              <span>Translation</span>
              <span>{translated.length.toLocaleString()} characters</span>
            </div>
            <div className={`translation-output ${!translated ? 'empty' : ''}`}>
              {translated || 'Your translation will appear here.'}
            </div>
            <button
              className="panel-action"
              disabled={!translated}
              onClick={async () => {
                await copyText(translated);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Copy size={16} /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <footer className="translate-footer">
          <span>Press Ctrl/⌘ + Enter to translate</span>
          <button
            className="primary-button"
            disabled={!source.trim() || isLoading}
            onClick={runTranslation}
          >
            <Sparkles size={17} /> {isLoading ? 'Translating…' : 'Translate'}
          </button>
        </footer>
      </section>
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </div>
  );
}
