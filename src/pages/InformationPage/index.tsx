import { useTranslation } from 'react-i18next';
import type { PageData } from '../../common/models/model-page';
import { SiteFooter } from '../../common/components/SiteFooter';
import { pagePath } from '../../common/utils/page-route';

export function InformationPage({ page }: { page: PageData }) {
  const { t } = useTranslation();
  return (
    <>
      <header className="site-header" id="top">
        <div className="header-inner">
          <a className="brand" href={pagePath(page.language)}>
            <span className="brand-mark">t.</span>
            {t('brand')}
          </a>
          <a href={pagePath(page.language)}>{t('nav.browse')}</a>
        </div>
      </header>
      <main className="information-page content-width">
        {page.kind === 'about' ? (
          <>
            <h1>{t('about.title')}</h1>
            <p>{t('about.description')}</p>
            <h2>{t('about.sourcesTitle')}</h2>
            <p>{t('about.sources')}</p>
            <h2>{t('about.comparisonTitle')}</h2>
            <p>{t('about.comparison')}</p>
            <h2>{t('about.revenueTitle')}</h2>
            <p>{t(page.adsEnabled ? 'about.revenueEnabled' : 'about.revenueDisabled')}</p>
          </>
        ) : page.kind === 'privacy' ? (
          <>
            <h1>{t('privacy.title')}</h1>
            <p>{t('privacy.updated')}</p>
            <h2>{t('privacy.searchTitle')}</h2>
            <p>{t('privacy.search')}</p>
            <h2>{t('privacy.connectionTitle')}</h2>
            <p>{t('privacy.connection')}</p>
            <h2>{t('privacy.adsTitle')}</h2>
            <p>{t(page.adsEnabled ? 'privacy.adsEnabled' : 'privacy.adsDisabled')}</p>
            {page.adsEnabled ? (
              <>
                <p>{t('privacy.cookies')}</p>
                <p>
                  <a href="https://myadcenter.google.com/">{t('privacy.adSettings')}</a>
                  {' · '}
                  <a href="https://policies.google.com/technologies/partner-sites">
                    {t('privacy.googlePolicy')}
                  </a>
                  {' · '}
                  <a href="https://optout.aboutads.info/">{t('privacy.otherVendors')}</a>
                </p>
              </>
            ) : null}
            <h2>{t('privacy.linksTitle')}</h2>
            <p>{t('privacy.links')}</p>
          </>
        ) : (
          <>
            <h1>{t('notFound.title')}</h1>
            <p>{t('notFound.description')}</p>
            <a href={pagePath(page.language)}>{t('nav.browse')}</a>
          </>
        )}
        {page.kind !== 'not-found' ? (
          <section>
            <h2>{t('contact.title')}</h2>
            <p>{t('contact.description')}</p>
            {page.contactEmail ? (
              <a href={`mailto:${page.contactEmail}`}>{page.contactEmail}</a>
            ) : (
              <a href="https://github.com/eomttt">{t('contact.profile')}</a>
            )}
          </section>
        ) : null}
      </main>
      <SiteFooter year={page.year} kind={page.kind} />
    </>
  );
}
