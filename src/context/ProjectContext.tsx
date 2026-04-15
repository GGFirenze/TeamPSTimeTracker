import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Project } from '../types';
import { useAuth } from './AuthContext';
import { fetchUserProjects } from '../lib/data';

interface ProjectContextValue {
  projects: Project[];
  billableProjects: Project[];
  nonBillableProjects: Project[];
  getProject: (id: string) => Project | undefined;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
  return ctx;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchUserProjects(user.id);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const billableProjects = projects.filter((p) => p.category === 'billable');
  const nonBillableProjects = projects.filter((p) => p.category === 'non-billable');

  const getProject = useCallback(
    (id: string): Project | undefined => {
      return projects.find((p) => p.id === id);
    },
    [projects]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        billableProjects,
        nonBillableProjects,
        getProject,
        refreshProjects: loadProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
