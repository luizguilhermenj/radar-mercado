async function verificarSessaoExistente() {
  try {
    const response = await fetch('/api/me', { cache: 'no-store' });
    if (response.ok) window.location.href = '/app';
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
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao entrar');
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
