const modal = document.querySelector('#modal');
const openModal = () => modal.classList.add('open');
document.querySelector('#newTask').addEventListener('click', openModal);
document.querySelector('#openReport').addEventListener('click', openModal);
document.querySelector('#closeModal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });
document.querySelectorAll('.modal div button').forEach((button) => button.addEventListener('click', () => {
  button.innerHTML = '✓ <b>已创建任务</b><small>AI 顾问正在为你准备内容</small>';
  setTimeout(() => modal.classList.remove('open'), 650);
}));
