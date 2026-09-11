export type SyncStatus = 'local_only' | 'pending' | 'synced';

export interface FormSubmission {
  id: string;
  submissionId?: string;
  templateId: string;
  plant: string;
  department: string;
  date: string;
  shift: string;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | string;
  syncStatus: SyncStatus;
  rows: Record<string, unknown>[];
  qaObservations?: Record<string, unknown>[];
  submittedAt?: string;
  createdAt?: string;
  operatorName?: string;
  operator?: string;
  remarks?: string;
  signs?: { role: string; userId: string; at: string }[];
}
