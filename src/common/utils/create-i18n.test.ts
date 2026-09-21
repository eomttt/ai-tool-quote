import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppI18n } from './create-i18n';
import ko from '../locales/ui.ko.json';
import en from '../locales/ui.en.json';

afterEach(() => vi.unstubAllGlobals());

describe('browser language selection', () => {
  it.each([
    [['ko-KR', 'en-US'], 'ko'],
    [['en-GB', 'ko-KR'], 'en'],
    [['fr-FR', 'ko-KR'], 'ko'],
    [['ja-JP'], 'en'],
    [[], 'en'],
  ])('chooses a supported language from %j', (languages, expected) => {
    vi.stubGlobal('navigator', { languages });
    const instance = createAppI18n();
    expect(instance.isInitialized).toBe(true);
    expect(instance.resolvedLanguage).toBe(expected);
  });

  it('uses browser preferences instead of cached, URL, or HTML language settings', () => {
    vi.stubGlobal('navigator', { languages: ['en-US'] });
    vi.stubGlobal('localStorage', { getItem: () => 'ko', setItem: vi.fn() });
    vi.stubGlobal('document', { cookie: 'i18next=ko', documentElement: { lang: 'ko' } });
    vi.stubGlobal('window', { location: { search: '?lng=ko', hash: '#lng=ko' } });
    expect(createAppI18n().resolvedLanguage).toBe('en');
  });

  it('detects changed browser preferences when detection runs again', async () => {
    vi.stubGlobal('navigator', { languages: ['en-US'] });
    const instance = createAppI18n();
    vi.stubGlobal('navigator', { languages: ['ko-KR'] });
    await instance.changeLanguage();
    expect(instance.resolvedLanguage).toBe('ko');
  });

  it('keeps UI translation keys and interpolation parameters aligned', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort());
    for (const [key, value] of Object.entries(ko)) {
      const translation = Object.entries(en).find(([englishKey]) => englishKey === key)?.[1];
      expect(translation).toBeTruthy();
      expect(translation?.match(/{{\w+}}/g)?.sort() ?? []).toEqual(
        value.match(/{{\w+}}/g)?.sort() ?? [],
      );
    }
  });
});
