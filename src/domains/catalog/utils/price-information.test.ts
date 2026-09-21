import { describe, expect, it } from 'vitest';
import { getPricing, pricingAudits, pricingSnapshots } from '../data/pricing';
import { tools } from '../data/tools';
import { pricingCatalogSchema, toolCatalogSchema } from '../models/model-catalog-schema';
import type { Plan } from '../models/model-tool';
import {
  formatAllowance,
  getEntryPlan,
  isPricingStale,
  monthlyPrice,
  subscriptionUnitPrice,
  planAllowance,
  formatMoney,
  compareSubscriptionPrices,
} from './price-information';
const plan = {
  name: 'Standard',
  monthlyAmount: 15,
  annualAmount: 144,
  included: { amount: 625, unit: 'credits' },
} satisfies Plan;
describe('공개 요금 비교', () => {
  it('연 선결제액을 12개월로 나누고 포함 크레딧은 월 단위로 유지한다', () => {
    expect(monthlyPrice(plan, 'annual')).toBe(12);
    expect(subscriptionUnitPrice(plan, 'annual')?.priceAmount).toBe(19.2);
    expect(plan.included.amount).toBe(625);
  });
  it('구독료를 포함량으로 환산하며 이를 실제 추가 구매 가격으로 저장하지 않는다', () => {
    expect(subscriptionUnitPrice(plan, 'monthly')).toEqual({
      priceAmount: 24,
      label: '1,000 크레딧',
    });
    expect(getPricing('runway')?.topUps).toEqual([]);
    expect(getPricing('pika')?.topUps[0]).toEqual({
      amount: 1500,
      unit: 'credits',
      priceAmount: 25,
    });
  });
  it('미확인 연간 가격에는 임의의 할인이나 월간 가격을 적용하지 않는다', () => {
    const monthlyOnly: Plan = {
      name: 'Monthly',
      monthlyAmount: 12,
      included: { amount: 8500, unit: 'tokens' },
    };
    expect(monthlyPrice(monthlyOnly, 'annual')).toBeUndefined();
    expect(subscriptionUnitPrice(monthlyOnly, 'annual')).toBeUndefined();
    expect(getEntryPlan(getPricing('leonardo'), 'annual')).toBeUndefined();
    expect(getEntryPlan(getPricing('leonardo'), 'monthly')?.monthlyAmount).toBe(12);
  });
  it('GPU 시간은 크레딧으로 바꾸지 않고 시간당 구독료를 계산한다', () => {
    const gpuPlan = {
      name: 'Basic',
      monthlyAmount: 10,
      included: { amount: 200, unit: 'gpu-minutes' },
    } satisfies Plan;
    expect(subscriptionUnitPrice(gpuPlan, 'monthly')).toEqual({
      priceAmount: 3,
      label: 'Fast GPU 1시간',
    });
    expect(formatAllowance(gpuPlan.included)).toBe('200 Fast GPU분');
  });
  it('시간이 지난 가격도 필터와 시작 요금에서 숨기지 않는다', () => {
    const pricing = getPricing('runway');
    expect(pricing).toBeDefined();
    if (!pricing) throw new Error('Runway 가격 누락');
    expect(isPricingStale(pricing, new Date('2026-11-01'))).toBe(true);
    expect(getEntryPlan(pricing, 'monthly')?.monthlyAmount).toBe(15);
    expect(isPricingStale(pricing, new Date('2026-09-22'))).toBe(false);
  });
  it('요금표 필터는 제작 조건 없이 해당 분야의 가격 등록 도구를 모두 제공한다', () => {
    for (const medium of ['video', 'image']) {
      const result = tools.filter(
        (tool) => tool.media.some((value) => value === medium) && getPricing(tool.id),
      );
      const expectedIds = pricingSnapshots
        .filter((pricing) =>
          tools.some(
            (tool) => tool.id === pricing.toolId && tool.media.some((value) => value === medium),
          ),
        )
        .map((pricing) => pricing.toolId);
      expect(result.map((tool) => tool.id).sort()).toEqual(expectedIds.sort());
      expect(result.length).toBeGreaterThan(0);
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
      pricingCatalogSchema.safeParse([{ ...pricing, plans: [{ ...plan, monthlyAmount: -1 }] }])
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
  it('연간 선지급 크레딧을 월 지급량으로 표시하지 않는다', () => {
    const annualPool: Plan = {
      name: 'Starter',
      monthlyAmount: 29,
      annualAmount: 216,
      included: { amount: 1200, unit: 'credits' },
      annualIncluded: { amount: 14500, unit: 'credits' },
    };
    expect(planAllowance(annualPool, 'annual')).toBe('연 14,500 크레딧 포함');
    expect(planAllowance(annualPool, 'monthly')).toBe('월 1,200 크레딧 포함');
    expect(subscriptionUnitPrice(annualPool, 'annual')?.priceAmount).toBeCloseTo(
      (216 / 14500) * 1000,
    );
  });
  it('고정 포함량이 없으면 이용 조건만 표시하고 단가를 만들지 않는다', () => {
    const limited: Plan = {
      name: 'Pro',
      monthlyAmount: 9900,
      allowanceNote: '무료 대비 AI 한도 10배',
    };
    expect(planAllowance(limited, 'monthly')).toBe('무료 대비 AI 한도 10배');
    expect(subscriptionUnitPrice(limited, 'monthly')).toBeUndefined();
    expect(planAllowance(limited, 'annual')).toBe('선택한 결제 주기의 포함량 미확인');
    const annualOnly: Plan = { name: 'Annual', annualAmount: 120 };
    expect(monthlyPrice(annualOnly, 'monthly')).toBeUndefined();
    expect(monthlyPrice(annualOnly, 'annual')).toBe(10);
  });
  it('원화와 달러를 환율 없이 숫자 크기만으로 비교하지 않는다', () => {
    expect(formatMoney(9900, 'KRW')).toBe('₩9,900');
    expect(formatMoney(9.99, 'USD')).toBe('$9.99');
    expect(
      compareSubscriptionPrices(getPricing('canva'), getPricing('runway'), 'monthly'),
    ).toBeLessThan(0);
    expect(
      compareSubscriptionPrices(getPricing('runway'), getPricing('pika'), 'monthly'),
    ).toBeGreaterThan(0);
    expect(compareSubscriptionPrices(undefined, getPricing('canva'), 'monthly')).toBe(1);
    expect(compareSubscriptionPrices(undefined, undefined, 'monthly')).toBe(0);
  });
  it('가격 미등록 도구도 확인 결과와 출처를 남긴다', () => {
    expect(pricingAudits.map((audit) => audit.toolId).sort()).toEqual(
      tools.map((tool) => tool.id).sort(),
    );
    expect(pricingAudits.find((audit) => audit.toolId === 'hailuo')?.status).toBe('conflicting');
    expect(
      pricingAudits.find((audit) => audit.toolId === 'tensor')?.sources.length,
    ).toBeGreaterThan(0);
    for (const pricing of pricingSnapshots) {
      const audit = pricingAudits.find((entry) => entry.toolId === pricing.toolId);
      expect(
        pricing.sources.every((url) => audit?.sources.some((source) => source.url === url)),
      ).toBe(true);
    }
  });
});
