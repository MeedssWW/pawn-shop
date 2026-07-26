import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://pawn-shop.test/", {
      headers: {
        accept: "text/html",
        host: "pawn-shop.test",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the midnight pawn shop and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Ломбард после полуночи/);
  assert.match(html, /GOLDEN CORNER/);
  assert.match(html, /НОЧНАЯ СМЕНА/);
  assert.match(html, /Беззеркальная камера/);
  assert.match(html, /https:\/\/pawn-shop\.test\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Брейнрот/);
});

test("ships the complete visitor screening loop and original artwork", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const VISITORS: Visitor\[\] = \[/);
  assert.match(page, /triggerAlarm/);
  assert.match(page, /useAction/);
  assert.match(page, /repairItem/);
  assert.match(page, /sellItem/);
  assert.match(page, /CASES_PER_NIGHT/);
  assert.match(page, /window\.localStorage/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/scenes/pawnshop.webp", import.meta.url));
  await access(new URL("../public/characters/max.webp", import.meta.url));
  await access(new URL("../public/customers/max.webp", import.meta.url));
  await access(new URL("../public/items/camera.webp", import.meta.url));
  await access(new URL("../public/anomaly-reveal.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", root)));
});
