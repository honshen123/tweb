const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const port = Number(process.env.PORT || 4173);
const bodyLimit = Number(process.env.REQUEST_BODY_LIMIT || 65536);
const agents = [
  { id: 'video', name: '策划短视频', description: '从脚本到真人口播成片', icon: '✦' },
  { id: 'diagnosis', name: '经营诊断', description: '定位影响增长的关键机会', icon: '◌' },
  { id: 'marketing', name: '营销文案', description: '生成活动、团购与社媒文案', icon: '◎' },
  { id: 'service', name: '智能客服', description: '整理高意向咨询并建议回复', icon: '◒' },
];
let tasks = [
  { id: 'task-1001', title: '秋日新品真人口播短视频', detail: '脚本已生成，等待真人口播视频服务渲染', status: 'processing', statusLabel: '处理中', createdAt: '今天 09:20' },
  { id: 'task-1000', title: '桂花季团购套餐文案', detail: '已生成 3 个平台适配版本', status: 'completed', statusLabel: '已完成', createdAt: '昨天 16:48' },
];
const idempotencyResults = new Map();
function send(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  response.end(JSON.stringify(payload));
}
function parse(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > bodyLimit) reject(new Error('请求数据过大'));
    });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('请求格式错误')); } });
  });
}
function bootstrap() {
  return { user: { id: 'user-demo', name: '林女士' }, store: { id: 'store-demo', name: '半日闲茶舍', location: '杭州 · 西湖店' }, integration: { orchestration: 'content-agent', videoPipeline: 'avatar-video' }, capabilities: ['经营诊断', '营销策划', '智能客服', '内容策划', '真人口播成片'] };
}
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const requestId = request.headers['x-request-id'] || crypto.randomUUID();
  response.setHeader('X-Request-Id', requestId);
  try {
    if (request.method === 'GET' && url.pathname === '/api/bootstrap') return send(response, 200, { data: bootstrap() });
    if (request.method === 'GET' && url.pathname === '/api/agents') return send(response, 200, { data: agents });
    if (request.method === 'GET' && url.pathname === '/api/tasks') return send(response, 200, { data: tasks });
    if (request.method === 'POST' && url.pathname === '/api/tasks') {
      const input = await parse(request);
      const agent = agents.find((item) => item.id === input.type);
      if (!agent) return send(response, 422, { error: { code: 'INVALID_TASK_TYPE', message: '不支持的任务类型。' } });
      const idempotencyKey = request.headers['idempotency-key'];
      if (idempotencyKey && idempotencyResults.has(idempotencyKey)) return send(response, 200, { data: idempotencyResults.get(idempotencyKey) });
      const detail = agent.id === 'video' ? '内容策划已受理，真人口播视频服务将统一渲染成片' : 'AI 顾问已开始处理，将在任务中心同步结果';
      const task = { id: String(Date.now()), title: agent.name, detail, status: 'processing', statusLabel: '处理中', createdAt: '刚刚' };
      tasks = [task].concat(tasks);
      if (idempotencyKey) idempotencyResults.set(idempotencyKey, task);
      return send(response, 201, { data: task });
    }
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
    const file = await readFile(join(process.cwd(), safePath));
    response.writeHead(200, { 'Content-Type': mime[extname(safePath)] || 'application/octet-stream' });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') return send(response, 404, { error: { code: 'NOT_FOUND', message: '资源不存在。' } });
    return send(response, 400, { error: { code: 'BAD_REQUEST', message: error.message } });
  }
});
server.listen(port, () => console.log('门店AI顾问已启动: http://localhost:' + port));
