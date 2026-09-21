export type Medium = 'video' | 'image';
export type UseCase = 'all' | 'generate' | 'avatar' | 'edit' | 'design' | 'product';
export type Billing = 'monthly' | 'annual';
export type AllowanceUnit = 'credits' | 'tokens' | 'gpu-minutes';
export interface Tool {
  id: string;
  name: string;
  monogram: string;
  color: string;
  description: string;
  bestFor: string;
  features: string[];
  consideration: string;
  mediaFeatures?: { video?: string[]; image?: string[] };
  media: Medium[];
  useCases: UseCase[];
  tags: string[];
  mediaTags?: { video?: string[]; image?: string[] };
  aliases?: string[];
  website: string;
  source: string;
  featured?: boolean;
  note?: string;
}
export interface Allowance {
  amount: number;
  unit: AllowanceUnit;
}
export interface Plan {
  name: string;
  monthlyUsd: number;
  annualUsd?: number;
  included: Allowance;
  note?: string;
}
export interface CreditPack extends Allowance {
  priceUsd: number;
}
export interface PricingSnapshot {
  toolId: string;
  checkedAt: string;
  reviewAfterDays: number;
  region: string;
  sources: string[];
  billingModel: 'subscription-credits' | 'subscription-time' | 'subscription-tokens';
  summary: string;
  plans: Plan[];
  topUps: CreditPack[];
  topUpNote?: string;
  freeTier?: string;
  note: string;
}
