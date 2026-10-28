import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Keep browser modules separate from the server bundle's tree-shaken copies.
export async function prepareStaticAssets(destination = new URL('../public/', import.meta.url)) {
  await cp(new URL('../dist/', import.meta.url), destination, { recursive: true });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await prepareStaticAssets();
