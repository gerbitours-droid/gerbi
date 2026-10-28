import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import * as entrypoint from '../server.mjs';
import apiServer from '../api/[...path].mjs';

test('imported entrypoint exposes a server without opening a local port', async () => {
  const server = entrypoint.default;
  assert.ok(server instanceof Server, 'The deployment runtime needs a default HTTP server export');
  assert.equal(apiServer, server);
  assert.equal(server.listening, false);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [pathname, contentType] of [
      ['/', 'text/html'],
      ['/style.css', 'text/css'],
      ['/app.js', 'text/javascript'],
      ['/assets/hero.png', 'image/png']
    ]) {
      const response = await fetch(`${base}${pathname}`);
      assert.equal(response.status, 200, pathname);
      assert.ok(response.headers.get('content-type').startsWith(contentType), pathname);
      assert.ok((await response.arrayBuffer()).byteLength > 0, pathname);
    }
    const tags = await fetch(`${base}/api/tags`);
    assert.equal(tags.status, 200);
    assert.ok((await tags.json()).facets.length > 0);
    const invalid = await fetch(`${base}/api/ai/understand`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error, 'invalid_json');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
