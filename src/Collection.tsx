import { useEffect, useState } from "react";
import { ArrowDown, Bookmark, Check, Download, Sparkles } from "lucide-react";
import type { Artwork } from "../shared/protocol";
import { AsciiCanvas } from "./AsciiCanvas";
import { LittleHeld } from "./Creature";
function initialSaved(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("held-keepsakes") || "[]",
    );
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string").slice(-100)
      : [];
  } catch {
    return [];
  }
}
export function ArtCard({
  art,
  small = false,
}: {
  art: Artwork;
  small?: boolean;
}) {
  const [saved, setSaved] = useState(() => initialSaved().includes(art.id));
  function keep() {
    const previous = initialSaved();
    const next = saved
      ? previous.filter((id) => id !== art.id)
      : [...previous, art.id].slice(-100);
    try {
      localStorage.setItem("held-keepsakes", JSON.stringify(next));
    } catch {
      /* private mode */
    }
    setSaved(!saved);
  }
  function download() {
    const blob = new Blob(
      [
        `${art.title}\n\n${art.text}\n\nMade in Held Alive · ${new Date(art.at).toISOString()}\n${art.source === "browser" ? "Browser-powered" : "preview server"} · heldalive.com\n`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `held-alive-${art.id.slice(0, 8)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <article className={`art-card ${small ? "small" : ""}`}>
      <div className="art-paper">
        <span className="art-corner">#{art.id.slice(0, 4).toUpperCase()}</span>
        <AsciiCanvas text={art.text} label={`ASCII artwork: ${art.title}`} />
        <span className="art-signature">made from borrowed time</span>
      </div>
      <div className="art-card-caption">
        <div>
          <h3>{art.title}</h3>
          <p>
            {new Date(art.at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}{" "}
            ·{" "}
            {art.source === "browser"
              ? "made across browsers"
              : "made on the preview server"}
          </p>
        </div>
        <div className="art-actions">
          <button
            className="icon-button"
            aria-label={saved ? "Remove keepsake" : "Keep this drawing"}
            aria-pressed={saved}
            onClick={keep}
          >
            {saved ? <Check size={17} /> : <Bookmark size={17} />}
          </button>
          <button
            className="icon-button"
            onClick={download}
            aria-label="Download drawing"
          >
            <Download size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function Collection({ room, count }: { room: string; count: number }) {
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  async function load(offset = 0) {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/artworks?room=${room}&offset=${offset}`);
      if (!r.ok) throw new Error();
      const data = (await r.json()) as { artworks: Artwork[] };
      setItems((old) =>
        offset
          ? [
              ...old,
              ...data.artworks.filter((a) => !old.some((b) => b.id === a.id)),
            ]
          : data.artworks,
      );
      setHasMore(data.artworks.length === 24);
    } catch {
      setError("The cabinet is out of reach. Try opening it again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [room, count]);
  return (
    <div className="inner-page">
      <div className="page-kicker">
        <Sparkles size={15} /> THE CABINET OF LITTLE THINGS
      </div>
      <h1>
        Look what
        <br />
        <em>we helped it make.</em>
      </h1>
      <p className="page-intro">
        Unpolished, sometimes a little strange. Drawings made by the model and
        its helpers, during borrowed time. Keep a favorite or take one home.
      </p>
      <div className="collection-meta">
        <span>
          {count} {count === 1 ? "little creation" : "little creations"}
        </span>
        <span>Bookmarks stay in this browser · downloads are yours</span>
      </div>
      {error && <p role="alert">{error}</p>}
      {items.length ? (
        <div className="art-grid">
          {items.map((art) => (
            <ArtCard key={art.id} art={art} />
          ))}
        </div>
      ) : (
        <div className="empty-cabinet">
          <LittleHeld />
          <h2>
            {loading
              ? "Opening the cabinet…"
              : "The first page is still blank."}
          </h2>
          <p>
            A drawing will appear here when the model finishes its first ASCII
            sketch.
          </p>
          <a className="text-link" href="#habitat">
            Back to the little one <ArrowDown size={14} />
          </a>
        </div>
      )}
      {hasMore && items.length > 0 && (
        <button
          className="button outline load-more"
          disabled={loading}
          onClick={() => void load(items.length)}
        >
          {loading ? "Opening another drawer…" : "Open another drawer"}{" "}
          <ArrowDown size={15} />
        </button>
      )}
    </div>
  );
}
