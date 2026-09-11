import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductionEntryScreen } from './ProductionEntryScreen';
import { FormRenderer } from '../engine/FormRenderer';
import { SectionTitle } from '../components/SectionTitle';
import { Card } from '../components/Card';
import { BackButton } from '../components/BackButton';
import { useAuthStore } from '../store/authStore';
import { hasScreenAccess } from '../rbac/accessControl';
import { useTemplates } from '../api/useTemplates';
import { useSubmissions } from '../api/useSubmissions';
import { T } from '../theme/tokens';
import type { FormTemplate } from '../types/FormTemplate';
import type { FormSubmission } from '../types/FormSubmission';

const FALLBACK_TEMPLATES: FormTemplate[] = [
  {
    id: 'tpl_press_shop',
    name: 'Press Shop & Notching - Machine Utilisation Record',
    version: 1,
    sourceRef: 'PR : QR : F : 405',
    plants: ['Plant-V'],
    departments: ['Press Shop & Notching'],
    header: [
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'shift', label: 'Shift', type: 'select', source: 'shifts' },
      { key: 'shiftIncharge', label: 'Shift Incharge / Supervisor', type: 'user_select', role: 'role_supervisor' },
    ],
    grid: {
      label: 'Machine Utilisation Record',
      columns: [
        { key: 'machine', label: 'M/c No.', type: 'select', source: 'machines' },
        { key: 'operator', label: 'Operator', type: 'user_select', role: 'role_operator' },
        { key: 'tool', label: 'Tool', type: 'text' },
        { key: 'grade', label: 'Grade', type: 'text' },
        { key: 'prodKgs', label: 'Prod Kgs', type: 'number' },
        { key: 'prodNos', label: 'Prod Nos', type: 'number' },
        { key: 'timeFrom', label: 'From Time', type: 'text' },
        { key: 'timeTo', label: 'To Time', type: 'text' },
        { key: 'noMaterial', label: 'No Material (min)', type: 'number' },
        { key: 'noTool', label: 'No Tool (min)', type: 'number' },
        { key: 'toolProblem', label: 'Tool Problem (min)', type: 'number' },
        { key: 'breakDownMt', label: 'Break Down M/T (min)', type: 'number' },
        { key: 'preventiveMt', label: 'Preventive M/T (min)', type: 'number' },
        { key: 'noPower', label: 'No Power (min)', type: 'number' },
        { key: 'noOperator', label: 'No Operator (min)', type: 'number' },
        { key: 'wSetter', label: 'W / Settor (min)', type: 'number' },
        { key: 'toolSetting', label: 'Tool Setting (min)', type: 'number' },
        { key: 'noLoad', label: 'No Load (min)', type: 'number' },
        { key: 'misc', label: 'Misc (min)', type: 'number' },
        { key: 'remark', label: 'Remarks', type: 'text' },
      ],
    },
    signOff: ['operator', 'supervisor'],
  },
  {
    id: 'tpl_assembly_dpr',
    name: 'Assembly - Daily Production Report',
    version: 1,
    sourceRef: 'PR:F407',
    plants: ['Aurangabad'],
    departments: ['Assembly'],
    header: [
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'shift', label: 'Shift', type: 'select', source: 'shifts' },
      { key: 'shiftIncharge', label: 'Shift Incharge', type: 'user_select', role: 'role_supervisor' },
    ],
    grid: {
      label: 'Machine-wise Production & Losses',
      columns: [
        { key: 'machine', label: 'M/c No.', type: 'select', source: 'machines' },
        { key: 'operator', label: 'Operator Name', type: 'user_select', role: 'role_operator' },
        { key: 'model', label: 'Model No.', type: 'select', source: 'models' },
        { key: 'grade', label: 'Grade', type: 'text' },
        { key: 'cl', label: 'CL', type: 'number' },
        { key: 'targetQty', label: 'Target Qty', type: 'number' },
        { key: 'actualQty', label: 'Actual Qty', type: 'number' },
        { key: 'settingTime', label: 'Setting Time (min)', type: 'number' },
        { key: 'mcBd', label: 'M/c Bd Loss (min)', type: 'number' },
        { key: 'noMaterialChildPart', label: 'No Material / Child Part (min)', type: 'number' },
        { key: 'miscLoss', label: 'Misc Loss (min)', type: 'number' },
        { key: 'remark', label: 'Remark', type: 'text' },
      ],
    },
    signOff: ['operator', 'supervisor'],
  },
  {
    id: 'tpl_machine_shop_dpr',
    name: 'Machine Shop - Daily Production Report',
    version: 1,
    sourceRef: 'MS PR:F509',
    plants: ['Aurangabad'],
    departments: ['Machine Shop'],
    header: [
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'shift', label: 'Shift', type: 'select', source: 'shifts' },
      { key: 'machine', label: 'Machine No.', type: 'select', source: 'machines' },
      { key: 'machineName', label: 'Machine Name', type: 'text' },
      { key: 'operator', label: 'Operator Name', type: 'user_select', role: 'role_operator' },
      { key: 'supervisor', label: 'Supervisor Name', type: 'user_select', role: 'role_supervisor' },
    ],
    grid: {
      label: 'Operations',
      columns: [
        { key: 'proOrderNo', label: 'Pro. Order No.', type: 'text' },
        { key: 'opSeq', label: 'Op. Sequence No.', type: 'text' },
        { key: 'partCode', label: 'Part Code', type: 'text' },
        { key: 'partDesc', label: 'Part Description', type: 'text' },
        { key: 'planQty', label: 'Plan Qty', type: 'number' },
        { key: 'actQty', label: 'Act. Qty', type: 'number' },
        { key: 'accepted', label: 'Accepted', type: 'number' },
        { key: 'rejected', label: 'Rejected', type: 'number' },
        { key: 'pendingQA', label: 'Pending QA', type: 'number' },
        { key: 'stdTime', label: 'Std Processing Time (min)', type: 'number' },
        { key: 'actTime', label: 'Act. Processing Time (min)', type: 'number' },
        { key: 'downTime', label: 'Down/Idle Time (min)', type: 'number' },
        { key: 'downCode', label: 'Down/Idle Code (1-20)', type: 'select', source: 'reasonCodes' },
        { key: 'remark', label: 'Remark', type: 'text' },
      ],
    },
    signOff: ['operator', 'supervisor', 'approvedBy'],
  },
  {
    id: 'tpl_die_casting',
    name: 'Die Casting Production Log Book (40T-500T VDC)',
    version: 1,
    sourceRef: 'BRD:6#3',
    plants: ['Aurangabad'],
    departments: ['Die Casting'],
    header: [
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'shift', label: 'Shift', type: 'select', source: 'shifts' },
      { key: 'machine', label: 'Machine / Tonnage', type: 'select', source: 'machines' },
      { key: 'operator', label: 'Operator Name', type: 'user_select', role: 'role_operator' },
      { key: 'shiftIncharge', label: 'Shift Incharge Name', type: 'user_select', role: 'role_supervisor' },
    ],
    grid: {
      label: 'Batch Production & Process Parameters',
      columns: [
        { key: 'batchNo', label: 'Batch No.', type: 'text' },
        { key: 'model', label: 'Model', type: 'select', source: 'models' },
        { key: 'stHt', label: 'ST. Ht. (mm)', type: 'number' },
        { key: 'stWt', label: 'ST. Wt. (kg)', type: 'number' },
        { key: 'dcrWt', label: 'DCR Wt. (kg)', type: 'number' },
        { key: 'alWt', label: 'AL. Wt. (kg)', type: 'number' },
        { key: 'alGrade', label: 'AL. Grade', type: 'text' },
        { key: 'mlGrade', label: 'M/L Grade', type: 'text' },
        { key: 'accPr', label: 'Accu. Pr. (kg/cm²)', type: 'number' },
        { key: 'clampPr', label: 'Clamp. Pr. (kg/cm²)', type: 'number' },
        { key: 'injPr', label: 'Inj. Pr. (kg/cm²)', type: 'number' },
        { key: 'alTemp', label: 'AL. Tempt. (°C)', type: 'number' },
        { key: 'alSetWt', label: 'AL. Set Wt. (kg)', type: 'number' },
        { key: 'pourTime', label: 'AL Pouring Time', type: 'text' },
        { key: 'sleeveNo', label: 'Sleeve / Sprue No.', type: 'text' },
        { key: 'totalNos', label: 'Total Produced Nos', type: 'number' },
        { key: 'remark', label: 'Remarks', type: 'text' },
      ],
    },
    signOff: ['operator', 'supervisor'],
  },
  {
    id: 'tpl_ctl',
    name: 'CTL Machine Production Record',
    version: 1,
    sourceRef: 'Plant-V',
    plants: ['Plant-V'],
    departments: ['CTL'],
    header: [
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'shift', label: 'Shift / Time', type: 'select', source: 'shifts' },
      { key: 'shiftIncharge', label: 'Prod. Supervisor/Engineer Name', type: 'user_select', role: 'role_supervisor' },
    ],
    grid: {
      label: 'Coil Processing',
      columns: [
        { key: 'model', label: 'Model No.', type: 'select', source: 'models' },
        { key: 'coilWidth', label: 'Coil Width Before CTL (mm)', type: 'number' },
        { key: 'coilId', label: 'Coil ID No.', type: 'text' },
        { key: 'grade', label: 'Material Grade', type: 'text' },
        { key: 'cuttingSize', label: 'Cutting Size', type: 'text' },
        { key: 'prodQtyKg', label: 'Prod Qty (Kgs/MM)', type: 'number' },
      ],
    },
    qaGrid: {
      label: 'QA Observations',
      columns: [
        { key: 'sampleNo', label: 'No. of Sample', type: 'number' },
        { key: 'width', label: 'Observed Size - Width', type: 'number' },
        { key: 'length', label: 'Observed Size - Length', type: 'number' },
        { key: 'squareness', label: 'Sqr. Ness Out', type: 'number' },
        { key: 'edgeWaviness', label: 'Edge Waviness', type: 'number' },
        { key: 'wattLoss', label: 'Watt Loss', type: 'number' },
        { key: 'burr', label: 'Burr', type: 'text' },
      ],
    },
    signOff: ['operator', 'supervisor', 'qa'],
  },
  {
    id: 'tpl_slt',
    name: 'SLT Machine Production Record',
    version: 1,
    sourceRef: 'RMP : R : 275',
    plants: ['Plant-V'],
    departments: ['SLT'],
    header: [
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'shift', label: 'Shift / Time', type: 'select', source: 'shifts' },
      { key: 'shiftIncharge', label: 'Prod. Supervisor/Engineer Name', type: 'user_select', role: 'role_supervisor' },
    ],
    grid: {
      label: 'Slitting Line Coil Processing',
      columns: [
        { key: 'model', label: 'Model No.', type: 'select', source: 'models' },
        { key: 'coilWidth', label: 'Coil Width Before SLT (mm)', type: 'number' },
        { key: 'coilId', label: 'Coil ID No.', type: 'text' },
        { key: 'grade', label: 'Material Grade', type: 'text' },
        { key: 'cuttingSize', label: 'Slit Cutting Size', type: 'text' },
        { key: 'prodQtyKg', label: 'Prod Qty (Kgs/MM)', type: 'number' },
      ],
    },
    qaGrid: {
      label: 'QA Observations',
      columns: [
        { key: 'sampleNo', label: 'No. of Sample', type: 'number' },
        { key: 'width', label: 'Observed Size - Width', type: 'number' },
        { key: 'length', label: 'Observed Size - Length', type: 'number' },
        { key: 'squareness', label: 'Sqr. Ness Out', type: 'number' },
        { key: 'edgeWaviness', label: 'Edge Waviness', type: 'number' },
        { key: 'wattLoss', label: 'Watt Loss', type: 'number' },
        { key: 'burr', label: 'Burr', type: 'text' },
      ],
    },
    signOff: ['operator', 'supervisor', 'qa'],
  },
];

export function FormEntryScreen() {
  const { templateId, id } = useParams();
  const nav = useNavigate();
  const role = useAuthStore((s) => s.role);
  const { data: remoteTemplates = [] } = useTemplates();
  const { data: submissions = [], isLoading: subLoading } = useSubmissions();

  // Combine remote templates from API and canonical fallback templates
  const allTemplates: FormTemplate[] = React.useMemo(() => {
    const list = Array.isArray(remoteTemplates) && remoteTemplates.length > 0 ? [...(remoteTemplates as FormTemplate[])] : [];
    for (const def of FALLBACK_TEMPLATES) {
      const defId = def.id ?? def.templateId;
      if (!list.some((l) => (l.id ?? l.templateId) === defId)) {
        list.push(def);
      }
    }
    return list;
  }, [remoteTemplates]);

  const [activeTemplateId, setActiveTemplateId] = useState(templateId || 'tpl_press_shop');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (templateId && templateId !== activeTemplateId) {
      setActiveTemplateId(templateId);
    }
  }, [templateId]);

  // If reviewing an existing submission by ID
  if (id) {
    const found = (submissions as FormSubmission[]).find(
      (s) => s.id === id || (s as unknown as { submissionId: string }).submissionId === id,
    );
    if (subLoading) return <Card>Loading submission…</Card>;
    if (!found) return <Card>Submission {id} not found locally or on server.</Card>;
    const tpl = allTemplates.find((t) => (t.id ?? t.templateId) === found.templateId) ?? FALLBACK_TEMPLATES[0];
    return (
      <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <BackButton to="/approvals" label="Back to Approvals" />
        </div>
        <SectionTitle sub={`${tpl.name} · ${found.id}`}>Review & sign-off</SectionTitle>
        <FormRenderer
          template={tpl}
          submissionId={found.id}
          initialHeader={{ date: found.date, shift: found.shift }}
          initialRows={found.rows ?? [{}]}
          initialQa={found.qaObservations ?? []}
          initialSigns={found.signs ?? []}
          initialStatus={found.status}
          initialCorrection={(found as unknown as { correction?: { status?: string; reason?: string; requestedBy?: string; requestedAt?: string } }).correction}
        />
      </div>
    );
  }

  const currentTemplate = allTemplates.find((t) => (t.id ?? t.templateId) === activeTemplateId) || allTemplates[0];

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 40 }}>
      {/* Radiant Glassmorphic Form Hub Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(11, 25, 44, 0.94) 0%, rgba(17, 38, 68, 0.92) 50%, rgba(10, 25, 47, 0.96) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderTop: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.35), 0 0 30px rgba(30, 96, 213, 0.15)',
          padding: '20px 24px',
          marginBottom: 22,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Ambient Decorative Glow Circles */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: 80,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: '35%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30, 96, 213, 0.18) 0%, transparent 70%)',
            filter: 'blur(35px)',
            pointerEvents: 'none',
          }}
        />

        {/* 3-Column Responsive Header: Left Info | Middle Highlighted Form Dropdown | Right Meta & Actions */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          {/* 1. Left: Active Logbook Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, flex: '1 1 280px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #2B73EE 0%, #1750B8 100%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 14px rgba(30, 96, 213, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#38BDF8',
                    background: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', display: 'inline-block', boxShadow: '0 0 6px #38BDF8' }} />
                  ACTIVE LOGBOOK
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.85)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {currentTemplate.departments?.[0] || 'Production'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#93C5FD',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  {currentTemplate.plants?.[0] || 'Plant-V'}
                </span>
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1.3,
                }}
              >
                {currentTemplate.name}
              </h2>
            </div>
          </div>

          {/* 2. Middle (Prominent): Form Selector Dropdown Highlighted with Radiant Glassmorphism */}
          <div
            style={{
              flex: '1 1 340px',
              maxWidth: 460,
              minWidth: 280,
              background: 'linear-gradient(135deg, rgba(30, 96, 213, 0.2) 0%, rgba(14, 165, 233, 0.12) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.55)',
              borderRadius: 16,
              padding: '8px 14px',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
              <label
                htmlFor="main-form-selector"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#38BDF8',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>SELECT PRODUCTION FORM</span>
              </label>
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontWeight: 600,
                }}
              >
                {allTemplates.length} Available
              </span>
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <select
                id="main-form-selector"
                aria-label="Select Production Form"
                value={activeTemplateId}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveTemplateId(val);
                  nav(`/entry/${val}`);
                }}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(6, 16, 29, 0.85)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
              >
                {allTemplates.map((t) => {
                  const tid = t.id ?? t.templateId;
                  const dept = t.departments?.[0] || 'Production';
                  const plantName = t.plants?.[0] || 'Plant-V';
                  return (
                    <option
                      key={tid}
                      value={tid}
                      style={{ background: '#0B192C', color: '#FFFFFF', padding: '8px' }}
                    >
                      {dept}: {t.name} ({plantName})
                    </option>
                  );
                })}
              </select>

              <div
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* 3. Right: Shift / Live Badge & Admin Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                borderRadius: 999,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              <span>Live Shift Ready</span>
            </div>

            {role === 'role_admin' && (
              <button
                type="button"
                onClick={() => nav('/admin/templates')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#E2E8F0',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#E2E8F0';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Templates</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render Press Shop & Notching reference design for ALL forms */}
      <ProductionEntryScreen template={currentTemplate} />
    </div>
  );
}
