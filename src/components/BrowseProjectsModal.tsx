import { useState } from 'react';
import { unassignProjectFromUser } from '../lib/data';
import { useAuth } from '../context/AuthContext';
import { useProjectContext } from '../context/ProjectContext';
import type { Project } from '../types';

interface RemoveConfirmState {
  project: Project;
  typedName: string;
}

export function ManageProjectsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { projects, refreshProjects } = useProjectContext();
  const [confirmState, setConfirmState] = useState<RemoveConfirmState | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const billable = projects.filter((p) => p.category === 'billable');
  const nonBillable = projects.filter((p) => p.category === 'non-billable');

  const handleRemove = async () => {
    if (!user || !confirmState) return;
    if (confirmState.typedName.trim().toLowerCase() !== confirmState.project.name.toLowerCase()) return;
    setIsRemoving(true);
    try {
      await unassignProjectFromUser(user.id, confirmState.project.id);
      setConfirmState(null);
      await refreshProjects();
    } catch (err) {
      console.error('Failed to remove project:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const nameMatches = confirmState
    ? confirmState.typedName.trim().toLowerCase() === confirmState.project.name.toLowerCase()
    : false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Manage Projects</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {confirmState ? (
          <div className="admin-content manage-confirm">
            <p className="manage-confirm-text">
              Remove <strong>{confirmState.project.name}</strong> from your tracker?
            </p>
            <p className="manage-confirm-hint">
              Type <strong>{confirmState.project.name}</strong> to confirm.
            </p>
            <input
              className="admin-input manage-confirm-input"
              value={confirmState.typedName}
              onChange={(e) =>
                setConfirmState({ ...confirmState, typedName: e.target.value })
              }
              placeholder={confirmState.project.name}
              autoFocus
            />
            <div className="manage-confirm-actions">
              <button
                className="manage-confirm-btn manage-confirm-btn--remove"
                onClick={handleRemove}
                disabled={!nameMatches || isRemoving}
              >
                {isRemoving ? 'Removing...' : 'Remove Project'}
              </button>
              <button
                className="manage-confirm-btn manage-confirm-btn--cancel"
                onClick={() => setConfirmState(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-content browse-content">
            <p className="browse-hint">
              Your assigned projects. Remove any you no longer need.
            </p>

            {billable.length > 0 && (
              <>
                <div className="admin-section-label">
                  <span className="column-dot column-dot--billable" /> Billable ({billable.length})
                </div>
                {billable.map((p) => (
                  <div key={p.id} className="manage-project-row">
                    <span className="manage-project-name">{p.name}</span>
                    <button
                      className="manage-remove-btn"
                      onClick={() => setConfirmState({ project: p, typedName: '' })}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}

            {nonBillable.length > 0 && (
              <>
                <div className="admin-section-label" style={{ marginTop: '0.75rem' }}>
                  <span className="column-dot column-dot--nonbillable" /> Non-Billable ({nonBillable.length})
                </div>
                {nonBillable.map((p) => (
                  <div key={p.id} className="manage-project-row">
                    <span className="manage-project-name">{p.name}</span>
                    <button
                      className="manage-remove-btn"
                      onClick={() => setConfirmState({ project: p, typedName: '' })}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}

            {projects.length === 0 && (
              <p className="admin-empty">No projects assigned to you.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
