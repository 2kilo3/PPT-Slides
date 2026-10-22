import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bundle', ROOT / 'scripts/bundle.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BundleTests(unittest.TestCase):
    def setUp(self):
        self.source = (ROOT / 'examples/starter.html').read_text(encoding='utf-8')

    def test_embeds_runtime_and_preserves_chinese(self):
        result = module.bundle(self.source)
        self.assertIn('window.PPTStudio', result)
        self.assertIn('让内容成为', result)
        self.assertNotIn('<!-- PPT_STUDIO_', result)

    def test_rejects_missing_or_duplicate_marker(self):
        for source in (self.source.replace('<!-- PPT_STUDIO_JS -->', ''), self.source + '<!-- PPT_STUDIO_JS -->'):
            with self.assertRaises(ValueError):
                module.bundle(source)

    def test_rejects_nonportable_assets(self):
        for asset in ('<img src="photo.png">', '<script src="https://example.org/x.js"></script>', '<style>@import "font.css";</style>', '<style>body{background:url(bg.jpg)}</style>'):
            with self.subTest(asset=asset), self.assertRaises(ValueError):
                module.bundle(self.source.replace('</head>', asset + '</head>'))


if __name__ == '__main__':
    unittest.main()
