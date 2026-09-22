import { z } from 'zod';

const text = z.object({ ko: z.string().min(1), en: z.string().min(1) }).strict();
const stepId = z.enum(['generate', 'edit', 'channels', 'publish', 'review']);
const url = z.string().url().startsWith('https://');
export const workflowPlatformSchema = z.enum(['youtube', 'instagram']);
export const workflowMaterialSchema = z.enum(['idea', 'clips', 'finished']);

export const workflowSchema = z
  .object({
    id: z.string().min(1),
    title: text,
    description: text,
    example: text,
    keywords: z.array(z.string()).min(1),
    triggerTerms: z.array(z.string()).min(1),
    platformTerms: z.array(z.string()).min(1),
    recommendationBasis: z.literal('editorial'),
    steps: z
      .array(
        z
          .object({
            id: stepId,
            title: text,
            summary: text,
            input: text,
            output: text,
            handoff: text,
            dependsOn: z.array(stepId),
            resourceIds: z.array(z.string()).min(1),
            toolSearch: z
              .object({
                medium: z.enum(['video', 'image']),
                toolIds: z.array(z.string().min(1)).min(1),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .min(1),
    resources: z
      .array(
        z
          .object({
            id: z.string().min(1),
            name: z.string().min(1),
            aliases: z.array(z.string().min(1)).optional(),
            kind: z.enum(['tool', 'guide']),
            platform: z.enum(['all', 'youtube', 'instagram']),
            url,
            toolId: z.string().optional(),
            reason: text,
            actions: z.array(text).min(1),
            sourceIds: z.array(z.string()).min(1),
          })
          .strict(),
      )
      .min(1),
    sources: z
      .array(
        z
          .object({
            id: z.string().min(1),
            url,
            title: text,
            checkedAt: z.iso.date(),
            access: z.enum(['read', 'login-required']),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((workflow, context) => {
    const stepIds = new Set(workflow.steps.map((step) => step.id));
    const resourceIds = new Set(workflow.resources.map((resource) => resource.id));
    const sourceIds = new Set(workflow.sources.map((source) => source.id));
    const seenSteps = new Set<string>();
    const invalid = workflow.steps.some((step) => {
      const invalidStep =
        step.dependsOn.some((id) => !seenSteps.has(id)) ||
        step.resourceIds.some((id) => !resourceIds.has(id));
      seenSteps.add(step.id);
      return invalidStep;
    });
    if (
      invalid ||
      stepIds.size !== workflow.steps.length ||
      resourceIds.size !== workflow.resources.length ||
      sourceIds.size !== workflow.sources.length ||
      workflow.resources.some((resource) => resource.sourceIds.some((id) => !sourceIds.has(id)))
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Workflow references must be unique, sourced, and ordered.',
      });
    }
  });

export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowStep = Workflow['steps'][number];
export type WorkflowResource = Workflow['resources'][number];
export type WorkflowPlatform = z.infer<typeof workflowPlatformSchema>;
export type WorkflowMaterial = z.infer<typeof workflowMaterialSchema>;
export interface WorkflowPreferences {
  platforms: WorkflowPlatform[];
  material: WorkflowMaterial;
  existingChannels: WorkflowPlatform[];
}
