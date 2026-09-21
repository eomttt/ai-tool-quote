#!/usr/bin/env python3
"""Collect official source pages for review without changing published prices."""

import argparse
import concurrent.futures
import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 8 * 1024 * 1024


class PageText(HTMLParser):
    def __init__(self, base_url):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.ignored = 0
        self.in_title = False
        self.title = []
        self.parts = []
        self.links = set()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag in {"script", "style", "svg", "noscript"}:
            self.ignored += 1
        if tag == "title":
            self.in_title = True
        if tag == "a" and attributes.get("href"):
            url = urllib.parse.urljoin(self.base_url, attributes["href"])
            if url.startswith("https://") and re.search(
                r"pric|plan|subscription|billing|membership", urllib.parse.urlparse(url).path, re.I
            ):
                self.links.add(url.split("#")[0])
        if tag in {"div", "p", "li", "tr", "h1", "h2", "h3", "h4", "br", "section"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "svg", "noscript"}:
            self.ignored = max(0, self.ignored - 1)
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.ignored:
            return
        if self.in_title:
            self.title.append(data)
        self.parts.append(data + " ")

    def text(self):
        return "\n".join(
            line for part in "".join(self.parts).splitlines()
            if (line := re.sub(r"\s+", " ", part).strip())
        )


def collection_status(status, title, text):
    if status != 200:
        return "http-error"
    if any(marker in title.lower() for marker in ("just a moment", "unsupported client", "access denied")):
        return "blocked"
    if len(text) < 200:
        return "render-required"
    return "collected"


def collect(job, output, purpose="pricing"):
    tool_id, url = job
    record = {
        "toolId": tool_id,
        "requestedUrl": url,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "method": "http-html-text",
        "purpose": purpose,
        "reviewStatus": "unreviewed",
    }
    try:
        request = urllib.request.Request(url, headers={
            "User-Agent": f"AIToolQuoteSourceCollector/0.1 (manual {purpose} research)",
            "Accept": "text/html, text/plain;q=0.9, */*;q=0.1",
            "Accept-Language": "en-US,en;q=0.9",
        })
        try:
            response = urllib.request.urlopen(request, timeout=25)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise ValueError("Response exceeded the 8 MB collection limit")
            record.update({
                "finalUrl": response.url,
                "httpStatus": response.status,
                "contentType": response.headers.get("Content-Type", ""),
                "contentSha256": hashlib.sha256(body).hexdigest(),
            })
            decoded = body.decode(response.headers.get_content_charset() or "utf-8", errors="replace")
        parser = PageText(record["finalUrl"])
        parser.feed(decoded)
        record.update({
            "title": " ".join(parser.title).strip(),
            "text": parser.text(),
            "pricingLinks": sorted(parser.links),
            "collectionStatus": "collected" if record["httpStatus"] == 200 else "http-error",
        })
        record["collectionStatus"] = collection_status(record["httpStatus"], record["title"], record["text"])
        record["textSha256"] = hashlib.sha256(record["text"].encode()).hexdigest()
        raw_dir = ROOT / ".cache" / f"{purpose}-sources"
        raw_dir.mkdir(parents=True, exist_ok=True)
        (raw_dir / f"{record['contentSha256']}.html").write_bytes(body)
    except (OSError, ValueError) as error:
        record.update({"collectionStatus": "fetch-error", "error": str(error)})
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:10]
    filename = f"{tool_id}-{url_hash}.json"
    (output / filename).write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
    return {"toolId": tool_id, "url": url, "file": str((output / filename).relative_to(ROOT)),
            "status": record["collectionStatus"], "characters": len(record.get("text", ""))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tool", action="append", help="Only collect this catalog tool ID")
    parser.add_argument("--url", action="append", help="Explicit official URL; requires one --tool")
    arguments = parser.parse_args()
    tools = json.loads((ROOT / "src/domains/catalog/data/tools.json").read_text())
    pricing = json.loads((ROOT / "src/domains/catalog/data/pricing.json").read_text())
    source_file = ROOT / "research/pricing-sources.json"
    source_overrides = json.loads(source_file.read_text()) if source_file.exists() else {}
    tool_ids = {tool["id"] for tool in tools}
    if arguments.tool and not set(arguments.tool).issubset(tool_ids):
        parser.error("Unknown catalog tool ID")
    if arguments.url and (not arguments.tool or len(arguments.tool) != 1):
        parser.error("--url requires exactly one --tool")
    jobs = set()
    for tool in tools:
        if arguments.tool and tool["id"] not in arguments.tool:
            continue
        sources = arguments.url or source_overrides.get(tool["id"]) or next(
            (item["sources"] for item in pricing if item["toolId"] == tool["id"]),
            [tool["source"]],
        )
        for url in sources:
            if urllib.parse.urlparse(url).scheme != "https":
                parser.error("Only HTTPS sources are supported")
            jobs.add((tool["id"], url))
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    output = ROOT / "research" / "pricing" / timestamp
    if output.exists():
        output = output.with_name(timestamp + "-" + datetime.now(timezone.utc).strftime("%f"))
    output.mkdir(parents=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(collect, job, output) for job in sorted(jobs)]
        results = []
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results.append(result)
            print(json.dumps(result, ensure_ascii=False), flush=True)
    (output / "index.json").write_text(json.dumps(sorted(results, key=lambda row: (row["toolId"], row["url"])), ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
