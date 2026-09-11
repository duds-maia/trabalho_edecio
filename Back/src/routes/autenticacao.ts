import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { compararSenha, gerarHashSenha, gerarTokenAcesso } from '../utils/auth'

const rotas = Router()

const schemaDadosUsuario = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(8, 'Senha deve ter ao menos 8 caracteres.'),
  telefone: z.string().min(8).max(30).optional(),
  endereco: z.string().min(5).optional(),
})

const schemaCadastroPrestador = schemaDadosUsuario.extend({
  idCategoria: z.coerce.number().int().positive(),
})

const schemaLogin = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
})

const dadosPublicosUsuario = (usuario: {
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN'
}) => ({
  id: usuario.id,
  nome: usuario.name,
  email: usuario.email,
  perfil: usuario.role,
})

rotas.post('/client/register', async (req, res) => {
  const validacao = schemaDadosUsuario.safeParse(req.body)
  if (!validacao.success) return res.status(400).json({ error: validacao.error.flatten() })

  const { nome, email, senha, telefone, endereco } = validacao.data
  const emailNormalizado = email.toLowerCase()

  const usuarioExistente = await prisma.user.findUnique({ where: { email: emailNormalizado } })
  if (usuarioExistente) return res.status(409).json({ error: 'E-mail já cadastrado.' })

  const senhaProtegida = await gerarHashSenha(senha)
  const usuario = await prisma.user.create({
    data: {
      name: nome,
      email: emailNormalizado,
      password: senhaProtegida,
      phone: telefone,
      address: endereco,
      role: 'CLIENT',
    },
  })

  res.status(201).json({ usuario: dadosPublicosUsuario(usuario) })
})

rotas.post('/provider/register', async (req, res) => {
  const validacao = schemaCadastroPrestador.safeParse(req.body)
  if (!validacao.success) return res.status(400).json({ error: validacao.error.flatten() })

  const { nome, email, senha, telefone, endereco, idCategoria } = validacao.data
  const emailNormalizado = email.toLowerCase()

  const [usuarioExistente, categoria] = await Promise.all([
    prisma.user.findUnique({ where: { email: emailNormalizado } }),
    prisma.category.findUnique({ where: { id: idCategoria } }),
  ])

  if (usuarioExistente) return res.status(409).json({ error: 'E-mail já cadastrado.' })
  if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada.' })

  const senhaProtegida = await gerarHashSenha(senha)
  const prestador = await prisma.$transaction(async (transacao) => {
    const usuario = await transacao.user.create({
      data: {
        name: nome,
        email: emailNormalizado,
        password: senhaProtegida,
        phone: telefone,
        address: endereco,
        role: 'PROVIDER',
      },
    })

    return transacao.providerProfile.create({
      data: {
        userId: usuario.id,
        categoryId: idCategoria,
        address: endereco,
      },
      include: { user: true, category: true },
    })
  })

  res.status(201).json({
    usuario: dadosPublicosUsuario(prestador.user),
    prestador: {
      id: prestador.id,
      statusAprovacao: prestador.approvalStatus,
      categoria: prestador.category,
    },
  })
})

rotas.post('/login', async (req, res) => {
  const validacao = schemaLogin.safeParse(req.body)
  if (!validacao.success) return res.status(400).json({ error: validacao.error.flatten() })

  const emailNormalizado = validacao.data.email.toLowerCase()
  const usuario = await prisma.user.findUnique({
    where: { email: emailNormalizado },
    include: { provider: true },
  })

  if (!usuario || !(await compararSenha(validacao.data.senha, usuario.password))) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' })
  }

  const token = gerarTokenAcesso({ idUsuario: usuario.id, perfil: usuario.role })
  res.json({
    token,
    usuario: dadosPublicosUsuario(usuario),
    prestador: usuario.provider
      ? { id: usuario.provider.id, statusAprovacao: usuario.provider.approvalStatus }
      : undefined,
  })
})

export default rotas
