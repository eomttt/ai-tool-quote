import toolData from './tools.json';
import { toolCatalogSchema } from '../models/model-catalog-schema';
import type { Tool, UseCase } from '../models/model-tool';

export const tools: Tool[] = toolCatalogSchema.parse(toolData);

export const useCases = [
  { id: 'all', label: '전체' },
  { id: 'generate', label: '장면·이미지 생성' },
  { id: 'avatar', label: '아바타·발표' },
  { id: 'edit', label: '편집·보정' },
  { id: 'design', label: '디자인·일러스트' },
  { id: 'product', label: '제품·광고 소재' },
] satisfies { id: UseCase; label: string }[];
