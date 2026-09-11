import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requerAutenticacao } from '../middlewares/auth.middleware'
import { requerPerfil } from '../middlewares/perfil.middleware'

const rotas = Router()
const schemaIdCategoria = z.coerce.number().int().positive('ID de categoria inválido.')
const schemaCategoria = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})

rotas.get('/', async (_req, res) => {
  const categorias = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  res.json(categorias)
})

rotas.post('/', requerAutenticacao, requerPerfil('ADMIN'), async (req, res) => {
  const validacao = schemaCategoria.safeParse(req.body)
  if (!validacao.success) return res.status(400).json({ error: validacao.error.flatten() })

  const categoria = await prisma.category.create({ data: validacao.data })
  res.status(201).json(categoria)
})

rotas.put('/:id', requerAutenticacao, requerPerfil('ADMIN'), async (req, res) => {
  const validacaoId = schemaIdCategoria.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  const validacaoDados = schemaCategoria.safeParse(req.body)
  if (!validacaoDados.success) return res.status(400).json({ error: validacaoDados.error.flatten() })

  const categoriaExistente = await prisma.category.findUnique({ where: { id: validacaoId.data } })
  if (!categoriaExistente) return res.status(404).json({ error: 'Categoria não encontrada.' })

  const categoria = await prisma.category.update({
    where: { id: validacaoId.data },
    data: validacaoDados.data,
  })
  res.json(categoria)
})

rotas.delete('/:id', requerAutenticacao, requerPerfil('ADMIN'), async (req, res) => {
  const validacaoId = schemaIdCategoria.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  const categoriaExistente = await prisma.category.findUnique({ where: { id: validacaoId.data } })
  if (!categoriaExistente) return res.status(404).json({ error: 'Categoria não encontrada.' })

  const [quantidadePrestadores, quantidadeSolicitacoes] = await Promise.all([
    prisma.providerProfile.count({ where: { categoryId: validacaoId.data } }),
    prisma.serviceRequest.count({ where: { categoryId: validacaoId.data } }),
  ])

  if (quantidadePrestadores > 0 || quantidadeSolicitacoes > 0) {
    return res.status(409).json({
      error: 'Categoria não pode ser excluída porque possui prestadores ou solicitações vinculados.',
    })
  }

  await prisma.category.delete({ where: { id: validacaoId.data } })
  res.status(204).send()
})

export default rotas
