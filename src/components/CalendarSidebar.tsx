import { useState } from 'react';
import type { MatchedEvent } from '../lib/calendarMatcher';
import type { Project } from '../types';

interface CalendarSidebarProps {
  events: MatchedEvent[];
  projects: Project[];
  isLoading: boolean;
  tokenExpired: boolean;
  onReconnect: () => void;
  onLinkEvent: (eventId: string, keyword: string, projectId: string) => void;
  onRefresh: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function EventRow({
  event,
  projects,
  onLink,
}: {
  event: MatchedEvent;
  projects: Project[];
  onLink: (keyword: string, projectId: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const now = new Date();
  const isCurrent = event.start <= now && event.end > now;
  const isPast = event.end <= now;

  const matchedProject = event.matchedProjectId
    ? projects.find((p) => p.id === event.matchedProjectId)
    : null;

  const handleLink = () => {
    if (!selectedProjectId) return;
    const tokens = event.title
      .split(/[\s<>|/\-–—,()[\]]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 3);
    const keyword = tokens.find(
      (t) =>
        !['weekly', 'sync', 'meeting', 'call', 'check', 'quick', 'gg', 'giuliano', 'amplitude'].includes(t)
    ) || tokens[0] || event.title.toLowerCase();
    onLink(keyword, selectedProjectId);
    setShowPicker(false);
  };

  return (
    <div
      className={`cal-event ${isCurrent ? 'cal-event--current' : ''} ${isPast ? 'cal-event--past' : ''}`}
    >
      <div className="cal-event-time">
        {formatTime(event.start)} – {formatTime(event.end)}
      </div>
      <div className="cal-event-title">{event.title}</div>
      <div className="cal-event-status">
        {matchedProject ? (
          <span className="cal-event-matched">
            <span
              className={`column-dot column-dot--${matchedProject.category === 'billable' ? 'billable' : 'nonbillable'}`}
            />
            {matchedProject.name}
          </span>
        ) : event.isExternal ? (
          <>
            <span className="cal-event-unmatched">Unlinked</span>
            {!showPicker ? (
              <button
                className="cal-link-btn"
                onClick={() => setShowPicker(true)}
              >
                Link
              </button>
            ) : (
              <div className="cal-picker">
                <select
                  className="cal-picker-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Pick project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  className="cal-picker-save"
                  onClick={handleLink}
                  disabled={!selectedProjectId}
                >
                  Save
                </button>
                <button
                  className="cal-picker-cancel"
                  onClick={() => setShowPicker(false)}
                >
                  &times;
                </button>
              </div>
            )}
          </>
        ) : (
          <span className="cal-event-internal">Internal</span>
        )}
      </div>
    </div>
  );
}

export function CalendarSidebar({
  events,
  projects,
  isLoading,
  tokenExpired,
  onReconnect,
  onLinkEvent,
  onRefresh,
}: CalendarSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (tokenExpired) {
    return (
      <aside className="cal-sidebar">
        <div className="cal-sidebar-header">
          <h3 className="cal-sidebar-title">Calendar</h3>
        </div>
        <div className="cal-sidebar-reconnect">
          <p>Calendar access expired.</p>
          <button className="cal-reconnect-btn" onClick={onReconnect}>
            Reconnect
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`cal-sidebar ${collapsed ? 'cal-sidebar--collapsed' : ''}`}>
      <div className="cal-sidebar-header">
        <h3 className="cal-sidebar-title">
          Calendar
          <span className="cal-event-count">({events.length})</span>
        </h3>
        <div className="cal-sidebar-actions">
          <button
            className="cal-refresh-btn"
            onClick={onRefresh}
            title="Refresh events"
            disabled={isLoading}
          >
            &#x21bb;
          </button>
          <button
            className="cal-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="cal-event-list">
          {isLoading && events.length === 0 && (
            <div className="cal-loading">Loading calendar...</div>
          )}
          {!isLoading && events.length === 0 && (
            <div className="cal-empty">No meetings today.</div>
          )}
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              projects={projects}
              onLink={(keyword, projectId) =>
                onLinkEvent(event.id, keyword, projectId)
              }
            />
          ))}
        </div>
      )}
    </aside>
  );
}
