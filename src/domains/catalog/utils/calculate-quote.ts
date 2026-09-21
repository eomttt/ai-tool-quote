import type { PricingSnapshot, QuoteInput, QuoteResult } from '../models/model-tool';

export function isPricingStale(snapshot: PricingSnapshot, now = new Date()): boolean {
  const checkedAt = Date.parse(`${snapshot.checkedAt}T00:00:00Z`);
  return (
    !Number.isFinite(checkedAt) || now.getTime() - checkedAt > snapshot.reviewAfterDays * 86_400_000
  );
}

export function calculateQuote(
  snapshot: PricingSnapshot | undefined,
  input: QuoteInput,
  now = new Date(),
): QuoteResult {
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > 10000 ||
    !Number.isInteger(input.attempts) ||
    input.attempts < 1 ||
    input.attempts > 10
  ) {
    return { status: 'invalid', message: '수량과 시도 횟수를 확인해 주세요.' };
  }
  if (!snapshot) return { status: 'unavailable', message: '상세 견적 준비 중' };
  if (isPricingStale(snapshot, now)) return { status: 'stale', message: '가격 재확인 필요' };
  const rate = snapshot.rates.find(
    (item) =>
      item.medium === input.medium &&
      (input.resolution === 'native' || item.resolution === input.resolution) &&
      (input.medium === 'image' || item.seconds === input.seconds),
  );
  if (!rate) return { status: 'unsupported', message: '이 조건의 과금 정보 미확인' };
  const generations = input.quantity * input.attempts;
  const credits = Math.ceil(generations * rate.credits);
  const eligiblePlans = snapshot.plans.filter(
    (plan) =>
      plan.monthlyCredits >= credits &&
      (input.billing === 'monthly' || plan.annualUsd !== undefined),
  );
  const priceOf = (plan: PricingSnapshot['plans'][number]) =>
    input.billing === 'annual' ? (plan.annualUsd ?? Infinity) / 12 : plan.monthlyUsd;
  const plan = eligiblePlans.toSorted((a, b) => priceOf(a) - priceOf(b))[0];
  if (!plan) return { status: 'exceeded', message: '추가 크레딧·상위 요금제 확인 필요' };
  return {
    status: 'ready',
    plan,
    model: rate.model,
    resolution: rate.resolution,
    credits,
    generations,
    monthlyUsd: priceOf(plan),
    chargeUsd:
      input.billing === 'annual' ? (plan.annualUsd ?? plan.monthlyUsd * 12) : plan.monthlyUsd,
    capacity: Math.floor(plan.monthlyCredits / (rate.credits * input.attempts)),
    checkedAt: snapshot.checkedAt,
  };
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\.00$/, '');
}
