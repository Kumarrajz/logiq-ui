import type { HeaderField } from '../types/FormTemplate';
import { selStyle } from '../components/buttons';
import { useMasterData } from '../api/useMasterData';
const SOURCE_TO_MASTER: Record<string, string> = { machines: 'machines', models: 'models', shifts: 'shifts' };
export function FieldRenderer({ field, value, onChange }: { field: HeaderField & { label: string }; value: unknown; onChange: (v: string) => void }) {
  const masterKey = field.source ? SOURCE_TO_MASTER[field.source] : undefined;
  const master = useMasterData(masterKey ?? 'shifts');
  const opts: string[] = masterKey && Array.isArray(master.data)
    ? master.data.map((m: { name?: string; id?: string }) => m.name ?? m.id ?? String(m))
    : [];
  if (field.type === 'date') return <input type="date" value={String(value ?? new Date().toISOString().slice(0, 10))} onChange={(e) => onChange(e.target.value)} style={selStyle} />;
  if (field.type === 'select' || field.type === 'user_select') return (
    <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} style={selStyle}>
      <option value="">{field.label}</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (field.type === 'number') return <input type="number" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.label} style={selStyle} />;
  return <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.label} style={selStyle} />;
}
