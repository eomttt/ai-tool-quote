import { scenarios } from '../data/scenarios';
import { tools } from '../data/tools';
import { getProductProfile } from '../data/product-profiles';
import { createBm25Index } from './bm25';
import { tokenizeSearch } from './tokenize-search';
import type { Medium, Tool } from '../models/model-tool';

function scenarioText(item: (typeof scenarios)[number]) {
  return [
    item.label,
    item.prompt,
    ...item.inputs,
    ...item.outputs,
    ...item.platforms,
    ...item.keywords,
  ].join(' ');
}

const scenarioIndex = createBm25Index(
  scenarios.map((item) => ({
    id: item.id,
    fields: [{ text: scenarioText(item), weight: 1 }],
  })),
);
const toolIndex = createBm25Index(
  tools.map((tool) => {
    const profile = getProductProfile(tool.id);
    return {
      id: tool.id,
      fields: [
        { text: [tool.name, ...(tool.aliases ?? [])].join(' '), weight: 5 },
        {
          text: scenarios
            .filter((item) => item.toolIds.includes(tool.id))
            .map(scenarioText)
            .join(' '),
          weight: 3,
        },
        {
          text:
            profile?.capabilities
              .flatMap((capability) => [
                capability.summary.ko,
                capability.summary.en,
                ...capability.inputs.ko,
                ...capability.inputs.en,
                ...capability.outputs.ko,
                ...capability.outputs.en,
              ])
              .join(' ') ?? '',
          weight: 1,
        },
      ],
    };
  }),
);

function compactName(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function searchTools(query: string) {
  if (!query.trim()) return [];
  const exact = tools.filter((tool) =>
    [tool.name, ...(tool.aliases ?? [])].some((name) => compactName(name) === compactName(query)),
  );
  const ranked = toolIndex.search(query);
  const scenarioMatches = scenarioIndex.search(query);
  const threshold = (ranked[0]?.score ?? 0) * 0.2;
  const candidates = exact.length
    ? exact
        .map(
          (tool) =>
            ranked.find((match) => match.id === tool.id) ?? {
              id: tool.id,
              score: 1,
              matchedTerms: [tool.name],
            },
        )
        .toSorted((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    : ranked.filter((item) => item.score >= threshold);
  return candidates.map((match) => ({
    ...match,
    scenario: scenarioMatches
      .map((result) => scenarios.find((item) => item.id === result.id))
      .find((item) => item?.toolIds.includes(match.id)),
  }));
}

export function recommendationFeature(tool: Tool, medium: Medium, query: string) {
  const terms = new Set(tokenizeSearch(query));
  const features = tool.mediaFeatures?.[medium] ?? tool.features;
  return (
    features
      .map((text) => ({
        text,
        count: tokenizeSearch(text).filter((token) => terms.has(token)).length,
      }))
      .toSorted((a, b) => b.count - a.count)[0]?.text ?? tool.bestFor
  );
}

export function matchesToolSearch(tool: Tool, medium: Medium, query: string) {
  return (
    !query.trim() ||
    (tool.media.includes(medium) && searchTools(query).some((match) => match.id === tool.id))
  );
}
