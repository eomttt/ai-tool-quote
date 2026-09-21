import toolData from './tools.json';
import { toolCatalogSchema } from '../models/model-catalog-schema';
import type { Tool } from '../models/model-tool';

export const tools: Tool[] = toolCatalogSchema.parse(toolData);
