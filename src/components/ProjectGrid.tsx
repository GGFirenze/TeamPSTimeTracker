import { useProjectContext } from '../context/ProjectContext';
import { ProjectCard } from './ProjectCard';

export function ProjectGrid() {
  const { billableProjects, nonBillableProjects, isLoading } =
    useProjectContext();

  if (isLoading) {
    return (
      <section className="project-grid">
        <p className="project-grid-loading">Loading projects...</p>
      </section>
    );
  }

  const hasProjects = billableProjects.length > 0 || nonBillableProjects.length > 0;

  if (!hasProjects) {
    return (
      <section className="project-grid">
        <div className="project-grid-empty">
          <p>No projects assigned yet.</p>
          <p className="project-grid-empty-hint">
            Ask your admin to assign projects to your account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="project-grid">
      {billableProjects.length > 0 && (
        <div className="project-column">
          <div className="column-header">
            <h2 className="column-title column-title--billable">
              <span className="column-dot column-dot--billable" />
              Billable
            </h2>
          </div>
          <div className="project-cards">
            {billableProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
      {nonBillableProjects.length > 0 && (
        <div className="project-column">
          <div className="column-header">
            <h2 className="column-title column-title--nonbillable">
              <span className="column-dot column-dot--nonbillable" />
              Non-Billable
            </h2>
          </div>
          <div className="project-cards">
            {nonBillableProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
