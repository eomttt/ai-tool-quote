import { headers } from 'next/headers';
import { App } from '../router/App';
import { preferredLanguage } from '../common/utils/page-route';

export default async function NotFound() {
  const requestHeaders = await headers();
  const language = preferredLanguage(
    requestHeaders.get('x-app-language') ?? requestHeaders.get('accept-language') ?? '',
  );
  return (
    <App
      key={language}
      page={{
        language,
        kind: 'not-found',
        medium: 'video',
        year: new Date().getUTCFullYear(),
        adsEnabled: false,
      }}
    />
  );
}
