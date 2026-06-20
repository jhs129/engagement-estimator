'use client';

import { useState, useCallback } from 'react';

interface LaborRole {
  id: string;
  fullTitle: string;
  division: string;
  department: string;
  role: string;
  rackRate: number;
  abbreviation: string;
  isActive: boolean;
}

interface LaborRatesAdminProps {
  initialRoles: LaborRole[];
}

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `local-lr-${localIdCounter}`;
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--cc-gray-mid)',
  textAlign: 'left',
  borderRight: '1px solid var(--cc-gray-light)',
  whiteSpace: 'nowrap',
  backgroundColor: 'var(--cc-parchment)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRight: '1px solid var(--cc-gray-light)',
  borderBottom: '1px solid var(--cc-gray-light)',
  verticalAlign: 'middle',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--cc-black)',
  border: '1px solid transparent',
  background: 'transparent',
  outline: 'none',
  borderRadius: 0,
  boxSizing: 'border-box',
};

export function LaborRatesAdmin({ initialRoles }: LaborRatesAdminProps) {
  const [roles, setRoles] = useState<LaborRole[]>(initialRoles);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handlePatch = useCallback(async (id: string, changes: Partial<LaborRole>) => {
    if (id.startsWith('local-lr-')) return;
    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`/api/admin/labor-roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    } catch {
      // ignore
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const handleFieldBlur = useCallback(
    (id: string, field: keyof LaborRole, value: string | number) => {
      setRoles((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
      handlePatch(id, { [field]: value });
    },
    [handlePatch]
  );

  const handleActiveChange = useCallback(
    (id: string, checked: boolean) => {
      setRoles((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: checked } : r))
      );
      handlePatch(id, { isActive: checked });
    },
    [handlePatch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm('Delete this labor role?');
      if (!confirmed) return;

      if (id.startsWith('local-lr-')) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        return;
      }

      try {
        await fetch(`/api/admin/labor-roles/${id}`, { method: 'DELETE' });
        setRoles((prev) => prev.filter((r) => r.id !== id));
      } catch {
        // ignore
      }
    },
    []
  );

  const handleAdd = useCallback(async () => {
    const localId = nextLocalId();
    const defaults = {
      fullTitle: 'New Role',
      division: '',
      department: '',
      role: '',
      rackRate: 0,
      abbreviation: '',
      isActive: true,
    };

    try {
      const res = await fetch('/api/admin/labor-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaults),
      });
      if (res.ok) {
        const created: LaborRole = await res.json();
        setRoles((prev) => [...prev, created]);
      } else {
        // Optimistic fallback with local id
        setRoles((prev) => [...prev, { id: localId, ...defaults }]);
      }
    } catch {
      setRoles((prev) => [...prev, { id: localId, ...defaults }]);
    }
  }, []);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid var(--cc-gray-light)',
            backgroundColor: '#ffffff',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cc-gray-light)' }}>
              {['Full Title', 'Division', 'Department', 'Role', 'Rack Rate', 'Abbreviation', 'Active', 'Actions'].map(
                (col, i, arr) => (
                  <th
                    key={col}
                    style={{
                      ...thStyle,
                      borderRight: i < arr.length - 1 ? '1px solid var(--cc-gray-light)' : 'none',
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'var(--cc-gray-mid)',
                  }}
                >
                  No labor roles found. Click Add Labor Role to create one.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr
                  key={role.id}
                  style={{
                    borderBottom: '1px solid var(--cc-gray-light)',
                    opacity: saving[role.id] ? 0.6 : 1,
                  }}
                >
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      defaultValue={role.fullTitle}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid var(--cc-gray-light)';
                        (e.target as HTMLInputElement).style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid transparent';
                        (e.target as HTMLInputElement).style.background = 'transparent';
                        handleFieldBlur(role.id, 'fullTitle', e.target.value);
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      defaultValue={role.division}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid var(--cc-gray-light)';
                        (e.target as HTMLInputElement).style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid transparent';
                        (e.target as HTMLInputElement).style.background = 'transparent';
                        handleFieldBlur(role.id, 'division', e.target.value);
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      defaultValue={role.department}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid var(--cc-gray-light)';
                        (e.target as HTMLInputElement).style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid transparent';
                        (e.target as HTMLInputElement).style.background = 'transparent';
                        handleFieldBlur(role.id, 'department', e.target.value);
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      defaultValue={role.role}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid var(--cc-gray-light)';
                        (e.target as HTMLInputElement).style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid transparent';
                        (e.target as HTMLInputElement).style.background = 'transparent';
                        handleFieldBlur(role.id, 'role', e.target.value);
                      }}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <input
                      type="number"
                      style={{ ...inputStyle, textAlign: 'right' }}
                      defaultValue={role.rackRate}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid var(--cc-gray-light)';
                        (e.target as HTMLInputElement).style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid transparent';
                        (e.target as HTMLInputElement).style.background = 'transparent';
                        handleFieldBlur(role.id, 'rackRate', parseFloat(e.target.value) || 0);
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      defaultValue={role.abbreviation}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid var(--cc-gray-light)';
                        (e.target as HTMLInputElement).style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.border = '1px solid transparent';
                        (e.target as HTMLInputElement).style.background = 'transparent';
                        handleFieldBlur(role.id, 'abbreviation', e.target.value);
                      }}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', borderRight: '1px solid var(--cc-gray-light)' }}>
                    <input
                      type="checkbox"
                      checked={role.isActive}
                      onChange={(e) => handleActiveChange(role.id, e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(role.id)}
                      style={{
                        padding: '4px 10px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        background: 'none',
                        border: '1px solid var(--cc-gray-light)',
                        cursor: 'pointer',
                        color: 'var(--cc-gray-mid)',
                      }}
                      title="Delete role"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAdd}
        style={{
          marginTop: '16px',
          padding: '8px 20px',
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: 'var(--cc-burnt-sienna)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        + Add Labor Role
      </button>
    </div>
  );
}
