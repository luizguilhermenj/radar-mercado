function formatUserRow(user) {
  return {
    ...user,
    active: !!user.active,
    created_at: user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : '--',
    expires_at: user.expires_at ? new Date(user.expires_at).toLocaleDateString('pt-BR') : '--'
  };
}

module.exports = { formatUserRow };
