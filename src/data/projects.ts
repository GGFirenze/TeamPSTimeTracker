import { Project } from '../types';

export const DEFAULT_BILLABLE_PROJECTS: Project[] = [
  { id: 'jpmc', name: 'JPMC', category: 'billable', isDefault: true },
  { id: 'snyk', name: 'Snyk', category: 'billable', isDefault: true },
  { id: 'pleo', name: 'Pleo', category: 'billable', isDefault: true },
  { id: 'manomano', name: 'ManoMano', category: 'billable', isDefault: true },
  { id: 'wallapop', name: 'Wallapop', category: 'billable', isDefault: true },
  { id: 'cabify', name: 'Cabify', category: 'billable', isDefault: true },
  { id: 'thefork', name: 'TheFork', category: 'billable', isDefault: true },
  { id: 'canal-plus', name: 'Canal+', category: 'billable', isDefault: true },
  { id: 'doctolib', name: 'Doctolib', category: 'billable', isDefault: true },
  { id: 'fressnapf', name: 'Fressnapf', category: 'billable', isDefault: true },
  { id: 'jpm-fintech', name: 'JPM Fintech Implementation', category: 'billable', isDefault: true },
];

export const DEFAULT_NON_BILLABLE_PROJECTS: Project[] = [
  { id: 'internal-meetings', name: 'Internal Meetings', category: 'non-billable', isDefault: true },
  { id: 'internal-projects', name: 'Internal Projects', category: 'non-billable', isDefault: true },
  { id: 'self-development', name: 'Self Development', category: 'non-billable', isDefault: true },
  { id: 'free-ps-hours', name: 'Free PS Hours', category: 'non-billable', isDefault: true },
  { id: 'admin-time', name: 'Admin Time', category: 'non-billable', isDefault: true },
];

export const DEFAULT_PROJECTS: Project[] = [
  ...DEFAULT_BILLABLE_PROJECTS,
  ...DEFAULT_NON_BILLABLE_PROJECTS,
];

export function getProjectById(
  id: string,
  allProjects: Project[] = DEFAULT_PROJECTS
): Project | undefined {
  return allProjects.find((p) => p.id === id);
}
