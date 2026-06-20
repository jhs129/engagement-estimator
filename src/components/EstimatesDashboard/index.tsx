import Link from 'next/link';
import { NewEstimateButton } from './NewEstimateButton';
import { DeleteEstimateButton } from './DeleteEstimateButton';
import { AdminLink } from './AdminLink';

interface Estimate {
  id: string;
  name: string;
  clientName: string;
  salesOwner: string;
  createdAt: string;
  updatedAt: string;
}

interface EstimatesDashboardProps {
  estimates: Estimate[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export function EstimatesDashboard({ estimates }: EstimatesDashboardProps) {
  const hasEstimates = estimates.length > 0;

  return (
    <main
      className="min-h-screen px-8 py-10"
      style={{ backgroundColor: 'var(--cc-parchment)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
        >
          Estimates
        </h1>
        <div className="flex items-center gap-4">
          <AdminLink />
          <Link
            href="/profile"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
          >
            Profile
          </Link>
          <NewEstimateButton />
        </div>
      </div>

      {hasEstimates ? (
        <div
          className="overflow-x-auto"
          style={{ border: '1px solid var(--cc-gray-light)', backgroundColor: '#fff' }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--cc-gray-light)',
                  backgroundColor: 'var(--cc-off-white)',
                }}
              >
                {['Estimate Name', 'Client', 'Sales Owner', 'Created', 'Last Updated', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left font-semibold tracking-wide uppercase text-xs"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--cc-gray-mid)',
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {estimates.map((est) => (
                <tr
                  key={est.id}
                  style={{ borderBottom: '1px solid var(--cc-gray-light)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--cc-black)' }}>
                    {est.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>
                    {est.clientName}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>
                    {est.salesOwner}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>
                    {formatDate(est.createdAt)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--cc-gray-mid)' }}>
                    {formatDate(est.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/estimates/${est.id}/setup`}
                        className="px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: 'var(--cc-black)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        Open
                      </Link>
                      <DeleteEstimateButton estimateId={est.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <p
            className="text-lg"
            style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}
          >
            No estimates yet. Create your first estimate.
          </p>
          <NewEstimateButton />
        </div>
      )}
    </main>
  );
}
