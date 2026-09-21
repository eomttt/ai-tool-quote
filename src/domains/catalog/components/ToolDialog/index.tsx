import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../../common/components/Modal';
import type { QuoteInput, Tool } from '../../models/model-tool';
import { tools } from '../../data/tools';
import { getPricing } from '../../data/pricing';
import { calculateQuote, formatUsd } from '../../utils/calculate-quote';
import { PriceSummary } from '../PriceSummary';

interface ToolDialogProps {
  tool: Tool | undefined;
  open: boolean;
  input: QuoteInput;
  onClose: () => void;
  onSelectTool: (tool: Tool) => void;
}

export function ToolDialog({ tool, open, input, onClose, onSelectTool }: ToolDialogProps) {
  const pricing = tool ? getPricing(tool.id) : undefined;
  const quote = calculateQuote(pricing, input);
  const similarTools = tool
    ? tools
        .filter(
          (candidate) =>
            candidate.id !== tool.id &&
            candidate.media.includes(input.medium) &&
            candidate.useCases.some((useCase) => tool.useCases.includes(useCase)),
        )
        .slice(0, 3)
    : [];
  return (
    <Modal open={open} title={tool?.name ?? '도구 상세'} onClose={onClose}>
      {tool ? (
        <>
          <p className="dialog-description">{tool.description}</p>
          <div className="tags">
            {(tool.mediaTags?.[input.medium] ?? tool.tags).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="detail-quote">
            <span className="eyebrow">내 조건의 예상 비용</span>
            <PriceSummary quote={quote} input={input} />
            {quote.status === 'ready' ? (
              <p>
                {quote.generations.toLocaleString()}회 생성 · {quote.credits.toLocaleString()}크레딧
                필요
                <br />
                선택된 요금제: 월 {quote.plan.monthlyCredits.toLocaleString()}크레딧
              </p>
            ) : null}
          </div>
          {pricing ? (
            <>
              <h3>계산에 사용한 요금제</h3>
              <div className="table-scroll">
                <table className="plan-table">
                  <thead>
                    <tr>
                      <th>요금제</th>
                      <th>월 결제</th>
                      <th>연 선결제</th>
                      <th>월 크레딧</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.plans.map((plan) => (
                      <tr key={plan.name}>
                        <th>{plan.name}</th>
                        <td>{formatUsd(plan.monthlyUsd)}</td>
                        <td>
                          {plan.annualUsd === undefined ? '미확인' : formatUsd(plan.annualUsd)}
                        </td>
                        <td>{plan.monthlyCredits.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="detail-note">{pricing.note}</p>
              <p className="source-date">
                <CheckCircle2 size={15} />
                {pricing.checkedAt} 검토 · {pricing.region}
              </p>
            </>
          ) : (
            <p className="detail-note">
              요금제와 생성당 사용량을 검증한 뒤 예상 비용을 제공할 예정입니다. 현재 표시된 기능으로
              도구를 탐색할 수 있어요.
            </p>
          )}
          {tool.note ? <p className="detail-note">{tool.note}</p> : null}
          <div className="source-links">
            {(pricing?.sources ?? [tool.source]).map((source, index) => (
              <a key={source} href={source} target="_blank" rel="noopener noreferrer">
                공식 {pricing ? '가격' : '정보'} 출처 {index + 1}
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
          <h3>비슷한 용도로 살펴볼 도구</h3>
          <div className="similar-tools">
            {similarTools.map((candidate) => (
              <button key={candidate.id} onClick={() => onSelectTool(candidate)}>
                <span className={`tool-logo mini tone-${candidate.color}`}>
                  {candidate.monogram}
                </span>
                {candidate.name}
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          <a
            className="primary-button full-width"
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tool.name}에서 살펴보기
            <ArrowUpRight size={17} />
          </a>
        </>
      ) : null}
    </Modal>
  );
}
