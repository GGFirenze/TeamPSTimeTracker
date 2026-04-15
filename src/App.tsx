import { createPortal } from 'react-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { TimerProvider } from './context/TimerContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { ActiveTimer } from './components/ActiveTimer';
import { ProjectGrid } from './components/ProjectGrid';
import { NotesModal } from './components/NotesModal';
import { TimeLog } from './components/TimeLog';
import { FloatingWidget } from './components/FloatingWidget';
import { usePictureInPicture } from './hooks/usePictureInPicture';

function AuthenticatedApp() {
  const { pipWindow, isOpen, openPiP, closePiP, isSupported } =
    usePictureInPicture();

  return (
    <ProjectProvider>
      <TimerProvider>
        <div className="app">
          <Header
            pipSupported={isSupported}
            pipOpen={isOpen}
            onTogglePiP={isOpen ? closePiP : openPiP}
          />
          <ActiveTimer />
          <main className="main">
            <ProjectGrid />
            <TimeLog />
          </main>
          <NotesModal />
        </div>
        {pipWindow &&
          createPortal(
            <>
              <FloatingWidget />
              <NotesModal />
            </>,
            pipWindow.document.body
          )}
      </TimerProvider>
    </ProjectProvider>
  );
}

function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <span className="loading-icon">&#9201;</span>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
