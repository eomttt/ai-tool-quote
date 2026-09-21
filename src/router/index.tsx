import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { ComparePage } from '../pages/ComparePage';
import { i18n } from '../common/utils/create-i18n';
import { syncDocumentLanguage } from '../common/utils/sync-document-language';
import '../common/styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('앱을 표시할 영역이 없습니다.');

const updateDocument = () => syncDocumentLanguage(i18n);
const detectBrowserLanguage = () => {
  void i18n.changeLanguage();
};
updateDocument();
i18n.on('languageChanged', updateDocument);
window.addEventListener('languagechange', detectBrowserLanguage);
import.meta.hot?.dispose(() => {
  i18n.off('languageChanged', updateDocument);
  window.removeEventListener('languagechange', detectBrowserLanguage);
});

createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <ComparePage />
    </I18nextProvider>
  </StrictMode>,
);
