import { z } from 'zod';
import data from './workflows.json';
import { workflowSchema } from '../models/model-workflow';
import { tools } from './tools';

export const workflows = z
  .array(workflowSchema)
  .min(1)
  .refine(
    (items) =>
      new Set(items.map((item) => item.id)).size === items.length &&
      items.every((item) =>
        item.resources.every(
          (resource) => !resource.toolId || tools.some((tool) => tool.id === resource.toolId),
        ),
      ),
    'Workflow tools must exist in the catalog.',
  )
  .parse(data);
