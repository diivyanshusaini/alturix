// End-to-end API test against a throwaway data dir.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import assert from 'node:assert/strict';
process.env.ALTURIX_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'alturix-'));
process.env.ALTURIX_NO_LISTEN = '1'; process.env.ADMIN_PASSWORD = 'test-password-123';
const { default: app } = await import('./index.js');
const srv = app.listen(0); const base = `http://localhost:${srv.address().port}`;
let cookie = '';
const call = async (m, u, body, raw) => {
  const h = { 'x-requested-with': 'alturix', cookie }; if (body && !raw) h['content-type'] = 'application/json';
  const r = await fetch(base + u, { method: m, headers: h, body: raw ? body : body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; } return { s: r.status, j };
};
const pub = async (u) => (await fetch(base + u)).status;
const ok = (n) => console.log('  ✓', n);

assert.equal((await call('GET', '/api/admin/projects')).s, 401); ok('admin API locked when logged out');
assert.equal((await call('POST', '/api/auth/login', { password: 'nope' })).s, 401); ok('wrong password rejected');
assert.equal((await call('POST', '/api/auth/login', { password: 'test-password-123' })).s, 200); ok('login');

const fd = new FormData();
fd.append('files', new Blob([Buffer.alloc(2048, 1)], { type: 'video/mp4' }), 'My Reel.mp4');
fd.append('files', new Blob([Buffer.alloc(512, 2)], { type: 'image/png' }), 'thumb.png');
fd.append('files', new Blob(['x'], { type: 'application/zip' }), 'bad.zip');
const up = await call('POST', '/api/admin/assets', fd, true);
assert.equal(up.j.length, 2); const [vid, img] = up.j; ok('multi upload (zip filtered out)');
assert.equal(await pub(vid.url), 200 === 1 ? 0 : 404); ok('unpublished media is NOT public');

const p = (await call('POST', '/api/admin/projects', { title: 'Test Reel', section: 'video' })).j;
assert.equal((await call('POST', `/api/admin/projects/${p.id}/status`, { status: 'published' })).s, 422); ok('publish blocked without cover/summary');
await call('PUT', `/api/admin/projects/${p.id}`, { cover_asset_id: img.id, summary: 'A test.', contribution: 'speculative', assets: [{ id: vid.id, role: 'final' }] });
await call('PATCH', `/api/admin/assets/${vid.id}`, { poster_asset_id: img.id });
assert.equal(await pub('/api/public/projects/test-reel'), 404); ok('draft not in public API');
assert.equal((await call('DELETE', `/api/admin/assets/${vid.id}`)).s, 409); ok('in-use asset cannot be deleted');
assert.equal((await call('POST', `/api/admin/projects/${p.id}/status`, { status: 'published' })).s, 200); ok('publish');
assert.equal(await pub('/api/public/projects/test-reel'), 200);
assert.equal(await pub(vid.url), 200); assert.equal(await pub(img.url), 200); ok('published media public');
const r = await fetch(base + vid.url, { headers: { range: 'bytes=0-9' } }); assert.equal(r.status, 206); ok('video range requests');
await call('POST', `/api/admin/projects/${p.id}/status`, { status: 'unpublished' });
assert.equal(await pub(vid.url), 404); assert.equal(await pub('/api/public/projects/test-reel'), 404); ok('unpublish hides project and media');

assert.equal((await fetch(base + '/api/public/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'A', email: 'a@b.co', body: 'Hello there' }) })).status, 200);
assert.equal((await call('GET', '/api/admin/messages')).j.length, 1); ok('contact form → inbox');
assert.equal((await call('POST', '/api/admin/projects', { title: 'x' }, false)).s, 200);
const noHdr = await fetch(base + '/api/admin/projects', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' }); assert.equal(noHdr.status, 403); ok('CSRF header enforced');
console.log('ALL BACKEND TESTS PASSED'); srv.close(); process.exit(0);
