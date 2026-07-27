import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("yandex-dist");
const indexPath = resolve(root, "index.html");
const maxUncompressedBytes = 100 * 1024 * 1024;

async function collectFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collectFiles(absolute, relative));
    else result.push({ relative, absolute, size: (await stat(absolute)).size });
  }
  return result;
}

await access(indexPath);
const html = await readFile(indexPath, "utf8");
const files = await collectFiles(root);
const fileNames = new Set(files.map(({ relative }) => relative.replaceAll("\\", "/")));

assert.equal(files.filter(({ relative }) => relative === "index.html").length, 1, "ZIP root must contain exactly one index.html");
assert.ok(!html.includes("/pawn-shop/"), "Yandex build still contains the GitHub Pages base path");
assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/, "Yandex build contains a root-absolute asset path");

for (const match of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) {
  const relative = match[1].replace(/^\.\//, "").split(/[?#]/)[0];
  assert.ok(fileNames.has(relative), `Referenced file is missing: ${relative}`);
}

for (const { relative } of files) {
  assert.match(relative, /^[\x20-\x7E]+$/, `Non-ASCII archive path: ${relative}`);
  assert.ok(!relative.includes(" "), `Archive path contains spaces: ${relative}`);
}

const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
assert.ok(totalBytes <= maxUncompressedBytes, `Uncompressed build is larger than 100 MB: ${totalBytes}`);

async function assertPngSize(relativePath, width, height) {
  const buffer = await readFile(resolve(relativePath));
  assert.equal(buffer.toString("hex", 0, 8), "89504e470d0a1a0a", `${relativePath} is not a PNG`);
  assert.equal(buffer.readUInt32BE(16), width, `${relativePath} has the wrong width`);
  assert.equal(buffer.readUInt32BE(20), height, `${relativePath} has the wrong height`);
}

await assertPngSize("yandex-release/media/icon-512.png", 512, 512);
await assertPngSize("yandex-release/media/cover-800x470.png", 800, 470);
await assertPngSize("yandex-release/media/screenshot-mobile-1.png", 810, 1440);
await assertPngSize("yandex-release/media/screenshot-mobile-2.png", 810, 1440);
await assertPngSize("yandex-release/media/screenshot-desktop-1.png", 1280, 720);
await assertPngSize("yandex-release/media/screenshot-desktop-2.png", 1280, 720);

const sdkSource = await readFile(resolve("github-pages/systems/YandexSDK.js"), "utf8");
const mainSource = await readFile(resolve("github-pages/main.js"), "utf8");
assert.match(sdkSource, /sdk\.games\.s3\.yandex\.net\/sdk\.js/);
assert.match(sdkSource, /LoadingAPI\?\.ready/);
assert.match(sdkSource, /GameplayAPI\?\.start/);
assert.match(sdkSource, /GameplayAPI\?\.stop/);
assert.match(sdkSource, /showFullscreenAdv/);
assert.match(sdkSource, /showRewardedVideo/);
assert.match(mainSource, /showAdWithAudioPaused/);
assert.match(mainSource, /audio\.pause\(\)/);
assert.match(mainSource, /audio\.resume\(\)/);

console.log(`Yandex build validated: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB uncompressed.`);
