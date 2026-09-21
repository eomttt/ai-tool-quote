import { useTranslation } from 'react-i18next';
import { localizeTool, localizePricing, localizeAudit } from '../../utils/localize-catalog';
import { ArrowUpRight, ArrowRight, X } from 'lucide-react';
import { Button } from '../../../../common/components/Button';
import { Badge } from '../../../../common/components/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../common/components/Tabs';
import { Separator } from '../../../../common/components/Separator';
import type { Billing, Medium, Tool } from '../../models/model-tool';
import { tools } from '../../data/tools';
import { getPricing, getPricingAudit } from '../../data/pricing';
import { ToolLogo } from '../ToolLogo';
import {
  formatAllowance,
  formatReviewDate,
  formatMoney,
  isPricingStale,
  monthlyPrice,
  planAllowance,
  subscriptionUnitPrice,
} from '../../utils/price-information';
interface ToolPeekProps {
  tool: Tool;
  medium: Medium;
  billing: Billing;
  onClose: () => void;
  onSelectTool: (tool: Tool) => void;
}
export function ToolPeek({ tool, medium, billing, onClose, onSelectTool }: ToolPeekProps) {
  const { t, i18n } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  const language = i18n.resolvedLanguage;
  const snapshot = getPricing(tool.id);
  const pricing = snapshot ? localizePricing(snapshot, catalogT) : undefined;
  const sourceAudit = getPricingAudit(tool.id);
  const audit = sourceAudit ? localizeAudit(sourceAudit, catalogT) : undefined;
  const similarTools = tools
    .filter(
      (candidate) =>
        candidate.id !== tool.id &&
        candidate.media.includes(medium) &&
        candidate.useCases.some((useCase) => tool.useCases.includes(useCase)),
    )
    .slice(0, 3)
    .map((candidate) => localizeTool(candidate, catalogT));
  return (
    <aside
      className="tool-peek"
      id="tool-detail"
      aria-labelledby="peek-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="peek-header">
        <span className="eyebrow">{t('detail.eyebrow')}</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('detail.close')}>
          <X />
        </Button>
      </div>
      <div className="peek-scroll" key={tool.id}>
        <div className="peek-identity">
          <ToolLogo tool={tool} size="large" />
          <div>
            <h2 id="peek-title">{tool.name}</h2>
            <p>
              {t('detail.media', {
                media: tool.media.map((item) => t(`medium.${item}`)).join(' · '),
              })}
            </p>
          </div>
        </div>
        <p className="peek-description">{tool.description}</p>
        <Button asChild className="w-full">
          <a href={tool.website} target="_blank" rel="noopener noreferrer">
            {t('detail.website')}
            <ArrowUpRight />
          </a>
        </Button>
        <Tabs defaultValue="features" className="peek-tabs">
          <TabsList className="w-full">
            <TabsTrigger value="features">{t('detail.features')}</TabsTrigger>
            <TabsTrigger value="pricing">
              {t('detail.plans')}
              {pricing ? ` ${pricing.plans.length}` : ''}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="peek-content">
            <section>
              <h3>{t('detail.bestFor')}</h3>
              <p>{tool.bestFor}</p>
            </section>
            <section>
              <h3>{t('detail.what')}</h3>
              <ul className="feature-list">
                {(tool.mediaFeatures?.[medium] ?? tool.features).map((feature, index) => (
                  <li key={feature}>
                    <span>0{index + 1}</span>
                    <p>{feature}</p>
                  </li>
                ))}
              </ul>
            </section>
            <div className="tags">
              {(tool.mediaTags?.[medium] ?? tool.tags).map((tag) => (
                <Badge variant="outline" key={tag}>
                  {tag}
                </Badge>
              ))}
            </div>
            <section className="consideration">
              <h3>{t('detail.consideration')}</h3>
              <p>{tool.consideration}</p>
              {tool.note ? <p>{tool.note}</p> : null}
            </section>
            <a className="source-link" href={tool.source} target="_blank" rel="noopener noreferrer">
              {t('detail.terms')}
              <ArrowUpRight size={14} />
            </a>
            <Separator />
            <section>
              <h3>{t('detail.similar')}</h3>
              <div className="similar-tools">
                {similarTools.map((candidate) => (
                  <Button
                    variant="ghost"
                    key={candidate.id}
                    onClick={() => onSelectTool(candidate)}
                  >
                    <ToolLogo tool={candidate} size="mini" />
                    <span>{candidate.name}</span>
                    <ArrowRight />
                  </Button>
                ))}
              </div>
            </section>
          </TabsContent>
          <TabsContent value="pricing" className="peek-content">
            {pricing ? (
              <>
                <p>{pricing.summary}</p>
                <div className="pricing-plans">
                  {pricing.plans.map((plan) => {
                    const price = monthlyPrice(plan, billing);
                    const unit = subscriptionUnitPrice(plan, billing, language);
                    return (
                      <section className="plan-card" key={plan.name}>
                        <div className="plan-title">
                          <h3>{plan.name}</h3>
                          <strong>
                            {price === undefined
                              ? t(billing === 'annual' ? 'price.noneAnnual' : 'price.noneMonthly')
                              : formatMoney(price, pricing.currency, language)}
                            {price !== undefined ? (
                              <small>
                                {t(
                                  billing === 'annual'
                                    ? 'price.annualSuffix'
                                    : 'price.monthlySuffix',
                                )}
                              </small>
                            ) : null}
                          </strong>
                        </div>
                        {price !== undefined ? (
                          <>
                            <p>{planAllowance(plan, billing, language)}</p>
                            {plan.included && plan.allowanceNote ? (
                              <p>{plan.allowanceNote}</p>
                            ) : null}
                          </>
                        ) : null}
                        {billing === 'annual' ? (
                          <p>
                            {plan.annualAmount !== undefined
                              ? t('price.annualTotal', {
                                  amount: formatMoney(
                                    plan.annualAmount,
                                    pricing.currency,
                                    language,
                                  ),
                                })
                              : plan.monthlyAmount !== undefined
                                ? t('price.monthlyAlternative', {
                                    amount: formatMoney(
                                      plan.monthlyAmount,
                                      pricing.currency,
                                      language,
                                    ),
                                  })
                                : t('price.noneMonthly')}
                          </p>
                        ) : null}
                        {unit ? (
                          <p className="unit-rate">
                            {t('price.unitRate', {
                              unit: unit.label,
                              amount: formatMoney(unit.priceAmount, pricing.currency, language),
                            })}
                          </p>
                        ) : null}
                        {plan.note ? <p>{plan.note}</p> : null}
                      </section>
                    );
                  })}
                </div>
                {pricing.topUps.length > 0 || pricing.topUpNote ? (
                  <section>
                    <h3>{t('price.topups')}</h3>
                    {pricing.topUps.map((pack) => (
                      <div className="topup-row" key={pack.amount}>
                        <span>{formatAllowance(pack, language)}</span>
                        <strong>{formatMoney(pack.priceAmount, pricing.currency, language)}</strong>
                      </div>
                    ))}
                    {pricing.topUpNote ? <p>{pricing.topUpNote}</p> : null}
                  </section>
                ) : null}
                {pricing.freeTier ? (
                  <section>
                    <h3>{t('price.free')}</h3>
                    <p>{pricing.freeTier}</p>
                  </section>
                ) : null}
                <p className="muted-note">{pricing.note}</p>
                <p className="muted-note">{t('price.unitNote')}</p>
                <Separator />
                <p className="source-date">
                  {t('price.checked', { date: formatReviewDate(pricing.checkedAt, language) })}
                  {isPricingStale(pricing) ? ` · ${t('price.stale')}` : ''}
                  <br />
                  {pricing.region}
                </p>
              </>
            ) : (
              <section className="pricing-empty">
                <h3>{t('price.emptyTitle')}</h3>
                <p>{t('price.emptyDescription')}</p>
              </section>
            )}
            {audit ? (
              <section aria-label={t('source.label')}>
                <h3>{t('source.title')}</h3>
                <p className="source-date">
                  {t('price.checked', { date: formatReviewDate(audit.checkedAt, language) })} ·{' '}
                  {t(`source.${audit.status}`)}
                </p>
                {audit.note !== pricing?.note ? <p>{audit.note}</p> : null}
                {audit.sources.map((source) => (
                  <a
                    className="source-link"
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {new URL(source.url).hostname} · {t(`source.${source.method}`)}
                    <ArrowUpRight size={14} />
                  </a>
                ))}
              </section>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
