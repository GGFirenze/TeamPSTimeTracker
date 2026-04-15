import { supabase } from './supabase';
import type { Project, TimeEntry } from '../types';

// ---- Projects ----

export async function fetchUserProjects(userId: string): Promise<Project[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    console.warn('fetchUserProjects: no active session, attempting refresh');
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr) {
      console.error('Session refresh failed:', refreshErr.message);
      throw new Error('No active session');
    }
  }

  const { data, error } = await supabase
    .from('user_projects')
    .select('project:projects(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('fetchUserProjects error:', error.message, error.details, error.hint);
    throw error;
  }

  if (!data || data.length === 0) {
    console.info('fetchUserProjects: query returned 0 rows for user', userId);
  }

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
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category as 'billable' | 'non-billable',
    isDefault: true,
    archived: p.archived,
  }));
}

export async function createProject(name: string, category: 'billable' | 'non-billable') {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, category })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .update({ archived: true })
    .eq('id', projectId);

  if (error) throw error;
}

export async function unarchiveProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .update({ archived: false })
    .eq('id', projectId);

  if (error) throw error;
}

// ---- User-Project Assignments ----

export async function assignProjectToUser(userId: string, projectId: string) {
  const { error } = await supabase
    .from('user_projects')
    .insert({ user_id: userId, project_id: projectId });

  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function unassignProjectFromUser(userId: string, projectId: string) {
  const { error } = await supabase
    .from('user_projects')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId);

  if (error) throw error;
}

export async function fetchProjectAssignments(projectId: string) {
  const { data, error } = await supabase
    .from('user_projects')
    .select('user_id, profiles(email, full_name)')
    .eq('project_id', projectId);

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email');

  if (error) throw error;
  return data ?? [];
}

// ---- Time Entries ----

export async function fetchTodayEntries(userId: string): Promise<TimeEntry[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startOfDay.getTime())
    .order('start_time', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapDbEntryToTimeEntry);
}

export async function fetchCurrentEntry(userId: string): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'paused'])
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDbEntryToTimeEntry(data) : null;
}

export async function upsertTimeEntry(userId: string, entry: TimeEntry) {
  const { error } = await supabase
    .from('time_entries')
    .upsert({
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
    });

  if (error) throw error;
}

export async function deleteTimeEntry(entryId: string) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
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
