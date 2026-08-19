'use client';

import { useEffect, useRef, useState } from 'react';
import type { AnalystStreamEvent } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://157.173.121.74:8000/api/v1';

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

/**
 * Subscribes to the analyst SSE feed (GET /analyst/stream).
 *
 * The browser's native EventSource cannot send an Authorization header, and
 * this endpoint requires one, so the stream is read manually with fetch +
 * ReadableStream, parsing "event:"/"data:" frames per the SSE spec and
 * ignoring ": heartbeat" comment lines. Reconnects with backoff on drop.
 */
export function useAnalystStream(onEvent: (evt: AnalystStreamEvent) => void) {
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    let controller: AbortController | null = null;

    async function connect() {
      if (cancelled) return;
      const token = typeof window !== 'undefined' ? localStorage.getItem('matata_token') : null;
      if (!token) {
        setStatus('offline');
        return;
      }

      controller = new AbortController();
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

      try {
        const res = await fetch(`${BASE_URL}/analyst/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`stream error ${res.status}`);

        setStatus('live');
        attempt = 0;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line.
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            if (!frame.trim() || frame.startsWith(':')) continue; // heartbeat / comment
            let eventType = 'message';
            const dataLines: string[] = [];
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim();
              else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
            }
            if (!dataLines.length) continue;
            try {
              const parsed = JSON.parse(dataLines.join('\n'));
              onEventRef.current({ event: eventType, ...parsed } as AnalystStreamEvent);
            } catch {
              // malformed frame — skip
            }
          }
        }
      } catch {
        // fall through to reconnect below
      }

      if (cancelled) return;
      setStatus('reconnecting');
      attempt += 1;
      const backoffMs = Math.min(1000 * 2 ** attempt, 30_000);
      setTimeout(connect, backoffMs);
    }

    connect();

    return () => {
      cancelled = true;
      controller?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}