import { useState, useEffect, useCallback, useMemo } from 'react';
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

type Tab = 'projects' | 'assign' | 'users';

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('billable');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

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

  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);
  const archivedProjects = useMemo(() => projects.filter((p) => p.archived), [projects]);
  const selectedProjectData = projects.find((p) => p.id === selectedProject);
  const selectedUserData = users.find((u) => u.id === selectedUser);

  const isAssigned = (userId: string, projectId: string) =>
    assignments.some((a) => a.user_id === userId && a.project_id === projectId);

  const assignmentCount = (projectId: string) =>
    assignments.filter((a) => a.project_id === projectId).length;

  const userProjectCount = (userId: string) =>
    assignments.filter((a) => a.user_id === userId).length;

  // ---- Handlers ----

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
    const exists = isAssigned(userId, projectId);
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

  const handleSelectAll = async (projectId: string) => {
    setIsBusy(true);
    try {
      const unassigned = users.filter((u) => !isAssigned(u.id, projectId));
      await Promise.all(unassigned.map((u) => assignProjectToUser(u.id, projectId)));
      await loadData();
    } catch (err) {
      console.error('Failed to assign all:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeselectAll = async (projectId: string) => {
    setIsBusy(true);
    try {
      const assigned = users.filter((u) => isAssigned(u.id, projectId));
      await Promise.all(assigned.map((u) => unassignProjectFromUser(u.id, projectId)));
      await loadData();
    } catch (err) {
      console.error('Failed to unassign all:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAssignAllToUser = async (userId: string) => {
    setIsBusy(true);
    try {
      const unassigned = activeProjects.filter((p) => !isAssigned(userId, p.id));
      await Promise.all(unassigned.map((p) => assignProjectToUser(userId, p.id)));
      await loadData();
    } catch (err) {
      console.error('Failed to assign all to user:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoveAllFromUser = async (userId: string) => {
    setIsBusy(true);
    try {
      const assigned = activeProjects.filter((p) => isAssigned(userId, p.id));
      await Promise.all(assigned.map((p) => unassignProjectFromUser(userId, p.id)));
      await loadData();
    } catch (err) {
      console.error('Failed to remove all from user:', err);
    } finally {
      setIsBusy(false);
    }
  };

  // ---- Computed for assignment tab ----

  const assignedCount = selectedProject
    ? users.filter((u) => isAssigned(u.id, selectedProject)).length
    : 0;
  const allAssigned = selectedProject ? assignedCount === users.length : false;
  const noneAssigned = assignedCount === 0;

  // ---- Computed for users tab ----

  const userAssignedCount = selectedUser
    ? activeProjects.filter((p) => isAssigned(selectedUser, p.id)).length
    : 0;
  const userAllAssigned = selectedUser ? userAssignedCount === activeProjects.length : false;

  // ---- Render ----

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
          <button
            className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users
          </button>
        </div>

        {isLoading ? (
          <div className="admin-loading">Loading...</div>
        ) : tab === 'projects' ? (
          /* ---- Projects Tab ---- */
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
        ) : tab === 'assign' ? (
          /* ---- Assignments Tab (project-centric) ---- */
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
                    {p.name} ({p.category}) — {assignmentCount(p.id)} users
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && selectedProjectData ? (
              <div className="admin-user-list">
                <div className="admin-section-header">
                  <div className="admin-section-label">
                    {selectedProjectData.name} — {assignedCount}/{users.length} users
                  </div>
                  <div className="admin-bulk-actions">
                    <button
                      className="admin-bulk-btn"
                      onClick={() => handleSelectAll(selectedProject)}
                      disabled={isBusy || allAssigned}
                      title="Assign all users to this project"
                    >
                      Select All
                    </button>
                    <button
                      className="admin-bulk-btn admin-bulk-btn--danger"
                      onClick={() => handleDeselectAll(selectedProject)}
                      disabled={isBusy || noneAssigned}
                      title="Remove all users from this project"
                    >
                      Deselect All
                    </button>
                  </div>
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
                      disabled={isBusy}
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
        ) : (
          /* ---- Users Tab (user-centric) ---- */
          <div className="admin-content">
            <div className="admin-assign-header">
              <select
                className="admin-select"
                value={selectedUser ?? ''}
                onChange={(e) => setSelectedUser(e.target.value || null)}
              >
                <option value="">Select a user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email.split('@')[0]} — {userProjectCount(u.id)} projects
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && selectedUserData ? (
              <div className="admin-user-list">
                <div className="admin-section-header">
                  <div className="admin-section-label">
                    {selectedUserData.full_name || selectedUserData.email.split('@')[0]} — {userAssignedCount}/{activeProjects.length} projects
                  </div>
                  <div className="admin-bulk-actions">
                    <button
                      className="admin-bulk-btn"
                      onClick={() => handleAssignAllToUser(selectedUser)}
                      disabled={isBusy || userAllAssigned}
                      title="Assign all projects to this user"
                    >
                      Assign All
                    </button>
                    <button
                      className="admin-bulk-btn admin-bulk-btn--danger"
                      onClick={() => handleRemoveAllFromUser(selectedUser)}
                      disabled={isBusy || userAssignedCount === 0}
                      title="Remove all projects from this user"
                    >
                      Remove All
                    </button>
                  </div>
                </div>
                {activeProjects.map((p) => (
                  <label key={p.id} className="admin-user-row">
                    <input
                      type="checkbox"
                      checked={isAssigned(selectedUser, p.id)}
                      onChange={() =>
                        handleToggleAssignment(selectedUser, p.id)
                      }
                      className="admin-checkbox"
                      disabled={isBusy}
                    />
                    <span className="admin-user-info">
                      <span className="admin-user-name">{p.name}</span>
                      <span className="admin-user-email">{p.category}</span>
                    </span>
                    <span
                      className={`column-dot column-dot--${p.category === 'billable' ? 'billable' : 'nonbillable'}`}
                    />
                  </label>
                ))}
                {activeProjects.length === 0 && (
                  <p className="admin-empty">No active projects to assign.</p>
                )}
              </div>
            ) : (
              <div className="admin-empty">
                Select a user above to manage their project assignments.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
