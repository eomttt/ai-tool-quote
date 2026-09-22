import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { createAppI18n } from '../../../../common/utils/create-i18n';
import { workflows } from '../../data/workflows';
import { WorkflowJourney } from './index';

it('renders a localized, navigable workflow with tool recommendations and source links', () => {
  const workflow = workflows[0];
  if (!workflow) throw new Error('A workflow is required.');
  const render = (language: string) =>
    renderToStaticMarkup(
      <I18nextProvider i18n={createAppI18n(language)}>
        <WorkflowJourney
          workflow={workflow}
          query="Shorts Reels"
          billing="monthly"
          onSelectTool={() => {}}
        />
      </I18nextProvider>,
    );
  const english = render('en');
  const korean = render('ko');
  expect(english).not.toMatch(/[가-힣]/);
  expect(english).toContain('Runway');
  expect(english).toContain('Higgsfield');
  expect(english).toContain('Carry it forward');
  expect(english).toContain('https://help.runwayml.com/');
  expect(english).toContain('role="tablist"');
  expect(korean).toContain('반응 확인하기');
  expect(korean).toContain('이 단계가 끝나면');
  expect(korean).not.toContain('내용 정하기');
});
