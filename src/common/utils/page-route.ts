import type { Language, PageData } from '../models/model-page';

export function preferredLanguage(acceptLanguage: string): Language {
  const preferences = acceptLanguage
    .split(',')
    .map((value) => {
      const [tag = '', ...parameters] = value.trim().split(';');
      const weight = parameters.find((parameter) => parameter.trim().startsWith('q='));
      return {
        language: tag.toLowerCase().split('-')[0],
        quality: weight ? Number(weight.trim().slice(2)) : 1,
      };
    })
    .filter(({ quality }) => quality > 0 && quality <= 1)
    .toSorted((a, b) => b.quality - a.quality);
  for (const preference of preferences) {
    if (preference.language === 'ko' || preference.language === 'en') return preference.language;
  }
  return 'en';
}

export function resolvePage(pathname: string, acceptLanguage = '') {
  const match = pathname.match(/^\/(ko|en)(\/.*)?$/);
  const language: Language =
    match?.[1] === 'ko' ? 'ko' : match?.[1] === 'en' ? 'en' : preferredLanguage(acceptLanguage);
  const suffix = match ? (match[2] ?? '/') : pathname;
  const medium: PageData['medium'] = suffix === '/images' ? 'image' : 'video';
  const kind: PageData['kind'] =
    suffix === '/' || suffix === '/images'
      ? 'catalog'
      : suffix === '/about'
        ? 'about'
        : suffix === '/privacy'
          ? 'privacy'
          : 'not-found';
  return { language, medium, kind, suffix, hasLanguage: Boolean(match) };
}

export function pagePath(
  language: string,
  kind: PageData['kind'] = 'catalog',
  medium: PageData['medium'] = 'video',
) {
  const suffix = kind === 'catalog' ? (medium === 'image' ? '/images' : '/') : `/${kind}`;
  return `/${language === 'ko' ? 'ko' : 'en'}${suffix}`;
}
