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
}: {
  tools: Tool[];
  medium: Medium;
  billing: Billing;
  onClose: () => void;
}) {
  return (
    <section className="comparison-section" aria-labelledby="comparison-title">
      <div className="comparison-heading">
        <div>
          <span className="eyebrow">SIDE BY SIDE</span>
          <h2 id="comparison-title">선택한 도구 한눈에 보기</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="비교표 닫기">
          <X />
        </Button>
      </div>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>비교 항목</th>
              {tools.map((tool) => (
                <th key={tool.id}>{tool.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>이런 작업에</th>
              {tools.map((tool) => (
                <td key={tool.id}>{tool.bestFor}</td>
              ))}
            </tr>
            <tr>
              <th>주요 기능</th>
              {tools.map((tool) => (
                <td key={tool.id}>
                  <ul>
                    {(tool.mediaFeatures?.[medium] ?? tool.features).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <th>시작 요금</th>
              {tools.map((tool) => (
                <td key={tool.id}>
                  <PriceSummary pricing={getPricing(tool.id)} billing={billing} />
                </td>
              ))}
            </tr>
            <tr>
              <th>과금 방식</th>
              {tools.map((tool) => (
                <td key={tool.id}>{getPricing(tool.id)?.summary ?? '요금표 확인 중'}</td>
              ))}
            </tr>
            <tr>
              <th>살펴볼 점</th>
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
