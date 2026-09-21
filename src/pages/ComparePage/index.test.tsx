import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { createAppI18n } from '../../common/utils/create-i18n';
import { ComparePage } from './index';

it('renders navigation, filters, price guide, and accessibility text in each language', async () => {
  const instance = createAppI18n();
  await instance.changeLanguage('en');
  const english = renderToStaticMarkup(
    <I18nextProvider i18n={instance}>
      <ComparePage />
    </I18nextProvider>,
  );
  expect(english).not.toMatch(/[가-힣]/);
  expect(english).toContain('28 tools');
  expect(english).toContain('Search AI tools');
  expect(english).toContain('How do we compare prices?');
  await instance.changeLanguage('ko');
  const korean = renderToStaticMarkup(
    <I18nextProvider i18n={instance}>
      <ComparePage />
    </I18nextProvider>,
  );
  expect(korean).toContain('어떤 작업을 시작할까요?');
  expect(korean).toContain('28개 도구');
});
