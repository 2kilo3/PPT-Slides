#!/usr/bin/env bash
# Publish only after the user requests external hosting; never install or log in automatically.
# Usage: bash scripts/deploy.sh <reviewed-folder-or-bundled.html> --publish [--prod]
set -euo pipefail

fail() { printf '%s\n' "$*" >&2; exit 1; }
if [[ $# -lt 2 || $# -gt 3 || "$2" != --publish ]]; then
    fail 'Usage: bash scripts/deploy.sh <reviewed-folder-or-bundled.html> --publish [--prod]'
fi
FLAGS=()
if [[ $# == 3 ]]; then
    [[ "$3" == --prod ]] || fail 'Only --prod is supported after --publish.'
    FLAGS+=(--prod)
fi
command -v vercel >/dev/null 2>&1 || fail 'Vercel CLI is not installed. Install it separately if deployment is wanted.'
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(sys.version_info < (3, 9))' >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1 && python -c 'import sys; sys.exit(sys.version_info < (3, 9))' >/dev/null 2>&1; then
    PYTHON=python
else
    fail 'Python 3.9+ is required for safe staging; no software was installed.'
fi
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
STAGING=$("$PYTHON" -c 'import tempfile; print(tempfile.mkdtemp(prefix="ppt-slides-publish-").replace("\\", "/"))')
cleanup() {
    cd -- "$SCRIPT_DIR"
    "$PYTHON" - "$STAGING" <<'PY'
from pathlib import Path
import shutil
import stat
import sys
import tempfile
root = Path(sys.argv[1])
reparse = getattr(root.lstat(), 'st_file_attributes', 0) & getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0) if root.exists() else 0
if root.parent.resolve() != Path(tempfile.gettempdir()).resolve() or not root.name.startswith('ppt-slides-publish-') or root.is_symlink() or reparse:
    raise SystemExit('Refusing to clean an unexpected staging path.')
if root.exists():
    shutil.rmtree(root)
PY
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

DEPLOY_DIR=$("$PYTHON" - "$1" "$STAGING" "$SCRIPT_DIR" <<'PY'
from pathlib import Path
import re
import shutil
import stat
import sys

source = Path(sys.argv[1])
root = Path(sys.argv[2]).resolve()
sys.path.insert(0, sys.argv[3])
from bundle import Resources


def linked(path):
    return path.is_symlink() or bool(getattr(path.lstat(), 'st_file_attributes', 0) & getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0))


def check_file(path, base):
    if linked(path) or not path.resolve().is_relative_to(base):
        raise ValueError(f'Linked or outside file is not allowed: {path}')
    if not path.is_file():
        raise ValueError(f'Only regular files can be published: {path}')


try:
    if linked(source):
        raise ValueError('Use a real HTML file or reviewed output directory, not a link.')
    source = source.resolve(strict=True)
    name = re.sub(r'[^a-z0-9-]+', '-', source.stem.lower()).strip('-')[:80] or 'slides'
    destination = root / name
    destination.mkdir()
    if source.is_file() and source.suffix.lower() in ('.html', '.htm'):
        # shortcut: single-file deployment requires embedded resources; use a reviewed directory for assets.
        parser = Resources()
        parser.feed(source.read_text(encoding='utf-8'))
        for value in re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)', '\n'.join(parser.css), re.I):
            if not value.startswith(('data:', '#')):
                parser.missing.append(f'CSS url({value})')
        if re.search(r'@import\s', '\n'.join(parser.css), re.I):
            parser.missing.append('CSS @import')
        if parser.missing:
            raise ValueError('Bundle resources first, or publish a reviewed output folder: ' + '; '.join(parser.missing))
        shutil.copyfile(source, destination / 'index.html')
    elif source.is_dir():
        if not (source / 'index.html').is_file():
            raise ValueError('The reviewed output directory must contain index.html.')
        for path in source.rglob('*'):
            relative = path.relative_to(source)
            if any(part.startswith('.') for part in relative.parts):
                raise ValueError(f'Hidden files/directories must be removed from the publication copy: {relative}')
            if linked(path) or not path.resolve().is_relative_to(source):
                raise ValueError(f'Links or outside paths are not allowed: {relative}')
            if path.name.lower() in ('package.json', 'vercel.json', 'vercel.yaml', 'vercel.yml'):
                raise ValueError(f'Publish static output, without build/deployment configuration: {relative}')
            target = destination / relative
            if path.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                check_file(path, source)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(path, target)
    else:
        raise ValueError('Input must be an HTML file or a reviewed static output directory.')
    print(destination.as_posix())
except (OSError, ValueError) as error:
    raise SystemExit(str(error))
PY
)

# Keep CLI project discovery and any generated state inside the disposable staging root.
cd -- "$STAGING"
vercel whoami >/dev/null 2>&1 || fail 'Vercel authentication failed. Run vercel login separately, then retry.'
printf '%s\n' "Publishing the reviewed static files from: $1" 'Vercel will prompt for its project settings; default target is a preview deployment.'
vercel deploy "$DEPLOY_DIR" "${FLAGS[@]}"
