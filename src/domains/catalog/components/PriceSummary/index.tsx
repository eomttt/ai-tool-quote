import type { Billing, PricingSnapshot } from '../../models/model-tool';
import {
  formatAllowance,
  formatUsd,
  getEntryPlan,
  monthlyPrice,
} from '../../utils/price-information';
export function PriceSummary({
  pricing,
  billing,
}: {
  pricing: PricingSnapshot | undefined;
  billing: Billing;
}) {
  const plan = getEntryPlan(pricing, billing);
  const price = plan ? monthlyPrice(plan, billing) : undefined;
  if (!plan || price === undefined)
    return (
      <div className="price-summary">
        <strong className="price-pending">
          {pricing ? '연간 요금 확인 중' : '요금표 확인 중'}
        </strong>
        <p>{pricing ? '상세에서 월간 요금을 볼 수 있어요' : '공식 사이트에서 요금을 확인하세요'}</p>
      </div>
    );
  return (
    <div className="price-summary">
      <div>
        <strong className="price">{formatUsd(price)}</strong>
        <span> / 월{billing === 'annual' ? ' 환산' : ''}부터</span>
      </div>
      <p>
        {plan.name} · 월 {formatAllowance(plan.included)}
      </p>
      {billing === 'annual' && plan.annualUsd !== undefined ? (
        <p>연 {formatUsd(plan.annualUsd)} 선결제</p>
      ) : null}
    </div>
  );
}
