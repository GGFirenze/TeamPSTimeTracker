import type { CalendarEvent } from './calendar';
import type { Project } from '../types';

export interface CalendarMapping {
  id: string;
  keyword: string;
  project_id: string;
}

export interface MatchedEvent extends CalendarEvent {
  matchedProjectId: string | null;
  matchSource: 'mapping' | 'project_name' | 'none';
}

const SEPARATOR_RE = /[\s<>|/\-–—,()[\]]+/;

function tokenize(text: string): string[] {
  return text
    .split(SEPARATOR_RE)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2);
}

const NOISE_WORDS = new Set([
  'weekly', 'sync', 'meeting', 'call', 'check', 'in', 'up',
  'the', 'and', 'for', 'with', 'quick', 'bi', 'biweekly',
  'monthly', 'daily', 'standup', 'review', 'update', 'chat',
  '1:1', 'gg', 'giuliano', 'amplitude',
]);

export function matchEvents(
  events: CalendarEvent[],
  projects: Project[],
  mappings: CalendarMapping[]
): MatchedEvent[] {
  const mappingIndex = new Map<string, string>();
  for (const m of mappings) {
    mappingIndex.set(m.keyword.toLowerCase(), m.project_id);
  }

  const projectNameIndex = new Map<string, string>();
  for (const p of projects) {
    projectNameIndex.set(p.name.toLowerCase(), p.id);
    for (const token of tokenize(p.name)) {
      if (!NOISE_WORDS.has(token) && token.length >= 3) {
        projectNameIndex.set(token, p.id);
      }
    }
  }

  return events.map((event) => {
    const tokens = tokenize(event.title);

    for (const token of tokens) {
      const mappedId = mappingIndex.get(token);
      if (mappedId) {
        return { ...event, matchedProjectId: mappedId, matchSource: 'mapping' as const };
      }
    }

    for (const token of tokens) {
      if (NOISE_WORDS.has(token)) continue;
      const projectId = projectNameIndex.get(token);
      if (projectId) {
        return { ...event, matchedProjectId: projectId, matchSource: 'project_name' as const };
      }
    }

    for (const [projectName, projectId] of projectNameIndex) {
      if (event.title.toLowerCase().includes(projectName) && projectName.length >= 3) {
        return { ...event, matchedProjectId: projectId, matchSource: 'project_name' as const };
      }
    }

    return { ...event, matchedProjectId: null, matchSource: 'none' as const };
  });
}

export function suggestKeyword(eventTitle: string): string {
  const tokens = tokenize(eventTitle).filter((t) => !NOISE_WORDS.has(t) && t.length >= 3);
  return tokens[0] ?? '';
}
