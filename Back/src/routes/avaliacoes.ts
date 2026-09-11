import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requerAutenticacao } from '../middlewares/auth.middleware'
import { requerPerfil } from '../middlewares/perfil.middleware'

const rotas = Router()

const schemaAvaliacao = z.object({
  idSolicitacao: z.coerce.number().int().positive(),
  nota: z.coerce.number().int().min(1).max(5),
  comentario: z.string().min(3).max(1000).optional(),
})

rotas.post('/', requerAutenticacao, requerPerfil('CLIENT'), async (req, res) => {
  const validacao = schemaAvaliacao.safeParse(req.body)
  if (!validacao.success) return res.status(400).json({ error: validacao.error.flatten() })

  const solicitacao = await prisma.serviceRequest.findUnique({
    where: { id: validacao.data.idSolicitacao },
    include: { review: true },
  })

  if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada.' })
  if (solicitacao.clientId !== req.autenticacao!.idUsuario) {
    return res.status(403).json({ error: 'Você não pode avaliar esta solicitação.' })
  }
  if (solicitacao.status !== 'COMPLETED' || !solicitacao.providerId) {
    return res.status(409).json({ error: 'A solicitação precisa estar concluída para ser avaliada.' })
  }
  if (solicitacao.review) return res.status(409).json({ error: 'Esta solicitação já foi avaliada.' })

  const avaliacao = await prisma.$transaction(async (transacao) => {
    const novaAvaliacao = await transacao.review.create({
      data: {
        requestId: solicitacao.id,
        clientId: solicitacao.clientId,
        providerId: solicitacao.providerId!,
        rating: validacao.data.nota,
        comment: validacao.data.comentario,
      },
    })

    const medias = await transacao.review.aggregate({
      where: { providerId: solicitacao.providerId! },
      _avg: { rating: true },
    })
    await transacao.providerProfile.update({
      where: { id: solicitacao.providerId! },
      data: { ratingAverage: medias._avg.rating ?? 0 },
    })

    return novaAvaliacao
  })

  res.status(201).json({ avaliacao })
})

export default rotas
