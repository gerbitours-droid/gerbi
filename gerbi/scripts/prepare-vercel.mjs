import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { localizeHtml } from '../dist/i18n.mjs';

// Keep browser modules separate from the server bundle's tree-shaken copies.
// The English site (spec 21) is index.html rendered in English at /en/index.html.
export async function prepareStaticAssets(destination = new URL('../public/', import.meta.url)) {
  await cp(new URL('../dist/', import.meta.url), destination, { recursive: true });
  const base = destination instanceof URL ? destination : pathToFileURL(String(destination).replace(/\/?$/, '/'));
  const target = new URL('en/', base);
  await mkdir(target, { recursive: true });
  await writeFile(new URL('index.html', target), localizeHtml(await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'), 'en'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await prepareStaticAssets();
