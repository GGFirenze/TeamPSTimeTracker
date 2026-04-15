import { useState } from 'react';
import { ProjectCategory } from '../types';

interface AddProjectFormProps {
  defaultCategory: ProjectCategory;
  onAdd: (name: string, category: ProjectCategory) => void;
  onCancel: () => void;
}

export function AddProjectForm({ defaultCategory, onAdd, onCancel }: AddProjectFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>(defaultCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setName('');
  };

  return (
    <form className="add-project-form" onSubmit={handleSubmit}>
      <input
        className="add-project-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name..."
        autoFocus
      />
      <div className="add-project-toggle">
        <button
          type="button"
          className={`toggle-btn ${category === 'billable' ? 'toggle-btn--active toggle-btn--billable' : ''}`}
          onClick={() => setCategory('billable')}
        >
          Billable
        </button>
        <button
          type="button"
          className={`toggle-btn ${category === 'non-billable' ? 'toggle-btn--active toggle-btn--nonbillable' : ''}`}
          onClick={() => setCategory('non-billable')}
        >
          Non-Billable
        </button>
      </div>
      <div className="add-project-actions">
        <button type="button" className="add-project-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="add-project-submit"
          disabled={!name.trim()}
        >
          Add
        </button>
      </div>
    </form>
  );
}
