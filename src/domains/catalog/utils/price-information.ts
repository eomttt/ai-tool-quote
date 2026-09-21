import type { Allowance, Billing, Currency, Plan, PricingSnapshot } from '../models/model-tool';
import { i18n } from '../../../common/utils/create-i18n';

export function formatMoney(amount: number, currency: Currency = 'USD', language = 'ko') {
  return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
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
export function formatAllowance(allowance: Allowance, language = 'ko') {
  const t = i18n.getFixedT(language, 'ui');
  return `${allowance.amount.toLocaleString(language)} ${t(`allowance.${allowance.unit}`)}`;
}
export function subscriptionUnitPrice(plan: Plan, billing: Billing, language = 'ko') {
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
        ? i18n.getFixedT(language, 'ui')('allowance.gpuHour')
        : formatAllowance({ amount: unitAmount, unit: allowance.unit }, language),
  };
}
export function planAllowance(plan: Plan, billing: Billing, language = 'ko') {
  const t = i18n.getFixedT(language, 'ui');
  if (monthlyPrice(plan, billing) === undefined) return t('allowance.unavailable');
  if (billing === 'annual' && plan.annualIncluded)
    return t('allowance.annual', { amount: formatAllowance(plan.annualIncluded, language) });
  if (plan.included)
    return t('allowance.monthly', { amount: formatAllowance(plan.included, language) });
  return plan.allowanceNote ?? t('allowance.featureLimits');
}

export function formatReviewDate(date: string, language = 'ko') {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
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
