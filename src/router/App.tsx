'use client';

import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { PageData } from '../common/models/model-page';
import { createAppI18n } from '../common/utils/create-i18n';
import { ComparePage } from '../app/_pages/ComparePage';
import { InformationPage } from '../app/_pages/InformationPage';

export function App({ page }: { page: PageData }) {
  const [i18n] = useState(() => createAppI18n(page.language));
  return (
    <I18nextProvider i18n={i18n}>
      {page.kind === 'catalog' ? (
        <ComparePage initialMedium={page.medium} year={page.year} />
      ) : (
        <InformationPage page={page} />
      )}
    </I18nextProvider>
  );
}
