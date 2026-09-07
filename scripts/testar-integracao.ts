import { prisma } from '../lib/prisma'
import { gerarHashSenha } from '../src/utils/auth'

process.env.NODE_ENV = 'test'
process.env.PORT = process.env.TEST_PORT ?? '3101'
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'chave-temporaria-de-teste-nao-utilizar-em-producao'

const porta = Number(process.env.PORT)
const urlBase = `http://127.0.0.1:${porta}`
const sufixo = `teste-${Date.now()}`
const emails = {
  administrador: `admin-${sufixo}@teste.local`,
  cliente: `cliente-${sufixo}@teste.local`,
  prestador: `prestador-${sufixo}@teste.local`,
}

type Resposta = { status: number; corpo: any }

const verificar: (condicao: unknown, mensagem: string) => void = (condicao, mensagem) => {
  if (!condicao) throw new Error(mensagem)
}

const requisicao = async (caminho: string, opcoes: RequestInit = {}): Promise<Resposta> => {
  const resposta = await fetch(`${urlBase}${caminho}`, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', ...(opcoes.headers ?? {}) },
  })
  const tipoConteudo = resposta.headers.get('content-type') ?? ''
  const corpo = tipoConteudo.includes('application/json') ? await resposta.json() : undefined
  return { status: resposta.status, corpo }
}

const cabecalhoToken = (token: string) => ({ Authorization: `Bearer ${token}` })

async function main() {
  const { app } = await import('../src/server')
  const servidor = app.listen(porta)
  let categoriaUsadaId: number | undefined
  let categoriaRemovivelId: number | undefined

  try {
    await new Promise<void>((resolve, reject) => {
      servidor.once('listening', resolve)
      servidor.once('error', reject)
    })

    const administrador = await prisma.user.create({
      data: {
        name: 'Administrador de Teste',
        email: emails.administrador,
        password: await gerarHashSenha('senha-teste-123'),
        role: 'ADMIN',
      },
    })

    const loginAdmin = await requisicao('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: administrador.email, senha: 'senha-teste-123' }),
    })
    verificar(loginAdmin.status === 200, 'Login do administrador falhou.')
    const tokenAdmin = loginAdmin.corpo.token as string

    const categoriaUsada = await requisicao('/categories', {
      method: 'POST',
      headers: cabecalhoToken(tokenAdmin),
      body: JSON.stringify({ name: `Categoria ${sufixo}`, description: 'Categoria temporária para integração.' }),
    })
    verificar(categoriaUsada.status === 201, 'Criação de categoria pelo administrador falhou.')
    categoriaUsadaId = categoriaUsada.corpo.id

    const categoriaRemovivel = await requisicao('/categories', {
      method: 'POST',
      headers: cabecalhoToken(tokenAdmin),
      body: JSON.stringify({ name: `Removível ${sufixo}`, description: 'Categoria para testar edição e remoção.' }),
    })
    verificar(categoriaRemovivel.status === 201, 'Criação de categoria removível falhou.')
    categoriaRemovivelId = categoriaRemovivel.corpo.id

    const categoriaEditada = await requisicao(`/categories/${categoriaRemovivelId}`, {
      method: 'PUT',
      headers: cabecalhoToken(tokenAdmin),
      body: JSON.stringify({ name: `Editada ${sufixo}`, description: 'Categoria atualizada.' }),
    })
    verificar(categoriaEditada.status === 200, 'Edição de categoria falhou.')
    const categoriaExcluida = await requisicao(`/categories/${categoriaRemovivelId}`, {
      method: 'DELETE',
      headers: cabecalhoToken(tokenAdmin),
    })
    verificar(categoriaExcluida.status === 204, 'Exclusão de categoria falhou.')
    categoriaRemovivelId = undefined

    const cadastroCliente = await requisicao('/auth/client/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Cliente de Teste',
        email: emails.cliente,
        senha: 'senha-teste-123',
        telefone: '11999999999',
        endereco: 'Rua de Teste, 100',
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    })
    verificar(cadastroCliente.status === 201, 'Cadastro de cliente falhou.')
    const idCliente = cadastroCliente.corpo.usuario.id as string

    const cadastroPrestador = await requisicao('/auth/provider/register', {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Prestador de Teste',
        email: emails.prestador,
        senha: 'senha-teste-123',
        telefone: '11888888888',
        endereco: 'Avenida de Teste, 200',
        latitude: -23.551,
        longitude: -46.634,
        idCategoria: categoriaUsadaId,
      }),
    })
    verificar(cadastroPrestador.status === 201, 'Cadastro de prestador falhou.')
    const idPrestador = cadastroPrestador.corpo.prestador.id as string

    const aprovacao = await requisicao(`/admin/providers/${idPrestador}/approve`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenAdmin),
    })
    verificar(aprovacao.status === 200, 'Aprovação de prestador falhou.')

    const loginCliente = await requisicao('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emails.cliente, senha: 'senha-teste-123' }),
    })
    verificar(loginCliente.status === 200, 'Login do cliente falhou.')
    const tokenCliente = loginCliente.corpo.token as string

    const loginPrestador = await requisicao('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emails.prestador, senha: 'senha-teste-123' }),
    })
    verificar(loginPrestador.status === 200, 'Login do prestador falhou.')
    const tokenPrestador = loginPrestador.corpo.token as string

    const disponibilidade = await requisicao(`/providers/${idPrestador}/status`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenPrestador),
      body: JSON.stringify({ disponivel: true }),
    })
    verificar(disponibilidade.status === 200, 'Atualização de disponibilidade falhou.')

    const localizacao = await requisicao(`/providers/${idPrestador}/location`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenPrestador),
      body: JSON.stringify({ latitude: -23.551, longitude: -46.634 }),
    })
    verificar(localizacao.status === 200, 'Atualização de localização falhou.')

    const proximos = await requisicao(`/providers/nearby?categoryId=${categoriaUsadaId}&latitude=-23.5505&longitude=-46.6333`)
    verificar(proximos.status === 200 && proximos.corpo.some((item: { id: string }) => item.id === idPrestador), 'Matching não retornou o prestador.')

    const criacaoSolicitacao = await requisicao('/requests', {
      method: 'POST',
      headers: cabecalhoToken(tokenCliente),
      body: JSON.stringify({
        idCategoria: categoriaUsadaId,
        descricao: 'Preciso de atendimento de teste com urgência.',
        endereco: 'Rua de Teste, 100',
        latitude: -23.5505,
        longitude: -46.6333,
        tipoAtendimento: 'IMMEDIATE',
      }),
    })
    verificar(criacaoSolicitacao.status === 201, 'Criação de solicitação falhou.')
    const idSolicitacao = criacaoSolicitacao.corpo.solicitacao.id as number

    const aceite = await requisicao(`/requests/${idSolicitacao}/provider`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenPrestador),
    })
    verificar(aceite.status === 200, 'Aceite da solicitação falhou.')

    const inicio = await requisicao(`/requests/${idSolicitacao}/status`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenPrestador),
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    })
    verificar(inicio.status === 200, 'Início do atendimento falhou.')

    const valor = await requisicao(`/requests/${idSolicitacao}/value`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenPrestador),
      body: JSON.stringify({ valorFinal: 150 }),
    })
    verificar(valor.status === 200, 'Definição de valor final falhou.')

    const conclusao = await requisicao(`/requests/${idSolicitacao}/status`, {
      method: 'PATCH',
      headers: cabecalhoToken(tokenPrestador),
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    verificar(conclusao.status === 200, 'Conclusão do atendimento falhou.')

    const avaliacao = await requisicao('/reviews', {
      method: 'POST',
      headers: cabecalhoToken(tokenCliente),
      body: JSON.stringify({ idSolicitacao, nota: 5, comentario: 'Atendimento rápido e eficiente.' }),
    })
    verificar(avaliacao.status === 201, 'Criação da avaliação falhou.')

    const avaliacoes = await requisicao(`/providers/${idPrestador}/reviews`)
    verificar(avaliacoes.status === 200 && avaliacoes.corpo.avaliacoes.length === 1, 'Listagem de avaliações falhou.')

    const perfilCliente = await requisicao(`/clients/${idCliente}`, { headers: cabecalhoToken(tokenCliente) })
    verificar(perfilCliente.status === 200, 'Consulta de perfil do cliente falhou.')

    const atualizacaoCliente = await requisicao(`/clients/${idCliente}`, {
      method: 'PUT',
      headers: cabecalhoToken(tokenCliente),
      body: JSON.stringify({ telefone: '11777777777' }),
    })
    verificar(atualizacaoCliente.status === 200, 'Atualização de perfil do cliente falhou.')

    const dashboard = await requisicao('/admin/dashboard', { headers: cabecalhoToken(tokenAdmin) })
    verificar(dashboard.status === 200, 'Dashboard administrativo falhou.')

    console.log('Teste de integração concluído com sucesso.')
  } finally {
    await prisma.review.deleteMany({ where: { OR: [{ client: { email: emails.cliente } }, { provider: { user: { email: emails.prestador } } }] } })
    await prisma.serviceRequest.deleteMany({ where: { OR: [{ client: { email: emails.cliente } }, { provider: { user: { email: emails.prestador } } }] } })
    await prisma.providerProfile.deleteMany({ where: { user: { email: emails.prestador } } })
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } })
    await prisma.category.deleteMany({ where: { name: { contains: sufixo } } })
    await new Promise<void>((resolve, reject) => servidor.close((erro) => (erro ? reject(erro) : resolve())))
    await prisma.$disconnect()
  }
}

main().catch((erro) => {
  console.error('Teste de integração falhou:', erro)
  process.exitCode = 1
})
