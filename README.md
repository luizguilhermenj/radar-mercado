# Radar Mercado

Projeto do radar/dashboard do índice com:

- login com sessão
- painel principal do radar
- área administrativa para criação e manutenção de usuários
- backend Express organizado em `src/`
- banco SQLite local para autenticação
- cache de cotações para reduzir chamadas externas

## Estrutura

```text
src/
  app.js
  server.js
  config/
  db/
  middleware/
  routes/
  services/
  utils/

views/
  login.html
  app.html
  admin.html

public/
  assets/
    css/
    js/

data/
  auth.db
```

## Rodar local

```bash
npm install
npm start
```

## Variáveis opcionais

Copie `.env.example` se quiser personalizar:

- `PORT`
- `SESSION_SECRET`
- `MASTER_USERNAME`
- `MASTER_PASSWORD`
- `MARKET_CACHE_TTL_MS`
- `MARKET_REQUEST_TIMEOUT_MS`

## Observações

- `data/auth.db` é um banco local e não deve ser versionado em produção.
- o projeto agora usa apenas `src/server.js` como entrada.
- arquivos legados duplicados da raiz foram removidos para evitar editar a versão errada.
