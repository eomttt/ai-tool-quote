import { z } from 'zod';
import type { PricingSnapshot, Tool } from './model-tool';
const officialUrl = z.string().url().startsWith('https://');
const identifier = z.string().regex(/^[a-z0-9-]+$/);
const text = z.string().min(1);
const mediaText = z
  .object({ video: z.array(text).optional(), image: z.array(text).optional() })
  .strict();
const toolSchema = z
  .object({
    id: identifier,
    name: text,
    monogram: text,
    color: text,
    description: text,
    bestFor: text,
    features: z.array(text).min(1),
    consideration: text,
    mediaFeatures: mediaText.optional(),
    media: z.array(z.enum(['video', 'image'])).min(1),
    useCases: z.array(z.enum(['generate', 'avatar', 'edit', 'design', 'product'])).min(1),
    tags: z.array(text).min(1),
    mediaTags: mediaText.optional(),
    aliases: z.array(text).optional(),
    website: officialUrl,
    source: officialUrl,
    featured: z.boolean().optional(),
    note: text.optional(),
  })
  .strict() satisfies z.ZodType<Tool>;
export const toolCatalogSchema = z
  .array(toolSchema)
  .min(1)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    '도구 id는 중복될 수 없습니다.',
  );
const allowanceShape = {
  amount: z.number().positive(),
  unit: z.enum(['credits', 'tokens', 'gpu-minutes']),
};
const pricingSchema = z
  .object({
    toolId: identifier,
    checkedAt: z.iso.date(),
    reviewAfterDays: z.number().int().positive().max(365),
    region: text,
    sources: z.array(officialUrl).min(1),
    billingModel: z.enum(['subscription-credits', 'subscription-time', 'subscription-tokens']),
    summary: text,
    plans: z
      .array(
        z
          .object({
            name: text,
            monthlyUsd: z.number().positive(),
            annualUsd: z.number().positive().optional(),
            included: z.object(allowanceShape).strict(),
            note: text.optional(),
          })
          .strict(),
      )
      .min(1),
    topUps: z.array(z.object({ ...allowanceShape, priceUsd: z.number().positive() }).strict()),
    topUpNote: text.optional(),
    freeTier: text.optional(),
    note: text,
  })
  .strict() satisfies z.ZodType<PricingSnapshot>;
export const pricingCatalogSchema = z
  .array(pricingSchema)
  .refine(
    (items) => new Set(items.map((item) => item.toolId)).size === items.length,
    '도구마다 가격 정보는 하나여야 합니다.',
  );
