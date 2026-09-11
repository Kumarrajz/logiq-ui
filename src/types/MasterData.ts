export interface Plant { id: string; name: string; }
export interface Department { id: string; name: string; plant: string; }
export interface Machine { id: string; department: string; type: string; }
export interface Shift { id: string; label: string; start: string; end: string; }
export interface ReasonCode { code: number; label: string; }
