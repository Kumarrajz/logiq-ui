import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { T } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { EntryPortalHeader } from '../components/EntryPortalHeader';
import { RoleSubmissionHistory } from '../components/RoleSubmissionHistory';
import { canViewExecutiveAnalytics, subscribeToPolicyChange } from '../rbac/accessControl';

const DEPT_PRODUCTION_DATA = [
  { dept: 'Assembly', target: 5200, actual: 4950 },
  { dept: 'Machine Shop', target: 3800, actual: 3420 },
  { dept: 'Press Shop', target: 4000, actual: 3820 },
  { dept: 'Die Casting', target: 2500, actual: 2480 },
  { dept: 'CTL', target: 3000, actual: 2910 },
  { dept: 'SLT', target: 2200, actual: 2000 },
];

const DOWNTIME_REASONS = [
  { name: 'Breakdown', value: 35, color: '#38BDF8' },
  { name: 'No Material', value: 25, color: '#818CF8' },
  { name: 'Setup', value: 18, color: '#F97316' },
  { name: 'Tool Problem', value: 10, color: '#FBBF24' },
  { name: 'Power Failure', value: 7, color: '#34D399' },
  { name: 'Others', value: 5, color: '#94A3B8' },
];

export function DashboardScreen() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role) || 'role_operator';
  const plant = user?.plant || 'Plant-V';
  const [, setPolicyVer] = useState(0);

  useEffect(() => {
    return subscribeToPolicyChange(() => {
      setPolicyVer((v) => v + 1);
    });
  }, []);

  const hasExecutiveAnalytics = canViewExecutiveAnalytics(role);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name || 'there';

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 40 }}>
      {/* Clean Welcome Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
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
            {greeting}, {displayName}
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>
            {plant} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Compact Shift Status Bar (for operators/supervisors) */}
      <EntryPortalHeader />

      {hasExecutiveAnalytics ? (
        <>
          {/* Executive Analytics */}
          <div
            style={{
              background: 'linear-gradient(145deg, #071220 0%, #0B192C 60%, #0D1F38 100%)',
              borderRadius: 20,
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.45), 0 0 24px rgba(30, 96, 213, 0.15)',
              marginBottom: 24,
            }}
          >
            {/* KPI Cards */}
            <div className="grid-kpi" style={{ marginBottom: 20 }}>
              {/* Card 1: Total Production */}
              <GlassPanel
                dark
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'rgba(30, 96, 213, 0.18)',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 6 }}>
                    Total Production
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
                    12,580
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>
                    Units / Kgs
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ↑ 8% <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>vs. yesterday</span>
                  </span>
                  <svg width="32" height="18" viewBox="0 0 34 20" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,16 10,12 18,15 26,6 32,9"></polyline>
                  </svg>
                </div>
              </GlassPanel>

              {/* Card 2: Target */}
              <GlassPanel
                dark
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.16)',
                  borderColor: 'rgba(52, 211, 153, 0.35)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 6 }}>
                    Target
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
                    13,500
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>
                    Units / Kgs
                  </div>
                </div>
                <div style={{ position: 'relative', width: 50, height: 50 }}>
                  <svg width="50" height="50" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3.2" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3.2" strokeDasharray="93, 100" />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#34D399' }}>
                    93%
                  </div>
                </div>
              </GlassPanel>

              {/* Card 3: Machine Utilisation */}
              <GlassPanel
                dark
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(249, 115, 22, 0.16)',
                  borderColor: 'rgba(251, 146, 60, 0.35)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 6 }}>
                    Utilisation
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
                    87%
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>Average</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 32 }}>
                  <div style={{ width: 5, height: '40%', background: '#F97316', borderRadius: 2 }} />
                  <div style={{ width: 5, height: '65%', background: '#F97316', borderRadius: 2 }} />
                  <div style={{ width: 5, height: '90%', background: '#F97316', borderRadius: 2 }} />
                  <div style={{ width: 5, height: '75%', background: '#F97316', borderRadius: 2 }} />
                </div>
              </GlassPanel>

              {/* Card 4: Total Downtime */}
              <GlassPanel
                dark
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(239, 68, 68, 0.16)',
                  borderColor: 'rgba(248, 113, 113, 0.35)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 6 }}>
                    Downtime
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, fontFamily: "'Space Grotesk', sans-serif" }}>
                    2.4 hrs
                  </div>
                  <div style={{ fontSize: 11, color: '#F87171', fontWeight: 600, marginTop: 4 }}>
                    ↓ 12% <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Today</span>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Charts Row */}
            <div className="grid-charts-2" style={{ marginBottom: 20 }}>
              {/* Chart 1: Production by Department */}
              <GlassPanel dark style={{ padding: 20, background: 'rgba(11, 25, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Production by Department
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60A5FA' }} /> Target
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} /> Actual
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={DEPT_PRODUCTION_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                    <XAxis dataKey="dept" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.65)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.65)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: 12,
                        color: '#fff',
                      }}
                      formatter={(val: number) => [`${val.toLocaleString()} Units/Kgs`]}
                    />
                    <Bar dataKey="target" fill="#60A5FA" radius={[4, 4, 0, 0]} opacity={0.6} />
                    <Bar dataKey="actual" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassPanel>

              {/* Chart 2: Downtime Donut */}
              <GlassPanel dark style={{ padding: 20, display: 'flex', flexDirection: 'column', background: 'rgba(11, 25, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 14px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Downtime Reasons
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={DOWNTIME_REASONS} dataKey="value" innerRadius={44} outerRadius={66} paddingAngle={3}>
                          {DOWNTIME_REASONS.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(12px)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, color: '#fff' }}
                          formatter={(val: number) => [`${val}%`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif" }}>2.4</span>
                      <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.6)' }}>Hrs</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, minWidth: 120 }}>
                    {DOWNTIME_REASONS.map((r) => (
                      <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color }} />
                          {r.name}
                        </span>
                        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{r.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Recent Activity */}
            <GlassPanel dark style={{ padding: 20, background: 'rgba(11, 25, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: '0 0 14px', fontFamily: "'Space Grotesk', sans-serif" }}>
                Recent Activity
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { dept: 'Press Shop', action: 'Production entry submitted', time: 'Today 11:20 AM', color: '#38BDF8' },
                  { dept: 'Machine Shop', action: 'Approved by supervisor', time: 'Today 10:45 AM', color: '#F97316' },
                  { dept: 'Die Casting', action: 'QA sample recorded', time: 'Today 09:30 AM', color: '#34D399' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#FFFFFF' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <strong>{item.dept}</strong> — {item.action}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Submission History for Executives */}
          <div style={{ marginTop: 20 }}>
            <RoleSubmissionHistory department={user?.department} />
          </div>
        </>
      ) : (
        /* Operator / Supervisor — Scoped View */
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
              color: T.muted,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span>Your submitted logbooks and shift records</span>
            <button
              type="button"
              onClick={() => nav('/entry')}
              style={{
                background: T.blue,
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + New Entry
            </button>
          </div>

          <RoleSubmissionHistory department={user?.department} />
        </div>
      )}
    </div>
  );
}
