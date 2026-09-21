import { useTranslation } from 'react-i18next';
import { pagePath } from '../../utils/page-route';
import type { PageData } from '../../models/model-page';

export function SiteFooter({
  year,
  kind = 'catalog',
  medium = 'video',
}: {
  year: number;
  kind?: PageData['kind'];
  medium?: PageData['medium'];
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'en';
  return (
    <footer className="site-footer content-width">
      <span className="brand">
        {t('brand')}
        <span className="footer-dot">© {year}</span>
      </span>
      <nav className="footer-links" aria-label={t('footer.links')}>
        <a href={pagePath(language, 'about')}>{t('about.title')}</a>
        <a href={pagePath(language, 'privacy')}>{t('privacy.title')}</a>
        <a
          href={pagePath(language === 'ko' ? 'en' : 'ko', kind, medium)}
          lang={language === 'ko' ? 'en' : 'ko'}
        >
          {language === 'ko' ? 'English' : '한국어'}
        </a>
      </nav>
      <a href="#top">{t('footer.top')}</a>
    </footer>
  );
}
