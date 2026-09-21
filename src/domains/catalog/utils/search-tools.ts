import { scenarios } from '../data/scenarios';
import type { Medium, Tool } from '../models/model-tool';

const intentWords = new Set([
  '내',
  '제',
  '나',
  '저',
  '나는',
  '저는',
  '제가',
  '좀',
  '을',
  '를',
  '하고',
  '하고싶어',
  '하고싶어요',
  '싶어',
  '싶어요',
  '싶다',
  '싶은데',
  '만들기',
  '만들고',
  '만드는',
  '만들고싶어',
  '만들고싶어요',
  '만들어',
  '만들어줘',
  '만들어주세요',
  '만들',
  '수',
  '있는',
  '추천',
  '해줘',
  '해주세요',
  'i',
  'my',
  'a',
  'an',
  'the',
  'to',
  'want',
  'would',
  'like',
  'make',
  'create',
  'please',
  'can',
  'you',
  'help',
  'me',
  'with',
  'for',
]);

function normalizeSearch(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function toolSearchText(tool: Tool, medium: Medium) {
  return [
    tool.name,
    tool.description,
    tool.bestFor,
    ...tool.features,
    ...tool.tags,
    ...(tool.mediaFeatures?.[medium] ?? []),
    ...(tool.mediaTags?.[medium] ?? []),
    ...(tool.aliases ?? []),
  ].join(' ');
}

export function matchesToolSearch(tool: Tool, medium: Medium, query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const searchText = toolSearchText(tool, medium);
  const toolScenarios = scenarios.filter(
    (item) => item.medium === medium && item.toolIds.includes(tool.id),
  );
  const documents = [
    searchText,
    ...toolScenarios.map((item) => `${searchText} ${item.label} ${item.keywords.join(' ')}`),
  ].map((text) => normalizeSearch(text).replaceAll(' ', ''));
  const compactQuery = normalizedQuery.replaceAll(' ', '');
  if (documents.some((document) => document.includes(compactQuery))) return true;

  const terms = normalizedQuery.split(' ').filter((term) => !intentWords.has(term));
  if (!terms.length) return false;
  return documents.some((document) =>
    terms.every((term) => {
      if (document.includes(term)) return true;
      const withoutParticle = term.replace(/(?<=[가-힣]{2})(으로|에서|을|를|은|는|이|가|로)$/u, '');
      return withoutParticle !== term && document.includes(withoutParticle);
    }),
  );
}
