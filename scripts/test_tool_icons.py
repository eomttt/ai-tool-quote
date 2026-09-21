import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("icon_collector", ROOT / "scripts/fetch-tool-icons.py")
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class ToolIconTests(unittest.TestCase):
    def test_extracts_declared_icons_and_prefers_large_light_icons(self):
        parser = collector.IconLinks("https://example.com/tools/")
        parser.feed('''
          <link rel="stylesheet" href="/style.css">
          <link rel="icon" href="/favicon.ico" sizes="32x32">
          <link rel="apple-touch-icon" href="/touch.png" sizes="180x180">
          <link rel="icon" href="/dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)">
          <link rel="icon" href="javascript:bad()">
        ''')
        self.assertEqual(len(parser.icons), 3)
        selected = max(parser.icons, key=lambda item: item["score"])
        self.assertEqual(selected["url"], "https://example.com/touch.png")

    def test_rejects_html_and_active_svg_without_rewriting_official_images(self):
        safe = b'<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(\'#gradient\')"/></svg>'
        self.assertEqual(collector.image_extension(safe), "svg")
        for content in [
            b"<html>Access denied</html>",
            b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
            b'<svg xmlns="http://www.w3.org/2000/svg"><style>@import "https://example.com/a.css";</style></svg>',
            b'<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://example.com/a.svg)"/></svg>',
        ]:
            with self.subTest(content=content), self.assertRaises(ValueError):
                collector.image_extension(content)

    def test_catalog_icons_match_local_files_and_official_source_records(self):
        tools = json.loads((ROOT / "src/domains/catalog/data/tools.json").read_text())
        records = json.loads((ROOT / "research/icon-sources.json").read_text())
        for tool in tools:
            if "icon" not in tool:
                continue
            record = records[tool["id"]]
            self.assertEqual(record["path"], tool["icon"])
            self.assertIn(record["pageUrl"], [tool["website"], tool["source"]])
            self.assertTrue(record["sourceUrl"].startswith("https://"))
            self.assertTrue(record["fetchedAt"])
            body = (ROOT / "public" / tool["icon"].lstrip("/")).read_bytes()
            self.assertEqual(hashlib.sha256(body).hexdigest(), record["sha256"])
            self.assertTrue(tool["icon"].endswith("." + collector.image_extension(body)))


if __name__ == "__main__":
    unittest.main()
