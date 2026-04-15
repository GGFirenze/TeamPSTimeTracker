import { useTimerContext } from '../context/TimerContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatTime, useElapsedTime, useDocumentTitle } from '../hooks/useTimer';

export function ActiveTimer() {
  const { currentEntry, pauseTimer, resumeTimer, requestStop } =
    useTimerContext();

  const elapsedSeconds = useElapsedTime(
    currentEntry?.startTime ?? null,
    currentEntry?.pausedAt ?? null,
    currentEntry?.totalPausedMs ?? 0
  );

  const { getProject } = useProjectContext();
  const project = currentEntry ? getProject(currentEntry.projectId) : null;
  const isPaused = currentEntry?.status === 'paused';
  const timeStr = formatTime(elapsedSeconds);

  useDocumentTitle(
    currentEntry
      ? `${timeStr} - ${project?.name ?? 'Timer'}`
      : 'PS Time Tracker'
  );

  if (!currentEntry || !project) return null;

  return (
    <div className={`active-timer ${isPaused ? 'active-timer--paused' : ''}`}>
      <div className="active-timer-left">
        <span className={`pulse-dot ${isPaused ? 'pulse-dot--paused' : ''}`} />
        <span className="active-timer-project">{project.name}</span>
        <span
          className={`active-timer-badge active-timer-badge--${project.category}`}
        >
          {project.category === 'billable' ? 'Billable' : 'Non-Billable'}
        </span>
      </div>
      <div className="active-timer-center">
        <span className="active-timer-time">{timeStr}</span>
      </div>
      <div className="active-timer-right">
        {isPaused ? (
          <button className="timer-btn timer-btn--resume" onClick={() => resumeTimer('main')}>
            <span className="btn-icon">&#9654;</span> Resume
          </button>
        ) : (
          <button className="timer-btn timer-btn--pause" onClick={() => pauseTimer('main')}>
            <span className="btn-icon">&#10074;&#10074;</span> Pause
          </button>
        )}
        <button className="timer-btn timer-btn--stop" onClick={() => requestStop('main')}>
          <span className="btn-icon">&#9632;</span> Stop
        </button>
      </div>
    </div>
  );
}
