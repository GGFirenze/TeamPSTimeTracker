import { useState, useEffect, useCallback } from 'react';
import { fetchAllProjects, assignProjectToUser, unassignProjectFromUser } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import { useProjectContext } from '../context/ProjectContext';
import type { ProjectCategory } from '../types';

interface AvailableProject {
  id: string;
  name: string;
  category: ProjectCategory;
  archived: boolean;
}

export function BrowseProjectsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { projects: myProjects, refreshProjects } = useProjectContext();
  const [allProjects, setAllProjects] = useState<AvailableProject[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllProjects();
      setAllProjects(data.filter((p) => !p.archived));
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const myProjectIds = new Set(myProjects.map((p) => p.id));

  const filtered = allProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (projectId: string) => {
    if (!user) return;
    try {
      if (myProjectIds.has(projectId)) {
        await unassignProjectFromUser(user.id, projectId);
      } else {
        await assignProjectToUser(user.id, projectId);
      }
      await refreshProjects();
      await loadProjects();
    } catch (err) {
      console.error('Failed to toggle project:', err);
    }
  };

  const billable = filtered.filter((p) => p.category === 'billable');
  const nonBillable = filtered.filter((p) => p.category === 'non-billable');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Browse Projects</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="browse-search">
          <input
            className="admin-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            autoFocus
          />
        </div>

        {isLoading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <div className="admin-content browse-content">
            <p className="browse-hint">
              Toggle projects to add or remove them from your tracker.
            </p>

            {billable.length > 0 && (
              <>
                <div className="admin-section-label">
                  <span className="column-dot column-dot--billable" /> Billable ({billable.length})
                </div>
                {billable.map((p) => (
                  <label key={p.id} className="admin-user-row">
                    <input
                      type="checkbox"
                      checked={myProjectIds.has(p.id)}
                      onChange={() => handleToggle(p.id)}
                      className="admin-checkbox"
                    />
                    <span className="admin-user-info">
                      <span className="admin-user-name">{p.name}</span>
                    </span>
                  </label>
                ))}
              </>
            )}

            {nonBillable.length > 0 && (
              <>
                <div className="admin-section-label" style={{ marginTop: '0.75rem' }}>
                  <span className="column-dot column-dot--nonbillable" /> Non-Billable ({nonBillable.length})
                </div>
                {nonBillable.map((p) => (
                  <label key={p.id} className="admin-user-row">
                    <input
                      type="checkbox"
                      checked={myProjectIds.has(p.id)}
                      onChange={() => handleToggle(p.id)}
                      className="admin-checkbox"
                    />
                    <span className="admin-user-info">
                      <span className="admin-user-name">{p.name}</span>
                    </span>
                  </label>
                ))}
              </>
            )}

            {filtered.length === 0 && (
              <p className="admin-empty">
                {search ? 'No projects match your search.' : 'No projects available.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
