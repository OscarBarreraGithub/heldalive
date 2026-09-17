import { useEffect, useState } from "react";
import type { Observatory } from "../shared/observatory";
export function useObservatory() {
  const [data, setData] = useState<Observatory | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let dead = false;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch("/api/observatory?room=browser", {
          signal: controller.signal,
        });
        if (!res.ok) throw Error();
        const next = (await res.json()) as Observatory;
        if (!dead) {
          setData(next);
          setFailed(false);
        }
      } catch {
        if (!dead) setFailed(true);
      } finally {
        if (!dead) { setLoading(false); timer = setTimeout(poll, 15000); }
      }
    }
    void poll();
    return () => {
      dead = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  const online =
    !!data?.status && !failed && Date.now() - data.status.updatedAt < 120000;
  return { data, online, failed, loading };
}
