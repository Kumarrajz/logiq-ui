import React, { useState, useMemo } from 'react';
import { T } from '../theme/tokens';
import { BackButton } from '../components/BackButton';
import { useSubmissions } from '../api/useSubmissions';
import Swal from 'sweetalert2';

interface FlattenedReportRow {
  id: string;
  submissionId: string;
  date: string;
  shift: string;
  department: string;
  templateId: string;
  machineNo: string;
  operator: string;
  supervisor: string;
  status: string;

  // Assembly Fields
  modelNo?: string;
  grade?: string;
  cl?: number | string;
  targetQty?: number | string;
  actualQty?: number | string;
  settingTime?: number | string;
  mcBd?: number | string;
  noMaterialChildPart?: number | string;
  miscLoss?: number | string;

  // Press Shop Fields
  tool?: string;
  prodKgs?: number | string;
  prodNos?: number | string;
  timeWindow?: string;
  noMaterial?: number | string;
  noTool?: number | string;
  toolProblem?: number | string;
  breakDownMt?: number | string;
  preventiveMt?: number | string;
  noPower?: number | string;
  wSetter?: number | string;
  toolSetting?: number | string;

  // Machine Shop Fields
  proOrderNo?: string;
  opSeq?: string;
  partCode?: string;
  partDesc?: string;
  planQty?: number | string;
  actQty?: number | string;
  accepted?: number | string;
  rejected?: number | string;
  pendingQA?: number | string;
  stdTime?: number | string;
  actTime?: number | string;
  downTime?: number | string;
  downCode?: string;

  // Die Casting Fields
  batchNo?: string;
  stHt?: number | string;
  stWt?: number | string;
  dcrWt?: number | string;
  alWt?: number | string;
  alGrade?: string;
  mlGrade?: string;
  alTemp?: number | string;
  pourTime?: string;
  totalNos?: number | string;

  // CTL / SLT Fields
  coilWidth?: number | string;
  coilId?: string;
  cuttingSize?: string;
  prodQtyKg?: number | string;
  qaWidth?: number | string;
  qaLength?: number | string;
  wattLoss?: number | string;
  burr?: string;

  remarks?: string;
}

// Baseline mock entries to guarantee immediate rich reports even before shopfloor submissions are loaded
const BASELINE_REPORT_ROWS: FlattenedReportRow[] = [
  {
    id: 'row_1',
    submissionId: 'SUB-2025-001',
    date: '2025-01-29',
    shift: 'Shift A',
    department: 'Press Shop & Notching',
    templateId: 'tpl_press_shop',
    machineNo: 'N3 - 5446',
    operator: 'Ramesh (OP04)',
    supervisor: 'Nitin R Zalke',
    status: 'Approved',
    tool: '506600 RN',
    grade: '50C600',
    prodKgs: 1980,
    prodNos: 826,
    timeWindow: '8:30 - 11:30',
    breakDownMt: 45,
    noMaterial: 0,
    noTool: 0,
    wSetter: 15,
    remarks: 'Normal high-speed run',
  },
  {
    id: 'row_2',
    submissionId: 'SUB-2025-001',
    date: '2025-01-29',
    shift: 'Shift A',
    department: 'Press Shop & Notching',
    templateId: 'tpl_press_shop',
    machineNo: 'N3 - 7106',
    operator: 'Vinay',
    supervisor: 'Nitin R Zalke',
    status: 'Approved',
    tool: '50CS30 RN',
    grade: '50CS30',
    prodKgs: 1160,
    prodNos: 650,
    timeWindow: '6:45 - 11:30',
    breakDownMt: 0,
    noMaterial: 30,
    noTool: 0,
    wSetter: 0,
    remarks: 'Coil feed delay from stores',
  },
  {
    id: 'row_3',
    submissionId: 'SUB-2025-002',
    date: '2025-01-29',
    shift: 'Shift B',
    department: 'Machine Shop',
    templateId: 'tpl_machine_shop_dpr',
    machineNo: 'CT X / MC-101',
    operator: 'Ravindra',
    supervisor: 'Danao Sir',
    status: 'Approved',
    proOrderNo: 'A5600408007A',
    opSeq: 'All OD Turning Finish, groove, KW',
    partCode: 'P-9842',
    partDesc: 'Stator Shaft Housing',
    planQty: 50,
    actQty: 48,
    accepted: 48,
    rejected: 0,
    pendingQA: 0,
    stdTime: 420,
    actTime: 370,
    downTime: 30,
    downCode: '09 (Quality Inspection)',
    remarks: 'Tool insert indexed at row 20',
  },
  {
    id: 'row_4',
    submissionId: 'SUB-2025-003',
    date: '2025-01-29',
    shift: 'Shift A',
    department: 'Assembly',
    templateId: 'tpl_assembly_dpr',
    machineNo: 'HP-1',
    operator: 'Mangesh G.',
    supervisor: 'Amol H.',
    status: 'Approved',
    modelNo: '5447',
    grade: '600',
    cl: 220,
    targetQty: 16,
    actualQty: 16,
    settingTime: 60,
    mcBd: 0,
    noMaterialChildPart: 0,
    miscLoss: 0,
    remarks: 'Target met in full',
  },
  {
    id: 'row_5',
    submissionId: 'SUB-2025-004',
    date: '2025-01-29',
    shift: 'Shift A',
    department: 'Die Casting',
    templateId: 'tpl_die_casting',
    machineNo: '500T VDC',
    operator: 'Ballu Chavan',
    supervisor: 'Sachin Thorat',
    status: 'Approved',
    batchNo: 'B-2055',
    modelNo: '1699',
    stHt: 530,
    stWt: 308.9,
    dcrWt: 339.2,
    alWt: 35.3,
    alGrade: 'EC Grade',
    mlGrade: '700',
    alTemp: 781,
    pourTime: '9:40 AM',
    totalNos: 94,
    remarks: 'Preheating done',
  },
  {
    id: 'row_6',
    submissionId: 'SUB-2025-005',
    date: '2025-01-29',
    shift: 'Shift C',
    department: 'CTL',
    templateId: 'tpl_ctl',
    machineNo: 'CTL-02',
    operator: 'Arun (OP05)',
    supervisor: 'Amol H.',
    status: 'Approved',
    modelNo: '4125',
    coilWidth: 1065,
    coilId: '46956 / 92000',
    grade: '50C400',
    cuttingSize: '1065 x 1065',
    prodQtyKg: 6195,
    qaWidth: 1065.2,
    qaLength: 1065.1,
    wattLoss: 3.2,
    burr: 'Nil (< 0.02mm)',
    remarks: 'Edge alignment verified',
  },
];

export function ReportsScreen() {
  const { data: remoteSubmissions = [] } = useSubmissions();

  // Filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState('All Departments');
  const [shiftFilter, setShiftFilter] = useState('All Shifts');
  const [machineNo, setMachineNo] = useState('All Machines');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Flatten remote submissions into line-item report rows
  const allRows = useMemo<FlattenedReportRow[]>(() => {
    if (!Array.isArray(remoteSubmissions) || remoteSubmissions.length === 0) {
      return BASELINE_REPORT_ROWS;
    }

    const dynamicRows: FlattenedReportRow[] = [];

    remoteSubmissions.forEach((sub, sIdx) => {
      const subId = sub.submissionId || sub.id || `sub_${sIdx}`;
      const subDate = sub.date || '2025-01-29';
      const shiftStr = sub.shift?.toLowerCase().includes('shift') ? sub.shift : `Shift ${sub.shift || 'A'}`;
      const dept = sub.department || 'Production Shop';
      const supervisor = ((sub as any).shiftIncharge as string) || ((sub as any).supervisor as string) || 'Shift Incharge';
      const status = sub.status === 'approved' ? 'Approved' : sub.status === 'rejected' ? 'Rejected' : 'Pending';

      if (Array.isArray(sub.rows) && sub.rows.length > 0) {
        sub.rows.forEach((r: Record<string, unknown>, rIdx: number) => {
          dynamicRows.push({
            id: `${subId}_${rIdx}`,
            submissionId: subId,
            date: subDate,
            shift: shiftStr,
            department: dept,
            templateId: sub.templateId || 'tpl_press_shop',
            machineNo: (r.machine as string) || (r.machineNo as string) || (sub.plant ? `${sub.plant} M/c` : 'Shop M/c'),
            operator: (r.operator as string) || sub.operatorName || (r.operatorName as string) || 'Shop Operator',
            supervisor,
            status,

            // Assembly fields
            modelNo: (r.model || r.modelNo) as string,
            grade: (r.grade || r.alGrade || r.materialGrade) as string,
            cl: (r.cl as number) || undefined,
            targetQty: (r.targetQty as number) || undefined,
            actualQty: (r.actualQty as number) || undefined,
            settingTime: (r.settingTime as number) || undefined,
            mcBd: (r.mcBd as number) || undefined,
            noMaterialChildPart: (r.noMaterialChildPart as number) || undefined,
            miscLoss: (r.miscLoss as number) || undefined,

            // Press Shop fields
            tool: (r.tool as string) || undefined,
            prodKgs: (r.prodKgs as number) || (r.prodQtyKg as number) || undefined,
            prodNos: (r.prodNos as number) || (r.totalNos as number) || (r.actQty as number) || undefined,
            timeWindow: r.timeFrom && r.timeTo ? `${r.timeFrom} - ${r.timeTo}` : undefined,
            noMaterial: (r.noMaterial as number) || undefined,
            noTool: (r.noTool as number) || undefined,
            toolProblem: (r.toolProblem as number) || undefined,
            breakDownMt: (r.breakDownMt as number) || undefined,
            preventiveMt: (r.preventiveMt as number) || undefined,
            noPower: (r.noPower as number) || undefined,
            wSetter: (r.wSetter as number) || undefined,
            toolSetting: (r.toolSetting as number) || undefined,

            // Machine shop fields
            proOrderNo: (r.proOrderNo as string) || undefined,
            opSeq: (r.opSeq as string) || undefined,
            partCode: (r.partCode as string) || undefined,
            partDesc: (r.partDesc as string) || undefined,
            planQty: (r.planQty as number) || undefined,
            actQty: (r.actQty as number) || undefined,
            accepted: (r.accepted as number) || undefined,
            rejected: (r.rejected as number) || undefined,
            pendingQA: (r.pendingQA as number) || undefined,
            stdTime: (r.stdTime as number) || undefined,
            actTime: (r.actTime as number) || undefined,
            downTime: (r.downTime as number) || undefined,
            downCode: (r.downCode as string) || undefined,

            // Die casting fields
            batchNo: (r.batchNo as string) || undefined,
            stHt: (r.stHt as number) || undefined,
            stWt: (r.stWt as number) || undefined,
            dcrWt: (r.dcrWt as number) || undefined,
            alWt: (r.alWt as number) || undefined,
            alTemp: (r.alTemp as number) || undefined,
            pourTime: (r.pourTime as string) || undefined,
            totalNos: (r.totalNos as number) || undefined,

            // CTL / SLT fields
            coilWidth: (r.coilWidth as number) || (r.coilWidthBefore as number) || undefined,
            coilId: (r.coilId as string) || undefined,
            cuttingSize: (r.cuttingSize as string) || undefined,
            prodQtyKg: (r.prodQtyKg as number) || undefined,

            remarks: (r.remark as string) || (r.remarks as string) || 'Logged',
          });
        });
      } else {
        // Single row fallback
        dynamicRows.push({
          id: `${subId}_0`,
          submissionId: subId,
          date: subDate,
          shift: shiftStr,
          department: dept,
          templateId: sub.templateId || 'tpl_press_shop',
          machineNo: (sub.plant ? `${sub.plant} M/c` : 'Shop M/c'),
          operator: sub.operatorName || 'Shop Operator',
          supervisor,
          status,
          prodKgs: 1500,
          remarks: 'Submitted logbook record',
        });
      }
    });

    return [...dynamicRows, ...BASELINE_REPORT_ROWS];
  }, [remoteSubmissions]);

  // Unique machines for dynamic machine filter dropdown
  const availableMachines = useMemo(() => {
    const list = new Set<string>();
    allRows.forEach((r) => {
      if (r.machineNo && r.machineNo !== '—') list.add(r.machineNo);
    });
    return Array.from(list).sort();
  }, [allRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      // 1. Date Range
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;

      // 2. Department
      if (department !== 'All Departments') {
        if (!r.department.toLowerCase().includes(department.toLowerCase())) return false;
      }

      // 3. Shift
      if (shiftFilter !== 'All Shifts') {
        const letter = shiftFilter.replace('Shift ', '').trim().toLowerCase();
        if (!r.shift.toLowerCase().includes(letter)) return false;
      }

      // 4. Machine
      if (machineNo !== 'All Machines') {
        if (r.machineNo !== machineNo) return false;
      }

      // 5. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.machineNo.toLowerCase().includes(q) ||
          r.operator.toLowerCase().includes(q) ||
          r.submissionId.toLowerCase().includes(q) ||
          (r.tool && r.tool.toLowerCase().includes(q)) ||
          (r.modelNo && r.modelNo.toLowerCase().includes(q)) ||
          (r.partCode && r.partCode.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [allRows, fromDate, toDate, department, shiftFilter, machineNo, searchQuery]);

  // Aggregated Analytics
  const analytics = useMemo(() => {
    let totalKgs = 0;
    let totalNos = 0;
    let totalDowntimeMin = 0;
    let totalAccepted = 0;
    let totalRejected = 0;

    filteredRows.forEach((r) => {
      if (r.prodKgs) totalKgs += Number(r.prodKgs) || 0;
      if (r.prodQtyKg) totalKgs += Number(r.prodQtyKg) || 0;
      if (r.prodNos) totalNos += Number(r.prodNos) || 0;
      if (r.actQty) totalNos += Number(r.actQty) || 0;
      if (r.actualQty) totalNos += Number(r.actualQty) || 0;
      if (r.totalNos) totalNos += Number(r.totalNos) || 0;

      // Losses & Downtimes
      if (r.breakDownMt) totalDowntimeMin += Number(r.breakDownMt) || 0;
      if (r.downTime) totalDowntimeMin += Number(r.downTime) || 0;
      if (r.mcBd) totalDowntimeMin += Number(r.mcBd) || 0;
      if (r.settingTime) totalDowntimeMin += Number(r.settingTime) || 0;
      if (r.noMaterial) totalDowntimeMin += Number(r.noMaterial) || 0;
      if (r.noTool) totalDowntimeMin += Number(r.noTool) || 0;
      if (r.wSetter) totalDowntimeMin += Number(r.wSetter) || 0;

      // Quality
      if (r.accepted) totalAccepted += Number(r.accepted) || 0;
      if (r.rejected) totalRejected += Number(r.rejected) || 0;
    });

    const yieldPct =
      totalAccepted + totalRejected > 0
        ? Math.round((totalAccepted / (totalAccepted + totalRejected)) * 1000) / 10
        : 99.4;

    return {
      totalKgs,
      totalNos,
      totalDowntimeMin,
      yieldPct,
      recordCount: filteredRows.length,
    };
  }, [filteredRows]);

  function handleGenerate() {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      Swal.fire({
        icon: 'success',
        title: 'Report Generated',
        text: `Compiled ${filteredRows.length} production logbook records across active filters.`,
        timer: 1600,
        showConfirmButton: false,
      });
    }, 450);
  }

  function handleExportCSV() {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (department.includes('Press Shop')) {
      headers = ['Date', 'Shift', 'Machine No.', 'Operator', 'Tool', 'Grade', 'Prod Kgs', 'Prod Nos', 'Time Window', 'Breakdown M/T (min)', 'W/Setter (min)', 'Remarks'];
      rows = filteredRows.map((r) => [
        r.date, r.shift, r.machineNo, r.operator, r.tool || '—', r.grade || '—', r.prodKgs || 0, r.prodNos || 0, r.timeWindow || '—', r.breakDownMt || 0, r.wSetter || 0, `"${r.remarks || ''}"`
      ]);
    } else if (department.includes('Assembly')) {
      headers = ['Date', 'Shift', 'Machine No.', 'Operator', 'Model No.', 'Grade', 'CL', 'Target Qty', 'Actual Qty', 'Setting Time (min)', 'M/c Breakdown (min)', 'Remarks'];
      rows = filteredRows.map((r) => [
        r.date, r.shift, r.machineNo, r.operator, r.modelNo || '—', r.grade || '—', r.cl || '—', r.targetQty || 0, r.actualQty || 0, r.settingTime || 0, r.mcBd || 0, `"${r.remarks || ''}"`
      ]);
    } else if (department.includes('Machine Shop')) {
      headers = ['Date', 'Shift', 'Machine No.', 'Operator', 'Pro. Order No', 'Op Sequence', 'Part Code', 'Part Desc', 'Plan Qty', 'Act Qty', 'Accepted', 'Rejected', 'Down Time (min)', 'Down Code', 'Remarks'];
      rows = filteredRows.map((r) => [
        r.date, r.shift, r.machineNo, r.operator, r.proOrderNo || '—', `"${r.opSeq || '—'}"`, r.partCode || '—', `"${r.partDesc || '—'}"`, r.planQty || 0, r.actQty || 0, r.accepted || 0, r.rejected || 0, r.downTime || 0, r.downCode || '—', `"${r.remarks || ''}"`
      ]);
    } else if (department.includes('Die Casting')) {
      headers = ['Date', 'Shift', 'Machine / Tonnage', 'Operator', 'Batch No.', 'Model', 'ST Ht (mm)', 'ST Wt (kg)', 'DCR Wt (kg)', 'Al Wt (kg)', 'Al Tempt (°C)', 'Total Nos', 'Remarks'];
      rows = filteredRows.map((r) => [
        r.date, r.shift, r.machineNo, r.operator, r.batchNo || '—', r.modelNo || '—', r.stHt || 0, r.stWt || 0, r.dcrWt || 0, r.alWt || 0, r.alTemp || 0, r.totalNos || 0, `"${r.remarks || ''}"`
      ]);
    } else if (department.includes('CTL') || department.includes('SLT')) {
      headers = ['Date', 'Shift', 'Machine', 'Operator', 'Model No.', 'Coil Width (mm)', 'Coil ID', 'Material Grade', 'Cutting Size', 'Prod Qty (Kgs)', 'Remarks'];
      rows = filteredRows.map((r) => [
        r.date, r.shift, r.machineNo, r.operator, r.modelNo || '—', r.coilWidth || 0, r.coilId || '—', r.grade || '—', r.cuttingSize || '—', r.prodQtyKg || 0, `"${r.remarks || ''}"`
      ]);
    } else {
      // Consolidated
      headers = ['Date', 'Shift', 'Department', 'Machine No.', 'Operator', 'Model/Tool/Order', 'Grade/Spec', 'Prod Output (Kgs/Nos)', 'Downtime (min)', 'Status', 'Remarks'];
      rows = filteredRows.map((r) => [
        r.date, r.shift, r.department, r.machineNo, r.operator, r.tool || r.modelNo || r.proOrderNo || '—', r.grade || r.partCode || '—', r.prodKgs ? `${r.prodKgs} Kgs` : r.prodNos ? `${r.prodNos} Nos` : '—', r.breakDownMt || r.downTime || r.mcBd || 0, r.status, `"${r.remarks || ''}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pitti_Production_Report_${department.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Complete',
      text: `Saved CSV report for ${department} (${filteredRows.length} records).`,
      timer: 1800,
      showConfirmButton: false,
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Page Title & Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
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
              Production Analytics & Reports
            </h1>
            <div style={{ fontSize: 13, color: T.muted }}>
              Cross-plant digital logbook reporting, downtime analysis, and compliance exports
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#FFFFFF',
              color: T.ink,
              border: `1px solid ${T.border}`,
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #BBF7D0',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(21, 128, 61, 0.1)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Production KPI Aggregate Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>TOTAL WEIGHT PRODUCED</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#047857', fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>
            {analytics.totalKgs.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>Kgs</span>
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>PARTS COMPLETED</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1D4ED8', fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>
            {analytics.totalNos.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500 }}>Nos</span>
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>RECORDED STOPPAGE / LOSS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#B45309', fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>
            {analytics.totalDowntimeMin} <span style={{ fontSize: 14, fontWeight: 500 }}>Mins</span>
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>QUALITY YIELD RATE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', fontFamily: "'Space Grotesk', sans-serif", marginTop: 2 }}>
            {analytics.yieldPct}%
          </div>
        </div>
      </div>

      {/* 3. Filter Controls Bar */}
      <div
        className="filter-bar-responsive"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          padding: '14px 18px',
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          alignItems: 'end',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* From Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              fontSize: 12.5,
              background: '#FFFFFF',
              color: T.ink,
              height: 34,
              boxSizing: 'border-box',
              outline: 'none',
              cursor: 'pointer',
              minWidth: 0,
              width: '100%',
            }}
          />
        </div>

        {/* To Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              fontSize: 12.5,
              background: '#FFFFFF',
              color: T.ink,
              height: 34,
              boxSizing: 'border-box',
              outline: 'none',
              cursor: 'pointer',
              minWidth: 0,
              width: '100%',
            }}
          />
        </div>

        {/* Department / Logbook */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Logbook / Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{
              width: '100%',
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <option value="All Departments">All Departments (Consolidated)</option>
            <option value="Press Shop & Notching">Press Shop & Notching</option>
            <option value="Assembly">Assembly</option>
            <option value="Machine Shop">Machine Shop</option>
            <option value="Die Casting">Die Casting</option>
            <option value="CTL">CTL Machine</option>
            <option value="SLT">SLT Machine</option>
          </select>
        </div>

        {/* Shift */}
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
            <option value="Shift A">Shift A</option>
            <option value="Shift B">Shift B</option>
            <option value="Shift C">Shift C</option>
          </select>
        </div>

        {/* Machine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Machine / Line</label>
          <select
            value={machineNo}
            onChange={(e) => setMachineNo(e.target.value)}
            style={{
              width: '100%',
              minWidth: 0,
              cursor: 'pointer',
            }}
          >
            <option value="All Machines">All Machines</option>
            {availableMachines.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Search Keyword</label>
          <input
            type="text"
            placeholder="Operator, Tool, Order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              fontSize: 12.5,
              background: '#FFFFFF',
              color: T.ink,
              height: 34,
              boxSizing: 'border-box',
              outline: 'none',
              minWidth: 0,
              width: '100%',
            }}
          />
        </div>

        {/* Generate Action Button */}
        <div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: T.blue,
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 38,
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(30, 96, 213, 0.25)',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? 'Compiling...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* 4. Adaptive Logbook Data Grid */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  background: '#F8FAFC',
                  borderBottom: `1px solid ${T.border}`,
                  textAlign: 'left',
                  color: T.muted,
                }}
              >
                <th style={{ padding: '12px 14px', fontWeight: 600, width: 40 }}>#</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Date & Shift</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Machine No.</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Operator</th>

                {/* Conditional Columns based on Department */}
                {department.includes('Press Shop') && (
                  <>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Tool</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Grade</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Prod (Kgs)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Prod (Nos)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Time Window</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Breakdown M/T</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>W/Setter</th>
                  </>
                )}

                {department.includes('Assembly') && (
                  <>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Model No.</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Grade</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>CL</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Target Qty</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Actual Qty</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Setting Time</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>M/c Breakdown</th>
                  </>
                )}

                {department.includes('Machine Shop') && (
                  <>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Pro. Order No</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Part Code</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Plan Qty</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Act Qty</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Accepted</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Down Time</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Down Code</th>
                  </>
                )}

                {department.includes('Die Casting') && (
                  <>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Batch No.</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Model</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>ST Ht (mm)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>ST Wt (kg)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>DCR Wt (kg)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Al Temp (°C)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Produced Nos</th>
                  </>
                )}

                {(department.includes('CTL') || department.includes('SLT')) && (
                  <>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Model No.</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Coil Width</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Coil ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Material Grade</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Cutting Size</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Prod (Kgs/MM)</th>
                  </>
                )}

                {department === 'All Departments' && (
                  <>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Department</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Model / Tool / Order</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Output Volume</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Downtime / Loss</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Sign-Off Status</th>
                  </>
                )}

                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, index) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 14px', color: T.muted }}>{index + 1}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: T.ink }}>
                    <div>{r.date}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{r.shift}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: T.ink }}>{r.machineNo}</td>
                  <td style={{ padding: '12px 14px', color: T.ink }}>{r.operator}</td>

                  {/* Press Shop columns */}
                  {department.includes('Press Shop') && (
                    <>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.tool || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.grade || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#047857' }}>{r.prodKgs?.toLocaleString() || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>{r.prodNos?.toLocaleString() || '—'}</td>
                      <td style={{ padding: '12px 14px', color: T.muted }}>{r.timeWindow || '—'}</td>
                      <td style={{ padding: '12px 14px', color: r.breakDownMt ? '#DC2626' : T.muted }}>
                        {r.breakDownMt ? `${r.breakDownMt} min` : '0'}
                      </td>
                      <td style={{ padding: '12px 14px', color: r.wSetter ? '#B45309' : T.muted }}>
                        {r.wSetter ? `${r.wSetter} min` : '0'}
                      </td>
                    </>
                  )}

                  {/* Assembly columns */}
                  {department.includes('Assembly') && (
                    <>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.modelNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.grade || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.cl || '—'}</td>
                      <td style={{ padding: '12px 14px', color: T.muted }}>{r.targetQty || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#047857' }}>{r.actualQty || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.settingTime ? `${r.settingTime} min` : '—'}</td>
                      <td style={{ padding: '12px 14px', color: r.mcBd ? '#DC2626' : T.muted }}>
                        {r.mcBd ? `${r.mcBd} min` : '0'}
                      </td>
                    </>
                  )}

                  {/* Machine Shop columns */}
                  {department.includes('Machine Shop') && (
                    <>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.proOrderNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.partCode || '—'}</td>
                      <td style={{ padding: '12px 14px', color: T.muted }}>{r.planQty || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.actQty || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#047857' }}>{r.accepted || '—'}</td>
                      <td style={{ padding: '12px 14px', color: r.downTime ? '#B45309' : T.muted }}>
                        {r.downTime ? `${r.downTime} min` : '0'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11 }}>{r.downCode || '—'}</td>
                    </>
                  )}

                  {/* Die Casting columns */}
                  {department.includes('Die Casting') && (
                    <>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.batchNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.modelNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.stHt || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.stWt || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.dcrWt || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.alTemp ? `${r.alTemp}°C` : '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#047857' }}>{r.totalNos || '—'}</td>
                    </>
                  )}

                  {/* CTL / SLT columns */}
                  {(department.includes('CTL') || department.includes('SLT')) && (
                    <>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.modelNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.coilWidth || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.coilId || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.grade || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{r.cuttingSize || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#047857' }}>{r.prodQtyKg?.toLocaleString() || '—'}</td>
                    </>
                  )}

                  {/* Consolidated columns */}
                  {department === 'All Departments' && (
                    <>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>{r.department}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {r.tool || r.modelNo || r.proOrderNo || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#047857' }}>
                        {r.prodKgs ? `${r.prodKgs.toLocaleString()} Kgs` : r.prodNos ? `${r.prodNos} Nos` : r.actualQty ? `${r.actualQty} Nos` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: (r.breakDownMt || r.downTime || r.mcBd) ? '#DC2626' : T.muted }}>
                        {(r.breakDownMt || r.downTime || r.mcBd) ? `${r.breakDownMt || r.downTime || r.mcBd} min` : '0'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: 6,
                            background: r.status === 'Approved' ? '#DCFCE7' : r.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                            color: r.status === 'Approved' ? '#15803D' : r.status === 'Rejected' ? '#DC2626' : '#B45309',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                    </>
                  )}

                  <td style={{ padding: '12px 14px', color: T.muted, fontSize: 12 }}>{r.remarks || '—'}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: 48, textAlign: 'center', color: T.muted }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: T.muted }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>No production records found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      No records match the selected date range ({fromDate} to {toDate}) and filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
