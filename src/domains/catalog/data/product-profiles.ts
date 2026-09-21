import { z } from 'zod';
import profileData from './product-profiles.json';
import { tools } from './tools';

const text = z.object({ ko: z.string().min(1), en: z.string().min(1) }).strict();
const terms = z
  .object({ ko: z.array(z.string().min(1)).min(1), en: z.array(z.string().min(1)).min(1) })
  .strict();
const profileSchema = z
  .object({
    toolId: z.string().min(1),
    reviewedAt: z.string().datetime({ offset: true }),
    sources: z
      .array(
        z
          .object({
            id: z.string().min(1),
            url: z.string().url().startsWith('https://'),
            title: z.string().min(1),
            method: z.enum(['http-html-text', 'official-web']),
            checkedAt: z.string().datetime({ offset: true }),
            evidenceFile: z.string().startsWith('research/products/'),
          })
          .strict(),
      )
      .min(1),
    capabilities: z
      .array(
        z
          .object({
            id: z.string().min(1),
            medium: z.enum(['video', 'image']),
            summary: text,
            inputs: terms,
            outputs: terms,
            sourceId: z.string().min(1),
            evidenceExcerpt: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .refine(
    (profile) =>
      new Set(profile.sources.map((source) => source.id)).size === profile.sources.length &&
      new Set(profile.capabilities.map((capability) => capability.id)).size ===
        profile.capabilities.length &&
      profile.capabilities.every((capability) =>
        profile.sources.some((source) => source.id === capability.sourceId),
      ),
    'Each capability must reference a unique, recorded product source.',
  );

export const productProfiles = z
  .array(profileSchema)
  .refine(
    (profiles) =>
      profiles.length === tools.length &&
      new Set(profiles.map((profile) => profile.toolId)).size === tools.length &&
      tools.every((tool) => {
        const profile = profiles.find((item) => item.toolId === tool.id);
        return (
          profile &&
          tool.media.every((medium) =>
            profile.capabilities.some((capability) => capability.medium === medium),
          ) &&
          profile.capabilities.every((capability) => tool.media.includes(capability.medium))
        );
      }),
    'Every catalog tool and supported medium needs an official product profile.',
  )
  .parse(profileData);

export function getProductProfile(toolId: string) {
  return productProfiles.find((profile) => profile.toolId === toolId);
}
