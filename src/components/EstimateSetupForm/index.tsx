'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { snapToNextMonday } from './dateUtils';
import { FormField, TextInput, DateInput, TextArea, PercentInput } from './FormField';
import { SmeList } from './SmeList';
import type { EstimateSetupFormProps, Project } from './types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const sectionHeadingStyle = {
  fontFamily: 'var(--font-display)',
  color: 'var(--cc-black)',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--cc-gray-light)',
  paddingBottom: '8px',
  marginBottom: '16px',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--cc-gray-light)',
  backgroundColor: '#fff',
  color: 'var(--cc-black)',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
};

export function EstimateSetupForm({ estimateId, initialData, clients, initialProjects }: EstimateSetupFormProps) {
  const [form, setForm] = useState({
    name: initialData.name,
    clientName: initialData.clientName,
    salesOwner: initialData.salesOwner,
    salesOriginator: initialData.salesOriginator ?? '',
    estimatedStartDate: initialData.estimatedStartDate ?? '',
    projectDescription: initialData.projectDescription ?? '',
    ratioQAToDev: Math.round(initialData.ratioQAToDev * 100),
    ratioTestCaseAuthoring: Math.round(initialData.ratioTestCaseAuthoring * 100),
    ratioDefectFixing: Math.round(initialData.ratioDefectFixing * 100),
    ratioAlphaTesting: Math.round(initialData.ratioAlphaTesting * 100),
    ratioUAT: Math.round(initialData.ratioUAT * 100),
    riskPremiumPct: Math.round(initialData.riskPremiumPct * 100),
  });

  const [clientId, setClientId] = useState<string>(initialData.clientId ?? '');
  const [projectId, setProjectId] = useState<string>(initialData.projectId ?? '');
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const isFirstRender = useRef(true);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const patch = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/estimates/${estimateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    },
    [estimateId]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!clientId) {
      setProjects([]);
      setProjectId('');
      return;
    }
    setLoadingProjects(true);
    fetch(`/api/clients/${clientId}/projects`)
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        setLoadingProjects(false);
      })
      .catch(() => {
        setProjects([]);
        setLoadingProjects(false);
      });
  }, [clientId]);

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleDateBlur() {
    if (!form.estimatedStartDate) return;
    const snapped = snapToNextMonday(form.estimatedStartDate);
    setForm((prev) => ({ ...prev, estimatedStartDate: snapped }));
    patch({ estimatedStartDate: snapped ? `${snapped}T00:00:00.000Z` : null });
  }

  function handleClientChange(newClientId: string) {
    const selected = clients.find((c) => c.id === newClientId);
    setClientId(newClientId);
    setProjectId('');
    setForm((prev) => ({ ...prev, clientName: selected?.name ?? '' }));
    void patch({ clientId: newClientId || null, clientName: selected?.name ?? '' });
  }

  function handleProjectChange(newProjectId: string) {
    setProjectId(newProjectId);
    void patch({ projectId: newProjectId || null });
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Save status indicator */}
      <div className="mb-6 h-5">
        {saveStatus === 'saving' && (
          <span className="text-xs" style={{ color: 'var(--cc-gray-mid)' }}>Saving…</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs" style={{ color: 'var(--cc-teal)' }}>Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs" style={{ color: 'var(--cc-burnt-sienna)' }}>Error saving</span>
        )}
      </div>

      {/* Deal Information */}
      <section className="mb-10">
        <p style={sectionHeadingStyle}>Deal Information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Client" required>
            {clients.length === 0 ? (
              <p className="text-xs py-2" style={{ color: 'var(--cc-gray-mid)' }}>
                No clients —{' '}
                <a
                  href="/admin/clients/new"
                  style={{ color: 'var(--cc-burnt-sienna)', textDecoration: 'underline' }}
                >
                  create one first
                </a>.
              </p>
            ) : (
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Project">
            <select
              value={projectId}
              disabled={!clientId || loadingProjects}
              onChange={(e) => handleProjectChange(e.target.value)}
              style={{
                ...selectStyle,
                opacity: !clientId || loadingProjects ? 0.6 : 1,
                cursor: !clientId || loadingProjects ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">
                {!clientId
                  ? 'Select a client first…'
                  : loadingProjects
                  ? 'Loading projects…'
                  : 'Select a project…'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Estimate Name" required>
            <TextInput
              value={form.name}
              onChange={(v) => set('name', v)}
              onBlur={() => patch({ name: form.name })}
              placeholder="Engagement name"
              required
            />
          </FormField>
          <FormField label="Sales Closer">
            <TextInput
              value={form.salesOwner}
              onChange={(v) => set('salesOwner', v)}
              onBlur={() => patch({ salesOwner: form.salesOwner })}
              placeholder="Sales closer"
            />
          </FormField>
          <FormField label="Sales Originator">
            <TextInput
              value={form.salesOriginator}
              onChange={(v) => set('salesOriginator', v)}
              onBlur={() => patch({ salesOriginator: form.salesOriginator || null })}
              placeholder="Sales originator"
            />
          </FormField>
          <FormField label="Estimated Start Date">
            <DateInput
              value={form.estimatedStartDate}
              onChange={(v) => set('estimatedStartDate', v)}
              onBlur={handleDateBlur}
            />
          </FormField>
        </div>
      </section>

      {/* Project Description */}
      <section className="mb-10">
        <p style={sectionHeadingStyle}>Project Description</p>
        <FormField label="Description">
          <TextArea
            value={form.projectDescription}
            onChange={(v) => set('projectDescription', v)}
            onBlur={() => patch({ projectDescription: form.projectDescription || null })}
            placeholder="Describe the project scope and goals…"
            rows={5}
          />
        </FormField>
      </section>

      {/* SMEs */}
      <section className="mb-10">
        <p style={sectionHeadingStyle}>Subject Matter Experts</p>
        <SmeList estimateId={estimateId} initialSmes={initialData.smes} />
      </section>

      {/* QA Ratios */}
      <section className="mb-10">
        <p style={sectionHeadingStyle}>QA Ratios</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PercentInput
            label="QA to Development"
            value={form.ratioQAToDev}
            onChange={(v) => set('ratioQAToDev', v)}
            onBlur={() => patch({ ratioQAToDev: form.ratioQAToDev / 100 })}
          />
          <PercentInput
            label="Test Case Authoring to Testable Stories"
            value={form.ratioTestCaseAuthoring}
            onChange={(v) => set('ratioTestCaseAuthoring', v)}
            onBlur={() => patch({ ratioTestCaseAuthoring: form.ratioTestCaseAuthoring / 100 })}
          />
          <PercentInput
            label="General Dev Defect Fixing to Testable Stories"
            value={form.ratioDefectFixing}
            onChange={(v) => set('ratioDefectFixing', v)}
            onBlur={() => patch({ ratioDefectFixing: form.ratioDefectFixing / 100 })}
          />
          <PercentInput
            label="Alpha Testing to Testable Stories"
            value={form.ratioAlphaTesting}
            onChange={(v) => set('ratioAlphaTesting', v)}
            onBlur={() => patch({ ratioAlphaTesting: form.ratioAlphaTesting / 100 })}
          />
          <PercentInput
            label="UAT to Testable Stories"
            value={form.ratioUAT}
            onChange={(v) => set('ratioUAT', v)}
            onBlur={() => patch({ ratioUAT: form.ratioUAT / 100 })}
          />
          <PercentInput
            label="Risk Premium"
            value={form.riskPremiumPct}
            onChange={(v) => set('riskPremiumPct', v)}
            onBlur={() => patch({ riskPremiumPct: form.riskPremiumPct / 100 })}
          />
        </div>
      </section>

      {/* Version */}
      <section className="mb-10">
        <p style={sectionHeadingStyle}>Version</p>
        <span
          className="text-sm"
          style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}
        >
          v{initialData.version}
        </span>
      </section>
    </div>
  );
}
