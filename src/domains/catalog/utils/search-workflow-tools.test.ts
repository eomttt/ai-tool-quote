import { describe, expect, it } from 'vitest';
import { workflows } from '../data/workflows';
import { workflowStepResources, initialWorkflowPreferences } from './search-workflows';
import { searchWorkflowTools, workflowToolCandidates } from './search-workflow-tools';
import type { WorkflowStep } from '../models/model-workflow';

function stageSearch(stepId: WorkflowStep['id']) {
  const workflow = workflows[0];
  const step = workflow?.steps.find((item) => item.id === stepId);
  if (!workflow || !step) throw new Error('The workflow step is required.');
  const resources = workflowStepResources(workflow, step, initialWorkflowPreferences('쇼츠 릴스'));
  const candidates = workflowToolCandidates(step, resources);
  return {
    candidates,
    search: (query: string) => searchWorkflowTools(candidates, step, query).map((item) => item.id),
  };
}

describe('search within a workflow step', () => {
  it('browses the complete pool with curated tools first and no duplicates', () => {
    const { candidates, search } = stageSearch('generate');
    expect(search('')).toHaveLength(20);
    expect(search('   ')).toEqual(search(''));
    expect(search('').slice(0, 2)).toEqual(['runway', 'higgsfield']);
    expect(new Set(candidates.map((item) => item.id)).size).toBe(candidates.length);
    expect(search('')).not.toContain('gemini');
  });

  it.each(['Kling AI', 'kling', '클링', 'Kli'])(
    'finds tools beyond the curated pair by name or alias: %s',
    (query) => expect(stageSearch('generate').search(query)[0]).toBe('kling'),
  );

  it('searches official features in both languages', () => {
    expect(stageSearch('generate').search('이미지를 영상으로')).toContain('flow');
    expect(stageSearch('generate').search('reference images')).toContain('vidu');
    expect(stageSearch('edit').search('자막')).toEqual(
      expect.arrayContaining(['capcut', 'veed', 'pictory']),
    );
    expect(stageSearch('edit').search('captions')).toEqual(
      expect.arrayContaining(['capcut', 'veed', 'pictory']),
    );
  });

  it('keeps the catalog and workflow-only tools together in their eligible step', () => {
    const generation = stageSearch('generate');
    const editing = stageSearch('edit');
    expect(editing.search('')).toHaveLength(5);
    expect(editing.search('CapCut')).toEqual(['capcut']);
    expect(editing.search('캡컷')).toEqual(['capcut']);
    expect(editing.search('VEED')).toEqual(['veed']);
    expect(generation.search('VEED')).toEqual([]);
    expect(editing.search('Kling')).toEqual([]);
    expect(editing.search('')).not.toContain('krea');
  });

  it('returns no matches for unrelated input and restores every candidate when cleared', () => {
    const { search } = stageSearch('generate');
    expect(search('zzznomatch123')).toEqual([]);
    expect(search('!!!')).toEqual([]);
    expect(search('Runway')).toEqual(['runway']);
    expect(search('')).toHaveLength(20);
  });

  it('does not turn platform guides into a tool pool', () => {
    expect(stageSearch('channels').search('')).toEqual([]);
    expect(stageSearch('publish').search('YouTube')).toEqual([]);
  });
});
