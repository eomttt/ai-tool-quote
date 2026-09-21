import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { QuoteInput, Resolution } from '../../models/model-tool';

interface QuotePanelProps {
  input: QuoteInput;
  onChange: (input: QuoteInput) => void;
}

export function QuotePanel({ input, onChange }: QuotePanelProps) {
  const isVideo = input.medium === 'video';
  const resolutions: { value: Resolution; label: string }[] = isVideo
    ? [
        { value: '720p', label: '720p · HD' },
        { value: '1080p', label: '1080p · Full HD' },
      ]
    : [
        { value: 'native', label: '도구별 기본 해상도' },
        { value: '720p', label: '720p' },
        { value: '1K', label: '1K' },
        { value: '1080p', label: '1080p' },
      ];
  return (
    <aside className="quote-panel" aria-label="제작 조건">
      <div className="panel-heading">
        <h2>
          <SlidersHorizontal size={17} />
          나의 제작 조건
        </h2>
        <button
          className="icon-button"
          aria-label="제작 조건 초기화"
          onClick={() =>
            onChange({
              medium: input.medium,
              quantity: isVideo ? 10 : 50,
              seconds: 5,
              resolution: isVideo ? '720p' : 'native',
              attempts: 1,
              billing: 'monthly',
            })
          }
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="input-group">
        <label htmlFor="quantity">한 달에 몇 {isVideo ? '개' : '장'} 만드나요?</label>
        <div className="quantity-field">
          <input
            id="quantity"
            type="number"
            min="1"
            max="10000"
            step="1"
            value={input.quantity}
            onChange={(event) =>
              onChange({ ...input, quantity: event.currentTarget.valueAsNumber || 0 })
            }
          />
          <span>{isVideo ? '개 / 월' : '장 / 월'}</span>
        </div>
        <div className="quick-values">
          {(isVideo ? [10, 30, 100] : [50, 100, 300]).map((value) => (
            <button
              key={value}
              className={input.quantity === value ? 'active' : ''}
              onClick={() => onChange({ ...input, quantity: value })}
            >
              {value}
              {isVideo ? '개' : '장'}
            </button>
          ))}
        </div>
      </div>
      {isVideo ? (
        <div className="input-group">
          <label htmlFor="duration">영상 하나의 길이</label>
          <div className="select-field">
            <select
              id="duration"
              value={input.seconds}
              onChange={(event) =>
                onChange({ ...input, seconds: Number(event.currentTarget.value) })
              }
            >
              <option value={5}>5초</option>
              <option value={10}>10초</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
      ) : null}
      <div className="input-group">
        <label htmlFor="resolution">해상도</label>
        <div className="select-field">
          <select
            id="resolution"
            value={input.resolution}
            onChange={(event) => {
              const resolution = resolutions.find(
                (item) => item.value === event.currentTarget.value,
              )?.value;
              if (resolution) onChange({ ...input, resolution });
            }}
          >
            {resolutions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>
        {input.resolution === 'native' ? (
          <p className="field-help">견적에 표시된 해상도가 도구마다 달라요.</p>
        ) : null}
      </div>
      <div className="input-group">
        <label htmlFor="attempts">결과물당 생성 시도</label>
        <div className="select-field">
          <select
            id="attempts"
            value={input.attempts}
            onChange={(event) =>
              onChange({ ...input, attempts: Number(event.currentTarget.value) })
            }
          >
            <option value={1}>1회 · 한 번에 완성</option>
            <option value={2}>2회 · 한 번 더 시도</option>
            <option value={3}>3회 · 여러 안 비교</option>
            <option value={5}>5회 · 충분히 탐색</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <p className="field-help">다시 생성할 때 쓰는 크레딧도 포함해요.</p>
      </div>
      <div className="billing-block">
        <span className="field-label">결제 주기</span>
        <div className="segmented small" aria-label="결제 주기">
          <button
            aria-pressed={input.billing === 'monthly'}
            className={input.billing === 'monthly' ? 'active' : ''}
            onClick={() => onChange({ ...input, billing: 'monthly' })}
          >
            월간 결제
          </button>
          <button
            aria-pressed={input.billing === 'annual'}
            className={input.billing === 'annual' ? 'active' : ''}
            onClick={() => onChange({ ...input, billing: 'annual' })}
          >
            연간 결제
          </button>
        </div>
      </div>
      <div className="quote-footnote">
        <span className="status-dot" />
        <p>
          USD · 세금 별도
          <br />
          조건을 바꾸면 견적이 바로 바뀌어요.
        </p>
      </div>
    </aside>
  );
}
