export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  attendees: string[];
  isExternal: boolean;
}

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const INTERNAL_PATTERNS = [
  /lunch/i, /do not schedule/i, /dns/i, /ooo/i, /out of office/i,
  /personal/i, /blocker/i, /focus time/i, /^busy$/i,
];

export async function fetchTodayEvents(googleToken: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${googleToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      throw new CalendarTokenExpiredError();
    }
    if (!res.ok) {
      throw new Error(`Calendar API ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return parseEvents(data.items ?? []);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export class CalendarTokenExpiredError extends Error {
  constructor() {
    super('Google Calendar token expired');
    this.name = 'CalendarTokenExpiredError';
  }
}

interface GCalEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string; responseStatus?: string; self?: boolean }[];
  status?: string;
}

function parseEvents(items: GCalEvent[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const item of items) {
    if (!item.start?.dateTime || !item.end?.dateTime) continue;
    if (item.status === 'cancelled') continue;

    const selfAttendee = item.attendees?.find((a) => a.self);
    if (selfAttendee?.responseStatus === 'declined') continue;

    const title = item.summary || '(No title)';
    if (INTERNAL_PATTERNS.some((p) => p.test(title))) continue;

    const attendeeEmails = (item.attendees ?? [])
      .filter((a) => !a.self)
      .map((a) => a.email);

    const hasExternalAttendees = attendeeEmails.some(
      (email) => !email.endsWith('@amplitude.com')
    );

    events.push({
      id: item.id,
      title,
      start: new Date(item.start.dateTime),
      end: new Date(item.end.dateTime),
      attendees: attendeeEmails,
      isExternal: hasExternalAttendees,
    });
  }

  return events;
}
