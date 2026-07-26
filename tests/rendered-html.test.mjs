import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://memobeasts.test/", {
      headers: {
        accept: "text/html",
        host: "memobeasts.test",
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

test("server-renders the complete game shell and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Создай Брейнрота: Лаборатория Мутаций/);
  assert.match(html, /Лаборатория мутаций/);
  assert.match(html, /ИСПЫТАТЕЛЬНАЯ КАМЕРА/);
  assert.match(html, /Gattino Spaghettino/);
  assert.match(html, /https:\/\/memobeasts\.test\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the core progression, monetization hooks and final artwork", async () => {
  const [page, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const creatures: Creature\[\] = \[/);
  assert.match(page, /mergeCreatures/);
  assert.match(page, /startBattle/);
  assert.match(page, /showRewardedVideo/);
  assert.match(page, /LoadingAPI\?\.ready/);
  assert.match(page, /GameplayAPI\?\.start/);
  assert.match(page, /yandexPlayer\?\.setData/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", root)));
});
