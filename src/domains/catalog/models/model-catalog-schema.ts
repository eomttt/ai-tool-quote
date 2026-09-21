import { z } from 'zod';
import type { PricingSnapshot, Tool } from './model-tool';

const officialUrl = z.string().url().startsWith('https://');
const identifier = z.string().regex(/^[a-z0-9-]+$/);
const toolSchema = z
  .object({
    id: identifier,
    name: z.string().min(1),
    monogram: z.string().min(1),
    color: z.enum(['sand', 'lime', 'blue', 'lavender', 'teal', 'orange', 'coral', 'ink']),
    description: z.string().min(1),
    media: z.array(z.enum(['video', 'image'])).min(1),
    useCases: z.array(z.enum(['generate', 'avatar', 'edit', 'design', 'product'])).min(1),
    tags: z.array(z.string().min(1)).min(1),
    mediaTags: z
      .object({
        video: z.array(z.string().min(1)).optional(),
        image: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    aliases: z.array(z.string().min(1)).optional(),
    website: officialUrl,
    source: officialUrl,
    featured: z.boolean().optional(),
    note: z.string().optional(),
  })
  .strict() satisfies z.ZodType<Tool>;

export const toolCatalogSchema = z
  .array(toolSchema)
  .min(1)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    '도구 id는 중복될 수 없습니다.',
  );

const rateSchema = z
  .object({
    medium: z.enum(['video', 'image']),
    model: z.string().min(1),
    resolution: z.enum(['720p', '1080p', '1K']),
    seconds: z.number().int().positive().optional(),
    credits: z.number().positive(),
  })
  .strict()
  .refine(
    (rate) => rate.medium === 'image' || rate.seconds !== undefined,
    '영상 과금에는 길이가 필요합니다.',
  );

const pricingSchema = z
  .object({
    toolId: identifier,
    checkedAt: z.iso.date(),
    reviewAfterDays: z.number().int().positive().max(365),
    region: z.string().min(1),
    sources: z.array(officialUrl).min(1),
    plans: z
      .array(
        z
          .object({
            name: z.string().min(1),
            monthlyUsd: z.number().positive(),
            annualUsd: z.number().positive().optional(),
            monthlyCredits: z.number().int().positive(),
            note: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
    rates: z.array(rateSchema).min(1),
    note: z.string().min(1),
  })
  .strict() satisfies z.ZodType<PricingSnapshot>;

export const pricingCatalogSchema = z
  .array(pricingSchema)
  .refine(
    (items) => new Set(items.map((item) => item.toolId)).size === items.length,
    '도구마다 공개 가격 스냅샷은 하나여야 합니다.',
  );
