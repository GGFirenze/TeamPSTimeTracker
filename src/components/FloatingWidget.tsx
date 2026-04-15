import { useTimerContext } from '../context/TimerContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatTime, useElapsedTime } from '../hooks/useTimer';

export function FloatingWidget() {
  const {
    currentEntry,
    pauseTimer,
    resumeTimer,
    requestStop,
    startTimer,
  } = useTimerContext();

  const { billableProjects, nonBillableProjects, getProject } =
    useProjectContext();

  const elapsedSeconds = useElapsedTime(
    currentEntry?.startTime ?? null,
    currentEntry?.pausedAt ?? null,
    currentEntry?.totalPausedMs ?? 0
  );

  const project = currentEntry ? getProject(currentEntry.projectId) : null;
  const isPaused = currentEntry?.status === 'paused';
  const timeStr = formatTime(elapsedSeconds);

  return (
    <div className="pip-widget">
      {currentEntry && project ? (
        <div className="pip-timer">
          <div className="pip-timer-header">
            <span
              className={`pulse-dot ${isPaused ? 'pulse-dot--paused' : ''}`}
            />
            <span className="pip-timer-project">{project.name}</span>
            <span
              className={`pip-timer-badge pip-timer-badge--${project.category}`}
            >
              {project.category === 'billable' ? 'B' : 'NB'}
            </span>
          </div>
          <div className="pip-timer-time">{timeStr}</div>
          <div className="pip-timer-controls">
            {isPaused ? (
              <button
                className="timer-btn timer-btn--resume"
                onClick={() => resumeTimer('pip_widget')}
              >
                <span className="btn-icon">&#9654;</span> Resume
              </button>
            ) : (
              <button
                className="timer-btn timer-btn--pause"
                onClick={() => pauseTimer('pip_widget')}
              >
                <span className="btn-icon">&#10074;&#10074;</span> Pause
              </button>
            )}
            <button
              className="timer-btn timer-btn--stop"
              onClick={() => requestStop('pip_widget')}
            >
              <span className="btn-icon">&#9632;</span> Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="pip-no-timer">
          <span className="pip-no-timer-text">No timer running</span>
        </div>
      )}

      <div className="pip-divider" />

      <div className="pip-projects">
        <div className="pip-projects-label">Quick Start</div>
        <div className="pip-project-group">
          <div className="pip-group-label pip-group-label--billable">
            <span className="column-dot column-dot--billable" />
            Billable
          </div>
          {billableProjects.map((p) => (
            <button
              key={p.id}
              className={`pip-project-btn pip-project-btn--billable ${
                currentEntry?.projectId === p.id ? 'pip-project-btn--active' : ''
              }`}
              onClick={() => startTimer(p.id, 'pip_widget')}
              disabled={currentEntry?.projectId === p.id}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="pip-project-group">
          <div className="pip-group-label pip-group-label--nonbillable">
            <span className="column-dot column-dot--nonbillable" />
            Non-Billable
          </div>
          {nonBillableProjects.map((p) => (
            <button
              key={p.id}
              className={`pip-project-btn pip-project-btn--nonbillable ${
                currentEntry?.projectId === p.id ? 'pip-project-btn--active' : ''
              }`}
              onClick={() => startTimer(p.id, 'pip_widget')}
              disabled={currentEntry?.projectId === p.id}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
