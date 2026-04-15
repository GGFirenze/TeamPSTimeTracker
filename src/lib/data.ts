import { restQuery, getAccessToken } from './supabase';
import type { Project, TimeEntry } from '../types';

// ---- Projects ----

export async function fetchUserProjects(userId: string, accessToken?: string | null): Promise<Project[]> {
  const token = accessToken || getAccessToken();
  const path = `user_projects?select=project:projects(*)&user_id=eq.${userId}`;

  const data = await restQuery<{ project: unknown }[]>(path, { token });

  return (data ?? [])
    .map((row) => {
      const p = row.project as unknown as {
        id: string;
        name: string;
        category: 'billable' | 'non-billable';
        archived: boolean;
      };
      if (!p || !p.id) return null;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        isDefault: true,
      } satisfies Project;
    })
    .filter((p): p is Project => p !== null);
}

export async function fetchAllProjects(): Promise<(Project & { archived: boolean })[]> {
  const token = getAccessToken();
  const data = await restQuery<{
    id: string;
    name: string;
    category: string;
    archived: boolean;
  }[]>('projects?select=*&order=name', { token });

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category as 'billable' | 'non-billable',
    isDefault: true,
    archived: p.archived,
  }));
}

export async function createProject(name: string, category: 'billable' | 'non-billable') {
  const token = getAccessToken();
  const data = await restQuery<{ id: string; name: string; category: string }[]>(
    'projects',
    { token, method: 'POST', body: { name, category } }
  );
  return data[0];
}

export async function archiveProject(projectId: string) {
  const token = getAccessToken();
  await restQuery(`projects?id=eq.${projectId}`, {
    token,
    method: 'PATCH',
    body: { archived: true },
  });
}

export async function unarchiveProject(projectId: string) {
  const token = getAccessToken();
  await restQuery(`projects?id=eq.${projectId}`, {
    token,
    method: 'PATCH',
    body: { archived: false },
  });
}

// ---- User-Project Assignments ----

export async function fetchAllAssignments(): Promise<{ user_id: string; project_id: string }[]> {
  const token = getAccessToken();
  return restQuery<{ user_id: string; project_id: string }[]>(
    'user_projects?select=user_id,project_id',
    { token }
  );
}

export async function assignProjectToUser(userId: string, projectId: string) {
  const token = getAccessToken();
  try {
    await restQuery('user_projects', {
      token,
      method: 'POST',
      body: { user_id: userId, project_id: projectId },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('409')) return;
    throw err;
  }
}

export async function unassignProjectFromUser(userId: string, projectId: string) {
  const token = getAccessToken();
  await restQuery(
    `user_projects?user_id=eq.${userId}&project_id=eq.${projectId}`,
    { token, method: 'DELETE' }
  );
}

export async function fetchProjectAssignments(projectId: string) {
  const token = getAccessToken();
  return restQuery<{ user_id: string; profiles: { email: string; full_name: string | null } }[]>(
    `user_projects?select=user_id,profiles(email,full_name)&project_id=eq.${projectId}`,
    { token }
  );
}

export async function fetchAllUsers() {
  const token = getAccessToken();
  return restQuery<{ id: string; email: string; full_name: string | null; is_admin: boolean }[]>(
    'profiles?select=*&order=email',
    { token }
  );
}

// ---- Time Entries ----

export async function fetchTodayEntries(userId: string): Promise<TimeEntry[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const token = getAccessToken();

  const data = await restQuery<Record<string, unknown>[]>(
    `time_entries?select=*&user_id=eq.${userId}&start_time=gte.${startOfDay.getTime()}&order=start_time.desc`,
    { token }
  );

  return (data ?? []).map(mapDbEntryToTimeEntry);
}

export async function fetchCurrentEntry(userId: string): Promise<TimeEntry | null> {
  const token = getAccessToken();
  const data = await restQuery<Record<string, unknown>[]>(
    `time_entries?select=*&user_id=eq.${userId}&status=in.(active,paused)&order=start_time.desc&limit=1`,
    { token }
  );

  return data?.[0] ? mapDbEntryToTimeEntry(data[0]) : null;
}

export async function upsertTimeEntry(userId: string, entry: TimeEntry) {
  const token = getAccessToken();
  const body = {
    id: entry.id,
    user_id: userId,
    project_id: entry.projectId,
    start_time: entry.startTime,
    end_time: entry.endTime,
    total_seconds: entry.totalSeconds,
    paused_at: entry.pausedAt,
    total_paused_ms: entry.totalPausedMs,
    status: entry.status,
    note: entry.note,
  };

  await restQuery('time_entries', {
    token,
    method: 'POST',
    body,
    upsert: true,
  });
}

export async function deleteTimeEntry(entryId: string) {
  const token = getAccessToken();
  await restQuery(`time_entries?id=eq.${entryId}`, {
    token,
    method: 'DELETE',
  });
}

function mapDbEntryToTimeEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    startTime: row.start_time as number,
    endTime: (row.end_time as number) ?? null,
    totalSeconds: row.total_seconds as number,
    pausedAt: (row.paused_at as number) ?? null,
    totalPausedMs: row.total_paused_ms as number,
    status: row.status as 'active' | 'paused' | 'completed',
    note: (row.note as string) ?? '',
  };
}
