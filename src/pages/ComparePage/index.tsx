import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Clapperboard,
  Image,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '../../common/components/Button';
import { Badge } from '../../common/components/Badge';
import { Input } from '../../common/components/Input';
import { Checkbox } from '../../common/components/Checkbox';
import { Tabs, TabsList, TabsTrigger } from '../../common/components/Tabs';
import { tools, useCases } from '../../domains/catalog/data/tools';
import { getPricing, pricingSnapshots } from '../../domains/catalog/data/pricing';
import type { Billing, Medium, Tool, UseCase } from '../../domains/catalog/models/model-tool';
import { getEntryPlan, monthlyPrice } from '../../domains/catalog/utils/price-information';
import { ToolCard } from '../../domains/catalog/components/ToolCard';
import { ToolPeek } from '../../domains/catalog/components/ToolPeek';
import { ComparisonTable } from '../../domains/catalog/components/ComparisonTable';

export function ComparePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [medium, setMedium] = useState<Medium>('video');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [search, setSearch] = useState('');
  const [useCase, setUseCase] = useState<UseCase>('all');
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [sort, setSort] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailTool, setDetailTool] = useState<Tool>();
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
  const normalizedSearch = search.trim().toLocaleLowerCase().replaceAll(' ', '');
  const filteredTools = tools
    .filter((tool) => {
      const searchText = [
        tool.name,
        tool.description,
        tool.bestFor,
        ...tool.features,
        ...(tool.mediaFeatures?.[medium] ?? []),
        ...tool.tags,
        ...(tool.mediaTags?.[medium] ?? []),
        ...(tool.aliases ?? []),
      ]
        .join(' ')
        .toLocaleLowerCase()
        .replaceAll(' ', '');
      return (
        tool.media.includes(medium) &&
        (useCase === 'all' || tool.useCases.includes(useCase)) &&
        searchText.includes(normalizedSearch) &&
        (!onlyPriced || Boolean(getPricing(tool.id)))
      );
    })
    .toSorted((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price') {
        const planA = getEntryPlan(getPricing(a.id), billing);
        const planB = getEntryPlan(getPricing(b.id), billing);
        return (
          (planA ? (monthlyPrice(planA, billing) ?? Infinity) : Infinity) -
          (planB ? (monthlyPrice(planB, billing) ?? Infinity) : Infinity)
        );
      }
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  function handleMediumChange(value: string) {
    if (value !== 'video' && value !== 'image') return;
    setMedium(value);
    setUseCase('all');
    setVisibleCount(12);
    setDetailTool(undefined);
    setSelectedIds([]);
    setComparisonOpen(false);
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
    setDetailTool(tool);
  }
  function handleCloseDetail() {
    setDetailTool(undefined);
    detailTriggerRef.current?.focus();
  }
  function handleResetFilters() {
    setSearch('');
    setUseCase('all');
    setOnlyPriced(false);
    setVisibleCount(12);
  }
  return (
    <>
      <a className="skip-link" href="#catalog">
        도구 목록으로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="툴견적 홈">
            <span className="brand-mark">t.</span>
            <span>툴견적</span>
            <Badge variant="outline">BETA</Badge>
          </a>
          <nav aria-label="주 메뉴">
            <a href="#catalog">도구 탐색</a>
            <a href="#price-guide">
              가격 안내
              <ArrowUpRight size={13} />
            </a>
          </nav>
          <span className="header-note">A directory for your next idea.</span>
        </div>
      </header>
      <main id="top">
        <section className="hero content-width" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">THE CREATIVE AI DIRECTORY</p>
            <h1 id="hero-title">
              만들고 싶은 것에,
              <br />
              <span>맞는 AI를.</span>
            </h1>
            <p className="hero-description">
              각 도구가 잘하는 일부터 요금제까지.
              <br />
              영상과 이미지를 위한 AI 도구를 차분히 비교해 보세요.
            </p>
            <Button asChild variant="outline">
              <a href="#catalog">
                도구 둘러보기
                <ArrowDown />
              </a>
            </Button>
          </div>
          <div className="hero-index" aria-label={`${tools.length}개 도구, 영상과 이미지 2개 분야`}>
            <span className="eyebrow">EXPLORE THE COLLECTION</span>
            <div>
              <strong>{tools.length.toString().padStart(2, '0')}</strong>
              <span>
                AI TOOLS
                <br />
                한곳에서 살펴보는 가능성
              </span>
            </div>
            <div className="hero-index-bottom">
              <span>
                <Clapperboard size={15} />
                VIDEO
              </span>
              <span>
                <Image size={15} />
                IMAGE
              </span>
              <span>↗</span>
            </div>
          </div>
        </section>
        <section className="catalog-section" id="catalog">
          <div className="content-width">
            <div className="catalog-heading">
              <div>
                <p className="eyebrow">01 — DISCOVER</p>
                <h2>어떤 작업을 시작할까요?</h2>
              </div>
              <p>좋은 도구를 찾는 가장 짧은 여정.</p>
            </div>
            <div className="category-line">
              <Tabs value={medium} onValueChange={handleMediumChange}>
                <TabsList aria-label="제작할 콘텐츠" className="medium-tabs">
                  <TabsTrigger value="video">
                    <Clapperboard />
                    영상
                    <Badge variant="secondary">
                      {tools.filter((tool) => tool.media.includes('video')).length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <Image />
                    이미지
                    <Badge variant="secondary">
                      {tools.filter((tool) => tool.media.includes('image')).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="category-hint">
                도구를 누르면 특징을 자세히 볼 수 있어요
                <ArrowUpRight size={14} />
              </span>
            </div>
            <div className={`catalog-workspace ${detailTool ? 'has-peek' : ''}`}>
              <section className="catalog-results" aria-label="AI 도구 검색 결과">
                <div className="search-row">
                  <div className="search-field">
                    <Search size={18} />
                    <Input
                      ref={searchRef}
                      type="search"
                      aria-label="AI 도구 검색"
                      placeholder="이름, 기능, 만들고 싶은 것으로 검색"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.currentTarget.value);
                        setVisibleCount(12);
                      }}
                    />
                    {search ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSearch('')}
                        aria-label="검색어 지우기"
                      >
                        <X />
                      </Button>
                    ) : (
                      <kbd>/</kbd>
                    )}
                  </div>
                  <div className="sort-field">
                    <SlidersHorizontal size={15} />
                    <select
                      aria-label="도구 정렬"
                      value={sort}
                      onChange={(event) => setSort(event.currentTarget.value)}
                    >
                      <option value="featured">주요 도구순</option>
                      <option value="price">구독료 낮은 순</option>
                      <option value="name">이름순</option>
                    </select>
                  </div>
                </div>
                <div className="use-case-filters" aria-label="제작 용도">
                  {useCases
                    .filter(
                      (item) =>
                        item.id === 'all' ||
                        tools.some(
                          (tool) => tool.media.includes(medium) && tool.useCases.includes(item.id),
                        ),
                    )
                    .map((item) => (
                      <Button
                        key={item.id}
                        variant={useCase === item.id ? 'default' : 'outline'}
                        size="sm"
                        aria-pressed={useCase === item.id}
                        onClick={() => {
                          setUseCase(item.id);
                          setVisibleCount(12);
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                </div>
                <div className="results-meta">
                  <p role="status">
                    <strong>{filteredTools.length}</strong>개 도구
                  </p>
                  <label className="checkbox-label">
                    <Checkbox
                      checked={onlyPriced}
                      onCheckedChange={(value) => {
                        setOnlyPriced(value === true);
                        setVisibleCount(12);
                      }}
                    />
                    요금표 있는 도구만
                  </label>
                  <Tabs value={billing} onValueChange={handleBillingChange}>
                    <TabsList aria-label="결제 주기">
                      <TabsTrigger value="monthly">월간</TabsTrigger>
                      <TabsTrigger value="annual">연간</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div ref={comparisonRef}>
                  {comparisonOpen && selectedTools.length >= 2 ? (
                    <ComparisonTable
                      tools={selectedTools}
                      medium={medium}
                      billing={billing}
                      onClose={() => setComparisonOpen(false)}
                    />
                  ) : null}
                </div>
                {filteredTools.length ? (
                  <div className="tool-grid">
                    {filteredTools.slice(0, visibleCount).map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        medium={medium}
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
                    <h3>검색 결과가 없어요</h3>
                    <p>검색어나 용도 필터를 바꿔보세요.</p>
                    <Button variant="outline" onClick={handleResetFilters}>
                      검색 조건 초기화
                    </Button>
                  </div>
                )}
                {filteredTools.length > visibleCount ? (
                  <Button
                    variant="outline"
                    className="show-more"
                    onClick={() => setVisibleCount((current) => current + 12)}
                  >
                    도구 더 보기
                    <span>
                      {visibleCount} / {filteredTools.length}
                    </span>
                    <ArrowDown />
                  </Button>
                ) : null}
                <p className="catalog-disclosure">
                  {tools.length}개 도구의 특징을 소개하고, {pricingSnapshots.length}개 도구의
                  요금표를 제공해요. 가격은 공식 사이트에서 확인한 시점 기준입니다.
                </p>
              </section>
              {detailTool ? (
                <ToolPeek
                  tool={detailTool}
                  medium={medium}
                  billing={billing}
                  onClose={handleCloseDetail}
                  onSelectTool={handleDetail}
                />
              ) : null}
            </div>
            <details className="price-guide" id="price-guide">
              <summary>
                가격은 어떻게 비교하나요?<span>+</span>
              </summary>
              <div>
                <p>
                  월 구독료, 포함된 크레딧이나 사용 시간, 확인된 추가 구매 가격을 보여줘요. 연간
                  요금은 월 환산액과 연 선결제액을 함께 표시해요.
                </p>
                <p>
                  구독료 환산은 가격을 이해하기 위한 참고값이에요. 같은 크레딧 수라도 도구별 사용
                  방식이 달라, 만들 수 있는 영상 수나 이미지 수를 의미하지 않아요.
                </p>
                <p>
                  실시간 수집은 아직 제공하지 않아요. 확인 후 30일이 지나면 재확인 표시를 붙이고
                  마지막 확인 가격을 유지해요. 주요 도구순은 편집 순서이며 품질 순위가 아닙니다.
                </p>
              </div>
            </details>
          </div>
        </section>
      </main>
      <footer className="site-footer content-width">
        <span className="brand">
          툴견적<span className="footer-dot">© {new Date().getFullYear()}</span>
        </span>
        <p>Less searching. More creating.</p>
        <a href="#top">맨 위로 ↑</a>
      </footer>
      {selectedTools.length ? (
        <aside className="compare-tray" aria-label="선택한 비교 도구">
          <span className="tray-label">
            비교 <strong>{selectedTools.length}/3</strong>
          </span>
          <div className="tray-tools">
            {selectedTools.map((tool) => (
              <Button
                key={tool.id}
                variant="secondary"
                size="sm"
                onClick={() => handleCompare(tool.id)}
                aria-label={`${tool.name} 선택 해제`}
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
            비우기
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
            비교하기
            <ArrowUpRight />
          </Button>
          <span className="sr-only" role="status">
            {selectedTools.length}개 선택. 최대 3개까지 비교할 수 있습니다.
          </span>
        </aside>
      ) : null}
      <span className="sr-only" role="status">
        {detailTool
          ? `${detailTool.name} 상세 패널이 열렸습니다. 다른 도구를 계속 탐색할 수 있습니다.`
          : ''}
      </span>
    </>
  );
}
