import { Project } from '../types';
import { useTimerContext } from '../context/TimerContext';
import { formatTimeCompact, useElapsedTime } from '../hooks/useTimer';

interface ProjectCardProps {
  project: Project;
  onRequestDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onRequestDelete }: ProjectCardProps) {
  const { currentEntry, startTimer, todayEntries } = useTimerContext();
  const isActive = currentEntry?.projectId === project.id;
  const isPaused = isActive && currentEntry?.status === 'paused';

  const elapsedSeconds = useElapsedTime(
    isActive ? currentEntry!.startTime : null,
    isActive ? currentEntry!.pausedAt : null,
    isActive ? currentEntry!.totalPausedMs : 0
  );

  const todayProjectSeconds = todayEntries
    .filter((e) => e.projectId === project.id)
    .reduce((sum, e) => sum + e.totalSeconds, 0);

  const totalToday = todayProjectSeconds + (isActive ? elapsedSeconds : 0);

  return (
    <div
      className={`project-card ${isActive ? 'project-card--active' : ''} ${isPaused ? 'project-card--paused' : ''} project-card--${project.category}`}
    >
      <div className="project-card-header">
        <span className="project-card-name">{project.name}</span>
        {totalToday > 0 && (
          <span className="project-card-today">
            {formatTimeCompact(totalToday)}
          </span>
        )}
      </div>

      <div className="project-card-actions">
        {isActive ? (
          <div className="project-card-active-indicator">
            <span className={`pulse-dot ${isPaused ? 'pulse-dot--paused' : ''}`} />
            <span className="project-card-status">
              {isPaused ? 'Paused' : 'Running'}
            </span>
          </div>
        ) : (
          <button
            className="project-card-start"
            onClick={() => startTimer(project.id)}
          >
            Start
          </button>
        )}
        {!project.isDefault && onRequestDelete && (
          <button
            className="project-card-delete"
            onClick={() => onRequestDelete(project)}
            title="Delete project"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
