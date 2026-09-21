import { ArrowRight, Check, Plus } from 'lucide-react';
import { Button } from '../../../../common/components/Button';
import { Badge } from '../../../../common/components/Badge';
import type { Billing, Medium, Tool } from '../../models/model-tool';
import { getPricing } from '../../data/pricing';
import { PriceSummary } from '../PriceSummary';
interface ToolCardProps {
  tool: Tool;
  medium: Medium;
  billing: Billing;
  selected: boolean;
  active: boolean;
  selectionFull: boolean;
  onCompare: () => void;
  onDetail: () => void;
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
}: ToolCardProps) {
  const features = tool.mediaFeatures?.[medium] ?? tool.features;
  return (
    <article className={`tool-card ${active ? 'tool-card-active' : ''}`}>
      <button
        type="button"
        className="card-detail"
        onClick={onDetail}
        aria-label={`${tool.name} 상세 보기`}
        aria-expanded={active}
        aria-controls={active ? 'tool-detail' : undefined}
      />
      <div className="card-topline">
        <span className="tool-logo" aria-hidden="true">
          {tool.monogram}
        </span>
        <span className="card-compare-control">
          <Button
            variant={selected ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onCompare}
            aria-label={`${tool.name} ${selected ? '비교에서 제거' : '비교에 추가'}`}
            aria-pressed={selected}
            disabled={!selected && selectionFull}
          >
            {selected ? <Check /> : <Plus />} 비교
          </Button>
        </span>
      </div>
      <div className="tool-title">
        <h3>{tool.name}</h3>
      </div>
      <p className="tool-best-for">{tool.bestFor}</p>
      <ul className="card-features">
        {features.slice(0, 2).map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
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
          상세 보기 <ArrowRight size={16} />
        </span>
      </div>
    </article>
  );
}
