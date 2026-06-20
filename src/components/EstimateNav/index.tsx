'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabKey = 'setup' | 'questions' | 'team' | 'epics' | 'stories' | 'staffing' | 'investment';

interface EstimateNavProps {
  estimateId: string;
  estimateName: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'setup', label: 'SETUP' },
  { key: 'questions', label: 'QUESTIONS' },
  { key: 'team', label: 'TEAM' },
  { key: 'epics', label: 'EPICS' },
  { key: 'stories', label: 'STORIES' },
  { key: 'staffing', label: 'STAFFING' },
  { key: 'investment', label: 'INVESTMENT' },
];

function getActiveTab(pathname: string): TabKey {
  const segments = pathname.split('/');
  const last = segments[segments.length - 1] as TabKey;
  const keys: TabKey[] = ['setup', 'questions', 'team', 'epics', 'stories', 'staffing', 'investment'];
  return keys.includes(last) ? last : 'setup';
}

export function EstimateNav({ estimateId, estimateName }: EstimateNavProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav
      style={{
        backgroundColor: 'var(--cc-parchment)',
        borderBottom: '1px solid var(--cc-gray-light)',
      }}
    >
      <div className="px-8">
        <div className="flex items-center gap-8">
          {/* Estimate name */}
          <span
            className="py-4 text-sm font-medium shrink-0"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--cc-black)',
            }}
          >
            {estimateName}
          </span>

          {/* Tab links */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(({ key, label }) => {
              const isActive = activeTab === key;
              return (
                <Link
                  key={key}
                  href={`/estimates/${estimateId}/${key}`}
                  className="relative px-3 py-4 text-xs font-semibold tracking-widest transition-colors whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isActive ? 'var(--cc-burnt-sienna)' : 'var(--cc-gray-mid)',
                    borderBottom: isActive ? '2px solid var(--cc-burnt-sienna)' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
