import { useEffect, useState } from "react";
import type { ChatMessage, Snapshot } from "../shared/protocol";
type Input = {
  id: string;
  title: string;
  status: string;
  inputWords: number;
  maxOutputTokens: number;
  messages: ChatMessage[];
};
export function InputsPanel({
  room,
  state,
}: {
  room: string;
  state: Snapshot | null;
}) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Input[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const version =
    (state?.agents || []).map((a) => a.id).join(",") + ":" + state?.queueLength;
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setError("");
    setLoading(true);
    void fetch(`/api/inputs?room=${room}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{ tasks: Input[] }>;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setTasks(data.tasks);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("The inputs could not be loaded. Try refreshing.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [open, room, version, refresh]);
  return (
    <details
      className="input-inspector"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Read exactly what the model is given</summary>
      <p>
        Written instructions, a short journal excerpt or an artificial memory
        record. These are the complete inputs for the tasks below. Nothing from
        your personal files or other tabs is included.
      </p>
      <button className="text-button" onClick={() => setRefresh((n) => n + 1)}>
        Refresh inputs
      </button>
      {error && <p role="status">{error}</p>}
      {loading && <p role="status">Loading the current task inputs…</p>}
      {!loading && !error && !tasks.length && (
        <p>
          No task is queued right now. When it can run, Held starts with a short
          instruction to choose a project.
        </p>
      )}
      {!loading &&
        !error &&
        tasks.map((task) => (
          <article key={task.id} className="input-task">
            <h3>{task.title}</h3>
            <p>
              {task.status === "running" ? "Running" : "Waiting for compute"} ·{" "}
              {task.inputWords} input words · at most {task.maxOutputTokens}{" "}
              output tokens
            </p>
            {task.messages.map((message, i) => (
              <details key={i}>
                <summary>
                  {message.role === "system"
                    ? "System instructions"
                    : message.role === "assistant"
                      ? "Example response"
                      : "Task / supplied record"}
                </summary>
                <pre>{message.content}</pre>
              </details>
            ))}
          </article>
        ))}
      <small>
        A token is a fragment of text. Word counts are whitespace-separated
        words; output limits are model tokens. Inputs are refreshed when the
        active task changes.
      </small>
    </details>
  );
}
