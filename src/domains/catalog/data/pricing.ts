import pricingData from './pricing.json';
import auditData from './pricing-audits.json';
import { pricingAuditSchema, pricingCatalogSchema } from '../models/model-catalog-schema';
import type { PricingSnapshot } from '../models/model-tool';
import { tools } from './tools';

export const pricingSnapshots: PricingSnapshot[] = pricingCatalogSchema.parse(pricingData);
export const pricingAudits = pricingAuditSchema.parse(auditData);
if (
  pricingAudits.length !== tools.length ||
  tools.some((tool) => !pricingAudits.some((audit) => audit.toolId === tool.id))
) {
  throw new Error('모든 도구에 가격 확인 기록이 필요합니다.');
}
for (const snapshot of pricingSnapshots) {
  if (!tools.some((tool) => tool.id === snapshot.toolId)) {
    throw new Error(`가격 정보의 도구 id를 찾을 수 없습니다: ${snapshot.toolId}`);
  }
}

export function getPricing(toolId: string) {
  return pricingSnapshots.find((snapshot) => snapshot.toolId === toolId);
}
export function getPricingAudit(toolId: string) {
  return pricingAudits.find((audit) => audit.toolId === toolId);
}
