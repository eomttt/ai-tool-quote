import pricingData from './pricing.json';
import { pricingCatalogSchema } from '../models/model-catalog-schema';
import type { PricingSnapshot } from '../models/model-tool';
import { tools } from './tools';

export const pricingSnapshots: PricingSnapshot[] = pricingCatalogSchema.parse(pricingData);
for (const snapshot of pricingSnapshots) {
  if (!tools.some((tool) => tool.id === snapshot.toolId)) {
    throw new Error(`가격 정보의 도구 id를 찾을 수 없습니다: ${snapshot.toolId}`);
  }
}

export function getPricing(toolId: string) {
  return pricingSnapshots.find((snapshot) => snapshot.toolId === toolId);
}
