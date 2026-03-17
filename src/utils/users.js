function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('pt-BR');
}

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('pt-BR');
}

function formatUserRow(user) {
  const expiresIso = toIsoDate(user.expires_at);
  const createdIso = toIsoDate(user.created_at);

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    plan: user.plan,
    active: !!user.active,
    expires_at: formatDate(expiresIso),
    expires_at_iso: expiresIso,
    created_at: formatDateTime(createdIso),
    created_at_iso: createdIso
  };
}

module.exports = { formatUserRow, toIsoDate };
