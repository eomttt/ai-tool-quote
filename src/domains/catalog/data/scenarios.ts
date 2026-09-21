import { z } from 'zod';
import scenarioData from './scenarios.json';
import { tools } from './tools';
import { getProductProfile } from './product-profiles';

const scenarioSchema = z
  .object({
    basis: z.literal('editorial'),
    evidence: z
      .array(z.object({ toolId: z.string(), capabilityIds: z.array(z.string()).min(1) }).strict())
      .min(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    medium: z.enum(['video', 'image']),
    label: z.string().min(1),
    description: z.string().min(1),
    prompt: z.string().min(1),
    inputs: z.array(z.string().min(1)).min(1),
    outputs: z.array(z.string().min(1)).min(1),
    platforms: z.array(z.string().min(1)),
    keywords: z.array(z.string().min(1)).min(1),
    toolIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const scenarios = z
  .array(scenarioSchema)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    '상황 id는 중복될 수 없습니다.',
  )
  .refine(
    (items) =>
      items.every(
        (item) =>
          new Set(item.toolIds).size === item.toolIds.length &&
          item.toolIds.every((id) =>
            tools.some((tool) => tool.id === id && tool.media.includes(item.medium)),
          ),
      ),
    '상황에 연결한 도구는 해당 제작 분야를 지원해야 하며 중복될 수 없습니다.',
  )
  .refine(
    (items) =>
      items.every(
        (item) =>
          item.evidence.length === item.toolIds.length &&
          new Set(item.evidence.map((link) => link.toolId)).size === item.evidence.length &&
          item.toolIds.every((id) => item.evidence.some((link) => link.toolId === id)) &&
          item.evidence.every((link) =>
            link.capabilityIds.every((id) =>
              getProductProfile(link.toolId)?.capabilities.some(
                (capability) => capability.id === id && capability.medium === item.medium,
              ),
            ),
          ),
      ),
    'Editorial scenario mappings must link to recorded capabilities in the same medium.',
  )
  .parse(scenarioData);
