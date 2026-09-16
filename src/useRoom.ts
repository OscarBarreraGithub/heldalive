import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AuditJob,
  Job,
  Profile,
  ServerEvent,
  Snapshot,
} from "../shared/protocol";
export function useRoom(
  room: string,
  onJob: (job: Job) => void,
  onCancel: () => void,
  onAudit: (job: AuditJob) => void,
  onPipeline: (event: any) => void,
) {
  const [state, setState] = useState<Snapshot | null>(null);
  const [profile, setProfile] = useState<Profile>({
    days: 0,
    today: false,
    choice: null,
    completedJobs: 0,
    checks: 0,
  });
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef({ onJob, onCancel, onAudit, onPipeline });
  handlers.current = { onJob, onCancel, onAudit, onPipeline };
  const send = useCallback((event: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(event));
  }, []);
  useEffect(() => {
    let disposed = false;
    let reconnect: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let delay = 1000;
    async function connect() {
      try {
        const response = await fetch("/api/identity", {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error();
      } catch {
        if (!disposed) {
          setNotice("The habitat is temporarily out of reach. Retrying…");
          reconnect = setTimeout(
            () => void connect(),
            Math.min((delay *= 2), 15000),
          );
        }
        return;
      }
      if (disposed) return;
      const url = new URL("/api/socket", window.location.href);
      url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("room", room);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        if (disposed) {
          ws.close();
          return;
        }
        setConnected(true);
        setNotice("");
        delay = 1000;
        send({ type: "ping", visible: !document.hidden });
        heartbeat = setInterval(
          () => send({ type: "ping", visible: !document.hidden }),
          15000,
        );
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerEvent;
          if (data.type.startsWith("pipeline_"))
            handlers.current.onPipeline(data);
          if (data.type === "state" && data.version === 2) setState(data);
          if (data.type === "profile") setProfile(data.profile);
          if (data.type === "job") handlers.current.onJob(data.job);
          if (data.type === "cancel") handlers.current.onCancel();
          if (data.type === "audit") handlers.current.onAudit(data.job);
          if (data.type === "error") setNotice(data.message);
        } catch {
          setNotice(
            "The connection stumbled. Reconnecting restores the habitat.",
          );
        }
      };
      ws.onclose = () => {
        clearInterval(heartbeat);
        setConnected(false);
        handlers.current.onCancel();
        if (!disposed) {
          reconnect = setTimeout(() => void connect(), delay);
          delay = Math.min(delay * 2, 15000);
        }
      };
      ws.onerror = () => ws.close();
    }
    const visibility = () => send({ type: "ping", visible: !document.hidden });
    document.addEventListener("visibilitychange", visibility);
    void connect();
    return () => {
      disposed = true;
      clearTimeout(reconnect);
      clearInterval(heartbeat);
      wsRef.current?.close();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [room, send]);
  return { state, profile, connected, notice, send };
}
