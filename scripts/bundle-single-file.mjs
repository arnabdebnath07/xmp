// Fold dist/ into one self-contained .html: every asset becomes a data URI,
// the module script and stylesheet go inline. Opens from file://, no server.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const DIST = process.argv[2];
const OUT = process.argv[3];

const TYPES = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.woff2': 'font/woff2',
};

let html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assets = readdirSync(join(DIST, 'assets'));

const jsName = assets.find((f) => f.endsWith('.js'));
const cssName = assets.find((f) => f.endsWith('.css'));
let js = readFileSync(join(DIST, 'assets', jsName), 'utf8');
let css = readFileSync(join(DIST, 'assets', cssName), 'utf8');

// every media file becomes a data URI
const uris = new Map();
for (const file of assets) {
  const mime = TYPES[extname(file)];
  if (!mime) continue;
  const b64 = readFileSync(join(DIST, 'assets', file)).toString('base64');
  uris.set(file, `data:${mime};base64,${b64}`);
}

// a relative-base build emits `new URL("name.webp", import.meta.url).href`,
// which can't resolve from an inline script — swap the whole expression out
let missed = [];
js = js.replace(/new URL\("([^"]+)",\s*import\.meta\.url\)\.href/g, (whole, file) => {
  const uri = uris.get(basename(file));
  if (!uri) { missed.push(file); return whole; }
  return JSON.stringify(uri);
});

// plain references (stylesheet url(), any leftover string paths)
for (const [file, uri] of uris) {
  for (const ref of [`./assets/${file}`, `assets/${file}`, `/assets/${file}`, `./${file}`]) {
    css = css.split(ref).join(uri);
    js = js.split(ref).join(uri);
  }
}

if (missed.length) console.warn('UNRESOLVED:', missed.slice(0, 8));
const stillRelative = [...js.matchAll(/new URL\("[^"]+",\s*import\.meta\.url\)/g)];
if (stillRelative.length) console.warn('still relative:', stillRelative.length);

// a closing tag inside a string literal would end the block early
js = js.split('</script').join('<\\/script');

// NB: replacer functions, not strings — a bundle is full of $& and $' which
// String.replace would expand and shred the code
html = html
  .replace(/<script[^>]*src="[^"]*\.js"[^>]*><\/script>/,
    () => `<script type="module">\n${js}\n</script>`)
  .replace(/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/,
    () => `<style>\n${css}\n</style>`);

writeFileSync(OUT, html);
console.log(`${OUT} — ${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB`);
