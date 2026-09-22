import { describe, expect, it } from 'vitest';
import { workflows } from '../data/workflows';
import { workflowSchema } from '../models/model-workflow';
import type { WorkflowPreferences } from '../models/model-workflow';
import {
  initialWorkflowPreferences,
  isWorkflowStepSkipped,
  searchWorkflows,
  workflowStepResources,
} from './search-workflows';

describe('goal-based workflow search', () => {
  it.each([
    'AI로 쇼츠를 만들어 유튜브와 인스타그램에 올리고 싶어',
    '쇼츠, 릴스',
    'AI 영상을 인스타에 올리고 싶어',
    'I want to make AI Shorts and upload them to YouTube',
    'Make reels with captions for Instagram',
  ])('finds a publishing workflow for %s', (query) => {
    expect(searchWorkflows(query).map((workflow) => workflow.id)).toContain('shorts-to-social');
  });

  it.each(['', '   ', 'Runway', '상품 이미지 배경 제거', '유튜브 썸네일', 'business website'])(
    'does not force a workflow on %s',
    (query) => {
      expect(searchWorkflows(query)).toEqual([]);
    },
  );

  it('honors an explicit publishing platform over a format name', () => {
    expect(initialWorkflowPreferences('쇼츠를 인스타그램에 올릴래').platforms).toEqual([
      'instagram',
    ]);
    expect(initialWorkflowPreferences('릴스를 유튜브에 올릴래').platforms).toEqual(['youtube']);
    expect(initialWorkflowPreferences('쇼츠 릴스').platforms).toEqual(['youtube', 'instagram']);
  });
});

describe('short-form workflow branches', () => {
  const workflow = workflows.find((item) => item.id === 'shorts-to-social');
  if (!workflow) throw new Error('The publishing workflow is required.');
  const preferences: WorkflowPreferences = {
    material: 'idea',
    platforms: ['youtube', 'instagram'],
    existingChannels: [],
  };

  it('starts at video production and connects the full publishing journey', () => {
    expect(workflow.steps.map((step) => step.id)).toEqual([
      'generate',
      'edit',
      'channels',
      'publish',
      'review',
    ]);
    const generation = workflow.steps.find((step) => step.id === 'generate');
    const editing = workflow.steps.find((step) => step.id === 'edit');
    if (!generation || !editing) throw new Error('Production steps are required.');
    expect(
      workflowStepResources(workflow, generation, preferences).map((resource) => resource.toolId),
    ).toEqual(['runway', 'higgsfield']);
    expect(
      workflowStepResources(workflow, editing, preferences).map((resource) => resource.name),
    ).toEqual(['CapCut']);
  });

  it('skips only creation for existing clips and both production steps for a finished video', () => {
    const pending = (material: WorkflowPreferences['material']) =>
      workflow.steps
        .filter((step) => !isWorkflowStepSkipped(step, { ...preferences, material }))
        .map((step) => step.id);
    expect(pending('clips')).toEqual(['edit', 'channels', 'publish', 'review']);
    expect(pending('finished')).toEqual(['channels', 'publish', 'review']);
  });

  it('retains Instagram setup when only the YouTube channel exists', () => {
    const step = workflow.steps.find((item) => item.id === 'channels');
    if (!step) throw new Error('The account step is required.');
    const partial: WorkflowPreferences = { ...preferences, existingChannels: ['youtube'] };
    expect(isWorkflowStepSkipped(step, partial)).toBe(false);
    expect(
      workflowStepResources(workflow, step, partial).map((resource) => resource.platform),
    ).toEqual(['instagram']);
    expect(isWorkflowStepSkipped(step, { ...partial, platforms: ['youtube'] })).toBe(true);
  });

  it('shows only selected platform guides without filtering common production tools', () => {
    for (const step of workflow.steps) {
      const resources = workflowStepResources(workflow, step, {
        ...preferences,
        platforms: ['instagram'],
      });
      expect(resources.length).toBeGreaterThan(0);
      expect(resources.every((resource) => resource.platform !== 'youtube')).toBe(true);
    }
  });

  it('rejects broken evidence and cyclic or forward dependencies', () => {
    expect(workflowSchema.safeParse({ ...workflow, sources: [] }).success).toBe(false);
    expect(
      workflowSchema.safeParse({
        ...workflow,
        steps: workflow.steps.map((step) =>
          step.id === 'generate' ? { ...step, dependsOn: ['review'] } : step,
        ),
      }).success,
    ).toBe(false);
  });
});
