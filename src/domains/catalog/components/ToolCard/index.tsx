import { ArrowUpRight, Check, Plus } from 'lucide-react';
import type { QuoteInput, Tool } from '../../models/model-tool';
import { getPricing } from '../../data/pricing';
import { calculateQuote } from '../../utils/calculate-quote';
import { PriceSummary } from '../PriceSummary';

interface ToolCardProps {
  tool: Tool;
  input: QuoteInput;
  selected: boolean;
  selectionFull: boolean;
  onCompare: () => void;
  onDetail: () => void;
}

export function ToolCard({
  tool,
  input,
  selected,
  selectionFull,
  onCompare,
  onDetail,
}: ToolCardProps) {
  const snapshot = getPricing(tool.id);
  const quote = calculateQuote(snapshot, input);
  return (
    <article className={`tool-card ${selected ? 'tool-card-selected' : ''}`}>
      <div className="card-topline">
        <span className={`tool-logo tone-${tool.color}`} aria-hidden="true">
          {tool.monogram}
        </span>
        <span className={`status-label ${quote.status === 'ready' ? 'status-verified' : ''}`}>
          {quote.status === 'ready' ? (
            <>
              <span className="status-dot" />
              견적 가능
            </>
          ) : snapshot ? (
            '일부 조건 견적'
          ) : (
            '도구 탐색'
          )}
        </span>
      </div>
      <button className="tool-title" onClick={onDetail}>
        <h3>{tool.name}</h3>
        <ArrowUpRight size={17} />
      </button>
      <p className="tool-description">{tool.description}</p>
      <div className="tags">
        {(tool.mediaTags?.[input.medium] ?? tool.tags).slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-bottom">
        <PriceSummary quote={quote} input={input} />
        <button
          className={`compare-toggle ${selected ? 'is-selected' : ''}`}
          onClick={onCompare}
          aria-label={`${tool.name} ${selected ? '비교에서 제거' : '비교에 추가'}`}
          aria-pressed={selected}
          disabled={!selected && selectionFull}
        >
          {selected ? <Check size={17} /> : <Plus size={17} />}
          <span>비교</span>
        </button>
      </div>
      <button className="card-source" onClick={onDetail}>
        {snapshot
          ? `${snapshot.checkedAt.replaceAll('-', '.')} 가격 확인 · 계산 근거`
          : '기능·가격 출처 보기'}
        <ArrowUpRight size={13} />
      </button>
    </article>
  );
}
