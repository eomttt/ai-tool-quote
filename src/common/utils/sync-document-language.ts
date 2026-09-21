import type { i18n } from 'i18next';

export function syncDocumentLanguage(instance: i18n, page: Document = document) {
  page.documentElement.lang = instance.resolvedLanguage ?? 'en';
  page.title = instance.t('meta.title');
  page
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', instance.t('meta.description'));
}
