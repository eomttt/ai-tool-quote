import { useTranslation } from 'react-i18next';
import { localizePricing } from '../../utils/localize-catalog';
import type { Billing, PricingSnapshot } from '../../models/model-tool';
import {
  planAllowance,
  formatMoney,
  getEntryPlan,
  monthlyPrice,
} from '../../utils/price-information';
export function PriceSummary({
  pricing: snapshot,
  billing,
}: {
  pricing: PricingSnapshot | undefined;
  billing: Billing;
}) {
  const { t, i18n } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  const language = i18n.resolvedLanguage;
  const pricing = snapshot ? localizePricing(snapshot, catalogT) : undefined;
  const plan = getEntryPlan(pricing, billing);
  const price = plan ? monthlyPrice(plan, billing) : undefined;
  if (!plan || price === undefined)
    return (
      <div className="price-summary">
        <strong className="price-pending">
          {t(
            pricing
              ? billing === 'annual'
                ? 'price.noneAnnual'
                : 'price.noneMonthly'
              : 'price.none',
          )}
        </strong>
        <p>
          {pricing
            ? t(billing === 'annual' ? 'price.seeMonthly' : 'price.seeAnnual')
            : t('price.seeSources')}
        </p>
      </div>
    );
  return (
    <div className="price-summary">
      <div>
        <strong className="price">{formatMoney(price, pricing?.currency, language)}</strong>
        <span>{t(billing === 'annual' ? 'price.fromAnnual' : 'price.fromMonthly')}</span>
      </div>
      <p>
        {plan.name} · {planAllowance(plan, billing, language)}
      </p>
      {billing === 'annual' && plan.annualAmount !== undefined ? (
        <p>
          {t('price.annualTotal', {
            amount: formatMoney(plan.annualAmount, pricing?.currency, language),
          })}
        </p>
      ) : null}
    </div>
  );
}
