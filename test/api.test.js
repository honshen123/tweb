const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawn } = require('node:child_process');

const port = 43173;
let server;

function request(path, options) {
  return fetch('http://127.0.0.1:' + port + path, options);
}
test.before(async () => {
  server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: '/tmp/store-ai-advisor-test-' + process.pid } });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', resolve);
    server.on('error', reject);
  });
});
test.after(() => server.kill());
test('serves bootstrap context without supplier details', async () => {
  const response = await request('/api/bootstrap');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.store.name, '半日闲茶舍');
  assert.deepEqual(body.data.capabilities.includes('真人口播成片'), true);
  assert.equal(JSON.stringify(body).includes('Coze'), false);
});
test('creates and lists a unified video task', async () => {
  const create = await request('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'test-video-task' }, body: JSON.stringify({ type: 'video' }) });
  const task = (await create.json()).data;
  assert.equal(create.status, 201);
  assert.match(task.detail, /真人口播视频服务/);
  const replay = await request('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'test-video-task' }, body: JSON.stringify({ type: 'video' }) });
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).data.id, task.id);
  const list = await request('/api/tasks');
  assert.equal((await list.json()).data[0].id, task.id);
});
test('rejects invalid task type', async () => {
  const response = await request('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'unknown' }) });
  assert.equal(response.status, 422);
});
