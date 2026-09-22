import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, ChevronRight, Route, SkipForward } from 'lucide-react';
import { Button } from '../../../../common/components/Button';
import { Checkbox } from '../../../../common/components/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../common/components/Tabs';
import { Badge } from '../../../../common/components/Badge';
import { workflows } from '../../data/workflows';
import { tools } from '../../data/tools';
import { getPricing } from '../../data/pricing';
import { localizeTool } from '../../utils/localize-catalog';
import {
  initialWorkflowPreferences,
  isWorkflowStepSkipped,
  workflowStepResources,
} from '../../utils/search-workflows';
import type {
  Workflow,
  WorkflowMaterial,
  WorkflowPlatform,
  WorkflowPreferences,
} from '../../models/model-workflow';
import type { Billing, Tool } from '../../models/model-tool';
import { ToolLogo } from '../ToolLogo';
import { PriceSummary } from '../PriceSummary';
import { WorkflowToolSearch } from '../WorkflowToolSearch';

export function WorkflowPreview({ onStart }: { onStart: (prompt: string) => void }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith('ko') ? 'ko' : 'en';
  const workflow = workflows[0];
  if (!workflow) return null;
  return (
    <button className="workflow-preview" onClick={() => onStart(workflow.example[language])}>
      <span className="workflow-preview-icon">
        <Route aria-hidden="true" />
      </span>
      <span>
        <span className="eyebrow">{t('workflow.previewLabel')}</span>
        <strong>{t('workflow.previewTitle')}</strong>
        <span className="workflow-preview-description">{t('workflow.previewDescription')}</span>
      </span>
      <span className="workflow-preview-action">
        {t('workflow.previewAction')}
        <ArrowRight size={18} aria-hidden="true" />
      </span>
    </button>
  );
}

interface WorkflowJourneyProps {
  workflow: Workflow;
  query: string;
  billing: Billing;
  onSelectTool: (tool: Tool) => void;
}

export function WorkflowJourney({ workflow, query, billing, onSelectTool }: WorkflowJourneyProps) {
  const { t, i18n } = useTranslation();
  const { t: catalogT } = useTranslation('catalog');
  const language = i18n.resolvedLanguage?.startsWith('ko') ? 'ko' : 'en';
  const [preferences, setPreferences] = useState(() => initialWorkflowPreferences(query));
  const [selectedStepId, setSelectedStepId] = useState('');
  const activeHeadingRef = useRef<HTMLHeadingElement>(null);
  const activeSteps = workflow.steps.filter((step) => !isWorkflowStepSkipped(step, preferences));
  const selectedStep = workflow.steps.find((step) => step.id === selectedStepId) ?? activeSteps[0];
  if (!selectedStep) return null;

  function handlePreferenceChange(next: WorkflowPreferences) {
    setPreferences(next);
    setSelectedStepId('');
  }
  function handleStepNavigation(stepId: string) {
    setSelectedStepId(stepId);
    requestAnimationFrame(() => {
      activeHeadingRef.current?.focus({ preventScroll: true });
      activeHeadingRef.current?.scrollIntoView({ block: 'start' });
    });
  }
  function handlePlatformChange(platform: WorkflowPlatform) {
    const included = preferences.platforms.includes(platform);
    if (included && preferences.platforms.length === 1) return;
    handlePreferenceChange({
      ...preferences,
      platforms: included
        ? preferences.platforms.filter((value) => value !== platform)
        : [...preferences.platforms, platform],
    });
  }

  return (
    <section className="workflow-journey" aria-labelledby="workflow-title">
      <div className="workflow-heading">
        <div>
          <p className="eyebrow">{t('workflow.eyebrow')}</p>
          <h3 id="workflow-title">{workflow.title[language]}</h3>
          <p>{workflow.description[language]}</p>
        </div>
        <Badge variant="outline" role="status">
          <Route size={14} aria-hidden="true" />
          {t('workflow.count', { count: activeSteps.length })}
        </Badge>
      </div>
      <fieldset className="workflow-preferences">
        <legend>{t('workflow.preferences')}</legend>
        <div className="workflow-preference-fields">
          <fieldset>
            <legend>{t('workflow.material')}</legend>
            <div className="workflow-choices">
              {(['idea', 'clips', 'finished'] satisfies WorkflowMaterial[]).map((material) => (
                <Button
                  key={material}
                  variant={preferences.material === material ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={preferences.material === material}
                  onClick={() => handlePreferenceChange({ ...preferences, material })}
                >
                  {t(`workflow.material.${material}`)}
                </Button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{t('workflow.platforms')}</legend>
            <div className="workflow-choices">
              {(['youtube', 'instagram'] satisfies WorkflowPlatform[]).map((platform) => (
                <Button
                  key={platform}
                  variant={preferences.platforms.includes(platform) ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={preferences.platforms.includes(platform)}
                  disabled={
                    preferences.platforms.length === 1 && preferences.platforms.includes(platform)
                  }
                  onClick={() => handlePlatformChange(platform)}
                >
                  {platform === 'youtube' ? 'YouTube' : 'Instagram'}
                </Button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{t('workflow.existing')}</legend>
            <div className="workflow-choices">
              {preferences.platforms.map((platform) => (
                <label className="checkbox-label" key={platform}>
                  <Checkbox
                    checked={preferences.existingChannels.includes(platform)}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange({
                        ...preferences,
                        existingChannels:
                          checked === true
                            ? [...new Set([...preferences.existingChannels, platform])]
                            : preferences.existingChannels.filter((value) => value !== platform),
                      })
                    }
                  />
                  {t(`workflow.existing.${platform}`)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <p>{t('workflow.preferenceHint')}</p>
      </fieldset>
      <Tabs
        className="workflow-body"
        orientation="vertical"
        value={selectedStep.id}
        onValueChange={setSelectedStepId}
      >
        <TabsList className="workflow-step-list" aria-label={t('workflow.steps')}>
          {workflow.steps.map((step, index) => {
            const skipped = isWorkflowStepSkipped(step, preferences);
            return (
              <TabsTrigger className="workflow-step" value={step.id} key={step.id}>
                <span className="workflow-step-number">
                  {skipped ? (
                    <SkipForward size={15} aria-hidden="true" />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                <span>
                  <strong>{step.title[language]}</strong>
                  <small>{skipped ? t('workflow.skipped') : step.output[language]}</small>
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </TabsTrigger>
            );
          })}
        </TabsList>
        {workflow.steps.map((step) => {
          const resources = workflowStepResources(workflow, step, preferences);
          const skipped = isWorkflowStepSkipped(step, preferences);
          const stepPosition = workflow.steps.indexOf(step);
          const next = activeSteps.find((item) => workflow.steps.indexOf(item) > stepPosition);
          const previous = activeSteps.findLast(
            (item) => workflow.steps.indexOf(item) < stepPosition,
          );
          return (
            <TabsContent className="workflow-step-content" key={step.id} value={step.id}>
              <p className="eyebrow">STEP {String(stepPosition + 1).padStart(2, '0')}</p>
              <h4 ref={step.id === selectedStep.id ? activeHeadingRef : undefined} tabIndex={-1}>
                {step.title[language]}
              </h4>
              <p className="workflow-step-summary">{step.summary[language]}</p>
              {skipped ? (
                <p className="workflow-skip-note">
                  <SkipForward size={18} aria-hidden="true" />
                  {t('workflow.skipDescription')}
                </p>
              ) : (
                <>
                  <dl className="workflow-transfer">
                    <div>
                      <dt>{t('workflow.input')}</dt>
                      <dd>{step.input[language]}</dd>
                    </div>
                    <ArrowRight size={18} aria-hidden="true" />
                    <div>
                      <dt>{t('workflow.output')}</dt>
                      <dd>{step.output[language]}</dd>
                    </div>
                  </dl>
                  {step.toolSearch ? (
                    <WorkflowToolSearch
                      workflow={workflow}
                      step={step}
                      resources={resources}
                      billing={billing}
                      onSelectTool={onSelectTool}
                    />
                  ) : (
                    <>
                      <div className="workflow-resource-heading">
                        <h5>
                          {t(
                            resources.some((resource) => resource.kind === 'tool')
                              ? 'workflow.tools'
                              : 'workflow.guides',
                          )}
                        </h5>
                        {resources.filter((resource) => resource.kind === 'tool').length > 1 ? (
                          <p>{t('workflow.alternatives')}</p>
                        ) : null}
                      </div>
                      <div className="workflow-resources">
                        {resources.map((resource) => {
                          const catalogTool = tools.find((tool) => tool.id === resource.toolId);
                          const tool = catalogTool
                            ? localizeTool(catalogTool, catalogT)
                            : undefined;
                          return (
                            <article className="workflow-resource" key={resource.id}>
                              {tool ? (
                                <button
                                  className="workflow-resource-link"
                                  onClick={() => onSelectTool(tool)}
                                  aria-label={t('detail.open', { name: tool.name })}
                                >
                                  <ToolLogo tool={tool} size="mini" />
                                  <strong>{resource.name}</strong>
                                  <ArrowRight size={17} aria-hidden="true" />
                                </button>
                              ) : (
                                <a
                                  className="workflow-resource-link"
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="workflow-resource-monogram" aria-hidden="true">
                                    {resource.name.slice(0, 2)}
                                  </span>
                                  <strong>{resource.name}</strong>
                                  <ArrowUpRight size={17} aria-hidden="true" />
                                </a>
                              )}
                              <p className="workflow-resource-reason">
                                {resource.reason[language]}
                              </p>
                              {tool ? (
                                <PriceSummary pricing={getPricing(tool.id)} billing={billing} />
                              ) : resource.kind === 'tool' ? (
                                <p className="workflow-source-note">
                                  {t('workflow.externalPricing')}
                                </p>
                              ) : null}
                              <ol className="workflow-actions">
                                {resource.actions.map((action) => (
                                  <li key={action.en}>{action[language]}</li>
                                ))}
                              </ol>
                              <details className="workflow-sources">
                                <summary>{t('workflow.sources')}</summary>
                                {resource.sourceIds.map((id) => {
                                  const source = workflow.sources.find((item) => item.id === id);
                                  if (!source) return null;
                                  return (
                                    <div key={source.id}>
                                      <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
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
                              </details>
                            </article>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {step.id === 'review' ? (
                    <p className="workflow-review-note">{t('workflow.reviewNote')}</p>
                  ) : null}
                  <div className="workflow-handoff">
                    <ArrowRight size={18} aria-hidden="true" />
                    <div>
                      <strong>{t('workflow.handoff')}</strong>
                      <p>{step.handoff[language]}</p>
                    </div>
                  </div>
                </>
              )}
              <div className="workflow-navigation">
                {previous ? (
                  <Button variant="ghost" onClick={() => handleStepNavigation(previous.id)}>
                    {t('workflow.back')}
                  </Button>
                ) : (
                  <span />
                )}
                {next ? (
                  <Button onClick={() => handleStepNavigation(next.id)}>
                    {t('workflow.next')}
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleStepNavigation(activeSteps[0]?.id ?? '')}
                  >
                    {t('workflow.restart')}
                    <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      <p className="workflow-basis">{t('workflow.basis')}</p>
    </section>
  );
}
