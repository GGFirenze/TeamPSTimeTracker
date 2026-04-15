import { useState } from 'react';
import { Project } from '../types';

interface DeleteProjectModalProps {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteProjectModal({ project, onConfirm, onCancel }: DeleteProjectModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const isMatch = confirmName.trim().toLowerCase() === project.name.toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatch) onConfirm();
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--delete" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Project</h2>
          <button className="modal-close" onClick={onCancel}>
            &times;
          </button>
        </div>

        <p className="delete-modal-text">
          Are you sure you want to delete <strong>{project.name}</strong>?
        </p>
        <p className="delete-modal-hint">
          Type <strong>{project.name}</strong> to confirm deletion.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            className="modal-input"
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={project.name}
            autoFocus
          />
          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn--skip"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`modal-btn modal-btn--delete ${isMatch ? '' : 'modal-btn--disabled'}`}
              disabled={!isMatch}
            >
              Delete Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
