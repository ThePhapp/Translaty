import { useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Plus, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import type { AppSettings } from '../../storage/settings';
import type { GlossaryEntry } from '../../types/translation';

interface Props {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
}

function parseGlossary(content: string, filename: string): GlossaryEntry[] {
  if (filename.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(content) as Record<string, string> | GlossaryEntry[];
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry.source && entry.target)
      : Object.entries(parsed).map(([source, target]) => ({ source, target }));
  }
  return content
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [source, ...target] = line.split(',');
      return { source: source?.trim(), target: target.join(',').trim() };
    })
    .filter((entry): entry is GlossaryEntry => Boolean(entry.source && entry.target));
}

export function SettingsPage({ settings, updateSettings, apiKey, setApiKey }: Props) {
  const [showKey, setShowKey] = useState(false);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const addTerm = () => {
    if (!source.trim() || !target.trim()) return;
    updateSettings({
      glossary: [...settings.glossary, { source: source.trim(), target: target.trim() }],
    });
    setSource('');
    setTarget('');
  };

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Choose how Translaty connects, remembers, and protects your translation workflow."
      />
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-heading">
            <KeyRound size={19} />
            <div>
              <h2>Translation provider</h2>
              <p>Use the offline demo or your OpenAI-compatible endpoint.</p>
            </div>
          </div>
          <label className="field">
            <span>Provider</span>
            <select
              value={settings.provider}
              onChange={(event) =>
                updateSettings({ provider: event.target.value as AppSettings['provider'] })
              }
            >
              <option value="demo">Local demo (offline)</option>
              <option value="openai-compatible">OpenAI compatible</option>
            </select>
          </label>
          {settings.provider === 'openai-compatible' && (
            <>
              <label className="field">
                <span>Base URL</span>
                <input
                  value={settings.baseUrl}
                  onChange={(event) => updateSettings({ baseUrl: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Model</span>
                <input
                  value={settings.model}
                  onChange={(event) => updateSettings({ model: event.target.value })}
                />
              </label>
              <label className="field">
                <span>
                  API key <em>session only</em>
                </span>
                <div className="secret-input">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-…"
                  />
                  <button onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <div className="privacy-callout">
                <ShieldCheck size={17} />
                <span>
                  The key stays in memory and is cleared when Translaty closes. It is never written
                  to local storage.
                </span>
              </div>
            </>
          )}
        </section>
        <section className="settings-card">
          <div className="settings-heading">
            <Save size={19} />
            <div>
              <h2>Desktop behavior</h2>
              <p>Preferences are saved locally on this device.</p>
            </div>
          </div>
          <label className="field">
            <span>Global shortcut</span>
            <input
              value={settings.shortcut}
              onChange={(event) => updateSettings({ shortcut: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Theme</span>
            <select
              value={settings.theme}
              onChange={(event) =>
                updateSettings({ theme: event.target.value as AppSettings['theme'] })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <p className="setting-note">
            Translation memory is stored in a local SQLite database in the desktop build. Browser
            preview uses memory for the current session.
          </p>
        </section>
        <section className="settings-card glossary-card">
          <div className="settings-heading">
            <Upload size={19} />
            <div>
              <h2>Glossary</h2>
              <p>Only matching terms are sent with each provider batch.</p>
            </div>
          </div>
          <div className="glossary-entry">
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Source term"
            />
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Preferred translation"
            />
            <button className="primary-button" onClick={addTerm}>
              <Plus size={16} /> Add
            </button>
          </div>
          <input
            ref={importRef}
            hidden
            type="file"
            accept=".json,.csv"
            onChange={async (event) => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              const entries = parseGlossary(await selected.text(), selected.name);
              updateSettings({ glossary: [...settings.glossary, ...entries] });
            }}
          />
          <div className="glossary-toolbar">
            <span>{settings.glossary.length} terms</span>
            <button className="text-button" onClick={() => importRef.current?.click()}>
              <Upload size={15} /> Import JSON / CSV
            </button>
          </div>
          <div className="glossary-list">
            {settings.glossary.length ? (
              settings.glossary.map((entry, index) => (
                <div key={`${entry.source}-${index}`}>
                  <span>{entry.source}</span>
                  <span>→</span>
                  <span>{entry.target}</span>
                  <button
                    title="Delete term"
                    onClick={() =>
                      updateSettings({
                        glossary: settings.glossary.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p>No terms yet. Add terminology that must stay consistent.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
