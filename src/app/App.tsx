import { useCallback, useEffect, useMemo, useState } from 'react';
import { Braces, Captions, Clipboard, Clock3, Languages, Settings, Zap } from 'lucide-react';
import { ClipboardPage } from '../features/clipboard/ClipboardPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { I18nPage } from '../features/i18n/I18nPage';
import { QuickTranslatePage } from '../features/quick-translate/QuickTranslatePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SubtitlePage } from '../features/subtitle/SubtitlePage';
import { addHistory, clearHistory, loadHistory, type HistoryEntry } from '../storage/history';
import { loadSettings, saveSettings, type AppSettings } from '../storage/settings';
import { createTranslationMemory } from '../storage/translationMemory';
import { TranslationService } from '../translation/core/translationService';
import { DemoTranslationProvider } from '../translation/providers/demoProvider';
import { OpenAiCompatibleProvider } from '../translation/providers/openAiCompatibleProvider';
import type { TranslateFunction } from '../types/app';

type Page = 'quick' | 'clipboard' | 'subtitle' | 'i18n' | 'history' | 'settings';

const NAVIGATION = [
  { id: 'quick' as const, label: 'Quick Translate', icon: Languages },
  { id: 'clipboard' as const, label: 'Clipboard', icon: Clipboard },
  { id: 'subtitle' as const, label: 'Subtitles', icon: Captions },
  { id: 'i18n' as const, label: 'i18n Files', icon: Braces },
];

export function App() {
  const [page, setPage] = useState<Page>('quick');
  const [settings, setSettings] = useState(loadSettings);
  const [apiKey, setApiKey] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [shortcutTrigger, setShortcutTrigger] = useState(0);
  const [quickDraft, setQuickDraft] = useState<{ source: string; translated: string }>();
  const memory = useMemo(createTranslationMemory, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    const dark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [settings.theme]);

  const provider = useMemo(
    () =>
      settings.provider === 'openai-compatible'
        ? new OpenAiCompatibleProvider({ apiKey, baseUrl: settings.baseUrl, model: settings.model })
        : new DemoTranslationProvider(),
    [apiKey, settings.baseUrl, settings.model, settings.provider],
  );

  const translate: TranslateFunction = useCallback(
    async (texts, overrides = {}) => {
      if (settings.provider === 'openai-compatible' && !apiKey.trim()) {
        throw new Error('Add an API key in Settings before using this provider.');
      }
      const service = new TranslationService(provider, memory);
      const result = await service.translateTexts(texts, {
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        mode: settings.mode,
        glossary: settings.glossary,
        ...overrides,
      });
      if (texts.length === 1 && texts[0].trim() && result[0]) {
        setHistory(
          addHistory({
            source: texts[0],
            translated: result[0],
            sourceLanguage: settings.sourceLanguage,
            targetLanguage: settings.targetLanguage,
          }),
        );
      }
      return result;
    },
    [apiKey, memory, provider, settings],
  );

  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    let disposed = false;
    void import('@tauri-apps/plugin-global-shortcut').then(async ({ register, unregister }) => {
      try {
        await register(settings.shortcut, (event) => {
          if (event.state === 'Pressed') {
            setPage('clipboard');
            setShortcutTrigger((value) => value + 1);
          }
        });
      } catch (error) {
        console.warn('Could not register global shortcut:', error);
      }
      if (disposed) await unregister(settings.shortcut);
    });
    return () => {
      disposed = true;
      void import('@tauri-apps/plugin-global-shortcut').then(({ unregister }) =>
        unregister(settings.shortcut),
      );
    };
  }, [settings.shortcut]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage('quick')}>
          <span className="brand-mark">
            <Zap size={19} fill="currentColor" />
          </span>
          <span>
            Translaty<small>Translation toolbox</small>
          </span>
        </button>
        <nav aria-label="Main navigation">
          <p>Workspace</p>
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => setPage(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          <p>Library</p>
          <button className={page === 'history' ? 'active' : ''} onClick={() => setPage('history')}>
            <Clock3 size={18} />
            <span>History</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className={page === 'settings' ? 'active' : ''}
            onClick={() => setPage('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <div className="privacy-badge">
            <span />
            <div>
              <strong>Local first</strong>
              <small>No telemetry</small>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {page === 'quick' && (
          <QuickTranslatePage
            settings={settings}
            updateSettings={updateSettings}
            translate={translate}
            draft={quickDraft}
          />
        )}
        {page === 'clipboard' && (
          <ClipboardPage
            translate={translate}
            shortcut={settings.shortcut}
            trigger={shortcutTrigger}
            onOpenQuick={(source, translated) => {
              setQuickDraft({ source, translated });
              setPage('quick');
            }}
          />
        )}
        {page === 'subtitle' && <SubtitlePage translate={translate} />}
        {page === 'i18n' && <I18nPage translate={translate} />}
        {page === 'history' && (
          <HistoryPage
            entries={history}
            onClear={() => {
              clearHistory();
              setHistory([]);
            }}
          />
        )}
        {page === 'settings' && (
          <SettingsPage
            settings={settings}
            updateSettings={updateSettings}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </main>
    </div>
  );
}
