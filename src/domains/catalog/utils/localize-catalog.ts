import type { TFunction } from 'i18next';
import type { PricingAudit, PricingSnapshot, Tool } from '../models/model-tool';

export function localizeTool(tool: Tool, t: TFunction<'catalog'>): Tool {
  const text = (value: string) => t(value, { defaultValue: value });
  return {
    ...tool,
    description: text(tool.description),
    bestFor: text(tool.bestFor),
    consideration: text(tool.consideration),
    features: tool.features.map(text),
    tags: tool.tags.map(text),
    note: tool.note ? text(tool.note) : undefined,
    mediaFeatures: {
      video: tool.mediaFeatures?.video?.map(text),
      image: tool.mediaFeatures?.image?.map(text),
    },
    mediaTags: {
      video: tool.mediaTags?.video?.map(text),
      image: tool.mediaTags?.image?.map(text),
    },
  };
}

export function localizePricing(
  pricing: PricingSnapshot,
  t: TFunction<'catalog'>,
): PricingSnapshot {
  const text = (value: string) => t(value, { defaultValue: value });
  return {
    ...pricing,
    summary: text(pricing.summary),
    region: text(pricing.region),
    note: text(pricing.note),
    freeTier: pricing.freeTier ? text(pricing.freeTier) : undefined,
    topUpNote: pricing.topUpNote ? text(pricing.topUpNote) : undefined,
    plans: pricing.plans.map((plan) => ({
      ...plan,
      name: text(plan.name),
      note: plan.note ? text(plan.note) : undefined,
      allowanceNote: plan.allowanceNote ? text(plan.allowanceNote) : undefined,
    })),
  };
}

export function localizeAudit(audit: PricingAudit, t: TFunction<'catalog'>): PricingAudit {
  return { ...audit, note: t(audit.note, { defaultValue: audit.note }) };
}
