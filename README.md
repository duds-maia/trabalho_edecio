# Me Socorre

O **Me Socorre** é uma plataforma full stack que conecta clientes a prestadores de serviços locais, como chaveiros, encanadores, eletricistas e vidraceiros.

No MVP, o cliente pesquisa profissionais aprovados e disponíveis, escolhe quem receberá o pedido e acompanha o atendimento até a conclusão. Depois, pode avaliar o serviço. Prestadores administram sua disponibilidade e seus atendimentos, enquanto administradores moderam a plataforma.

## Funcionalidades

### Área pública

- Catálogo de categorias e prestadores.
- Busca por nome, categoria ou endereço.
- Perfil público do prestador com avaliações.
- Resumo das avaliações gerado por IA.

### Cliente

- Cadastro e login.
- Escolha manual de um prestador aprovado e disponível.
- Criação de solicitações imediatas ou agendadas.
- Acompanhamento e cancelamento de solicitações pendentes.
- Avaliação do prestador após a conclusão do serviço.

### Prestador

- Cadastro sujeito à aprovação de um administrador.
- Controle de disponibilidade.
- Aceite e acompanhamento das solicitações recebidas.
- Atualização do atendimento para `ACCEPTED`, `IN_PROGRESS` e `COMPLETED`.
- Registro do valor final do serviço.

### Administrador

- Dashboard com indicadores da plataforma.
- Aprovação, rejeição, suspensão e banimento de prestadores.
- Definição de prestadores em destaque.
- Gerenciamento de categorias.
- Consulta de clientes, solicitações e avaliações.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS e React Router |
| Backend | Node.js, TypeScript, Express 5, Zod, JWT e bcrypt |
| Banco de dados | PostgreSQL/Neon e Prisma 7 |
| Inteligência artificial | Google Gemini para resumir avaliações |
| Documentação da API | OpenAPI e Swagger UI |

## Estrutura do projeto

```text
.
├── Back/
│   ├── prisma/          # schema, migrations e seed
│   ├── src/
│   │   ├── lib/         # configuração do Gemini
│   │   ├── middlewares/ # autenticação, autorização e erros
│   │   ├── routes/      # rotas REST
│   │   ├── services/    # regras de integração com IA
│   │   └── server.ts    # configuração do Express
│   └── tests/           # roteiro de integração da API
└── Front/
    ├── public/
    └── src/
        ├── components/  # componentes compartilhados
        ├── contexts/    # sessão e autenticação
        ├── pages/       # páginas públicas e por perfil
        ├── routes/      # navegação e rotas protegidas
        ├── services/    # cliente da API
        ├── types/       # contratos TypeScript
        └── utils/
```

## Pré-requisitos

- Node.js `24.21.0`, versão indicada em [`Back/.nvmrc`](Back/.nvmrc), ou uma versão aceita pelo backend (`^22.23` ou `>=24.17`).
- npm.
- Um banco PostgreSQL. O projeto está preparado para usar o [Neon](https://neon.com/).
- Uma chave da API do Google Gemini, apenas se o resumo de avaliações por IA for utilizado.

## Como executar localmente

O frontend e o backend são projetos npm independentes. Use dois terminais.

### 1. Configure e inicie o backend

```bash
cd Back
npm install
```

Crie o arquivo de ambiente a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```bash
cp .env.example .env
```

Preencha o arquivo `Back/.env`:

```dotenv
# Conexão pooled usada pela aplicação
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"

# Conexão direta, sem pooler, usada pelo Prisma CLI e pelas migrations
DIRECT_URL="postgresql://usuario:senha@host/banco?sslmode=require"

JWT_SECRET="uma-chave-longa-e-segura"

# Usados pelo seed para criar o administrador inicial
ADMIN_NAME="Administrador"
ADMIN_EMAIL="admin@exemplo.com"
ADMIN_PASSWORD="uma-senha-segura"

CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
TRUST_PROXY=false

# Opcional
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
```

Depois, aplique as migrations, gere os dados iniciais e suba a API:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

> O seed cadastra as categorias iniciais. O administrador só é criado quando `ADMIN_EMAIL` e `ADMIN_PASSWORD` estão preenchidos.

### 2. Configure e inicie o frontend

Em outro terminal:

```bash
cd Front
npm install
```

Crie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```bash
cp .env.example .env
```

Para desenvolvimento local, mantenha:

```dotenv
VITE_API_URL=/api
```

Inicie a aplicação:

```bash
npm run dev
```

Abra `http://localhost:5173`. O Vite encaminha as chamadas de `/api` para `http://localhost:3000` durante o desenvolvimento.

## Acessos úteis

| Recurso | Endereço local |
| --- | --- |
| Aplicação web | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Health check | `http://localhost:3000/health` |
| Swagger UI | `http://localhost:3000/docs` |

## Fluxo principal

```text
Prestador se cadastra
        ↓
Administrador aprova o cadastro
        ↓
Prestador ativa sua disponibilidade
        ↓
Cliente escolhe o prestador e cria uma solicitação
        ↓
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
        ↓
Cliente avalia o atendimento
```

Regras importantes:

- Apenas prestadores `APPROVED` e disponíveis aparecem no catálogo público.
- A solicitação pertence ao prestador escolhido pelo cliente; outro prestador não pode acessá-la ou aceitá-la.
- O cliente pode cancelar somente uma solicitação própria em `PENDING`.
- Cada solicitação concluída aceita no máximo uma avaliação.
- Categorias vinculadas a prestadores ou solicitações não podem ser excluídas.
- O Gemini apenas resume avaliações existentes; ele não escolhe nem aprova prestadores.

## Scripts disponíveis

### Backend

Execute dentro de `Back/`:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API em modo de desenvolvimento |
| `npm start` | Inicia a API sem o modo watch |
| `npm run build` | Gera o Prisma Client e valida o TypeScript |
| `npm run db:seed` | Cadastra categorias e o admin opcional |
| `npm run test:integration` | Testa o fluxo principal e as regras críticas |
| `npm run swagger` | Atualiza `swagger-output.json` |

### Frontend

Execute dentro de `Front/`:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Valida o TypeScript e gera a versão de produção |
| `npm run lint` | Executa o ESLint |
| `npm run preview` | Abre localmente a versão de produção gerada |

## Testes e validação

Com um banco de teste configurado no `Back/.env`, execute:

```bash
cd Back
npm run build
npm run test:integration
```

O teste de integração cria dados temporários, valida autenticação, permissões, CORS, categorias, prestadores, solicitações, avaliações e cache do resumo por IA, e remove os dados ao terminar. Por segurança, prefira um banco ou branch de banco dedicado a testes.

Para validar o frontend:

```bash
cd Front
npm run lint
npm run build
```

## Segurança e configuração

- Não envie arquivos `.env`, tokens ou credenciais para o Git.
- As rotas protegidas esperam `Authorization: Bearer <token>`.
- O JWT contém somente o identificador e o perfil do usuário.
- As senhas são armazenadas como hash bcrypt e nunca retornadas pela API.
- Configure `CORS_ORIGINS` com as origens reais do frontend em produção.
- Ative `TRUST_PROXY=true` somente atrás de um proxy reverso confiável.

## Limites do MVP

Ainda não fazem parte desta versão: pagamentos, chat, notificações por e-mail, upload real de imagens, mapas, geolocalização, cálculo de distância, rastreamento em tempo real e seleção automática de prestadores.

## Documentação complementar

- [Brain dump do backend](Back/.docs/brain-dump.md)
- [PRD do backend](Back/.docs/prd.md)
- [PRD do frontend](Front/prd-frontend.md)
- [README do frontend](Front/README.md)
