import { useState, useEffect, useRef } from 'react';

export function useElapsedTime(
  startTime: number | null,
  pausedAt: number | null,
  totalPausedMs: number
): number {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime && !pausedAt) {
      setNow(Date.now());
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [startTime, pausedAt]);

  if (!startTime) return 0;

  const effectiveNow = pausedAt ?? now;
  const elapsedMs = effectiveNow - startTime - totalPausedMs;
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatTimeCompact(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function useDocumentTitle(title: string) {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;
    return () => {
      document.title = defaultTitle.current;
    };
  }, [title]);
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

