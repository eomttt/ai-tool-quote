import { tools } from '../data/tools';
import { getProductProfile } from '../data/product-profiles';
import type { Tool } from '../models/model-tool';
import type { WorkflowResource, WorkflowStep } from '../models/model-workflow';
import { createBm25Index } from './bm25';

export interface WorkflowToolCandidate {
  id: string;
  name: string;
  tool?: Tool;
  resource?: WorkflowResource;
}

export function workflowToolCandidates(step: WorkflowStep, resources: WorkflowResource[]) {
  const candidates = new Map<string, WorkflowToolCandidate>();
  for (const resource of resources.filter((item) => item.kind === 'tool')) {
    const tool = tools.find((item) => item.id === resource.toolId);
    const id = tool?.id ?? resource.id;
    candidates.set(id, { id, name: resource.name, tool, resource });
  }
  for (const id of step.toolSearch?.toolIds ?? []) {
    const tool = tools.find((item) => item.id === id);
    if (tool && !candidates.has(id)) candidates.set(id, { id, name: tool.name, tool });
  }
  return [...candidates.values()];
}

function normalizeName(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function searchWorkflowTools(
  candidates: WorkflowToolCandidate[],
  step: WorkflowStep,
  query: string,
) {
  if (!query.trim()) return candidates;
  const normalized = normalizeName(query);
  if (!normalized) return [];
  const names = (candidate: WorkflowToolCandidate) => [
    candidate.name,
    ...(candidate.tool?.aliases ?? []),
    ...(candidate.resource?.aliases ?? []),
  ];
  const exact = candidates.filter((candidate) =>
    names(candidate).some((name) => normalizeName(name) === normalized),
  );
  if (exact.length) return exact;
  const index = createBm25Index(
    candidates.map((candidate) => ({
      id: candidate.id,
      fields: [
        { text: names(candidate).join(' '), weight: 5 },
        {
          text: [
            ...(getProductProfile(candidate.id)
              ?.capabilities.filter((capability) => capability.medium === step.toolSearch?.medium)
              .flatMap((capability) => [
                capability.summary.ko,
                capability.summary.en,
                ...capability.inputs.ko,
                ...capability.inputs.en,
                ...capability.outputs.ko,
                ...capability.outputs.en,
              ]) ?? []),
            ...(candidate.resource
              ? [candidate.resource.reason, ...candidate.resource.actions].flatMap((text) => [
                  text.ko,
                  text.en,
                ])
              : []),
          ].join(' '),
          weight: 1,
        },
      ],
    })),
  );
  const matches = index.search(query);
  const scores = new Map(matches.map((match) => [match.id, match.score]));
  const nameMatches = new Set(
    candidates
      .filter((candidate) =>
        names(candidate).some((name) => normalizeName(name).includes(normalized)),
      )
      .map((candidate) => candidate.id),
  );
  return candidates
    .filter((candidate) => nameMatches.has(candidate.id) || scores.has(candidate.id))
    .toSorted(
      (a, b) =>
        Number(nameMatches.has(b.id)) - Number(nameMatches.has(a.id)) ||
        (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0),
    );
}
