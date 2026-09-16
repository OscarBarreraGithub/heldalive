"""Private Mac launch support. Bounded jobs in, token events out; no public listener."""
import contextlib
import json
import math
import queue
import random
import re
import sys
import threading
from pathlib import Path
_spec = Path(__file__).with_name("ascii-spec.json")
if not _spec.exists(): _spec = Path(__file__).resolve().parent.parent / "shared/ascii-spec.json"
ART_SPEC = json.loads(_spec.read_text())

import mlx.core as mx
from mlx_lm import load, stream_generate


def emit(**event):
    print(json.dumps(event, ensure_ascii=False), flush=True)


class Grammar:
    """Same bounded plan/recall syntax as the browser, preserving model choices."""
    def __init__(self, tokenizer, kind):
        self.tok = tokenizer
        self.kind = kind
        self.parts = []
        self.index = 0
        self.history = []
        self.art = ""
        self.brushes = []
        if kind == "art":
            glyphs = set(ART_SPEC["glyphs"])
            for token in range(ART_SPEC["vocabularySize"]):
                text = tokenizer.decode([token])
                if text and all(c in glyphs for c in text): self.brushes.append((token, text))
            if len(self.brushes) + 1 > ART_SPEC["maxCandidates"] or not any(text == "\n" for _, text in self.brushes): raise ValueError("Unsupported drawing vocabulary")
        def fixed(s): return ["fixed", tokenizer.encode(s, add_special_tokens=False)]
        def choice(words): return ["choice", [tokenizer.encode(s, add_special_tokens=False) for s in words]]
        if kind == "plan":
            self.parts = [fixed('{"project":"'), choice(["art", "memory", "wander"]), fixed('","focus":"'), ["focus", [0, 0]], fixed('","helpers":'), choice(list("12345678")), fixed("}")]
        elif kind == "recall":
            words = ["button", "acorn", "ribbon", "marble", "feather", "pebble", "thimble", "shell", "bell", "key", "leaf", "coin", "unknown"]
            self.parts = [fixed('{"answers":["'), choice(words), fixed('","'), choice(words), fixed('","'), choice(words), fixed('"]}')]

    def allowed(self):
        if self.kind == "art":
            if len(self.history) >= ART_SPEC["maxTokens"] - 1: return [2]
            values = []
            for token, text in self.brushes:
                lines = (self.art + text).split("\n")
                if len(lines) <= ART_SPEC["rows"] and all(len(line) <= ART_SPEC["columns"] for line in lines): values.append(token)
            if len([l for l in self.art.split("\n") if l.strip()]) >= 4 and len(re.sub(r"\s", "", self.art)) >= 12: values.append(2)
            return values or [2]
        if self.index >= len(self.parts): return None
        kind, data = self.parts[self.index]
        if kind == "fixed": return [data[0]]
        if kind == "choice": return list(dict.fromkeys(ids[0] for ids in data))
        if data[0] >= 24 or data[1] >= 80:
            self.index += 1
            return self.allowed()
        return None

    def consume(self, token):
        self.history.append(token)
        if self.kind == "art":
            self.art += self.tok.decode([token])
            return
        if self.index >= len(self.parts): return
        kind, data = self.parts[self.index]
        if kind == "fixed":
            if token != data.pop(0): raise ValueError("Grammar mismatch")
            if not data: self.index += 1
        elif kind == "choice":
            values = [ids[1:] for ids in data if ids[0] == token]
            if not values: raise ValueError("Invalid model choice")
            self.parts[self.index][1] = values
            if any(not ids for ids in values): self.index += 1
        else:
            data[0] += 1
            data[1] += len(self.tok.decode([token]))

    def sample(self, scores, temperature, cancel):
        if cancel.is_set(): raise InterruptedError()
        if self.parts and self.index >= len(self.parts): return mx.array([2])
        allowed = self.allowed()
        ids = allowed if allowed is not None else mx.argsort(scores[0])[-64:][::-1].tolist()
        values = scores[0, mx.array(ids)].tolist()
        pairs = sorted(zip(ids, values), key=lambda pair: pair[1], reverse=True)[:64]
        if self.parts and self.parts[self.index][0] == "focus":
            data = self.parts[self.index][1]
            if data[0] and re.match(r'^\s*["\']', self.tok.decode([pairs[0][0]])):
                self.index += 1
                pairs = [(self.allowed()[0], 0.0)]
            else:
                pairs = [(i, v) for i, v in pairs if re.fullmatch(r'[\x20-\x7e]+', self.tok.decode([i])) and not re.search(r'["\\]', self.tok.decode([i]))]
                if not pairs:
                    self.index += 1
                    pairs = [(self.allowed()[0], 0.0)]
        recent = set(self.history[-40:])
        pairs = sorted([(i, v - (0.65 if i in recent else 0)) for i, v in pairs], key=lambda p: p[1], reverse=True)
        if temperature <= 0:
            token = pairs[0][0]
        else:
            weights = [math.exp((v - pairs[0][1]) / max(0.1, min(1, temperature))) for _, v in pairs]
            token = random.choices([i for i, _ in pairs], weights=weights, k=1)[0]
        self.consume(token)
        return mx.array([token])


def main():
    path = Path(sys.argv[1]).resolve()
    config = json.loads((path / "config.json").read_text())
    if config.get("num_hidden_layers") != 32 or config.get("hidden_size") != 960 or config.get("quantization", {}).get("bits") != 4:
        raise ValueError("Launch support requires the prepared SmolLM2-360M four-bit checkpoint")
    with contextlib.redirect_stdout(sys.stderr): model, tokenizer = load(str(path))
    jobs = queue.Queue(maxsize=1)
    cancellations = {}
    lock = threading.Lock()
    def reader():
        for line in sys.stdin:
            if len(line) > 32768: continue
            try:
                event = json.loads(line)
                if event.get("type") == "cancel":
                    with lock:
                        stop = cancellations.get(event.get("jobId"))
                        if stop: stop.set()
                elif event.get("type") == "job":
                    job = event["job"]
                    stop = threading.Event()
                    with lock: cancellations[job["id"]] = stop
                    jobs.put((job, stop))
            except (ValueError, KeyError, TypeError):
                print("Rejected malformed native job", file=sys.stderr)
        with lock:
            for stop in cancellations.values(): stop.set()
        jobs.put(None)
    threading.Thread(target=reader, daemon=True).start()
    emit(type="ready")
    while True:
        item = jobs.get()
        if item is None: break
        job, cancel = item
        job_id = job["id"]
        try:
            messages = job["messages"]
            if not isinstance(messages, list) or len(messages) > 12: raise ValueError("Invalid messages")
            prompt = "".join(f'<|im_start|>{m["role"]}\n{m["content"]}<|im_end|>\n' for m in messages) + "<|im_start|>assistant\n"
            ids = tokenizer.encode(prompt, add_special_tokens=False)
            limit = max(1, min(512, int(job.get("maxTokens", 110))))
            if len(ids) + limit > 1024: raise ValueError("Thought exceeds model context")
            grammar = Grammar(tokenizer, job.get("kind"))
            sampler = lambda scores: grammar.sample(scores, float(job.get("temperature", 0.8)), cancel)
            tokens = 0
            for response in stream_generate(model, tokenizer, ids, max_tokens=limit, sampler=sampler, prefill_step_size=128):
                if cancel.is_set(): raise InterruptedError()
                if response.text: emit(type="chunk", jobId=job_id, text=response.text)
                tokens = response.generation_tokens
            emit(type="done", jobId=job_id, tokens=tokens)
        except InterruptedError:
            emit(type="cancelled", jobId=job_id)
        except Exception as error:
            print(f"Native job failed: {type(error).__name__}: {error}", file=sys.stderr)
            emit(type="failed", jobId=job_id)
        finally:
            with lock: cancellations.pop(job_id, None)
            mx.clear_cache()


if __name__ == "__main__":
    main()
