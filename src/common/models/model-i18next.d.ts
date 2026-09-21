import 'i18next';
import type ui from '../locales/ui.ko.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui';
    keySeparator: false;
    nsSeparator: false;
    resources: {
      ui: typeof ui;
      catalog: Record<string, string>;
    };
  }
}
