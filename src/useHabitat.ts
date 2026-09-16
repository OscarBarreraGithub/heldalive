import { useCallback, useEffect, useRef, useState } from "react";
import { sampleToken } from "../shared/pipeline";
import type { AuditJob, Job } from "../shared/protocol";
import type { BrowserCompute } from "./browserCompute";
import { useRoom } from "./useRoom";
export const BOOST_MS = 10 * 60 * 1000;
function get(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function put(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
export function boostDeadline(value: string | null, now: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > now && n <= now + BOOST_MS ? n : 0;
}
export function useHabitat(room: string, studio: boolean) {
  const dataSaver = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData,
  );
  const [enabled, setEnabled] = useState(() =>
    get("held-participation")
      ? get("held-participation") === "auto"
      : get("held-checks") !== "off" && !dataSaver,
  );
  const [boostUntil, setBoostUntil] = useState(() =>
    boostDeadline(
      get("held-boost-until") || get("held-coffee-until"),
      Date.now(),
    ),
  );
  const [boostDuty, setBoostDuty] = useState<0.1 | 0.2>(() =>
    get("held-boost-duty") === "0.2" ? 0.2 : 0.1,
  );
  const [now, setNow] = useState(Date.now);
  const [visible, setVisible] = useState(!document.hidden);
  const [status, setStatus] = useState<
    "off" | "loading" | "ready" | "error" | "unsupported"
  >("off");
  const [progress, setProgress] = useState(0);
  const [pieceLabel, setPieceLabel] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [usage, setUsage] = useState({
    layers: 0,
    modelBytes: 0,
    computeMs: 0,
    passes: 0,
  });
  const compute = useRef<BrowserCompute | null>(null);
  const checkWorker = useRef<Worker | null>(null);
  const sendRef = useRef<(event: unknown) => void>(() => {});
  const enabledRef = useRef(enabled && !studio);
  enabledRef.current = enabled && !studio;
  const boosted = enabled && boostUntil > now;
  const duty = boosted ? boostDuty : 0.05;
  const onJob = useCallback((job: Job) => {
    if (!compute.current || document.hidden) {
      sendRef.current({ type: "failed", jobId: job.id });
      return;
    }
    void compute.current.run(job, (event) => sendRef.current(event));
  }, []);
  const onCancel = useCallback(() => compute.current?.pause(), []);
  const onAudit = useCallback((job: AuditJob) => {
    if (!enabledRef.current || document.hidden) return;
    if (!checkWorker.current) {
      const worker = new Worker(new URL("./check.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event) => {
        if (enabledRef.current && !document.hidden) sendRef.current(event.data);
      };
      checkWorker.current = worker;
    }
    checkWorker.current.postMessage(job);
  }, []);
  const habitat = useRoom(room, onJob, onCancel, onAudit, (event) => {
    if (event.type === "pipeline_tiny") {
      if (!enabledRef.current || document.hidden) return;
      try {
        sendRef.current({
          type: "pipeline_sampled",
          rid: event.rid,
          token: sampleToken(
            event.top,
            event.temperature,
            event.random,
            event.history,
          ),
        });
      } catch {}
    } else void compute.current?.accept(event);
  });
  sendRef.current = habitat.send;
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      checkWorker.current?.terminate();
      checkWorker.current = null;
    };
  }, []);
  useEffect(() => {
    if (habitat.connected)
      habitat.send({ type: "checks", enabled: enabled && !studio && visible });
    if (!enabled || !visible) {
      checkWorker.current?.terminate();
      checkWorker.current = null;
    }
  }, [habitat.connected, habitat.send, enabled, visible, studio]);
  useEffect(() => {
    if (studio || !enabled || !visible || !habitat.connected) {
      setStatus("off");
      setUsage((u) => ({ ...u, layers: 0, modelBytes: 0 }));
      return;
    }
    let disposed = false;
    let provider: BrowserCompute | null = null;
    setStatus("loading");
    setUsage((u) => ({ ...u, layers: 0, modelBytes: 0 }));
    setProgress(0);
    setError("");
    if (!navigator.gpu) {
      setStatus("unsupported");
      setError(
        "This browser can do tiny CPU tasks, but cannot hold model layers. WebGPU is needed for those.",
      );
      return;
    }
    void import("./browserCompute")
      .then(async ({ BrowserCompute }) => {
        if (disposed) return;
        provider = new BrowserCompute();
        compute.current = provider;
        await provider.load(
          (p, label) => {
            if (disposed) return;
            if (p < 0) {
              setUsage((u) => ({ ...u, layers: 0, modelBytes: 0 }));
              setStatus("error");
              setError(label);
              return;
            }
            setProgress(p);
            setPieceLabel(label);
            setStatus(
              p === 1 && label.startsWith("Holding layers")
                ? "ready"
                : "loading",
            );
          },
          habitat.send,
          duty,
          (event) => {
            if (disposed) return;
            setUsage((u) =>
              event.type === "loaded"
                ? { ...u, layers: event.layers, modelBytes: event.modelBytes }
                : {
                    ...u,
                    computeMs: u.computeMs + event.computeMs,
                    passes: u.passes + 1,
                  },
            );
          },
        );
      })
      .catch((e) => {
        if (disposed) return;
        provider?.stop();
        if (compute.current === provider) compute.current = null;
        setUsage((u) => ({ ...u, layers: 0, modelBytes: 0 }));
        setStatus("error");
        setError(
          e instanceof Error
            ? e.message
            : "This device could not load its piece. You can keep watching.",
        );
      });
    return () => {
      disposed = true;
      provider?.stop();
      if (compute.current === provider) compute.current = null;
    };
  }, [studio, enabled, visible, habitat.connected, habitat.send, duty, retry]);
  useEffect(() => {
    if (boostUntil && boostUntil <= now) {
      setBoostUntil(0);
      put("held-boost-until", "0");
      put("held-coffee-until", "0");
    }
  }, [boostUntil, now]);
  const pause = () => {
    // Stop immediately, before React runs effect cleanup.
    enabledRef.current = false;
    compute.current?.stop();
    checkWorker.current?.terminate();
    checkWorker.current = null;
    habitat.send({ type: "checks", enabled: false });
    setEnabled(false);
    setBoostUntil(0);
    setStatus("off");
    put("held-participation", "watch");
    put("held-boost-until", "0");
    put("held-coffee-until", "0");
  };
  const resume = () => {
    setEnabled(true);
    setRetry((n) => n + 1);
    put("held-participation", "auto");
  };
  const boost = (level: 0.1 | 0.2) => {
    if (boosted && duty === level) return;
    setBoostDuty(level);
    put("held-boost-duty", String(level));
    const until = Date.now() + BOOST_MS;
    setStatus("loading");
    setNow(Date.now());
    setBoostUntil(until);
    setEnabled(true);
    put("held-boost-until", String(until));
    put("held-participation", "auto");
  };
  const gentle = () => {
    if (enabled && duty === 0.05 && status === "ready") return;
    setEnabled(true);
    put("held-participation", "auto");
    setStatus("loading");
    setBoostUntil(0);
    put("held-boost-until", "0");
    put("held-coffee-until", "0");
  };
  return {
    ...habitat,
    enabled,
    visible,
    status,
    progress,
    pieceLabel,
    error,
    dataSaver,
    boosted,
    duty,
    usage,
    boostSeconds: Math.max(0, Math.ceil((boostUntil - now) / 1000)),
    pause,
    resume,
    boost,
    gentle,
  };
}
