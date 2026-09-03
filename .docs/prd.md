# PRD — Backend do Iffod

## 1. Visão geral

O Mesocorre é uma plataforma que conecta clientes que precisam de um serviço de emergência (chaveiro, encanador, eletricista, vidraceiro, ar-condicionado etc.) com prestadores próximos e disponíveis. O backend é único e compartilhado pelos três tipos de usuário (cliente, prestador, admin), cada um com permissões diferentes.

## 2. Stack tecnológica

- Node.js + TypeScript
- Express (API REST)
- Prisma ORM (adapter-pg)
- PostgreSQL hospedado no Neon
- **bcrypt para hash/proteção da senha** (sem JWT — sem sistema de sessão via token de autenticação)
- zod para validação
- Google Gemini API (resumo de avaliações)
- Google Maps API (localização/mapas)
- Testes de rota feitos com **Bruno**

## 3. Estrutura de pastas

```
backend/
│
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── client.controller.ts
│   │   ├── provider.controller.ts
│   │   ├── category.controller.ts
│   │   ├── request.controller.ts
│   │   ├── review.controller.ts
│   │   ├── matching.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── client.service.ts
│   │   ├── provider.service.ts
│   │   ├── category.service.ts
│   │   ├── request.service.ts
│   │   ├── review.service.ts
│   │   ├── matching.service.ts
│   │   ├── gemini.service.ts
│   │   └── admin.service.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── client.routes.ts
│   │   ├── provider.routes.ts
│   │   ├── category.routes.ts
│   │   ├── request.routes.ts
│   │   ├── review.routes.ts
│   │   ├── matching.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── middlewares/
│   │   ├── role.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── gemini.ts
│   │   └── maps.ts
│   │
│   ├── types/
│   ├── utils/
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

> Base de partida: repositório de exemplo `github.com/duds-maia/trabalho_edecio`, reaproveitando o esqueleto técnico (Express + TS + Prisma adapter-pg + PostgreSQL + bcrypt + zod) e adaptando a estrutura de pastas para o padrão em camadas acima (controllers/services/routes/middlewares).

## 4. Modelo de dados (entidades principais)

- **Cliente**: id, nome, email, senha (hash), telefone, endereço, latitude, longitude
- **Prestador**: id, categoriaId, nome, email, senha (hash), telefone, avaliação, status, adminId, endereço, latitude, longitude, localizacaoAtualizadaEm
- **Categoria**: id, nome, descrição
- **Solicitação**: id, clienteId, prestadorId, categoriaId, descrição, endereço, latitude, longitude, tipoAtendimento, dataAgendamento, status, valor, fotoUrl
- **Admin**: id, nome, email, senha (hash)

### Status do prestador (regra de negócio importante)

```
PENDENTE → ANÁLISE DO ADMIN → APROVADO / REPROVADO
APROVADO → pode ficar SUSPENSO (temporário) ou BANIDO (permanente)
```

Somente prestadores com status **APROVADO** e disponibilidade **DISPONÍVEL** entram no matching.

## 5. Regras de negócio importantes

1. **Proteção da senha**: a senha nunca é armazenada em texto puro — é protegida com hash via bcrypt (token de proteção embutido no próprio hash/salt). Não há geração de JWT nem de token de sessão separado; a validação de identidade acontece a partir do e-mail + senha em cada operação sensível.
2. **Gemini fica exclusivamente no backend**: a chave da API nunca é exposta ao frontend. O frontend só consome `GET /providers/:id/review-summary`.
3. **Gemini não decide matching**: a IA apenas resume avaliações; o matching é calculado pelo `matching.service.ts` com base em categoria + localização + status aprovado + disponibilidade.
4. **Controle de custo da IA**: armazenar/reutilizar o resumo do Gemini em vez de gerar a cada acesso; atualizar apenas quando houver quantidade relevante de novas avaliações.
5. **Prestador pendente/reprovado/suspenso/banido nunca aparece no matching.**
6. **A `DATABASE_URL` do Neon fica só no `.env`, nunca no código nem no GitHub.**

## 6. Etapas de desenvolvimento

### Etapa 0 — Preparar o repositório base ✅ CONCLUÍDA
0.1. Apagar rotas específicas do domínio de veículos (`carros.ts`, `clientes.ts`, `login.ts`, `marcas.ts`, `propostas.ts`). ✅
0.2. Apagar `prisma/schema.prisma`, `prisma/seed.ts` e `prisma/migrations/`. ✅
0.3. Apagar `services/iaServices.ts` (fica só como referência de padrão, não é reaproveitado). ✅
0.4. Manter `package.json`, `tsconfig.json`, `prisma.config.ts` e `lib/prisma.ts`. ✅

### Etapa 1 — Configuração inicial do projeto 
1.1. Ajustar `name` e `description` no `package.json`. 
1.2. Remover a dependência `jsonwebtoken` (e `@types/jsonwebtoken`, se existir) do `package.json`, já que o projeto não vai usar JWT. 
1.3. Rodar `npm install` para confirmar que tudo instala sem erro. 

### Etapa 2 — Banco de dados (Neon) 
2.1. Criar conta/projeto no Neon. 
2.2. Copiar a connection string (`DATABASE_URL`). 
2.3. Criar `.env` e `.env.example` com `DATABASE_URL`, `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`. 
2.4. Confirmar que `.env` está no `.gitignore`. 

### Etapa 3 — Servidor mínimo 
3.1. Recriar `src/server.ts` com Express + cors + rota raiz de teste. 
3.2. Rodar `npm run dev` (ou `npx tsx watch src/server.ts`) e confirmar que o servidor sobe na porta esperada. 

### Etapa 4 — Modelagem do banco (schema) 
4.1. Definir o model `Cliente` no `schema.prisma`. 
4.2. Definir o model `Admin`. 
4.3. Definir o model `Categoria`. 
4.4. Definir o enum de status do prestador (`PENDENTE`, `APROVADO`, `REPROVADO`, `SUSPENSO`, `BANIDO`). 
4.5. Definir o model `Prestador` (com relação para `Categoria` e `Admin`). 
4.6. Definir o model `Solicitacao` (com relações para `Cliente`, `Prestador` e `Categoria`). 

### Etapa 5 — Migration e seed
5.1. Rodar a primeira migration (`npx prisma migrate dev --name init`).
5.2. Conferir as tabelas criadas no Neon.
5.3. (Opcional) Criar `prisma/seed.ts` com categorias iniciais (chaveiro, encanador, eletricista, vidraceiro, ar-condicionado).

### Etapa 6 — Proteção de senha (sem JWT)
6.1. Instalar `bcrypt` (já vem do repositório base) e `zod`.
6.2. Criar função utilitária de hash de senha em `utils/` (ex.: `hashPassword`, `comparePassword`).
6.3. Definir, junto com você, como cada tipo de usuário vai se manter "autenticado" nas próximas requisições sem JWT (ex.: reenviar e-mail/senha, ou outro mecanismo simples a combinar).

### Etapa 7 — Cadastro e login (cliente e prestador)
7.1. `auth.service.ts`: função de cadastro de cliente (valida e-mail duplicado, aplica hash na senha).
7.2. `auth.controller.ts` + `auth.routes.ts`: rota `POST /auth/client/register`.
7.3. Repetir 7.1 e 7.2 para prestador (`POST /auth/provider/register`, status inicial `PENDENTE`).
7.4. `POST /auth/login`: validação de e-mail + senha (comparando hash) para cliente e prestador.

### Etapa 8 — Login e permissões do admin
8.1. Cadastro do admin (pode ser via seed, sem rota pública de registro).
8.2. `POST /auth/login` cobrindo também o admin.
8.3. `role.middleware.ts`: middleware simples para restringir rotas por tipo de usuário (cliente/prestador/admin), com base no mecanismo definido na Etapa 6.3.

### Etapa 9 — CRUD de clientes
9.1. `GET /clients/:id` — visualizar perfil.
9.2. `PUT /clients/:id` — editar dados cadastrais.

### Etapa 10 — CRUD de categorias
10.1. `GET /categories` — listagem pública.
10.2. `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id` — restritos ao admin.

### Etapa 11 — Perfil e disponibilidade do prestador
11.1. `GET /providers/:id` e `PUT /providers/:id` — visualizar/editar perfil.
11.2. `PATCH /providers/:id/status` — atualizar disponibilidade (`DISPONÍVEL` / `INDISPONÍVEL`).
11.3. `PATCH /providers/:id/location` — atualizar localização em tempo real.

### Etapa 12 — Criação de solicitações
12.1. `POST /requests` — cliente cria solicitação (categoria, descrição, foto, endereço, localização, tipo de atendimento).
12.2. `GET /requests` e `GET /requests/:id` — listar/detalhar.

### Etapa 13 — Ciclo de vida da solicitação
13.1. `PATCH /requests/:id/provider` — prestador aceita a solicitação.
13.2. `PATCH /requests/:id/status` — iniciar/concluir atendimento.
13.3. `PATCH /requests/:id/value` — informar valor final.

### Etapa 14 — Matching
14.1. `matching.service.ts`: buscar prestadores por categoria + status `APROVADO` + disponibilidade `DISPONÍVEL`.
14.2. Calcular distância entre prestador e local da solicitação.
14.3. Ordenar por proximidade.
14.4. `GET /providers/nearby` — expor o resultado do matching.

### Etapa 15 — Avaliações
15.1. `POST /reviews` — cliente avalia prestador após conclusão.
15.2. Recalcular avaliação média do prestador.
15.3. `GET /providers/:id/reviews` — listar avaliações.

### Etapa 16 — Integração com Gemini
16.1. `lib/gemini.ts` — configurar client do Gemini com `GEMINI_API_KEY`.
16.2. `gemini.service.ts` — montar prompt com as avaliações, usar `responseSchema` para retorno estruturado.
16.3. Salvar/atualizar o resumo gerado no `Prestador`.
16.4. `GET /providers/:id/review-summary` — expor o resumo pronto.

### Etapa 17 — Integração com Google Maps
17.1. `lib/maps.ts` — funções auxiliares (geocodificação/distância), se necessário além do cálculo já feito no matching.

### Etapa 18 — Painel administrativo
18.1. `GET /admin/providers?status=PENDENTE` — listar por status.
18.2. `PATCH /admin/providers/:id/approve` e `.../reject`.
18.3. `PATCH /admin/providers/:id/suspend` e `.../ban`.
18.4. `GET /admin/reviews`, `GET /admin/requests`, `GET /admin/clients` — visão geral para o admin.

### Etapa 19 — Testes das rotas
19.1. Criar coleção no **Bruno**.
19.2. Cobrir autenticação, clientes, categorias, prestadores, solicitações, matching, avaliações e admin.

## 7. Principais endpoints

```
POST   /auth/client/register
POST   /auth/provider/register
POST   /auth/login

GET    /categories
POST   /categories
PUT    /categories/:id
DELETE /categories/:id

GET    /providers
GET    /providers/:id
PUT    /providers/:id
PATCH  /providers/:id/location
PATCH  /providers/:id/status
GET    /providers/nearby
GET    /providers/:id/review-summary

POST   /requests
GET    /requests
GET    /requests/:id
PATCH  /requests/:id/status
PATCH  /requests/:id/provider
PATCH  /requests/:id/value

POST   /reviews
GET    /providers/:id/reviews

# Admin
GET    /admin/providers?status=PENDENTE
PATCH  /admin/providers/:id/approve
PATCH  /admin/providers/:id/reject
PATCH  /admin/providers/:id/suspend
PATCH  /admin/providers/:id/ban
```

## 8. Variáveis de ambiente

```
DATABASE_URL=
GEMINI_API_KEY=
GOOGLE_MAPS_API_KEY=
```