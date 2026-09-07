import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requerAutenticacao } from '../middlewares/auth.middleware'
import { requerPerfil } from '../middlewares/perfil.middleware'

const rotas = Router()

const schemaIdSolicitacao = z.coerce.number().int().positive('ID de solicitação inválido.')
const schemaCriacaoSolicitacao = z
  .object({
    idCategoria: z.coerce.number().int().positive(),
    descricao: z.string().min(10, 'Descrição deve ter ao menos 10 caracteres.'),
    endereco: z.string().min(5),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    tipoAtendimento: z.enum(['IMMEDIATE', 'SCHEDULED']).default('IMMEDIATE'),
    dataAgendamento: z.coerce.date().optional(),
    fotoUrl: z.string().url().optional(),
  })
  .superRefine((dados, contexto) => {
    if (dados.tipoAtendimento === 'SCHEDULED' && !dados.dataAgendamento) {
      contexto.addIssue({
        code: 'custom',
        path: ['dataAgendamento'],
        message: 'Data de agendamento é obrigatória para atendimento agendado.',
      })
    }

    if (dados.tipoAtendimento === 'IMMEDIATE' && dados.dataAgendamento) {
      contexto.addIssue({
        code: 'custom',
        path: ['dataAgendamento'],
        message: 'Atendimento imediato não deve possuir data de agendamento.',
      })
    }

    if (dados.dataAgendamento && dados.dataAgendamento <= new Date()) {
      contexto.addIssue({
        code: 'custom',
        path: ['dataAgendamento'],
        message: 'A data de agendamento deve estar no futuro.',
      })
    }
  })

const schemaAtualizacaoStatus = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})
const schemaValorFinal = z.object({
  valorFinal: z.coerce.number().positive(),
})
const schemaConsulta = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

const inclusaoSolicitacao = {
  category: true,
  client: { select: { id: true, name: true, phone: true } },
  provider: {
    include: {
      user: { select: { id: true, name: true, phone: true } },
      category: true,
    },
  },
}

const obterPrestadorDoUsuario = (idUsuario: string) =>
  prisma.providerProfile.findUnique({ where: { userId: idUsuario } })

rotas.post('/', requerAutenticacao, requerPerfil('CLIENT'), async (req, res) => {
  const validacao = schemaCriacaoSolicitacao.safeParse(req.body)
  if (!validacao.success) return res.status(400).json({ error: validacao.error.flatten() })

  const categoria = await prisma.category.findUnique({ where: { id: validacao.data.idCategoria } })
  if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada.' })

  const solicitacao = await prisma.serviceRequest.create({
    data: {
      clientId: req.autenticacao!.idUsuario,
      categoryId: validacao.data.idCategoria,
      description: validacao.data.descricao,
      address: validacao.data.endereco,
      latitude: validacao.data.latitude,
      longitude: validacao.data.longitude,
      serviceType: validacao.data.tipoAtendimento,
      scheduledAt: validacao.data.dataAgendamento,
      photoUrl: validacao.data.fotoUrl,
    },
    include: inclusaoSolicitacao,
  })

  res.status(201).json({ solicitacao })
})

rotas.get('/', requerAutenticacao, async (req, res) => {
  const validacaoConsulta = schemaConsulta.safeParse(req.query)
  if (!validacaoConsulta.success) return res.status(400).json({ error: validacaoConsulta.error.flatten() })

  const filtroStatus = validacaoConsulta.data.status ? { status: validacaoConsulta.data.status } : {}
  const perfil = req.autenticacao!.perfil
  let filtro: Record<string, unknown>

  if (perfil === 'CLIENT') {
    filtro = { clientId: req.autenticacao!.idUsuario, ...filtroStatus }
  } else if (perfil === 'PROVIDER') {
    const prestador = await obterPrestadorDoUsuario(req.autenticacao!.idUsuario)
    if (!prestador || prestador.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'Prestador não aprovado.' })
    }

    filtro = {
      ...filtroStatus,
      OR: [
        { providerId: prestador.id },
        { providerId: null, categoryId: prestador.categoryId, status: 'PENDING' },
      ],
    }
  } else {
    filtro = filtroStatus
  }

  const solicitacoes = await prisma.serviceRequest.findMany({
    where: filtro,
    include: inclusaoSolicitacao,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ solicitacoes })
})

rotas.get('/:id', requerAutenticacao, async (req, res) => {
  const validacaoId = schemaIdSolicitacao.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  const solicitacao = await prisma.serviceRequest.findUnique({
    where: { id: validacaoId.data },
    include: inclusaoSolicitacao,
  })
  if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada.' })

  const autenticacao = req.autenticacao!
  if (autenticacao.perfil === 'CLIENT' && solicitacao.clientId !== autenticacao.idUsuario) {
    return res.status(403).json({ error: 'Você não tem permissão para acessar esta solicitação.' })
  }

  if (autenticacao.perfil === 'PROVIDER') {
    const prestador = await obterPrestadorDoUsuario(autenticacao.idUsuario)
    const podeVisualizar =
      prestador &&
      prestador.approvalStatus === 'APPROVED' &&
      (solicitacao.providerId === prestador.id ||
        (solicitacao.providerId === null &&
          solicitacao.status === 'PENDING' &&
          solicitacao.categoryId === prestador.categoryId))

    if (!podeVisualizar) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar esta solicitação.' })
    }
  }

  res.json({ solicitacao })
})

rotas.patch('/:id/provider', requerAutenticacao, requerPerfil('PROVIDER'), async (req, res) => {
  const validacaoId = schemaIdSolicitacao.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  const prestador = await obterPrestadorDoUsuario(req.autenticacao!.idUsuario)
  if (!prestador || prestador.approvalStatus !== 'APPROVED' || !prestador.isAvailable) {
    return res.status(403).json({ error: 'Prestador precisa estar aprovado e disponível para aceitar solicitações.' })
  }

  const quantidadeAtualizada = await prisma.serviceRequest.updateMany({
    where: {
      id: validacaoId.data,
      categoryId: prestador.categoryId,
      providerId: null,
      status: 'PENDING',
    },
    data: { providerId: prestador.id, status: 'ACCEPTED' },
  })

  if (quantidadeAtualizada.count === 0) {
    return res.status(409).json({ error: 'Solicitação indisponível para aceite.' })
  }

  const solicitacao = await prisma.serviceRequest.findUnique({
    where: { id: validacaoId.data },
    include: inclusaoSolicitacao,
  })
  res.json({ solicitacao })
})

rotas.patch('/:id/status', requerAutenticacao, requerPerfil('CLIENT', 'PROVIDER', 'ADMIN'), async (req, res) => {
  const validacaoId = schemaIdSolicitacao.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  const validacaoDados = schemaAtualizacaoStatus.safeParse(req.body)
  if (!validacaoDados.success) return res.status(400).json({ error: validacaoDados.error.flatten() })

  const solicitacao = await prisma.serviceRequest.findUnique({ where: { id: validacaoId.data } })
  if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada.' })

  const autenticacao = req.autenticacao!
  if (autenticacao.perfil === 'CLIENT') {
    if (solicitacao.clientId !== autenticacao.idUsuario) {
      return res.status(403).json({ error: 'Você não tem permissão para alterar esta solicitação.' })
    }
    if (validacaoDados.data.status !== 'CANCELLED' || solicitacao.status !== 'PENDING') {
      return res.status(409).json({ error: 'Cliente pode cancelar apenas solicitações pendentes.' })
    }
  }

  if (autenticacao.perfil === 'PROVIDER') {
    const prestador = await obterPrestadorDoUsuario(autenticacao.idUsuario)
    if (!prestador || solicitacao.providerId !== prestador.id) {
      return res.status(403).json({ error: 'Você não tem permissão para alterar esta solicitação.' })
    }

    const transicaoValida =
      (solicitacao.status === 'ACCEPTED' && validacaoDados.data.status === 'IN_PROGRESS') ||
      (solicitacao.status === 'IN_PROGRESS' && validacaoDados.data.status === 'COMPLETED')

    if (!transicaoValida) {
      return res.status(409).json({ error: 'Transição de status inválida.' })
    }
  }

  const solicitacaoAtualizada = await prisma.serviceRequest.update({
    where: { id: solicitacao.id },
    data: { status: validacaoDados.data.status },
    include: inclusaoSolicitacao,
  })
  res.json({ solicitacao: solicitacaoAtualizada })
})

rotas.patch('/:id/value', requerAutenticacao, requerPerfil('PROVIDER', 'ADMIN'), async (req, res) => {
  const validacaoId = schemaIdSolicitacao.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  const validacaoDados = schemaValorFinal.safeParse(req.body)
  if (!validacaoDados.success) return res.status(400).json({ error: validacaoDados.error.flatten() })

  const solicitacao = await prisma.serviceRequest.findUnique({ where: { id: validacaoId.data } })
  if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada.' })

  if (req.autenticacao!.perfil === 'PROVIDER') {
    const prestador = await obterPrestadorDoUsuario(req.autenticacao!.idUsuario)
    const podeInformarValor =
      prestador &&
      solicitacao.providerId === prestador.id &&
      ['IN_PROGRESS', 'COMPLETED'].includes(solicitacao.status)

    if (!podeInformarValor) {
      return res.status(403).json({ error: 'Você não pode informar o valor desta solicitação.' })
    }
  }

  const solicitacaoAtualizada = await prisma.serviceRequest.update({
    where: { id: solicitacao.id },
    data: { finalPrice: validacaoDados.data.valorFinal },
    include: inclusaoSolicitacao,
  })
  res.json({ solicitacao: solicitacaoAtualizada })
})

export default rotas
