import type { PageData } from '../common/models/model-page';
import { ComparePage } from '../pages/ComparePage';
import { InformationPage } from '../pages/InformationPage';

export function App({ page }: { page: PageData }) {
  return page.kind === 'catalog' ? (
    <ComparePage initialMedium={page.medium} year={page.year} />
  ) : (
    <InformationPage page={page} />
  );
}
