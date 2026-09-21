#!/usr/bin/env python3
"""Collect official product descriptions as evidence; never publish metadata automatically."""

import argparse
import concurrent.futures
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("collector", ROOT / "scripts/crawl-pricing.py")
collector = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(collector)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tool", action="append", help="Only collect this catalog tool ID")
    parser.add_argument("--url", action="append", help="Official product URL; requires one --tool")
    args = parser.parse_args()
    catalog = json.loads((ROOT / "src/domains/catalog/data/tools.json").read_text())
    overrides = json.loads((ROOT / "research/product-sources.json").read_text())
    ids = {tool["id"] for tool in catalog}
    if args.tool and not set(args.tool).issubset(ids):
        parser.error("Unknown catalog tool ID")
    if args.url and (not args.tool or len(args.tool) != 1):
        parser.error("--url requires exactly one --tool")
    jobs = set()
    for tool in catalog:
        if args.tool and tool["id"] not in args.tool:
            continue
        for url in args.url or overrides.get(tool["id"], [tool["website"]]):
            if urlparse(url).scheme != "https":
                parser.error("Only HTTPS sources are supported")
            jobs.add((tool["id"], url))
    output = ROOT / "research/products" / datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S-%fZ")
    output.mkdir(parents=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(collector.collect, job, output, "product") for job in sorted(jobs)]
        results = []
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results.append(result)
            print(json.dumps(result), flush=True)
    (output / "index.json").write_text(json.dumps(sorted(results, key=lambda row: (row["toolId"], row["url"])), indent=2) + "\n")


if __name__ == "__main__":
    main()
