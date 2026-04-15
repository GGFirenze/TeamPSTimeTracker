export type ProjectCategory = 'billable' | 'non-billable';

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  isDefault: boolean;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: number;
  endTime: number | null;
  totalSeconds: number;
  pausedAt: number | null;
  totalPausedMs: number;
  status: 'active' | 'paused' | 'completed';
  note: string;
}

export interface TimerState {
  currentEntry: TimeEntry | null;
  entries: TimeEntry[];
}
