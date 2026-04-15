import { useTimerContext } from '../context/TimerContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatTime, formatTimeCompact } from '../hooks/useTimer';

export function TimeLog() {
  const { todayEntries, deleteEntry } = useTimerContext();
  const { getProject } = useProjectContext();

  if (todayEntries.length === 0) {
    return (
      <section className="time-log">
        <h2 className="time-log-title">Today's Log</h2>
        <div className="time-log-empty">
          <p>No time entries yet today. Start a timer to begin tracking!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="time-log">
      <h2 className="time-log-title">
        Today's Log
        <span className="time-log-count">{todayEntries.length} entries</span>
      </h2>
      <div className="time-log-list">
        {todayEntries.map((entry) => {
          const project = getProject(entry.projectId);
          if (!project) return null;

          const startStr = new Date(entry.startTime).toLocaleTimeString(
            'en-US',
            { hour: '2-digit', minute: '2-digit' }
          );
          const endStr = entry.endTime
            ? new Date(entry.endTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—';

          return (
            <div key={entry.id} className="log-entry">
              <div className="log-entry-left">
                <span
                  className={`log-dot log-dot--${project.category}`}
                />
                <div className="log-entry-info">
                  <span className="log-entry-project">{project.name}</span>
                  <span className="log-entry-time-range">
                    {startStr} &rarr; {endStr}
                  </span>
                </div>
              </div>
              <div className="log-entry-center">
                {entry.note && (
                  <span className="log-entry-note" title={entry.note}>
                    {entry.note}
                  </span>
                )}
              </div>
              <div className="log-entry-right">
                <span className="log-entry-duration">
                  {entry.totalSeconds >= 3600
                    ? formatTime(entry.totalSeconds)
                    : formatTimeCompact(entry.totalSeconds)}
                </span>
                <button
                  className="log-entry-delete"
                  onClick={() => deleteEntry(entry.id)}
                  title="Delete entry"
                >
                  &times;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
