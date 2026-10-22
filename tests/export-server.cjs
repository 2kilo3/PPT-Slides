// Exercise the actual legacy export handler without installing a browser or exporting a deck.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const source = fs.readFileSync(path.join(__dirname, '../scripts/export-pdf.sh'), 'utf8');
const start = source.indexOf('const MIME_TYPES =');
const end = source.indexOf('// Find a free port', start);
assert(start >= 0 && end > start, 'Legacy server source must be present');
const makeServer = new Function('createServer', 'readFileSync', 'realpathSync', 'resolve', 'relative', 'isAbsolute', 'extname', 'SERVE_DIR', 'HTML_FILE',
  source.slice(start, end) + '\nreturn server;');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ppt-export-server-'));
const root = path.join(temporary, 'deck');
const outside = path.join(temporary, 'private');
fs.mkdirSync(root); fs.mkdirSync(outside);
fs.writeFileSync(path.join(root, 'index.html'), 'public deck');
fs.writeFileSync(path.join(root, 'with space.txt'), 'public asset');
fs.writeFileSync(path.join(outside, 'secret.txt'), 'private test fixture');
fs.symlinkSync(outside, path.join(root, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
const server = makeServer(http.createServer, fs.readFileSync, fs.realpathSync, path.resolve, path.relative, path.isAbsolute, path.extname, root, 'index.html');
const request = target => new Promise((resolve, reject) => {
  http.get({host: '127.0.0.1', port: server.address().port, path: target}, res => {
    let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk);
    res.on('end', () => resolve({status: res.statusCode, body}));
  }).on('error', reject);
});
(async () => {
  try {
    // Use the production listen statement, with only its promise result captured for the test.
    const listen = source.match(/server\.listen\(0, '127\.0\.0\.1', \(\) => resolve\(server\.address\(\)\.port\)\);/);
    assert(listen, 'Server must explicitly bind loopback');
    await new Promise(resolve => new Function('server', 'resolve', listen[0])(server, resolve));
    assert.equal(server.address().address, '127.0.0.1');
    assert.deepEqual(await request('/'), {status: 200, body: 'public deck'});
    assert.deepEqual(await request('/with%20space.txt?v=1'), {status: 200, body: 'public asset'});
    assert.equal((await request('/%2e%2e%2fprivate/secret.txt')).status, 403);
    assert.equal((await request('/link/secret.txt')).status, 403);
    assert.equal((await request('/%ZZ')).status, 400);
    assert.equal((await request('/missing.txt')).status, 404);
    assert.equal((await request('/')).status, 200, 'Malformed requests must not kill the server');
    console.log('Export server: normal assets, traversal, symlink, malformed URL and loopback checks passed.');
  } finally {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    assert.equal(fs.realpathSync(path.dirname(temporary)), fs.realpathSync(os.tmpdir()));
    assert(path.basename(temporary).startsWith('ppt-export-server-'));
    fs.rmSync(temporary, {recursive: true, force: true});
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
