"""Parse the screenplay-process markdown into process.json for the website.

Input:  ../quy_trinh_viet_kich_ban.docx.md
Output: ../data/process.json

Produces a JSON document with:
- intro:       {triet_ly: html, cach_su_dung: html}
- stages:      [{num, title, intro_html, substeps: [{id, title, html}]}]
- appendices:  A, B (categorised errors), C, D (substeps like stages)
- conclusion:  html

Bodies are converted to a small HTML subset (p, ul/li, ol/li, strong, em,
blockquote, h4) so the frontend can render with `innerHTML`.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

SRC = Path(__file__).parent.parent / "quy_trinh_viet_kich_ban.docx.md"
OUT = Path(__file__).parent.parent / "data" / "process.json"


def md_inline(text: str) -> str:
    """Convert inline markdown (**bold**, *italic*) to HTML and escape <>&."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", text)
    return text


def md_block_to_html(lines: list[str]) -> str:
    """Convert a list of markdown lines (no headers) to an HTML string."""
    out: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue
        # H4 (### **...**)
        m = re.match(r"^###\s+\*\*(.+?)\*\*\s*$", line)
        if m:
            out.append(f"<h4>{md_inline(m.group(1))}</h4>")
            i += 1
            continue
        # Unordered list block
        if re.match(r"^\*\s+", line):
            items: list[str] = []
            while i < n and re.match(r"^\*\s+", lines[i].rstrip()):
                item = re.sub(r"^\*\s+", "", lines[i].rstrip())
                # Continuation lines (indented) merge into the item
                i += 1
                while i < n and lines[i].startswith("  ") and lines[i].strip():
                    item += " " + lines[i].strip()
                    i += 1
                items.append(f"<li>{md_inline(item)}</li>")
                # skip blank lines between items
                while i < n and not lines[i].strip():
                    i += 1
            out.append("<ul>" + "".join(items) + "</ul>")
            continue
        # Ordered list block (1. 2. 3.)
        if re.match(r"^\d+\.\s+", line):
            items = []
            while i < n and re.match(r"^\d+\.\s+", lines[i].rstrip()):
                item = re.sub(r"^\d+\.\s+", "", lines[i].rstrip())
                i += 1
                while i < n and lines[i].startswith("   ") and lines[i].strip():
                    item += " " + lines[i].strip()
                    i += 1
                items.append(f"<li>{md_inline(item)}</li>")
                while i < n and not lines[i].strip():
                    i += 1
            out.append("<ol>" + "".join(items) + "</ol>")
            continue
        # Blockquote
        if line.startswith(">"):
            quote_lines = []
            while i < n and lines[i].startswith(">"):
                quote_lines.append(lines[i].lstrip(">").strip())
                i += 1
            out.append(f"<blockquote>{md_inline(' '.join(quote_lines))}</blockquote>")
            continue
        # Plain paragraph: collect until blank line
        para = [line]
        i += 1
        while i < n and lines[i].strip() and not re.match(r"^(\*\s+|\d+\.\s+|>|###\s)", lines[i]):
            para.append(lines[i].rstrip())
            i += 1
        out.append(f"<p>{md_inline(' '.join(para))}</p>")
    return "".join(out)


def split_sections(lines: list[str], header_re: str) -> list[tuple[str, list[str]]]:
    """Split lines into (header_text, body_lines) groups by header pattern."""
    out: list[tuple[str, list[str]]] = []
    current_header: str | None = None
    current_body: list[str] = []
    for line in lines:
        m = re.match(header_re, line)
        if m:
            if current_header is not None:
                out.append((current_header, current_body))
            current_header = m.group(1).strip()
            current_body = []
        else:
            if current_header is not None:
                current_body.append(line)
    if current_header is not None:
        out.append((current_header, current_body))
    return out


def parse_stage(title: str, body: list[str]) -> dict:
    """Parse one GIAI ĐOẠN section: extract intro + substeps (Bước N.M)."""
    # title like "GIAI ĐOẠN 1: PHÁT TRIỂN Ý TƯỞNG CỐT LÕI"
    m = re.match(r"GIAI ĐOẠN (\d+):\s*(.+)", title)
    num = int(m.group(1))
    # Source has the title in ALL CAPS; lowercase then capitalise first letter
    # only (preserves Vietnamese diacritics correctly).
    raw = m.group(2).strip().lower()
    name = raw[:1].upper() + raw[1:]

    # Split body into intro and substeps
    intro_lines: list[str] = []
    sub_chunks: list[tuple[str, list[str]]] = []
    current_sub: tuple[str, list[str]] | None = None
    for line in body:
        sm = re.match(r"^##\s+\*\*Bước\s+(\d+\.\d+)\s+—\s+(.+?)\*\*\s*$", line)
        if sm:
            if current_sub is not None:
                sub_chunks.append(current_sub)
            current_sub = ((sm.group(1), sm.group(2).strip()), [])
        else:
            if current_sub is None:
                intro_lines.append(line)
            else:
                current_sub[1].append(line)
    if current_sub is not None:
        sub_chunks.append(current_sub)

    substeps = []
    for (sid, stitle), sbody in sub_chunks:
        substeps.append({
            "id": sid,
            "title": stitle,
            "html": md_block_to_html(sbody),
        })

    return {
        "num": num,
        "title": name,
        "intro_html": md_block_to_html(intro_lines),
        "substeps": substeps,
    }


def parse_appendix_d(body: list[str]) -> dict:
    """Appendix D has Bước D.1 ... D.5, parse like a stage."""
    intro_lines: list[str] = []
    sub_chunks: list[tuple[str, list[str]]] = []
    current_sub: tuple[str, list[str]] | None = None
    for line in body:
        sm = re.match(r"^##\s+\*\*Bước\s+(D\.\d+)\s+—\s+(.+?)\*\*\s*$", line)
        if sm:
            if current_sub is not None:
                sub_chunks.append(current_sub)
            current_sub = ((sm.group(1), sm.group(2).strip()), [])
        else:
            if current_sub is None:
                intro_lines.append(line)
            else:
                current_sub[1].append(line)
    if current_sub is not None:
        sub_chunks.append(current_sub)
    substeps = [
        {"id": sid, "title": stitle, "html": md_block_to_html(sbody)}
        for (sid, stitle), sbody in sub_chunks
    ]
    return {
        "id": "D",
        "title": "Quy trình chuyển thể (Adaptation)",
        "intro_html": md_block_to_html(intro_lines),
        "substeps": substeps,
    }


def parse_appendix_b(body: list[str]) -> dict:
    """Appendix B groups 33 errors into 6 categories under ## headers."""
    categories: list[dict] = []
    current_cat: dict | None = None
    items: list[str] = []
    for line in body:
        m = re.match(r"^##\s+\*\*(.+?)\*\*\s*$", line)
        if m:
            if current_cat is not None:
                current_cat["items"] = items
                categories.append(current_cat)
            current_cat = {"title": m.group(1).strip()}
            items = []
        elif re.match(r"^\*\s+", line.rstrip()):
            item = re.sub(r"^\*\s+", "", line.rstrip())
            # Continuation lines (indented) merge
            items.append(item)
    if current_cat is not None:
        current_cat["items"] = items
        categories.append(current_cat)
    # Number the errors globally
    n = 1
    for cat in categories:
        numbered = []
        for it in cat["items"]:
            # Strip the "☐ N\. " or "☐ N. " prefix; we re-number ourselves.
            cleaned = re.sub(r"^[☐\s]*\d+\\?\.\s*", "", it)
            numbered.append({"n": n, "text": md_inline(cleaned)})
            n += 1
        cat["items"] = numbered
    return {
        "id": "B",
        "title": "Checklist 33 lỗi thường gặp",
        "intro_html": "",
        "categories": categories,
        "total": n - 1,
    }


def parse_appendix_generic(letter: str, full_title: str, body: list[str]) -> dict:
    """Appendix A or C: parse sections under ## headers as a list of blocks."""
    sections: list[dict] = []
    intro_lines: list[str] = []
    current_sec: tuple[str, list[str]] | None = None
    for line in body:
        m = re.match(r"^##\s+\*\*(.+?)\*\*\s*$", line)
        if m:
            if current_sec is not None:
                sections.append({
                    "title": current_sec[0],
                    "html": md_block_to_html(current_sec[1]),
                })
            current_sec = (m.group(1).strip(), [])
        else:
            if current_sec is None:
                intro_lines.append(line)
            else:
                current_sec[1].append(line)
    if current_sec is not None:
        sections.append({
            "title": current_sec[0],
            "html": md_block_to_html(current_sec[1]),
        })
    return {
        "id": letter,
        "title": full_title,
        "intro_html": md_block_to_html(intro_lines),
        "sections": sections,
    }


def main():
    text = SRC.read_text(encoding="utf-8")
    lines = text.splitlines()

    # Top-level: split on `# **...**` headers
    top_sections = split_sections(lines, r"^#\s+\*\*(.+?)\*\*\s*$")

    intro = {}
    stages = []
    appendices = []
    conclusion_html = ""

    for header, body in top_sections:
        if header == "MỤC LỤC":
            continue
        if header == "LỜI MỞ ĐẦU":
            sub = split_sections(body, r"^##\s+\*\*(.+?)\*\*\s*$")
            intro = {s[0]: md_block_to_html(s[1]) for s in sub}
            continue
        if header == "KẾT LUẬN":
            sub = split_sections(body, r"^##\s+\*\*(.+?)\*\*\s*$")
            parts = [f"<h3>{md_inline(t)}</h3>{md_block_to_html(b)}" for t, b in sub]
            conclusion_html = "".join(parts)
            continue
        if header.startswith("GIAI ĐOẠN"):
            stages.append(parse_stage(header, body))
            continue
        m = re.match(r"^PHỤ LỤC\s+([A-D]):\s*(.+)", header)
        if m:
            letter = m.group(1)
            raw = m.group(2).strip().lower()
            ttl = raw[:1].upper() + raw[1:]
            if letter == "B":
                appendices.append(parse_appendix_b(body))
            elif letter == "D":
                appendices.append(parse_appendix_d(body))
            else:
                appendices.append(parse_appendix_generic(letter, ttl, body))

    stages.sort(key=lambda s: s["num"])
    appendices.sort(key=lambda a: a["id"])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "intro": intro,
                "stages": stages,
                "appendices": appendices,
                "conclusion_html": conclusion_html,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    # Print a brief summary
    print(f"Wrote {OUT}")
    print(f"  intro keys:  {list(intro.keys())}")
    print(f"  stages:      {len(stages)} ({sum(len(s['substeps']) for s in stages)} substeps)")
    print(f"  appendices:  {[a['id'] for a in appendices]}")
    if any(a["id"] == "B" for a in appendices):
        b = next(a for a in appendices if a["id"] == "B")
        print(f"    B errors:  {b['total']} in {len(b['categories'])} categories")


if __name__ == "__main__":
    main()
