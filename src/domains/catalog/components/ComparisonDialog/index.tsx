import { ArrowUpRight } from 'lucide-react';
import { Modal } from '../../../../common/components/Modal';
import type { QuoteInput, Tool } from '../../models/model-tool';
import { getPricing } from '../../data/pricing';
import { calculateQuote } from '../../utils/calculate-quote';
import { PriceSummary } from '../PriceSummary';

interface ComparisonDialogProps {
  open: boolean;
  tools: Tool[];
  input: QuoteInput;
  onClose: () => void;
}

export function ComparisonDialog({ open, tools, input, onClose }: ComparisonDialogProps) {
  return (
    <Modal open={open} title="나에게 맞는 도구 비교" onClose={onClose} wide>
      <p className="dialog-description">
        월 {input.quantity.toLocaleString()}
        {input.medium === 'video' ? `개 · ${input.seconds}초 영상` : '장 이미지'} · 결과물당{' '}
        {input.attempts}회 생성 · {input.billing === 'monthly' ? '월간' : '연간'} 결제
      </p>
      <div
        className="comparison-grid"
        style={{ gridTemplateColumns: `repeat(${tools.length}, minmax(0, 1fr))` }}
      >
        {tools.map((tool) => {
          const snapshot = getPricing(tool.id);
          const quote = calculateQuote(snapshot, input);
          return (
            <section key={tool.id} className="comparison-column">
              <span className={`tool-logo tone-${tool.color}`}>{tool.monogram}</span>
              <h3>{tool.name}</h3>
              <PriceSummary quote={quote} input={input} />
              <dl>
                <dt>제작 용도</dt>
                <dd>{(tool.mediaTags?.[input.medium] ?? tool.tags).join(' · ')}</dd>
                <dt>필요한 크레딧</dt>
                <dd>
                  {quote.status === 'ready'
                    ? `${quote.credits.toLocaleString()} / 월`
                    : '계산 정보 미확인'}
                </dd>
                <dt>계산에 사용한 모델</dt>
                <dd>
                  {quote.status === 'ready'
                    ? `${quote.model} · ${quote.resolution}`
                    : '모델별 조건 확인 필요'}
                </dd>
                <dt>가격 확인일</dt>
                <dd>{snapshot?.checkedAt ?? '검토 전'}</dd>
                <dt>사용 조건</dt>
                <dd>
                  {snapshot?.note ?? '공식 요금표에서 상업적 이용과 생성 제한을 확인해 주세요.'}
                </dd>
              </dl>
              <a
                className="secondary-button"
                href={tool.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                공식 정보
                <ArrowUpRight size={15} />
              </a>
            </section>
          );
        })}
      </div>
      <p className="detail-note">
        모델과 해상도가 다르면 결과 품질도 달라질 수 있습니다. 견적은 등록된 요금제 중 필요한 월
        크레딧을 충족하는 플랜이며, 추가 팩·세금·할인은 제외합니다.
      </p>
    </Modal>
  );
}
