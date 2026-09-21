import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { createAppI18n } from '../common/utils/create-i18n';
import { pageDataSchema } from '../common/models/model-page';
import { App } from './App';
import '../common/styles/global.css';

const root = document.getElementById('root');
const serializedPage = document.getElementById('page-data')?.textContent;
if (!root || !serializedPage) throw new Error('서버가 제공한 페이지 정보가 없습니다.');
const page = pageDataSchema.parse(JSON.parse(serializedPage));
const i18n = createAppI18n(page.language);

const detectBrowserLanguage = () => {
  if (!/^\/(ko|en)(\/|$)/.test(window.location.pathname)) window.location.reload();
};
window.addEventListener('languagechange', detectBrowserLanguage);
import.meta.hot?.dispose(() => {
  window.removeEventListener('languagechange', detectBrowserLanguage);
});

hydrateRoot(
  root,
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App page={page} />
    </I18nextProvider>
  </StrictMode>,
);
