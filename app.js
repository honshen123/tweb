const modal = document.querySelector('#modal');

async function api(path, options) {
  const response = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error.message);
  return payload.data;
}
function flash(message) {
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  document.body.append(element);
  setTimeout(() => element.remove(), 3000);
}
async function loadContext() {
  const data = await api('/bootstrap');
  document.querySelector('.store span').childNodes[0].nodeValue = data.store.name;
  document.querySelector('.store small').textContent = data.store.location;
  document.querySelector('.profile span').childNodes[0].nodeValue = data.user.name;
}
async function createTask(type) {
  const task = await api('/tasks', { method: 'POST', body: JSON.stringify({ type }) });
  modal.classList.remove('open');
  flash('已创建「' + task.title + '」，AI 顾问正在处理。');
}
function openModal() { modal.classList.add('open'); }
document.querySelector('#newTask').addEventListener('click', openModal);
document.querySelector('#openReport').addEventListener('click', () => createTask('diagnosis').catch((error) => flash(error.message)));
document.querySelector('#closeModal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });
document.querySelectorAll('.modal div button').forEach((button, index) => {
  const types = ['video', 'diagnosis', 'marketing'];
  button.addEventListener('click', () => createTask(types[index]).catch((error) => flash(error.message)));
});
document.querySelectorAll('.task').forEach((button, index) => {
  const types = ['video', 'marketing', 'service'];
  button.addEventListener('click', () => createTask(types[index]).catch((error) => flash(error.message)));
});
loadContext().catch((error) => flash(error.message));
