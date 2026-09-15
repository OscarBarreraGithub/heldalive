import { useCallback, useEffect, useRef, useState } from 'react';
import type { Job, ServerEvent, Snapshot } from '../shared/protocol';

export function useRoom(room: string, onJob: (job: Job) => void, onCancel: () => void) {
  const [state, setState] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [accepted, setAccepted] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef({ onJob, onCancel });
  handlers.current = { onJob, onCancel };
  const send = useCallback((event: unknown) => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(event)); }, []);
  useEffect(() => {
    let disposed = false;
    let reconnect: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let delay = 1000;
    function connect() {
      const url = new URL('/api/socket', window.location.href);
      url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url.searchParams.set('room', room);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        if (disposed) { ws.close(); return; }
        setConnected(true); setNotice(''); delay = 1000;
        send({ type: 'ping', visible: !document.hidden });
        heartbeat = setInterval(() => send({ type: 'ping', visible: !document.hidden }), 15_000);
      };
      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data) as ServerEvent;
          if (data.type === 'state') setState(data);
          if (data.type === 'job') handlers.current.onJob(data.job);
          if (data.type === 'cancel') handlers.current.onCancel();
          if (data.type === 'error') setNotice(data.message);
          if (data.type === 'accepted') { setAccepted(Date.now()); setNotice('Your note is in the room. It may shape the next thought.'); }
        } catch { setNotice('The connection stumbled. Reconnecting will restore the room.'); }
      };
      ws.onclose = () => {
        clearInterval(heartbeat); setConnected(false); handlers.current.onCancel();
        if (!disposed) { reconnect = setTimeout(connect, delay); delay = Math.min(delay * 2, 15_000); }
      };
      ws.onerror = () => ws.close();
    }
    const visibility = () => send({ type: 'ping', visible: !document.hidden });
    document.addEventListener('visibilitychange', visibility);
    connect();
    return () => { disposed = true; clearTimeout(reconnect); clearInterval(heartbeat); wsRef.current?.close(); document.removeEventListener('visibilitychange', visibility); };
  }, [room, send]);
  return { state, connected, notice, accepted, send };
}
