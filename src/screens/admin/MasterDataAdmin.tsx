import React, { useState, useMemo } from 'react';
import { useMasterData, useCreateMasterItem, useUpdateMasterItem, useDeleteMasterItem } from '../../api/useMasterData';
import { T } from '../../theme/tokens';
import { primaryBtn, ghostBtn } from '../../components/buttons';
import { BackButton } from '../../components/BackButton';
import { showConfirm, showSuccess } from '../../utils/alerts';

export interface MasterItem {
  id: string;
  code: string;
  name: string;
  department?: string;
  plant?: string;
  timings?: string;
  details?: string;
  status?: string;
}

export interface MasterCategory {
  id: string;
  apiKind: string;
  label: string;
  singular: string;
  icon: string;
  description: string;
  defaultItems: MasterItem[];
}

export function getCategoryIcon(id: string, size = 16) {
  switch (id) {
    case 'departments':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      );
    case 'machines':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'plants':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M18 16h2" />
          <path d="M18 12h2" />
        </svg>
      );
    case 'shifts':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'models':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'reason-codes':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
}

export const MASTER_CATEGORIES: MasterCategory[] = [
  {
    id: 'departments',
    apiKind: 'departments',
    label: 'Departments',
    singular: 'Department',
    icon: 'departments',
    description: 'Manufacturing shop floors, production lines, and business units',
    defaultItems: [
      { id: 'dept_psn', code: 'DEPT-PSN', name: 'Press Shop & Notching', plant: 'Plant-V', details: 'Lamination stamping, high-speed presses & notching lines', status: 'Active' },
      { id: 'dept_asm', code: 'DEPT-ASM', name: 'Assembly', plant: 'Aurangabad', details: 'Stator core assembly, rotor skewing & shaft pressing', status: 'Active' },
      { id: 'dept_ms', code: 'DEPT-MS', name: 'Machine Shop', plant: 'Plant-V', details: 'CNC vertical turning, boring & precision machining', status: 'Active' },
      { id: 'dept_dc', code: 'DEPT-DC', name: 'Die Casting', plant: 'Plant-V', details: 'Aluminium rotor die casting (40T–500T VDC)', status: 'Active' },
      { id: 'dept_ctl', code: 'DEPT-CTL', name: 'CTL / SLT', plant: 'Plant-V', details: 'Cut-to-Length & Slitting line coil processing', status: 'Active' },
      { id: 'dept_tr', code: 'DEPT-TR', name: 'Tool Room', plant: 'Plant-V', details: 'Progressive die maintenance & tooling refurbishment', status: 'Active' },
      { id: 'dept_qa', code: 'DEPT-QA', name: 'Quality Assurance', plant: 'Plant-V', details: 'Metallurgical inspection, burr checks & lab testing', status: 'Active' },
    ],
  },
  {
    id: 'machines',
    apiKind: 'machines',
    label: 'Machines & Assets',
    singular: 'Machine',
    icon: 'machines',
    description: 'Production presses, CNC lines, slitting decoilers, and die-casting stations',
    defaultItems: [
      { id: 'm_n3_5446', code: 'N3 - 5446', name: 'Schuler 400T Press', department: 'Press Shop & Notching', plant: 'Plant-V', details: 'Press Shop · Line 1 · 400 Ton Capacity', status: 'Active' },
      { id: 'm_n3_7106', code: 'N3 - 7106', name: 'Aida 300T High Speed', department: 'Press Shop & Notching', plant: 'Plant-V', details: 'Press Shop · Line 2 · 300 SPM', status: 'Active' },
      { id: 'm_n10_1116', code: 'N10 - 1116', name: 'Weingarten Notching Press', department: 'Press Shop & Notching', plant: 'Plant-V', details: 'Notching Line · Rotary Index Table', status: 'Active' },
      { id: 'm_n11_2132', code: 'N11 - 2132', name: 'Minster 200T Stamping', department: 'Press Shop & Notching', plant: 'Plant-V', details: 'Press Shop · Stator Pack Stamping', status: 'Active' },
      { id: 'm_n17_3168', code: 'N17 - 3168', name: 'High-Speed Notcher 150T', department: 'Press Shop & Notching', plant: 'Plant-V', details: 'Notching Line · High Precision', status: 'Active' },
      { id: 'm_n20_7023', code: 'N20 - 7023', name: 'Komatsu 500T Press', department: 'Press Shop & Notching', plant: 'Plant-V', details: 'Heavy Stamping Press', status: 'Active' },
      { id: 'm_hp1', code: 'HP-1 (Stator)', name: 'Hydraulic Press 1 (Stator)', department: 'Assembly', plant: 'Aurangabad', details: 'Assembly Line · Core Stacking', status: 'Active' },
      { id: 'm_hp2', code: 'HP-2 (Rotor)', name: 'Hydraulic Press 2 (Rotor)', department: 'Assembly', plant: 'Aurangabad', details: 'Assembly Line · Rotor Skewing', status: 'Active' },
      { id: 'm_mc101', code: 'MC-101 (VMC)', name: 'Vertical Machining Center 101', department: 'Machine Shop', plant: 'Plant-V', details: 'CNC 4-Axis Vertical Machining', status: 'Active' },
      { id: 'm_ctx1', code: 'CTX-1 (Turn)', name: 'CNC Lathe CTX-1', department: 'Machine Shop', plant: 'Plant-V', details: 'Shaft Precision Turning', status: 'Active' },
      { id: 'm_vdc500', code: '500T-VDC Bühler', name: 'Bühler 500T Vertical Die Caster', department: 'Die Casting', plant: 'Plant-V', details: 'Aluminium Rotor Vertical Injection', status: 'Active' },
      { id: 'm_ctl1250', code: 'CTL-1250-A', name: 'Cut-to-Length Line 1250mm', department: 'CTL / SLT', plant: 'Plant-V', details: 'Decoiler, Straightener & High Precision Shear', status: 'Active' },
    ],
  },
  {
    id: 'plants',
    apiKind: 'plants',
    label: 'Plants & Campuses',
    singular: 'Plant',
    icon: 'plants',
    description: 'Manufacturing plant facilities, factories, and physical campus campuses',
    defaultItems: [
      { id: 'p_v', code: 'PLANT-V', name: 'Plant-V (Hyderabad)', details: 'Plot No. 12, Industrial Area, Patancheru, Hyderabad', status: 'Active' },
      { id: 'p_aur', code: 'PLANT-AUR', name: 'Aurangabad Plant', details: 'Waluj Industrial Estate, Aurangabad, Maharashtra', status: 'Active' },
      { id: 'p_corp', code: 'PLANT-CORP', name: 'Corporate Headquarters', details: 'Somajiguda, Hyderabad, Telangana', status: 'Active' },
    ],
  },
  {
    id: 'shifts',
    apiKind: 'shifts',
    label: 'Work Shifts',
    singular: 'Shift',
    icon: 'shifts',
    description: 'Factory operating shifts, working hours, and production rotations',
    defaultItems: [
      { id: 'sh_a', code: 'SHIFT-A', name: 'Shift A (Morning)', timings: '06:00 AM – 02:00 PM', details: 'First Production Shift · 8.0 Hours', status: 'Active' },
      { id: 'sh_b', code: 'SHIFT-B', name: 'Shift B (Evening)', timings: '02:00 PM – 10:00 PM', details: 'Second Production Shift · 8.0 Hours', status: 'Active' },
      { id: 'sh_c', code: 'SHIFT-C', name: 'Shift C (Night)', timings: '10:00 PM – 06:00 AM', details: 'Overnight Production Shift · 8.0 Hours', status: 'Active' },
      { id: 'sh_gen', code: 'SHIFT-GEN', name: 'General Shift', timings: '09:00 AM – 05:30 PM', details: 'Administrative, Tool Room & Quality Lab', status: 'Active' },
    ],
  },
  {
    id: 'models',
    apiKind: 'models',
    label: 'Models & Materials',
    singular: 'Model',
    icon: 'models',
    description: 'Component part models, product codes, and electrical steel material grades',
    defaultItems: [
      { id: 'mod_50c600', code: '50C600', name: 'Stator Core 50C600 CRGO', details: 'Grade 50C600 · Outer Dia 380mm · High Permeability', status: 'Active' },
      { id: 'mod_50cs30', code: '50CS30', name: 'Rotor Stack 50CS30 Induction', details: 'Grade 50CS30 · 1-Slot Skew · Traction Motor', status: 'Active' },
      { id: 'mod_50c440', code: '50C440', name: 'Frame 132 M/L Lamination', details: 'Industrial AC Motor Frame 132 Spec', status: 'Active' },
      { id: 'mod_50c700', code: '50C700', name: 'Railway Traction Motor Pack', details: 'Locomotive Grade Cold Rolled Silicon Sheet', status: 'Active' },
    ],
  },
  {
    id: 'reason-codes',
    apiKind: 'reason-codes',
    label: 'Loss & Reason Codes',
    singular: 'Reason Code',
    icon: 'reason-codes',
    description: 'Standardized downtime loss reason codes for OEE & utilization analytics',
    defaultItems: [
      { id: 'loss_bd', code: 'BREAK-DOWN', name: 'Break Down', details: 'Mechanical or electrical machine failure requiring maintenance', status: 'Active' },
      { id: 'loss_nt', code: 'NO-TOOL', name: 'No Tool', details: 'Awaiting die, punch or cutter sharpening from Tool Room', status: 'Active' },
      { id: 'loss_tp', code: 'TOOL-PROBLEM', name: 'Tool Problem', details: 'In-process die jamming, burr wear, or guide pin failure', status: 'Active' },
      { id: 'loss_pm', code: 'PREVENTIVE-MT', name: 'Preventive M/T', details: 'Scheduled routine lubrication and preventative maintenance', status: 'Active' },
      { id: 'loss_np', code: 'NO-POWER', name: 'No Power', details: 'Grid power disruption, tripping, or generator changeover', status: 'Active' },
      { id: 'loss_st', code: 'SETTING-TIME', name: 'Setting Time', details: 'Job setup, die clamping, first-piece trial and calibration', status: 'Active' },
      { id: 'loss_qh', code: 'QUALITY-HOLD', name: 'Quality Hold', details: 'QA inspector inspection hold, lamination gap, or burr check', status: 'Active' },
      { id: 'loss_oth', code: 'OTHERS', name: 'Others', details: 'General miscellaneous non-productive shift time', status: 'Active' },
    ],
  },
];

export function MasterDataAdmin() {
  const [currentKind, setCurrentKind] = useState('departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Press Shop & Notching',
    plant: 'Plant-V',
    timings: '06:00 AM – 02:00 PM',
    details: '',
  });

  const activeCategory = useMemo(() => {
    return MASTER_CATEGORIES.find((c) => c.id === currentKind) || MASTER_CATEGORIES[0];
  }, [currentKind]);

  // Query Backend API
  const { data: apiData, isLoading } = useMasterData(activeCategory.apiKind);
  const createMutation = useCreateMasterItem(activeCategory.apiKind);
  const updateMutation = useUpdateMasterItem(activeCategory.apiKind);
  const deleteMutation = useDeleteMasterItem(activeCategory.apiKind);

  // Local storage cache to guarantee immediate responsiveness
  const [localStore, setLocalStore] = useState<Record<string, MasterItem[]>>(() => {
    const init: Record<string, MasterItem[]> = {};
    MASTER_CATEGORIES.forEach((cat) => {
      const saved = localStorage.getItem(`logiq_master_${cat.id}`);
      if (saved) {
        try {
          init[cat.id] = JSON.parse(saved);
        } catch {
          init[cat.id] = cat.defaultItems;
        }
      } else {
        init[cat.id] = cat.defaultItems;
      }
    });
    return init;
  });

  function saveLocalStore(kind: string, items: MasterItem[]) {
    setLocalStore((prev) => {
      const updated = { ...prev, [kind]: items };
      localStorage.setItem(`logiq_master_${kind}`, JSON.stringify(items));
      return updated;
    });
  }

  // Merged display list
  const displayList = useMemo(() => {
    const local = localStore[currentKind] || activeCategory.defaultItems;
    let list: MasterItem[] = [...local];

    if (Array.isArray(apiData) && apiData.length > 0) {
      const parsed = apiData.map((item) => {
        if (typeof item === 'string') {
          return { id: item, code: item, name: item, details: 'Master record', status: 'Active' };
        }
        const o = item as Record<string, unknown>;
        return {
          id: String(o.id ?? o.code ?? o.name),
          code: String(o.code ?? o.id ?? 'REC'),
          name: String(o.name ?? o.label ?? o.code ?? 'Item'),
          department: o.department ? String(o.department) : undefined,
          plant: o.plant ? String(o.plant) : undefined,
          timings: o.timings ? String(o.timings) : undefined,
          details: String(o.details ?? o.description ?? ''),
          status: String(o.status ?? 'Active'),
        };
      });
      // Combine with local items by id
      const seen = new Set<string>();
      const combined: MasterItem[] = [];
      [...parsed, ...local].forEach((item) => {
        const key = (item.code || item.id || item.name).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      });
      list = combined;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          (i.department || '').toLowerCase().includes(q) ||
          (i.details || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentKind, localStore, activeCategory, apiData, searchTerm]);

  function openCreateModal() {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      department: 'Press Shop & Notching',
      plant: 'Plant-V',
      timings: '06:00 AM – 02:00 PM',
      details: '',
    });
    setShowModal(true);
  }

  function openEditModal(item: MasterItem) {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      department: item.department || 'Press Shop & Notching',
      plant: item.plant || 'Plant-V',
      timings: item.timings || '06:00 AM – 02:00 PM',
      details: item.details || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) return;

    if (editingItem) {
      // EDIT
      const updatedItem: MasterItem = {
        ...editingItem,
        code: formData.code.trim(),
        name: formData.name.trim(),
        department: currentKind === 'machines' ? formData.department : undefined,
        plant: currentKind === 'departments' ? formData.plant : undefined,
        timings: currentKind === 'shifts' ? formData.timings : undefined,
        details: formData.details.trim(),
      };

      const updatedList = (localStore[currentKind] || activeCategory.defaultItems).map((i) =>
        i.id === editingItem.id || i.code === editingItem.code ? updatedItem : i
      );
      saveLocalStore(currentKind, updatedList);

      try {
        const { id: _ignoreId, ...payloadWithoutId } = updatedItem;
        await updateMutation.mutateAsync({ id: editingItem.id || editingItem.code, ...payloadWithoutId });
      } catch (err) {
        console.warn('Backend update failed, saved locally:', err);
      }

      setToastMsg({ type: 'success', text: `Updated ${activeCategory.singular} "${updatedItem.name}"!` });
    } else {
      // CREATE
      const newItem: MasterItem = {
        id: `id_${Date.now().toString(36)}`,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        department: currentKind === 'machines' ? formData.department : undefined,
        plant: currentKind === 'departments' ? formData.plant : undefined,
        timings: currentKind === 'shifts' ? formData.timings : undefined,
        details: formData.details.trim(),
        status: 'Active',
      };

      const currentItems = localStore[currentKind] || activeCategory.defaultItems;
      const updatedList = [newItem, ...currentItems];
      saveLocalStore(currentKind, updatedList);

      try {
        await createMutation.mutateAsync(newItem);
      } catch (err) {
        console.warn('Backend create failed, saved locally:', err);
      }

      setToastMsg({ type: 'success', text: `Created new ${activeCategory.singular} "${newItem.name}"!` });
    }

    setTimeout(() => setToastMsg(null), 3500);
    setShowModal(false);
  }

  async function handleDelete(item: MasterItem) {
    const ok = await showConfirm(
      `Delete ${activeCategory.singular}?`,
      `Are you sure you want to delete ${activeCategory.singular} "${item.name}" (${item.code})? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    );
    if (ok) {
      const currentItems = localStore[currentKind] || activeCategory.defaultItems;
      const updatedList = currentItems.filter((i) => i.id !== item.id && i.code !== item.code);
      saveLocalStore(currentKind, updatedList);

      try {
        await deleteMutation.mutateAsync(item.id || item.code);
      } catch (err) {
        console.warn('Backend delete failed, removed locally:', err);
      }

      showSuccess('Deleted Successfully', `Deleted ${activeCategory.singular} "${item.name}" (${item.code}).`);
    }
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 48 }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1000,
            background: toastMsg.type === 'success' ? '#10B981' : '#EF4444',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{toastMsg.type === 'success' ? '✓' : '✕'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Screen Title & Top Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton to="/dashboard" label="Back" variant="nav" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: T.ink,
                  margin: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Enterprise Master Data Administration
              </h1>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: '#EEF5FF',
                  color: T.blue,
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid #D4E5FB',
                }}
              >
                {displayList.length} {activeCategory.label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: T.muted }}>
              Govern core shopfloor master data — changes dynamically update dropdowns across Production Entry, Approvals, and DPRs
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              ...primaryBtn,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              padding: '10px 20px',
              boxShadow: '0 2px 6px rgba(30, 96, 213, 0.25)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            + Add New {activeCategory.singular}
          </button>
        </div>
      </div>

      {/* Master Data Category Navigation Pills */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {MASTER_CATEGORIES.map((cat) => {
          const isActive = currentKind === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCurrentKind(cat.id);
                setSearchTerm('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                border: `1px solid ${isActive ? T.blue : T.border}`,
                background: isActive ? '#EEF5FF' : '#FFFFFF',
                color: isActive ? T.blue : T.ink,
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 6px rgba(30, 96, 213, 0.12)' : 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{getCategoryIcon(cat.id, 16)}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Description Banner */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', color: T.blue }}>{getCategoryIcon(activeCategory.id, 20)}</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{activeCategory.label} Configuration</span>
            <span style={{ fontSize: 13, color: T.muted, marginLeft: 8 }}>— {activeCategory.description}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '3px 10px', borderRadius: 999 }}>
            Dynamic Propagation Active
          </span>
        </div>
      </div>

      {/* Create / Edit Modal Drawer */}
      {showModal && (
        <div
          className="responsive-card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            borderTop: `4px solid ${T.blue}`,
            marginBottom: 24,
            boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>
                {editingItem ? `Edit ${activeCategory.singular}: ${editingItem.name}` : `Create New ${activeCategory.singular} Record`}
              </h2>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                Configure parameters to feed entry logbooks, plant reporting, and operator forms
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid-builder-form">
              {/* Unique Code / Key */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                  Unique Code / Key <span style={{ color: T.red }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentKind === 'machines' ? 'e.g. N25 - 8810' : currentKind === 'departments' ? 'e.g. DEPT-PAINT' : 'e.g. CODE-100'}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              {/* Display Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                  Display Name / Title <span style={{ color: T.red }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentKind === 'machines' ? 'e.g. Aida 600T High Speed Press' : currentKind === 'departments' ? 'e.g. Paint & Coating Shop' : 'e.g. Shift D'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              {/* Department Selector (for Machines) */}
              {currentKind === 'machines' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                    Department Assignment <span style={{ color: T.red }}>*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF' }}
                  >
                    <option value="Press Shop & Notching">Press Shop & Notching</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Die Casting">Die Casting</option>
                    <option value="CTL / SLT">CTL / SLT</option>
                    <option value="Tool Room">Tool Room</option>
                  </select>
                </div>
              )}

              {/* Plant Selector (for Departments) */}
              {currentKind === 'departments' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                    Plant Facility Location <span style={{ color: T.red }}>*</span>
                  </label>
                  <select
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF' }}
                  >
                    <option value="Plant-V">Plant-V (Hyderabad)</option>
                    <option value="Aurangabad">Aurangabad</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              )}

              {/* Timings (for Shifts) */}
              {currentKind === 'shifts' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                    Working Window Timings <span style={{ color: T.red }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06:00 AM – 02:00 PM"
                    value={formData.timings}
                    onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Operational Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                  Operational Description & Engineering Specifications
                </label>
                <input
                  type="text"
                  placeholder="e.g. Capacity 400 Tons, Max Strip Width 800mm, High precision lamination"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ ...ghostBtn, fontSize: 13 }}>
                Cancel
              </button>
              <button type="submit" style={{ ...primaryBtn, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{editingItem ? 'Update Master Record' : 'Save & Propagate Master Record'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px', position: 'relative' }}>
          <input
            type="text"
            placeholder={`Filter ${activeCategory.label.toLowerCase()} by code, name, or description…`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 34px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              fontSize: 13,
              color: T.ink,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: 12, top: 11, color: T.muted, display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: T.muted }}>
          Active Category: <strong style={{ color: T.ink }}>{activeCategory.label}</strong> ({displayList.length} active records)
        </div>
      </div>

      {/* Master Data Directory Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}`, textAlign: 'left', color: T.muted }}>
                <th style={{ padding: '14px 18px', fontWeight: 600, width: 50 }}>#</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, width: 140 }}>Code / Key</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Display Name</th>
                {currentKind === 'machines' && <th style={{ padding: '14px 18px', fontWeight: 600 }}>Department</th>}
                {currentKind === 'departments' && <th style={{ padding: '14px 18px', fontWeight: 600 }}>Plant Location</th>}
                {currentKind === 'shifts' && <th style={{ padding: '14px 18px', fontWeight: 600 }}>Timings</th>}
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Specifications & Notes</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, width: 90 }}>Status</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right', width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: T.muted }}>
                    Loading master data…
                  </td>
                </tr>
              )}

              {!isLoading && displayList.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 36, textAlign: 'center', color: T.muted }}>
                    No records found in {activeCategory.label}. Click "+ Add New {activeCategory.singular}" above to create one.
                  </td>
                </tr>
              )}

              {displayList.map((item, idx) => (
                <tr
                  key={item.id || item.code || idx}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                >
                  <td style={{ padding: '14px 18px', color: T.muted, fontWeight: 500 }}>{idx + 1}</td>

                  {/* Code */}
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: 12,
                        background: '#EEF5FF',
                        color: T.blue,
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid #D4E5FB',
                      }}
                    >
                      {item.code}
                    </span>
                  </td>

                  {/* Name */}
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: T.ink }}>
                    {item.name}
                  </td>

                  {/* Department if machines */}
                  {currentKind === 'machines' && (
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ background: '#F1F5F9', color: T.ink, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                        {item.department || 'Press Shop & Notching'}
                      </span>
                    </td>
                  )}

                  {/* Plant if departments */}
                  {currentKind === 'departments' && (
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ background: '#F1F5F9', color: T.ink, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                        {item.plant || 'Plant-V'}
                      </span>
                    </td>
                  )}

                  {/* Timings if shifts */}
                  {currentKind === 'shifts' && (
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, color: T.ink }}>
                      {item.timings || '06:00 AM – 02:00 PM'}
                    </td>
                  )}

                  {/* Details */}
                  <td style={{ padding: '14px 18px', color: T.muted, fontSize: 12 }}>
                    {item.details || '—'}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#15803D',
                        background: '#DCFCE7',
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
                      Active
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        style={{
                          background: '#EEF5FF',
                          border: `1px solid ${T.blue}40`,
                          color: T.blue,
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '5px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div
          style={{
            padding: '12px 18px',
            background: '#F8FAFC',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: T.muted,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            Showing <strong style={{ color: T.ink }}>{displayList.length}</strong> {activeCategory.label.toLowerCase()} registered in system
          </div>
          <div>
            <span>Changes automatically reflect in Production Entry, Logbooks & Approvals</span>
          </div>
        </div>
      </div>
    </div>
  );
}
