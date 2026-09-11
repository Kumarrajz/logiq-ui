import React, { useState } from 'react';
import type { GridColumn } from '../types/FormTemplate';
import { T } from '../theme/tokens';
import { RowEntryModal } from '../components/RowEntryModal';

const td = { padding: '10px 12px' };

export function DataGrid({
  label,
  columns,
  rows,
  setRows,
  readOnly,
}: {
  label: string;
  columns: GridColumn[];
  rows: Record<string, unknown>[];
  setRows: (r: Record<string, unknown>[]) => void;
  readOnly?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Record<string, unknown> | null>(null);

  function handleAdd() {
    setEditingIndex(null);
    setIsModalOpen(true);
  }

  function handleEdit(idx: number) {
    setEditingIndex(idx);
    setIsModalOpen(true);
  }

  function handleSave(row: Record<string, unknown>) {
    if (editingIndex !== null && editingIndex >= 0) {
      const next = [...rows];
      next[editingIndex] = row;
      setRows(next);
    } else {
      setRows([...rows, row]);
    }
    setLastSaved(row);
  }

  // Synthesize minimal FormTemplate for RowEntryModal
  const mockTemplate = {
    id: 'dynamic_grid',
    name: label,
    version: 1,
    plants: [],
    departments: [],
    header: [],
    grid: {
      label,
      columns,
    },
    signOff: [],
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>
            {label}
            {readOnly ? ' · read-only' : ''}
          </span>
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: '#EFF6FF', color: T.blue, padding: '2px 8px', borderRadius: 999 }}>
            {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAdd}
            style={{
              background: T.blue,
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 1px 3px rgba(30, 96, 213, 0.2)',
            }}
          >
            <span>Add Row (Popup Form)</span>
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div
          onClick={!readOnly ? handleAdd : undefined}
          style={{
            border: `1.5px dashed ${T.border}`,
            borderRadius: 8,
            padding: '20px 16px',
            textAlign: 'center',
            background: '#F8FAFC',
            cursor: !readOnly ? 'pointer' : 'default',
          }}
        >
          <div style={{ fontSize: 13, color: T.muted }}>
            No rows added yet.{!readOnly && ' Click "+ Add Row (Popup Form)" to enter data.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: T.muted, background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '10px 12px', width: 36, fontWeight: 600 }}>#</th>
                {columns.map((c) => (
                  <th key={c.key} style={{ padding: '10px 12px', fontWeight: 600, minWidth: 110 }}>
                    {c.label}
                  </th>
                ))}
                {!readOnly && <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: '#FFFFFF' }}>
                  <td style={{ ...td, color: T.muted, fontWeight: 600 }}>{i + 1}</td>
                  {columns.map((c) => (
                    <td key={c.key} style={td}>
                      <span style={{ color: T.ink, fontWeight: 500 }}>
                        {String(r[c.key] ?? '—')}
                      </span>
                    </td>
                  ))}
                  {!readOnly && (
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(i)}
                          style={{
                            border: '1px solid #BFDBFE',
                            background: '#EFF6FF',
                            color: T.blue,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: 4,
                          }}
                          title="Edit in modal"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setRows(rows.filter((_, x) => x !== i))}
                          style={{
                            border: 'none',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: 4,
                          }}
                          title="Remove row"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Row Entry Modal */}
      <RowEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingIndex !== null && editingIndex >= 0 ? rows[editingIndex] : null}
        rowIndex={editingIndex}
        template={mockTemplate as any}
        lastSavedRow={lastSaved}
      />
    </div>
  );
}
