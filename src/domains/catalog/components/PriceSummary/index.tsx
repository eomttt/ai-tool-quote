import type { Billing, PricingSnapshot } from '../../models/model-tool';
import {
  planAllowance,
  formatMoney,
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
          {pricing ? `${billing === 'annual' ? '연간' : '월간'} 요금 정보 없음` : '가격 정보 없음'}
        </strong>
        <p>
          {pricing
            ? `${billing === 'annual' ? '월간' : '연간'} 요금은 상세에서 볼 수 있어요`
            : '상세에서 출처와 확인 결과를 볼 수 있어요'}
        </p>
      </div>
    );
  return (
    <div className="price-summary">
      <div>
        <strong className="price">{formatMoney(price, pricing?.currency)}</strong>
        <span> / 월{billing === 'annual' ? ' 환산' : ''}부터</span>
      </div>
      <p>
        {plan.name} · {planAllowance(plan, billing)}
      </p>
      {billing === 'annual' && plan.annualAmount !== undefined ? (
        <p>연 {formatMoney(plan.annualAmount, pricing?.currency)} 선결제</p>
      ) : null}
    </div>
  );
}
