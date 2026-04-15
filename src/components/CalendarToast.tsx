import type { CalendarNotification } from '../hooks/useCalendarSync';

interface CalendarToastProps {
  notification: CalendarNotification;
  onDismiss: () => void;
}

export function CalendarToast({ notification, onDismiss }: CalendarToastProps) {
  return (
    <div className={`cal-toast cal-toast--${notification.type}`} onClick={onDismiss}>
      <span className="cal-toast-icon">
        {notification.type === 'start' ? '\u25B6' : '\u23F9'}
      </span>
      <span className="cal-toast-message">{notification.message}</span>
      <button className="cal-toast-close" onClick={onDismiss}>&times;</button>
    </div>
  );
}
