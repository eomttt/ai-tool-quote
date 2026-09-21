import { describe, expect, it } from 'vitest';
import { getPricing, pricingSnapshots } from '../data/pricing';
import { tools } from '../data/tools';
import { pricingCatalogSchema, toolCatalogSchema } from '../models/model-catalog-schema';
import type { Plan } from '../models/model-tool';
import {
  formatAllowance,
  getEntryPlan,
  isPricingStale,
  monthlyPrice,
  subscriptionUnitPrice,
} from './price-information';
const plan: Plan = {
  name: 'Standard',
  monthlyUsd: 15,
  annualUsd: 144,
  included: { amount: 625, unit: 'credits' },
};
describe('공개 요금 비교', () => {
  it('연 선결제액을 12개월로 나누고 포함 크레딧은 월 단위로 유지한다', () => {
    expect(monthlyPrice(plan, 'annual')).toBe(12);
    expect(subscriptionUnitPrice(plan, 'annual')?.priceUsd).toBe(19.2);
    expect(plan.included.amount).toBe(625);
  });
  it('구독료를 포함량으로 환산하며 이를 실제 추가 구매 가격으로 저장하지 않는다', () => {
    expect(subscriptionUnitPrice(plan, 'monthly')).toEqual({ priceUsd: 24, label: '1,000 크레딧' });
    expect(getPricing('runway')?.topUps).toEqual([]);
    expect(getPricing('pika')?.topUps[0]).toEqual({ amount: 1500, unit: 'credits', priceUsd: 25 });
  });
  it('미확인 연간 가격에는 임의의 할인이나 월간 가격을 적용하지 않는다', () => {
    const monthlyOnly: Plan = {
      name: 'Monthly',
      monthlyUsd: 12,
      included: { amount: 8500, unit: 'tokens' },
    };
    expect(monthlyPrice(monthlyOnly, 'annual')).toBeUndefined();
    expect(subscriptionUnitPrice(monthlyOnly, 'annual')).toBeUndefined();
    expect(getEntryPlan(getPricing('leonardo'), 'annual')).toBeUndefined();
    expect(getEntryPlan(getPricing('leonardo'), 'monthly')?.monthlyUsd).toBe(12);
  });
  it('GPU 시간은 크레딧으로 바꾸지 않고 시간당 구독료를 계산한다', () => {
    const gpuPlan: Plan = {
      name: 'Basic',
      monthlyUsd: 10,
      included: { amount: 200, unit: 'gpu-minutes' },
    };
    expect(subscriptionUnitPrice(gpuPlan, 'monthly')).toEqual({
      priceUsd: 3,
      label: 'Fast GPU 1시간',
    });
    expect(formatAllowance(gpuPlan.included)).toBe('200 Fast GPU분');
  });
  it('시간이 지난 가격도 필터와 시작 요금에서 숨기지 않는다', () => {
    const pricing = getPricing('runway');
    expect(pricing).toBeDefined();
    if (!pricing) throw new Error('Runway 가격 누락');
    expect(isPricingStale(pricing, new Date('2026-11-01'))).toBe(true);
    expect(getEntryPlan(pricing, 'monthly')?.monthlyUsd).toBe(15);
    expect(isPricingStale(pricing, new Date('2026-09-22'))).toBe(false);
  });
  it('영상과 이미지의 요금표 필터 모두 제작 조건 없이 6개 도구를 제공한다', () => {
    for (const medium of ['video', 'image']) {
      const result = tools.filter(
        (tool) => tool.media.some((value) => value === medium) && getPricing(tool.id),
      );
      expect(result).toHaveLength(6);
    }
  });
  it('모든 도구에 특징을 제공하고 가격은 실제 카탈로그 도구에 연결한다', () => {
    expect(tools).toHaveLength(38);
    expect(toolCatalogSchema.safeParse(tools).success).toBe(true);
    expect(pricingCatalogSchema.safeParse(pricingSnapshots).success).toBe(true);
    expect(
      pricingSnapshots.every((pricing) => tools.some((tool) => tool.id === pricing.toolId)),
    ).toBe(true);
  });
  it('중복 ID, 잘못된 확인일, 음수 가격, 0 포함량을 거절한다', () => {
    const pricing = pricingSnapshots[0];
    if (!pricing) throw new Error('가격 누락');
    expect(pricingCatalogSchema.safeParse([pricing, pricing]).success).toBe(false);
    expect(pricingCatalogSchema.safeParse([{ ...pricing, checkedAt: '2026-02-30' }]).success).toBe(
      false,
    );
    expect(
      pricingCatalogSchema.safeParse([{ ...pricing, plans: [{ ...plan, monthlyUsd: -1 }] }])
        .success,
    ).toBe(false);
    expect(
      pricingCatalogSchema.safeParse([
        { ...pricing, plans: [{ ...plan, included: { amount: 0, unit: 'credits' } }] },
      ]).success,
    ).toBe(false);
  });
  it('이전 모델별 소모량 필드가 공개 데이터로 섞이는 것을 막는다', () => {
    expect(pricingCatalogSchema.safeParse([{ ...pricingSnapshots[0], rates: [] }]).success).toBe(
      false,
    );
  });
});
