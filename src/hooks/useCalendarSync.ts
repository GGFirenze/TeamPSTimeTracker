import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTodayEvents, CalendarTokenExpiredError } from '../lib/calendar';
import type { CalendarEvent } from '../lib/calendar';
import { matchEvents } from '../lib/calendarMatcher';
import type { MatchedEvent, CalendarMapping } from '../lib/calendarMatcher';
import { fetchCalendarMappings, saveCalendarMapping } from '../lib/data';
import type { Project } from '../types';

const POLL_INTERVAL_MS = 60_000;

export interface CalendarSyncState {
  events: MatchedEvent[];
  isLoading: boolean;
  tokenExpired: boolean;
  pendingPrompt: MatchedEvent | null;
  dismissPrompt: () => void;
  linkEventToProject: (keyword: string, projectId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCalendarSync(
  googleToken: string | null,
  userId: string | null,
  projects: Project[],
  currentTimerProjectId: string | null,
  startTimer: (projectId: string, source: 'calendar') => void,
  requestStop: (source: 'calendar') => void
): CalendarSyncState {
  const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
  const [mappings, setMappings] = useState<CalendarMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<MatchedEvent | null>(null);

  const activeCalendarEventIdRef = useRef<string | null>(null);
  const dismissedPromptsRef = useRef<Set<string>>(new Set());
  const userOverrodeRef = useRef(false);

  const matchedEvents = matchEvents(rawEvents, projects, mappings);

  const loadMappings = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchCalendarMappings(userId);
      setMappings(data);
    } catch (err) {
      console.error('Failed to load calendar mappings:', err);
    }
  }, [userId]);

  const loadEvents = useCallback(async () => {
    if (!googleToken) return;
    setIsLoading(true);
    try {
      const events = await fetchTodayEvents(googleToken);
      setRawEvents(events);
      setTokenExpired(false);
    } catch (err) {
      if (err instanceof CalendarTokenExpiredError) {
        setTokenExpired(true);
      } else {
        console.error('Failed to fetch calendar events:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [googleToken]);

  const refresh = useCallback(async () => {
    await Promise.all([loadEvents(), loadMappings()]);
  }, [loadEvents, loadMappings]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!googleToken || tokenExpired) return;
    const interval = setInterval(loadEvents, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [googleToken, tokenExpired, loadEvents]);

  // Auto-start/stop logic
  useEffect(() => {
    const now = new Date();

    const currentEvent = matchedEvents.find(
      (e) => e.matchedProjectId && e.start <= now && e.end > now
    );

    if (currentEvent && currentEvent.matchedProjectId) {
      if (
        activeCalendarEventIdRef.current !== currentEvent.id &&
        !userOverrodeRef.current
      ) {
        if (!currentTimerProjectId) {
          startTimer(currentEvent.matchedProjectId, 'calendar');
          activeCalendarEventIdRef.current = currentEvent.id;
        } else if (currentTimerProjectId === currentEvent.matchedProjectId) {
          activeCalendarEventIdRef.current = currentEvent.id;
        }
      }
    } else if (activeCalendarEventIdRef.current) {
      const prevEvent = matchedEvents.find(
        (e) => e.id === activeCalendarEventIdRef.current
      );
      if (prevEvent && now >= prevEvent.end) {
        if (currentTimerProjectId === prevEvent.matchedProjectId) {
          requestStop('calendar');
        }
        activeCalendarEventIdRef.current = null;
        userOverrodeRef.current = false;
      }
    }

    // Prompt for unmatched events starting in the next 5 minutes
    const upcomingUnmatched = matchedEvents.find(
      (e) =>
        e.matchSource === 'none' &&
        e.isExternal &&
        e.start.getTime() - now.getTime() <= 5 * 60 * 1000 &&
        e.start.getTime() - now.getTime() > 0 &&
        !dismissedPromptsRef.current.has(e.id)
    );
    if (upcomingUnmatched && !pendingPrompt) {
      setPendingPrompt(upcomingUnmatched);
    }
  }, [matchedEvents, currentTimerProjectId, startTimer, requestStop, pendingPrompt]);

  // Detect manual override: user started a different timer than what calendar would pick
  useEffect(() => {
    if (!activeCalendarEventIdRef.current) return;
    const calEvent = matchedEvents.find(
      (e) => e.id === activeCalendarEventIdRef.current
    );
    if (
      calEvent?.matchedProjectId &&
      currentTimerProjectId &&
      currentTimerProjectId !== calEvent.matchedProjectId
    ) {
      userOverrodeRef.current = true;
    }
  }, [currentTimerProjectId, matchedEvents]);

  const dismissPrompt = useCallback(() => {
    if (pendingPrompt) {
      dismissedPromptsRef.current.add(pendingPrompt.id);
    }
    setPendingPrompt(null);
  }, [pendingPrompt]);

  const linkEventToProject = useCallback(
    async (keyword: string, projectId: string) => {
      if (!userId) return;
      await saveCalendarMapping(userId, keyword, projectId);
      await loadMappings();
      setPendingPrompt(null);
    },
    [userId, loadMappings]
  );

  return {
    events: matchedEvents,
    isLoading,
    tokenExpired,
    pendingPrompt,
    dismissPrompt,
    linkEventToProject,
    refresh,
  };
}
