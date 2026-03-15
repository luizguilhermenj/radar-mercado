# Radar de Mercado — estrutura refatorada

Projeto reorganizado para facilitar manutenção no backend e no frontend.

## Estrutura

- `server.js`: bootstrap simples do servidor
- `src/app.js`: configuração central do Express
- `src/routes`: separação por domínio (`auth`, `users`, `market`, `pages`)
- `src/services/market`: integrações e regra do radar
- `src/db`: inicialização e migração do banco SQLite
- `src/middleware`: autenticação e autorização
- `src/utils`: helpers reutilizáveis
- `views`: páginas HTML
- `public/assets/css`: estilos
- `public/assets/js`: scripts do frontend
- `public/assets/js/modules`: helpers compartilhados do frontend

## Como rodar

```bash
npm install
npm run dev
```

ou

```bash
npm start
```

## O que mudou

- Backend dividido em módulos menores
- Rotas separadas por responsabilidade
- Lógica de mercado isolada em `services`
- Banco inicializado em um único lugar
- Frontend movido para `public/assets`
- JS do dashboard, login e admin separados do HTML

## Observação

O comportamento funcional foi mantido o mais próximo possível do projeto original, mas agora a base está pronta para evoluir com mais segurança.
