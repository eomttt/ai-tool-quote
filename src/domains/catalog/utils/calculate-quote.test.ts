import { describe, expect, it } from 'vitest';
import { getPricing, pricingSnapshots } from '../data/pricing';
import { tools } from '../data/tools';
import type { QuoteInput } from '../models/model-tool';
import { calculateQuote, isPricingStale } from './calculate-quote';
import { pricingCatalogSchema, toolCatalogSchema } from '../models/model-catalog-schema';

const reviewedDate = new Date('2026-09-21T12:00:00Z');
const video: QuoteInput = {
  medium: 'video',
  quantity: 10,
  seconds: 5,
  resolution: '720p',
  attempts: 1,
  billing: 'monthly',
};

describe('monthly creation estimate', () => {
  it('chooses a sufficient plan at the credit boundary instead of multiplying subscriptions', () => {
    expect(calculateQuote(getPricing('runway'), video, reviewedDate)).toMatchObject({
      status: 'ready',
      monthlyUsd: 15,
      credits: 600,
      capacity: 10,
      plan: { name: 'Standard' },
    });
    expect(
      calculateQuote(getPricing('runway'), { ...video, quantity: 11 }, reviewedDate),
    ).toMatchObject({ status: 'ready', monthlyUsd: 35, credits: 660, plan: { name: 'Pro' } });
  });
  it('includes repeat generations in the monthly allocation', () => {
    expect(
      calculateQuote(getPricing('runway'), { ...video, attempts: 3 }, reviewedDate),
    ).toMatchObject({
      status: 'ready',
      monthlyUsd: 35,
      credits: 1800,
      generations: 30,
      capacity: 12,
    });
  });
  it('shows annual up-front cost and never pools annual credits into one month', () => {
    expect(
      calculateQuote(getPricing('runway'), { ...video, billing: 'annual' }, reviewedDate),
    ).toMatchObject({ status: 'ready', monthlyUsd: 12, chargeUsd: 144 });
    expect(
      calculateQuote(
        getPricing('runway'),
        { ...video, billing: 'annual', quantity: 11 },
        reviewedDate,
      ),
    ).toMatchObject({ status: 'ready', monthlyUsd: 28, chargeUsd: 336 });
  });
  it('compares Pika using the specific Wan video rate', () => {
    expect(calculateQuote(getPricing('pika'), video, reviewedDate)).toMatchObject({
      status: 'ready',
      model: 'Wan 3.0',
      credits: 330,
      monthlyUsd: 10,
    });
  });
  it('does not invent unsupported duration or resolution rates', () => {
    expect(calculateQuote(getPricing('pika'), { ...video, seconds: 10 }, reviewedDate).status).toBe(
      'unsupported',
    );
    expect(
      calculateQuote(getPricing('runway'), { ...video, resolution: '1080p' }, reviewedDate).status,
    ).toBe('unsupported');
  });
  it('identifies model-specific native image resolution and per-image cost', () => {
    const image: QuoteInput = { ...video, medium: 'image', quantity: 100, resolution: 'native' };
    expect(calculateQuote(getPricing('runway'), image, reviewedDate)).toMatchObject({
      status: 'ready',
      resolution: '720p',
      credits: 500,
      monthlyUsd: 15,
    });
    expect(calculateQuote(getPricing('pika'), image, reviewedDate)).toMatchObject({
      status: 'ready',
      resolution: '1K',
      credits: 800,
      monthlyUsd: 10,
    });
  });
  it('does not substitute a different image resolution for an exact request', () => {
    expect(
      calculateQuote(
        getPricing('pika'),
        { ...video, medium: 'image', resolution: '1080p' },
        reviewedDate,
      ).status,
    ).toBe('unsupported');
  });
  it('distinguishes missing pricing, capacity overflow, and stale prices from zero cost', () => {
    expect(calculateQuote(undefined, video, reviewedDate)).toEqual({
      status: 'unavailable',
      message: '상세 견적 준비 중',
    });
    expect(
      calculateQuote(getPricing('runway'), { ...video, quantity: 1000 }, reviewedDate).status,
    ).toBe('exceeded');
    expect(
      calculateQuote(getPricing('runway'), video, new Date('2026-10-22T00:00:00Z')).status,
    ).toBe('stale');
  });
  it.each([0, -1, 1.5, 10001, NaN, Infinity])('rejects invalid monthly quantity %s', (quantity) => {
    expect(calculateQuote(getPricing('runway'), { ...video, quantity }, reviewedDate).status).toBe(
      'invalid',
    );
  });
  it('rejects invalid generation attempts', () => {
    expect(
      calculateQuote(getPricing('runway'), { ...video, attempts: 0 }, reviewedDate).status,
    ).toBe('invalid');
  });
});

describe('catalog integrity', () => {
  it('rejects duplicate JSON tool identifiers and broken required metadata', () => {
    expect(toolCatalogSchema.safeParse([tools[0], tools[0]]).success).toBe(false);
    expect(toolCatalogSchema.safeParse([{ id: 'missing-fields' }]).success).toBe(false);
  });
  it('rejects malformed pricing and missing video duration in JSON', () => {
    const pricing = getPricing('runway');
    if (!pricing) throw new Error('Runway 가격 스냅샷이 필요합니다.');
    expect(pricingCatalogSchema.safeParse([{ ...pricing, checkedAt: '2026-02-30' }]).success).toBe(
      false,
    );
    expect(
      pricingCatalogSchema.safeParse([
        {
          ...pricing,
          rates: [{ medium: 'video', model: 'Gen-4.5', resolution: '720p', credits: 60 }],
        },
      ]).success,
    ).toBe(false);
  });
  it('has unique service identifiers and valid official source URLs', () => {
    expect(tools.length).toBeGreaterThanOrEqual(38);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
    for (const tool of tools) {
      expect(new URL(tool.source).protocol).toBe('https:');
      expect(new URL(tool.website).protocol).toBe('https:');
      expect(tool.media.length).toBeGreaterThan(0);
    }
  });
  it('links pricing snapshots to services and preserves verifiable source metadata', () => {
    for (const snapshot of pricingSnapshots) {
      expect(tools.some((tool) => tool.id === snapshot.toolId)).toBe(true);
      expect(snapshot.sources.length).toBeGreaterThan(0);
      expect(isPricingStale(snapshot, reviewedDate)).toBe(false);
      expect(snapshot.plans.every((plan) => plan.monthlyUsd > 0 && plan.monthlyCredits > 0)).toBe(
        true,
      );
    }
  });
});
