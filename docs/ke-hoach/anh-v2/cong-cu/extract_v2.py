import base64
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
html = src.read_text(encoding="utf-8")
pages = json.loads(re.search(r'<script id="pages" type="application/json">(.*?)</script>', html, re.S).group(1))
for name, b64 in pages.items():
    doc = base64.b64decode(b64).decode("utf-8")
    (out / f"{name}.html").write_text(doc, encoding="utf-8")
    ext = sorted(set(re.findall(r'(?:src|href)="(https?://[^"]+)"', doc)))
    imp = sorted(set(re.findall(r"url\((https?://[^)]+)\)", doc)))
    print(f"{name}: {len(doc)//1024} KB | ngoai: {ext[:4]} {imp[:3]}")
