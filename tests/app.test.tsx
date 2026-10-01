import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false }),
  });
});

describe('App', () => {
  it('renders the quick workspace and navigates between feature pages', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Quick Translate' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Subtitles/i }));
    expect(screen.getByRole('heading', { name: 'Subtitle Translator' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /i18n Files/i }));
    expect(screen.getByRole('heading', { name: 'i18n File Translator' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });
});
