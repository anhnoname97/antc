"""Sinh docs/so-do/SO-DO.md (Mermaid) từ csproj, uSync và mã C#.

Chạy từ bất kỳ đâu: python docs/so-do/gen_so_do.py
"""
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "src" / "ANTC.Portal.App"
USYNC = APP / "Umbraco.Web.UI" / "uSync" / "v18"
OUT = Path(__file__).with_name("SO-DO.md")


def mid(s):
    return re.sub(r"[^A-Za-z0-9_]", "_", s)


def text(el, path, default=""):
    n = el.find(path)
    return (n.text or "").strip() if n is not None else default


def projects_graph():
    lines = ["graph LR"]
    for csproj in sorted(APP.glob("*/*.csproj")):
        name = csproj.stem
        tree = ET.parse(csproj)
        lines.append(f'  {mid(name)}["{name}"]')
        for ref in tree.iter("ProjectReference"):
            dep = Path(ref.get("Include").replace("\\", "/")).stem
            lines.append(f"  {mid(name)} --> {mid(dep)}")
        for pk in tree.iter("PackageReference"):
            pkg = pk.get("Include")
            if pkg in ("Umbraco.Cms", "uSync", "Microsoft.EntityFrameworkCore.Sqlite", "xunit"):
                lines.append(f'  {mid(name)} -.-> pkg_{mid(pkg)}(["{pkg}"])')
    return "\n".join(lines)


def load_doctypes():
    types = {}
    for f in sorted((USYNC / "ContentTypes").glob("*.config")):
        r = ET.parse(f).getroot()
        if r.tag == "Empty":  # uSync đánh dấu đã xóa
            continue
        alias = r.get("Alias")
        info = r.find("Info")
        types[alias] = {
            "name": text(info, "Name"),
            "element": text(info, "IsElement").lower() == "true",
            "root": text(info, "AllowAtRoot").lower() == "true",
            "comps": [c.text for c in info.findall("Compositions/Composition")],
            "template": text(info, "DefaultTemplate"),
            "children": [c.text for c in r.findall("Structure/ContentType")],
            "props": len(r.findall("GenericProperty")),
        }
    return types


def doctype_graph(types):
    pages = {a: t for a, t in types.items() if not t["element"]}
    lines = ["graph TD"]
    for a, t in pages.items():
        shape = f'{mid(a)}["{t["name"]}<br/><i>{a}</i>"]'
        lines.append("  " + shape)
    for a, t in pages.items():
        for c in t["children"]:
            if c in pages:
                lines.append(f"  {mid(a)} --> {mid(c)}")
        for c in t["comps"]:
            lines.append(f"  {mid(a)} -. composition .-> {mid(c)}")
        if t["template"]:
            lines.append(f'  {mid(a)} -.-> tpl_{mid(t["template"])}{{{{"{t["template"]}.cshtml"}}}}')
    return "\n".join(lines)


def element_table(types):
    groups = defaultdict(list)
    for a, t in types.items():
        if t["element"]:
            m = re.match(r"(competition|emergency|fraud|faq|information|quiz|hero|[a-z]+?)(?=[A-Z]|$)", a)
            groups[m.group(1) if m else a].append(a)
    rows = ["| Nhóm | Số | Element type |", "|---|---|---|"]
    for g, items in sorted(groups.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        rows.append(f"| {g} | {len(items)} | {', '.join(sorted(items))} |")
    return "\n".join(rows)


def content_tree():
    nodes = {}
    for f in (USYNC / "Content").glob("*.config"):
        r = ET.parse(f).getroot()
        if r.tag == "Empty":
            continue
        info = r.find("Info")
        parent = info.find("Parent")
        nodes[r.get("Key")] = {
            "name": text(info, "NodeName[@Default]") or (info.find("NodeName").get("Default") if info.find("NodeName") is not None else r.get("Alias")),
            "type": text(info, "ContentType"),
            "parent": parent.get("Key") if parent is not None else None,
            "sort": int(text(info, "SortOrder", "0") or 0),
            "parentName": (parent.text or "").strip() if parent is not None else "",
        }
    kids = defaultdict(list)
    for k, n in nodes.items():
        kids[n["parent"]].append(k)
    lines = ["graph LR"]
    seen_missing = {}

    def walk(k):
        n = nodes[k]
        lines.append(f'  n{mid(k)}["{n["name"]}<br/><i>{n["type"]}</i>"]')
        for c in sorted(kids.get(k, []), key=lambda x: nodes[x]["sort"]):
            walk(c)
            lines.append(f"  n{mid(k)} --> n{mid(c)}")

    roots = [k for k, n in nodes.items() if n["parent"] not in nodes]
    for k in sorted(roots, key=lambda x: nodes[x]["sort"]):
        walk(k)
    return "\n".join(lines), len(nodes)


def csharp_inventory():
    out = []
    for proj in ("Umbraco.Plugin.Custom.Core", "Umbraco.Plugin.Custom.Api", "Umbraco.Plugin.Custom.Tests"):
        pdir = APP / proj
        by_dir = defaultdict(list)
        for f in sorted(pdir.rglob("*.cs")):
            if any(p in f.parts for p in ("bin", "obj", "Migrations")):
                continue
            rel = f.relative_to(pdir)
            by_dir[str(rel.parent) if str(rel.parent) != "." else "(gốc)"].append(f.stem)
        out.append(f"### {proj}\n")
        out.append("| Thư mục | Số file | File |")
        out.append("|---|---|---|")
        for d, names in by_dir.items():
            out.append(f"| {d} | {len(names)} | {', '.join(names)} |")
        out.append("")
    return "\n".join(out)


def routes():
    rows = ["| Controller | Route |", "|---|---|"]
    for f in sorted((APP / "Umbraco.Plugin.Custom.Api").rglob("*Controller.cs")):
        if "obj" in f.parts:
            continue
        src = f.read_text(encoding="utf-8-sig", errors="ignore")
        base = re.search(r'\[Route\("([^"]+)"\)\]', src)
        verbs = re.findall(r'\[Http(Get|Post|Put|Delete)(?:\("([^"]*)"\))?\]', src)
        r = ", ".join(f"{v.upper()} {(base.group(1) if base else '')}/{p}".rstrip("/") for v, p in verbs) or (base.group(1) if base else "?")
        rows.append(f"| {f.stem} | {r} |")
    return "\n".join(rows)


def main():
    types = load_doctypes()
    tree, n = content_tree()
    md = f"""# Sơ đồ project ANTC Portal

> File này **tự sinh** bằng `python docs/so-do/gen_so_do.py`. Đừng sửa tay; chạy lại script sau khi đổi cấu trúc.
> GitLab/GitHub/VS Code (Markdown Preview Mermaid) tự vẽ các khối Mermaid bên dưới.

## 1. Quan hệ giữa các project .NET

```mermaid
{projects_graph()}
```

## 2. Document type dạng trang (uSync)

Mũi tên liền = được phép tạo con; nét đứt = composition hoặc template.

```mermaid
{doctype_graph(types)}
```

## 3. Element type (block dùng trong trang)

Tổng {sum(1 for t in types.values() if t['element'])} element type.

{element_table(types)}

## 4. Cây nội dung mẫu ({n} node)

```mermaid
{tree}
```

## 5. Mã C# tuỳ biến

{csharp_inventory()}

### API routes

{routes()}
"""
    OUT.write_text(md, encoding="utf-8")
    print(f"Wrote {OUT} ({len(md)} chars)")


main()
