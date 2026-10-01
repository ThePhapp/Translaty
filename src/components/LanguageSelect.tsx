import { LANGUAGES } from '../translation/core/languages';
import type { LanguageCode } from '../types/translation';

interface LanguageSelectProps {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  allowAuto?: boolean;
  label: string;
}

export function LanguageSelect({ value, onChange, allowAuto = true, label }: LanguageSelectProps) {
  return (
    <label className="language-select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as LanguageCode)}>
        {LANGUAGES.filter((language) => allowAuto || language.code !== 'auto').map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
