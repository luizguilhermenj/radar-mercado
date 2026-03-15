import { apiFetch } from './modules/api.js';

let usersCache = [];

async function carregarSessao() {
  let user;
  try {
    user = await apiFetch('/api/me');
  } catch (error) {
    window.location.href = '/login';
    return null;
  }
  if (user.role !== 'master') {
    window.location.href = '/app';
    return null;
  }
  document.getElementById('sessionUser').textContent = `Logado como ${user.username} • ${user.role}`;
  return user;
}

async function logout() {
  try { await apiFetch('/api/logout', { method: 'POST' }); } finally { window.location.href = '/login'; }
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

function formatDateInput(value) {
  if (!value || value === '--') return '';
  const parts = String(value).split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function atualizarKpis(users) {
  const total = users.length;
  const ativos = users.filter(u => u.active).length;
  const hoje = new Date();
  const expiring = users.filter(u => {
    const raw = formatDateInput(u.expires_at);
    if (!raw) return false;
    const diff = (new Date(raw).getTime() - hoje.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiActive').textContent = ativos;
  document.getElementById('kpiExpiring').textContent = expiring;
}

async function carregarUsuarios() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="7">Carregando usuários...</td></tr>';
  let users;
  try {
    users = await apiFetch('/api/users');
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="7">Falha ao carregar usuários.</td></tr>';
    return;
  }
  usersCache = users;
  atualizarKpis(users);

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${escapeHtml(user.username)}</td>
      <td><span class="admin-chip ${user.role}">${escapeHtml(user.role)}</span></td>
      <td><span class="admin-chip plan">${escapeHtml(user.plan || '--')}</span></td>
      <td><span class="admin-chip ${user.active ? 'active' : 'inactive'}">${user.active ? 'ativo' : 'inativo'}</span></td>
      <td>${escapeHtml(user.expires_at || '--')}</td>
      <td>${escapeHtml(user.created_at || '--')}</td>
      <td>
        <div class="admin-actions">
          <button class="admin-link-button" type="button" data-id="${user.id}" data-action="edit">Editar</button>
          <button class="admin-link-button" type="button" data-id="${user.id}" data-action="toggle">${user.active ? 'Desativar' : 'Ativar'}</button>
        </div>
      </td>
    </tr>`).join('');
}

async function criarUsuario(event) {
  event.preventDefault();
  const status = document.getElementById('adminStatus');
  status.className = 'admin-status';
  status.textContent = 'Criando usuário...';
  const payload = {
    username: document.getElementById('newUsername').value.trim(),
    password: document.getElementById('newPassword').value,
    role: document.getElementById('newRole').value,
    plan: document.getElementById('newPlan').value,
    expires_at: document.getElementById('newExpiresAt').value || null
  };
  try {
    const data = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    status.classList.add('success');
    status.textContent = `Usuário ${data.username} criado com sucesso.`;
    document.getElementById('createUserForm').reset();
    await carregarUsuarios();
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message;
  }
}

function preencherEdicao(user) {
  document.getElementById('editUserId').value = user.id;
  document.getElementById('editUsername').value = user.username || '';
  document.getElementById('editPassword').value = '';
  document.getElementById('editRole').value = user.role || 'subscriber';
  document.getElementById('editPlan').value = user.plan || 'monthly';
  document.getElementById('editExpiresAt').value = formatDateInput(user.expires_at);
  document.getElementById('editActive').value = String(!!user.active);
  ['editUsername','editPassword','editRole','editPlan','editExpiresAt','editActive','saveUserButton'].forEach(id => {
    document.getElementById(id).disabled = false;
  });
  document.getElementById('editStatus').textContent = `Editando ${user.username}`;
}

function limparEdicao() {
  document.getElementById('editUserForm').reset();
  document.getElementById('editUserId').value = '';
  ['editUsername','editPassword','editRole','editPlan','editExpiresAt','editActive','saveUserButton'].forEach(id => {
    document.getElementById(id).disabled = true;
  });
  const status = document.getElementById('editStatus');
  status.className = 'admin-status';
  status.textContent = '';
}

async function salvarEdicao(event) {
  event.preventDefault();
  const id = document.getElementById('editUserId').value;
  if (!id) return;
  const status = document.getElementById('editStatus');
  status.className = 'admin-status';
  status.textContent = 'Salvando alterações...';

  const payload = {
    username: document.getElementById('editUsername').value.trim(),
    password: document.getElementById('editPassword').value,
    role: document.getElementById('editRole').value,
    plan: document.getElementById('editPlan').value,
    expires_at: document.getElementById('editExpiresAt').value || null,
    active: document.getElementById('editActive').value === 'true'
  };

  try {
    const data = await apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    status.classList.add('success');
    status.textContent = `Usuário ${data.username} atualizado.`;
    await carregarUsuarios();
    preencherEdicao(data);
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message;
  }
}

async function onTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const user = usersCache.find(item => Number(item.id) === id);
  if (!user) return;

  if (action === 'edit') {
    preencherEdicao(user);
    return;
  }

  if (action === 'toggle') {
    let data;
    try {
      data = await apiFetch(`/api/users/${id}/toggle`, { method: 'POST' });
    } catch (error) {
      alert(error.message || 'Falha ao alterar status do usuário');
      return;
    }
    await carregarUsuarios();
    const updated = usersCache.find(item => Number(item.id) === id);
    if (updated) preencherEdicao(updated);
  }
}

document.getElementById('logoutButton').addEventListener('click', logout);
document.getElementById('createUserForm').addEventListener('submit', criarUsuario);
document.getElementById('editUserForm').addEventListener('submit', salvarEdicao);
document.getElementById('clearEditButton').addEventListener('click', limparEdicao);
document.getElementById('refreshUsers').addEventListener('click', carregarUsuarios);
document.getElementById('usersTableBody').addEventListener('click', onTableClick);

carregarSessao().then(user => { if (user) carregarUsuarios(); });
