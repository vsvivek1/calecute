"""Turns content/paper*.json into SQL that loads the cards.

Usage: python3 scripts/build-seed.py [max_bytes_per_chunk]
Writes supabase/seed/cards-NN.sql; run each file in the USS project's SQL
editor (or psql). Loading is an upsert, so re-running after editing content
updates cards in place without touching anyone's progress.
"""
import json, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 24000
cards = []
for paper in range(1, 5):
    for i, c in enumerate(json.loads((root / f"content/paper{paper}.json").read_text())):
        c = dict(c, order=paper * 1000 + i)
        cards.append(c)

out = root / "supabase/seed"
out.mkdir(parents=True, exist_ok=True)
for old in out.glob("cards-*.sql"):
    old.unlink()

chunks, cur, size = [], [], 0
for c in cards:
    s = json.dumps(c, ensure_ascii=False, separators=(",", ":"))
    assert "$cards$" not in s
    if cur and size + len(s.encode()) > limit:
        chunks.append(cur); cur, size = [], 0
    cur.append(s); size += len(s.encode())
chunks.append(cur)
for n, chunk in enumerate(chunks, 1):
    (out / f"cards-{n:02d}.sql").write_text(
        "select energy_manager.load_cards($cards$[\n" + ",\n".join(chunk) + "\n]$cards$::jsonb);\n")
print(f"{len(cards)} cards in {len(chunks)} files")
