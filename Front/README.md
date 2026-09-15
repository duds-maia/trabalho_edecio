# Me Socorre — Frontend

Frontend do marketplace de serviços locais Me Socorre, desenvolvido com React, TypeScript, Vite, Tailwind CSS e React Router.

O MVP possui catálogo público, autenticação e cadastro, fluxo completo de solicitações e avaliações para clientes, operação de atendimentos para prestadores e administração da plataforma.

## Como executar

O backend deve estar disponível em `http://localhost:3000`.

```bash
npm install
npm run dev
```

O frontend abre em `http://localhost:5173`. Durante o desenvolvimento, o Vite encaminha as chamadas de `/api` para o backend.

Para usar outra API, crie um arquivo `.env` a partir de `.env.example` e altere `VITE_API_URL`.

## Scripts

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: valida o TypeScript e gera a versão de produção.
- `npm run lint`: verifica a qualidade do código.
- `npm run preview`: abre localmente a versão gerada.

## Organização principal

- `src/components`: componentes compartilhados da interface.
- `src/contexts`: estado global, como a sessão do usuário.
- `src/pages`: páginas ligadas às rotas.
- `src/routes`: configuração de navegação e proteção de rotas.
- `src/services`: comunicação com a API.
- `src/types`: contratos TypeScript compartilhados.

## Áreas da aplicação

- Público: categorias, busca, prestadores, avaliações e resumo por IA.
- Cliente: perfil, criação e acompanhamento de solicitações, cancelamento e avaliação.
- Prestador: disponibilidade, perfil e ciclo completo do atendimento.
- Administrador: indicadores, moderação, clientes, solicitações, avaliações e categorias.
