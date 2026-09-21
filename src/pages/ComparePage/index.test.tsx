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
  expect(english.replaceAll('한국어', '')).not.toMatch(/[가-힣]/);
  expect(english).toContain('28 tools');
  expect(english).toContain('Describe what you want to do');
  expect(english).toContain('How do we compare prices?');
  await instance.changeLanguage('ko');
  const korean = renderToStaticMarkup(
    <I18nextProvider i18n={instance}>
      <ComparePage />
    </I18nextProvider>,
  );
  expect(korean).toContain('어떤 걸 해보고 싶으세요?');
  expect(korean).toContain('나 이런 걸로 쇼츠 만들어서 유튜브에 올려보고 싶어');
  expect(korean).not.toContain('장면·이미지 생성');
  expect(english).toContain('I want to make Shorts and upload them to YouTube');
  expect(english).toContain('Find tools');
  expect(korean).toContain('28개 도구');
});
