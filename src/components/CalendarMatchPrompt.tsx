import { useState } from 'react';
import type { MatchedEvent } from '../lib/calendarMatcher';
import { suggestKeyword } from '../lib/calendarMatcher';
import type { Project } from '../types';

interface CalendarMatchPromptProps {
  event: MatchedEvent;
  projects: Project[];
  onLink: (keyword: string, projectId: string) => Promise<void>;
  onDismiss: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function minutesUntil(date: Date): number {
  return Math.max(0, Math.round((date.getTime() - Date.now()) / 60_000));
}

export function CalendarMatchPrompt({
  event,
  projects,
  onLink,
  onDismiss,
}: CalendarMatchPromptProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [keyword, setKeyword] = useState(() => suggestKeyword(event.title));
  const [isSaving, setIsSaving] = useState(false);

  const mins = minutesUntil(event.start);

  const handleSave = async () => {
    if (!selectedProjectId || !keyword.trim()) return;
    setIsSaving(true);
    try {
      await onLink(keyword.trim(), selectedProjectId);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cal-prompt-overlay">
      <div className="cal-prompt-modal">
        <div className="cal-prompt-header">
          <span className="cal-prompt-icon">&#128197;</span>
          <span className="cal-prompt-title">
            {mins > 0
              ? `Meeting in ${mins} min`
              : 'Meeting starting now'}
          </span>
        </div>

        <div className="cal-prompt-event">
          <div className="cal-prompt-event-title">{event.title}</div>
          <div className="cal-prompt-event-time">
            {formatTime(event.start)} – {formatTime(event.end)}
          </div>
        </div>

        <p className="cal-prompt-question">Which project is this for?</p>

        <select
          className="cal-prompt-select"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category})
            </option>
          ))}
        </select>

        <div className="cal-prompt-keyword">
          <label className="cal-prompt-keyword-label">
            Remember keyword:
            <input
              className="cal-prompt-keyword-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Florence"
            />
          </label>
          <span className="cal-prompt-keyword-hint">
            Future events with "{keyword}" will auto-link.
          </span>
        </div>

        <div className="cal-prompt-actions">
          <button
            className="cal-prompt-save"
            onClick={handleSave}
            disabled={!selectedProjectId || !keyword.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Link & Start Timer'}
          </button>
          <button className="cal-prompt-dismiss" onClick={onDismiss}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
