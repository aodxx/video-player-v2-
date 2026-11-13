import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const request = (url, init = {}) => new Request(`https://worker.example${url}`, init);

async function withFetch(stub, run) {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try { await run(); } finally { globalThis.fetch = original; }
}

test('rejects destinations outside video.twimg.com before upstream fetch', async () => {
  let called = false;
  await withFetch(async () => { called = true; }, async () => {
    const response = await worker.fetch(request('/?url=https%3A%2F%2Fexample.com%2Fvideo.mp4'));
    assert.equal(response.status, 400);
  });
  assert.equal(called, false);
});

test('rejects a redirect to a different host', async () => {
  await withFetch(async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { location: 'https://attacker.example/private' } });
  }, async () => {
    const response = await worker.fetch(request('/?url=https%3A%2F%2Fvideo.twimg.com%2Fclip.mp4'));
    assert.equal(response.status, 502);
  });
});

test('follows an allowed redirect and preserves Range with partial response headers', async () => {
  const calls = [];
  await withFetch(async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) return new Response(null, { status: 302, headers: { location: '/media.mp4' } });
    return new Response('part', { status: 206, headers: { 'content-range': 'bytes 10-13/100', 'accept-ranges': 'bytes' } });
  }, async () => {
    const response = await worker.fetch(request('/?url=https%3A%2F%2Fvideo.twimg.com%2Fclip.mp4', { headers: { range: 'bytes=10-13' } }));
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), 'bytes 10-13/100');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.headers.get('range'), 'bytes=10-13');
  });
});

test('stops redirect loops after a bounded number of hops', async () => {
  let calls = 0;
  await withFetch(async () => {
    calls += 1;
    return new Response(null, { status: 302, headers: { location: '/again.mp4' } });
  }, async () => {
    const response = await worker.fetch(request('/?url=https%3A%2F%2Fvideo.twimg.com%2Fclip.mp4'));
    assert.equal(response.status, 502);
  });
  assert.ok(calls <= 4);
});
