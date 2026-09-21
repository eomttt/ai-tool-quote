#!/usr/bin/env python3
"""Download icons declared by official tool pages and record their provenance."""

import argparse
import concurrent.futures
import hashlib
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src/domains/catalog/data/tools.json"
SOURCES = ROOT / "research/icon-sources.json"
MAX_BYTES = 4 * 1024 * 1024


class IconLinks(HTMLParser):
    def __init__(self, page_url):
        super().__init__()
        self.page_url = page_url
        self.icons = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        rel = (attributes.get("rel") or "").lower().split()
        href = attributes.get("href")
        if tag != "link" or not href or not set(rel).intersection({"icon", "apple-touch-icon"}):
            return
        source = urllib.parse.urljoin(self.page_url, href)
        if urllib.parse.urlparse(source).scheme != "https":
            return
        sizes = attributes.get("sizes") or ""
        size = max([int(n) for n in re.findall(r"(\d+)x\d+", sizes)] or [0])
        score = ("apple-touch-icon" in rel) * 1000 + min(size, 512)
        if attributes.get("type") == "image/svg+xml":
            score += 800
        if "dark" in (attributes.get("media") or ""):
            score -= 2000
        self.icons.append({"url": source, "rel": " ".join(rel), "sizes": sizes, "score": score})


def fetch(url):
    if urllib.parse.urlparse(url).scheme != "https":
        raise ValueError("Only HTTPS sources are supported")
    request = urllib.request.Request(url, headers={
        "User-Agent": "AIToolQuoteIconCollector/0.1 (manual official icon collection)",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError("Source exceeded the 4 MB limit")
        if urllib.parse.urlparse(response.url).scheme != "https":
            raise ValueError("Source redirected outside HTTPS")
        return body, response.url, response.headers.get("Content-Type", "")


def image_extension(body):
    if body.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if body.startswith(b"\x00\x00\x01\x00"):
        return "ico"
    if body.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if body[:4] == b"RIFF" and body[8:12] == b"WEBP":
        return "webp"
    if body[:6] in {b"GIF87a", b"GIF89a"}:
        return "gif"
    if b"<!entity" in body.lower() or b"<!doctype" in body.lower():
        raise ValueError("SVG document declarations are not accepted")
    try:
        root = ET.fromstring(body)
    except ET.ParseError as error:
        raise ValueError("Response is not a supported icon image") from error
    if root.tag.rsplit("}", 1)[-1] != "svg":
        raise ValueError("Response is not an SVG image")
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].lower() in {"script", "foreignobject", "image", "a", "animate", "set"}:
            raise ValueError("SVG contains active or external content")
        for key, value in element.attrib.items():
            name = key.rsplit("}", 1)[-1].lower()
            if name.startswith("on") or (name == "href" and not value.startswith("#")):
                raise ValueError("SVG contains an active attribute")
    text = body.decode("utf-8")
    if re.search(r"@import|javascript:", text, re.I):
        raise ValueError("SVG contains external styles")
    for resource in re.findall(r"url\((.*?)\)", text, re.I):
        if not resource.strip().strip("'\"").startswith("#"):
            raise ValueError("SVG contains external styles")
    return "svg"


def collect(tool, override=None):
    errors = []
    page_urls = list(dict.fromkeys([tool["website"], tool["source"]]))
    for page_url in page_urls:
        candidates = []
        final_page = page_url
        page_hash = None
        if override:
            candidates.append({"url": override, "rel": "reviewed-official-asset", "sizes": "", "score": 10000})
        try:
            body, final_page, _ = fetch(page_url)
            page_hash = hashlib.sha256(body).hexdigest()
            parser = IconLinks(final_page)
            parser.feed(body.decode("utf-8", errors="replace"))
            candidates.extend(sorted(parser.icons, key=lambda icon: icon["score"], reverse=True))
        except (OSError, ValueError) as error:
            errors.append({"url": page_url, "error": str(error)})
        candidates.append({"url": urllib.parse.urljoin(final_page, "/favicon.ico"), "rel": "default-favicon", "sizes": ""})
        seen = set()
        for candidate in candidates:
            if candidate["url"] in seen:
                continue
            seen.add(candidate["url"])
            try:
                image, source, content_type = fetch(candidate["url"])
                extension = image_extension(image)
                path = ROOT / "public" / "tool-icons" / f"{tool['id']}.{extension}"
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(image)
                return {
                    "toolId": tool["id"], "status": "downloaded",
                    "path": f"/tool-icons/{path.name}",
                    "pageUrl": page_url, "finalPageUrl": final_page,
                    "pageSha256": page_hash,
                    "requestedIconUrl": candidate["url"], "sourceUrl": source,
                    "discovery": candidate["rel"], "declaredSizes": candidate["sizes"],
                    "fetchedAt": datetime.now(timezone.utc).isoformat(),
                    "contentType": content_type, "bytes": len(image),
                    "sha256": hashlib.sha256(image).hexdigest(),
                }
            except (OSError, ValueError) as error:
                errors.append({"url": candidate["url"], "error": str(error)})
    return {"toolId": tool["id"], "status": "unavailable", "errors": errors,
            "attemptedAt": datetime.now(timezone.utc).isoformat()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tool", action="append", help="Only collect this catalog tool ID")
    parser.add_argument("--icon-url", help="Reviewed official icon URL; requires exactly one --tool")
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text())
    if args.tool and not set(args.tool).issubset({tool["id"] for tool in catalog}):
        parser.error("Unknown tool ID")
    if args.icon_url and (not args.tool or len(args.tool) != 1):
        parser.error("--icon-url requires exactly one --tool")
    selected = [tool for tool in catalog if not args.tool or tool["id"] in args.tool]
    records = json.loads(SOURCES.read_text()) if SOURCES.exists() else {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(collect, tool, args.icon_url) for tool in selected]
        for future in concurrent.futures.as_completed(futures):
            record = future.result()
            tool_id = record["toolId"]
            if record["status"] == "downloaded":
                records[tool_id] = record
                next(tool for tool in catalog if tool["id"] == tool_id)["icon"] = record["path"]
            elif records.get(tool_id, {}).get("status") != "downloaded":
                records[tool_id] = record
            print(f"{tool_id}: {record['status']} {record.get('path', '')}", flush=True)
    SOURCES.write_text(json.dumps(dict(sorted(records.items())), ensure_ascii=False, indent=2) + "\n")
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
