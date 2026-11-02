"""Builds assets/content.json from the course card files.

Run from apps/energy_app:  python3 tool/build_content.py
Source: apps/energy/content/paper1..4.json (cards from the BEE guide books).
Keeps only the fields the app shows, in syllabus order per paper.
"""
import json
import pathlib

SRC = pathlib.Path(__file__).resolve().parents[2] / 'energy' / 'content'
OUT = pathlib.Path(__file__).resolve().parents[1] / 'assets' / 'content.json'
KEEP = ('id', 'paper', 'topic', 'kind', 'front', 'back', 'explain', 'steps', 'flash', 'source')

cards = []
for n in range(1, 5):
    for i, c in enumerate(json.loads((SRC / f'paper{n}.json').read_text())):
        out = {k: c[k] for k in KEEP if c.get(k) not in (None, [], '')}
        out['order'] = i
        cards.append(out)

OUT.write_text(json.dumps({'version': 1, 'cards': cards}, ensure_ascii=False, separators=(',', ':')))
print(f'{len(cards)} cards -> {OUT} ({OUT.stat().st_size // 1024} KB)')
