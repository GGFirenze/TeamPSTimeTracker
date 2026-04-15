import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllProjects,
  createProject,
  archiveProject,
  unarchiveProject,
  fetchAllUsers,
  fetchAllAssignments,
  assignProjectToUser,
  unassignProjectFromUser,
} from '../lib/data';
import type { ProjectCategory } from '../types';

interface DbProject {
  id: string;
  name: string;
  category: ProjectCategory;
  isDefault: boolean;
  archived: boolean;
}

interface DbUser {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

interface Assignment {
  user_id: string;
  project_id: string;
}

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'projects' | 'assign'>('projects');
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('billable');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, u, a] = await Promise.all([
        fetchAllProjects(),
        fetchAllUsers(),
        fetchAllAssignments(),
      ]);
      setProjects(p);
      setUsers(u);
      setAssignments(a);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProject = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await createProject(trimmed, newCategory);
      setNewName('');
      await loadData();
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleToggleArchive = async (project: DbProject) => {
    try {
      if (project.archived) {
        await unarchiveProject(project.id);
      } else {
        await archiveProject(project.id);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const handleToggleAssignment = async (userId: string, projectId: string) => {
    const exists = assignments.some(
      (a) => a.user_id === userId && a.project_id === projectId
    );
    try {
      if (exists) {
        await unassignProjectFromUser(userId, projectId);
      } else {
        await assignProjectToUser(userId, projectId);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to toggle assignment:', err);
    }
  };

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  const isAssigned = (userId: string, projectId: string) =>
    assignments.some((a) => a.user_id === userId && a.project_id === projectId);

  const assignmentCount = (projectId: string) =>
    assignments.filter((a) => a.project_id === projectId).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Admin Panel</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'projects' ? 'admin-tab--active' : ''}`}
            onClick={() => setTab('projects')}
          >
            Projects
          </button>
          <button
            className={`admin-tab ${tab === 'assign' ? 'admin-tab--active' : ''}`}
            onClick={() => setTab('assign')}
          >
            Assignments
          </button>
        </div>

        {isLoading ? (
          <div className="admin-loading">Loading...</div>
        ) : tab === 'projects' ? (
          <div className="admin-content">
            <div className="admin-create">
              <input
                className="admin-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New project name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <div className="admin-create-row">
                <div className="add-project-toggle">
                  <button
                    className={`toggle-btn ${newCategory === 'billable' ? 'toggle-btn--active toggle-btn--billable' : ''}`}
                    onClick={() => setNewCategory('billable')}
                  >
                    Billable
                  </button>
                  <button
                    className={`toggle-btn ${newCategory === 'non-billable' ? 'toggle-btn--active toggle-btn--nonbillable' : ''}`}
                    onClick={() => setNewCategory('non-billable')}
                  >
                    Non-Billable
                  </button>
                </div>
                <button
                  className="admin-create-btn"
                  onClick={handleCreateProject}
                  disabled={!newName.trim()}
                >
                  Create
                </button>
              </div>
            </div>

            <div className="admin-project-list">
              <div className="admin-section-label">
                Active Projects ({activeProjects.length})
              </div>
              {activeProjects.map((p) => (
                <div key={p.id} className="admin-project-row">
                  <div className="admin-project-info">
                    <span
                      className={`column-dot column-dot--${p.category === 'billable' ? 'billable' : 'nonbillable'}`}
                    />
                    <span className="admin-project-name">{p.name}</span>
                    <span className="admin-project-count">
                      {assignmentCount(p.id)} users
                    </span>
                  </div>
                  <button
                    className="admin-archive-btn"
                    onClick={() => handleToggleArchive(p)}
                    title="Archive project"
                  >
                    Archive
                  </button>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="admin-empty">No active projects. Create one above.</p>
              )}

              {archivedProjects.length > 0 && (
                <>
                  <div className="admin-section-label admin-section-label--archived">
                    Archived ({archivedProjects.length})
                  </div>
                  {archivedProjects.map((p) => (
                    <div
                      key={p.id}
                      className="admin-project-row admin-project-row--archived"
                    >
                      <div className="admin-project-info">
                        <span
                          className={`column-dot column-dot--${p.category === 'billable' ? 'billable' : 'nonbillable'}`}
                        />
                        <span className="admin-project-name">{p.name}</span>
                      </div>
                      <button
                        className="admin-restore-btn"
                        onClick={() => handleToggleArchive(p)}
                        title="Restore project"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="admin-content">
            <div className="admin-assign-header">
              <select
                className="admin-select"
                value={selectedProject ?? ''}
                onChange={(e) => setSelectedProject(e.target.value || null)}
              >
                <option value="">Select a project...</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && selectedProjectData ? (
              <div className="admin-user-list">
                <div className="admin-section-label">
                  {selectedProjectData.name} — Assign Users
                </div>
                {users.map((u) => (
                  <label key={u.id} className="admin-user-row">
                    <input
                      type="checkbox"
                      checked={isAssigned(u.id, selectedProject)}
                      onChange={() =>
                        handleToggleAssignment(u.id, selectedProject)
                      }
                      className="admin-checkbox"
                    />
                    <span className="admin-user-info">
                      <span className="admin-user-name">
                        {u.full_name || u.email.split('@')[0]}
                      </span>
                      <span className="admin-user-email">{u.email}</span>
                    </span>
                    {u.is_admin && (
                      <span className="admin-badge">Admin</span>
                    )}
                  </label>
                ))}
                {users.length === 0 && (
                  <p className="admin-empty">
                    No users have signed in yet. They'll appear here after their
                    first login.
                  </p>
                )}
              </div>
            ) : (
              <div className="admin-empty">
                Select a project above to manage user assignments.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
