import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, Search, X } from 'lucide-react';
import { Input } from '../../../../common/components/Input';
import { Button } from '../../../../common/components/Button';
import { Badge } from '../../../../common/components/Badge';
import { getPricing } from '../../data/pricing';
import { getProductProfile } from '../../data/product-profiles';
import { localizeTool } from '../../utils/localize-catalog';
import { searchWorkflowTools, workflowToolCandidates } from '../../utils/search-workflow-tools';
import type { Workflow, WorkflowResource, WorkflowStep } from '../../models/model-workflow';
import type { Billing, Tool } from '../../models/model-tool';
import { ToolLogo } from '../ToolLogo';
import { PriceSummary } from '../PriceSummary';

interface WorkflowToolSearchProps {
  workflow: Workflow;
  step: WorkflowStep;
  resources: WorkflowResource[];
  billing: Billing;
  onSelectTool: (tool: Tool) => void;
}

export function WorkflowToolSearch({
  workflow,
  step,
  resources,
  billing,
  onSelectTool,
}: WorkflowToolSearchProps) {
  const { t, i18n } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  const language = i18n.resolvedLanguage?.startsWith('ko') ? 'ko' : 'en';
  const [query, setQuery] = useState('');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const candidates = workflowToolCandidates(step, resources);
  const results = searchWorkflowTools(candidates, step, query);

  function clearSearch() {
    setQuery('');
    inputRef.current?.focus();
  }

  return (
    <div className="workflow-tool-search">
      <div className="workflow-resource-heading">
        <h5>{t('workflow.tools')}</h5>
        <p>{t('workflow.alternatives')}</p>
      </div>
      <label className="sr-only" htmlFor={inputId}>
        {t('workflow.searchTools')}
      </label>
      <div className="workflow-tool-search-field">
        <Search size={17} aria-hidden="true" />
        <Input
          id={inputId}
          ref={inputRef}
          type="search"
          value={query}
          placeholder={t('workflow.searchToolsPlaceholder')}
          aria-describedby={`${inputId}-hint`}
          aria-controls={`${inputId}-results`}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            aria-label={t('workflow.clearToolSearch')}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="workflow-tool-search-meta">
        <p id={`${inputId}-hint`}>{t('workflow.searchToolsHint')}</p>
        <p role="status" aria-live="polite" aria-atomic="true">
          {t('workflow.toolResults', { count: results.length, total: candidates.length })}
        </p>
      </div>
      {results.length === 0 ? (
        <div className="workflow-tool-empty" id={`${inputId}-results`}>
          <p>{t('workflow.toolSearchEmpty')}</p>
          <Button variant="outline" size="sm" onClick={clearSearch}>
            {t('workflow.clearToolSearch')}
          </Button>
        </div>
      ) : (
        <ul
          className="workflow-tool-results"
          id={`${inputId}-results`}
          aria-label={t('workflow.toolResultsLabel')}
        >
          {results.map((candidate) => {
            const tool = candidate.tool ? localizeTool(candidate.tool, catalogT) : undefined;
            const resource = candidate.resource;
            const profile = getProductProfile(candidate.id);
            const summary =
              resource?.reason[language] ??
              profile?.capabilities
                .filter((capability) => capability.medium === step.toolSearch?.medium)
                .map((capability) => capability.summary[language])
                .join(' ');
            const content = (
              <>
                <span className="workflow-tool-title">
                  {tool ? (
                    <ToolLogo tool={tool} size="mini" />
                  ) : (
                    <span className="workflow-resource-monogram" aria-hidden="true">
                      {candidate.name.slice(0, 2)}
                    </span>
                  )}
                  <strong>{candidate.name}</strong>
                  {resource ? <Badge variant="secondary">{t('workflow.recommended')}</Badge> : null}
                  {tool ? (
                    <ArrowRight size={17} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={17} aria-hidden="true" />
                  )}
                </span>
                <span className="workflow-tool-description">{summary}</span>
                {tool ? (
                  <PriceSummary pricing={getPricing(tool.id)} billing={billing} />
                ) : (
                  <span className="workflow-source-note">{t('workflow.externalPricing')}</span>
                )}
              </>
            );
            return (
              <li className="workflow-tool-result" key={candidate.id}>
                {tool ? (
                  <button
                    className="workflow-tool-option"
                    onClick={() => onSelectTool(tool)}
                    aria-label={t('detail.open', { name: tool.name })}
                  >
                    {content}
                  </button>
                ) : (
                  <a
                    className="workflow-tool-option"
                    href={resource?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                )}
                <details className="workflow-tool-sources">
                  <summary>{t(resource ? 'workflow.toolGuide' : 'workflow.sources')}</summary>
                  {resource ? (
                    <>
                      <ol className="workflow-actions">
                        {resource.actions.map((action) => (
                          <li key={action.en}>{action[language]}</li>
                        ))}
                      </ol>
                      {resource.sourceIds.map((id) => {
                        const source = workflow.sources.find((item) => item.id === id);
                        if (!source) return null;
                        return (
                          <div key={id}>
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              {source.title[language]}
                              <ArrowUpRight size={13} aria-hidden="true" />
                            </a>
                            <small>
                              {t('workflow.checked', { date: source.checkedAt })}
                              {source.access === 'login-required'
                                ? ` · ${t('workflow.loginRequired')}`
                                : ''}
                            </small>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    profile?.sources.map((source) => (
                      <div key={source.id}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </a>
                        <small>
                          {t('workflow.checked', { date: source.checkedAt.slice(0, 10) })}
                        </small>
                      </div>
                    ))
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
