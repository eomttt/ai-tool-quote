import { z } from 'zod';

export const pageDataSchema = z
  .object({
    language: z.enum(['ko', 'en']),
    kind: z.enum(['catalog', 'about', 'privacy', 'not-found']),
    medium: z.enum(['video', 'image']),
    year: z.number().int(),
    adsEnabled: z.boolean(),
    contactEmail: z.string().email().optional(),
  })
  .strict();

export type PageData = z.infer<typeof pageDataSchema>;
export type Language = PageData['language'];
