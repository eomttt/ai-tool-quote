export type Medium = 'video' | 'image';
export type UseCase = 'all' | 'generate' | 'avatar' | 'edit' | 'design' | 'product';
export type Billing = 'monthly' | 'annual';
export type Resolution = 'native' | '720p' | '1080p' | '1K';

export interface Tool {
  id: string;
  name: string;
  monogram: string;
  color: string;
  description: string;
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

export interface Plan {
  name: string;
  monthlyUsd: number;
  annualUsd?: number;
  monthlyCredits: number;
  note?: string;
}

export interface GenerationRate {
  medium: Medium;
  model: string;
  resolution: Resolution;
  seconds?: number;
  credits: number;
}

export interface PricingSnapshot {
  toolId: string;
  checkedAt: string;
  reviewAfterDays: number;
  region: string;
  sources: string[];
  plans: Plan[];
  rates: GenerationRate[];
  note: string;
}

export interface QuoteInput {
  medium: Medium;
  quantity: number;
  seconds: number;
  resolution: Resolution;
  attempts: number;
  billing: Billing;
}

export type QuoteResult =
  | {
      status: 'ready';
      plan: Plan;
      model: string;
      resolution: Resolution;
      credits: number;
      generations: number;
      monthlyUsd: number;
      chargeUsd: number;
      capacity: number;
      checkedAt: string;
    }
  | { status: 'unavailable' | 'unsupported' | 'exceeded' | 'stale' | 'invalid'; message: string };
