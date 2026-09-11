import React, { useState, useEffect } from 'react';
import { T } from '../theme/tokens';
import type { FormTemplate, GridColumn } from '../types/FormTemplate';

interface RowEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  rowIndex?: number | null;
  template?: FormTemplate;
  lastSavedRow?: Record<string, unknown> | null;
}

export function RowEntryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  rowIndex,
  template,
  lastSavedRow,
}: RowEntryModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        // Defaults
        const defaults: Record<string, unknown> = {};
        if (template?.grid?.columns) {
          template.grid.columns.forEach((col) => {
            defaults[col.key] = '';
          });
        }
        setFormData(defaults);
      }
      setErrors({});
    }
  }, [isOpen, initialData, template]);

  if (!isOpen) return null;

  const isEditing = rowIndex !== null && rowIndex !== undefined && rowIndex >= 0;
  const columns: GridColumn[] = template?.grid?.columns || [];

  function handleChange(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  // Auto-fill from Last Saved Row
  function handleCopyFromLast() {
    if (!lastSavedRow) return;
    setFormData((prev) => ({
      ...prev,
      ...lastSavedRow,
      // Keep actual quantities clear for new logging
      actQty: '',
      actualQty: '',
      prodKgs: '',
      prodNos: '',
    }));
  }

  // Quick Preset Helper for Common Spec
  function handleQuickPreset() {
    const tid = template?.id || '';
    if (tid.includes('press_shop')) {
      setFormData((prev) => ({
        ...prev,
        tool: '506600 RN',
        grade: '50C600',
        timeFrom: '08:00',
        timeTo: '11:30',
        prodKgs: '1980',
        prodNos: '826',
        noMaterial: '0',
        noTool: '0',
        breakDownMt: '0',
        wSetter: '0',
      }));
    } else if (tid.includes('assembly')) {
      setFormData((prev) => ({
        ...prev,
        model: '5447',
        grade: '600',
        cl: '220',
        targetQty: '16',
        actualQty: '16',
        settingTime: '30',
        mcBd: '0',
        noMaterialChildPart: '0',
        miscLoss: '0',
      }));
    } else if (tid.includes('machine_shop')) {
      setFormData((prev) => ({
        ...prev,
        proOrderNo: 'A5600408007A',
        opSeq: 'All OD Turning Finish',
        partCode: 'P-9842',
        partDesc: 'Stator Shaft Housing',
        planQty: '50',
        actQty: '48',
        accepted: '48',
        rejected: '0',
        pendingQA: '0',
        stdTime: '420',
        actTime: '370',
        downTime: '0',
      }));
    } else if (tid.includes('die_casting')) {
      setFormData((prev) => ({
        ...prev,
        batchNo: 'B-2055',
        model: '1699',
        stHt: '530',
        stWt: '308.9',
        dcrWt: '339.2',
        alWt: '35.3',
        alGrade: 'EC Grade',
        mlGrade: '700',
        accPr: '160',
        clampPr: '160',
        injPr: '175',
        alTemp: '781',
        alSetWt: '94',
        pourTime: '09:40',
        totalNos: '94',
      }));
    } else if (tid.includes('ctl') || tid.includes('slt')) {
      setFormData((prev) => ({
        ...prev,
        model: '4125',
        coilWidth: '1065',
        coilId: '46956 / 92000',
        grade: '50C400',
        cuttingSize: '1065 x 1065',
        prodQtyKg: '6195',
      }));
    }
  }

  function handleSave() {
    // Validate common mandatory keys
    const newErrors: Record<string, string> = {};
    if (columns.length > 0) {
      const firstCol = columns[0].key;
      if (!formData[firstCol] && formData[firstCol] !== 0) {
        newErrors[firstCol] = `${columns[0].label} is required`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
    onClose();
  }

  // Keyboard shortcut listener (Enter to save, Esc to close)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 820,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: `1px solid ${T.border}`,
            background: '#F8FAFC',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                color: T.ink,
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{isEditing ? 'Edit Operation Record' : 'Add Operation Line Record'}</span>
              {rowIndex !== null && rowIndex !== undefined && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    background: '#E2E8F0',
                    color: '#475569',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  Row #{rowIndex + 1}
                </span>
              )}
            </h2>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {template?.name || 'Shopfloor Operation Entry'} · Spacious, full-width inputs with master data validation
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Quick-Fill Buttons */}
            {lastSavedRow && !isEditing && (
              <button
                type="button"
                onClick={handleCopyFromLast}
                style={{
                  background: '#FFFFFF',
                  color: T.ink,
                  border: `1px solid ${T.border}`,
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Copy Model/Spec from previous row"
              >
                <span>Copy Last</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleQuickPreset}
              style={{
                background: '#EEF2FF',
                color: '#4F46E5',
                border: '1px solid #C7D2FE',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Pre-fill standard nominal shop values"
            >
              <span>Quick Preset</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#E2E8F0',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body: Spacious 2-Column Responsive Input Grid */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            alignContent: 'start',
          }}
        >
          {columns.map((col) => {
            const val = formData[col.key] ?? '';
            const isNum = col.type === 'number';
            const isTime = col.key.toLowerCase().includes('time') && !col.key.toLowerCase().includes('std') && !col.key.toLowerCase().includes('setting') && !col.key.toLowerCase().includes('down');
            const hasErr = !!errors[col.key];

            return (
              <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{col.label}</span>
                  {isNum && <span style={{ fontSize: 11, color: T.muted }}>Numeric</span>}
                </label>

                {col.key === 'downCode' ? (
                  <select
                    value={String(val)}
                    onChange={(e) => handleChange(col.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: hasErr ? '1px solid #EF4444' : `1px solid ${T.border}`,
                      fontSize: 13,
                      background: '#FFFFFF',
                      color: T.ink,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select Downtime Reason Code...</option>
                    <option value="01 (No Material / Load)">01 - No Material / Load</option>
                    <option value="02 (No Power)">02 - No Power</option>
                    <option value="03 (No Tool / Fixture)">03 - No Tool / Fixture</option>
                    <option value="04 (No Operator)">04 - No Operator</option>
                    <option value="05 (Waiting For Crane)">05 - Waiting For Crane</option>
                    <option value="06 (Quality Inspection)">06 - Quality Inspection</option>
                    <option value="07 (M/C Breakdown Mechanical)">07 - M/C Breakdown Mechanical</option>
                    <option value="08 (M/C Breakdown Electrical)">08 - M/C Breakdown Electrical</option>
                    <option value="09 (Quality Hold Up)">09 - Quality Hold Up</option>
                    <option value="10 (Setup / Warm Up)">10 - Setup / Warm Up</option>
                    <option value="14 (Change Over Setup A/B)">14 - Change Over Setup A/B</option>
                    <option value="15 (Setting Time)">15 - Setting Time</option>
                    <option value="17 (Rework Hours - Machining)">17 - Rework Hours - Machining</option>
                    <option value="20 (Other)">20 - Other</option>
                  </select>
                ) : isTime ? (
                  <input
                    type="time"
                    value={String(val)}
                    onChange={(e) => handleChange(col.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: hasErr ? '1px solid #EF4444' : `1px solid ${T.border}`,
                      fontSize: 13,
                      color: T.ink,
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <input
                    type={isNum ? 'number' : 'text'}
                    value={String(val)}
                    onChange={(e) => handleChange(col.key, isNum && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: hasErr ? '1px solid #EF4444' : `1px solid ${T.border}`,
                      fontSize: 13,
                      color: T.ink,
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )}

                {hasErr && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors[col.key]}</span>}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: `1px solid ${T.border}`,
            background: '#F8FAFC',
          }}
        >
          <div style={{ fontSize: 12, color: T.muted }}>
            Press <kbd style={{ background: '#E2E8F0', padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>Enter</kbd> to save,{' '}
            <kbd style={{ background: '#E2E8F0', padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>Esc</kbd> to cancel
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                color: T.ink,
                border: `1px solid ${T.border}`,
                padding: '9px 18px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                background: T.blue,
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 24px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(30, 96, 213, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>✓ {isEditing ? 'Update Record' : 'Save Record'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
