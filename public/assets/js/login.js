import { apiFetch } from './modules/api.js';

async function verificarSessaoExistente() {
  try {
    try {
      await apiFetch('/api/me');
      window.location.href = '/app';
    } catch {}
  } catch {}
}

async function onSubmit(event) {
  event.preventDefault();
  const status = document.getElementById('loginStatus');
  status.className = 'auth-status';
  status.textContent = 'Entrando...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    status.classList.add('success');
    status.textContent = 'Login realizado. Redirecionando...';
    window.location.href = '/app';
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message;
  }
}

document.getElementById('loginForm').addEventListener('submit', onSubmit);
verificarSessaoExistente();
