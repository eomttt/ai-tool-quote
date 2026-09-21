import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ProductSourcesTest(unittest.TestCase):
    def test_every_published_capability_has_retrievable_official_evidence(self):
        profiles = json.loads((ROOT / "src/domains/catalog/data/product-profiles.json").read_text())
        tools = json.loads((ROOT / "src/domains/catalog/data/tools.json").read_text())
        self.assertEqual({p["toolId"] for p in profiles}, {t["id"] for t in tools})
        for profile in profiles:
            sources = {s["id"]: s for s in profile["sources"]}
            for capability in profile["capabilities"]:
                source = sources[capability["sourceId"]]
                path = (ROOT / source["evidenceFile"]).resolve()
                self.assertTrue(path.is_relative_to(ROOT / "research/products"))
                record = json.loads(path.read_text())
                self.assertEqual(record["collectionStatus"], "collected")
                self.assertEqual(record["toolId"], profile["toolId"])
                self.assertEqual(record["requestedUrl"], source["url"])
                self.assertEqual(record["method"], source["method"])
                self.assertIn(capability["evidenceExcerpt"].lower(), record["text"].lower())
                self.assertEqual(hashlib.sha256(record["text"].encode()).hexdigest(), record["textSha256"])

    def test_editorial_situations_link_to_capabilities_instead_of_pricing_pages(self):
        scenarios = json.loads((ROOT / "src/domains/catalog/data/scenarios.json").read_text())
        profiles = {p["toolId"]: p for p in json.loads((ROOT / "src/domains/catalog/data/product-profiles.json").read_text())}
        for scenario in scenarios:
            self.assertEqual(scenario["basis"], "editorial")
            self.assertEqual(set(scenario["toolIds"]), {link["toolId"] for link in scenario["evidence"]})
            for link in scenario["evidence"]:
                capabilities = {c["id"]: c for c in profiles[link["toolId"]]["capabilities"]}
                for capability_id in link["capabilityIds"]:
                    self.assertEqual(capabilities[capability_id]["medium"], scenario["medium"])


if __name__ == "__main__":
    unittest.main()
