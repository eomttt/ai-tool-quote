import { z } from 'zod';

const optionalValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);
const siteConfigSchema = z
  .object({
    publicSiteUrl: optionalValue.pipe(z.url().optional()).refine((value) => {
      if (!value) return true;
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        url.pathname === '/' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    }, 'PUBLIC_SITE_URL must be an HTTPS origin without a path, credentials, or query.'),
    adsenseClient: optionalValue.pipe(
      z
        .string()
        .regex(/^ca-pub-\d{16}$/)
        .optional(),
    ),
    adsenseEnabled: z.boolean().default(false),
    contactEmail: optionalValue.pipe(z.email().optional()),
  })
  .refine(
    (value) => !value.adsenseEnabled || Boolean(value.adsenseClient && value.publicSiteUrl),
    'Enabling ads requires ADSENSE_CLIENT and PUBLIC_SITE_URL.',
  );

export function createSiteConfig(input: z.input<typeof siteConfigSchema>) {
  const value = siteConfigSchema.parse(input);
  return {
    ...value,
    publicSiteUrl: value.publicSiteUrl ? new URL(value.publicSiteUrl).origin : undefined,
  };
}

export type SiteConfig = ReturnType<typeof createSiteConfig>;

export function siteConfigFromEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  const preview = Boolean(environment.VERCEL_ENV && environment.VERCEL_ENV !== 'production');
  const publicSiteUrl = preview
    ? undefined
    : environment.PUBLIC_SITE_URL ||
      (environment.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${environment.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined);
  return createSiteConfig({
    publicSiteUrl,
    adsenseClient: environment.ADSENSE_CLIENT,
    adsenseEnabled:
      !preview && environment.NODE_ENV === 'production' && environment.ADSENSE_ENABLED === 'true',
    contactEmail: environment.CONTACT_EMAIL,
  });
}
