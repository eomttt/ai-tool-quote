import { ArrowUpRight, ArrowRight, X } from 'lucide-react';
import { Button } from '../../../../common/components/Button';
import { Badge } from '../../../../common/components/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../common/components/Tabs';
import { Separator } from '../../../../common/components/Separator';
import type { Billing, Medium, Tool } from '../../models/model-tool';
import { tools } from '../../data/tools';
import { getPricing, getPricingAudit } from '../../data/pricing';
import {
  formatAllowance,
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
  const pricing = getPricing(tool.id);
  const audit = getPricingAudit(tool.id);
  const similarTools = tools
    .filter(
      (candidate) =>
        candidate.id !== tool.id &&
        candidate.media.includes(medium) &&
        candidate.useCases.some((useCase) => tool.useCases.includes(useCase)),
    )
    .slice(0, 3);
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
        <span className="eyebrow">TOOL OVERVIEW</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="상세 패널 닫기">
          <X />
        </Button>
      </div>
      <div className="peek-scroll" key={tool.id}>
        <div className="peek-identity">
          <span className="tool-logo large" aria-hidden="true">
            {tool.monogram}
          </span>
          <div>
            <h2 id="peek-title">{tool.name}</h2>
            <p>
              {tool.media.map((item) => (item === 'video' ? '영상' : '이미지')).join(' · ')} 제작
            </p>
          </div>
        </div>
        <p className="peek-description">{tool.description}</p>
        <Button asChild className="w-full">
          <a href={tool.website} target="_blank" rel="noopener noreferrer">
            공식 사이트
            <ArrowUpRight />
          </a>
        </Button>
        <Tabs defaultValue="features" className="peek-tabs">
          <TabsList className="w-full">
            <TabsTrigger value="features">특징과 활용</TabsTrigger>
            <TabsTrigger value="pricing">
              요금제{pricing ? ` ${pricing.plans.length}` : ''}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="peek-content">
            <section>
              <h3>이런 작업에 잘 맞아요</h3>
              <p>{tool.bestFor}</p>
            </section>
            <section>
              <h3>어떤 기능이 있나요?</h3>
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
              <h3>선택 전에 살펴보세요</h3>
              <p>{tool.consideration}</p>
              {tool.note ? <p>{tool.note}</p> : null}
            </section>
            <a className="source-link" href={tool.source} target="_blank" rel="noopener noreferrer">
              공식 기능·이용 조건 확인
              <ArrowUpRight size={14} />
            </a>
            <Separator />
            <section>
              <h3>함께 살펴볼 도구</h3>
              <div className="similar-tools">
                {similarTools.map((candidate) => (
                  <Button
                    variant="ghost"
                    key={candidate.id}
                    onClick={() => onSelectTool(candidate)}
                  >
                    <span className="tool-logo mini">{candidate.monogram}</span>
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
                    const unit = subscriptionUnitPrice(plan, billing);
                    return (
                      <section className="plan-card" key={plan.name}>
                        <div className="plan-title">
                          <h3>{plan.name}</h3>
                          <strong>
                            {price === undefined
                              ? '해당 주기 미확인'
                              : formatMoney(price, pricing.currency)}
                            {price !== undefined ? (
                              <small> / 월{billing === 'annual' ? ' 환산' : ''}</small>
                            ) : null}
                          </strong>
                        </div>
                        <p>{planAllowance(plan, billing)}</p>
                        {plan.included && plan.allowanceNote ? <p>{plan.allowanceNote}</p> : null}
                        {billing === 'annual' ? (
                          <p>
                            {plan.annualAmount !== undefined
                              ? `연 ${formatMoney(plan.annualAmount, pricing.currency)} 선결제`
                              : plan.monthlyAmount !== undefined
                                ? `월간 결제는 ${formatMoney(plan.monthlyAmount, pricing.currency)} / 월`
                                : '월간 요금 미확인'}
                          </p>
                        ) : null}
                        {unit ? (
                          <p className="unit-rate">
                            구독료 환산 · {unit.label}당 약{' '}
                            {formatMoney(unit.priceAmount, pricing.currency)}
                          </p>
                        ) : null}
                        {plan.note ? <p>{plan.note}</p> : null}
                      </section>
                    );
                  })}
                </div>
                {pricing.topUps.length > 0 || pricing.topUpNote ? (
                  <section>
                    <h3>추가 구매 가격</h3>
                    {pricing.topUps.map((pack) => (
                      <div className="topup-row" key={pack.amount}>
                        <span>{formatAllowance(pack)}</span>
                        <strong>{formatMoney(pack.priceAmount, pricing.currency)}</strong>
                      </div>
                    ))}
                    {pricing.topUpNote ? <p>{pricing.topUpNote}</p> : null}
                  </section>
                ) : null}
                {pricing.freeTier ? (
                  <section>
                    <h3>무료로 시작하기</h3>
                    <p>{pricing.freeTier}</p>
                  </section>
                ) : null}
                <p className="muted-note">{pricing.note}</p>
                <p className="muted-note">
                  구독료 환산은 같은 결제 주기의 요금을 포함량으로 나눈 값이에요. 실제 추가 구매
                  단가와 다르며, 도구마다 같은 크레딧으로 만들 수 있는 결과물도 달라요.
                </p>
                <Separator />
                <p className="source-date">
                  {pricing.checkedAt} 확인{isPricingStale(pricing) ? ' · 재확인 필요' : ''}
                  <br />
                  {pricing.region}
                </p>
              </>
            ) : (
              <section className="pricing-empty">
                <h3>가격을 확정하지 못했어요</h3>
                <p>아래 확인 결과와 공식 출처를 참고해 주세요.</p>
              </section>
            )}
            {audit ? (
              <section aria-label="가격 출처와 확인 결과">
                <h3>출처와 확인 결과</h3>
                <p className="source-date">
                  {audit.checkedAt} 확인 ·{' '}
                  {
                    {
                      verified: '공개 요금 확인',
                      partial: '확인한 요금만 등록',
                      unavailable: '최신 요금 미확인',
                      conflicting: '공식 자료 간 차이 있음',
                    }[audit.status]
                  }
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
                    {new URL(source.url).hostname} ·{' '}
                    {
                      {
                        'http-html-text': '공식 페이지',
                        browser: '브라우저 확인',
                        'official-web': '공식 문서 확인',
                      }[source.method]
                    }
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
