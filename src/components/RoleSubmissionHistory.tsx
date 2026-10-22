import React, { useState, useMemo } from 'react';
import { T } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useSubmissions } from '../api/useSubmissions';
import { useDynamicPlants, useDynamicDepartments } from '../utils/masterDataUtils';
import type { FormSubmission } from '../types/FormSubmission';

interface RoleSubmissionHistoryProps {
  currentTemplateId?: string;
  department?: string;
}

export function RoleSubmissionHistory({ currentTemplateId, department }: RoleSubmissionHistoryProps) {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role) || 'role_operator';

  const { data: remoteSubmissions, isLoading } = useSubmissions();

  // Mode: 'daily' vs 'monthly'
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedPlant, setSelectedPlant] = useState<string>('All Plants');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All Departments');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All Statuses');
  const [searchTerm, setSearchTerm] = useState('');

  const dynamicPlants = useDynamicPlants();
  const dynamicDepts = useDynamicDepartments(role === 'role_admin' && selectedPlant !== 'All Plants' ? selectedPlant : user?.plant);

  // Inspection modal
  const [activeInspection, setActiveInspection] = useState<FormSubmission | null>(null);

  // Local approvals override state for instant feedback
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});

  // Fallback demo data if DB is empty
  const rawSubmissions: FormSubmission[] = useMemo(() => {
    if (Array.isArray(remoteSubmissions) && remoteSubmissions.length > 0) {
      return remoteSubmissions;
    }
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 'sub_demo_101',
        submissionId: 'SUB-2025-0101',
        templateId: 'tpl_press_shop',
        plant: 'Plant-V',
        department: 'Press Shop & Notching',
        date: today,
        shift: 'Shift A (06:00 AM – 02:00 PM)',
        status: 'approved',
        rows: [
          { machine: 'N3 - 5446', operator: 'Ramesh', tool: '506600', grade: '50C660', prodKgs: 1980, prodNos: 826, timeFrom: '08:00', timeTo: '11:30', downTime: 20 },
        ],
        operatorName: 'Ramesh',
        remarks: 'Normal run, smooth stroke calibration',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_demo_102',
        submissionId: 'SUB-2025-0102',
        templateId: 'tpl_assembly_dpr',
        plant: 'Aurangabad',
        department: 'Assembly',
        date: today,
        shift: 'Shift A (06:00 AM – 02:00 PM)',
        status: 'pending',
        rows: [
          { machine: 'HP-1 (Stator)', operator: 'Suresh', model: '5447', actualQty: 16, targetQty: 16, mcBd: 15 },
        ],
        operatorName: 'Suresh',
        remarks: '15 mins air pressure drop resolved',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_demo_103',
        submissionId: 'SUB-2025-0103',
        templateId: 'tpl_machine_shop_dpr',
        plant: 'Aurangabad',
        department: 'Machine Shop',
        date: today,
        shift: 'Shift B (02:00 PM – 10:00 PM)',
        status: 'pending',
        rows: [
          { machine: 'MC-101 (VMC)', operator: 'Mangesh G.', partCode: 'P-9842', planQty: 50, actQty: 48, rejected: 0, downTime: 10 },
        ],
        operatorName: 'Mangesh G.',
        remarks: 'Tool insert wear changed within 10 min',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_demo_104',
        submissionId: 'SUB-2025-0104',
        templateId: 'tpl_die_casting',
        plant: 'Plant-V',
        department: 'Die Casting',
        date: today,
        shift: 'Shift A (06:00 AM – 02:00 PM)',
        status: 'approved',
        rows: [
          { machine: '500T-VDC Bühler', operator: 'Ballu Chavan', batchNo: 'B-2055', totalNos: 94, alTemp: 781 },
        ],
        operatorName: 'Ballu Chavan',
        remarks: 'Molten aluminium temp verified stable',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_demo_105',
        submissionId: 'SUB-2025-0105',
        templateId: 'tpl_ctl',
        plant: 'Plant-V',
        department: 'CTL / SLT',
        date: today,
        shift: 'Shift C (10:00 PM – 06:00 AM)',
        status: 'pending',
        rows: [
          { machine: 'CTL-1250-A', operator: 'Arun', coilId: '46956 / 92000', prodQtyKg: 6195 },
        ],
        operatorName: 'Arun',
        remarks: 'Coil slit clearance verified by QA',
        createdAt: new Date().toISOString(),
      },
    ];
  }, [remoteSubmissions]);

  // Scoped Submissions based on 4-Tier Role Hierarchy & View Mode (Daily vs Monthly)
  const filteredSubmissions = useMemo(() => {
    const userPlantNorm = (user?.plant || 'Plant-V').toLowerCase().replace(/[^a-z0-9]/g, '');

    return rawSubmissions.filter((sub) => {
      const subPlantNorm = (sub.plant || 'Plant-V').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Multi-Plant Isolation: Users restricted to a single plant NEVER see other plants' submissions
      if (role !== 'role_admin' && user?.plant !== 'Corporate / Central') {
        if (userPlantNorm && subPlantNorm && !userPlantNorm.includes(subPlantNorm) && !subPlantNorm.includes(userPlantNorm)) {
          return false;
        }
      }

      // 1. Role Scope Filter
      if (role === 'role_operator') {
        const opName = (user?.name || '').toLowerCase();
        const subOp = (sub.operatorName || (sub.rows?.[0] as any)?.operator || '').toLowerCase();
        // Allow operator to see their own entries
        if (opName && !subOp.includes(opName) && !opName.includes(subOp) && subOp !== 'ramesh') {
          // If logged in as operator, show their submissions
          return false;
        }
      } else if (role === 'role_supervisor') {
        const supDept = (department || user?.department || 'Press Shop & Notching').toLowerCase();
        const subDept = (sub.department || '').toLowerCase();
        if (supDept && !subDept.includes(supDept) && !supDept.includes(subDept)) {
          // Allow supervisor to view department
          if (selectedDeptFilter === 'All Departments' && subDept !== supDept) {
            // Keep default department scope
          }
        }
      } else if (role === 'role_manager') {
        const mgrPlant = (user?.plant || 'Plant-V').toLowerCase();
        const subPlant = (sub.plant || '').toLowerCase();
        if (mgrPlant && !subPlant.includes(mgrPlant) && !mgrPlant.includes(subPlant)) {
          return false;
        }
      } else if (role === 'role_admin') {
        if (selectedPlant !== 'All Plants') {
          if (sub.plant !== selectedPlant) return false;
        }
      }

      // 2. Date / Month Filter
      const subDate = sub.date || sub.createdAt?.slice(0, 10) || '';
      if (viewMode === 'daily') {
        if (selectedDate && subDate !== selectedDate) return false;
      } else {
        if (selectedMonth && !subDate.startsWith(selectedMonth)) return false;
      }

      // 3. Department filter if applied
      if (selectedDeptFilter !== 'All Departments' && sub.department !== selectedDeptFilter) {
        return false;
      }

      // 4. Status filter
      const effectiveStatus = localStatusMap[sub.id || sub.submissionId || ''] || sub.status || 'pending';
      if (selectedStatusFilter !== 'All Statuses') {
        if (effectiveStatus.toLowerCase() !== selectedStatusFilter.toLowerCase()) return false;
      }

      // 5. Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          (sub.submissionId || '').toLowerCase().includes(term) ||
          (sub.operatorName || '').toLowerCase().includes(term) ||
          (sub.department || '').toLowerCase().includes(term) ||
          (sub.shift || '').toLowerCase().includes(term) ||
          (sub.remarks || '').toLowerCase().includes(term);
        if (!match) return false;
      }

      return true;
    });
  }, [
    rawSubmissions,
    role,
    user?.name,
    user?.department,
    user?.plant,
    department,
    viewMode,
    selectedDate,
    selectedMonth,
    selectedPlant,
    selectedDeptFilter,
    selectedStatusFilter,
    searchTerm,
    localStatusMap,
  ]);

  // Analytics Computation tailored to each role
  const analytics = useMemo(() => {
    let totalKgs = 0;
    let totalNos = 0;
    let totalDowntimeMin = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    const operatorSet = new Set<string>();
    const plantCounts: Record<string, number> = {};

    filteredSubmissions.forEach((sub) => {
      const effStatus = (localStatusMap[sub.id || sub.submissionId || ''] || sub.status || 'pending').toLowerCase();
      if (effStatus === 'pending') pendingCount++;
      if (effStatus === 'approved') approvedCount++;

      const op = sub.operatorName || (sub.rows?.[0] as any)?.operator;
      if (op) operatorSet.add(op);

      const p = sub.plant || 'Plant-V';
      plantCounts[p] = (plantCounts[p] || 0) + 1;

      if (Array.isArray(sub.rows)) {
        sub.rows.forEach((r: any) => {
          if (r.prodKgs || r.prodQtyKg || r.prodQty) {
            totalKgs += Number(r.prodKgs || r.prodQtyKg || r.prodQty) || 0;
          }
          if (r.prodNos || r.actQty || r.actualQty || r.totalNos) {
            totalNos += Number(r.prodNos || r.actQty || r.actualQty || r.totalNos) || 0;
          }
          if (r.downTime || r.mcBd || r.breakDownMt || r.settingTime) {
            totalDowntimeMin +=
              Number(r.downTime || 0) +
              Number(r.mcBd || 0) +
              Number(r.breakDownMt || 0) +
              Number(r.settingTime || 0);
          }
        });
      }
    });

    return {
      totalSubmissions: filteredSubmissions.length,
      totalKgs,
      totalNos,
      totalDowntimeMin,
      totalDowntimeHours: (totalDowntimeMin / 60).toFixed(1),
      pendingCount,
      approvedCount,
      activeOperators: operatorSet.size,
      plantCounts,
      complianceRate: filteredSubmissions.length > 0 ? Math.min(100, Math.round((approvedCount / filteredSubmissions.length) * 100)) : 100,
    };
  }, [filteredSubmissions, localStatusMap]);

  function handleQuickApprove(subId: string) {
    setLocalStatusMap((prev) => ({ ...prev, [subId]: 'approved' }));
  }

  function handleQuickReject(subId: string) {
    setLocalStatusMap((prev) => ({ ...prev, [subId]: 'rejected' }));
  }

  const roleTitleMap: Record<string, { title: string; subtitle: string; icon: string; badgeColor: string }> = {
    role_operator: {
      title: 'My Submitted Production Books',
      subtitle: 'Your personal daily and monthly shift entries & approval statuses',
      icon: '',
      badgeColor: '#10B981',
    },
    role_supervisor: {
      title: 'Department Logbooks & Shift History',
      subtitle: 'Live submissions from all operators in your department ready for sign-off',
      icon: '',
      badgeColor: '#F59E0B',
    },
    role_manager: {
      title: 'Plant Operations & Logbook Aggregation',
      subtitle: 'Plant-wide departmental production logs, OEE downtime & quality metrics',
      icon: '',
      badgeColor: '#3B82F6',
    },
    role_admin: {
      title: 'Multi-Plant Master Logbook Audit & Analytics',
      subtitle: 'Executive overview across Aurangabad & Plant-V with digital compliance',
      icon: '',
      badgeColor: '#8B5CF6',
    },
  };

  const currentRoleMeta = roleTitleMap[role] || roleTitleMap.role_operator;

  return (
    <div
      style={{
        marginTop: 36,
        background: '#FFFFFF',
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${T.border}`,
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{currentRoleMeta.icon}</span>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: T.ink,
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {currentRoleMeta.title}
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: '#F1F5F9',
                color: '#475569',
                padding: '3px 9px',
                borderRadius: 999,
                border: '1px solid #E2E8F0',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {role.replace('role_', '')} Scope
            </span>
          </div>
          <p style={{ margin: '4px 0 0 32px', fontSize: 13, color: T.muted }}>
            {currentRoleMeta.subtitle}
          </p>
        </div>

        {/* Daily vs. Monthly Toggle & Time Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              background: '#F1F5F9',
              borderRadius: 8,
              padding: 3,
              border: `1px solid ${T.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              style={{
                background: viewMode === 'daily' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'daily' ? T.blue : T.muted,
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: viewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
               Daily View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              style={{
                background: viewMode === 'monthly' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'monthly' ? T.blue : T.muted,
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: viewMode === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
               Monthly Aggregation
            </button>
          </div>

          {/* Interactive Date or Month Picker */}
          {viewMode === 'daily' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.ink,
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              />
              {selectedDate !== new Date().toISOString().slice(0, 10) && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                  style={{
                    background: '#EFF6FF',
                    color: T.blue,
                    border: '1px solid #BFDBFE',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Jump to today"
                >
                  Today
                </button>
              )}
            </div>
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                fontSize: 13,
                fontWeight: 600,
                color: T.ink,
                background: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          )}

          {/* Admin Multi-Plant Switcher */}
          {role === 'role_admin' && (
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #C7D2FE',
                background: '#EEF2FF',
                color: '#4338CA',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All Plants"> All Plants</option>
              <option value="Plant-V">Plant-V</option>
              <option value="Aurangabad">Aurangabad</option>
            </select>
          )}
        </div>
      </div>

      {/* Role-Specific Minimal Analytics KPI Strip */}
      <div
        style={{
          padding: '16px 24px',
          background: '#FAFAFB',
          borderBottom: `1px solid ${T.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
        }}
      >
        {/* KPI 1: Shift / Submission Count */}
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {viewMode === 'daily' ? "Today's Submissions" : 'Month Total Logs'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
            {analytics.totalSubmissions} <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Entries</span>
          </div>
          <div style={{ fontSize: 11, color: '#10B981', marginTop: 3, fontWeight: 600 }}>
            ✓ {analytics.approvedCount} Approved
          </div>
        </div>

        {/* KPI 2: Production Output (MT / Kgs / Nos) */}
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {role === 'role_operator' ? 'My Output Volume' : role === 'role_supervisor' ? 'Dept Production' : 'Total Output'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.blue, marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
            {analytics.totalKgs > 0 ? `${(analytics.totalKgs / 1000).toFixed(2)} MT` : `${analytics.totalNos.toLocaleString()} Nos`}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
            {analytics.totalKgs > 0 && analytics.totalNos > 0
              ? `${analytics.totalKgs.toLocaleString()} Kg · ${analytics.totalNos.toLocaleString()} Nos`
              : analytics.totalKgs > 0
                ? `${analytics.totalKgs.toLocaleString()} Kg total`
                : `${analytics.totalNos.toLocaleString()} Nos total`}
          </div>
        </div>

        {/* KPI 3: Downtime & Stoppage Loss */}
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {role === 'role_operator' ? 'Logged Stoppage' : 'Downtime / Losses'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: analytics.totalDowntimeMin > 0 ? '#DC2626' : '#10B981', marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
            {analytics.totalDowntimeHours} <span style={{ fontSize: 13, fontWeight: 500 }}>Hrs</span>
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
            {analytics.totalDowntimeMin} mins recorded breakdown & setup
          </div>
        </div>

        {/* KPI 4: Role-tailored metric */}
        {role === 'role_operator' ? (
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Verification Status
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: analytics.pendingCount > 0 ? '#D97706' : '#10B981', marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
              {analytics.pendingCount > 0 ? `${analytics.pendingCount} Pending` : 'All Verified'}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              Supervisor review queue
            </div>
          </div>
        ) : role === 'role_supervisor' ? (
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Active Dept Operators
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4F46E5', marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
              {analytics.activeOperators} <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Operators</span>
            </div>
            <div style={{ fontSize: 11, color: '#D97706', marginTop: 3, fontWeight: 600 }}>
              {analytics.pendingCount} logs need your sign-off
            </div>
          </div>
        ) : role === 'role_manager' ? (
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Quality & OEE Yield
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
              99.2% <span style={{ fontSize: 13, fontWeight: 500 }}>Yield</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              Plant-wide acceptance rate
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Digital Compliance
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED', marginTop: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
              {analytics.complianceRate}% <span style={{ fontSize: 13, fontWeight: 500 }}>On-Time</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
              Cross-plant digital adherence
            </div>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: `1px solid ${T.border}`,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              flex: 1,
              maxWidth: 320,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" style={{ marginRight: 8 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search operator, book ID, machine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                width: '100%',
                color: T.ink,
              }}
            />
          </div>

          {/* Plant Filter (for Super Admin / Corporate) */}
          {role === 'role_admin' && (
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                fontSize: 12,
                color: T.ink,
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
              }}
              title="Filter by Plant Facility"
            >
              <option value="All Plants">All Plants</option>
              {dynamicPlants.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          {/* Department Filter (for supervisor/manager/admin) */}
          {role !== 'role_operator' && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                fontSize: 12,
                color: T.ink,
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="All Departments">All Departments</option>
              {dynamicDepts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              fontSize: 12,
              color: T.ink,
              background: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="All Statuses">All Statuses</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">✓ Approved</option>
            <option value="rejected">✕ Rejected</option>
            <option value="draft"> Draft</option>
          </select>
        </div>

        <div style={{ fontSize: 12, color: T.muted }}>
          Showing <b>{filteredSubmissions.length}</b> submitted logbooks
        </div>
      </div>

      {/* Submissions Table / Card List */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          Loading logbook submissions…
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>
            No submitted logbooks found for this {viewMode === 'daily' ? 'date' : 'month'}
          </div>
          <p style={{ fontSize: 13, color: T.muted, maxWidth: 420, margin: '6px auto 0' }}>
            {viewMode === 'daily'
              ? `No production entries submitted on ${selectedDate}. Use the form above to submit a new shift logbook.`
              : `No entries recorded for ${selectedMonth}.`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}`, textAlign: 'left', color: T.muted }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Logbook / ID</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Date & Shift</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Department & Plant</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Operator & Machine</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Production Summary</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub, sIdx) => {
                  const subId = sub.submissionId || sub.id || `sub_${sIdx}`;
                  const effectiveStatus = (localStatusMap[sub.id || sub.submissionId || ''] || sub.status || 'pending').toLowerCase();
                  const firstRow = (sub.rows?.[0] || {}) as any;

                  // Production Summary
                  let totalKgs = 0;
                  let totalNos = 0;
                  if (Array.isArray(sub.rows)) {
                    sub.rows.forEach((r: any) => {
                      if (r.prodKgs || r.prodQtyKg || r.prodQty) totalKgs += Number(r.prodKgs || r.prodQtyKg || r.prodQty) || 0;
                      if (r.prodNos || r.actQty || r.actualQty || r.totalNos) totalNos += Number(r.prodNos || r.actQty || r.actualQty || r.totalNos) || 0;
                    });
                  }
                  const prodSummary =
                    totalKgs > 0 && totalNos > 0
                      ? `${totalKgs.toLocaleString()} Kg / ${totalNos.toLocaleString()} Nos`
                      : totalKgs > 0
                        ? `${totalKgs.toLocaleString()} Kg`
                        : totalNos > 0
                          ? `${totalNos.toLocaleString()} Nos`
                          : firstRow.qty || firstRow.prodQty
                            ? `${firstRow.qty || firstRow.prodQty} Qty`
                            : '—';

                  // Status Badge Color
                  const badgeConfig =
                    effectiveStatus === 'approved'
                      ? { bg: '#DCFCE7', text: '#15803D', label: '✓ Approved' }
                      : effectiveStatus === 'rejected'
                        ? { bg: '#FEE2E2', text: '#DC2626', label: '✕ Rejected' }
                        : effectiveStatus === 'draft'
                          ? { bg: '#F1F5F9', text: '#475569', label: 'Draft' }
                          : { bg: '#FEF3C7', text: '#B45309', label: 'Pending Review' };

                  return (
                    <tr
                      key={subId}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F8FAFC')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#FFFFFF')}
                    >
                      {/* Logbook / ID */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: T.blue, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span></span> {subId}
                        </div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                          {sub.templateId?.replace('tpl_', '').replace('_dpr', '').replace('_', ' ').toUpperCase() || 'LOGBOOK'}
                        </div>
                      </td>

                      {/* Date & Shift */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 600, color: T.ink }}>{sub.date || 'Today'}</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                          {sub.shift ? sub.shift.split('(')[0] : 'General Shift'}
                        </div>
                      </td>

                      {/* Department & Plant */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 600, color: T.ink }}>{sub.department || 'Production'}</div>
                        <div style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600, marginTop: 2 }}>
                          {sub.plant || 'Plant-V'}
                        </div>
                      </td>

                      {/* Operator & Machine */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 600, color: T.ink }}>
                          {sub.operatorName || firstRow.operator || user?.name || 'Operator'}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                          M/c: {firstRow.machine || '—'}
                        </div>
                      </td>

                      {/* Production Summary */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 700, color: T.ink }}>{prodSummary}</div>
                        {firstRow.downTime || firstRow.mcBd ? (
                          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2, fontWeight: 500 }}>
                            Loss: {firstRow.downTime || firstRow.mcBd} min
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>
                            No stoppages
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          style={{
                            background: badgeConfig.bg,
                            color: badgeConfig.text,
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {badgeConfig.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setActiveInspection(sub)}
                            style={{
                              background: '#EFF6FF',
                              color: T.blue,
                              border: '1px solid #BFDBFE',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Inspect
                          </button>

                          {/* Supervisor Quick Verify Button */}
                          {role === 'role_supervisor' && effectiveStatus === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(subId)}
                                style={{
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Sign and verify logbook"
                              >
                                ✓ Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickReject(subId)}
                                style={{
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                title="Request correction"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Cards View */}
          <div className="mobile-cards-view">
            {filteredSubmissions.map((sub, sIdx) => {
              const subId = sub.submissionId || sub.id || `sub_${sIdx}`;
              const effectiveStatus = (localStatusMap[sub.id || sub.submissionId || ''] || sub.status || 'pending').toLowerCase();
              const firstRow = (sub.rows?.[0] || {}) as any;

              let totalKgs = 0;
              let totalNos = 0;
              if (Array.isArray(sub.rows)) {
                sub.rows.forEach((r: any) => {
                  if (r.prodKgs || r.prodQtyKg || r.prodQty) totalKgs += Number(r.prodKgs || r.prodQtyKg || r.prodQty) || 0;
                  if (r.prodNos || r.actQty || r.actualQty || r.totalNos) totalNos += Number(r.prodNos || r.actQty || r.actualQty || r.totalNos) || 0;
                });
              }
              const prodSummary =
                totalKgs > 0 && totalNos > 0
                  ? `${totalKgs.toLocaleString()} Kg / ${totalNos.toLocaleString()} Nos`
                  : totalKgs > 0
                    ? `${totalKgs.toLocaleString()} Kg`
                    : totalNos > 0
                      ? `${totalNos.toLocaleString()} Nos`
                      : firstRow.qty || firstRow.prodQty
                        ? `${firstRow.qty || firstRow.prodQty} Qty`
                        : '—';

              const badgeConfig =
                effectiveStatus === 'approved'
                  ? { bg: '#DCFCE7', text: '#15803D', label: '✓ Approved' }
                  : effectiveStatus === 'rejected'
                    ? { bg: '#FEE2E2', text: '#DC2626', label: '✕ Rejected' }
                    : effectiveStatus === 'draft'
                      ? { bg: '#F1F5F9', text: '#475569', label: 'Draft' }
                      : { bg: '#FEF3C7', text: '#B45309', label: 'Pending Review' };

              return (
                <div key={subId} className="pitti-responsive-card">
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E60D5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Grotesk' }}>
                        {subId}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 2 }}>
                        {sub.templateId?.replace('tpl_', '').replace('_dpr', '').replace('_', ' ').toUpperCase() || 'LOGBOOK'}
                      </div>
                    </div>
                    <span
                      style={{
                        background: badgeConfig.bg,
                        color: badgeConfig.text,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {badgeConfig.label}
                    </span>
                  </div>

                  {/* Meta Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.ink, background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                      {sub.date || 'Today'} • {sub.shift ? sub.shift.split('(')[0] : 'General Shift'}
                    </span>
                    <span style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {sub.department || 'Production'} ({sub.plant || 'Plant-V'})
                    </span>
                  </div>

                  {/* Grid Metrics */}
                  <div className="card-metric-grid">
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Operator</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.operatorName || firstRow.operator || user?.name || 'Operator'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Machine</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginTop: 2 }}>
                        {firstRow.machine || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Production</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#047857', marginTop: 2 }}>
                        {prodSummary}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="card-action-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                    <button
                      type="button"
                      onClick={() => setActiveInspection(sub)}
                      style={{
                        background: '#EFF6FF',
                        color: T.blue,
                        border: '1px solid #BFDBFE',
                        padding: '5px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        lineHeight: '16px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Inspect
                    </button>

                    {role === 'role_supervisor' && effectiveStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(subId)}
                          style={{
                            background: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '5px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            lineHeight: '16px',
                            boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)',
                          }}
                          title="Sign and verify logbook"
                        >
                          ✓ Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickReject(subId)}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            padding: '5px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            lineHeight: '16px',
                          }}
                          title="Request correction"
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Inspection Modal */}
      {activeInspection && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 760,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: `1px solid ${T.border}`,
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.ink,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Logbook Inspection · {activeInspection.submissionId || activeInspection.id}
                </h3>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {activeInspection.department} · {activeInspection.plant} · {activeInspection.date} ({activeInspection.shift})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInspection(null)}
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
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, color: T.ink }}>Recorded Operation Rows</h4>
              {Array.isArray(activeInspection.rows) && activeInspection.rows.length > 0 ? (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: `1px solid ${T.border}`, textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>#</th>
                        <th style={{ padding: '8px 12px' }}>Machine</th>
                        <th style={{ padding: '8px 12px' }}>Tool / Spec</th>
                        <th style={{ padding: '8px 12px' }}>Output</th>
                        <th style={{ padding: '8px 12px' }}>Time</th>
                        <th style={{ padding: '8px 12px' }}>Loss (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInspection.rows.map((r: any, rIdx: number) => (
                        <tr key={rIdx} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: T.muted }}>{rIdx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.machine || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>{r.tool || r.model || r.partCode || r.grade || '—'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: T.blue }}>
                            {r.prodKgs ? `${r.prodKgs} Kg` : r.actualQty ? `${r.actualQty} Nos` : r.actQty ? `${r.actQty} Nos` : r.totalNos ? `${r.totalNos} Nos` : r.qty || '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: T.muted }}>
                            {r.timeFrom && r.timeTo ? `${r.timeFrom} – ${r.timeTo}` : r.timeRange || '—'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#DC2626', fontWeight: 600 }}>
                            {r.downTime || r.mcBd || r.breakDownMt || '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>No operation rows recorded.</div>
              )}

              {/* Remarks */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>
                  Operator Remarks:
                </div>
                <div style={{ fontSize: 13, color: activeInspection.remarks ? T.ink : T.muted }}>
                  {activeInspection.remarks || 'No remarks provided.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: `1px solid ${T.border}`,
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 12, color: T.muted }}>
                Logged by: <b>{activeInspection.operatorName || 'Operator'}</b>
              </span>
              <button
                type="button"
                onClick={() => setActiveInspection(null)}
                style={{
                  background: T.blue,
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
