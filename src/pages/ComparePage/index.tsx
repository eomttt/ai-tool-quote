import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clapperboard,
  Image,
  Info,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Modal } from '../../common/components/Modal';
import { tools, useCases } from '../../domains/catalog/data/tools';
import { getPricing, pricingSnapshots } from '../../domains/catalog/data/pricing';
import type { Medium, QuoteInput, Tool, UseCase } from '../../domains/catalog/models/model-tool';
import { calculateQuote, isPricingStale } from '../../domains/catalog/utils/calculate-quote';
import { ToolCard } from '../../domains/catalog/components/ToolCard';
import { QuotePanel } from '../../domains/catalog/components/QuotePanel';
import { ToolDialog } from '../../domains/catalog/components/ToolDialog';
import { ComparisonDialog } from '../../domains/catalog/components/ComparisonDialog';

export function ComparePage() {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key !== '/' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        document.querySelector('dialog[open]')
      )
        return;
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
  const [input, setInput] = useState<QuoteInput>({
    medium: 'video',
    quantity: 10,
    seconds: 5,
    resolution: '720p',
    attempts: 1,
    billing: 'monthly',
  });
  const [search, setSearch] = useState('');
  const [useCase, setUseCase] = useState<UseCase>('all');
  const [onlyQuotable, setOnlyQuotable] = useState(false);
  const [sort, setSort] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailTool, setDetailTool] = useState<Tool>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const freshPrices = pricingSnapshots.filter((snapshot) => !isPricingStale(snapshot)).length;
  const selectedTools = tools.filter((tool) => selectedIds.includes(tool.id));
  const normalizedSearch = search.trim().toLocaleLowerCase().replaceAll(' ', '');
  const filteredTools = tools
    .filter((tool) => {
      const searchText = [tool.name, tool.description, ...tool.tags, ...(tool.aliases ?? [])]
        .join(' ')
        .toLocaleLowerCase()
        .replaceAll(' ', '');
      return (
        tool.media.includes(input.medium) &&
        (useCase === 'all' || tool.useCases.includes(useCase)) &&
        searchText.includes(normalizedSearch) &&
        (!onlyQuotable || calculateQuote(getPricing(tool.id), input).status === 'ready')
      );
    })
    .toSorted((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price') {
        const quoteA = calculateQuote(getPricing(a.id), input);
        const quoteB = calculateQuote(getPricing(b.id), input);
        return (
          (quoteA.status === 'ready' ? quoteA.monthlyUsd : Infinity) -
          (quoteB.status === 'ready' ? quoteB.monthlyUsd : Infinity)
        );
      }
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  const isVideo = input.medium === 'video';

  function handleMediumChange(medium: Medium) {
    setInput((current) => ({
      ...current,
      medium,
      quantity: medium === 'video' ? 10 : 50,
      resolution: medium === 'video' ? '720p' : 'native',
    }));
    setUseCase('all');
    setVisibleCount(12);
    setSelectedIds([]);
    setNotice('');
  }
  function handleCompare(toolId: string) {
    setSelectedIds((current) =>
      current.includes(toolId)
        ? current.filter((id) => id !== toolId)
        : current.length < 3
          ? [...current, toolId]
          : current,
    );
    setNotice('');
  }
  function handleDetail(tool: Tool) {
    setDetailTool(tool);
    setDetailOpen(true);
  }

  return (
    <>
      <a className="skip-link" href="#catalog">
        도구 목록으로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="툴견적 홈">
            <span className="brand-mark">
              t<span>.</span>
            </span>
            툴견적<span className="beta">BETA</span>
          </a>
          <nav aria-label="주 메뉴">
            <a className="nav-active" href="#catalog">
              AI 도구 찾기
            </a>
            <button onClick={() => setMethodOpen(true)}>
              가격 안내
              <ArrowUpRight size={13} />
            </button>
          </nav>
          <span className="header-note">좋은 시작을 위한, 작은 비교.</span>
        </div>
      </header>
      <main id="top">
        <section className="hero content-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-line" />
              YOUR NEXT CREATION STARTS HERE
            </div>
            <h1 id="hero-title">
              만들기 전에,
              <br />
              <span>딱 맞는 AI부터.</span>
            </h1>
            <p>
              어떤 도구를 쓸지, 얼마나 들지.
              <br />
              영상과 이미지에 필요한 AI를 한곳에서 비교하세요.
            </p>
            <a href="#catalog" className="hero-link">
              내게 맞는 도구 찾기
              <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-dot-grid" />
            <div className="art-label">
              <Sparkles size={14} />A little idea. Endless possibilities.
            </div>
            <div className="art-image">
              <span className="art-chip">
                <Image size={12} />
                IMAGE
              </span>
              <div className="orb orb-one" />
              <div className="orb orb-two" />
              <span className="art-image-caption">
                MAKE IT
                <br />
                YOUR OWN.
              </span>
              <div className="art-image-bottom">
                <span>IMAGINATION, IN FRAME</span>
                <span>01 / 02</span>
              </div>
            </div>
            <div className="art-video">
              <div className="art-video-top">
                <Clapperboard size={14} />
                <span>A NEW PERSPECTIVE</span>
                <span>↗</span>
              </div>
              <svg viewBox="0 0 300 130" role="presentation">
                <defs>
                  <linearGradient id="sunset" x2="0" y2="1">
                    <stop stopColor="#c9dfd2" />
                    <stop offset="1" stopColor="#f3c494" />
                  </linearGradient>
                </defs>
                <rect width="300" height="130" fill="url(#sunset)" />
                <circle cx="198" cy="50" r="24" fill="#fff0bd" />
                <path d="M0 110 60 50 105 88 145 38 220 130H0" fill="#597e74" />
                <path d="m95 130 96-55 109 43v12" fill="#315950" />
                <path d="m0 130 112-37 124 37" fill="#183f37" />
              </svg>
              <div className="art-video-controls">
                <span className="play-shape" />
                <div>
                  <i />
                </div>
                <span>00:05</span>
              </div>
            </div>
            <div className="art-note">
              <Check size={13} />
              아이디어는 자유롭게. 선택은 가볍게.
            </div>
          </div>
        </section>
        <section className="catalog-section" id="catalog">
          <div className="content-width">
            <div className="catalog-heading">
              <div>
                <span className="eyebrow">FIND YOUR CREATIVE TOOL</span>
                <h2>무엇을 만들고 싶으신가요?</h2>
              </div>
              <span className="catalog-total">
                <strong>{tools.length}</strong>개의 도구, 한곳에서
              </span>
            </div>
            <div className="category-line">
              <div className="category-tabs" aria-label="제작할 콘텐츠">
                {(
                  [
                    { value: 'video', label: '영상', icon: Clapperboard },
                    { value: 'image', label: '이미지', icon: Image },
                  ] satisfies { value: Medium; label: string; icon: typeof Image }[]
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    className={input.medium === value ? 'active' : ''}
                    aria-pressed={input.medium === value}
                    onClick={() => handleMediumChange(value)}
                  >
                    <Icon size={19} />
                    {label}
                    <span>{tools.filter((tool) => tool.media.includes(value)).length}</span>
                  </button>
                ))}
              </div>
              <button className="text-button" onClick={() => setMethodOpen(true)}>
                <Info size={14} />
                견적은 어떻게 계산하나요?
              </button>
            </div>
            <div className="catalog-workspace">
              <QuotePanel input={input} onChange={setInput} />
              <section className="catalog-results" aria-label="AI 도구 검색 결과">
                <div className="search-row">
                  <div className="search-field">
                    <Search size={19} />
                    <input
                      ref={searchRef}
                      type="search"
                      aria-label="AI 도구 검색"
                      placeholder="도구 이름, 모델, 용도로 검색해 보세요"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.currentTarget.value);
                        setVisibleCount(12);
                      }}
                    />
                    {search ? (
                      <button aria-label="검색어 지우기" onClick={() => setSearch('')}>
                        <X size={15} />
                      </button>
                    ) : (
                      <kbd>/</kbd>
                    )}
                  </div>
                  <div className="sort-field">
                    <select
                      aria-label="도구 정렬"
                      value={sort}
                      onChange={(event) => setSort(event.currentTarget.value)}
                    >
                      <option value="featured">주요 도구순</option>
                      <option value="price">예상 비용 낮은 순</option>
                      <option value="name">이름순</option>
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>
                <div className="use-case-filters" aria-label="제작 용도">
                  {useCases
                    .filter(
                      (item) =>
                        item.id === 'all' ||
                        tools.some(
                          (tool) =>
                            tool.media.includes(input.medium) && tool.useCases.includes(item.id),
                        ),
                    )
                    .map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={useCase === item.id}
                        className={useCase === item.id ? 'active' : ''}
                        onClick={() => {
                          setUseCase(item.id);
                          setVisibleCount(12);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                </div>
                <div className="results-meta">
                  <p aria-live="polite">
                    <strong>{filteredTools.length}</strong>개의 {isVideo ? '영상' : '이미지'} 도구
                  </p>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={onlyQuotable}
                      onChange={(event) => {
                        setOnlyQuotable(event.currentTarget.checked);
                        setVisibleCount(12);
                      }}
                    />
                    지금 견적 가능한 도구만
                  </label>
                </div>
                {filteredTools.length > 0 ? (
                  <div className="tool-grid">
                    {filteredTools.slice(0, visibleCount).map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        input={input}
                        selected={selectedIds.includes(tool.id)}
                        selectionFull={selectedIds.length >= 3}
                        onCompare={() => handleCompare(tool.id)}
                        onDetail={() => handleDetail(tool)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Search size={29} />
                    <h3>조건에 맞는 도구가 없어요</h3>
                    <p>검색어를 줄이거나 견적 필터를 해제해 보세요.</p>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setSearch('');
                        setUseCase('all');
                        setOnlyQuotable(false);
                      }}
                    >
                      검색 조건 초기화
                    </button>
                  </div>
                )}
                {filteredTools.length > visibleCount ? (
                  <button
                    className="show-more"
                    onClick={() => setVisibleCount((current) => current + 12)}
                  >
                    도구 더 보기
                    <span>
                      {visibleCount} / {filteredTools.length}
                    </span>
                    <ChevronDown size={17} />
                  </button>
                ) : null}
                <div className="catalog-disclosure">
                  <Info size={16} />
                  <p>
                    가격 검토 완료 {freshPrices}개 · 나머지 도구는 기능 탐색과 공식 사이트 연결을
                    제공해요.
                    <br />
                    견적은 저장된 요금표로 계산합니다. 실시간 가격 수집은 아직 제공하지 않아요.
                  </p>
                  <button onClick={() => setMethodOpen(true)}>
                    자세히
                    <ArrowRight size={14} />
                  </button>
                </div>
              </section>
            </div>
            <section className="closing-note">
              <span className="brand-mark small-mark">
                t<span>.</span>
              </span>
              <div>
                <h2>
                  도구 고르는 시간은 짧게.
                  <br />
                  만드는 시간은 길게.
                </h2>
                <p>당신의 다음 아이디어가 시작되는 곳, 툴견적.</p>
              </div>
              <span className="closing-spark" aria-hidden="true">
                ✳
              </span>
            </section>
          </div>
        </section>
      </main>
      <footer className="site-footer content-width">
        <span>© {new Date().getFullYear()} 툴견적</span>
        <p>영상·이미지 크리에이터를 위한 AI 도구 탐색</p>
        <button onClick={() => setMethodOpen(true)}>가격·비교 기준</button>
      </footer>
      {selectedTools.length > 0 ? (
        <aside className="compare-tray" aria-label="선택한 비교 도구">
          <div className="tray-label">
            <span>{selectedTools.length}</span>도구 비교
          </div>
          <div className="tray-tools">
            {selectedTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleCompare(tool.id)}
                aria-label={`${tool.name} 선택 해제`}
              >
                <span className={`tool-logo mini tone-${tool.color}`}>{tool.monogram}</span>
                <span>{tool.name}</span>
                <X size={13} />
              </button>
            ))}
          </div>
          <button className="tray-clear" onClick={() => setSelectedIds([])}>
            비우기
          </button>
          <button
            className="primary-button"
            disabled={selectedTools.length < 2}
            onClick={() => {
              if (selectedTools.length > 1) setComparisonOpen(true);
              else setNotice('도구를 2개 이상 선택해 주세요.');
            }}
          >
            비교하기
            <ArrowRight size={16} />
          </button>
          <span className="sr-only" role="status">
            {notice ||
              (selectedTools.length === 3
                ? '최대 3개를 선택했습니다.'
                : `${selectedTools.length}개 선택. 최대 3개까지 비교할 수 있습니다.`)}
          </span>
        </aside>
      ) : null}
      <ToolDialog
        tool={detailTool}
        open={detailOpen}
        input={input}
        onClose={() => setDetailOpen(false)}
        onSelectTool={setDetailTool}
      />
      <ComparisonDialog
        open={comparisonOpen}
        tools={selectedTools}
        input={input}
        onClose={() => setComparisonOpen(false)}
      />
      <Modal
        open={methodOpen}
        title="가격과 비교, 이렇게 안내해요"
        onClose={() => setMethodOpen(false)}
      >
        <div className="method-content">
          <div>
            <span>01</span>
            <h3>공식 요금표를 검토합니다</h3>
            <p>
              현재는 2026년 9월 21일 검토한 가격을 사용합니다. 30일이 지나면 자동으로 금액 견적을
              중단하고 재확인이 필요하다고 표시합니다.
            </p>
          </div>
          <div>
            <span>02</span>
            <h3>실제로 필요한 생성량을 계산합니다</h3>
            <p>
              완성할 수량 × 결과물당 생성 시도 × 모델별 크레딧으로 계산합니다. 등록된 요금제 중 월
              크레딧이 충분한 가장 저렴한 플랜을 보여줍니다.
            </p>
          </div>
          <div>
            <span>03</span>
            <h3>계산하지 않은 조건도 표시합니다</h3>
            <p>
              추가 크레딧 구매·업스케일·음성·세금·할인·이전 잔액은 제외합니다. 연간 플랜도 크레딧은
              매월 지급되며, 실제 연 선결제 금액을 따로 표시합니다.
            </p>
          </div>
          <div>
            <span>04</span>
            <h3>확인되지 않은 가격은 추측하지 않습니다</h3>
            <p>
              자동 가격 수집은 아직 없습니다. 모델·해상도·길이를 확인하지 못하면 견적을 제공하지
              않습니다. 주요 도구순은 편집 순서이며 품질 순위나 유료 추천이 아닙니다.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
