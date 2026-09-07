import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requerAutenticacao } from '../middlewares/auth.middleware'
import { requerPerfil } from '../middlewares/perfil.middleware'

const rotas = Router()

const schemaIdUsuario = z.string().uuid('ID de usuário inválido.')
const schemaAtualizacaoCliente = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').optional(),
  telefone: z.string().min(8).max(30).nullable().optional(),
  endereco: z.string().min(5).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
})

const dadosPublicosCliente = (cliente: {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  latitude: unknown
  longitude: unknown
  createdAt: Date
  updatedAt: Date
}) => ({
  id: cliente.id,
  nome: cliente.name,
  email: cliente.email,
  telefone: cliente.phone,
  endereco: cliente.address,
  latitude: cliente.latitude,
  longitude: cliente.longitude,
  criadoEm: cliente.createdAt,
  atualizadoEm: cliente.updatedAt,
})

const validarAcessoCliente = (idCliente: string, idUsuario: string, perfil: string) =>
  perfil === 'ADMIN' || idCliente === idUsuario

rotas.get('/:id', requerAutenticacao, requerPerfil('CLIENT', 'ADMIN'), async (req, res) => {
  const validacaoId = schemaIdUsuario.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  if (!validarAcessoCliente(validacaoId.data, req.autenticacao!.idUsuario, req.autenticacao!.perfil)) {
    return res.status(403).json({ error: 'Você não tem permissão para acessar este perfil.' })
  }

  const cliente = await prisma.user.findFirst({
    where: { id: validacaoId.data, role: 'CLIENT' },
  })

  if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' })
  res.json({ cliente: dadosPublicosCliente(cliente) })
})

rotas.put('/:id', requerAutenticacao, requerPerfil('CLIENT', 'ADMIN'), async (req, res) => {
  const validacaoId = schemaIdUsuario.safeParse(req.params.id)
  if (!validacaoId.success) return res.status(400).json({ error: validacaoId.error.flatten() })

  if (!validarAcessoCliente(validacaoId.data, req.autenticacao!.idUsuario, req.autenticacao!.perfil)) {
    return res.status(403).json({ error: 'Você não tem permissão para editar este perfil.' })
  }

  const validacaoDados = schemaAtualizacaoCliente.safeParse(req.body)
  if (!validacaoDados.success) return res.status(400).json({ error: validacaoDados.error.flatten() })

  const clienteExistente = await prisma.user.findFirst({
    where: { id: validacaoId.data, role: 'CLIENT' },
  })
  if (!clienteExistente) return res.status(404).json({ error: 'Cliente não encontrado.' })

  const dados = validacaoDados.data
  const cliente = await prisma.user.update({
    where: { id: validacaoId.data },
    data: {
      ...(dados.nome !== undefined ? { name: dados.nome } : {}),
      ...(dados.telefone !== undefined ? { phone: dados.telefone } : {}),
      ...(dados.endereco !== undefined ? { address: dados.endereco } : {}),
      ...(dados.latitude !== undefined ? { latitude: dados.latitude } : {}),
      ...(dados.longitude !== undefined ? { longitude: dados.longitude } : {}),
    },
  })

  res.json({ cliente: dadosPublicosCliente(cliente) })
})

export default rotas
