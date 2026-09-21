export type Medium = 'video' | 'image';
export type UseCase = 'all' | 'generate' | 'avatar' | 'edit' | 'design' | 'product';
export type Billing = 'monthly' | 'annual';
export type AllowanceUnit = 'credits' | 'tokens' | 'fast-tokens' | 'gpu-minutes' | 'compute-units';
export type Currency = 'USD' | 'KRW';
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
  monthlyAmount?: number;
  annualAmount?: number;
  included?: Allowance;
  annualIncluded?: Allowance;
  allowanceNote?: string;
  note?: string;
}
export interface CreditPack extends Allowance {
  priceAmount: number;
}
export interface PricingSnapshot {
  toolId: string;
  checkedAt: string;
  reviewAfterDays: number;
  region: string;
  currency: Currency;
  sources: string[];
  billingModel:
    'subscription-credits' | 'subscription-time' | 'subscription-tokens' | 'subscription';
  summary: string;
  plans: Plan[];
  topUps: CreditPack[];
  topUpNote?: string;
  freeTier?: string;
  note: string;
}
export interface PricingAudit {
  toolId: string;
  checkedAt: string;
  status: 'verified' | 'partial' | 'unavailable' | 'conflicting';
  note: string;
  sources: {
    url: string;
    method: 'http-html-text' | 'browser' | 'official-web';
    evidenceFiles: string[];
  }[];
}
