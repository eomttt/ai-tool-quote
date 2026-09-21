import type { Allowance, Billing, Plan, PricingSnapshot } from '../models/model-tool';
export function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}
export function monthlyPrice(plan: Plan, billing: Billing) {
  return billing === 'monthly'
    ? plan.monthlyUsd
    : plan.annualUsd === undefined
      ? undefined
      : plan.annualUsd / 12;
}
export function getEntryPlan(pricing: PricingSnapshot | undefined, billing: Billing) {
  return pricing?.plans
    .filter((plan) => monthlyPrice(plan, billing) !== undefined)
    .toSorted(
      (a, b) => (monthlyPrice(a, billing) ?? Infinity) - (monthlyPrice(b, billing) ?? Infinity),
    )[0];
}
export function formatAllowance(allowance: Allowance) {
  const label = { credits: '크레딧', tokens: 'Fast 토큰', 'gpu-minutes': 'Fast GPU분' };
  return `${allowance.amount.toLocaleString('ko-KR')} ${label[allowance.unit]}`;
}
export function subscriptionUnitPrice(plan: Plan, billing: Billing) {
  const price = monthlyPrice(plan, billing);
  if (price === undefined) return undefined;
  const unitAmount = plan.included.unit === 'gpu-minutes' ? 60 : 1000;
  return {
    priceUsd: (price / plan.included.amount) * unitAmount,
    label:
      plan.included.unit === 'gpu-minutes'
        ? 'Fast GPU 1시간'
        : formatAllowance({ amount: unitAmount, unit: plan.included.unit }),
  };
}
export function isPricingStale(pricing: PricingSnapshot, now = new Date()) {
  return (
    now.getTime() - Date.parse(`${pricing.checkedAt}T00:00:00Z`) >
    pricing.reviewAfterDays * 86_400_000
  );
}
