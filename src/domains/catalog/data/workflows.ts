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
      items.every(
        (item) =>
          item.resources.every(
            (resource) => !resource.toolId || tools.some((tool) => tool.id === resource.toolId),
          ) &&
          item.steps.every((step) => {
            const search = step.toolSearch;
            return (
              !search ||
              (new Set(search.toolIds).size === search.toolIds.length &&
                search.toolIds.every((id) =>
                  tools.some((tool) => tool.id === id && tool.media.includes(search.medium)),
                ))
            );
          }),
      ),
    'Workflow tools must exist in the catalog.',
  )
  .parse(data);
