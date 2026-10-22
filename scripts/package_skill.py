"""Mirror the canonical root skill into the Claude plugin package, or check parity."""
from pathlib import Path
import argparse
import shutil

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'plugins/ppt-studio/skills/ppt-studio'
FILES = ['SKILL.md', 'html-template.md', 'viewport-base.css', 'animation-patterns.md',
         'STYLE_PRESETS.md', 'LICENSE', 'UPSTREAM.md', 'THIRD_PARTY_NOTICES.md', 'package.json', 'package-lock.json']
DIRS = ['assets', 'references', 'agents', 'bold-template-pack', 'examples', 'tests', 'docs']
SCRIPTS = ['bundle.py', 'check-deck.cjs', 'extract-pptx.py', 'export-pdf.sh', 'deploy.sh']


def sources():
    paths = [ROOT / name for name in FILES]
    for directory in DIRS:
        paths.extend(p for p in (ROOT / directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    paths.extend(ROOT / 'scripts' / name for name in SCRIPTS)
    return {p.relative_to(ROOT): p for p in paths}


def main(check=False):
    expected = sources()
    existing = {p.relative_to(TARGET) for p in TARGET.rglob('*') if p.is_file()} if TARGET.exists() else set()
    stale = existing - expected.keys()
    differences = [str(p) for p, source in expected.items()
                   if not (TARGET / p).is_file() or source.read_bytes() != (TARGET / p).read_bytes()]
    differences.extend(str(p) for p in stale)
    if check:
        if differences:
            raise SystemExit('Plugin package differs: ' + ', '.join(differences))
        print(f'Plugin matches {len(expected)} canonical files.')
        return
    for relative, source in expected.items():
        target = TARGET / relative
        assert target.resolve().is_relative_to(TARGET.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    for relative in stale:
        target = TARGET / relative
        assert target.resolve().is_relative_to(TARGET.resolve())
        target.unlink()
    print(f'Packaged {len(expected)} files.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    main(parser.parse_args().check)
