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
  const { user, accessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }
    if (!accessToken) {
      console.info('Waiting for access token before loading projects...');
      return;
    }
    setIsLoading(true);

    const MAX_RETRIES = 2;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const data = await fetchUserProjects(user.id, accessToken);
        setProjects(data);
        setIsLoading(false);
        return;
      } catch (err) {
        lastErr = err;
        console.warn(`Project load attempt ${attempt + 1} failed:`, err);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    console.error('All project load attempts failed:', lastErr);
    setIsLoading(false);
  }, [user, accessToken]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadProjects();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadProjects, user]);

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
