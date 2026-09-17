import { useEffect, useRef, useState } from "react";
import { X, ArrowDown, Download } from "lucide-react";
import type { MuralTile } from "../shared/observatory";
export function Mural({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [tiles, setTiles] = useState<MuralTile[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load(offset = 0) {
    setBusy(true);
    try {
      const res = await fetch(`/api/mural?room=browser&offset=${offset}`);
      if (!res.ok) throw Error();
      const d = (await res.json()) as { tiles: MuralTile[]; total: number };
      setTiles((old) => (offset ? [...old, ...d.tiles] : d.tiles));
      setTotal(d.total);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!opener.current && document.activeElement instanceof HTMLElement)
      opener.current = document.activeElement;
    dialog.current?.showModal();
    void load();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
      requestAnimationFrame(() => {
        if (opener.current?.isConnected)
          opener.current.focus({ preventScroll: true });
      });
    };
  }, []);
  function download() {
    const url = URL.createObjectURL(
      new Blob([tiles.map((t) => t.text).join("\n") + "\n"], {
        type: "text/plain",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "held-alive-mural.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <dialog
      ref={dialog}
      className="mural-dialog"
      aria-labelledby="mural-heading"
      onCancel={close}
      onClose={close}
    >
      <header className="mural-toolbar">
        <div>
          <span className="eyebrow">A PLACE THAT KEEPS GROWING</span>
          <h2 id="mural-heading">The unfinished mural.</h2>
        </div>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close mural"
        >
          <X />
        </button>
      </header>
      <div className="mural-description">
        <p>
          One strange moon, drawn a little further each day. The alien
          alternates between refining its latest section and adding the next.
          Every mark is model output.
        </p>
        <span>
          {total} sections · 72 columns · scroll to explore{" "}
          <ArrowDown size={13} />
        </span>
      </div>
      <div
        className="mural-scroll"
        tabIndex={0}
        aria-label="Scrollable ASCII mural"
      >
        {tiles.length ? (
          <div className="mural-strip">
            {tiles.map((tile) => (
              <figure key={tile.id}>
                <pre aria-label={tile.title}>{tile.text}</pre>
                <figcaption>
                  SECTION {String(tile.index + 1).padStart(3, "0")} · revision{" "}
                  {tile.revision} · {tile.model}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mural-empty">
            {error
              ? "The mural could not be loaded."
              : "A blank moon. The first section has not arrived yet."}
          </p>
        )}
      </div>
      <footer className="mural-footer">
        {error && (
          <button className="button" onClick={() => void load(tiles.length)}>
            Try again
          </button>
        )}
        {tiles.length < total && (
          <button
            className="button"
            disabled={busy}
            onClick={() => void load(tiles.length)}
          >
            {busy ? "Loading…" : "Further down the mural"}{" "}
            <ArrowDown size={15} />
          </button>
        )}
        {tiles.length > 0 && (
          <button className="text-button" onClick={download}>
            <Download size={14} /> Save loaded sections as text
          </button>
        )}
        <a href="#research" onClick={close}>
          Read the artist’s notes ↗
        </a>
      </footer>
    </dialog>
  );
}
