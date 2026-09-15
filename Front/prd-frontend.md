# PRD — Frontend do Me Socorre

## 1. Visão geral

O Me Socorre conecta clientes a prestadores de serviços locais. No MVP, o cliente pesquisa profissionais aprovados e disponíveis, escolhe diretamente um prestador e envia uma solicitação para ele. O prestador escolhido aceita e executa o atendimento; ao final, o cliente pode avaliar o serviço.

O frontend terá três áreas, com rotas e permissões próprias: cliente, prestador e administrador. Todas consomem a mesma API REST.

### Escopo do MVP

- Catálogo público de categorias e prestadores.
- Busca por nome, categoria ou endereço e filtro por categoria.
- Escolha manual de um prestador antes da criação da solicitação.
- Solicitações imediatas ou agendadas, com descrição, endereço e URL opcional de foto.
- Ciclo de atendimento, valor final e avaliação.
- Moderação de prestadores e visão geral da plataforma para o admin.
- Resumo de avaliações gerado pelo Gemini exclusivamente no backend.

Ficam fora do MVP: mapas, geolocalização, distância, rastreamento em tempo real, matching automático, pagamento, chat, notificações por e-mail e upload real de imagens.

## 2. Stack e integração

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- API base configurada por variável de ambiente (`VITE_API_URL`)

O `AuthContext` mantém token, usuário e perfil. O cliente HTTP envia `Authorization: Bearer <token>` nas rotas protegidas. O token contém apenas identidade e perfil; senha e credenciais do Gemini nunca chegam ao frontend.

## 3. Estrutura de pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── ProviderCard/
│   │   ├── Rating/
│   │   └── Loading/
│   ├── pages/
│   │   ├── auth/Login.tsx
│   │   ├── auth/Register.tsx
│   │   ├── client/Home.tsx
│   │   ├── client/Providers.tsx
│   │   ├── client/ProviderDetails.tsx
│   │   ├── client/NewRequest.tsx
│   │   ├── client/MyRequests.tsx
│   │   ├── client/RequestDetails.tsx
│   │   ├── client/Profile.tsx
│   │   ├── provider/Dashboard.tsx
│   │   ├── provider/Requests.tsx
│   │   ├── provider/RequestDetails.tsx
│   │   ├── provider/Profile.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── Providers.tsx
│   │       ├── Reviews.tsx
│   │       ├── Clients.tsx
│   │       ├── Requests.tsx
│   │       └── Categories.tsx
│   ├── contexts/AuthContext.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── client.service.ts
│   │   ├── provider.service.ts
│   │   ├── request.service.ts
│   │   ├── review.service.ts
│   │   ├── category.service.ts
│   │   └── admin.service.ts
│   ├── routes/AppRoutes.tsx
│   ├── types/
│   ├── hooks/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env
├── package.json
└── vite.config.ts
```

## 4. Modelo e estados usados pela interface

### Perfis

`CLIENT`, `PROVIDER` e `ADMIN`.

### Status de aprovação do prestador

`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` e `BANNED`.

Somente prestadores `APPROVED` com `isAvailable: true` aparecem na busca pública e podem receber novas solicitações. O cadastro de prestador começa como `PENDING`.

### Status da solicitação

`PENDING` → `ACCEPTED` → `IN_PROGRESS` → `COMPLETED`.

O cliente pode cancelar apenas uma solicitação própria `PENDING`. O prestador escolhido pode aceitar a solicitação, iniciar o atendimento e concluí-lo. O valor final é informado pelo prestador em `IN_PROGRESS` ou `COMPLETED`.

### Entidades exibidas

- **Usuário**: `id`, `nome`, `email`, `telefone`, `endereco`, `perfil`.
- **Prestador**: usuário, categoria, `statusAprovacao`, disponibilidade, destaque, média de avaliações e endereço.
- **Categoria**: `id`, `name`, `description`.
- **Solicitação**: cliente, prestador, categoria, descrição, endereço, tipo, data agendada, status, foto e valor final.
- **Avaliação**: nota de 1 a 5, comentário opcional e data.

## 5. Contrato da API consumido pelo frontend

### Rotas públicas

```
GET  /categories
GET  /providers?search={termo}&categoryId={id}
GET  /providers/:id
GET  /providers/:id/reviews
GET  /providers/:id/review-summary
```

`GET /providers` já retorna somente aprovados e disponíveis, prioriza `isFeatured` e depois `ratingAverage`. O frontend não deve tentar reproduzir essa regra nem exibir distância.

### Autenticação

```
POST /auth/client/register
POST /auth/provider/register
POST /auth/login
```

Cadastro de cliente: `nome`, `email`, `senha`, `telefone?`, `endereco?`.

Cadastro de prestador: os mesmos campos mais `idCategoria`. Após o cadastro, informar claramente que o perfil aguarda aprovação do admin.

Login: `email` e `senha`; salvar o `token` e o objeto `usuario` retornados. A sessão expira conforme o JWT do backend; logout deve remover os dados locais.

### Cliente e prestador autenticados

```
GET/PUT /clients/:id
GET/PUT /providers/:id
PATCH   /providers/:id/status

POST    /requests
GET     /requests?status={status}
GET     /requests/:id
PATCH   /requests/:id/provider
PATCH   /requests/:id/status
PATCH   /requests/:id/value
POST    /reviews
GET     /providers/:id/reviews
```

Criação de solicitação:

```json
{
	"idCategoria": 1,
	"idPrestador": "uuid-do-prestador-escolhido",
	"descricao": "Descrição com pelo menos 10 caracteres",
	"endereco": "Endereço do atendimento",
	"tipoAtendimento": "IMMEDIATE",
	"dataAgendamento": "2026-09-20T14:00:00.000Z",
	"fotoUrl": "https://exemplo.com/foto.jpg"
}
```

`dataAgendamento` é obrigatória para `SCHEDULED`, não deve ser enviada para `IMMEDIATE` e precisa estar no futuro. A tela deve selecionar o prestador antes de abrir o formulário ou manter essa seleção visível durante o preenchimento.

Avaliação:

```json
{
	"idSolicitacao": 1,
	"nota": 5,
	"comentario": "Atendimento rápido e resolveu o problema."
}
```

Só permitir avaliação para solicitação própria `COMPLETED` e ainda não avaliada. O backend bloqueia avaliações duplicadas.

### Administração

Todas as rotas exigem perfil `ADMIN`:

```
GET   /admin/dashboard
GET   /admin/providers?status={status}
PATCH /admin/providers/:id/approve
PATCH /admin/providers/:id/reject
PATCH /admin/providers/:id/suspend
PATCH /admin/providers/:id/ban
PATCH /admin/providers/:id/featured
GET   /admin/reviews
GET   /admin/requests
GET   /admin/clients

POST   /categories
PUT    /categories/:id
DELETE /categories/:id
```

O destaque recebe `{ "destaque": true|false }`. A exclusão de categoria pode falhar quando houver prestadores ou solicitações vinculados.

## 6. Regras e telas por perfil

### Cliente

- Home com categorias e busca de prestadores.
- Lista de prestadores com nome, categoria, endereço, disponibilidade, destaque e média de avaliações.
- Detalhe do prestador com avaliações e resumo identificado como “gerado por IA”. Tratar `503` do resumo sem bloquear a página.
- Novo pedido em fluxo curto: categoria → prestador escolhido → descrição → endereço → imediato/agendado → foto opcional → confirmação.
- Minhas solicitações com filtros por status, detalhes, cancelamento de pendente e avaliação após conclusão.
- Perfil próprio em `/clients/:id`.

### Prestador

- Dashboard com aprovação, disponibilidade e solicitações vinculadas ao próprio perfil.
- Toggle de disponibilidade via `PATCH /providers/:id/status`; desabilitar quando o perfil não estiver aprovado.
- Solicitações pendentes podem ser aceitas somente pelo prestador escolhido. Exibir ações conforme o status: aceitar, iniciar, concluir e informar valor final.
- Perfil com edição de nome, telefone, endereço e categoria.
- Prestador pendente, rejeitado, suspenso ou banido deve ver o motivo/estado, mas não aparecer como disponível.

### Admin

- Dashboard com clientes, avaliações, prestadores por status e solicitações por status.
- Gestão de prestadores por `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` e `BANNED`.
- Ações de aprovação, reprovação, suspensão, banimento e destaque, respeitando as transições rejeitadas pela API.
- Listagens gerais de avaliações, solicitações e clientes.
- CRUD de categorias.

## 7. UX, segurança e estados de interface

- Mobile-first, especialmente o fluxo de nova solicitação.
- Rotas protegidas por perfil; respostas `401`, `403`, `404`, `409` e `429` devem gerar mensagens compreensíveis.
- Não confiar em permissões apenas na interface: a API continua sendo a autoridade.
- Mostrar estados de carregamento, vazio, erro, sucesso e confirmação antes de ações irreversíveis.
- Usar os nomes apresentados pela API nos formulários, convertendo apenas para rótulos amigáveis na interface.
- Nunca armazenar senha, `DATABASE_URL`, `JWT_SECRET` ou `GEMINI_API_KEY` no frontend.

## 8. Etapas de desenvolvimento

### Etapa 1 — Setup

- Criar Vite + React + TypeScript, Tailwind CSS e React Router.
- Configurar `VITE_API_URL`, cliente HTTP, tratamento de erros e rotas protegidas.

### Etapa 2 — Base compartilhada

- Criar layout, componentes, estados de carregamento e identidade visual.
- Definir tipos TypeScript para entidades, perfis e enums do backend.

### Etapa 3 — Autenticação

- Implementar cadastro de cliente/prestador, login, logout, persistência opcional da sessão e redirecionamento por perfil.

### Etapa 4 — Fluxo do cliente

- Implementar categorias, busca/filtro, seleção manual do prestador, nova solicitação, acompanhamento e avaliação.

### Etapa 5 — Fluxo do prestador

- Implementar disponibilidade, perfil, caixa de solicitações, transições de atendimento e valor final.

### Etapa 6 — Fluxo do admin

- Implementar dashboard, moderação, destaque, listagens e CRUD de categorias.

### Etapa 7 — Responsividade e validação

- Revisar mobile, tablet e desktop.
- Validar permissões por perfil, estados de erro, transições inválidas e fluxo completo de cliente → prestador → avaliação.
