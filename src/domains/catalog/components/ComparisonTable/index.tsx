import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '../../../../common/components/Button';
import type { Billing, Medium, Tool } from '../../models/model-tool';
import { getPricing } from '../../data/pricing';
import { PriceSummary } from '../PriceSummary';
export function ComparisonTable({
  tools,
  medium,
  billing,
  onClose,
  toolMedia,
}: {
  tools: Tool[];
  medium: Medium;
  billing: Billing;
  onClose: () => void;
  toolMedia?: Record<string, Medium>;
}) {
  const { t } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  return (
    <section className="comparison-section" aria-labelledby="comparison-title">
      <div className="comparison-heading">
        <div>
          <span className="eyebrow">{t('compare.eyebrow')}</span>
          <h2 id="comparison-title">{t('compare.title')}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('compare.close')}>
          <X />
        </Button>
      </div>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>{t('compare.item')}</th>
              {tools.map((tool) => (
                <th key={tool.id}>{tool.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>{t('compare.bestFor')}</th>
              {tools.map((tool) => (
                <td key={tool.id}>{tool.bestFor}</td>
              ))}
            </tr>
            <tr>
              <th>{t('compare.features')}</th>
              {tools.map((tool) => (
                <td key={tool.id}>
                  <ul>
                    {(tool.mediaFeatures?.[toolMedia?.[tool.id] ?? medium] ?? tool.features).map(
                      (feature) => (
                        <li key={feature}>{feature}</li>
                      ),
                    )}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <th>{t('compare.price')}</th>
              {tools.map((tool) => (
                <td key={tool.id}>
                  <PriceSummary pricing={getPricing(tool.id)} billing={billing} />
                </td>
              ))}
            </tr>
            <tr>
              <th>{t('compare.billing')}</th>
              {tools.map((tool) => {
                const summary = getPricing(tool.id)?.summary;
                return (
                  <td key={tool.id}>
                    {summary
                      ? catalogT(summary, { defaultValue: summary })
                      : t('compare.noPricing')}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th>{t('compare.consideration')}</th>
              {tools.map((tool) => (
                <td key={tool.id}>{tool.consideration}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
