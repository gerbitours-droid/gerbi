import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareStaticAssets } from '../scripts/prepare-vercel.mjs';

test('deployment assets preserve all browser files and shared module exports', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'gerbi-static-'));
  const output = path.join(temporary, 'public');
  const source = fileURLToPath(new URL('../dist/', import.meta.url));
  try {
    await prepareStaticAssets(output);
    await prepareStaticAssets(output);
    for (const relative of await readdir(source, { recursive: true })) {
      const original = path.join(source, relative);
      if (!(await stat(original)).isFile()) continue;
      const target = path.join(output, relative);
      assert.deepEqual(await readFile(target), await readFile(original), relative);
    }
    const personalization = await import(pathToFileURL(path.join(output, 'personalization.mjs')));
    assert.equal(typeof personalization.selectedStyles, 'function');
    assert.equal(typeof personalization.rankInspirations, 'function');
    assert.ok(personalization.styles.length > 0);
    const files = await readdir(output);
    assert.equal(files.includes('.env'), false);
    assert.equal(files.includes('server.mjs'), false);
    assert.equal(files.includes('backend'), false);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
