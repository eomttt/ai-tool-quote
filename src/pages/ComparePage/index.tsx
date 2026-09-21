import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Clapperboard, Image, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../../common/components/Button';
import { Badge } from '../../common/components/Badge';
import { Checkbox } from '../../common/components/Checkbox';
import { Tabs, TabsList, TabsTrigger } from '../../common/components/Tabs';
import { tools as catalogTools } from '../../domains/catalog/data/tools';
import { scenarios } from '../../domains/catalog/data/scenarios';
import { searchTools, recommendationFeature } from '../../domains/catalog/utils/search-tools';
import { getPricing, pricingSnapshots } from '../../domains/catalog/data/pricing';
import type { Billing, Medium, Tool } from '../../domains/catalog/models/model-tool';
import { compareSubscriptionPrices } from '../../domains/catalog/utils/price-information';
import { ToolCard } from '../../domains/catalog/components/ToolCard';
import { ToolPeek } from '../../domains/catalog/components/ToolPeek';
import { ComparisonTable } from '../../domains/catalog/components/ComparisonTable';
import { localizeTool } from '../../domains/catalog/utils/localize-catalog';
import { SiteFooter } from '../../common/components/SiteFooter';
import { pagePath } from '../../common/utils/page-route';

export function ComparePage({
  initialMedium = 'video',
  year = new Date().getUTCFullYear(),
}: {
  initialMedium?: Medium;
  year?: number;
}) {
  const { t, i18n } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  const tools = catalogTools.map((tool) => localizeTool(tool, catalogT));
  const searchRef = useRef<HTMLTextAreaElement>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const medium = initialMedium;
  const [billing, setBilling] = useState<Billing>('monthly');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const mediumScenarios = scenarios.filter((item) => item.medium === medium);
  const recommendations = searchTools(query);
  const recommendationsById = new Map(recommendations.map((item) => [item.id, item]));
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [sort, setSort] = useState('featured');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailToolId, setDetailToolId] = useState<string>();
  const detailTool = tools.find((tool) => tool.id === detailToolId);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener('keydown', handleSearchShortcut);
    return () => document.removeEventListener('keydown', handleSearchShortcut);
  }, []);
  const selectedTools = tools.filter((tool) => selectedIds.includes(tool.id));
  const filteredTools = tools
    .filter((tool) => {
      return (
        (query ? recommendationsById.has(tool.id) : tool.media.includes(medium)) &&
        (!onlyPriced || Boolean(getPricing(tool.id)))
      );
    })
    .toSorted((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, i18n.resolvedLanguage);
      if (sort === 'price') {
        return compareSubscriptionPrices(getPricing(a.id), getPricing(b.id), billing);
      }
      return query
        ? (recommendationsById.get(b.id)?.score ?? 0) -
            (recommendationsById.get(a.id)?.score ?? 0) || a.id.localeCompare(b.id)
        : Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  function displayMedium(tool: Tool) {
    return (
      recommendationsById.get(tool.id)?.scenario?.medium ??
      (tool.media.includes(medium) ? medium : (tool.media[0] ?? medium))
    );
  }
  function handleBillingChange(value: string) {
    if (value === 'monthly' || value === 'annual') setBilling(value);
  }
  function handleCompare(toolId: string) {
    setSelectedIds((current) =>
      current.includes(toolId)
        ? current.filter((id) => id !== toolId)
        : current.length < 3
          ? [...current, toolId]
          : current,
    );
  }
  function handleDetail(tool: Tool) {
    if (
      document.activeElement instanceof HTMLElement &&
      !document.activeElement.closest('#tool-detail')
    )
      detailTriggerRef.current = document.activeElement;
    setDetailToolId(tool.id);
  }
  function handleCloseDetail() {
    setDetailToolId(undefined);
    detailTriggerRef.current?.focus();
  }
  function handleResetFilters() {
    setSearch('');
    setQuery('');
    setOnlyPriced(false);
  }
  return (
    <>
      <a className="skip-link" href="#catalog">
        {t('skip')}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label={t('brand.home')}>
            <span className="brand-mark">t.</span>
            <span>{t('brand')}</span>
            <Badge variant="outline">BETA</Badge>
          </a>
          <nav aria-label={t('nav.label')}>
            <a href="#catalog">{t('nav.browse')}</a>
            <a href="#price-guide">
              {t('nav.pricing')}
              <ArrowUpRight size={13} />
            </a>
          </nav>
          <span className="header-note">{t('header.note')}</span>
        </div>
      </header>
      <main id="top">
        <section className="hero content-width search-intro" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">{t('hero.eyebrow')}</p>
            <h1 id="hero-title">
              {t('hero.title')}
              <br />
              <span>{t('hero.accent')}</span>
            </h1>
            <p className="hero-description">
              {t('hero.description')}
              <br />
              {t('hero.descriptionSecond')}
            </p>
          </div>
        </section>
        <section className="catalog-section" id="catalog">
          <div className="content-width">
            <div className="catalog-heading">
              <div>
                <p className="eyebrow">{t('catalog.eyebrow')}</p>
                <h2>{t('catalog.title')}</h2>
              </div>
              <p>{t('catalog.subtitle')}</p>
            </div>
            {!query ? (
              <div className="category-line">
                <Tabs value={medium}>
                  <TabsList aria-label={t('medium.label')} className="medium-tabs">
                    <TabsTrigger value="video" asChild>
                      <a href={`${pagePath(i18n.resolvedLanguage ?? 'en')}#catalog`}>
                        <Clapperboard />
                        {t('medium.video')}
                        <Badge variant="secondary">
                          {tools.filter((tool) => tool.media.includes('video')).length}
                        </Badge>
                      </a>
                    </TabsTrigger>
                    <TabsTrigger value="image" asChild>
                      <a
                        href={`${pagePath(i18n.resolvedLanguage ?? 'en', 'catalog', 'image')}#catalog`}
                      >
                        <Image />
                        {t('medium.image')}
                        <Badge variant="secondary">
                          {tools.filter((tool) => tool.media.includes('image')).length}
                        </Badge>
                      </a>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <span className="category-hint">
                  {t('catalog.hint')}
                  <ArrowUpRight size={14} />
                </span>
              </div>
            ) : null}
            <div className={`catalog-workspace ${detailTool ? 'has-peek' : ''}`}>
              <section className="catalog-results" aria-label={t('catalog.results')}>
                <form
                  className="situation-search"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setQuery(search.trim());
                    setSort('featured');
                    setOnlyPriced(false);
                  }}
                >
                  <textarea
                    ref={searchRef}
                    rows={3}
                    maxLength={1000}
                    aria-label={t('search.label')}
                    placeholder={t(`search.placeholder.${medium}`)}
                    aria-describedby="search-hint"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.currentTarget.value);
                    }}
                  />
                  <div className="situation-search-actions">
                    <span>{t('search.inputHint')}</span>
                    {search || query ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleResetFilters}
                        aria-label={t('search.clear')}
                      >
                        <X />
                      </Button>
                    ) : null}
                    <Button type="submit" disabled={!search.trim()}>
                      <Search />
                      {t('search.submit')}
                    </Button>
                  </div>
                </form>
                <p id="search-hint" className="search-hint">
                  {t('search.hint')}
                </p>
                <div className="scenario-examples" role="group" aria-label={t('search.examples')}>
                  {mediumScenarios.slice(0, 3).map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prompt = catalogT(item.prompt);
                        setSearch(prompt);
                        setQuery(prompt);
                        setSort('featured');
                        setOnlyPriced(false);
                      }}
                    >
                      {catalogT(item.prompt)}
                    </Button>
                  ))}
                </div>
                {query ? (
                  <div className="recommendation-heading">
                    <h3>{t('recommendation.title')}</h3>
                    <p>{t('recommendation.description', { count: tools.length })}</p>
                  </div>
                ) : null}
                <div className="results-toolbar">
                  <div className="sort-field">
                    <SlidersHorizontal size={15} />
                    <select
                      aria-label={t('sort.label')}
                      value={sort}
                      onChange={(event) => setSort(event.currentTarget.value)}
                    >
                      <option value="featured">
                        {t(query ? 'sort.relevance' : 'sort.featured')}
                      </option>
                      <option value="price">{t('sort.price')}</option>
                      <option value="name">{t('sort.name')}</option>
                    </select>
                  </div>
                </div>
                <div className="results-meta">
                  <p role="status">{t('catalog.count', { count: filteredTools.length })}</p>
                  <label className="checkbox-label">
                    <Checkbox
                      checked={onlyPriced}
                      onCheckedChange={(value) => {
                        setOnlyPriced(value === true);
                      }}
                    />
                    {t('catalog.onlyPriced')}
                  </label>
                  <Tabs value={billing} onValueChange={handleBillingChange}>
                    <TabsList aria-label={t('billing.label')}>
                      <TabsTrigger value="monthly">{t('billing.monthly')}</TabsTrigger>
                      <TabsTrigger value="annual">{t('billing.annual')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div ref={comparisonRef}>
                  {comparisonOpen && selectedTools.length >= 2 ? (
                    <ComparisonTable
                      tools={selectedTools}
                      toolMedia={Object.fromEntries(
                        selectedTools.map((tool) => [tool.id, displayMedium(tool)]),
                      )}
                      medium={medium}
                      billing={billing}
                      onClose={() => setComparisonOpen(false)}
                    />
                  ) : null}
                </div>
                {filteredTools.length ? (
                  <div className="tool-grid">
                    {filteredTools.map((tool, index) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        medium={displayMedium(tool)}
                        recommendation={
                          query
                            ? {
                                rank: index + 1,
                                reason: recommendationFeature(tool, displayMedium(tool), query),
                                situation: recommendationsById.get(tool.id)?.scenario?.label,
                              }
                            : undefined
                        }
                        billing={billing}
                        selected={selectedIds.includes(tool.id)}
                        active={detailTool?.id === tool.id}
                        selectionFull={selectedIds.length >= 3}
                        onCompare={() => handleCompare(tool.id)}
                        onDetail={() => handleDetail(tool)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Search />
                    <h3>{t('empty.title')}</h3>
                    <p>{t('empty.description')}</p>
                    <Button variant="outline" onClick={handleResetFilters}>
                      {t('empty.reset')}
                    </Button>
                  </div>
                )}
                <p className="catalog-disclosure">
                  {t('catalog.disclosure', {
                    count: tools.length,
                    priced: pricingSnapshots.length,
                  })}
                </p>
              </section>
              {detailTool ? (
                <ToolPeek
                  tool={detailTool}
                  query={query}
                  medium={displayMedium(detailTool)}
                  billing={billing}
                  onClose={handleCloseDetail}
                  onSelectTool={handleDetail}
                />
              ) : null}
            </div>
            <details className="price-guide" id="price-guide">
              <summary>
                {t('guide.title')}
                <span>+</span>
              </summary>
              <div>
                <p>{t('guide.prices')}</p>
                <p>{t('guide.units')}</p>
                <p>{t('guide.updates')}</p>
              </div>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter year={year} medium={medium} />
      {selectedTools.length ? (
        <aside className="compare-tray" aria-label={t('compare.tray')}>
          <span className="tray-label">
            {t('compare.label')} <strong>{selectedTools.length}/3</strong>
          </span>
          <div className="tray-tools">
            {selectedTools.map((tool) => (
              <Button
                key={tool.id}
                variant="secondary"
                size="sm"
                onClick={() => handleCompare(tool.id)}
                aria-label={t('compare.remove', { name: tool.name })}
              >
                {tool.name}
                <X />
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedIds([]);
              setComparisonOpen(false);
            }}
          >
            {t('compare.clear')}
          </Button>
          <Button
            disabled={selectedTools.length < 2}
            onClick={() => {
              setComparisonOpen(true);
              requestAnimationFrame(() =>
                comparisonRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
              );
            }}
          >
            {t('compare.action')}
            <ArrowUpRight />
          </Button>
          <span className="sr-only" role="status">
            {t('compare.status', { count: selectedTools.length })}
          </span>
        </aside>
      ) : null}
      <span className="sr-only" role="status">
        {detailTool ? t('detail.status', { name: detailTool.name }) : ''}
      </span>
    </>
  );
}
