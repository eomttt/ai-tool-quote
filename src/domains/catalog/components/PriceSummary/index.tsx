import type { QuoteInput, QuoteResult } from '../../models/model-tool';
import { formatUsd } from '../../utils/calculate-quote';

export function PriceSummary({ quote, input }: { quote: QuoteResult; input: QuoteInput }) {
  if (quote.status !== 'ready')
    return (
      <div className="price-summary">
        <span className="price-unavailable">{quote.message}</span>
        <p>공식 사이트에서 요금을 확인해 주세요.</p>
      </div>
    );
  return (
    <div className="price-summary">
      <div>
        <strong className="price">{formatUsd(quote.monthlyUsd)}</strong>
        <span className="price-unit"> / 월{input.billing === 'annual' ? ' 환산' : ' 예상'}</span>
      </div>
      <p>
        {quote.plan.name} · {quote.model} · {quote.resolution}
      </p>
      {quote.plan.note ? <p className="annual-charge">{quote.plan.note}</p> : null}
      {input.billing === 'annual' ? (
        <p className="annual-charge">연 {formatUsd(quote.chargeUsd)} 선결제</p>
      ) : null}
    </div>
  );
}
