# Coleção Bruno - Me Socorre

Abra a pasta `bruno/Me Socorre` no Bruno e selecione o ambiente **Local**.

Antes de testar, preencha no ambiente:

- `tokenAdmin`, obtido em **Login Admin**;
- `tokenCliente`, obtido em **Login Cliente**;
- `tokenPrestador`, obtido em **Login Prestador**;
- `idPrestador`, retornado pelo cadastro do prestador;
- `idSolicitacao`, retornado ao criar a solicitação.

Execute as requisições pela sequência numérica. Para criar o administrador usado no login, configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `JWT_SECRET` no `.env`, depois execute `npm run db:seed`.

Na primeira versão, o cliente consulta `GET /providers?categoryId={id}` para ver os prestadores aprovados e disponíveis. Ao criar uma solicitação, deve enviar `idPrestador` junto com `idCategoria`; somente o prestador escolhido poderá visualizar e aceitar essa solicitação.
