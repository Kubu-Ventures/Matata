'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAnalystStream, type StreamStatus } from '@/hooks/useAnalystStream';
import type { AnalystStreamEvent } from '@/lib/types';

const MAX_EVENTS = 30;

interface AnalystStreamContextValue {
  status: StreamStatus;
  events: AnalystStreamEvent[];
  /** Bumps every time a new event arrives — cheap way for pages to know "something changed" without diffing the array. */
  version: number;
  clearEvents: () => void;
}

const AnalystStreamContext = createContext<AnalystStreamContextValue | null>(null);

export function AnalystStreamProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AnalystStreamEvent[]>([]);
  const versionRef = useRef(0);
  const [version, setVersion] = useState(0);

  const handleEvent = useCallback((evt: AnalystStreamEvent) => {
    setEvents(prev => [evt, ...prev].slice(0, MAX_EVENTS));
    versionRef.current += 1;
    setVersion(versionRef.current);
  }, []);

  const status = useAnalystStream(handleEvent);

  const clearEvents = useCallback(() => setEvents([]), []);

  return (
    <AnalystStreamContext.Provider value={{ status, events, version, clearEvents }}>
      {children}
    </AnalystStreamContext.Provider>
  );
}

export function useAnalystStreamContext() {
  const ctx = useContext(AnalystStreamContext);
  if (!ctx) {
    throw new Error('useAnalystStreamContext must be used within AnalystStreamProvider');
  }
  return ctx;
}