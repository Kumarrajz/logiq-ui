import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';
import { db } from '../offline/db';
import { useMasterData } from '../api/useMasterData';
import { BackButton } from '../components/BackButton';
import { showError, showSuccess } from '../utils/alerts';
import { RowEntryModal } from '../components/RowEntryModal';
import { RoleSubmissionHistory } from '../components/RoleSubmissionHistory';
import type { FormTemplate } from '../types/FormTemplate';

export interface ProductionEntryScreenProps {
  template?: FormTemplate;
}

export function ProductionEntryScreen({ template }: ProductionEntryScreenProps) {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Dynamic Master Data queries
  const { data: dynamicDepts } = useMasterData('departments');
  const { data: dynamicMachines } = useMasterData('machines');
  const { data: dynamicShifts } = useMasterData('shifts');
  const { data: dynamicLosses } = useMasterData('reason-codes');

  const defaultDept = template?.departments?.[0] || 'Press Shop & Notching';

  // Form State matching Screen 3 from reference photo
  const [department, setDepartment] = useState(defaultDept);
  const [machineNo, setMachineNo] = useState('N3 - 5446');
  const [operator, setOperator] = useState(user?.name || 'Ramesh');
  const [shift, setShift] = useState('Shift A (06:00 AM – 02:00 PM)');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Dynamic Technical Details
  const [tool, setTool] = useState('506600');
  const [grade, setGrade] = useState('50C660');
  const [prodType, setProdType] = useState<'Kgs' | 'Nos'>('Kgs');
  const [prodQty, setProdQty] = useState('1980');
  const [targetQty, setTargetQty] = useState('2100');

  // Interactive HTML5 Time Pickers & Single-Touch Shift Presets
  const [timeFrom, setTimeFrom] = useState('06:00');
  const [timeTo, setTimeTo] = useState('14:00');
  const [activeTimePreset, setActiveTimePreset] = useState<'A' | 'B' | 'C' | 'G' | 'custom'>('A');

  function applyTimePreset(preset: 'A' | 'B' | 'C' | 'G') {
    setActiveTimePreset(preset);
    if (preset === 'A') {
      setTimeFrom('06:00');
      setTimeTo('14:00');
      setShift('Shift A (06:00 AM – 02:00 PM)');
    } else if (preset === 'B') {
      setTimeFrom('14:00');
      setTimeTo('22:00');
      setShift('Shift B (02:00 PM – 10:00 PM)');
    } else if (preset === 'C') {
      setTimeFrom('22:00');
      setTimeTo('06:00');
      setShift('Shift C (10:00 PM – 06:00 AM)');
    } else if (preset === 'G') {
      setTimeFrom('09:00');
      setTimeTo('17:30');
      setShift('General Shift (09:00 AM – 05:30 PM)');
    }
  }

  const computedDuration = useMemo(() => {
    if (!timeFrom || !timeTo) return '';
    const [h1, m1] = timeFrom.split(':').map(Number);
    const [h2, m2] = timeTo.split(':').map(Number);
    let diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // handles overnight shift
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins > 0 ? `${mins}m` : '00m'} (${diff} mins)`;
  }, [timeFrom, timeTo]);

  // Dynamic Operation Rows for multi-operation DPRs (Assembly, Machine Shop, CTL, Die Casting, Press)
  const [operationRows, setOperationRows] = useState<Record<string, unknown>[]>([]);

  // Modal State for row data entry
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [lastSavedRow, setLastSavedRow] = useState<Record<string, unknown> | null>(null);

  // Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // QA Observation Rows (for CTL/SLT)
  const [qaRows, setQaRows] = useState<Record<string, string>[]>([
    { param: 'Burr Level (max 0.02mm)', spec: '< 0.02 mm', act: '0.012 mm', status: 'OK' },
    { param: 'Observed Strip Width', spec: '1250 ± 0.2 mm', act: '1250.1 mm', status: 'OK' },
    { param: 'Edge Waviness', spec: 'Nil', act: 'Nil', status: 'OK' },
  ]);

  // Dynamic Departments List
  const departmentsList = useMemo(() => {
    const local = localStorage.getItem('logiq_master_departments');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((d: any) => d.name || d.code || d);
        }
      } catch { }
    }
    if (Array.isArray(dynamicDepts) && dynamicDepts.length > 0) {
      return dynamicDepts.map((d: any) => (typeof d === 'string' ? d : d.name || d.code));
    }
    return [
      'Press Shop & Notching',
      'Assembly',
      'Machine Shop',
      'Die Casting',
      'CTL / SLT',
      'Tool Room',
      'Quality Assurance',
    ];
  }, [dynamicDepts]);

  // Default fallback machines dictionary
  const MACHINES_BY_DEPT: Record<string, string[]> = {
    'Press Shop & Notching': ['N3 - 5446', 'N3 - 7106', 'N10 - 1116', 'N11 - 2132', 'N17 - 3168', 'N20 - 7023'],
    'Assembly': ['HP-1 (Stator)', 'HP-2 (Rotor)', 'HP-3 (Shaft)', 'HP-4 (Core Pack)', 'HP-5 (Final)'],
    'Machine Shop': ['MC-101 (VMC)', 'MC-102 (HMC)', 'CTX-1 (Turn)', 'CTX-2 (Borer)'],
    'Die Casting': ['500T-VDC Bühler', 'VDC-250T', 'VDC-120T', 'VDC-40T'],
    'CTL / SLT': ['CTL-1250-A', 'SLT-650-A', 'CTL-1250-B', 'SLT-650-B'],
    'Tool Room': ['TR-EDM-1', 'TR-Grinder-2', 'TR-Milling-3'],
    'Quality Assurance': ['QA-Optical-1', 'QA-Tensile-2', 'QA-Hardness-3'],
  };

  // Dynamic Machines List Filtered by Department
  const machinesList = useMemo(() => {
    const local = localStorage.getItem('logiq_master_machines');
    let allMachines: any[] = [];
    if (local) {
      try {
        allMachines = JSON.parse(local);
      } catch { }
    }
    if (allMachines.length === 0 && Array.isArray(dynamicMachines) && dynamicMachines.length > 0) {
      allMachines = dynamicMachines;
    }
    if (allMachines.length > 0) {
      const filtered = allMachines.filter((m: any) => {
        if (!m.department) return true;
        const mDept = m.department.toLowerCase();
        const curDept = department.toLowerCase();
        return mDept.includes(curDept) || curDept.includes(mDept);
      });
      if (filtered.length > 0) {
        return filtered.map((m: any) => m.code || m.name || m);
      }
    }
    return MACHINES_BY_DEPT[department] || ['N3 - 5446', 'HP-1 (Stator)', 'MC-101 (VMC)', '500T-VDC Bühler', 'CTL-1250-A'];
  }, [department, dynamicMachines]);

  // Dynamic Shifts List
  const shiftsList = useMemo(() => {
    const local = localStorage.getItem('logiq_master_shifts');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => `${s.name || s.code} (${s.timings || 'Standard'})`);
        }
      } catch { }
    }
    if (Array.isArray(dynamicShifts) && dynamicShifts.length > 0) {
      return dynamicShifts.map((s: any) => (typeof s === 'string' ? s : `${s.name || s.code} (${s.timings || 'Standard'})`));
    }
    return [
      'Shift A (Morning) (06:00 AM – 02:00 PM)',
      'Shift B (Evening) (02:00 PM – 10:00 PM)',
      'Shift C (Night) (10:00 PM – 06:00 AM)',
      'General Shift (09:00 AM – 05:30 PM)',
    ];
  }, [dynamicShifts]);

  // Dynamic Reason Codes / Loss Options
  const lossOptionsList = useMemo(() => {
    const local = localStorage.getItem('logiq_master_reason-codes');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((l: any) => l.name || l.label || l.code || l);
        }
      } catch { }
    }
    if (Array.isArray(dynamicLosses) && dynamicLosses.length > 0) {
      return dynamicLosses.map((l: any) => (typeof l === 'string' ? l : l.name || l.label || l.code));
    }
    return [
      'Break Down',
      'No Tool',
      'Tool Problem',
      'Preventive M/T',
      'No Power',
      'Setting Time',
      'Quality Hold',
      'Others',
    ];
  }, [dynamicLosses]);

  const [selectedLosses, setSelectedLosses] = useState<string[]>(['Break Down']);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when template prop changes
  useEffect(() => {
    if (template) {
      const dept = template.departments?.[0] || 'Press Shop & Notching';
      setDepartment(dept);
      const mList = MACHINES_BY_DEPT[dept] || machinesList;
      if (mList[0]) setMachineNo(mList[0]);
    }
  }, [template?.id, template?.templateId]);

  // Auto-fillers for frequent entry data
  function handleQuickFillPreviousShift() {
    setTool('506600 RN');
    setGrade('50C600 CRGO');
    setProdQty('2100');
    setTargetQty('2100');
    setTimeFrom('06:00');
    setTimeTo('14:00');
    setSelectedLosses(['Preventive M/T']);
    setRemarks('Nominal continuous production achieved without deviation.');
    showSuccess('Auto-Filled!', 'Standard previous shift specifications populated.');
  }

  function handleQuickFillNominals() {
    setProdQty(targetQty || '2000');
    setTimeFrom('08:00');
    setTimeTo('16:30');
    setSelectedLosses([]);
    setRemarks('100% target achieved. Zero abnormal downtime.');
    showSuccess('Nominals Applied', 'Standard target and zero-loss presets set.');
  }

  function toggleLoss(loss: string) {
    if (selectedLosses.includes(loss)) {
      setSelectedLosses(selectedLosses.filter((l) => l !== loss));
    } else {
      setSelectedLosses([...selectedLosses, loss]);
    }
  }

  // Row Modal Handlers
  function handleOpenAddRow() {
    setEditingRowIndex(null);
    setIsRowModalOpen(true);
  }

  function handleOpenEditRow(index: number) {
    setEditingRowIndex(index);
    setIsRowModalOpen(true);
  }

  function handleSaveRow(row: Record<string, unknown>) {
    if (editingRowIndex !== null && editingRowIndex >= 0) {
      setOperationRows((prev) => {
        const copy = [...prev];
        copy[editingRowIndex] = row;
        return copy;
      });
    } else {
      setOperationRows((prev) => [...prev, row]);
    }
    setLastSavedRow(row);
  }

  function handleDeleteRow(index: number) {
    setOperationRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Validation
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!department) errors.department = 'Department is required';
    if (!machineNo) errors.machineNo = 'Machine No. is required';
    if (!operator) errors.operator = 'Operator is required';
    if (!shift) errors.shift = 'Shift is required';
    if (!entryDate) errors.entryDate = 'Production date is required';
    if (!prodQty || Number(prodQty) <= 0) errors.prodQty = 'Valid production quantity is required';
    if (!tool && !template?.grid?.columns) errors.tool = 'Tool / Model / Part is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(status: 'draft' | 'submitted') {
    if (status === 'submitted' && !validateForm()) {
      showError('Validation Incomplete', 'Please fill in all mandatory fields before submitting for approval.');
      return;
    }

    setIsSubmitting(true);
    const submissionId = `sub_${Date.now().toString(36)}`;
    const templateSlug = template?.id || template?.templateId || 'tpl_press_shop';
    const prodTimeWindow = `${timeFrom} – ${timeTo} (${computedDuration})`;

    const submissionData = {
      submissionId,
      id: submissionId,
      templateId: templateSlug,
      plant: user?.plant || 'Plant-V',
      department,
      date: entryDate,
      shift,
      status: status === 'submitted' ? 'pending' : 'draft',
      syncStatus: 'synced',
      rows:
        operationRows.length > 0
          ? operationRows
          : [
            {
              machine: machineNo,
              operator,
              tool,
              grade,
              productionType: prodType,
              qty: Number(prodQty) || 0,
              prodQty: Number(prodQty) || 0,
              targetQty: Number(targetQty) || 0,
              timeRange: prodTimeWindow,
              timeFrom,
              timeTo,
              losses: selectedLosses,
              remarks,
            },
          ],
      remarks,
      operatorName: operator,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save locally to Dexie (Offline-First)
      await db.submissions.put({
        submissionId,
        syncStatus: 'synced',
        updatedAt: Date.now(),
        payload: submissionData,
      });

      // Send to backend API
      try {
        await api.post('/api/submissions', submissionData);
      } catch (err) {
        console.warn('Backend offline or saved locally:', err);
      }

      setToastMessage(status === 'submitted' ? 'Production entry submitted for supervisor approval!' : 'Draft saved successfully!');
      setTimeout(() => {
        if (status === 'submitted') {
          nav('/approvals');
        } else {
          nav('/entry');
        }
      }, 1200);
    } catch (e) {
      console.error(e);
      showError('Failed to Save Entry', 'An error occurred while saving the production logbook: ' + String(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Keyboard Shortcuts: Ctrl+S to submit, Ctrl+D for draft
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave('submitted');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleSave('draft');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    department,
    machineNo,
    operator,
    shift,
    entryDate,
    prodQty,
    tool,
    grade,
    timeFrom,
    timeTo,
    selectedLosses,
    operationRows,
  ]);

  const hasCustomColumns = !!(template?.grid?.columns && template.grid.columns.length > 2);

  return (
    <div style={{ width: '100%', margin: '0 auto', paddingBottom: 40 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 600,
            fontSize: 14,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Screen Title & Top Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton to="/dashboard" label="Back" variant="nav" />
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: T.ink,
                margin: '0 0 2px',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              Shopfloor Production Entry Log
            </h1>
            <div style={{ fontSize: 13, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ cursor: 'pointer', color: T.blue, fontWeight: 500 }} onClick={() => nav('/entry')}>
                Production
              </span>
              <span>&gt;</span>
              <span style={{ color: T.ink, fontWeight: 600 }}>
                {template ? template.name : 'Add Entry'}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Badge with Working Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: T.ink,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontWeight: 600,
                fontSize: 13,
                color: T.ink,
                cursor: 'pointer',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setEntryDate(new Date().toISOString().slice(0, 10))}
            style={{
              background: '#EFF6FF',
              color: T.blue,
              border: '1px solid #BFDBFE',
              borderRadius: 6,
              padding: '7px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Set to today"
          >
            Today
          </button>
        </div>
      </div>

      {/* Auto-Filler & Shortcuts Bar for Operator Ease */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          padding: '12px 18px',
          background: 'rgba(240, 249, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 14,
          border: '1px solid rgba(186, 230, 253, 0.85)',
          boxShadow: '0 2px 10px rgba(2, 132, 199, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#0369A1' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <b>Operator Speed Tools:</b>
          <button
            type="button"
            onClick={handleQuickFillPreviousShift}
            style={{
              background: '#FFFFFF',
              color: '#0284C7',
              border: '1px solid #7DD3FC',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Auto-fill previous shift specs and nominal parameters"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Auto-Fill Prev Spec</span>
          </button>
          <button
            type="button"
            onClick={handleQuickFillNominals}
            style={{
              background: '#FFFFFF',
              color: '#0284C7',
              border: '1px solid #7DD3FC',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
            title="Set standard nominal target without stoppage"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>100% Target Preset</span>
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#0369A1' }}>
          Shortcuts: <kbd style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 5, fontWeight: 600, border: '1px solid #BAE6FD' }}>Ctrl+S</kbd> Submit ·{' '}
          <kbd style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 5, fontWeight: 600, border: '1px solid #BAE6FD' }}>Ctrl+D</kbd> Draft
        </div>
      </div>

      {/* Main Entry Card */}
      <div
        className="responsive-card apple-card"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
          padding: 28,
        }}
      >
        {/* Section 1: Department, Machine No., Operator, Shift */}
        <div className="grid-entry-header" style={{ marginBottom: 28 }}>
          {/* Department */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
              Department <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                const firstMachine = (MACHINES_BY_DEPT[e.target.value] || [])[0];
                if (firstMachine) setMachineNo(firstMachine);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: formErrors.department ? '1px solid #EF4444' : `1px solid ${T.border}`,
                background: '#FFFFFF',
                color: T.ink,
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {departmentsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {formErrors.department && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{formErrors.department}</div>}
          </div>

          {/* Machine No. */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
              Machine No. <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: formErrors.machineNo ? '1px solid #EF4444' : `1px solid ${T.border}`,
                background: '#FFFFFF',
                color: T.ink,
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {machinesList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {formErrors.machineNo && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{formErrors.machineNo}</div>}
          </div>

          {/* Operator */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
              Operator <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: formErrors.operator ? '1px solid #EF4444' : `1px solid ${T.border}`,
                background: '#FFFFFF',
                color: T.ink,
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="Ramesh">Ramesh (Press Shop)</option>
              <option value="Vinay">Vinay (Operator)</option>
              <option value="Mangesh G.">Mangesh G.</option>
              <option value="Pankaj K.">Pankaj K.</option>
              <option value="Ravindra">Ravindra</option>
              <option value="Vijay">Vijay</option>
              <option value="Suresh">Suresh</option>
              <option value="Kumar">Kumar</option>
              <option value="Arun">Arun</option>
            </select>
            {formErrors.operator && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{formErrors.operator}</div>}
          </div>

          {/* Shift */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
              Shift <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={shift}
              onChange={(e) => {
                const val = e.target.value;
                setShift(val);
                if (val.includes('Shift A') || val.includes('A (')) {
                  applyTimePreset('A');
                } else if (val.includes('Shift B') || val.includes('B (')) {
                  applyTimePreset('B');
                } else if (val.includes('Shift C') || val.includes('C (')) {
                  applyTimePreset('C');
                } else if (val.includes('General')) {
                  applyTimePreset('G');
                }
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: formErrors.shift ? '1px solid #EF4444' : `1px solid ${T.border}`,
                background: '#FFFFFF',
                color: T.ink,
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {shiftsList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {formErrors.shift && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{formErrors.shift}</div>}
          </div>
        </div>

        {/* Section 2: Production Details */}
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
              margin: '0 0 16px',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Production Details
          </h2>

          <div className="grid-entry-details" style={{ alignItems: 'start' }}>
            {/* Tool / Model / Part Code */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
                Tool / Model / Part <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={tool}
                onChange={(e) => setTool(e.target.value)}
                placeholder="e.g. 506600 or PR-450"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: formErrors.tool ? '1px solid #EF4444' : `1px solid ${T.border}`,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
              {formErrors.tool && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{formErrors.tool}</div>}
            </div>

            {/* Grade / Material */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
                Grade / Material
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 50C660 CRGO"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Production Type (Radio: Kgs / Nos) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10 }}>
                Production Type
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 42 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: T.ink }}>
                  <input
                    type="radio"
                    name="prodType"
                    value="Kgs"
                    checked={prodType === 'Kgs'}
                    onChange={() => setProdType('Kgs')}
                    style={{ accentColor: T.blue, cursor: 'pointer' }}
                  />
                  Kgs
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: T.ink }}>
                  <input
                    type="radio"
                    name="prodType"
                    value="Nos"
                    checked={prodType === 'Nos'}
                    onChange={() => setProdType('Nos')}
                    style={{ accentColor: T.blue, cursor: 'pointer' }}
                  />
                  Nos
                </label>
              </div>
            </div>

            {/* Production Qty */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
                Production Qty <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={prodQty}
                onChange={(e) => setProdQty(e.target.value)}
                placeholder="e.g. 1980"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: formErrors.prodQty ? '1px solid #EF4444' : `1px solid ${T.border}`,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
              {formErrors.prodQty && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{formErrors.prodQty}</div>}
            </div>

            {/* Production Time Range with Layman-Workable Single-Touch Presets */}
            <div
              style={{
                gridColumn: 'span 2',
                background: 'rgba(248, 250, 252, 0.75)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: 16,
                padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
                      Production Time Window <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      (1-tap shift preset or fine-tune times)
                    </span>
                  </div>
                </div>

                {computedDuration && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1D4ED8',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      padding: '4px 12px',
                      borderRadius: 999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Run Duration: {computedDuration}</span>
                  </div>
                )}
              </div>

              {/* Layman-Workable Single-Touch Shift/Time Presets */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Quick Shift Time Presets:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'A', label: 'Shift A', window: '06:00 – 14:00' },
                    { id: 'B', label: 'Shift B', window: '14:00 – 22:00' },
                    { id: 'C', label: 'Shift C', window: '22:00 – 06:00' },
                    { id: 'G', label: 'General', window: '09:00 – 17:30' },
                  ].map((p) => {
                    const isSelected = activeTimePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyTimePreset(p.id as any)}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, #1E60D5 0%, #1D4ED8 100%)'
                            : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          border: isSelected ? '1px solid #1D4ED8' : '1px solid #CBD5E1',
                          borderRadius: 10,
                          padding: '7px 14px',
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: isSelected
                            ? '0 3px 10px rgba(30, 96, 213, 0.3)'
                            : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span>{p.label}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: isSelected ? 'rgba(255,255,255,0.85)' : '#64748B',
                          }}
                        >
                          ({p.window})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exact Time Pickers for Fine Tuning */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  background: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Start Time:</span>
                  <input
                    type="time"
                    value={timeFrom}
                    onChange={(e) => {
                      setTimeFrom(e.target.value);
                      setActiveTimePreset('custom');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 14,
                      color: T.ink,
                      background: '#F8FAFC',
                      outline: 'none',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>End Time:</span>
                  <input
                    type="time"
                    value={timeTo}
                    onChange={(e) => {
                      setTimeTo(e.target.value);
                      setActiveTimePreset('custom');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 14,
                      color: T.ink,
                      background: '#F8FAFC',
                      outline: 'none',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Machine Operations Log with Popup Form Data Collection */}
        {hasCustomColumns && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.ink,
                    margin: 0,
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{template?.grid?.label || 'Machine Operations Log'}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: T.blue, padding: '2px 8px', borderRadius: 999 }}>
                    {operationRows.length} {operationRows.length === 1 ? 'Record' : 'Records'}
                  </span>
                </h2>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  Spacious modal form input with auto-fillers & reason codes (replaces cramped 130px cells)
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleOpenAddRow}
                  style={{
                    background: T.blue,
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(30, 96, 213, 0.2)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Operation Row</span>
                </button>
              </div>
            </div>

            {/* Display Rows in a Clean Responsive Summary View */}
            {operationRows.length === 0 ? (
              <div
                onClick={handleOpenAddRow}
                style={{
                  border: `2px dashed ${T.border}`,
                  borderRadius: 10,
                  padding: '28px 20px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = T.blue)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = T.border)}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#1D4ED8' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                  No operation records added yet for this shift
                </div>
                <p style={{ fontSize: 12, color: T.muted, maxWidth: 360, margin: '4px auto 12px' }}>
                  Click below to open the dialog and record parameters, quantities, and downtime reasons.
                </p>
                <span
                  style={{
                    background: '#FFFFFF',
                    color: T.blue,
                    border: `1px solid ${T.border}`,
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Open Row Entry Form</span>
                </span>
              </div>
            ) : (
              <div className="table-scroll" style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}`, textAlign: 'left', color: T.muted }}>
                      <th style={{ padding: '10px 12px', width: 40, fontWeight: 600 }}>#</th>
                      {template.grid.columns.slice(0, 5).map((col) => (
                        <th key={col.key} style={{ padding: '10px 12px', fontWeight: 600 }}>
                          {col.label}
                        </th>
                      ))}
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Stoppages / Loss</th>
                      <th style={{ padding: '10px 12px', width: 110, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationRows.map((row, rIdx) => {
                      // Detect losses
                      const lossSum =
                        Number(row.downTime || 0) +
                        Number(row.mcBd || 0) +
                        Number(row.breakDownMt || 0) +
                        Number(row.toolProblem || 0) +
                        Number(row.settingTime || 0);

                      return (
                        <tr
                          key={rIdx}
                          style={{
                            borderBottom: `1px solid ${T.border}`,
                            background: '#FFFFFF',
                          }}
                        >
                          <td style={{ padding: '12px 12px', color: T.muted, fontWeight: 600 }}>{rIdx + 1}</td>
                          {template.grid.columns.slice(0, 5).map((col) => (
                            <td key={col.key} style={{ padding: '12px 12px', color: T.ink, fontWeight: 500 }}>
                              {String(row[col.key] ?? '—')}
                            </td>
                          ))}
                          <td style={{ padding: '12px 12px' }}>
                            {lossSum > 0 ? (
                              <span style={{ color: '#DC2626', fontWeight: 600, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                {lossSum} min loss
                              </span>
                            ) : (
                              <span style={{ color: '#10B981', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Zero loss
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRow(rIdx)}
                                style={{
                                  background: '#EFF6FF',
                                  color: T.blue,
                                  border: '1px solid #BFDBFE',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Edit row"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(rIdx)}
                                style={{
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '5px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Delete row"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Section 4: QA Observation Matrix (if template has qaGrid) */}
        {template?.qaGrid && (
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: T.ink,
                margin: '0 0 14px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {template.qaGrid.label || 'Quality Assurance Verification Matrix'}
            </h2>
            <div className="table-scroll" style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}`, textAlign: 'left', color: T.muted }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Inspection Parameter</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Engineering Spec</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Observed Value</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>QA Conformance</th>
                  </tr>
                </thead>
                <tbody>
                  {qaRows.map((q, qIdx) => (
                    <tr key={qIdx} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.ink }}>{q.param}</td>
                      <td style={{ padding: '10px 14px', color: T.muted }}>{q.spec}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <input
                          type="text"
                          value={q.act}
                          onChange={(e) => {
                            const copy = [...qaRows];
                            copy[qIdx].act = e.target.value;
                            setQaRows(copy);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `1px solid ${T.border}`,
                            fontSize: 13,
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Passed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 5: Losses / Downtime */}
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
              margin: '0 0 16px',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Losses / Downtime
          </h2>

          <div className="grid-losses">
            {lossOptionsList.map((loss) => {
              const isChecked = selectedLosses.includes(loss);
              return (
                <label
                  key={loss}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: T.ink,
                    userSelect: 'none',
                    minHeight: 36,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLoss(loss)}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: T.blue,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                  />
                  <span>{loss}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 6: Remarks */}
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
              margin: '0 0 12px',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Remarks
          </h2>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter any remarks..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              fontSize: 14,
              color: T.ink,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Bottom Actions Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderTop: `1px solid ${T.border}`,
            paddingTop: 20,
          }}
        >
          <div style={{ fontSize: 12, color: T.muted }}>
            Keyboard shortcut: Press <kbd style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Ctrl+S</kbd> to submit directly
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('draft')}
              style={{
                background: '#FFFFFF',
                color: T.ink,
                border: `1px solid ${T.border}`,
                padding: '11px 22px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: isSubmitting ? 'wait' : 'pointer',
                minHeight: 44,
              }}
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('submitted')}
              style={{
                background: T.blue,
                color: '#FFFFFF',
                border: 'none',
                padding: '11px 26px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(30, 96, 213, 0.25)',
                minHeight: 44,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              {isSubmitting ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>

      {/* Row Entry Modal */}
      <RowEntryModal
        isOpen={isRowModalOpen}
        onClose={() => setIsRowModalOpen(false)}
        onSave={handleSaveRow}
        initialData={editingRowIndex !== null && editingRowIndex >= 0 ? operationRows[editingRowIndex] : null}
        rowIndex={editingRowIndex}
        template={template}
        lastSavedRow={lastSavedRow}
      />

      {/* Role-Based Logbook Submission History & Daily/Monthly Analytics */}
      <RoleSubmissionHistory
        currentTemplateId={template?.id || template?.templateId}
        department={department}
      />
    </div>
  );
}
