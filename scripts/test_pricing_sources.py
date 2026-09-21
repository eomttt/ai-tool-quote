import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("collector", ROOT / "scripts/crawl-pricing.py")
collector = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(collector)


class PricingSourcesTest(unittest.TestCase):
    def test_script_prices_are_not_visible_evidence(self):
        parser = collector.PageText("https://example.com/")
        parser.feed('<title>Pricing</title><script>price=9999</script><style>.x{content:"$1"}</style>'
                    '<h2>Pro</h2><p>$20 &amp; 1,000 credits</p>'
                    '<a href="/pricing">Plans</a><a href="/art?q=planet">Artwork</a>')
        self.assertNotIn("9999", parser.text())
        self.assertIn("$20 & 1,000 credits", parser.text())
        self.assertEqual(parser.links, {"https://example.com/pricing"})

    def test_successful_http_response_is_not_always_a_price_page(self):
        self.assertEqual(collector.collection_status(200, "Unsupported client", "x" * 400), "blocked")
        self.assertEqual(collector.collection_status(200, "Pricing", "Loading"), "render-required")
        self.assertEqual(collector.collection_status(403, "Pricing", "x" * 400), "http-error")

    def test_every_audit_keeps_existing_evidence_and_published_sources(self):
        audits = json.loads((ROOT / "src/domains/catalog/data/pricing-audits.json").read_text())
        prices = json.loads((ROOT / "src/domains/catalog/data/pricing.json").read_text())
        review = json.loads((ROOT / "research/review-2026-09-21.json").read_text())
        for audit in audits:
            self.assertIn(audit["toolId"], review["verified"] | review["exceptions"])
            for source in audit["sources"]:
                for evidence in source["evidenceFiles"]:
                    path = (ROOT / evidence).resolve()
                    self.assertTrue(path.is_relative_to(ROOT / "research"))
                    self.assertTrue(path.is_file(), evidence)
                    record = json.loads(path.read_text())
                    if "requestedUrl" in record:
                        self.assertEqual(record["toolId"], audit["toolId"])
                        self.assertEqual(record["requestedUrl"], source["url"])
                        self.assertIn("fetchedAt", record)
        for price in prices:
            audit = next(a for a in audits if a["toolId"] == price["toolId"])
            self.assertTrue(set(price["sources"]).issubset({s["url"] for s in audit["sources"]}))


if __name__ == "__main__":
    unittest.main()
