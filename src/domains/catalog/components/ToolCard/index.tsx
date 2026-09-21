import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { Button } from '../../../../common/components/Button';
import { Badge } from '../../../../common/components/Badge';
import type { Billing, Medium, Tool } from '../../models/model-tool';
import { getPricing } from '../../data/pricing';
import { PriceSummary } from '../PriceSummary';
import { ToolLogo } from '../ToolLogo';
interface ToolCardProps {
  tool: Tool;
  medium: Medium;
  billing: Billing;
  selected: boolean;
  active: boolean;
  selectionFull: boolean;
  onCompare: () => void;
  onDetail: () => void;
  recommendation?: { rank: number; reason: string; situation?: string };
}
export function ToolCard({
  tool,
  medium,
  billing,
  selected,
  active,
  selectionFull,
  onCompare,
  onDetail,
  recommendation,
}: ToolCardProps) {
  const { t } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  const features = tool.mediaFeatures?.[medium] ?? tool.features;
  return (
    <article className={`tool-card ${active ? 'tool-card-active' : ''}`}>
      <button
        type="button"
        className="card-detail"
        onClick={onDetail}
        aria-label={t('detail.open', { name: tool.name })}
        aria-expanded={active}
        aria-controls={active ? 'tool-detail' : undefined}
      />
      <div className="card-topline">
        <ToolLogo tool={tool} />
        {recommendation ? (
          <span
            aria-label={t('recommendation.rank', { count: recommendation.rank })}
            className="text-sm text-muted-foreground"
          >
            {recommendation.rank.toString().padStart(2, '0')}
          </span>
        ) : null}
        <span className="card-compare-control">
          <Button
            variant={selected ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onCompare}
            aria-label={t(selected ? 'compare.exclude' : 'compare.add', { name: tool.name })}
            aria-pressed={selected}
            disabled={!selected && selectionFull}
          >
            {selected ? <Check /> : <Plus />} {t('compare.label')}
          </Button>
        </span>
      </div>
      <div className="tool-title">
        <h3>{tool.name}</h3>
      </div>
      <p className="tool-best-for">{tool.bestFor}</p>
      {recommendation ? (
        <div className="recommendation-reason">
          <span>
            {t('recommendation.reason')}
            {recommendation.situation ? ` · ${catalogT(recommendation.situation)}` : ''}
          </span>
          <p>{recommendation.reason}</p>
        </div>
      ) : (
        <ul className="card-features">
          {features.slice(0, 2).map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      )}
      <div className="tags">
        {(tool.mediaTags?.[medium] ?? tool.tags).slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="card-bottom">
        <PriceSummary pricing={getPricing(tool.id)} billing={billing} />
        <span
          className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
          aria-hidden="true"
        >
          {t('detail.action')} <ArrowRight size={16} />
        </span>
      </div>
    </article>
  );
}
