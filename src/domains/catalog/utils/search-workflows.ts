import { workflows } from '../data/workflows';
import type { Workflow, WorkflowPreferences, WorkflowStep } from '../models/model-workflow';
import { createBm25Index } from './bm25';
import { tokenizeSearch } from './tokenize-search';

const workflowIndex = createBm25Index(
  workflows.map((workflow) => ({
    id: workflow.id,
    fields: [
      { text: Object.values(workflow.title).join(' '), weight: 3 },
      { text: [...Object.values(workflow.example), ...workflow.keywords].join(' '), weight: 2 },
    ],
  })),
);

export function searchWorkflows(query: string) {
  const terms = new Set(tokenizeSearch(query));
  return workflowIndex.search(query).flatMap((match) => {
    const workflow = workflows.find((item) => item.id === match.id);
    if (!workflow) return [];
    // A shared word like "image" alone must not imply a publishing workflow.
    const matchesIntent =
      workflow.triggerTerms.some((term) => terms.has(term)) ||
      (terms.has('video') && workflow.platformTerms.some((term) => terms.has(term)));
    return matchesIntent ? [workflow] : [];
  });
}

export function initialWorkflowPreferences(query: string): WorkflowPreferences {
  const terms = new Set(tokenizeSearch(query));
  const explicitPlatform = terms.has('youtube') || terms.has('instagram');
  const youtube = terms.has('youtube') || (!explicitPlatform && terms.has('shorts'));
  const instagram = terms.has('instagram') || (!explicitPlatform && terms.has('reels'));
  return {
    platforms:
      youtube && !instagram
        ? ['youtube']
        : instagram && !youtube
          ? ['instagram']
          : ['youtube', 'instagram'],
    material: 'idea',
    existingChannels: [],
  };
}

export function isWorkflowStepSkipped(step: WorkflowStep, preferences: WorkflowPreferences) {
  if (step.id === 'generate') return preferences.material !== 'idea';
  if (step.id === 'edit') return preferences.material === 'finished';
  if (step.id === 'channels')
    return preferences.platforms.every((platform) =>
      preferences.existingChannels.includes(platform),
    );
  return false;
}

export function workflowStepResources(
  workflow: Workflow,
  step: WorkflowStep,
  preferences: WorkflowPreferences,
) {
  return step.resourceIds.flatMap((id) => {
    const resource = workflow.resources.find((item) => item.id === id);
    if (!resource) return [];
    if (resource.platform !== 'all' && !preferences.platforms.includes(resource.platform))
      return [];
    if (
      step.id === 'channels' &&
      resource.platform !== 'all' &&
      preferences.existingChannels.includes(resource.platform)
    )
      return [];
    return [resource];
  });
}
