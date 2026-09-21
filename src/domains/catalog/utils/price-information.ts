import type { Allowance, Billing, Currency, Plan, PricingSnapshot } from '../models/model-tool';
export function formatMoney(amount: number, currency: Currency = 'USD') {
  return new Intl.NumberFormat(currency === 'KRW' ? 'ko-KR' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(amount);
}
export function monthlyPrice(plan: Plan, billing: Billing) {
  return billing === 'monthly'
    ? plan.monthlyAmount
    : plan.annualAmount === undefined
      ? undefined
      : plan.annualAmount / 12;
}
export function getEntryPlan(pricing: PricingSnapshot | undefined, billing: Billing) {
  return pricing?.plans
    .filter((plan) => monthlyPrice(plan, billing) !== undefined)
    .toSorted(
      (a, b) => (monthlyPrice(a, billing) ?? Infinity) - (monthlyPrice(b, billing) ?? Infinity),
    )[0];
}
export function formatAllowance(allowance: Allowance) {
  const label = {
    credits: '크레딧',
    tokens: '토큰',
    'fast-tokens': 'Fast 토큰',
    'gpu-minutes': 'Fast GPU분',
    'compute-units': '컴퓨트 유닛',
  };
  return `${allowance.amount.toLocaleString('ko-KR')} ${label[allowance.unit]}`;
}
export function subscriptionUnitPrice(plan: Plan, billing: Billing) {
  const price = monthlyPrice(plan, billing);
  const allowance =
    billing === 'annual' && plan.annualIncluded ? plan.annualIncluded : plan.included;
  if (price === undefined || !allowance) return undefined;
  const monthlyAllowance =
    billing === 'annual' && plan.annualIncluded ? allowance.amount / 12 : allowance.amount;
  const unitAmount = allowance.unit === 'gpu-minutes' ? 60 : 1000;
  return {
    priceAmount: (price / monthlyAllowance) * unitAmount,
    label:
      allowance.unit === 'gpu-minutes'
        ? 'Fast GPU 1시간'
        : formatAllowance({ amount: unitAmount, unit: allowance.unit }),
  };
}
export function planAllowance(plan: Plan, billing: Billing) {
  if (monthlyPrice(plan, billing) === undefined) return '선택한 결제 주기의 포함량 미확인';
  if (billing === 'annual' && plan.annualIncluded)
    return `연 ${formatAllowance(plan.annualIncluded)} 포함`;
  if (plan.included) return `월 ${formatAllowance(plan.included)} 포함`;
  return plan.allowanceNote ?? '기능별 이용 한도 적용';
}
export function compareSubscriptionPrices(
  a: PricingSnapshot | undefined,
  b: PricingSnapshot | undefined,
  billing: Billing,
) {
  const planA = getEntryPlan(a, billing);
  const planB = getEntryPlan(b, billing);
  if (!planA || !a) return planB ? 1 : 0;
  if (!planB || !b) return -1;
  if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
  return (monthlyPrice(planA, billing) ?? 0) - (monthlyPrice(planB, billing) ?? 0);
}
export function isPricingStale(pricing: PricingSnapshot, now = new Date()) {
  return (
    now.getTime() - Date.parse(`${pricing.checkedAt}T00:00:00Z`) >
    pricing.reviewAfterDays * 86_400_000
  );
}
