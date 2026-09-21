import { z } from 'zod';
import type { PricingAudit, PricingSnapshot, Tool } from './model-tool';
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
    icon: z
      .string()
      .regex(/^\/tool-icons\/[a-z0-9-]+\.(png|ico|svg|webp|jpg|gif)$/)
      .optional(),
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
  unit: z.enum(['credits', 'tokens', 'fast-tokens', 'gpu-minutes', 'compute-units']),
};
const pricingSchema = z
  .object({
    toolId: identifier,
    checkedAt: z.iso.date(),
    reviewAfterDays: z.number().int().positive().max(365),
    region: text,
    currency: z.enum(['USD', 'KRW']),
    sources: z.array(officialUrl).min(1),
    billingModel: z.enum([
      'subscription-credits',
      'subscription-time',
      'subscription-tokens',
      'subscription',
    ]),
    summary: text,
    plans: z
      .array(
        z
          .object({
            name: text,
            monthlyAmount: z.number().positive().optional(),
            annualAmount: z.number().positive().optional(),
            included: z.object(allowanceShape).strict().optional(),
            annualIncluded: z.object(allowanceShape).strict().optional(),
            allowanceNote: text.optional(),
            note: text.optional(),
          })
          .strict()
          .refine(
            (plan) => plan.monthlyAmount !== undefined || plan.annualAmount !== undefined,
            '확인한 구독료가 하나 이상 필요합니다.',
          )
          .refine(
            (plan) => !plan.annualIncluded || plan.annualAmount !== undefined,
            '연간 포함량에는 연간 요금이 필요합니다.',
          ),
      )
      .min(1),
    topUps: z.array(z.object({ ...allowanceShape, priceAmount: z.number().positive() }).strict()),
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
export const pricingAuditSchema = z
  .array(
    z
      .object({
        toolId: identifier,
        checkedAt: z.iso.date(),
        status: z.enum(['verified', 'partial', 'unavailable', 'conflicting']),
        note: text,
        sources: z
          .array(
            z
              .object({
                url: officialUrl,
                method: z.enum(['http-html-text', 'browser', 'official-web']),
                evidenceFiles: z.array(z.string().startsWith('research/')).min(1),
              })
              .strict(),
          )
          .min(1),
      })
      .strict() satisfies z.ZodType<PricingAudit>,
  )
  .refine(
    (items) => new Set(items.map((item) => item.toolId)).size === items.length,
    '도구마다 확인 기록은 하나여야 합니다.',
  );
