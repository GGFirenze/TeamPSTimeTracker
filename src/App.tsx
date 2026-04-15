import { createPortal } from 'react-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProjectContext } from './context/ProjectContext';
import { TimerProvider, useTimerContext } from './context/TimerContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { ActiveTimer } from './components/ActiveTimer';
import { ProjectGrid } from './components/ProjectGrid';
import { NotesModal } from './components/NotesModal';
import { IdleWarningModal } from './components/IdleWarningModal';
import { CalendarSidebar } from './components/CalendarSidebar';
import { CalendarMatchPrompt } from './components/CalendarMatchPrompt';
import { CalendarToast } from './components/CalendarToast';
import { TimeLog } from './components/TimeLog';
import { FloatingWidget } from './components/FloatingWidget';
import { usePictureInPicture } from './hooks/usePictureInPicture';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useCalendarSync } from './hooks/useCalendarSync';

function IdleTimeoutManager({ pipWindow }: { pipWindow: Window | null }) {
  const { currentEntry, idleStop } = useTimerContext();
  const isTimerActive = currentEntry?.status === 'active';

  const { isWarning, warningSecondsLeft, dismissWarning } = useIdleTimeout(
    isTimerActive,
    idleStop
  );

  if (!isWarning) return null;

  return (
    <>
      <IdleWarningModal secondsLeft={warningSecondsLeft} onDismiss={dismissWarning} />
      {pipWindow &&
        createPortal(
          <IdleWarningModal secondsLeft={warningSecondsLeft} onDismiss={dismissWarning} />,
          pipWindow.document.body
        )}
    </>
  );
}

function CalendarManager() {
  const { googleToken, user, signInWithGoogle } = useAuth();
  const { projects } = useProjectContext();
  const { currentEntry, startTimer, requestStop } = useTimerContext();

  const calSync = useCalendarSync(
    googleToken,
    user?.id ?? null,
    projects,
    currentEntry?.projectId ?? null,
    startTimer,
    requestStop
  );

  if (!googleToken && !calSync.tokenExpired) return null;

  return (
    <>
      <CalendarSidebar
        events={calSync.events}
        projects={projects}
        isLoading={calSync.isLoading}
        tokenExpired={calSync.tokenExpired}
        onReconnect={signInWithGoogle}
        onLinkEvent={(_eventId, keyword, projectId) =>
          calSync.linkEventToProject(keyword, projectId)
        }
        onRefresh={calSync.refresh}
      />
      {calSync.pendingPrompt && (
        <CalendarMatchPrompt
          event={calSync.pendingPrompt}
          projects={projects}
          onLink={calSync.linkEventToProject}
          onDismiss={calSync.dismissPrompt}
        />
      )}
      {calSync.notification && (
        <CalendarToast
          notification={calSync.notification}
          onDismiss={calSync.dismissNotification}
        />
      )}
    </>
  );
}

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
          <div className="main-with-calendar">
            <main className="main">
              <ProjectGrid />
              <TimeLog />
            </main>
            <CalendarManager />
          </div>
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
        <IdleTimeoutManager pipWindow={pipWindow} />
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
