"""Exercise the real Bash helper with a local fake Vercel CLI; never contact Vercel."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
BASH = shutil.which('bash')


@unittest.skipUnless(BASH, 'Bash is required to exercise deploy.sh')
class DeployTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='ppt-deploy-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.staging = self.root / 'temporary roots'
        self.staging.mkdir()
        self.log = self.root / 'calls.jsonl'
        self.source = self.root / 'my deck.html'
        self.source.write_text('<!doctype html><html><body>公开演示</body></html>', encoding='utf-8')
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ.get('PATH', ''),
                        TMPDIR=str(self.staging), TMP=str(self.staging), TEMP=str(self.staging),
                        PPT_DEPLOY_LOG=str(self.log))
        fake = self.bin / 'vercel'
        fake.write_text("#!/usr/bin/env bash\n'" + sys.executable.replace('\\', '/') + "' - \"$@\" <<'PY'\n"
                        "import json, os, pathlib, sys\n"
                        "record = {'args': sys.argv[1:], 'cwd': os.getcwd()}\n"
                        "if sys.argv[1] == 'deploy':\n"
                        "    root = pathlib.Path(sys.argv[2])\n"
                        "    record['files'] = sorted(str(p.relative_to(root)).replace('\\\\', '/') for p in root.rglob('*') if p.is_file())\n"
                        "    record['html'] = (root / 'index.html').read_text(encoding='utf-8')\n"
                        "with open(os.environ['PPT_DEPLOY_LOG'], 'a', encoding='utf-8') as out:\n"
                        "    out.write(json.dumps(record) + '\\n')\n"
                        "if sys.argv[1] == os.environ.get('PPT_FAIL_COMMAND'):\n"
                        "    sys.exit(7)\n"
                        "print('https://example.invalid/test' if sys.argv[1] == 'deploy' else 'test-user')\n"
                        "PY\n", encoding='utf-8', newline='\n')
        fake.chmod(0o755)

    def run_helper(self, *args, env=None):
        return subprocess.run([BASH, str(ROOT / 'scripts/deploy.sh'), *map(str, args)],
                              env=env or self.env, text=True, encoding='utf-8', errors='replace',
                              capture_output=True, timeout=30)

    def calls(self):
        return [json.loads(line) for line in self.log.read_text(encoding='utf-8').splitlines()] if self.log.exists() else []

    def assert_clean(self):
        self.assertEqual(list(self.staging.glob('ppt-slides-publish-*')), [])

    def test_requires_explicit_publication_before_any_cli_call(self):
        result = self.run_helper(self.source)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.calls(), [])
        self.assert_clean()

    def test_missing_cli_never_attempts_install(self):
        env = dict(self.env, PATH='')
        result = self.run_helper(self.source, '--publish', env=env)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Vercel CLI is not installed', result.stderr)
        self.assertEqual(self.calls(), [])

    def test_single_file_preview_and_safe_cleanup(self):
        original = self.source.read_bytes()
        collision = self.staging / 'my-deck'
        collision.mkdir()
        marker = collision / 'keep.txt'
        marker.write_text('keep', encoding='utf-8')
        result = self.run_helper(self.source, '--publish')
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.calls()
        self.assertEqual([call['args'][0] for call in calls], ['whoami', 'deploy'])
        self.assertEqual(calls[-1]['files'], ['index.html'])
        self.assertIn('公开演示', calls[-1]['html'])
        self.assertNotIn('--prod', calls[-1]['args'])
        self.assertNotIn('--yes', calls[-1]['args'])
        self.assertEqual(self.source.read_bytes(), original)
        self.assertEqual(marker.read_text(), 'keep')
        self.assert_clean()

    def test_explicit_production_and_static_assets(self):
        deck = self.root / 'output'
        deck.mkdir()
        (deck / 'index.html').write_text('<img src="assets/photo.svg">', encoding='utf-8')
        (deck / 'assets').mkdir()
        (deck / 'assets/photo.svg').write_text('<svg/>', encoding='utf-8')
        result = self.run_helper(deck, '--publish', '--prod')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.calls()[-1]['files'], ['assets/photo.svg', 'index.html'])
        self.assertIn('--prod', self.calls()[-1]['args'])
        self.assert_clean()

    def test_local_reference_cannot_copy_parent_file(self):
        secret = self.root.parent / (self.root.name + '-outside.txt')
        secret.write_text('must stay outside', encoding='utf-8')
        self.addCleanup(secret.unlink)
        self.source.write_text(f'<img src="../{secret.name}">', encoding='utf-8')
        result = self.run_helper(self.source, '--publish')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Bundle resources first', result.stderr)
        self.assertEqual(self.calls(), [])
        self.assertEqual(secret.read_text(), 'must stay outside')
        self.assert_clean()

    def test_rejects_hidden_files_and_build_config_before_network(self):
        for name in ('.env', 'package.json', 'vercel.json'):
            with self.subTest(name=name):
                deck = self.root / name.replace('.', '_')
                deck.mkdir()
                (deck / 'index.html').write_text('<html/>', encoding='utf-8')
                (deck / name).write_text('sensitive or executable config', encoding='utf-8')
                result = self.run_helper(deck, '--publish')
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.calls(), [])
                self.assert_clean()

    def test_rejects_symlink_escape(self):
        deck = self.root / 'linked-output'
        deck.mkdir()
        (deck / 'index.html').write_text('<html/>', encoding='utf-8')
        try:
            (deck / 'outside.html').symlink_to(self.source)
        except OSError as error:
            self.skipTest(f'Host cannot create a symlink: {error}')
        result = self.run_helper(deck, '--publish')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.calls(), [])
        self.assert_clean()

    def test_authentication_and_deployment_failure_clean_staging(self):
        for command in ('whoami', 'deploy'):
            with self.subTest(command=command):
                self.log.unlink(missing_ok=True)
                result = self.run_helper(self.source, '--publish', env=dict(self.env, PPT_FAIL_COMMAND=command))
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn('login', [call['args'][0] for call in self.calls()])
                if command == 'whoami':
                    self.assertEqual([call['args'][0] for call in self.calls()], ['whoami'])
                self.assert_clean()

    @unittest.skipUnless(os.name == 'nt', 'Windows junction check')
    def test_rejects_windows_junction_escape(self):
        deck = self.root / 'junction-output'
        deck.mkdir()
        (deck / 'index.html').write_text('<html/>', encoding='utf-8')
        outside = self.root / 'private'
        outside.mkdir()
        (outside / 'private.txt').write_text('private', encoding='utf-8')
        junction = deck / 'assets'
        created = subprocess.run(['cmd', '/c', 'mklink', '/J', str(junction), str(outside)], capture_output=True)
        if created.returncode:
            self.skipTest('Host cannot create a junction')
        self.addCleanup(junction.rmdir)
        result = self.run_helper(deck, '--publish')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.calls(), [])
        self.assertEqual((outside / 'private.txt').read_text(), 'private')
        self.assert_clean()
        top_link = self.root / 'top-level-link'
        subprocess.run(['cmd', '/c', 'mklink', '/J', str(top_link), str(deck)], capture_output=True, check=True)
        self.addCleanup(top_link.rmdir)
        result = self.run_helper(top_link, '--publish')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('not a link', result.stderr)
        self.assertEqual(self.calls(), [])
        self.assert_clean()


if __name__ == '__main__':
    unittest.main()
