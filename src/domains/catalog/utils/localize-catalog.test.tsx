import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { createAppI18n } from '../../../common/utils/create-i18n';
import { tools } from '../data/tools';
import { pricingAudits, pricingSnapshots } from '../data/pricing';
import { localizeAudit, localizePricing, localizeTool } from './localize-catalog';
import { formatAllowance, formatMoney, formatReviewDate, planAllowance } from './price-information';
import { ToolPeek } from '../components/ToolPeek';
import { ToolCard } from '../components/ToolCard';
import { ComparisonTable } from '../components/ComparisonTable';
import { PriceSummary } from '../components/PriceSummary';

describe('localized catalog', () => {
  it('translates all visible catalog text without changing numeric prices, IDs, or sources', async () => {
    const instance = createAppI18n();
    await instance.changeLanguage('en');
    const t = instance.getFixedT('en', 'catalog');
    const source = JSON.stringify({ tools, pricingSnapshots, pricingAudits });
    for (const tool of tools) {
      const { aliases: _aliases, ...localized } = localizeTool(tool, t);
      expect(JSON.stringify(localized)).not.toMatch(/[가-힣]/);
      expect(localized.id).toBe(tool.id);
      expect(localized.website).toBe(tool.website);
    }
    for (const pricing of pricingSnapshots) {
      const localized = localizePricing(pricing, t);
      expect(JSON.stringify(localized)).not.toMatch(/[가-힣]/);
      expect(localized.currency).toBe(pricing.currency);
      expect(localized.sources).toEqual(pricing.sources);
      expect(
        localized.plans.map(({ monthlyAmount, annualAmount, included, annualIncluded }) => ({
          monthlyAmount,
          annualAmount,
          included,
          annualIncluded,
        })),
      ).toEqual(
        pricing.plans.map(({ monthlyAmount, annualAmount, included, annualIncluded }) => ({
          monthlyAmount,
          annualAmount,
          included,
          annualIncluded,
        })),
      );
    }
    for (const audit of pricingAudits) expect(localizeAudit(audit, t).note).not.toMatch(/[가-힣]/);
    expect(JSON.stringify({ tools, pricingSnapshots, pricingAudits })).toBe(source);
  });

  it('renders every tool card and detail panel in English', async () => {
    const instance = createAppI18n();
    await instance.changeLanguage('en');
    const t = instance.getFixedT('en', 'catalog');
    for (const source of tools) {
      const tool = localizeTool(source, t);
      const html = renderToStaticMarkup(
        <I18nextProvider i18n={instance}>
          <ToolCard
            tool={tool}
            medium="video"
            billing="annual"
            selected={false}
            active={false}
            selectionFull={false}
            onCompare={() => {}}
            onDetail={() => {}}
          />
          <ToolPeek
            tool={tool}
            medium="video"
            billing="annual"
            onClose={() => {}}
            onSelectTool={() => {}}
          />
        </I18nextProvider>,
      );
      expect(html).not.toMatch(/[가-힣]/);
      expect(html).toContain(`View ${tool.name.replaceAll('&', '&amp;')} details`);
    }
  });

  it('renders price absence and comparisons in the selected language', async () => {
    const instance = createAppI18n();
    await instance.changeLanguage('en');
    const t = instance.getFixedT('en', 'catalog');
    const html = renderToStaticMarkup(
      <I18nextProvider i18n={instance}>
        <ComparisonTable
          tools={tools.slice(0, 3).map((tool) => localizeTool(tool, t))}
          medium="video"
          billing="annual"
          onClose={() => {}}
        />
        <PriceSummary pricing={undefined} billing="annual" />
      </I18nextProvider>,
    );
    expect(html).not.toMatch(/[가-힣]/);
    expect(html).toContain('No annual pricing information');
    expect(html).toContain('No pricing information');
    expect(html).toContain('billed annually');
  });

  it('formats allowances and dates in English while preserving currency', () => {
    expect(formatAllowance({ amount: 14500, unit: 'credits' }, 'en')).toBe('14,500 credits');
    expect(
      planAllowance(
        { name: 'Annual', annualAmount: 216, annualIncluded: { amount: 14500, unit: 'credits' } },
        'annual',
        'en',
      ),
    ).toBe('14,500 credits included per year');
    expect(formatMoney(9900, 'KRW', 'en')).toBe('₩9,900');
    expect(formatMoney(9.99, 'USD', 'en')).toBe('$9.99');
    expect(formatReviewDate('2026-09-21', 'en')).toBe('Sep 21, 2026');
  });
});
