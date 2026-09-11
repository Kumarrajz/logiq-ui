export interface HeaderField { key: string; label: string; type: string; source?: string; role?: string; default?: string; }
export interface GridColumn { key: string; label: string; type: string; source?: string; role?: string; }
export interface FormTemplate {
  id: string; templateId?: string; name: string; version: number; sourceRef: string;
  plants?: string[]; departments?: string[];
  header: HeaderField[]; grid: { label: string; columns: GridColumn[] };
  qaGrid?: { label: string; columns: GridColumn[] }; signOff: string[];
}
