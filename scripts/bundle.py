"""Embed the shared runtime into an authored deck; refuse missing offline assets."""
from html.parser import HTMLParser
from pathlib import Path
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.missing = []
        self.css = []
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'style':
            self.in_style = True
        if attrs.get('style'):
            self.css.append(attrs['style'])
        keys = ['src', 'poster', 'srcset']
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'preload', 'icon'):
            keys.append('href')
        for key in keys:
            value = attrs.get(key, '')
            if value and not value.startswith(('data:', '#')):
                self.missing.append(f'{tag}[{key}]={value}')

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            self.css.append(data)


def bundle(source):
    markers = {'<!-- PPT_STUDIO_CSS -->': '<style>\n' +
               (ROOT / 'viewport-base.css').read_text(encoding='utf-8') + '\n' +
               (ROOT / 'assets/studio.css').read_text(encoding='utf-8') + '\n</style>',
               '<!-- PPT_STUDIO_JS -->': '<script>\n' +
               (ROOT / 'assets/studio.js').read_text(encoding='utf-8') + '\n</script>'}
    for marker, content in markers.items():
        if source.count(marker) != 1:
            raise ValueError(f'Expected exactly one {marker}')
        source = source.replace(marker, content)
    parser = Resources()
    parser.feed(source)
    css = '\n'.join(parser.css)
    for value in re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)', css, re.I):
        if not value.startswith(('data:', '#')):
            parser.missing.append(f'CSS url({value})')
    if re.search(r'@import\s', css, re.I):
        parser.missing.append('CSS @import: embed the stylesheet and its font assets')
    if parser.missing:
        raise ValueError('Embed resources before single-file delivery: ' + '; '.join(parser.missing))
    return source


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('source', type=Path)
    cli.add_argument('output', type=Path)
    args = cli.parse_args()
    if args.source.resolve() == args.output.resolve():
        cli.error('Keep the authoring source separate from the bundled output.')
    result = bundle(args.source.read_text(encoding='utf-8'))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(result, encoding='utf-8')
    print(args.output.resolve())
