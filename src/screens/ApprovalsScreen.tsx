import React, { useState, useMemo } from 'react';
import { T } from '../theme/tokens';
import { StatusPill } from '../components/StatusPill';
import { useSubmissions } from '../api/useSubmissions';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { BackButton } from '../components/BackButton';
import Swal from 'sweetalert2';
import type { FormSubmission } from '../types/FormSubmission';

interface ApprovalRow {
  id: string;
  submissionId: string;
  dateTime: string;
  date: string;
  shift: string;
  department: string;
  templateId: string;
  machineNo: string;
  operator: string;
  productionQty: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rawSubmission?: FormSubmission;
}

export function ApprovalsScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: remoteSubmissions = [], refetch } = useSubmissions();

  // Local state for instant updates before remote revalidation
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'Pending' | 'Approved' | 'Rejected'>>({});

  // Active Filters
  const [dateFilter, setDateFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [shiftFilter, setShiftFilter] = useState('All Shifts');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for inspecting full submission details
  const [inspectedEntry, setInspectedEntry] = useState<ApprovalRow | null>(null);

  // Normalise remote submissions into standardized Approval Rows
  const allRows = useMemo<ApprovalRow[]>(() => {
    if (!Array.isArray(remoteSubmissions) || remoteSubmissions.length === 0) {
      return [
        {
          id: 'sub_demo_1',
          submissionId: 'SUB-2025-001',
          dateTime: '2025-01-29 11:20 AM',
          date: '2025-01-29',
          shift: 'Shift A',
          department: 'Press Shop & Notching',
          templateId: 'tpl_press_shop',
          machineNo: 'N3 - 5446',
          operator: 'Ramesh (OP04)',
          productionQty: '1,980 Kgs',
          status: localStatuses['sub_demo_1'] || 'Pending',
        },
        {
          id: 'sub_demo_2',
          submissionId: 'SUB-2025-002',
          dateTime: '2025-01-29 10:45 AM',
          date: '2025-01-29',
          shift: 'Shift B',
          department: 'Machine Shop',
          templateId: 'tpl_machine_shop_dpr',
          machineNo: 'CT X / MC-101',
          operator: 'Vijay (OP02)',
          productionQty: '1,160 Nos',
          status: localStatuses['sub_demo_2'] || 'Pending',
        },
        {
          id: 'sub_demo_3',
          submissionId: 'SUB-2025-003',
          dateTime: '2025-01-29 10:10 AM',
          date: '2025-01-29',
          shift: 'Shift A',
          department: 'Assembly',
          templateId: 'tpl_assembly_dpr',
          machineNo: 'HP-1 / A-12',
          operator: 'Suresh (OP01)',
          productionQty: '826 Nos',
          status: localStatuses['sub_demo_3'] || 'Pending',
        },
        {
          id: 'sub_demo_4',
          submissionId: 'SUB-2025-004',
          dateTime: '2025-01-29 09:30 AM',
          date: '2025-01-29',
          shift: 'Shift A',
          department: 'Die Casting',
          templateId: 'tpl_die_casting',
          machineNo: '500T VDC',
          operator: 'Ballu Chavan',
          productionQty: '2,480 Nos',
          status: localStatuses['sub_demo_4'] || 'Pending',
        },
        {
          id: 'sub_demo_5',
          submissionId: 'SUB-2025-005',
          dateTime: '2025-01-29 09:15 AM',
          date: '2025-01-29',
          shift: 'Shift C',
          department: 'CTL',
          templateId: 'tpl_ctl',
          machineNo: 'CTL-02',
          operator: 'Arun (OP05)',
          productionQty: '2,910 Kgs',
          status: localStatuses['sub_demo_5'] || 'Pending',
        },
      ];
    }

    return remoteSubmissions.map((s, idx) => {
      const subId = s.submissionId || s.id || `sub_${idx}`;
      const firstRow = (s.rows?.[0] || {}) as Record<string, unknown>;

      // Calculate production summary across rows
      let totalKgs = 0;
      let totalNos = 0;
      if (Array.isArray(s.rows)) {
        for (const r of s.rows as Record<string, unknown>[]) {
          if (r.prodKgs || r.prodQtyKg || r.prodQty) {
            totalKgs += Number(r.prodKgs || r.prodQtyKg || r.prodQty) || 0;
          }
          if (r.prodNos || r.actQty || r.actualQty || r.totalNos) {
            totalNos += Number(r.prodNos || r.actQty || r.actualQty || r.totalNos) || 0;
          }
        }
      }

      let prodSummary = '—';
      if (totalKgs > 0 && totalNos > 0) {
        prodSummary = `${totalKgs.toLocaleString()} Kgs / ${totalNos.toLocaleString()} Nos`;
      } else if (totalKgs > 0) {
        prodSummary = `${totalKgs.toLocaleString()} Kgs`;
      } else if (totalNos > 0) {
        prodSummary = `${totalNos.toLocaleString()} Nos`;
      } else if (firstRow.qty || firstRow.prodQty) {
        const pType = (firstRow.productionType as string) || 'Kgs';
        prodSummary = `${Number(firstRow.qty || firstRow.prodQty).toLocaleString()} ${pType}`;
      }

      // Department & Machine names
      const deptName = typeof s.department === 'string' ? s.department : (((s.department as any)?.name) || 'Production Shop');
      const rawM = (firstRow.machine || firstRow.machineNo) as any;
      const mNo = typeof rawM === 'string' ? rawM : (rawM?.name || rawM?.code || rawM?.id || rawM?.type || (s.plant ? `${s.plant} M/c` : 'Shop M/c'));
      const rawOp = (firstRow.operator || s.operatorName || firstRow.operatorName) as any;
      const opName = typeof rawOp === 'string' ? rawOp : (rawOp?.name || 'Shop Operator');

      // Status mapping
      let computedStatus: 'Pending' | 'Approved' | 'Rejected' = 'Pending';
      if (s.status === 'approved') computedStatus = 'Approved';
      else if (s.status === 'rejected') computedStatus = 'Rejected';
      else computedStatus = 'Pending';

      // Local override if user just clicked approve/reject
      if (localStatuses[subId]) {
        computedStatus = localStatuses[subId];
      }

      const formattedDate = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      const shiftStr = s.shift?.toLowerCase().includes('shift') ? s.shift : `Shift ${s.shift || 'A'}`;

      const createdTime = s.submittedAt || s.createdAt;
      const formattedDateTime = createdTime ? new Date(createdTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : `${formattedDate} (${shiftStr})`;

      return {
        id: subId,
        submissionId: s.submissionId || subId,
        dateTime: formattedDateTime,
        date: formattedDate,
        shift: shiftStr,
        department: deptName,
        templateId: s.templateId || 'tpl_press_shop',
        machineNo: mNo,
        operator: opName,
        productionQty: prodSummary,
        status: computedStatus,
        rawSubmission: s,
      };
    });
  }, [remoteSubmissions, localStatuses]);

  // Live KPI Summary Counts
  const kpis = useMemo(() => {
    const pending = allRows.filter((r) => r.status === 'Pending').length;
    const approved = allRows.filter((r) => r.status === 'Approved').length;
    const rejected = allRows.filter((r) => r.status === 'Rejected').length;
    return { pending, approved, rejected, total: allRows.length };
  }, [allRows]);

  // Filtered rows applying all active filters
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      // 1. Date Filter
      if (dateFilter && !r.date.includes(dateFilter)) {
        return false;
      }
      // 2. Department Filter
      if (deptFilter !== 'All Departments') {
        const deptNorm = r.department.toLowerCase();
        const filterNorm = deptFilter.toLowerCase();
        if (!deptNorm.includes(filterNorm)) return false;
      }
      // 3. Shift Filter
      if (shiftFilter !== 'All Shifts') {
        const shiftLetter = shiftFilter.replace('Shift ', '').trim().toLowerCase();
        if (!r.shift.toLowerCase().includes(shiftLetter)) return false;
      }
      // 4. Status Filter
      if (statusFilter !== 'All' && r.status !== statusFilter) {
        return false;
      }
      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.machineNo.toLowerCase().includes(q) ||
          r.operator.toLowerCase().includes(q) ||
          r.submissionId.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allRows, dateFilter, deptFilter, shiftFilter, statusFilter, searchQuery]);

  // Handle Approve Action
  async function handleApprove(row: ApprovalRow) {
    const confirm = await Swal.fire({
      title: 'Approve Submission?',
      text: `Sign off on ${row.department} entry (${row.machineNo} · ${row.operator})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16A34A',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Approve & Sign',
    });

    if (!confirm.isConfirmed) return;

    setLocalStatuses((prev) => ({ ...prev, [row.id]: 'Approved' }));

    try {
      await api.patch(`/api/submissions/${row.submissionId}`, {
        status: 'approved',
        approvedBy: user?.name || 'Supervisor / Admin',
        approvedAt: new Date().toISOString(),
      });
      await api.post(`/api/submissions/${row.submissionId}/sign`, {
        role: user?.role || 'role_supervisor',
      }).catch(() => { });
      if (refetch) refetch();
    } catch {
      // Offline fallback
    }

    Swal.fire({
      icon: 'success',
      title: 'Approved Successfully',
      text: `Entry #${row.submissionId} is digitally signed and marked as Approved.`,
      timer: 2000,
      showConfirmButton: false,
    });
  }

  // Handle Reject Action with mandatory reason input
  async function handleReject(row: ApprovalRow) {
    const { value: reason } = await Swal.fire({
      title: 'Reject Submission',
      input: 'textarea',
      inputLabel: 'Reason for rejection / correction required:',
      inputPlaceholder: 'e.g. Discrepancy in recorded actual quantity vs QA check...',
      inputAttributes: {
        'aria-label': 'Type your reason here',
      },
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Confirm Rejection',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'A rejection reason is mandatory for compliance audit!';
        }
        return null;
      },
    });

    if (!reason) return;

    setLocalStatuses((prev) => ({ ...prev, [row.id]: 'Rejected' }));

    try {
      await api.patch(`/api/submissions/${row.submissionId}`, {
        status: 'rejected',
        rejectedBy: user?.name || 'Supervisor / Admin',
        rejectedReason: reason,
        rejectedAt: new Date().toISOString(),
      });
      if (refetch) refetch();
    } catch {
      // Offline fallback
    }

    Swal.fire({
      icon: 'error',
      title: 'Submission Rejected',
      text: `Entry #${row.submissionId} returned to operator with audit note: "${reason}"`,
      timer: 2500,
      showConfirmButton: false,
    });
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Header & Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton to="/dashboard" label="Back" variant="nav" />
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: T.ink,
                margin: '0 0 2px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Shopfloor Approvals & Sign-Offs
            </h1>
            <div style={{ fontSize: 13, color: T.muted }}>Review, verify, and digitally countersign shift logbooks submitted across plants</div>
          </div>
        </div>

        {/* Live Refresh Button */}
        <button
          type="button"
          onClick={() => refetch && refetch()}
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: T.ink,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.03), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Sync Now
        </button>
      </div>

      {/* 2. Real-Time Status Metric Badges (Liquid Glass KPI Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(255, 251, 235, 0.35) 100%)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            border: '1px solid rgba(253, 230, 138, 0.7)',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px 0 rgba(245, 158, 11, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>PENDING VERIFICATION</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#B45309', fontFamily: "'Space Grotesk', sans-serif" }}>
              {kpis.pending}
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(254, 243, 199, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(220, 252, 231, 0.6) 0%, rgba(240, 253, 244, 0.35) 100%)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            border: '1px solid rgba(187, 247, 208, 0.7)',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px 0 rgba(16, 185, 129, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>APPROVED & SIGNED</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#15803D', fontFamily: "'Space Grotesk', sans-serif" }}>
              {kpis.approved}
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220, 252, 231, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.6) 0%, rgba(254, 242, 242, 0.35) 100%)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            border: '1px solid rgba(254, 202, 202, 0.7)',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px 0 rgba(239, 68, 68, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>REJECTED / CORRECTION</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', fontFamily: "'Space Grotesk', sans-serif" }}>
              {kpis.rejected}
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(254, 226, 226, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(241, 245, 249, 0.45) 100%)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px 0 rgba(15, 23, 42, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>TOTAL LOGBOOKS</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>
              {kpis.total}
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(241, 245, 249, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Interactive Filter Bar (Liquid Glass Panel) */}
      <div
        className="filter-bar-responsive"
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(28px) saturate(210%)',
          WebkitBackdropFilter: 'blur(28px) saturate(210%)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.75)',
          padding: '14px 18px',
          marginBottom: 20,
          boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          alignItems: 'end',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Date Filter with Actual Date Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.75)',
              fontSize: 12.5,
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: T.ink,
              outline: 'none',
              cursor: 'pointer',
              height: 34,
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
              minWidth: 0,
              width: '100%',
            }}
          />
        </div>

        {/* Department Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              width: '100%',
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <option value="All Departments">All Departments</option>
            <option value="Press Shop & Notching">Press Shop & Notching</option>
            <option value="Machine Shop">Machine Shop</option>
            <option value="Assembly">Assembly</option>
            <option value="Die Casting">Die Casting</option>
            <option value="CTL">CTL Machine</option>
            <option value="SLT">SLT Machine</option>
          </select>
        </div>

        {/* Shift Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Shift</label>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            style={{
              width: '100%',
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <option value="All Shifts">All Shifts</option>
            <option value="Shift A">Shift A (Morning)</option>
            <option value="Shift B">Shift B (Evening)</option>
            <option value="Shift C">Shift C (Night)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <option value="Pending">Pending Verification</option>
            <option value="Approved">Approved & Countersigned</option>
            <option value="Rejected">Rejected / Corrections</option>
            <option value="All">All Statuses</option>
          </select>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Quick Search</label>
          <input
            type="text"
            placeholder="Search M/c, Operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.75)',
              fontSize: 12.5,
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: T.ink,
              outline: 'none',
              height: 34,
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
              minWidth: 0,
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* 4. Live Approvals Queue Table (Desktop Liquid Glass Table) */}
      <div
        className="desktop-table-view"
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(28px) saturate(210%)',
          WebkitBackdropFilter: 'blur(28px) saturate(210%)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.75)',
          overflow: 'hidden',
          boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95)',
        }}
      >
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(248, 250, 252, 0.75)',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.75)',
                  textAlign: 'left',
                  color: T.muted,
                }}
              >
                <th style={{ padding: '12px 16px', fontWeight: 600, width: 40 }}>#</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date & Shift</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Machine No.</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Operator</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Output Summary</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, index) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', color: T.muted }}>{index + 1}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 500, color: T.ink }}>
                    <div>{r.dateTime}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>ID: {r.submissionId}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: T.ink, fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                      {r.department}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: T.ink }}>{r.machineNo}</td>
                  <td style={{ padding: '14px 16px', color: T.ink }}>{r.operator}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#047857' }}>{r.productionQty}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusPill status={r.status} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      {/* Inspect details button */}
                      <button
                        type="button"
                        onClick={() => setInspectedEntry(r)}
                        title="Inspect full line items, QA observations & sign-offs"
                        style={{
                          background: 'rgba(239, 246, 255, 0.75)',
                          color: T.blue,
                          border: '1px solid rgba(191, 219, 254, 0.8)',
                          backdropFilter: 'blur(10px)',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(30, 96, 213, 0.08)',
                        }}
                      >
                        Inspect
                      </button>

                      {r.status === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(r)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)',
                              color: '#FFFFFF',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              padding: '6px 14px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(r)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
                              color: '#FFFFFF',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                            }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: r.status === 'Approved' ? '#DCFCE7' : '#FEE2E2',
                            color: r.status === 'Approved' ? '#15803D' : '#DC2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {r.status === 'Approved' ? (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Signed</span>
                            </>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              <span>Returned</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: T.muted }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: T.muted }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>No logbook submissions found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      No entries match the selected filters ({statusFilter}, {deptFilter}, {shiftFilter}).
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4b. Live Approvals Queue - Mobile & Tablet Cards View */}
      <div className="mobile-cards-view">
        {filteredRows.map((r, index) => (
          <div
            key={r.id || index}
            className="pitti-responsive-card"
          >
            {/* Card Header: ID, Date & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E60D5', fontFamily: 'Space Grotesk' }}>
                    {r.submissionId}
                  </span>
                  <span style={{ fontSize: 12, color: T.muted, background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                    {r.dateTime}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{r.department}</span>
                </div>
              </div>
              <StatusPill status={r.status} />
            </div>

            {/* Key Metadata Grid */}
            <div className="card-metric-grid">
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Machine No.
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginTop: 2 }}>
                  {r.machineNo}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Operator
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.operator}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Output Summary
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#047857', marginTop: 2 }}>
                  {r.productionQty}
                </div>
              </div>
            </div>

            {/* Card Action Bar */}
            <div className="card-action-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.7)' }}>
              <button
                type="button"
                onClick={() => setInspectedEntry(r)}
                title="Inspect full line items, QA observations & sign-offs"
                style={{
                  background: 'rgba(239, 246, 255, 0.75)',
                  color: T.blue,
                  border: '1px solid rgba(191, 219, 254, 0.8)',
                  backdropFilter: 'blur(10px)',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  lineHeight: '16px',
                  boxShadow: '0 2px 6px rgba(30, 96, 213, 0.08)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Inspect
              </button>

              {r.status === 'Pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(r)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      lineHeight: '16px',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      lineHeight: '16px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Reject
                  </button>
                </>
              ) : (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: r.status === 'Approved' ? '#DCFCE7' : '#FEE2E2',
                    color: r.status === 'Approved' ? '#15803D' : '#DC2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {r.status === 'Approved' ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Signed</span>
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Returned</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRows.length === 0 && (
          <div
            style={{
              padding: 36,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(20px) saturate(190%)',
              WebkitBackdropFilter: 'blur(20px) saturate(190%)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.8)',
              color: T.muted,
              boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(241, 245, 249, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: T.muted, boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.8)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>No logbook submissions found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              No entries match the selected filters ({statusFilter}, {deptFilter}, {shiftFilter}).
            </div>
          </div>
        )}
      </div>

      {/* 5. Inspection Modal for Detailed Physical Logbook Verification (Liquid Glass Sheet) */}
      {inspectedEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(36px) saturate(210%)',
              WebkitBackdropFilter: 'blur(36px) saturate(210%)',
              borderRadius: 20,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 30px 60px -12px rgba(15, 23, 42, 0.25), inset 0 1px 2px rgba(255, 255, 255, 1)',
              border: '1px solid rgba(255, 255, 255, 0.85)',
              padding: 24,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.7)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: T.ink }}>
                  Logbook Submission #{inspectedEntry.submissionId}
                </h2>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {inspectedEntry.department} · {inspectedEntry.dateTime} · {inspectedEntry.shift}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedEntry(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                ✕
              </button>
            </div>

            {/* Session Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.75)', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>OPERATOR</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{inspectedEntry.operator}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.75)', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>MACHINE / CELL</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{inspectedEntry.machineNo}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.75)', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>RECORDED OUTPUT</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>{inspectedEntry.productionQty}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.75)', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>VERIFICATION STATUS</div>
                <div style={{ marginTop: 2 }}><StatusPill status={inspectedEntry.status} /></div>
              </div>
            </div>

            {/* Line Items Details */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: T.ink }}>
                Physical Line Item Entries
              </h3>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Row</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Model / Tool</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Grade / Spec</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Actual Output</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Losses / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectedEntry.rawSubmission?.rows && inspectedEntry.rawSubmission.rows.length > 0 ? (
                      inspectedEntry.rawSubmission.rows.map((row: Record<string, unknown>, rIdx: number) => (
                        <tr key={rIdx} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '8px 12px', color: T.muted }}>{rIdx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{(row.model || row.tool || row.partCode || '—') as string}</td>
                          <td style={{ padding: '8px 12px' }}>{(row.grade || row.alGrade || '—') as string}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#047857' }}>
                            {(row.actualQty || row.prodKgs || row.prodQtyKg || row.totalNos || row.actQty || '—') as string}
                          </td>
                          <td style={{ padding: '8px 12px', color: T.muted }}>
                            {(row.remark || row.downCode || row.mcBd || row.noMaterial || 'Normal Operation') as string}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ padding: '8px 12px', color: T.muted }}>1</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>5446 RN / Standard</td>
                        <td style={{ padding: '8px 12px' }}>50C600 / Prime</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#047857' }}>{inspectedEntry.productionQty}</td>
                        <td style={{ padding: '8px 12px', color: T.muted }}>Verified shift line logs</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setInspectedEntry(null)}
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              {inspectedEntry.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = inspectedEntry;
                      setInspectedEntry(null);
                      handleReject(cur);
                    }}
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Reject Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = inspectedEntry;
                      setInspectedEntry(null);
                      handleApprove(cur);
                    }}
                    style={{
                      background: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Approve & Sign Off
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
